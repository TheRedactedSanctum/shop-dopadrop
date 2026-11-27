import { authentication } from 'wix-members-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { getDailyContent } from 'backend/rabbitHole.web';
import { bindRabbitDiscovery } from 'public/rabbitDiscovery';
import { bindRabbitQuestionView } from 'public/rabbitQuestionBridge';

$w.onReady(() => {
    bindRabbitDiscovery($w); // Discovery 46 retains its original identity and route.
    let view;
    const initialize = () => {
    if (view) { view.reload(); return; }
    view = bindRabbitQuestionView($w, {
        load: () => getDailyContent(),
        submit: async ({ choiceId }) => {
            const routes = { forest: '/rabbit-hole-forest', tavern: '/grimroot-tavern', cave: '/rabbit-hole-cave' };
            if (!routes[choiceId]) throw new Error('INVALID_TRAIL_CHOICE');
            wixLocationFrontend.to(routes[choiceId]);
            return getDailyContent();
        },
        mapResult: result => result,
        mapError: () => ({ mode: 'forest', eyebrow: 'The Omens Retreat', question: 'Sign in to continue your saved trail.', choices: [], status: { kind: 'locked', message: 'Reload or sign in to reopen this junction.' } })
    });
    };
    authentication.onLogin(initialize);
    if (authentication.loggedIn()) initialize();
    else authentication.promptLogin().then(initialize).catch(() => {});
});
