const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const content = require('../src/backend/rabbitContent.js');
const details = require('../src/backend/rabbitState.js');
const core = { ...content, ...details };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/backend/rabbitCore.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export function /g, 'function ') + '\nthis.api={normaliseState,publicState};', core);
const { normaliseState, publicState } = core.api;
const { tavernSnapshot, applyTavernAction, tavernDestination } = require('../src/backend/rabbitTavern.js');
const { keeperForRiddle, characterRiddleView, answerCharacterRiddle, nextCharacterRiddle } = require('../src/backend/rabbitCharacterRiddles.js');
const { DAILY_CONTENT } = require('../src/backend/rabbitContent.js');
const { buildQuestionView, normaliseActionMessage } = require('../src/public/rabbitQuestionView.js');
const prelude = ['mothkeeper:wait', 'rootwhisper:protect', 'grumblebark:listen'];
const now = new Date('2026-11-27T01:00:00Z');
const request = { timeZone: 'Australia/Sydney' };
const member = (found = 50, encounters = prelude) => normaliseState({ foundIds: Array.from({ length: found }, (_, i) => i + 1), forestState: { encounters, fragments: [] } });

test('tavern reads stay pure and every hub feature renders through the safe contract', () => {
    const state = member(); const before = JSON.stringify(state);
    for (const branch of ['hub', 'recap', 'journal', 'map', 'keepsakes', 'stories', 'tale-0', 'tale-1', 'tale-2', 'tale-3', 'brews', 'quiet']) {
        const view = tavernSnapshot(state, branch);
        assert.equal(buildQuestionView(view).valid, true, branch);
        assert.equal(view.choices.some(choice => choice.action === 'answer'), false);
    }
    assert.equal(JSON.stringify(state), before);
    assert.equal(tavernSnapshot(state).choices.length, 9);
    const newcomer = member(0, []);
    assert.equal(tavernSnapshot(newcomer).choices.length, 9);
    applyTavernAction(newcomer, 'rest', {}, now);
    assert.equal(newcomer.forestState.tavern.checkpointAt, now.toISOString());
    assert.equal(newcomer.forestState.fragments.includes('journey:tavern'), false);
    assert.equal(tavernDestination(newcomer, 'resume'), '/');
});

test('a confirmed rest is durable and idempotent without collecting discoveries or changing rewards', () => {
    const state = member(43); const ids = [...state.foundIds]; const reward = state.rewardStatus;
    assert.equal(tavernDestination(state, 'resume'), null);
    applyTavernAction(state, 'rest', {}, now); applyTavernAction(state, 'rest', {}, now);
    const restored = normaliseState(JSON.parse(JSON.stringify(state)));
    assert.equal(restored.forestState.tavern.checkpointAt, now.toISOString());
    assert.equal(restored.forestState.fragments.filter(x => x === 'journey:tavern').length, 1);
    assert.deepEqual(Array.from(restored.foundIds), ids); assert.equal(restored.rewardStatus, reward);
    assert.equal(tavernDestination(restored, 'resume'), '/accessibility-statement');
    assert.equal(tavernSnapshot(restored).checkpointAt, now.toISOString());
});

test('journal saves remain member-specific, bounded, replay-safe and reject stale edits', () => {
    const a = member(); const b = member();
    const input = { value: '<script>just literal personal notes</script>', revision: 0 };
    applyTavernAction(a, 'save-notes', input); applyTavernAction(a, 'save-notes', input);
    assert.equal(a.forestState.tavern.revision, 1);
    assert.equal(b.forestState.tavern.notes, '');
    const view = buildQuestionView(tavernSnapshot(normaliseState(a), 'journal'));
    assert.equal(view.editor.value, input.value);
    assert.throws(() => applyTavernAction(a, 'save-notes', { value: 'stale', revision: 0 }), /JOURNAL_CHANGED/);
    assert.throws(() => applyTavernAction(a, 'save-notes', { value: 'x'.repeat(1501), revision: 1 }), /INPUT_INVALID/);
    applyTavernAction(a, 'quiet-on'); applyTavernAction(a, 'brew-1');
    assert.equal(normaliseState(a).forestState.tavern.quiet, true);
    assert.equal(tavernSnapshot(a, 'brews').hint.includes('Confetti cocoa'), true);
});

test('all 30 original riddles have exactly one keeper and character views never expose the correct answer field', () => {
    const ownership = new Map();
    for (const day of DAILY_CONTENT) ownership.set(day.day, keeperForRiddle(day.day));
    assert.equal(ownership.size, 30);
    assert.deepEqual([...new Set(ownership.values())], ['mothkeeper', 'rootwhisper', 'grumblebark', 'tanglebright']);
    assert.equal(keeperForRiddle(0), null); assert.equal(keeperForRiddle('1'), null);
    const state = member(); state.forestState.fragments.push('journey:tavern', 'journey:catacombs');
    for (const key of new Set(ownership.values())) {
        const context = key === 'rootwhisper' ? { timeZone: 'Europe/London' } : request;
        const view = characterRiddleView(state, key, context, now);
        assert.equal(view.choices.filter(choice => choice.kind === 'riddle').length, 3);
        assert.equal(Object.hasOwn(view, 'answer'), false);
        assert.match(view.prompt, /“/);
    }
});

test('answers respect owner, unlock sequence, local day/night, lair, release and per-character order', () => {
    assert.throws(() => characterRiddleView(member(19, []), 'mothkeeper', request, now), /STAGE_LOCKED/);
    assert.throws(() => characterRiddleView(member(), 'rootwhisper', request, now), /TIME_LOCKED/);
    assert.throws(() => characterRiddleView(member(), 'tanglebright', request, now), /CATACOMBS_REQUIRED/);
    assert.throws(() => answerCharacterRiddle(member(), 'mothkeeper', 2, 0, request, now), /NOT_AVAILABLE/);
    assert.throws(() => answerCharacterRiddle(member(), 'mothkeeper', 5, 0, request, now), /PREVIOUS_CHARACTER/);
    assert.throws(() => answerCharacterRiddle(member(), 'mothkeeper', 29, 0, request, new Date('2026-10-30')), /NOT_AVAILABLE/);
    assert.throws(() => answerCharacterRiddle(member(), 'mothkeeper', 1, 9, request, now), /INVALID_RIDDLE_CHOICE/);
});

test('wrong answers speak in voice, correct answers persist once, and legacy solved days survive', () => {
    let state = member(); state.forestState.completedDays = [2, 3, 4];
    const day = DAILY_CONTENT[0]; const correct = day.choices.indexOf(day.answer); const wrong = (correct + 1) % 3;
    const miss = answerCharacterRiddle(state, 'mothkeeper', 1, wrong, request, now);
    assert.equal(miss.correct, false); assert.match(miss.feedback, /little wanderer/); assert.equal(miss.fact, null);
    state = answerCharacterRiddle(miss.state, 'mothkeeper', 1, correct, request, now).state;
    const replay = answerCharacterRiddle(state, 'mothkeeper', 1, correct, request, now);
    assert.equal(replay.alreadyCompleted, true);
    assert.deepEqual(state.forestState.completedDays, [1, 2, 3, 4]);
    assert.equal(state.forestState.fragments.filter(x => x === day.collectible).length, 1);
    assert.equal(nextCharacterRiddle(state, 'mothkeeper', now).day, 5);
    let limited = member();
    for (let i = 0; i < 6; i++) limited = answerCharacterRiddle(limited, 'mothkeeper', 1, wrong, request, now).state;
    assert.throws(() => answerCharacterRiddle(limited, 'mothkeeper', 1, correct, request, now), /DAILY_ATTEMPT_LIMITED/);
});

test('only the journal save action may forward a bounded draft through the question protocol', () => {
    const base = { type: 'RABBIT_QUESTION_ACTION', requestId: 'q-1', action: 'dialogue', choiceId: 'save-notes', value: 'My draft', revision: 0 };
    assert.equal(normaliseActionMessage(base).value, 'My draft');
    assert.equal(normaliseActionMessage({ ...base, value: 'x'.repeat(1501) }), null);
    assert.equal(normaliseActionMessage({ ...base, revision: -1 }), null);
    assert.equal(normaliseActionMessage({ ...base, choiceId: 'forest' }).value, undefined);
});

test('authenticated tavern endpoints load and save only the current member, with durable confirmation', async () => {
    let current = 'member-a'; const writes = []; const records = new Map();
    for (const id of ['member-a', 'member-b']) records.set(id, { ...member(), _id: id, memberId: id });
    const context = {
        ...content, ...core.api,
        ...require('../src/backend/rabbitJourneyGate.js'),
        ...require('../src/backend/rabbitTavern.js'),
        ...require('../src/backend/rabbitCharacterRiddles.js'),
        Date, console,
        Permissions: { SiteMember: 'member' },
        webMethod(permission, fn) { assert.equal(permission, 'member'); return fn; },
        currentMember: { getMember: async () => current ? { _id: current } : null },
        wixData: {
            get: async (_collection, id) => structuredClone(records.get(id)),
            save: async (_collection, record) => { writes.push(record._id); records.set(record._id, structuredClone(record)); return structuredClone(record); }
        }
    };
    const source = fs.readFileSync(path.join(__dirname, '../src/backend/rabbitHole.web.js'), 'utf8').replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/export const /g, 'const ');
    vm.runInNewContext(source + '\nthis.endpoints={getTavernContent,useTavern,solveDailyContent};', context);
    await context.endpoints.useTavern('save-notes', { value: 'Remember the tiny shoot', revision: 0, memberId: 'member-b' });
    assert.equal((await context.endpoints.getTavernContent('journal')).editor.value, 'Remember the tiny shoot');
    current = 'member-b';
    assert.equal((await context.endpoints.getTavernContent('journal')).editor.value, '');
    assert.deepEqual(writes, ['member-a']);
    current = null;
    await assert.rejects(context.endpoints.getTavernContent(), /MEMBER_LOGIN_REQUIRED/);
    await assert.rejects(context.endpoints.useTavern('rest'), /MEMBER_LOGIN_REQUIRED/);
    await assert.rejects(context.endpoints.solveDailyContent(1, 'answer'), /RIDDLES_LIVE_WITH_CHARACTERS/);
});
