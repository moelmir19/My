/* Vaultfy interaction layer: presentation-only. Commerce/search/cart stay native to Twsaa. */
(function(){
  'use strict';
  function init(){
    var header = document.querySelector('header');
    var search = header && header.querySelector('.top-links-1 > li:has(.top-links-search)');
    if(search){
      var trigger = search.querySelector('.top-links-search');
      if(trigger){
        trigger.setAttribute('role','button');
        trigger.setAttribute('tabindex','0');
        trigger.setAttribute('aria-label','بحث في المنتجات');
        trigger.setAttribute('aria-expanded','false');
        function toggle(e){
          if(window.matchMedia('(max-width: 767px)').matches){
            e.preventDefault();e.stopPropagation();
            var open = search.classList.toggle('vf-search-open');
            trigger.setAttribute('aria-expanded',String(open));
            if(open){ var input=search.querySelector('input.search-box'); if(input)input.focus(); }
          }
        }
        trigger.addEventListener('click',toggle);
        trigger.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){toggle(e);}});
      }
    }
    var nav = document.querySelector('#cat-here');
    var section=document.querySelector('#vf-categories');
    var grid=document.querySelector('#vf-category-grid');
    if(!nav||!section||!grid)return;
    function sync(){
      var links=Array.from(nav.querySelectorAll(':scope > li > a[href]')).filter(function(a){
        return a.getAttribute('href')&&a.textContent.trim()&&a.getAttribute('href')!=='#';
      });
      if(!links.length)return;
      var used=new Set();
      grid.textContent='';
      links.slice(0,18).forEach(function(link){
        var label=link.textContent.trim().replace(/\s+/g,' ');
        var href=link.getAttribute('href');
        if(used.has(href))return;
        used.add(href);
        var a=document.createElement('a');a.className='vf-category-tile';a.href=href;
        var icon=document.createElement('span');icon.className='vf-category-tile__icon';
        icon.textContent=label.slice(0,1);
        var title=document.createElement('span');title.className='vf-category-tile__text';title.textContent=label;
        a.append(icon,title);grid.append(a);
      });
      section.hidden=grid.children.length===0;
    }
    sync();
    var observer=new MutationObserver(sync);
    observer.observe(nav,{childList:true,subtree:true});
    window.setTimeout(function(){observer.disconnect();},12000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();