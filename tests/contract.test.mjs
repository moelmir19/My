import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const upstream = process.env.TWSAA_UPSTREAM || '/tmp/twsaa-upstream';
const official = (path) => readFileSync(join(upstream, path), 'utf8');

test('CI checks the actual upstream contract, not an invented backend route', () => {
    assert.ok(existsSync(join(upstream, 'views/layout/navbar.twig')),
        'Clone Twsaa/twig-theme as /tmp/twsaa-upstream before running this test');
    assert.match(official('views/layout/navbar.twig'), /url:\s*['"]\/category['"]/);
    assert.match(official('views/category/index.twig'), /for\s+index,\s*category\s+in\s+categories/);
    assert.match(official('src/Twig/CustomTwigExtensions.php'), /public function getCategories\(/);
    assert.match(official('views/products/category.twig'), /category\.image_url/);
    assert.match(official('views/products/view.twig'), /route\('cart\.add',\s*product\.product_id\)/);
    assert.match(official('views/checkout/cart/index.twig'), /route\('shop\.checkout\.cart\.remove'/);
});

test('SubCove homepage includes its original class structure', () => {
    const homepage = read('views/home/index.twig');
    const category = read('views/home/categories-grid.twig');
    const css = read('assets/css/ui-custom.css');
    assert.match(homepage, /home-categories-only/);
    assert.match(homepage, /include 'home\/categories-grid\.twig'/);
    assert.match(category, /home-categories home-demo-services/);
    assert.match(category, /home-demo-services__grid/);
    assert.match(css, /\.home-service-link-card\{/);
    assert.match(css, /\.home-demo-services__grid\{/);
});

test('category names/links/images come from Twsaa and not demo services', () => {
    const category = read('views/home/categories-grid.twig');
    const js = read('assets/js/subcove-categories.js');
    const officialCategory = read('views/category/index.twig');
    assert.match(category, /getFunction\('getCategories'\)/);
    assert.match(js, /fetch\('\/category'/);
    assert.match(js, /data-category-image/);
    assert.match(js, /\.category-block \.hero-image img\[src\]/);
    assert.match(officialCategory, /category\.image_url/);
    assert.match(officialCategory, /category\['slug'\]/);
    assert.doesNotMatch(category + js, /subcove-(netflix|youtube|osn)|\/subscriptions\/|subscriptionDemo\(/i);
    assert.doesNotMatch(read('views/home/index.twig'), /categories_content/);
});

test('the actual local data fixture is a category hierarchy, not homepage cards', () => {
    const fixture = read('data.php');
    const start = fixture.indexOf('function category()');
    assert.ok(start >= 0, 'The official category mock must remain intact');
    const end = fixture.indexOf('\nfunction ', start + 1);
    const categoryFixture = fixture.slice(start, end > 0 ? end : undefined);
    assert.match(categoryFixture, /\$context\['categories'\]\s*=/);
    assert.match(categoryFixture, /"children"\s*=>/);
    assert.match(categoryFixture, /"slug"\s*=>/);
    assert.match(categoryFixture, /"image"\s*=>/);
    assert.match(categoryFixture, /"name"\s*=>/);
    assert.doesNotMatch(categoryFixture, /Netflix|YouTube|OSN/);
});

test('cart/product implementation preserves official route names', () => {
    const product = read('views/products/view.twig');
    const cart = read('views/checkout/cart/index.twig');
    const main = read('views/layout/main.twig');
    assert.match(product, /route\('cart\.add',\s*product\.product_id\)/);
    assert.match(cart, /route\('shop\.checkout\.cart\.update'\)/);
    assert.match(cart, /route\('shop\.checkout\.cart\.remove'/);
    assert.match(cart, /route\('shop\.checkout\.cart\.coupon\.apply'\)/);
    assert.match(main, /route\('cart\.addition',\s*''\)/);
    assert.doesNotMatch(product + cart + main, /\/subscription\/add|\/subscriptions\/(netflix|youtube|osn)|href="\/cart\/remove/);
});

test('store logo, banner, and reviews use platform data instead of demo assets', () => {
    const header = read('views/layout/header.twig');
    const footer = read('views/layout/footer.twig');
    const homepage = read('views/home/index.twig');
    const reviews = read('views/home/faq-reviews.twig');
    assert.match(header, /storage_url\s*~\s*channel\.logo/);
    assert.match(footer, /storage_url\s*~\s*channel\.logo/);
    assert.match(homepage, /homeContent/);
    assert.match(homepage, /custom\/bold-banner\.twig/);
    assert.match(reviews, /settings'\]\['reviews'/);
    assert.doesNotMatch(homepage + reviews, /subcove-banner\.png|بناءً على 121 تقييم/);
});
