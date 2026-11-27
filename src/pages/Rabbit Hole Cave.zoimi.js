import { authentication } from 'wix-members-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { enterCave, chooseLootgrem, claimReward, claimCheckoutCode, getCaveLore, getJourneyStage, advanceJourney, forestEncounter } from 'backend/rabbitHole.web';
import { bindRabbitQuestionView } from 'public/rabbitQuestionBridge';
import { caveSnapshot } from 'public/rabbitCaveView';

$w.onReady(function () {
    let state = {};
    let journeyView = null;
    let dialogue;
    let currentNode = 'welcome';
    let shownChoices = new Set();
    let loreView = null;
    let loreCursor = 0;
    const render = status => {
        if (journeyView) { shownChoices = new Set(journeyView.choices.map(choice => choice.id)); return journeyView; }
        const snapshot = loreView ? {
            mode: 'cave', guardianKey: 'tanglebright', eyebrow: 'The Last Ember',
            progress: { current: 0, total: 3 }, question: loreView.prompt,
            hint: loreView.hint, fact: loreView.fact, choices: loreView.choices,
            meta: ['THE ALCHEMIST’S VAULT', 'NO REWARD CLAIMED'],
            status: status || { kind: 'ready', message: 'The offer waits while we talk.' }
        } : caveSnapshot(state, dialogue, status);
        if (!loreView && snapshot.status.kind === 'ready' && !state.lootgrem?.claimAuthorized) {
            snapshot.choices.push(
                { id: 'story-fact', label: 'One beautifully odd thing before the offer', action: 'dialogue' },
                { id: 'story-crew', label: 'Who keeps the shop running?', action: 'dialogue' },
                { id: 'story-guide', label: 'Explain the final choice', action: 'dialogue' }
            );
        }
        shownChoices = new Set(snapshot.choices.map(choice => choice.id));
        return snapshot;
    };
    const accept = result => {
        loreView = null;
        state = { ...state, ...result };
        currentNode = result.lootgrem?.node || result.next || currentNode;
        if (result.dialogue) dialogue = result.dialogue;
    };
    // Bind immediately so the hosted renderer's READY handshake is not lost
    // behind a login modal. Authentication is requested only by an explicit click.
    const questionView = bindRabbitQuestionView($w, {
        load: async () => {
            if (!(await authentication.loggedIn())) {
                shownChoices = new Set(['sign_in']);
                return {
                    mode: 'cave', guardianKey: 'tanglebright', question: 'Sign in to continue your saved hunt.',
                    progress: { current: 0, total: 3 }, hint: 'Signing in does not claim a reward.',
                    choices: [{ id: 'sign_in', label: 'Sign in', action: 'dialogue' }],
                    meta: ['MEMBER SIGN-IN REQUIRED', 'REWARDS DISABLED'],
                    status: { kind: 'ready', message: 'Your progress stays with your account.' }
                };
            }
            journeyView = await getJourneyStage('cave');
            if (journeyView.phase !== 'reward') return render();
            journeyView = null;
            const result = await enterCave();
            accept(result);
            return render();
        },
        submit: async action => {
            if (action.action !== 'dialogue' || !shownChoices.has(action.choiceId)) throw new Error('INVALID_DIALOGUE_CHOICE');
            if (journeyView) {
                if (['forest', 'tavern'].includes(action.choiceId)) {
                    wixLocationFrontend.to(action.choiceId === 'forest' ? '/rabbit-hole-forest' : '/grimroot-tavern');
                    return { journey: journeyView };
                }
                if (action.choiceId === 'approach') await forestEncounter('tanglebright', 'approach');
                else await advanceJourney('cave', action.choiceId);
                const journey = await getJourneyStage('cave');
                if (journey.phase === 'reward') return { journey: null, state: await enterCave() };
                return { journey };
            }
            if (action.choiceId === 'sign_in') {
                await authentication.promptLogin();
                return { state: await enterCave() };
            }
            if (action.choiceId === 'reload_cave') return { state: await enterCave() };
            if (action.choiceId === 'story-back') return { clearLore: true };
            if (['story-fact', 'story-crew', 'story-guide', 'story-another'].includes(action.choiceId)) {
                const branch = action.choiceId === 'story-crew' ? 'crew'
                    : action.choiceId === 'story-guide' ? 'guide' : 'fact';
                loreCursor = action.choiceId === 'story-another' ? loreCursor + 1 : 0;
                return { lore: await getCaveLore({ branch, cursor: loreCursor }) };
            }
            if (action.choiceId === 'postpone_reward') {
                // No backend write: the already-saved choice survives leaving/reloading.
                wixLocationFrontend.to('/');
                return { postponed: true };
            }
            if (action.choiceId === 'change_reward') return { state: await chooseLootgrem(currentNode, 'later') };
            if (action.choiceId === 'confirm_reward') {
                const result = state.rewardChoice === 'checkout_code' ? await claimCheckoutCode() : await claimReward();
                return { claim: result };
            }
            return { state: await chooseLootgrem(currentNode, action.choiceId) };
        },
        mapResult: result => {
            if (Object.prototype.hasOwnProperty.call(result, 'journey')) journeyView = result.journey;
            if (result.clearLore) loreView = null;
            if (result.lore) loreView = result.lore;
            if (result.state) accept(result.state);
            if (result.claim) {
                if (result.claim.status === 'disabled') return render({ kind: 'ready', message: 'Reward issuance is still disabled. Your choice is saved; no points or checkout code were issued.' });
                // A future enabling change must supply its own verified issuance UI.
                return render({ kind: 'locked', message: 'Check your member dashboard for the recorded reward status. Do not repeat this request.' });
            }
            return render();
        },
        mapError: error => {
            const message = String(error?.message || error || '');
            if (message.includes('CAVE_LOCKED')) return caveSnapshot({ caveUnlocked: false });
            if (message.includes('REWARD_CLAIM_IN_PROGRESS') || message.includes('REWARD_RECONCILIATION_REQUIRED')) {
                return render({ kind: 'locked', message: 'Please contact support before retrying this reward.' });
            }
            if (!state.caveUnlocked) {
                shownChoices = new Set(['sign_in']);
                return {
                    mode: 'cave', guardianKey: 'tanglebright', question: 'Your cave session could not be opened.',
                    choices: [{ id: 'sign_in', label: 'Sign in and retry', action: 'dialogue' }],
                    status: { kind: 'error', message: 'No reward was requested. You can sign in again or return later.' }
                };
            }
            // A mutation may have saved even if its response was lost. Never
            // replay it against stale dialogue; require authoritative readback.
            const snapshot = render({ kind: 'error', message: 'That action could not be confirmed. Reload saved progress before continuing; no automatic retry was made.' });
            snapshot.choices = [{ id: 'reload_cave', label: 'Reload saved cave progress', action: 'dialogue' }];
            shownChoices = new Set(['reload_cave']);
            return snapshot;
        }
    });
    authentication.onLogin(() => questionView.reload());
});
