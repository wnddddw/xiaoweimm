// ── 移动端汉堡菜单 ──
document.addEventListener('DOMContentLoaded', function(){
  const icon = document.querySelector('.menu-icon');
  const menu = document.querySelector('.nav-menu');
  if(!icon || !menu) return;

  // 创建遮罩
  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:998;';
  document.body.appendChild(backdrop);

  function openMenu(){
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
    backdrop.style.display = 'block';
    icon.textContent = '✕';
  }

  function closeMenu(){
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
    backdrop.style.display = 'none';
    icon.textContent = '≡';
  }

  icon.addEventListener('click', function(){
    if(menu.style.display === 'flex'){ closeMenu(); }
    else { openMenu(); }
  });

  backdrop.addEventListener('click', closeMenu);

  // 点击菜单项后自动关闭
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
});
