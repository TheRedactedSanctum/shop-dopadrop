export const QUESTION_VIEW_URL = 'https://theredactedsanctum.github.io/shop-dopadrop/rabbit-question.html?v=grimroot-names-20261127';

const ACTIONS = new Set(['answer', 'encounter', 'dialogue']);
const IDENTIFIER = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

function safeAction(data) {
    if (!data || data.type !== 'RABBIT_QUESTION_ACTION') return null;
    const requestId = String(data.requestId || '');
    const action = String(data.action || '');
    const choiceId = String(data.choiceId || '');
    if (!IDENTIFIER.test(requestId) || !ACTIONS.has(action) || !IDENTIFIER.test(choiceId)) return null;
    return { requestId, action, choiceId };
}

export function bindRabbitQuestionView($w, options = {}) {
    let view;
    try {
        view = $w('#rabbitQuestionView');
    } catch (error) {
        throw new Error('Missing required Wix HTML Component #rabbitQuestionView');
    }
    if (!view || typeof view.onMessage !== 'function' || typeof view.postMessage !== 'function') {
        throw new Error('Missing required Wix HTML Component #rabbitQuestionView');
    }
    if (![options.load, options.submit, options.mapResult, options.mapError].every(value => typeof value === 'function')) {
        throw new Error('Rabbit question bridge callbacks are required');
    }
    // The hosted scene owns its heading. Old narrow native text otherwise
    // sits on top of the question and choices after the renderer loads.
    let nativeText = [];
    try { nativeText = $w('Text'); } catch (_) { /* no native text on this page */ }
    if (Array.isArray(nativeText)) nativeText.forEach(element => {
        const text = (element.text || '').trim();
        if (/^THE (?:RABBIT HOLE|GRIMROOT TRIALS)\s*[—-]/i.test(text)
            || ['The Grinning Wrongwoods', 'The Omen Ledger', 'The Last Ember'].includes(text)
            || text === 'The cave is sealed until all 50 hidden forest buttons are found.') element.collapse();
    });
    for (const id of ['#lootgremWho', '#lootgremReward', '#lootgremClaim', '#dailyAnswer', '#mothkeeperWait', '#rootwhisperProtect']) {
        try {
            const legacy = $w(id);
            if (typeof legacy?.collapse === 'function') legacy.collapse();
        } catch (_) { /* obsolete control is absent */ }
    }

    const seenRequests = new Set();
    let ready = false;
    let inFlight = false;
    let reloadRequested = false;
    view.src = QUESTION_VIEW_URL;

    const post = (type, requestId, payload) => view.postMessage({ type, requestId, payload });
    const load = async () => {
        try {
            post('RABBIT_QUESTION_RENDER', 'load-1', await options.load());
        } catch (error) {
            post('RABBIT_QUESTION_RENDER', 'load-1', options.mapError(error, null));
        }
    };
    const reload = async () => {
        if (inFlight) {
            reloadRequested = true;
            return;
        }
        await load();
    };

    view.onMessage(async event => {
        const data = event?.data;
        if (data?.type === 'RABBIT_QUESTION_READY') {
            if (ready) return;
            ready = true;
            await reload();
            return;
        }

        const action = safeAction(data);
        if (!ready || inFlight || !action || seenRequests.has(action.requestId)) return;
        seenRequests.add(action.requestId);
        inFlight = true;
        try {
            const result = await options.submit(action);
            post('RABBIT_QUESTION_RESULT', action.requestId, options.mapResult(result, action));
        } catch (error) {
            post('RABBIT_QUESTION_RESULT', action.requestId, options.mapError(error, action));
        } finally {
            inFlight = false;
            if (reloadRequested) {
                reloadRequested = false;
                await load();
            }
        }
    });

    return { reload };
}
