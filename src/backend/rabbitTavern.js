import { HUNT_ROUTE } from './rabbitContent.js';
import { hasForestPrelude, journeyPhase } from './rabbitJourneyGate.js';

const NAMES = ['Kaylix', 'Rootwhisper', 'Grumblebark', 'Tanglebright'];
const BREWS = ['Lantern tea', 'Confetti cocoa', 'Grumblebark’s allegedly ancient cordial'];
const TALES = [
    ['A moth with an appointment', 'Kaylix once waited for a moth to finish a thought. It took until Tuesday. Nobody asked which Tuesday. The lantern stayed lit.'],
    ['A strongly worded leaf', 'Rootwhisper pinned a list of sensible rules to a tree. The tree returned it with corrections. They are still arguing about the punctuation. The sapling is winning.'],
    ['The biased measuring tape', '“843 years, allegedly,” Grumblebark told the hearth. “And not one sensible chair.” The smallest chair in the room creaked. He accused it of taking sides.'],
    ['The empty chair', 'A chair waits beside the fire. No test, no price, no need to explain yourself. The wilds can wait while you take up exactly as much space as you need.']
];
const pick = (id, label) => ({ id, label, action: 'dialogue' });
const back = () => pick('hub', 'Back to the hearth');

export function normaliseTavern(value = {}) {
    return {
        checkpointAt: typeof value?.checkpointAt === 'string' && Number.isFinite(Date.parse(value.checkpointAt)) ? value.checkpointAt : null,
        notes: typeof value?.notes === 'string' ? value.notes.slice(0, 1500) : '',
        revision: Number.isSafeInteger(value?.revision) && value.revision >= 0 ? value.revision : 0,
        quiet: value?.quiet === true,
        brew: BREWS.includes(value?.brew) ? value.brew : null
    };
}

export function tavernSnapshot(state, branch = 'hub') {
    const tavern = normaliseTavern(state.forestState?.tavern);
    const found = Math.min(50, Math.max(0, Number(state.foundCount) || 0));
    const completed = state.forestState?.encounters?.length || 0;
    const snapshot = {
        mode: 'tavern', eyebrow: 'The Tavern · A chair kept for you',
        progress: { current: found, total: 50 }, quiet: tavern.quiet,
        meta: [`${found} OF 50 DISCOVERIES SAVED`, 'YOUR MEMBER JOURNEY'],
        status: { kind: 'ready', message: 'Explore at your own pace. Your discoveries are already saved to your account.' }
    };
    if (branch === 'recap') return { ...snapshot, question: 'Where was I?',
        hint: `${found}/50 discoveries; ${completed}/4 encounters; ${state.forestState.completedDays?.length || 0}/30 character riddles. You have met ${completed ? NAMES.slice(0, completed).join(', ') : 'no guardians yet'}. ${found < 50 ? `Next: discovery ${found + 1}, on ${HUNT_ROUTE[found]}.` : journeyPhase(state, 'cave') === 'catacombs' ? 'Next: pass through the Catacombs of Glory.' : completed === 4 ? 'Your final conversation is saved in The Last Ember.' : 'Next: Tanglebright’s lair beyond the Catacombs of Glory.'}`,
        choices: [pick('resume', 'Take me to my next step'), pick('map', 'Open the route board'), back()] };
    if (branch === 'journal') return { ...snapshot, question: 'Your “where was I?” journal',
        hint: 'Personal notes for this member account. Write a reminder, a theory, or what you want to do next. Notes save only when you choose Save notes.',
        editor: { label: 'My trail notes', value: tavern.notes, revision: tavern.revision, maxLength: 1500 },
        choices: [pick('save-notes', 'Save notes to my account'), back()] };
    if (branch === 'map') return { ...snapshot, question: 'The route board',
        hint: 'The tavern welcomes every signed-in wanderer. Kaylix: daytime, 6 am–6 pm. Rootwhisper: night, 6 pm–6 am. Then Grumblebark → this tavern → 50 discoveries → Catacombs of Glory → Tanglebright’s lair. Times follow your device’s local timezone. Doors keep their existing locks.',
        details: [
            { title: `Forest guardians · ${Math.min(completed, 3)}/3 complete`, text: 'Meet Kaylix, Rootwhisper and Grumblebark in order. Completed guardians can be revisited at their local times.' },
            { title: tavern.checkpointAt || state.forestState.fragments.includes('journey:tavern') ? 'Hearth checkpoint · recorded' : 'Hearth checkpoint · waiting', text: 'Rest whenever you like to confirm a checkpoint on your account.' },
            { title: hasForestPrelude(state) ? 'Cave departure · forest encounters complete' : 'Cave departure · forest encounters pending', text: hasForestPrelude(state) ? 'Rest after Grumblebark to record the onward journey stop.' : 'Enjoy the tavern now; return after Grumblebark before taking the cave path.' },
            { title: `${found}/50 discoveries`, text: found < 50 ? 'Find the remaining marks to unseal the catacombs.' : 'Every discovery is saved.' },
            { title: state.forestState.fragments.includes('journey:catacombs') ? 'Catacombs of Glory · crossed' : 'Catacombs of Glory · ahead', text: 'The old passages lead deeper into the cave.' },
            { title: completed === 4 ? 'Tanglebright · encountered' : 'Tanglebright · waiting in the lair', text: 'The final antagonist remains beyond the catacombs.' }
        ],
        choices: [pick('forest', 'Revisit the forest guardians'), pick('next-mark', found < 50 ? `Find discovery ${found + 1}` : 'Revisit the completed hunt'), pick('cave', found < 50 ? 'Inspect the sealed cave path' : 'Enter the cave and catacombs'), back()] };
    if (branch === 'keepsakes') {
        const fragments = (state.forestState.fragments || []).filter(value => !value.startsWith('journey:'));
        return { ...snapshot, question: 'The keepsake shelf',
            hint: fragments.length ? `${fragments.length} earned keepsakes. This shelf reflects what you have actually collected.` : 'An empty shelf is still yours. Earned fragments will appear here as your journey grows.',
            details: fragments.map(value => ({ title: value, text: 'Collected on your saved journey.' })), choices: [back()] };
    }
    if (branch === 'stories') return { ...snapshot, question: 'Stories beside the fire', hint: 'No answers, no timer. Pick a little tale and stay awhile.', choices: [...TALES.map(([title], index) => pick(`tale-${index}`, title)), back()] };
    if (/^tale-[0-3]$/.test(branch)) {
        const [title, tale] = TALES[Number(branch.slice(-1))];
        return { ...snapshot, question: title, hint: tale, choices: [pick('stories', 'Another fireside story'), back()] };
    }
    if (branch === 'brews') return { ...snapshot, question: 'Something imaginary and warm?',
        hint: tavern.brew ? `${tavern.brew} is waiting at your place. No coins, points or purchases involved.` : 'The kettle has questionable manners. The drinks are fictional; the welcome is not.',
        choices: [...BREWS.map((brew, index) => pick(`brew-${index}`, brew)), back()] };
    if (branch === 'quiet') return { ...snapshot, question: 'The quiet corner',
        hint: 'No countdown. No required breathing exercise. Let your shoulders settle if you want, or simply sit. Quiet mode stills the scene and dims the background; your device’s reduced-motion preference is always respected.',
        choices: [pick(tavern.quiet ? 'quiet-off' : 'quiet-on', tavern.quiet ? 'Return to the usual scene' : 'Make this a still, quieter scene'), back()] };
    return { ...snapshot, question: 'A warm hearth. An empty chair. No hurry.',
        checkpointAt: tavern.checkpointAt,
        hint: tavern.checkpointAt ? 'Your hearth checkpoint is confirmed. Your notes and journey stay with your account. Rest again whenever you like.' : 'Your discoveries are already saved. Rest at the hearth to record this checkpoint. The onward cave path opens after your forest encounters and all 50 discoveries.',
        choices: [pick('rest', 'Rest and confirm my saved checkpoint'), pick('recap', 'Where was I?'), pick('journal', 'Write in my journal'), pick('map', 'Explore the route board'), pick('keepsakes', 'Browse my earned keepsakes'), pick('stories', 'Listen to fireside stories'), pick('brews', 'Choose a fireside drink'), pick('quiet', 'Settle in the quiet corner'), pick('resume', 'Continue my journey')] };
}

export function tavernDestination(state, action) {
    if (action === 'forest') return '/rabbit-hole-forest';
        if (action === 'cave') return '/rabbit-hole-cave';
    if (action === 'next-mark') return HUNT_ROUTE[state.foundCount] || '/rabbit-hole-forest';
    if (action === 'resume') {
        if (!hasForestPrelude(state)) return HUNT_ROUTE[state.foundCount] || '/rabbit-hole-forest';
        if (!state.forestState.fragments.includes('journey:tavern')) return null;
        return state.foundCount < 50 ? HUNT_ROUTE[state.foundCount] : '/rabbit-hole-cave';
    }
    return null;
}

export function applyTavernAction(state, action, input = {}, now = new Date()) {
        const tavern = normaliseTavern(state.forestState.tavern);
    let branch = 'hub';
    if (action === 'rest') {
        tavern.checkpointAt = now.toISOString();
        if (hasForestPrelude(state) && !state.forestState.fragments.includes('journey:tavern')) state.forestState.fragments.push('journey:tavern');
    } else if (action === 'save-notes') {
        if (typeof input.value !== 'string' || input.value.length > 1500 || !Number.isSafeInteger(input.revision)) throw new Error('JOURNAL_INPUT_INVALID');
        if (input.value !== tavern.notes) {
            if (input.revision !== tavern.revision) throw new Error('JOURNAL_CHANGED');
            tavern.notes = input.value;
            tavern.revision += 1;
        }
        branch = 'journal';
    } else if (['quiet-on', 'quiet-off'].includes(action)) { tavern.quiet = action === 'quiet-on'; branch = 'quiet'; }
    else if (/^brew-[0-2]$/.test(action)) { tavern.brew = BREWS[Number(action.slice(-1))]; branch = 'brews'; }
    else throw new Error('INVALID_TAVERN_ACTION');
    state.forestState.tavern = tavern;
    return { state, branch };
}
