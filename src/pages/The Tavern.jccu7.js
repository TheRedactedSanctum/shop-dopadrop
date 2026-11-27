import { authentication } from 'wix-members-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { getTavernContent, useTavern } from 'backend/rabbitHole.web';
import { bindRabbitQuestionView } from 'public/rabbitQuestionBridge';

$w.onReady(() => {
    try { $w('Button').forEach(button => { if (button.label === 'Start Now') button.collapse(); }); } catch (_) { /* absent */ }
    let current;
    let shown = new Set();
    const accept = result => { current = result; shown = new Set((result.choices || []).map(choice => choice.id)); return result; };
    const readBranches = new Set(['hub', 'recap', 'journal', 'map', 'keepsakes', 'stories', 'tale-0', 'tale-1', 'tale-2', 'tale-3', 'brews', 'quiet']);
    const view = bindRabbitQuestionView($w, {
        load: async () => accept(await getTavernContent()),
        submit: async ({ action, choiceId, value, revision }) => {
            if (action !== 'dialogue' || !shown.has(choiceId)) throw new Error('INVALID_TAVERN_CHOICE');
            if (readBranches.has(choiceId)) return getTavernContent(choiceId);
            if (choiceId === 'forest') { wixLocationFrontend.to('/rabbit-hole-forest'); return current; }
            const result = await useTavern(choiceId, { value, revision });
            if (result.route) { wixLocationFrontend.to(result.route); return current; }
            return result;
        },
        mapResult: accept,
        mapError: error => {
            const message = String(error?.message || error || '');
            if (current) return { ...current, status: { kind: 'error', message: message.includes('JOURNAL_CHANGED') ? 'These notes changed in another tab. Copy your draft before reloading the saved journal.' : 'That save could not be confirmed. Your draft is kept here; try again or reload saved progress.' } };
            return { mode: 'tavern', eyebrow: 'The Tavern', question: 'The hearth is waiting for your saved journey.', hint: 'Sign in, or reload to try again.', choices: [], status: { kind: 'locked', message: 'Your journey could not be loaded.' } };
        }
    });
    authentication.onLogin(() => view.reload());
    if (!authentication.loggedIn()) authentication.promptLogin().then(() => view.reload()).catch(() => {});
});
