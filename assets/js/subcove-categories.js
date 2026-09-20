/*
 * SubCove storefront categories.
 *
 * Twsaa sources:
 *  - getFunction('getCategories') in the Twig view (inert, server-rendered fallback).
 *  - GET /category, exactly as in upstream views/layout/navbar.twig.
 *  - category.image_url in upstream category-page views.
 *
 * Only DOM markup/styles belong to the theme. No hard-coded store categories,
 * demo routes, or demo images are used.
 */
(function () {
    'use strict';

    function start() {
        var section = document.getElementById('qs-home-categories');
        var grid = document.getElementById('qs-platform-category-grid');
        var fallback = document.getElementById('qs-platform-category-fallback');
        if (!section || !grid) return;

        var locale = (document.documentElement.lang || 'ar').toLowerCase();
        var imageRequests = new WeakSet();

        function normalizeImage(raw, pageUrl) {
            if (!raw) return '';
            try {
                var result = new URL(raw, pageUrl || window.location.href);
                if (result.protocol === 'https:' || result.protocol === 'http:') {
                    return result.href;
                }
            } catch (error) {
                // Missing or malformed merchant category image: keep the card.
            }
            return '';
        }

        function directLink(li) {
            for (var i = 0; i < li.children.length; i++) {
                if (li.children[i].tagName === 'A') return li.children[i];
            }
            return null;
        }

        function loadCategoryImage(card, categoryUrl) {
            if (imageRequests.has(card)) return;
            imageRequests.add(card);

            fetch(categoryUrl, { credentials: 'same-origin' })
                .then(function (response) {
                    if (!response.ok) throw new Error('Category page HTTP ' + response.status);
                    return response.text();
                })
                .then(function (html) {
                    var page = new DOMParser().parseFromString(html, 'text/html');
                    var element = page.querySelector('.category-block .hero-image img[src]');
                    if (!element || !card.isConnected || card.querySelector('img')) return;

                    var src = normalizeImage(element.getAttribute('src'), categoryUrl);
                    if (!src) return;

                    var picture = document.createElement('img');
                    picture.src = src;
                    picture.alt = card.querySelector('.home-service-link-card__content strong').textContent;
                    picture.className = 'home-service-link-card__image';
                    picture.loading = 'lazy';
                    picture.decoding = 'async';
                    card.querySelector('.home-service-link-card__media').appendChild(picture);
                })
                .catch(function () {
                    // The category may not have an image. Never substitute a demo image.
                });
        }

        function render(html, source) {
            if (typeof html !== 'string' || !html.trim()) return false;

            /*
             * /category returns an HTML fragment of top-level <li> elements,
             * not an <ul> or JSON category array. Wrap the fragment in a real
             * <ul> before parsing. Embedded upstream <script>s remain inert.
             */
            var list = document.createElement('ul');
            list.innerHTML = html;
            var nodes = Array.prototype.filter.call(list.children, function (el) {
                return el.tagName === 'LI' && el.hasAttribute('parent');
            });

            // Some production responses omit the parent marker; the official
            // category template still renders every top-level item as a direct li.
            if (!nodes.length) {
                nodes = Array.prototype.filter.call(list.children, function (el) {
                    return el.tagName === 'LI';
                });
            }

            var cards = document.createDocumentFragment();
            var needsImage = [];

            nodes.forEach(function (li) {
                var source = directLink(li);
                if (!source) return;

                var name = (source.textContent || '').trim();
                var href = (source.getAttribute('href') || '').trim();
                if (!name || !href || href === '#') return;

                var pageUrl;
                try {
                    pageUrl = new URL(href, window.location.href);
                } catch (error) {
                    return;
                }

                // The upstream preview includes /products and /brands alongside
                // genuine categories. Neither is a category card.
                if (pageUrl.origin !== window.location.origin ||
                    !/^https?:$/.test(pageUrl.protocol) ||
                    ['/products', '/brands'].indexOf(pageUrl.pathname.replace(/\/$/, '')) !== -1) {
                    return;
                }

                var card = document.createElement('a');
                card.className = 'home-service-link-card';
                card.href = pageUrl.href;

                var media = document.createElement('div');
                media.className = 'home-service-link-card__media';

                var platformImage = source.querySelector('img[src]');
                var image = normalizeImage(
                    source.getAttribute('data-category-image') ||
                    (platformImage && platformImage.getAttribute('src')) || '',
                    window.location.href
                );

                if (image) {
                    var picture = document.createElement('img');
                    picture.src = image;
                    picture.alt = name;
                    picture.className = 'home-service-link-card__image';
                    picture.loading = 'lazy';
                    picture.decoding = 'async';
                    media.appendChild(picture);
                } else {
                    needsImage.push({ card: card, url: pageUrl.href });
                }

                var description = document.createElement('div');
                description.className = 'home-service-link-card__content';

                var title = document.createElement('strong');
                title.textContent = name;
                var label = document.createElement('span');
                label.textContent = locale === 'ar' ? 'عرض المنتجات' : 'View products';
                description.appendChild(title);
                description.appendChild(label);

                var arrow = document.createElement('span');
                arrow.className = 'home-service-link-card__arrow';
                arrow.setAttribute('aria-hidden', 'true');
                arrow.textContent = '←';

                card.appendChild(media);
                card.appendChild(description);
                card.appendChild(arrow);
                cards.appendChild(card);
            });

            if (!cards.childElementCount) return false;

            // Twsaa's Vue initialization may replace the homepage DOM after
            // the first paint. Never write a late AJAX response into a detached
            // grid captured when this script first ran.
            var activeGrid = document.getElementById('qs-platform-category-grid');
            var activeSection = document.getElementById('qs-home-categories');
            if (!activeGrid || !activeSection || !activeGrid.isConnected) return false;

            activeGrid.replaceChildren(cards);
            activeGrid.setAttribute('data-category-source', source || 'platform');
            activeGrid.setAttribute('aria-busy', 'false');
            activeSection.hidden = false;

            if (needsImage.length) {
                if ('IntersectionObserver' in window) {
                    var observer = new IntersectionObserver(function (entries) {
                        entries.forEach(function (entry) {
                            if (!entry.isIntersecting) return;
                            observer.unobserve(entry.target);
                            var item = needsImage.find(function (candidate) {
                                return candidate.card === entry.target;
                            });
                            if (item) loadCategoryImage(item.card, item.url);
                        });
                    }, { rootMargin: '200px' });
                    needsImage.forEach(function (item) { observer.observe(item.card); });
                } else {
                    needsImage.forEach(function (item) {
                        loadCategoryImage(item.card, item.url);
                    });
                }
            }

            return true;
        }

        // Render upstream getCategories() as soon as possible, then refresh from
        // the same /category endpoint the official navbar relies upon.
        var fallbackHtml = fallback ? fallback.innerHTML : '';
        var hasCategories = render(fallbackHtml, 'server');

        // Twsaa's own navbar uses jQuery AJAX with the identical endpoint.
        // Its live response may be raw HTML or { html: '...' }.
        if (typeof window.jQuery !== 'function') {
            console.warn('SubCove categories: jQuery is unavailable; using platform function output.');
            return;
        }

        window.jQuery.ajax({
            url: '/category',
            type: 'GET',
            success: function (response) {
                var html = response && typeof response.html === 'string'
                    ? response.html
                    : response;

                if (render(html, 'endpoint')) {
                    hasCategories = true;
                } else {
                    console.warn('SubCove categories: /category has no top-level links.');
                }
            },
            error: function (xhr) {
                console.warn('SubCove categories: /category HTTP', xhr.status);
                var activeGrid = document.getElementById('qs-platform-category-grid');
                if (!activeGrid) return;

                // A Vue re-render may have detached the first set of fallback
                // cards. Reapply the official function data to the live grid.
                if (!activeGrid.querySelector('.home-service-link-card') &&
                    !render(fallbackHtml, 'server')) {
                    activeGrid.setAttribute('aria-busy', 'false');
                    activeGrid.textContent = locale === 'ar'
                        ? 'تعذر تحميل الأقسام حاليًا'
                        : 'Categories are temporarily unavailable';
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
