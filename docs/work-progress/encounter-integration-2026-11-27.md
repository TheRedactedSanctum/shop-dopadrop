# Encounter integration checkpoint

Goal: integrate the supplied fact vault, specialist roles and trail-management themes into the four established NPCs and all three encounter pages; retire Home - portal goblin; publish and verify the complete change.

Established names: The Grimroot Trials; The Grinning Wrongwoods; The Omens Retreat; The Last Ember. Guardian order: Kaylix, Rootwhisper, Grumblebark, Tanglebright.

## Verified completed work
- All three Wix page names and SEO/social titles saved and published, with old routes retained.
- Hunt marks have 44px CSS dimensions, numbered artwork and Grimroot accessibility names. Live About 32–34 and Forest 45/50 verified at 44px. Source artwork mappings cover all 50. 175 tests and lint passed.
- Source main 70da419 published. Cleanup 1b30fa6 removes two retired Forest overlays; committed, pending next Wix publish.
- Upload inventory: 253 facts across 203 represented topics; 190 source_checked/whisper/gremlinEligible and 63 source_checked/learn-only. Topic index has 289 rows. Old index/count notes refer to larger historical vaults, whose missing fact text must not be invented. roles.md contains 17 specialist definitions.

## Remaining units
1. Import facts and topic metadata with provenance, preserve lane/eligibility flags; integrate 17 roles and workflow themes as optional NPC conversation material.
2. Implement safe read-only lore branches for Kaylix, Rootwhisper, Grumblebark and Tanglebright; retain canonical guardian progression and all saved member progress.
3. Display one sourced fact at a time in Forest/Cave dialogue and Daily answer reveals; support safe source links.
4. Remove the obsolete Home - portal goblin page in Wix and retire its code safely; preserve canonical Home.
5. Verify narrative branches, invalid/locked access, citations and unaffected reward controls with tests; publish and inspect live.
6. Deliver the requested complete player journey. Explicitly distinguish existing unlocks from missing forced softgates, reward issuance and prestige/Chronicle implementation.

## Boundaries
No password or page access changes. No reward issuance or progress resets. No new AI NPCs invented from the specialist roles. User authorized implementation and publishing already. The supplied autonomy notes guide checkpointing, not product text or new approval requirements. No subagents have been spawned.

## Browser
Local Opera extension connected through Browser js, browser id0. Variables agent, browser, wixEditor (claimed existing Wix editor), auditAbout (created verification tab, currently Forest), shopLive (original Home tab; script access denied by ExtensionsSettings policy; do not circumvent). Wix editor connected, source origin/main read-only. Browser activity closed after verifying names and dimensions.

## Implementation checkpoint
- Imported all 253 facts and 289 topic metadata records; 190 eligible whispers partitioned across all four guardians, 63 learning-only entries excluded from whispers. Provenance inventory saved with file checksums.
- All 17 specialist roles represented in optional crew conversations. The autonomy material supplies rest, checkpoint and evidence themes in character voices.
- Read-only Forest branches, guardian revisits, Cave lore branches and sourced Daily reveals implemented. Source links are restricted to credential-free HTTPS and rendered as text. Canonical actions, rewards and saved progress remain separate.
- Daily now selects the first unfinished released clue, so a late arrival can start at day1 and catch up in order.
- 182 tests passed before the final Daily catch-up test; latest complete validation and live publication pending.

## Portal removal checkpoint
- SEO redirect 41ecb72a-789f-476b-ab92-d1614620bd10 maps /home-1 to / and was read back through the Wix API.
- Home - portal goblin (pageID loevn) deleted in Wix Studio; page row disappearance verified, canonical Home remains. Its obsolete Velo module and three obsolete module tests removed.
- Full start-to-finish route and current implementation gaps documented in docs/PLAYER_JOURNEY.md.

## Pre-publication checkpoint
- All four guardian branches, completed-guardian revisits (including while the next gate is locked), Cave optional lore, safe citations and Daily fact/catch-up flow implemented.
- 181 tests and lint passed after portal retirement; one further locked-hub revisit test added. Final count follows in publication evidence.
- Portal page removal saved in Wix; URL redirect is live. Source deletion and full dialogue update are ready for the next main commit.

## Live evidence checkpoint
- Source release 80af67c published via Wix. Forest iframe loads revision grimroot-lore-20261127.
- Live Forest default at member count45 showed three completed guardian revisits and Tanglebright still locked at50. Grumblebark revisit showed his 843-years allegedly line; a fact displayed its NIDCD source URL; crew branch displayed Morgan, Harper, Indi and Casey. Hunt marks45/50 still44px; no progress changed.
- Live Daily verification redirected to /auth/access-restricted for this signed-in member. Existing access rule is not changed. Cave lore remains covered by tests and its50-mark access guard; no reward request made.
- Two legacy Forest overlays survived DOM-ID CSS despite matching the expected generated IDs; the exact style-precedence cause was not established. Replaced that approach with semantic label-based collapse in rabbitQuestionBridge. Final patch tests, commit, publish and live overlay verification pending.
- Connected Browser aliases: cleanupEditor is tab222244809; verificationTab tab222244812, currently Forest crew branch (marked deliverable); prior auditAbout tab222244801 is being used to browse the shop, avoid redirecting it. New failed Daily tab222244815 is Access Restricted. Browser activity is closed.
