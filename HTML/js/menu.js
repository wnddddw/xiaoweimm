/**
 * xiaoweimm — Shared Mobile Navigation Menu
 * Included by all public-facing pages. Handles hamburger toggle,
 * backdrop overlay, and auto-close on link click.
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var icon = document.querySelector('.menu-icon');
    var menu = document.querySelector('.nav-menu') || document.querySelector('.nav-links');
    if (!icon || !menu) return;

    // Create backdrop overlay
    var bd = document.createElement('div');
    bd.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:998;';
    document.body.appendChild(bd);

    function openM() {
      menu.style.display = 'flex';
      menu.style.position = 'absolute';
      menu.style.top = '75px';
      menu.style.left = '0';
      menu.style.width = '100%';
      menu.style.background = '#fff';
      menu.style.flexDirection = 'column';
      menu.style.padding = '20px';
      menu.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
      menu.style.zIndex = '999';
      bd.style.display = 'block';
      icon.textContent = '✕'; // ✕
    }

    function closeM() {
      menu.style.display = '';
      menu.style.position = '';
      menu.style.top = '';
      menu.style.left = '';
      menu.style.width = '';
      menu.style.background = '';
      menu.style.flexDirection = '';
      menu.style.padding = '';
      menu.style.boxShadow = '';
      menu.style.zIndex = '';
      bd.style.display = 'none';
      icon.textContent = '≡'; // ≡
    }

    icon.addEventListener('click', function() {
      if (menu.style.display === 'flex') {
        closeM();
      } else {
        openM();
      }
    });

    bd.addEventListener('click', closeM);

    // Close on any nav link click
    var links = menu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', closeM);
    }
  });

})();
