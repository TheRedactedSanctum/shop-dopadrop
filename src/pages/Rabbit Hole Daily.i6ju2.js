import { authentication } from 'wix-members-frontend';
import { getDailyContent, solveDailyContent } from 'backend/rabbitHole.web';
import { bindRabbitDiscovery } from 'public/rabbitDiscovery';
import { bindRabbitQuestionView } from 'public/rabbitQuestionBridge';

$w.onReady(() => bindRabbitDiscovery($w));

let reloadDailyQuestion = async () => {};

$w.onReady(function () {
    let initialized = false;
    const initialize = () => {
        if (initialized) {
            reloadDailyQuestion();
            return;
        }
        initialized = true;

    let content;
    let entry;
    let choiceMap = new Map();

    const snapshot = (status) => {
        if (!entry) {
            return {
                mode: 'daily',
                eyebrow: 'The Omens Retreat',
                progress: { current: 0, total: 30 },
                question: 'The next forest chronicle has not been released yet.',
                hint: 'Return when the forest opens its next clue.',
                choices: [{ id: 'unreleased', label: 'Chronicle locked', action: 'answer' }],
                meta: ['DAY 0 OF 30', 'No points are awarded here'],
                status: { kind: 'locked', message: 'No daily question is available yet.' }
            };
        }
        const completed = content.completedDays.includes(entry.day);
        const canContinue = completed && entry.day < content.currentDay;
        return {
            mode: 'daily',
            eyebrow: `The Omens Retreat · Day ${entry.day} · ${entry.title}`,
            progress: { current: entry.day, total: 30 },
            question: entry.prompt,
            fact: completed ? entry.fact : null,
            hint: entry.teaser,
            choices: canContinue ? [{ id: 'next-clue', label: 'Next released clue', action: 'answer' }] : entry.choices.map((choice, index) => ({
                id: `choice-${index + 1}`,
                label: choice,
                action: 'answer'
            })),
            meta: [`DAY ${entry.day} OF 30`, 'No points are awarded here'],
            status: status || (completed
                ? { kind: canContinue ? 'ready' : 'completed', message: canContinue ? 'This clue is complete. Another released clue is waiting.' : 'Today\'s chronicle is complete.' }
                : { kind: 'ready', message: 'Choose one answer.' })
        };
    };

    const load = async () => {
        content = await getDailyContent();
        entry = content?.entry || null;
        choiceMap = new Map((entry?.choices || []).map((choice, index) => [`choice-${index + 1}`, choice]));
        return snapshot();
    };

    const questionView = bindRabbitQuestionView($w, {
        load,
        submit: async action => {
            if (action.action === 'answer' && action.choiceId === 'next-clue'
                && content.completedDays.includes(entry.day) && entry.day < content.currentDay) {
                return { nextContent: await getDailyContent() };
            }
            const answer = choiceMap.get(action.choiceId);
            if (action.action !== 'answer' || !answer || !entry) throw new Error('INVALID_DAILY_CHOICE');
            return solveDailyContent(entry.day, answer);
        },
        mapResult: result => {
            if (result.nextContent) {
                content = result.nextContent;
                entry = content?.entry || null;
                choiceMap = new Map((entry?.choices || []).map((choice, index) => [`choice-${index + 1}`, choice]));
                return snapshot();
            }
            if (result.correct && !content.completedDays.includes(entry.day)) content.completedDays.push(entry.day);
            return snapshot(result.correct
            ? { kind: entry.day < content.currentDay ? 'ready' : 'completed', message: 'Correct. This forest chronicle is complete.' }
            : { kind: 'incorrect', message: `Not this time. ${result.attemptsRemaining} attempts remain.` });
        },
        mapError: error => {
            const message = String(error?.message || error || '');
            const limited = message.match(/DAILY_ATTEMPT_LIMITED:(\d+)/);
            if (limited) return snapshot({
                kind: 'limited',
                message: `The forest needs a pause. Try again in ${limited[1]} seconds.`
            });
            return snapshot({ kind: 'error', message: 'The chronicle could not be checked. Please try again.' });
        }
    });
    reloadDailyQuestion = questionView.reload;
    };
    // Do not await the login modal from onReady, and continue after login.
    authentication.onLogin(initialize);
    if (authentication.loggedIn()) initialize();
    else authentication.promptLogin().then(initialize).catch(() => {
        // The discovery button and shared member gem can retry a cancelled login.
    });
});

