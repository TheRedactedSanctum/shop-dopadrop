import wixLocationFrontend from 'wix-location-frontend';
import { authentication } from 'wix-members-frontend';
import { forestEncounter, getForestContent } from 'backend/rabbitHole.web';
import { bindRabbitDiscovery } from 'public/rabbitDiscovery';
import { bindRabbitQuestionView } from 'public/rabbitQuestionBridge';

let reloadForestQuestion = async () => {};

$w.onReady(() => bindRabbitDiscovery($w, {
    onFound: () => reloadForestQuestion()
}));

$w.onReady(function () {
    let initialized = false;
    const initialize = () => {
        if (initialized) {
            reloadForestQuestion();
            return;
        }
        initialized = true;

    const context = extra => ({ ...extra, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    let stage;
    let choiceMap = new Map();

    const snapshot = (view, status) => {
        if (!view) {
            console.error('FOREST_VIEW_UNAVAILABLE');
            return {
                mode: 'forest',
                eyebrow: 'The Grinning Wrongwoods',
                progress: { current: 0, total: 4 },
                question: 'The guardian path is temporarily unavailable.',
                hint: 'Reload this page to try the forest again.',
                choices: [],
                meta: ['NO POINTS AWARDED'],
                status: { kind: 'locked', message: 'The forest could not load safely.' }
            };
        }
        stage = view;
        choiceMap = new Map((view.choices || []).map(choice => [choice.id, choice]));
        const guardianNumber = view.guardian?.ordinal || Math.min(view.progress.current + 1, view.progress.total);
        return {
            mode: 'forest',
            guardianKey: view.guardian?.id || '',
            eyebrow: view.guardian ? `The Grinning Wrongwoods · Guardian ${guardianNumber} · ${view.guardian.label}` : 'The Grinning Wrongwoods',
            progress: view.progress,
            question: view.prompt,
            fact: view.fact,
            hint: view.hint || (view.guardian
                ? `${view.guardian.difficulty} path · unlocks at ${view.guardian.threshold} discoveries`
                : 'Every guardian has answered.'),
            choices: (view.choices || []).map(choice => ({
                id: choice.id,
                label: choice.label,
                action: 'encounter'
            })),
            meta: [`${view.progress.current} OF ${view.progress.total} COMPLETE`, 'NO POINTS AWARDED'],
            status: status || (view.completed
                ? { kind: 'completed', message: 'All four guardians have opened the cave path.' }
                : view.locked
                    ? { kind: 'locked', message: 'Keep discovering hidden buttons to unlock this guardian.' }
                    : { kind: 'ready', message: 'Stay for a conversation, or choose the guardian action.' })
        };
    };

    const load = async () => snapshot(await getForestContent(context()));

    const questionView = bindRabbitQuestionView($w, {
        load,
        submit: async action => {
            const choice = choiceMap.get(action.choiceId);
            if (action.action !== 'encounter' || !choice) throw new Error('INVALID_FOREST_CHOICE');
            if (choice.kind === 'travel') { wixLocationFrontend.to(choice.route); return { browsing: true, next: stage }; }
            if (choice.kind === 'story') return {
                browsing: true,
                next: await getForestContent(context({ guardianKey: choice.guardianKey, branch: choice.branch, cursor: choice.cursor }))
            };
            try {
                const outcome = await forestEncounter(choice.characterId, choice.actionId, context());
                return { outcome, next: await getForestContent(context()) };
            } catch (error) {
                const message = String(error?.message || error || '');
                if (message.includes('FOREST_PREDECESSOR_REQUIRED') || message.includes('FOREST_STAGE_LOCKED') || message.includes('FOREST_TIME_LOCKED')) {
                    return { stale: true, next: await getForestContent(context()) };
                }
                throw error;
            }
        },
        mapResult: result => snapshot(result.next, result.browsing
            ? { kind: 'ready', message: 'Take your time. Your saved progress has not changed.' }
            : result.next.journeyComplete
                ? { kind: 'ready', message: 'All four guardians have answered. You can revisit their conversations.' }
            : result.next.completed
            ? { kind: 'completed', message: 'All four guardians have opened the cave path.' }
            : result.next.locked
                ? { kind: 'locked', message: result.stale
                    ? 'The forest path changed. Keep discovering hidden buttons to unlock this guardian.'
                    : `${result.outcome.dialogue} Keep discovering hidden buttons to unlock the next guardian.` }
                : result.stale
                    ? { kind: 'error', message: 'The forest path changed. The current guardian has been restored.' }
                    : { kind: 'correct', message: result.outcome.dialogue }),
        mapError: () => snapshot(stage, {
            kind: 'error',
            message: 'The guardian could not hear that choice. Please try again.'
        })
    });
    reloadForestQuestion = questionView.reload;
    // Re-check local day/night while the forest stays open.
    setInterval(() => questionView.reload(), 60000);
    };
    // Do not await the login modal from onReady, and continue after login.
    authentication.onLogin(initialize);
    if (authentication.loggedIn()) initialize();
    else authentication.promptLogin().then(initialize).catch(() => {
        // The discovery button and shared member gem can retry a cancelled login.
    });
});

