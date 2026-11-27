// Local time is the player's declared IANA timezone; the clock comes from the server.
// This is a story pacing rule, not a location-verification or reward control.
export const TAVERN_ROUTE = '/grimroot-tavern';
const FIRST_THREE = ['mothkeeper:wait', 'rootwhisper:protect', 'grumblebark:listen'];
const GUARDIAN_NAMES = { mothkeeper: 'Kaylix', rootwhisper: 'Rootwhisper', grumblebark: 'Grumblebark' };
function availableRevisits(state, request, now) {
    return FIRST_THREE.filter((key, index) => state.forestState?.encounters?.[index] === key)
        .map(key => key.split(':')[0])
        .filter(key => guardianAvailability(key, request.timeZone, now).available)
        .map(key => ({ id: `revisit-${key}`, label: `Visit ${GUARDIAN_NAMES[key]}`, kind: 'story', guardianKey: key, branch: 'entry' }));
}
export function hasForestPrelude(state) {
    return FIRST_THREE.every((key, i) => state.forestState?.encounters?.[i] === key);
}
export function localPeriod(timeZone, now = new Date()) {
    if (typeof timeZone !== 'string' || timeZone.length > 100) return null;
    try {
        const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));
        return hour >= 6 && hour < 18 ? 'day' : 'night';
    } catch (_) { return null; }
}
export function guardianAvailability(characterId, timeZone, now = new Date()) {
    if (!['mothkeeper', 'rootwhisper'].includes(characterId)) return { available: true };
    const period = localPeriod(timeZone, now);
    const required = characterId === 'mothkeeper' ? 'day' : 'night';
    return { available: period === required, period, required,
        message: characterId === 'mothkeeper'
            ? 'Kaylix appears only in the daytime forest, from 6:00 am to 6:00 pm in your local time. Come back in the light.'
            : 'Rootwhisper appears only in the dark forest, from 6:00 pm to 6:00 am in your local time. Come back after dusk.' };
}
export function journeyPhase(state, location) {
    if (!hasForestPrelude(state)) return location === 'tavern' ? 'tavern-welcome' : 'forest';
    const fragments = state.forestState?.fragments || [];
    // Existing completed encounters remain completed when this new stop is introduced.
    if (state.forestState.encounters[3] === 'tanglebright:approach') return 'reward';
    if (location === 'tavern') return fragments.includes('journey:tavern') ? 'tavern-rested' : 'tavern';
    if (!fragments.includes('journey:tavern')) return 'tavern-required';
    if (state.foundCount < 50) return 'discoveries-required';
    return fragments.includes('journey:catacombs') ? 'lair' : 'catacombs';
}
export function forestJourneyView(view, state, request = {}, now = new Date()) {
    if (hasForestPrelude(state) && !request.guardianKey) return {
        ...view, guardian: null, completed: false, locked: false,
        prompt: 'Grumblebark has opened the path to the tavern.',
        hint: 'Take a breath by the hearth. Beyond the tavern lie the cave, the Catacombs of Glory, and Tanglebright’s lair.',
        choices: [{ id: 'travel-tavern', label: 'Enter the tavern', kind: 'travel', route: TAVERN_ROUTE }, ...availableRevisits(state, request, now)]
    };
    if (view.guardian?.id === 'tanglebright') return {
        ...view, guardian: null, locked: false, completed: false,
        prompt: 'Tanglebright waits in the lair beyond the Catacombs of Glory.',
        choices: [{ id: 'travel-tavern', label: 'Follow the path through the tavern', kind: 'travel', route: TAVERN_ROUTE }]
    };
    const availability = guardianAvailability(view.guardian?.id, request.timeZone, now);
    if (!availability.available) return {
        ...view, guardian: null, locked: availableRevisits(state, request, now).length === 0,
        choices: availableRevisits(state, request, now), prompt: availability.message,
        hint: 'Your saved discoveries and completed encounters remain safe. The forest changes with your local day and night.'
    };
    return view;
}
export function journeySnapshot(state, location) {
    const phase = journeyPhase(state, location);
    const base = { mode: location === 'tavern' ? 'daily' : 'cave', guardianKey: '',
        eyebrow: location === 'tavern' ? 'The Tavern' : 'The Catacombs of Glory',
        progress: { current: 0, total: 3 }, meta: ['SAVED MEMBER JOURNEY', 'NO REWARD CLAIMED'] };
    const choice = (id, label) => ({ id, label, action: 'dialogue' });
    const ready = (question, hint, choices) => ({ ...base, phase, question, hint, choices, status: { kind: 'ready', message: 'Take the trail at your own pace.' } });
    if (phase === 'tavern-welcome') return ready('A warm hearth. An empty chair. No hurry.', 'Take a breather whenever you like. The route to the cave opens later in your journey.', [choice('rest', 'Take a seat by the hearth'), choice('forest', 'Return to the forest')]);
    if (phase === 'forest') return ready('The cave path is still hidden.', 'Finish Kaylix, Rootwhisper and Grumblebark’s encounters first.', [choice('forest', 'Return to the forest'), choice('tavern', 'Rest in the tavern')]);
    if (phase === 'tavern-required') return ready('The cave path passes through the tavern.', 'Grumblebark told you to stop at the hearth first.', [choice('tavern', 'Go to the tavern')]);
    if (phase === 'tavern') return ready('A warm hearth. An empty chair. No hurry.', 'Behind you, Grumblebark grumbles. Ahead, the Catacombs of Glory keep their own silence. Sit for a moment before continuing.', [choice('rest', 'Take a seat by the hearth')]);
    if (phase === 'tavern-rested' || (phase === 'reward' && location === 'tavern')) return ready('Your place by the hearth is remembered.', 'When you are ready, follow the path into the cave. All 50 discoveries are required beyond this point.', [choice('cave', 'Continue into the cave'), choice('forest', 'Return to the forest')]);
    if (phase === 'discoveries-required') return ready('The Catacombs of Glory remain sealed.', 'Find all 50 discoveries. Your tavern stop is saved; there is no need to repeat it.', [choice('forest', 'Return to the forest'), choice('tavern', 'Rest in the tavern')]);
    if (phase === 'catacombs') return ready('The Catacombs of Glory', 'Deep inside the cave, past the old passages, a darker opening leads to Tanglebright’s lair.', [choice('catacombs', 'Pass through the Catacombs of Glory')]);
    if (phase === 'lair') return { ...ready('Tanglebright’s Lair', 'Beyond the Catacombs of Glory, the portal opens. Tanglebright steps into the lair. The portal closes behind them.', [choice('approach', 'Face Tanglebright')]), guardianKey: 'tanglebright', eyebrow: 'Deep within the cave · Tanglebright’s Lair' };
    return { ...base, phase: 'reward' };
}
export function advanceJourneyState(state, location, action) {
    const phase = journeyPhase(state, location);
    const fragment = phase === 'tavern' && action === 'rest' ? 'journey:tavern'
        : phase === 'catacombs' && action === 'catacombs' ? 'journey:catacombs' : null;
    if (!fragment) throw new Error('JOURNEY_STEP_LOCKED');
    if (!state.forestState.fragments.includes(fragment)) state.forestState.fragments.push(fragment);
    return state;
}
