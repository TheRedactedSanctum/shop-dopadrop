const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { IMPORTED_FACTS, WHISPER_FACTS, TOPIC_INDEX, isWhisperEligible, availableDailyDay } = require('../src/backend/encounterVault.js');
const { CREW, FACT_POOLS, buildForestDialogue, buildCaveLore } = require('../src/backend/encounterDialogue.js');
const { buildQuestionView } = require('../src/public/rabbitQuestionView.js');

const sequence = ['mothkeeper:wait', 'rootwhisper:protect', 'grumblebark:listen', 'tanglebright:approach'];
const keys = ['mothkeeper', 'rootwhisper', 'grumblebark', 'tanglebright'];
const state = (foundCount, encounters = []) => ({ foundCount, forestState: { encounters } });

test('late arrivals receive their first unfinished released riddle, without skipping or exposing future days', () => {
    assert.equal(availableDailyDay(29, []), 1);
    assert.equal(availableDailyDay(29, Array.from({ length: 28 }, (_, i) => i + 1)), 29);
    assert.equal(availableDailyDay(29, Array.from({ length: 29 }, (_, i) => i + 1)), 29);
    assert.equal(availableDailyDay(0, []), null);
    assert.equal(availableDailyDay(35, Array.from({ length: 29 }, (_, i) => i + 1)), 30);
});

test('the supplied vault preserves facts, topic metadata and its learning-only boundary', () => {
    assert.equal(IMPORTED_FACTS.length, 253);
    assert.equal(TOPIC_INDEX.length, 289);
    assert.equal(WHISPER_FACTS.length, 190);
    assert.equal(IMPORTED_FACTS.filter(fact => !isWhisperEligible(fact)).length, 63);
    assert.equal(new Set(WHISPER_FACTS.map(fact => fact.id)).size, 190);
    const example = WHISPER_FACTS[0];
    for (const change of [{ eligible: false }, { lane: 'learn' }, { reviewStatus: 'unverified' }, { text: '' }, { source: { url: 'javascript:alert(1)' } }, { source: { url: 'https://user:password@example.com' } }]) {
        assert.equal(isWhisperEligible({ ...example, ...change }), false);
    }
});

test('every eligible oddity has one guardian and every supplied specialist has a crew conversation', () => {
    const assigned = Object.values(FACT_POOLS).flat().map(fact => fact.id);
    assert.equal(assigned.length, 190);
    assert.equal(new Set(assigned).size, 190);
    assert.equal(Object.values(CREW).flat().length, 17);
    for (const key of keys) assert.ok(FACT_POOLS[key].length > 0);
    assert.deepEqual(Object.values(CREW).flat().map(([name]) => name).sort(), [
        'Blaze', 'Casey', 'Dex', 'Flynn', 'Harper', 'Indi', 'Jade', 'Morgan', 'Nova',
        'Pixel', 'Posie', 'Reeve', 'Remi', 'River', 'Sable', 'Sage', 'The Alchemist'
    ].sort());
});

test('story requests cannot bypass a guardian milestone or a canonical encounter', () => {
    for (const request of [{}, { guardianKey: 'tanglebright', branch: 'fact' }, { guardianKey: 'grumblebark', branch: 'crew' }]) {
        const view = buildForestDialogue(state(19), request);
        assert.equal(view.locked, true);
        assert.equal(view.guardian.id, 'mothkeeper');
        assert.deepEqual(view.choices, []);
        assert.equal(view.fact, undefined);
    }
    const view = buildForestDialogue(state(20), { guardianKey: 'tanglebright', branch: 'fact' });
    assert.equal(view.guardian.id, 'mothkeeper');
    assert.ok(FACT_POOLS.mothkeeper.some(fact => fact.id === view.fact.id));
});

test('each unlocked guardian has sourced read-only branches and one canonical next action', () => {
    for (let index = 0; index < keys.length; index += 1) {
        const member = state(50, sequence.slice(0, index));
        const before = JSON.stringify(member);
        const entry = buildForestDialogue(member);
        assert.equal(entry.guardian.id, keys[index]);
        const canonical = entry.choices.filter(choice => choice.kind === 'encounter');
        assert.equal(canonical.length, 1);
        assert.equal(`${canonical[0].characterId}:${canonical[0].actionId}`, sequence[index]);
        for (const branch of ['fact', 'crew', 'guide']) {
            const view = buildForestDialogue(member, { guardianKey: keys[index], branch, cursor: 999 });
            assert.equal(view.choices.some(choice => choice.kind === 'encounter'), false);
            if (branch === 'fact') assert.match(view.fact.sourceUrl, /^https:\/\//);
        }
        assert.equal(JSON.stringify(member), before);
    }
});

test('finished guardians can be revisited without advancing or resetting progress', () => {
    const member = state(50, sequence);
    const before = JSON.stringify(member);
    for (let index = 0; index < keys.length; index += 1) {
        const view = buildForestDialogue(member, { guardianKey: keys[index], branch: 'entry' });
        assert.equal(view.guardian.id, keys[index]);
        assert.equal(view.guardian.ordinal, index + 1);
        assert.equal(view.progress.current, 4);
        assert.equal(view.choices.some(choice => choice.kind === 'encounter'), false);
        assert.equal(view.locked, false);
    }
    assert.equal(JSON.stringify(member), before);
});

test('a completed conversation remains available while the next guardian is locked', () => {
    const member = state(20, sequence.slice(0, 1));
    const hub = buildForestDialogue(member);
    assert.equal(hub.nextGuardianLocked, true);
    assert.equal(hub.choices.length, 1);
    assert.equal(hub.choices[0].guardianKey, 'mothkeeper');
    assert.equal(hub.choices.some(choice => choice.kind === 'encounter'), false);
    const revisit = buildForestDialogue(member, { guardianKey: 'mothkeeper', branch: 'fact' });
    assert.equal(revisit.guardian.id, 'mothkeeper');
    assert.ok(revisit.fact);
});

test('cave lore checks eligibility and never changes a saved reward choice', () => {
    assert.throws(() => buildCaveLore(state(49)), /CAVE_LOCKED/);
    const member = { ...state(50, sequence), rewardChoice: 'checkout_code', rewardStatus: 'eligible', lootgremState: { node: 'reward', claimAuthorized: true } };
    const before = JSON.stringify(member);
    const view = buildCaveLore(member, { branch: 'fact', cursor: 0 });
    assert.ok(view.fact);
    assert.equal(view.choices.some(choice => /claim|confirm_reward/.test(choice.id)), false);
    assert.equal(JSON.stringify(member), before);
});

test('the renderer keeps citations as text and accepts only credential-free HTTPS links', () => {
    const snapshot = { mode: 'forest', question: 'A sourced oddity', choices: [{ id: 'back', action: 'encounter', label: 'Back' }], fact: { id: 'test', text: '<img src=x onerror=alert(1)>', sourceTitle: 'A source', sourceUrl: 'https://example.com/research' } };
    const view = buildQuestionView(snapshot);
    assert.equal(view.fact.text, snapshot.fact.text);
    for (const url of ['javascript:alert(1)', 'http://example.com', '//example.com', 'https://name:secret@example.com']) {
        assert.equal(buildQuestionView({ ...snapshot, fact: { ...snapshot.fact, sourceUrl: url } }).fact, null);
    }
});

test('Daily reveals the source after solving and advances released clues through a read, not a second answer', async () => {
    const ready = [];
    let options;
    let answers = 0;
    let complete = false;
    const fact = { id: 'test', text: 'An oddity', sourceTitle: 'A source', sourceUrl: 'https://example.com' };
    const $w = { onReady(fn) { ready.push(fn); } };
    const context = {
        $w,
        authentication: { loggedIn: () => true, onLogin() {} },
        bindRabbitDiscovery() {},
        bindRabbitQuestionView(_w, value) { options = value; return { reload() {} }; },
        getDailyContent: async () => ({ currentDay: 29, completedDays: complete ? [1] : [], entry: { day: complete ? 2 : 1, title: 'Clue', prompt: 'A question', teaser: 'A hint', choices: ['yes', 'no', 'maybe'], fact } }),
        solveDailyContent: async () => { answers += 1; complete = true; return { correct: true }; }
    };
    const source = fs.readFileSync(path.join(__dirname, '../src/pages/Rabbit Hole Daily.i6ju2.js'), 'utf8').replace(/^import .*;\r?\n/gm, '');
    vm.runInNewContext(source, context);
    ready.forEach(fn => fn());
    assert.equal((await options.load()).fact, null);
    const solved = options.mapResult(await options.submit({ action: 'answer', choiceId: 'choice-1' }));
    assert.equal(solved.fact.id, 'test');
    assert.equal(solved.status.kind, 'ready');
    assert.equal(solved.choices[0].id, 'next-clue');
    const next = options.mapResult(await options.submit({ action: 'answer', choiceId: 'next-clue' }));
    assert.equal(next.progress.current, 2);
    assert.equal(next.fact, null);
    assert.equal(answers, 1);
});
