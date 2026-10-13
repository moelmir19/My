# Vaultfy — screenshot-guided Twsaa Twig rebuild

**Source branch:** official Twsaa `twig-theme` starter at
`04207778c898c6ceabeda5245f3d43ff8c6c1e17`.
**Implementation branch:** `vaultfy-upstore-from-scratch`.
`main` and every earlier Vaultfy design branch remain untouched.

## Reference and identity

The user provided three screenshots of up-store.net (desktop header/hero,
desktop poster gallery, iPhone 16 Pro Max responsive preview) on 13 October
2026. Implement the *layout* and proportions, not their artwork, branding,
domain, copyrighted characters or slogans. Vaultfy's own dark
black/steel-blue palette, store logo, merchant banner and platform content
are used instead.

### Screenshot-to-theme mapping

| Reference observation | Implementation |
| --- | --- |
| Near-black page background | `assets/css/vaultfy.css` variables, dark surfaces |
| Centered logo, utilities at left, currency/language at right | `views/layout/header.twig` |
| Multirow right-aligned categories, wide search at left | `header.twig` and native `/category` menu |
| Wide desktop hero, 3:1 mobile hero | `views/custom/bold-banner.twig` with Twsaa banner settings |
| Three tall category posters per row on both devices | `custom/vaultfy-posters.twig` or category fallback |
| Compact mobile centered logo + search/hamburger | `header.twig`, `assets/js/vaultfy.js` |
| Category posters with CTA and label | Branded `vf-category-poster` cards |

### Where category card images come from

**Preferred**: in Twsaa's homepage designer, add a **list_of_items** block
with poster artwork, category title and link. Its items render in the same
three-column gallery as the reference. The theme uses your configured
`image`, `name` and `link` values exactly.

**Fallback**: if no such block exists, homepage cards are built from the
native `/category` endpoint, via `views/category/index.twig`. When a
category has an `image_url`, the card uses it. If it has no image, a
dark branded placeholder appears. **To visually match poster artwork,**
supply portrait images for each category in Twsaa; CSS cannot recover
the other store's art.

For the closest visual match, category posters should be portrait-oriented
(approximately 9:16), and the merchant hero should be approximately 3:1.

### Original Twsaa functionality preserved

- `homeContent` product blocks, product pricing, category URLs
- Search suggestions via existing `.ui.search .search-box` JS
- Existing route handlers for wishlist, add-to-cart and cart quantity
- Merchant logo/banner/footer metadata, currencies and locale switch
- Account login modal and logged-in customer dropdown

Changes are visual/template modifications. No checkout or payment route was
reimplemented. Avoid replacing native scripts/functions with hardcoded
sample data.

### Changed files

- `views/layout/header.twig`
- `views/layout/main.twig` (brand stylesheet/script, proper RTL)
- `views/home/index.twig` (banner first; curated poster gallery then products)
- `views/custom/bold-banner.twig` (banner styling and time-window bug fix)
- `views/custom/vaultfy-posters.twig` (new, native merchant-curated posters)
- `views/category/index.twig` (native category thumb URL metadata)
- `views/layout/footer.twig` (merchant brand)
- `assets/css/vaultfy.css`
- `assets/js/vaultfy.js`
- `tests/vaultfy-smoke.php`

### Structural checks and deployment

```bash
php tests/vaultfy-smoke.php
node --check assets/js/vaultfy.js
```

The above are structural checks; they **do not** test Twsaa production
rendering, cart AJAX or payment gateway behavior. Before uploading publicly,
preview on the merchant's Twsaa test store on desktop and mobile. Verify:

- logo, multirow menu, mobile toggle and mobile search
- banner availability and merchant category/poster images
- 3-up gallery at 440px and at desktop widths
- product sections from Twsaa, selectable plans and dynamic prices
- cart count, checkout, login, currency/language, CMS/footer links
- contrast/accessibility on all secondary pages

Do not assume screenshot-level fidelity until merchant images and side-by-side
live browser checks are completed.
