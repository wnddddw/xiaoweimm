/**
 * xiaoweimm shared mobile navigation menu.
 * Opens public-page nav menus without inline layout styles.
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var icon = document.querySelector('.top-nav .menu-icon');
    var menu = document.querySelector('.top-nav .nav-menu') || document.querySelector('.top-nav .nav-links');
    var topNav = document.querySelector('.top-nav');
    if (!icon || !menu || !topNav) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    topNav.appendChild(backdrop);

    function setOpen(open) {
      menu.classList.toggle('mobile-menu-open', open);
      backdrop.classList.toggle('show', open);
      icon.textContent = open ? '×' : '≡';
      icon.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    icon.setAttribute('role', 'button');
    icon.setAttribute('aria-label', '打开导航菜单');
    icon.setAttribute('aria-expanded', 'false');

    icon.addEventListener('click', function() {
      setOpen(!menu.classList.contains('mobile-menu-open'));
    });

    backdrop.addEventListener('click', function() {
      setOpen(false);
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) setOpen(false);
    });

    Array.prototype.forEach.call(menu.querySelectorAll('a'), function(link) {
      link.addEventListener('click', function() {
        setOpen(false);
      });
    });
  });
})();
