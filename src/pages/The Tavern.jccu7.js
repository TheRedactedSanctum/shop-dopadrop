import { authentication } from 'wix-members-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { getJourneyStage, advanceJourney } from 'backend/rabbitHole.web';
import { bindRabbitQuestionView } from 'public/rabbitQuestionBridge';
$w.onReady(() => {
    // Copied layout contains hunt marks belonging only to the Forest page.
    try { $w('Button').forEach(button => { if (button.label === 'Start Now') button.collapse(); }); } catch (_) { /* absent */ }
    const view = bindRabbitQuestionView($w, {
        load: () => getJourneyStage('tavern'),
        submit: async ({ choiceId }) => {
            const routes = { forest: '/rabbit-hole-forest', cave: '/rabbit-hole-cave' };
            if (routes[choiceId]) { wixLocationFrontend.to(routes[choiceId]); return getJourneyStage('tavern'); }
            if (choiceId !== 'rest') throw new Error('INVALID_TAVERN_CHOICE');
            return advanceJourney('tavern', choiceId);
        },
        mapResult: result => result,
        mapError: () => ({ mode: 'daily', eyebrow: 'The Tavern', question: 'The hearth is waiting for your saved journey.', hint: 'Sign in, or reload to try again.', choices: [], status: { kind: 'locked', message: 'Your journey could not be loaded.' } })
    });
    authentication.onLogin(() => view.reload());
    if (!authentication.loggedIn()) authentication.promptLogin().then(() => view.reload()).catch(() => {});
});
