# Hidden discovery placement registry

Updated: 2026-11-27 (Australia/Sydney)

## Safety and verification boundary

The canonical 50-entry sequence uses authenticated per-member challenges. Discovery 1 remains the only signup gate. Guardian thresholds remain Mothkeeper 20, Rootwhisper 30, Grumblebark 40, and Tanglebright 50. Reward issuance is disabled and no public reset exists.

Buttons 1-4 are explicit page-local targets inside bounded homepage artwork bands. Buttons 5-50 use distinct native Wix controls at page-local anchors. After member sign-in, all assigned discoveries on each page remain visible. Only the authoritative next discovery accepts its two-touch claim; saved discoveries stay visible and dimmed. The next mark has a brighter yellow pulse. Static pages use numbered IDs such as `#rabbitDiscovery32`; the Category template uses `#rabbitDiscoveryHeading`, `#rabbitDiscoveryGrid`, and `#rabbitDiscoveryFooter`.

Every native control must have a minimum 44 by 44 CSS-pixel mobile hit area and sit above every normal page-canvas text, image, repeater, decoration, section, and container layer. Legitimate Wix system overlays—login, cookies, navigation, cart, lightboxes, and accessibility dialogs—remain above the hunt.

Evidence states are separate:

- **Locally wired:** registry, controller, binder, and tests are complete.
- **Editor placed:** the exact element exists in Wix Studio at the documented in-flow anchor.
- **Preview verified:** desktop and mobile Preview hit testing and keyboard focus were observed.
- **Production verified:** the published customer site was observed after a separately authorized publish.

## Exact placements

| ID | Route | Page area | Editor element | Locally wired | Editor placed | Preview verified | Production verified |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/` | Hero artwork | `data-rabbit-id="1"` | Yes | N/A | No | Saved state observed |
| 2 | `/` | Featured products | `data-rabbit-id="2"` | Yes | N/A | No | Saved state observed |
| 3 | `/` | Collection trail | `data-rabbit-id="3"` | Yes | N/A | No | Saved state observed |
| 4 | `/` | Founder invitation | `data-rabbit-id="4"` | Yes | N/A | No | Saved state observed |
| 5 | `/category/all-products` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 6 | `/category/all-products` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 7 | `/category/all-products` | Lower sidebar trail | `#rabbitDiscoveryFooter` | Yes | Yes | No | Yes: claim passed |
| 8 | `/category/desk-workspace-fidgets` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 9 | `/category/desk-workspace-fidgets` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 10 | `/category/hand-fidgets-spinners` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 11 | `/category/hand-fidgets-spinners` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 12 | `/category/sensory-rings-chains-wearables` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 13 | `/category/sensory-rings-chains-wearables` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 14 | `/category/chew-oral-sensory` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 15 | `/category/chew-oral-sensory` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 16 | `/category/tactile-textured-sensory` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 17 | `/category/tactile-textured-sensory` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 18 | `/category/weighted-deep-pressure` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 19 | `/category/weighted-deep-pressure` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 20 | `/category/visual-light-stimulation` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 21 | `/category/visual-light-stimulation` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 22 | `/category/auditory-rhythm-tools` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 23 | `/category/auditory-rhythm-tools` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 24 | `/category/focus-calm-tools` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 25 | `/category/focus-calm-tools` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 26 | `/category/stim-toys-squishies` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 27 | `/category/stim-toys-squishies` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 28 | `/category/sensory-kits-bundles` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 29 | `/category/sensory-kits-bundles` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 30 | `/category/movement-balance` | Clear band above category artwork | `#rabbitDiscoveryHeading` | Yes | Yes | No | Yes: claim passed |
| 31 | `/category/movement-balance` | Clear sidebar below filters | `#rabbitDiscoveryGrid` | Yes | Yes | No | Yes: claim passed |
| 32 | `/about` | Founder story opening | `#rabbitDiscovery32` | Yes | Yes | No | Yes: claim passed |
| 33 | `/about` | Origin story midpoint | `#rabbitDiscovery33` | Yes | Yes | No | Yes: claim passed |
| 34 | `/about` | Welcome-home sign-off | `#rabbitDiscovery34` | Yes | Yes | No | Yes: claim passed |
| 35 | `/contact` | Support introduction | `#rabbitDiscovery35` | Yes | Yes | No | Yes: claim passed |
| 36 | `/contact` | Help-choosing section | `#rabbitDiscovery36` | Yes | Yes | No | Yes: claim passed |
| 37 | `/contact` | Contact sign-off | `#rabbitDiscovery37` | Yes | Yes | No | Yes: claim passed |
| 38 | `/shipping-policy` | Tracking section | `#rabbitDiscovery38` | Yes | Yes | No | Yes: claim passed |
| 39 | `/refund-policy` | Refunds section | `#rabbitDiscovery39` | Yes | Yes | No | Yes: claim passed |
| 40 | `/privacy-policy` | Privacy promise; Grumblebark threshold | `#rabbitDiscovery40` | Yes | Yes | No | Yes: claim passed |
| 41 | `/shipping-policy` | Delivery-help footer | `#rabbitDiscovery41` | Yes | Yes | No | Yes: claim passed |
| 42 | `/refund-policy` | Returns-help footer | `#rabbitDiscovery42` | Yes | Yes | No | Yes: claim passed |
| 43 | `/privacy-policy` | Data-controls footer | `#rabbitDiscovery43` | Yes | Yes | No | Yes: claim passed |
| 44 | `/accessibility-statement` | Assistance footer | `#rabbitDiscovery44` | Yes | Yes | No | Yes: claim passed |
| 45 | `/rabbit-hole-forest` | Forest path | `#rabbitDiscovery45` | Yes | Yes | No | No: Forest gate blocks sequence |
| 46 | `/rabbit-hole-daily` | Daily chronicle | `#rabbitDiscovery46` | Yes | Yes | No | No: Forest gate blocks sequence |
| 47 | `/blog` | Brain Dump archive | `#rabbitDiscovery47` | Yes | Yes | No | No: Forest gate blocks sequence |
| 48 | `/gift-card` | Gift-card artwork | `#rabbitDiscovery48` | Yes | Yes | No | No: Forest gate blocks sequence |
| 49 | `/accessibility-statement` | Accessibility promise | `#rabbitDiscovery49` | Yes | Yes | No | No: Forest gate blocks sequence |
| 50 | `/rabbit-hole-forest` | Tanglebright threshold | `#rabbitDiscovery50` | Yes | Yes | No | No: Forest gate blocks sequence |

## Wix Studio placement checklist

- Place every control between normal content blocks; never absolutely position it over text.
- On Category, keep heading, grid, and footer slots at distinct vertical positions on desktop and mobile.
- On About and Contact, keep all three numbered controls as separate in-flow elements.
- On Shipping, Refund, Privacy, Accessibility, and Forest, keep both assigned controls as separate in-flow elements.
- Bring each control to front within its local container and verify no ancestor clips its 44 by 44 hit area.
- Add matching status text where desired: numbered controls use `#rabbitDiscoveryStatusNN`; Category controls use `#rabbitDiscoveryStatusHeading`, `#rabbitDiscoveryStatusGrid`, and `#rabbitDiscoveryStatusFooter`.
- Verify touch center hit testing and keyboard focus in desktop and mobile Preview.
- Do not mark Preview or Production verified without direct observation.

## Production evidence — 27 November 2026

- The category prefix is included when reconstructing Wix dynamic routes.
- Discoveries 5–44 were claimed through their live controls with the signed-in test member. The final dashboard showed 44/50 after returning to Home.
- Native controls use the original first-50 artwork recovered from the earlier build, an 80px target, visible second-touch feedback, and reduced-motion-aware wobble animation.
- Contact 35–37, Shipping 38/41, Refund 39/42, Privacy 40/43, Accessibility 44/49, Forest 45/50, Daily 46, Blog 47 and Gift Card 48 have distinct Editor IDs.
- Duplicate gift-card placeholders and superseded native Forest/Daily/Cave controls are retained in the Editor and collapsed at runtime.
- Editor placement does not prove that 45–50 have been claimed. The production Forest route opens its existing password gate. No page password or member progress was changed.
- Desktop production controls were exercised. A separate full mobile Preview hit-test pass remains pending.
