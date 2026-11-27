import { DAILY_CONTENT, GUARDIAN_MILESTONES, campaignDay, CAMPAIGN_START } from './rabbitContent.js';
import { guardianAvailability, journeyPhase } from './rabbitJourneyGate.js';
import { factForDay } from './encounterVault.js';
import { recordDailyResult } from './rabbitDailyGuard.js';

export const RIDDLE_KEEPERS = Object.freeze(['mothkeeper', 'rootwhisper', 'grumblebark', 'tanglebright']);
const SPEECH = {
    mothkeeper: ['Kaylix turns the lantern towards you. “A thought for the path:', '“There it is. A little light, kept safe.”', '“Not that one, little wanderer. Take your time.”'],
    rootwhisper: ['Rootwhisper grins. “Right. Wrap your unruly brain around this:', '“Ha! That’s the one. Put that in the roots’ report.”', '“Excellent wrong turn. Want another go?”'],
    grumblebark: ['Grumblebark taps a root. “843 years, allegedly, and I still have to ask:', '“Correct. Eight hundred and twelve years, allegedly, and finally someone listens.”', '“No. And do not blame my height. Think again.”'],
    tanglebright: ['Tanglebright smiles without blinking. “One more beautifully terrible question:', '“Precisely. How deliciously inconvenient for the darkness.”', '“A charming answer. Incorrect, of course. The chair is delighted.”']
};
export function keeperForRiddle(day) { return Number.isInteger(day) && day >= 1 && day <= 30 ? RIDDLE_KEEPERS[(day - 1) % 4] : null; }
export function assertRiddleAccess(state, key, request = {}, now = new Date()) {
    const index = RIDDLE_KEEPERS.indexOf(key);
    if (index < 0) throw new Error('UNKNOWN_GUARDIAN');
    if (state.foundCount < GUARDIAN_MILESTONES[index].threshold || (state.forestState.encounters?.length || 0) < index) throw new Error('FOREST_STAGE_LOCKED');
    if (!guardianAvailability(key, request.timeZone, now).available) throw new Error('FOREST_TIME_LOCKED');
    if (key === 'tanglebright' && !['lair', 'reward'].includes(journeyPhase(state, 'cave'))) throw new Error('TAVERN_OR_CATACOMBS_REQUIRED');
}
export function nextCharacterRiddle(state, key, now = new Date()) {
    const completed = state.forestState?.completedDays || [];
    return DAILY_CONTENT.find(day => keeperForRiddle(day.day) === key && day.day <= campaignDay(now, CAMPAIGN_START) && !completed.includes(day.day)) || null;
}
export function characterRiddleView(state, key, request = {}, now = new Date()) {
    assertRiddleAccess(state, key, request, now);
    const entry = nextCharacterRiddle(state, key, now);
    const back = { id: 'story-back', label: 'Back to our conversation', kind: 'story', guardianKey: key, branch: 'entry' };
    if (!entry) return { prompt: `${SPEECH[key][1]} “That is every released riddle I have for you. Stay and talk, if you like.”`, hint: 'Completed riddles and earned fragments remain saved.', choices: [back] };
    return {
        prompt: `${SPEECH[key][0]} ${entry.prompt}”`, hint: entry.teaser,
        choices: [...entry.choices.map((label, index) => ({ id: `riddle-${entry.day}-${index}`, label: `“${label}”`, kind: 'riddle', guardianKey: key, day: entry.day, answerIndex: index })), back]
    };
}
export function answerCharacterRiddle(state, key, dayNumber, answerIndex, request = {}, now = new Date()) {
    assertRiddleAccess(state, key, request, now);
    const day = DAILY_CONTENT.find(entry => entry.day === dayNumber);
    if (!day || keeperForRiddle(dayNumber) !== key || day.day > campaignDay(now, CAMPAIGN_START)) throw new Error('RIDDLE_NOT_AVAILABLE');
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= day.choices.length) throw new Error('INVALID_RIDDLE_CHOICE');
    if (state.forestState.completedDays.includes(dayNumber)) return { state, correct: true, alreadyCompleted: true, feedback: SPEECH[key][1], fact: factForDay(dayNumber) };
    if (nextCharacterRiddle(state, key, now)?.day !== dayNumber) throw new Error('PREVIOUS_CHARACTER_RIDDLE_REQUIRED');
    const correct = day.choices[answerIndex].toLowerCase() === day.answer.toLowerCase();
    const guarded = recordDailyResult(state, dayNumber, now, correct);
    state = guarded.state;
    if (correct) {
        state.forestState.completedDays = [...state.forestState.completedDays, dayNumber].sort((a, b) => a - b);
        if (!state.forestState.fragments.includes(day.collectible)) state.forestState.fragments.push(day.collectible);
    }
    return { state, correct, feedback: SPEECH[key][correct ? 1 : 2], attemptsRemaining: guarded.remaining, fact: correct ? factForDay(dayNumber) : null };
}
