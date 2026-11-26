# Shop-DopaDrop button audit — 27 November 2026

All dates use Australia/Sydney.

## Published repairs

- Reconstruct category routes with Wix's separate router prefix; the prior binder matched no category placements and left inert Start Now controls visible.
- Restore distinct native discovery IDs on Contact, Shipping, Refund, Privacy, Accessibility, Forest, Daily, Journal and Gift Card pages. About and the shared Category template were also inspected.
- Recover the original hunt artwork from the earlier fifty-button build. Native controls use 80px image targets, wobble, keyboard focus, reduced-motion support and visible second-touch instructions.
- Move category controls into clear space above the banner and below the sidebar filters. Move the Journal control above the post grid and the Gift Card control below the artwork.
- Collapse obsolete generic hunt placeholders and retired duplicates, including removed member-page placements. Preserve them in the Editor.
- Give the hosted scene renderer sole ownership of dialogue, question and reward choices; collapse old overlapping native controls and old scene headings.
- Hide dashboard Log in after authenticated member data loads; avoid a second login prompt for an already signed-in player.

## Verification

| Area | Evidence |
| --- | --- |
| Existing test account | Signed in; initial dashboard showed 4/50 saved |
| Discoveries 5–31 | Real two-touch claims passed through all thirteen hunt collection routes |
| Discoveries 32–34 | All three About controls claimed |
| Discoveries 35–37 | All three restored Contact controls claimed |
| Discoveries 38–44 | Shipping, Refund, Privacy and Accessibility controls claimed in canonical order |
| Durable state | Returning to Home showed 44/50 and Find secret 45 |
| Styling | Production computed style confirmed original image URL, wobble animation and ~80px target; the active category control was visibly clear of banner text |
| Cart | Add to Cart, 1→2→1 quantity controls, View Cart, Continue Browsing and item removal passed. Final cart empty; no order placed |
| Automated checks | 172 tests passed; ESLint and git diff checks passed |

The first four discoveries were already saved when the signed-in audit began.
The 701-product sitemap was inventoried in the earlier pathway audit; this is
not a claim of individual interaction tests on all 701 product pages.

## Remaining access-dependent checks

1. Forest: Find secret 45 opens the existing Guest Area password gate. The test member remains at 44/50. Live claims 45–50, guardian dialogue, Daily and the finale cannot be verified through that gate without its password.
2. Account Settings: Home Account, the native Wix member menu and the account tab routes shown by Wix reach Access Restricted for this test member. No access or permission settings have been changed.
3. Final rewards: Wix Loyalty remains the reward provider and the existing live reward-issuance switch remains disabled. No points or checkout reward have been issued by these tests.
4. Mobile: a full mobile Preview hit-test pass is still pending; desktop live checks and CSS touch-target constraints are verified separately.

## Other observed content work

The Editor retains template guidance/placeholders on Refund and Accessibility,
and Home contains an old October launch schedule. These were outside this
button repair and require a separate content pass using the approved policies.
