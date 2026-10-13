# Vaultfy — QA progress and acceptance criteria (2026-10-13)

## Source references

- Storefront: https://up-store.net/
- Three user-supplied screenshots: desktop (header and hero), desktop
  (category posters), Chrome DevTools iPhone 16 Pro Max (440 × 956).
- Original Vaultfy logo is available in the separately supplied local
  logo kit. Its PNG pixels are not modified.
- Implementation branch: `vaultfy-upstore-from-scratch`; `main` untouched.

## Implementation verified in code (not claimed live)

| Area | Changed / built | Live-tested |
| --- | --- | --- |
| Header desktop | Centered brand, native cart/account/language/currency/search, multiline nav | NO |
| Header mobile | Centered brand + hamburger and search toggles | NO |
| Homepage hero | Native merchant `fixed_banner` / `wide_banner` first | NO |
| Category gallery | Three portrait cards/row, curatable via Twsaa `list_of_items` | NO |
| Category fallback | Extracts category links and image URLs from native `/category` response | NO |
| Product grid | Reused native price, card link, cart and wishlist templates | NO |
| Product details | Grid, thumbnails, option forms visually restyled; missing-gallery guard | NO |
| Cart | Summary, items, coupon/quantity visually restyled; native data untouched | NO |
| Account/login/CMS | Scoped dark panels/modal/content | NO |
| Footer | Store-owned logo, contacts and policy pages | NO |
| Tablet/mobile | Styles defined for <1100 / <767 / <390 px | NO |

## Static verification already performed

- Linked CSS and JS and original Twig functions exist on branch.
- Newly added JavaScript was parsed as valid ECMAScript.
- Curly braces in stylesheet and Twig block/loop/conditional tag pairs
  were checked in representative changed files.
- `tests/vaultfy-smoke.php` checks structural bindings, and additionally
  invokes the Twig parser **when Composer is installed**.

The current execution environment has PHP CLI but **not** Composer/Twig
dependencies or network access to install them. It cannot render Twsaa's
PHP theme faithfully, and has not performed a real rendered comparison.
No live cart, price-option, checkout or payment behavior is claimed tested.

## Remaining blockers for release

1. In the user's Windows checkout, copy the original image to
   `assets/images/vaultfy-logo.png`. Its uploaded PNG has a white
   background, which will remain white; supply a transparent original
   export if you want seamless dark-header rendering.
2. Run `composer install` and `php tests/vaultfy-smoke.php`, resolve any
   parser errors, and start `php -S 127.0.0.1:8000`.
3. Add real Vaultfy banner and portrait card artwork in the Twsaa
   merchant homepage configuration; the static PHP fixture's products,
   prices and media are generic sample data.
4. Capture equivalent desktop and 440px screenshots of **rendered**
   Vaultfy and compare against the provided UP screenshots.
5. Perform QA at 320, 375, 390, 430, 768, 1024, 1440 and 1920 widths,
   specifically checking no horizontal overflow, no missing images,
   clickable overlays and readable content.
6. Verify on a **Twsaa test store**: subscription variants, live price
   updates, cart quantity, coupons, login, checkout, digital delivery
   and correct absence of shipping charges for digital-only products.

**Release status:** Development version; do **not** claim a platform-ready
theme ZIP or full UP parity before those validations.
