import { GUARDIAN_MILESTONES } from './rabbitContent.js';
import { buildForestStageView } from './rabbitForestView.js';
import { WHISPER_FACTS, publicFact } from './encounterVault.js';

// The specialist names describe the shop's backstage crew, not new guardians,
// permission roles, or characters that can replace the established four.
export const CREW = Object.freeze({
    mothkeeper: [
        ['Sable', 'untangles order questions, returns and delivery worries'],
        ['Jade', 'writes the welcome notes and useful follow-ups'],
        ['Nova', 'helps wandering shoppers find their way back'],
        ['Sage', 'looks after reviews and stories after a purchase']
    ],
    rootwhisper: [
        ['Flynn', 'writes the organic posts'], ['Posie', 'publishes the finished posts'],
        ['River', 'gives a good story more than one life'], ['Remi', 'makes the ad ideas'],
        ['Reeve', 'works out bundles and offers']
    ],
    grumblebark: [
        ['Morgan', 'checks the shop for missing pieces'],
        ['Harper', 'finds real supplier photographs'],
        ['Indi', 'makes approved imagery when the product allows it'],
        ['Casey', 'builds and tends the Wix shop']
    ],
    tanglebright: [
        ['Blaze', 'makes the shopping path easier to follow'],
        ['Dex', 'counts what actually happened'],
        ['Pixel', 'connects the shop machinery'],
        ['The Alchemist', 'keeps the facts attached to their sources']
    ]
});

export const GUARDIAN_VOICES = Object.freeze({
    mothkeeper: {
        opening: 'Kaylix cups a lantern with something small and luminous asleep inside. “You may fidget. The moths do. One has been rearranging the same thought since Tuesday.”',
        fact: '“A little true thing for the lantern. We can be wonderfully strange without making things up.”',
        guide: '“One mark, then the next. Touch once to wake it and once more to save it. A dim mark remembers you. Rest whenever you need; the path keeps your place.”',
        crew: '“Even a lantern needs someone to trim its wick. The shop has a little backstage circle.”',
        continue: 'Let the lantern settle',
        after: '“There. Nothing needed fixing about your hands. We simply waited long enough to see the light.”'
    },
    rootwhisper: {
        opening: 'Rootwhisper leans against a tree wearing several safety pins it did not consent to. “Rules? Love a useful one. The rest make excellent confetti. Mind the sapling; it bites above its weight.”',
        fact: '“Actual evidence. Delicious. Much better than a very confident bloke with a podcast.”',
        guide: '“Fifty marks, in order. The glowing one is your next bad idea. Poking the last one first does not impress the roots. Believe me, I tried. They wrote a strongly worded leaf.”',
        crew: '“The shop’s noisy lot? Writers, makers, and people who stop the same post wearing seventeen different hats.”',
        continue: 'Shield the tiny shoot',
        after: '“Tiny does not mean helpless. Look at that. You protected something without telling it to become something else.”'
    },
    grumblebark: {
        opening: 'Grumblebark, a very short dwarf oak with a catastrophically large opinion, blocks a root-sized path. “Eight hundred and forty-three years, allegedly. Do not measure me. The tape is biased.”',
        fact: '“A proper fact. With roots. If it has no source, it is gossip wearing a waistcoat.”',
        guide: '“Count the marks you have actually saved. Keep your footing. If a path misbehaves, stop and check it; charging harder merely makes a larger idiot-shaped hole. I have had 843 years, allegedly, to observe this.”',
        crew: '“Standards. Photographs of actual things. Someone checking the hinges. Such extravagance.”',
        continue: 'Listen without mentioning his height',
        after: '“You listened. A rare and suspicious talent. Eight hundred and twelve years, allegedly, and hardly anyone manages it. What? I said eight hundred and forty-three. Mind your own rings.”'
    },
    tanglebright: {
        opening: 'Tanglebright sits perfectly still in a chair that is slowly turning itself inside out. “Fifty little choices. You did keep the receipts, didn’t you? Wonderful. I do enjoy a catastrophe with documentation.”',
        fact: '“An oddity from The Alchemist. Check the source if you like. Reality gets away with things fiction would be scolded for.”',
        guide: '“The final mark opens The Last Ember. At the fire, hear the offer, choose your reward, then confirm it. Curiosity costs no points. Reading the offer never spends your choice.”',
        crew: '“Every delightful mess needs someone counting the spoons. The shop’s backstage ledger has a few names.”',
        continue: 'Approach the smiling disaster',
        after: '“Excellent. The path to The Last Ember is yours. Do come in. The fire has been practising its manners.”'
    }
});

function keeperForFact(fact) {
    if (/moss|lichen|forest|fung|tree|wood|wombat/.test(fact.topic)) return 'grumblebark';
    if (fact.category === 'sitewide-neurodivergence' || /stimming|sensory|balance|sleep/.test(fact.topic)) return 'mothkeeper';
    if (/putty|spinn|toy|kaleido|bubble|slime|fidget|collect/.test(fact.topic)) return 'rootwhisper';
    const categories = {
        'desk-workspace-fidgets': 'rootwhisper', 'hand-fidgets-spinners': 'rootwhisper',
        'stim-toys-squishies': 'rootwhisper', 'tactile-textured-sensory': 'grumblebark',
        'weighted-deep-pressure': 'grumblebark', 'chew-oral-sensory': 'grumblebark',
        'focus-calm-tools': 'mothkeeper', 'movement-balance': 'mothkeeper'
    };
    return categories[fact.category] || 'tanglebright';
}

export const FACT_POOLS = Object.freeze(Object.fromEntries(GUARDIAN_MILESTONES.map(stage => [
    stage.characterId, Object.freeze(WHISPER_FACTS.filter(fact => keeperForFact(fact) === stage.characterId))
])));

function cursorIndex(value, length) {
    return Number.isSafeInteger(value) && value >= 0 ? value % Math.max(1, length) : 0;
}

const storyChoice = (id, label, guardianKey, branch, cursor = 0) => ({
    id, label, kind: 'story', guardianKey, branch, cursor
});

export function guardianStory(guardianKey, request = {}) {
    const voice = GUARDIAN_VOICES[guardianKey];
    if (!voice) throw new Error('UNKNOWN_GUARDIAN');
    const branch = ['entry', 'fact', 'crew', 'guide'].includes(request.branch) ? request.branch : 'entry';
    const back = storyChoice('story-back', 'Back to our conversation', guardianKey, 'entry');
    if (branch === 'fact') {
        const pool = FACT_POOLS[guardianKey];
        const cursor = cursorIndex(request.cursor, pool.length);
        return {
            prompt: voice.fact, hint: 'A true oddity, with its source kept beside it.',
            fact: publicFact(pool[cursor]),
            choices: [storyChoice('story-another', 'Another beautifully odd thing', guardianKey, 'fact', cursor + 1), back]
        };
    }
    if (branch === 'crew') return {
        prompt: voice.crew,
        hint: CREW[guardianKey].map(([name, job]) => `${name} ${job}.`).join(' '),
        choices: [back]
    };
    if (branch === 'guide') return { prompt: voice.guide, hint: 'Take your time. Optional conversation never collects a mark or claims a reward.', choices: [back] };
    return {
        prompt: voice.opening, hint: 'Stay for a conversation, or take the guardian’s next step.',
        choices: [
            storyChoice('story-fact', 'Tell me something beautifully odd', guardianKey, 'fact'),
            storyChoice('story-crew', 'Who keeps the shop running?', guardianKey, 'crew'),
            storyChoice('story-guide', 'Remind me how this trail works', guardianKey, 'guide')
        ]
    };
}

export function buildForestDialogue(state = {}, request = {}) {
    const base = buildForestStageView(state);
    const completed = base.progress.current;
    const requestedIndex = GUARDIAN_MILESTONES.findIndex(stage => stage.characterId === request?.guardianKey);
    // A supplied guardian ID cannot jump ahead, expose locked story content,
    // or manufacture an encounter. Revisit choices are read-only.
    const index = requestedIndex >= 0 && requestedIndex <= completed
        ? requestedIndex : Math.min(completed, GUARDIAN_MILESTONES.length - 1);
    const stage = GUARDIAN_MILESTONES[index];
    if ((Number(state.foundCount) || 0) < stage.threshold) {
        if (!completed) return base;
        return {
            ...base, locked: false, nextGuardianLocked: true,
            hint: 'The next guardian is still waiting. You can revisit the conversations you have already completed.',
            choices: GUARDIAN_MILESTONES.slice(0, completed).map(previous => storyChoice(
                `revisit-${previous.characterId}`, `Visit ${previous.label}`, previous.characterId, 'entry'
            ))
        };
    }
    const visited = index < completed;
    const story = guardianStory(stage.characterId, request || {});
    const entry = !request?.branch || request.branch === 'entry' || !['fact', 'crew', 'guide'].includes(request.branch);
    const choices = [...story.choices];
    if (entry && !visited && index === completed) choices.unshift({
        id: `${stage.characterId}-${stage.actionId}`, label: GUARDIAN_VOICES[stage.characterId].continue,
        characterId: stage.characterId, actionId: stage.actionId, kind: 'encounter'
    });
    if (entry && completed > 0) GUARDIAN_MILESTONES.slice(0, completed).forEach(previous => {
        if (previous.characterId !== stage.characterId) choices.push(storyChoice(
            `revisit-${previous.characterId}`, `Visit ${previous.label}`, previous.characterId, 'entry'
        ));
    });
    if (visited && completed < GUARDIAN_MILESTONES.length && entry) choices.push(storyChoice(
        'story-current', 'Return to the current guardian', GUARDIAN_MILESTONES[completed].characterId, 'entry'
    ));
    return {
        ...base, ...story, completed: false, journeyComplete: base.completed, locked: false,
        guardian: { id: stage.characterId, label: stage.label, threshold: stage.threshold, difficulty: stage.difficulty, ordinal: index + 1 },
        choices
    };
}

export function buildCaveLore(state, request = {}) {
    if (state?.foundCount !== 50) throw new Error('CAVE_LOCKED');
    const story = guardianStory('tanglebright', request);
    return { ...story, choices: story.choices.map(choice => ({ ...choice, action: 'dialogue' })) };
}
