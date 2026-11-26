# Shop-DopaDrop pathway audit — 26 November 2026

## Release status

The pathway fixes were merged through PRs #2 and #3 and published through Wix. Production verification completed on 27 November 2026 (Australia/Sydney).
The separate failed GitHub Pages deployment was successfully retried. Its
recovered host is `https://theredactedsanctum.github.io/shop-dopadrop/`.

## Evidence and coverage

Source inventory was taken from the live Wix sitemap index and its page,
category and product sitemaps, with browser checks on the destinations below.
The Wix REST inventory could not be obtained because the connected OAuth grant
expired (`invalid_grant`, request ID `1795696442.173751719911468`). No live Wix
data was changed through that API.

| Surface | Coverage | Observed result |
| --- | --- | --- |
| Product directory | 701 canonical URLs in the published sitemap | Inventory obtained; this is not a claim of 701 individual browser visits |
| Featured products | All 8 destinations opened in the browser | Correct product names and prices displayed |
| Collections | All 15 destinations opened in the browser | Correct collection headings, including Shop All and Best Sellers |
| Public page sitemap | All 15 destinations opened | 12 had ordinary content; Home, legacy portal and contextless review confirmation needed repair |
| Native shopping utilities | Cart and Search opened | Correct cart and search surfaces |
| Member utilities | Account Settings, Loyalty and My Rewards opened signed out | Wix signup gates; protected member content was not accessed |
| Legacy profile alias | `/profile/my/profile` opened | Wix displayed “We can’t find the page you’re looking for” |
| Hunt scenes | Cave, Forest and Daily opened signed out | Existing Guest Area password gates |
| Cross-page links | 266 unique same-site paths extracted from inspected rendered page snapshots | 262 matched sitemap entries; Search, Loyalty and My Rewards were verified separately; `/undefined` was the broken review link |

The native hunt placement registry still contains its original 50 ordered
placements. Page routing changes do not reset member progress, bypass gates,
or enable rewards.

## Repairs

| Failure | Repair |
| --- | --- |
| Homepage and hunt launcher load the retired GitHub hostname and show 404 | Update Home, shared launcher and question bridge to the recovered host; bump their cache revision |
| Account link prompts login again for signed-in members and has Home as its standalone fallback | Link to `/account-settings`; prompt only signed-out visitors, then continue to Account |
| Completed-hunt dashboard points to a nonexistent public profile placeholder | Return the verified `/account-settings` member destination |
| Direct legacy profile alias shows the missing-page screen | Redirect only `/profile/my/profile` to Account; preserve real public profile slugs |
| Catalogue absolute product URLs do not match the local navigation allowlist | Normalize same-storefront URLs before dispatch; reject external origins |
| An empty live product URL overwrites a valid featured-card link | Preserve the existing verified fallback URL |
| Legacy portal page has duplicated embedded scripts and renders blank | Redirect the public `/home-1` alias to Home; retain the saved portal design in the Editor |
| Direct review confirmation has a “See Your Review” link with `href=undefined` | Send visits without submission query context to the real reviews page; retain Wix ownership when context exists |

## Verification

`npm test`: **172 passed, 0 failed**. `npm run lint` and `git diff --check`
also pass. Thirteen pathway regression tests exercise
account continuation, hunt sign-in staying on-page, absolute URL dispatch,
external-origin rejection, missing-embed fallback, contextless review fallback,
legacy-profile handling and preservation of working product links.

The pre-existing reward, challenge, daily guard, placement and renderer tests
remain green. Wix Loyalty remains the reward provider; the live reward switch
remains disabled.

## Production verification and remaining access checks

The published Home embed loads from the recovered host. Actual featured-product
and collection clicks navigate the outer Wix page correctly. `/home-1` returns
to Home; the direct review confirmation returns to the reviews collection.
The legacy profile alias reaches the Account entry point.

The signed-in test account exposes an additional restriction: both the Home
Account button and Wix's native Account Settings menu reach `/auth/access-restricted`.
This is separate from the repaired public profile alias and requires a member-access
configuration check. No permission settings have been changed.

The test account is created and signed in. Its saved dashboard shows **44/50**
discoveries. Discoveries 5–44 passed real two-touch claims across all collection,
About, Contact and policy routes. The Forest continuation opens the existing
Guest Area password gate; discoveries 45–50 and the final reward flow remain
unverified. See `BUTTON_AUDIT_2026-11-27.md` for the button repair evidence.
