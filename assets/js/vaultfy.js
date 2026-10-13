/* Vaultfy visual behavior only; checkout, pricing, search suggestions and cart stay Twsaa-native. */
(function () {
  'use strict';

  function run() {
    var header = document.querySelector('.vf-site-header');
    if (!header) return;
    var searchBtn = header.querySelector('.vf-mobile-search');
    var menuBtn = header.querySelector('.vf-menu-toggle');
    var mobile = window.matchMedia('(max-width: 767px)');
    var searchInput = header.querySelector('.search-box');

    function state(which, open) {
      var cls = which === 'search' ? 'vf-search-open' : 'vf-nav-open';
      var button = which === 'search' ? searchBtn : menuBtn;
      if (button) button.setAttribute('aria-expanded', String(!!open));
      header.classList.toggle(cls, !!open);
      if (which === 'search' && open && searchInput) searchInput.focus();
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        if (!mobile.matches) return;
        var next = !header.classList.contains('vf-search-open');
        state('menu', false);
        state('search', next);
      });
    }
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        if (!mobile.matches) return;
        var next = !header.classList.contains('vf-nav-open');
        state('search', false);
        state('menu', next);
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { state('search', false); state('menu', false); }
    });
    document.addEventListener('click', function (event) {
      if (mobile.matches && !header.contains(event.target)) {
        state('search', false); state('menu', false);
      }
    });
    window.addEventListener('resize', function () {
      if (!mobile.matches) { state('search', false); state('menu', false); }
    }, {passive: true});

    var nativeNav = document.querySelector('#cat-here');
    var section = document.querySelector('#vf-categories');
    var grid = document.querySelector('#vf-category-grid');
    if (!nativeNav || !section || !grid) return;

    function createPoster(link, index) {
      var name = (link.textContent || '').trim().replace(/\s+/g, ' ');
      var href = link.getAttribute('href') || '';
      var imageUrl = link.getAttribute('data-vf-image') || '';
      if (!imageUrl) {
        var nestedImage = link.querySelector('img');
        if (nestedImage) imageUrl = nestedImage.getAttribute('src') || '';
      }

      var card = document.createElement('a');
      card.className = 'vf-category-poster vf-category-poster--' + (index % 6 + 1);
      card.href = href;
      card.setAttribute('aria-label', name);

      var media = document.createElement('span');
      media.className = 'vf-category-poster__media';
      var placeholder = document.createElement('span');
      placeholder.className = 'vf-category-poster__placeholder';
      var large = document.createElement('span');
      large.className = 'vf-category-poster__initial';
      large.textContent = name.charAt(0);
      var small = document.createElement('span');
      small.className = 'vf-category-poster__fallback-name';
      small.textContent = name;
      placeholder.append(large, small);
      media.appendChild(placeholder);

      if (/^(https?:\/\/|\/\/|\/)/i.test(imageUrl)) {
        var img = document.createElement('img');
        img.className = 'vf-category-poster__image';
        img.src = imageUrl;
        img.alt = name;
        img.loading = index < 3 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', function () {
          media.classList.add('vf-category-poster__media--has-image');
        });
        img.addEventListener('error', function () { img.remove(); });
        media.appendChild(img);
      }

      var pill = document.createElement('span');
      pill.className = 'vf-category-poster__pill';
      pill.textContent = 'اضغط هنا';
      media.appendChild(pill);

      var caption = document.createElement('span');
      caption.className = 'vf-category-poster__caption';
      caption.textContent = name;
      card.append(media, caption);
      return card;
    }

    function renderCategories() {
      var links = Array.from(nativeNav.querySelectorAll(':scope > li > a[href]'));
      var unique = new Set();
      var fragment = document.createDocumentFragment();
      var count = 0;
      links.forEach(function (link) {
        if (count >= 24) return;
        var href = link.getAttribute('href');
        var label = (link.textContent || '').trim();
        if (!href || href === '#' || !label || unique.has(href)) return;
        unique.add(href);
        fragment.appendChild(createPoster(link, count));
        count++;
      });
      if (!count) return;
      grid.replaceChildren(fragment);
      section.hidden = false;
    }

    renderCategories();
    var observer = new MutationObserver(renderCategories);
    observer.observe(nativeNav, {childList: true, subtree: true, characterData: true});
    setTimeout(function () { observer.disconnect(); }, 20000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();