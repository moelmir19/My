import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.SUBCOVE_BASE_URL || 'http://127.0.0.1:8765';
let browser;

before(async () => {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
});

after(async () => {
    if (browser) await browser.close();
});

async function visit(page) {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() =>
        document.querySelectorAll('#qs-platform-category-grid .home-service-link-card').length > 0,
        { timeout: 20000 }
    );
}

test('homepage renders actual Twsaa category data without a manual homepage list', async () => {
    const page = await browser.newPage();
    try {
        await visit(page);
        const count = await page.locator('#qs-platform-category-grid .home-service-link-card').count();
        assert.ok(count > 0, 'Category cards must not be missing');
        assert.ok(await page.locator('a.home-service-link-card[href$="/mob"]').count() > 0,
            'The official fixture contains category mob');
        assert.equal(await page.locator('a.home-service-link-card[href$="/products"]').count(), 0,
            'All-products is not a category');
        assert.equal(await page.locator('a.home-service-link-card[href$="/brands"]').count(), 0,
            'All-brands is not a category');
        assert.equal(await page.locator('.qs-primary-banner, .home-primary-banner').count() > 0, true,
            'SubCove banner wrapper must still exist');
    } finally {
        await page.close();
    }
});

test('fresh /category HTML drives name, URL, image, ordering, and excludes children', async () => {
    const page = await browser.newPage();
    try {
        const html = [
            '<li parent="0"><a href="/netflix" data-category-image="https://cdn.twsaa.com/netflix.png">Netflix</a>',
            '<ul class="cat-sub"><li><a href="/premium">Premium child</a></li></ul></li>',
            '<li parent="1"><a href="/youtube" data-category-image="https://cdn.twsaa.com/youtube.png">YouTube</a></li>',
            '<li parent="2"><a href="/products">All products</a></li>'
        ].join('');

        await page.route('**/category', (route) => route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: html
        }));

        await visit(page);
        await page.waitForFunction(() =>
            document.querySelectorAll('#qs-platform-category-grid .home-service-link-card').length === 2
        );

        const cards = page.locator('#qs-platform-category-grid .home-service-link-card');
        assert.deepEqual(await cards.locator('.home-service-link-card__content strong').allTextContents(), [
            'Netflix',
            'YouTube'
        ]);
        assert.ok((await cards.nth(0).getAttribute('href')).endsWith('/netflix'));
        assert.equal(
            await cards.nth(0).locator('img').getAttribute('src'),
            'https://cdn.twsaa.com/netflix.png'
        );
        assert.equal(await page.locator('#qs-platform-category-grid a[href$="/premium"]').count(), 0);
    } finally {
        await page.close();
    }
});

test('official JSON HTML wrapper is accepted, as well as HTML fragments', async () => {
    const page = await browser.newPage();
    try {
        await page.route('**/category', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                html: '<li parent="0"><a href="/shahid">Shahid</a></li>'
            })
        }));
        await visit(page);
        await page.waitForFunction(() =>
            document.querySelectorAll('#qs-platform-category-grid .home-service-link-card').length === 1
        );
        assert.equal(
            await page.locator('#qs-platform-category-grid .home-service-link-card__content strong').textContent(),
            'Shahid'
        );
    } finally {
        await page.close();
    }
});

test('upstream getCategories function keeps the grid visible when /category fails', async () => {
    const page = await browser.newPage();
    try {
        await page.route('**/category', (route) => route.fulfill({
            status: 503,
            contentType: 'text/plain',
            body: 'Unavailable'
        }));

        await visit(page);
        assert.ok(await page.locator('a.home-service-link-card[href$="/mob"]').count() > 0);
        assert.equal(await page.locator('#qs-platform-category-grid').getAttribute('aria-busy'), 'false');
    } finally {
        await page.close();
    }
});

test('category image may come from its genuine platform category page', async () => {
    const page = await browser.newPage();
    try {
        await page.route('**/category', (route) => route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<li parent="0"><a href="/my-category">My category</a></li>'
        }));
        await page.route('**/my-category', (route) => route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<div class="category-block"><div class="hero-image"><img src="https://cdn.twsaa.com/my-category.jpg"></div></div>'
        }));
        await visit(page);
        await page.waitForFunction(() =>
            document.querySelectorAll('#qs-platform-category-grid .home-service-link-card').length === 1
        );

        await page.locator('a.home-service-link-card[href$="/my-category"]').scrollIntoViewIfNeeded();
        await page.locator('a.home-service-link-card[href$="/my-category"] img').waitFor({ timeout: 12000 });
        assert.equal(
            await page.locator('a.home-service-link-card[href$="/my-category"] img').getAttribute('src'),
            'https://cdn.twsaa.com/my-category.jpg'
        );
    } finally {
        await page.close();
    }
});

test('cards stay in the existing responsive SubCove layout', async () => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
    try {
        await visit(page);
        const desktop = await page.locator('#qs-platform-category-grid').evaluate(
            element => getComputedStyle(element).gridTemplateColumns.split(' ').length
        );
        assert.equal(desktop, 3);

        await page.setViewportSize({ width: 375, height: 812 });
        const mobile = await page.locator('#qs-platform-category-grid').evaluate(
            element => getComputedStyle(element).gridTemplateColumns.split(' ').length
        );
        assert.equal(mobile, 1);
    } finally {
        await page.close();
    }
});

test('local preview renders homepage, categories, product types, cart, and customer routes', async () => {
    const routes = [
        '/',
        '/category',
        '/products',
        '/checkout/cart',
        '/n2-4-5-3',     // simple
        '/k6p8ato',      // virtual
        '/ouu1ro7',      // downloadable
        '/2g663yz',      // configurable
        '/customizable',
        '/kl1pg6w',      // booking
        '/customer/account/profile'
    ];

    for (const path of routes) {
        const response = await fetch(base + path, { signal: AbortSignal.timeout(25000) });
        const body = await response.text();
        assert.equal(response.status, 200, path + ' returned ' + response.status + ': ' + body.slice(0, 400));
        assert.doesNotMatch(body, /Fatal error:|Uncaught Twig\\|Uncaught Error:/i, path);
        assert.match(body, /<html/i, path + ' did not render an HTML page');
    }
});
