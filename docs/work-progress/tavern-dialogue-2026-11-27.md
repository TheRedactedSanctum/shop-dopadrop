# Tavern and character dialogue update

Authorized scope: implement and publish character-owned riddles, a richer tavern rest/save hub, repair discovery 32 visibility, and provide an explicit X to close on maintained popups.

Preserve: all 50 stable discovery identities and routes, saved member records, local day/night guardian availability, forest → tavern → catacombs → lair order for the onward cave journey, protected founder and Mission prose, and existing reward issuance settings.

Tavern: confirmed server checkpoint, personal editable journal, authoritative journey recap, interactive route board, earned keepsake shelf, optional fireside stories, a fictional drink ritual, and quiet/motion controls. Riddles belong to the four established guardians; the legacy daily route remains available for discovery 46 without a standalone quiz.

Validation will cover member isolation, replay safety, riddle ownership/eligibility and answer privacy, journal input limits, gate preservation, renderer protocol, popup closure, and live layout where access permits.

## Implemented and checked

- Nine tavern hub choices, editable 1,500-character member notes with revision checks, confirmed saved hearth time rendered in the player's timezone, route status board, earned fragment shelf, four optional fireside tales, fictional brews and persistent quiet mode.
- All 30 existing riddles partitioned 8/8/7/7 across Kaylix, Rootwhisper, Grumblebark and Tanglebright, with voiced question/answer feedback. Existing completed day IDs and fragments are retained. No new mandatory riddle lock was added. Guardian thresholds, order, local time, releases, attempt limits and lair access remain enforced on the server.
- The legacy daily route remains accessible as a trail junction, preserving discovery 46. Homepage encounter shortcuts now navigate to the proper scenes.
- Custom popup X controls minimise to independent coloured gems; restoring keeps the DOM and draft contents. The existing hunt gem retains its appearance.
- The concurrently published signup welcome and double-tap protocol are retained. All signed-in members can use the full tavern hub immediately; an early rest does not mark the post-Grumblebark journey gate complete. Signup welcome minimises to a distinct violet gem.
- Original native discovery 32 retained as #rabbitDiscovery32 / comp-mvtx1l7q on About. Desktop moved from X15/Y10 to X112/Y32, native W44/H44; brought to front; prototype Start Now label replaced. Mobile uses Fixed sizing W44/H44 at X165/Y16. Mobile #text88 moved from Y14 to Y80 to leave a clear 20px gap under the mark; prose is unchanged. The measured mobile canvas mark is 44x44 at (165.36,106.17), followed by the story heading at Y170.07. No discovery was clicked or awarded during verification.
- 195 automated checks passed before final UI polish, including authenticated member isolation and save replay behavior; lint passed. Final verification and publication remain to be recorded.

## Publication evidence

Source update 41371615869e57bb5910ce1c39df9c6aa2b4fe06 was published through the existing Wix Studio site. Live /grimroot-tavern rendered all nine hub choices with the authenticated member's actual 31/50 progress. The journal was opened, a temporary unsaved draft entered, the scene minimised via X, and restored from its coloured gem; the draft survived exactly. The original note contents were restored without saving the temporary draft. The route board and Grumblebark fireside tale rendered correctly. An explicit hearth rest returned server confirmation, and its timestamp survived a full page reload; discovery count remained 31 and no reward was requested.

Live /about showed discovery 32 moved inward, CSS width/height 44px, and the centre passed hit testing. Native mobile layout was independently measured in Wix Studio. Founder prose was not edited.

Follow-up: available completed guardians remain revisitable when the current guardian is asleep, and the post-Grumblebark forest hub retains those revisit links. No time lock or threshold was removed. The route board distinguishes an anytime rest checkpoint from the later cave departure gate. All 197 checks and lint pass after this follow-up.
