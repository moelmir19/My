# Vaultfy — Twsaa Twig storefront rebuild

This branch was created from the official Twsaa starter commit
`04207778c898c6ceabeda5245f3d43ff8c6c1e17` — **not** from the
previous Vaultfy redesign. `main` and earlier work branches are untouched.

## Goal
Adapt the layout of a digital-subscription storefront (reference:
`up-store.net`) to Vaultfy's restrained, dark identity, using original
Twsaa functions, hooks and page routes. This is a clean-room adaptation:
**no source code, product imagery, logos or testimonials have been copied
from the reference website.** Pixel-perfect matching requires desktop and
mobile reference screenshots and browser comparison.

## Files changed
- `assets/css/vaultfy.css`: global theme tokens; responsive header,
  navigation, product cards, categories, cart/details/footer; dark contrast.
- `assets/js/vaultfy.js`: copies the public category anchors returned by
  Twsaa's `/category` endpoint into home category tiles, and handles mobile
  search disclosure (does **not** replace commerce or search logic).
- `views/layout/main.twig`: loads the two assets via Twsaa's `assets`
  helper, and sets correct document language and direction.
- `views/layout/header.twig`: Vaultfy announcement and Arabic search hint;
  merchant logo remains fetched from Twsaa store settings.
- `views/home/index.twig`: retains all official `homeContent` blocks and
  asynchronous product rendering. Displays platform categories using native
  data; fallback hero and trust cards appear only if the corresponding
  sections are missing in the Twsaa store configuration.

## Platform behavior not rewritten
Twsaa product URLs, live prices and variants, cart AJAX and CSRF, checkout,
customer login, customer reviews, languages, currency and payment methods
remain in the official Twig starter.

## Identity assets
Merchant logo and banners are **not embedded**: upload Vaultfy logo/banner
through the merchant's own Twsaa control panel. Font fallback references
`Thmanyah`; to guarantee the exact font, provide a licensed webfont file
and add an `@font-face` definition yourself.

## Validate
```bash
php tests/vaultfy-smoke.php
node --check assets/js/vaultfy.js
```
These are structural smoke checks only, **not** Twsaa server or live
checkout tests. Test on a platform preview store before publishing:
homepage banner + categories, product card price, plan options, cart
without shipping, login, checkout, mobile search, and dark legibility.

## Review status
First implementation/visual foundation. Requires side-by-side desktop and
mobile screenshots of `up-store.net` and an actual Twsaa theme preview to
confirm exact spacing, typography, proportions, and platform compatibility.
