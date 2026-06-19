/**
 * xiaoweimm — Shared Authentication & API Module
 * Replaces client-side-only auth with server-side JWT validation.
 * All 16+ HTML pages should include this file and remove their duplicated auth code.
 */
(function(global) {
  'use strict';

  var TOKEN_KEY = 'xiaoweimm_token';
  var USER_KEY = 'xiaoweimm_user';
  var REDIRECT_KEY = 'redirectAfterLogin';

  // ── Token helpers ──────────────────────────────────────────────────

  function getToken() {
    var raw = sessionStorage.getItem(TOKEN_KEY);
    if (raw) return raw;
    // Fallback: read token from legacy xiaoweimm_user object
    try {
      var u = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
      if (u && u.token) return u.token;
    } catch(e) {}
    return null;
  }

  function setToken(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify({
      phone: user.phone,
      role: user.role,
      name: user.name || '',
      time: Date.now(),
      token: token
    }));
  }

  function clearAuth() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  // ── Validation ─────────────────────────────────────────────────────

  function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  // ── Countdown (shared by all SMS buttons) ──────────────────────────

  function startCountdown(btn, seconds) {
    var sec = seconds || 60;
    btn.disabled = true;
    btn.textContent = sec + '秒后重发';
    var origText = btn.getAttribute('data-orig-text') || btn.textContent;
    btn.setAttribute('data-orig-text', origText);
    var timer = setInterval(function() {
      sec--;
      btn.textContent = sec + '秒后重发';
      if (sec <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = btn.getAttribute('data-orig-text') || '获取验证码';
      }
    }, 1000);
  }

  // ── Server-side SMS (replaces generateDevCode) ─────────────────────

  function requestSmsCode(phone, onSuccess, onError) {
    if (!isValidPhone(phone)) {
      alert('请输入有效的手机号');
      if (onError) onError();
      return;
    }
    fetch('/api/auth/sms-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone })
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.success) {
          if (d.data && d.data.dev_mode) {
            // Dev mode: code is NOT returned to client anymore.
            // Check server console logs for the code.
            console.log('[DEV] SMS code sent. Check server logs for code for phone ' + phone.slice(-4));
            alert('验证码已发送（开发模式：请查看服务器日志获取验证码）');
          } else {
            alert('验证码已发送至 ' + phone);
          }
          if (onSuccess) onSuccess(d);
        } else {
          alert('发送失败：' + ((d && d.error) || '未知错误'));
          if (onError) onError();
        }
      }).catch(function(e) {
        alert('网络错误：' + (e.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  // ── Login / Register (server-side) ─────────────────────────────────

  // ── Password login (server-side) ───────────────────────────────────

  function passwordLogin(phone, password, onSuccess, onError) {
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, password: password })
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.success && d.data && d.data.token) {
          var u = d.data;
          setToken(u.token, u);
          updateNavUser(u.phone, u.name);
          if (onSuccess) onSuccess(u);
        } else {
          alert('登录失败：' + ((d && d.error) || '密码错误'));
          if (onError) onError();
        }
      }).catch(function(e) {
        alert('网络错误：' + (e.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function login(phone, code, onSuccess, onError) {
    fetch('/api/auth/login-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, code: code })
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.success && d.data && d.data.token) {
          var u = d.data;
          setToken(u.token, u);
          updateNavUser(u.phone, u.name);
          if (onSuccess) onSuccess(u);
        } else {
          alert('登录失败：' + ((d && d.error) || '未知错误'));
          if (onError) onError();
        }
      }).catch(function(e) {
        alert('网络错误：' + (e.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function register(phone, code, name, role, onSuccess, onError) {
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, code: code, name: name, role: role })
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.success && d.data && d.data.token) {
          var u = d.data;
          setToken(u.token, u);
          updateNavUser(u.phone, u.name);
          if (onSuccess) onSuccess(u);
        } else {
          alert('注册失败：' + ((d && d.error) || '未知错误'));
          if (onError) onError();
        }
      }).catch(function(e) {
        alert('网络错误：' + (e.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function logout() {
    clearAuth();
    var bL = document.getElementById('btnLogin');
    if (bL) bL.style.display = '';
    var uG = document.getElementById('userGreeting');
    if (uG) uG.style.display = 'none';
    alert('已退出登录');
  }

  // ── UI helpers ─────────────────────────────────────────────────────

  function updateNavUser(phone, name, role) {
    var bL = document.getElementById('btnLogin');
    if (bL) bL.style.display = 'none';
    var uG = document.getElementById('userGreeting');
    if (uG) uG.style.display = 'flex';
    var ua = document.getElementById('userAvatar');
    if (ua) ua.textContent = (name || phone).slice(-2);
    var up = document.getElementById('userPhone');
    if (up) up.textContent = (phone || '').slice(0, 3) + '****' + (phone || '').slice(-4);
    // Role-based link: admin → 管理后台, others → 会员中心
    var role = role || '';
    var memberLink = document.querySelector('#userGreeting a[href*=\"member.html\"], #userGreeting a[href*=\"admin.html\"]');
    if (!role) {
      try { var u = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); role = (u && u.role) || ''; } catch(e) {}
    }
    if (memberLink) {
      if (role === 'admin') {
        memberLink.href = 'admin.html';
        memberLink.textContent = '管理后台';
      } else {
        memberLink.href = 'member.html';
        memberLink.textContent = '会员中心';
      }
    }
  }

  // ── Role Guard (replaces client-side authCheck IIFE) ───────────────

  function requireRole(allowedRoles, pageName) {
    var token = getToken();
    if (!token) {
      sessionStorage.setItem(REDIRECT_KEY, pageName);
      alert('请先登录');
      window.location.href = 'index.html';
      return;
    }

    // Validate token against backend
    fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.success && d.data) {
          var user = d.data;
          // Store updated user data
          sessionStorage.setItem(USER_KEY, JSON.stringify({
            phone: user.phone, role: user.role, name: user.name || '',
            time: Date.now(), token: token
          }));
          // Check role
          if (allowedRoles.indexOf(user.role) === -1) {
            var roleMap = { seller: 'seller.html', buyer: 'buyer.html', admin: 'admin.html' };
            alert('此页面仅 ' + allowedRoles.join('/') + ' 可访问');
            window.location.href = roleMap[user.role] || 'index.html';
            return;
          }
          // Valid — update UI
          updateNavUser(user.phone, user.name);
        } else {
          // Token invalid — clear and redirect
          clearAuth();
          sessionStorage.setItem(REDIRECT_KEY, pageName);
          alert('登录已过期，请重新登录');
          window.location.href = 'index.html';
        }
      }).catch(function(e) {
        // Network error — fallback to sessionStorage as degraded mode
        console.warn('[XW.Auth] Cannot reach server for role check, using cached session');
        try {
          var user = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
          if (user && user.phone) {
            if (allowedRoles.indexOf(user.role) === -1) {
              alert('此页面仅 ' + allowedRoles.join('/') + ' 可访问');
              var roleMap = { seller: 'seller.html', buyer: 'buyer.html', admin: 'admin.html' };
              window.location.href = roleMap[user.role] || 'index.html';
              return;
            }
            updateNavUser(user.phone, user.name);
            return;
          }
        } catch(ex) {}
        clearAuth();
        sessionStorage.setItem(REDIRECT_KEY, pageName);
        alert('请先登录');
        window.location.href = 'index.html';
      });
  }

  // ── getTargetAfterAuth (redirect after login) ──────────────────────

  function getTargetAfterAuth() {
    var r = sessionStorage.getItem(REDIRECT_KEY);
    if (r) { sessionStorage.removeItem(REDIRECT_KEY); return r; }
    return null;
  }

  // ── Page Initialization ────────────────────────────────────────────

  function initPage() {
    // Modal & overlay
    var overlay = document.getElementById('modalOverlay');
    var btnLogin = document.getElementById('btnLogin');
    var modalClose = document.getElementById('modalClose');

    if (btnLogin) btnLogin.addEventListener('click', function() {
      if (overlay) overlay.classList.add('show');
    });
    if (modalClose) modalClose.addEventListener('click', function() {
      if (overlay) overlay.classList.remove('show');
    });
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.classList.remove('show');
      });
    }

    // Tab switching — 3 tabs: 手机登录 | 密码登录 | 注册
    var tabPhone = document.getElementById('tabPhone') || document.getElementById('tabLogin');
    var tabPwd  = document.getElementById('tabPwd');
    var tabReg  = document.getElementById('tabReg');
    var phoneForm = document.getElementById('phoneForm') || document.getElementById('loginForm');
    var pwdForm   = document.getElementById('pwdForm');
    var regForm   = document.getElementById('regForm');

    var allTabs = [tabPhone, tabPwd, tabReg].filter(Boolean);
    var allForms = [phoneForm, pwdForm, regForm].filter(Boolean);

    function switchTab(tab) {
      allTabs.forEach(function(t) { t.classList.remove('active'); });
      allForms.forEach(function(f) { f.classList.remove('active'); });
      tab.classList.add('active');
      if (tab === tabPhone && phoneForm) phoneForm.classList.add('active');
      if (tab === tabPwd  && pwdForm)   pwdForm.classList.add('active');
      if (tab === tabReg  && regForm)   regForm.classList.add('active');
    }

    if (tabPhone) tabPhone.addEventListener('click', function() { switchTab(tabPhone); });
    if (tabPwd)   tabPwd.addEventListener('click', function() { switchTab(tabPwd); });
    if (tabReg)   tabReg.addEventListener('click', function() { switchTab(tabReg); });
    var tR = document.getElementById('toRegister');
    if (tR) tR.addEventListener('click', function() { switchTab(tabReg); });
    var tL = document.getElementById('toPhone') || document.getElementById('toLogin');
    if (tL) tL.addEventListener('click', function() { switchTab(tabPhone); });
    var tP = document.getElementById('toPwd');
    if (tP) tP.addEventListener('click', function() { switchTab(tabPwd); });

    // SMS button — phone login
    var phSms = document.getElementById('phoneSmsBtn') || document.getElementById('loginSmsBtn');
    if (phSms) phSms.addEventListener('click', function() {
      var phone = document.getElementById('phoneLoginPhone') || document.getElementById('loginPhone');
      if (!phone) return;
      var phoneVal = phone.value.trim();
      var origText = phSms.textContent;
      phSms.disabled = true;
      requestSmsCode(phoneVal, null, function() {
        phSms.disabled = false;
        phSms.textContent = origText;
      });
      startCountdown(phSms);
    });

    // SMS button — Register
    var rSms = document.getElementById('regSmsBtn');
    if (rSms) rSms.addEventListener('click', function() {
      var phone = document.getElementById('regPhone');
      if (!phone) return;
      var phoneVal = phone.value.trim();
      var origText = rSms.textContent;
      rSms.disabled = true;
      requestSmsCode(phoneVal, null, function() {
        rSms.disabled = false;
        rSms.textContent = origText;
      });
      startCountdown(rSms);
    });

    // Phone (SMS) login submit
    var phSub = document.getElementById('phoneSubmit') || document.getElementById('loginSubmit');
    if (phSub) phSub.addEventListener('click', function() {
      var phoneEl = document.getElementById('phoneLoginPhone') || document.getElementById('loginPhone');
      var codeEl  = document.getElementById('phoneLoginCode')  || document.getElementById('loginCode');
      if (!phoneEl || !codeEl) return;
      var phone = phoneEl.value.trim();
      var code = codeEl.value.trim();
      if (!isValidPhone(phone)) { alert('请输入有效的手机号'); return; }
      if (!code) { alert('请先获取验证码'); return; }
      var origText = phSub.textContent;
      phSub.disabled = true; phSub.textContent = '登录中…';
      login(phone, code, function(u) {
        if (overlay) overlay.classList.remove('show');
        var target = getTargetAfterAuth();
        if (!target) {
          target = u.role === 'admin' ? 'admin.html' : u.role === 'seller' ? 'seller.html' : u.role === 'buyer' ? 'buyer.html' : 'member.html';
        }
        setTimeout(function() { window.location.href = target; }, 400);
      }, function() {
        phSub.disabled = false; phSub.textContent = origText;
      });
    });

    // Password login submit
    var pwSub = document.getElementById('pwdSubmit');
    if (pwSub) pwSub.addEventListener('click', function() {
      var phoneEl = document.getElementById('pwdLoginPhone');
      var pwdEl   = document.getElementById('pwdLoginPassword');
      if (!phoneEl || !pwdEl) return;
      var phone = phoneEl.value.trim();
      var pwd = pwdEl.value;
      if (!isValidPhone(phone)) { alert('请输入有效的手机号'); return; }
      if (!pwd) { alert('请输入密码'); return; }
      var origText = pwSub.textContent;
      pwSub.disabled = true; pwSub.textContent = '登录中…';
      passwordLogin(phone, pwd, function(u) {
        if (overlay) overlay.classList.remove('show');
        var target = getTargetAfterAuth();
        if (!target) {
          target = u.role === 'admin' ? 'admin.html' : u.role === 'seller' ? 'seller.html' : u.role === 'buyer' ? 'buyer.html' : 'member.html';
        }
        setTimeout(function() { window.location.href = target; }, 400);
      }, function() {
        pwSub.disabled = false; pwSub.textContent = origText;
      });
    });

    // Register submit
    var rSub = document.getElementById('regSubmit');
    if (rSub) rSub.addEventListener('click', function() {
      var phoneEl = document.getElementById('regPhone');
      var codeEl = document.getElementById('regCode');
      var nameEl = document.getElementById('regName');
      var roleEl = document.getElementById('regRole');
      var agreeEl = document.getElementById('regAgree');
      if (!phoneEl || !codeEl) return;
      var phone = phoneEl.value.trim();
      var code = codeEl.value.trim();
      var name = nameEl ? nameEl.value.trim() : '';
      var role = roleEl ? roleEl.value : 'buyer';
      if (!isValidPhone(phone)) { alert('请输入有效的手机号'); return; }
      if (!code) { alert('请先获取验证码'); return; }
      if (!role) { alert('请选择使用角色'); return; }
      if (agreeEl && !agreeEl.checked) { alert('请先同意服务协议和隐私政策'); return; }
      var origText = rSub.textContent;
      rSub.disabled = true; rSub.textContent = '注册中…';
      register(phone, code, name, role, function(u) {
        if (overlay) overlay.classList.remove('show');
        var target = getTargetAfterAuth();
        if (!target) {
          target = u.role === 'seller' ? 'seller.html' : u.role === 'buyer' ? 'buyer.html' : 'verify.html';
        }
        setTimeout(function() { window.location.href = target; }, 400);
      }, function() {
        rSub.disabled = false; rSub.textContent = origText;
      });
    });

    // Logout
    var bLg = document.getElementById('btnLogout');
    if (bLg) bLg.addEventListener('click', function() { logout(); });

    // Check existing session
    var user = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    if (user && user.phone) { updateNavUser(user.phone, user.name); }

    // Escape key to close modal
    if (overlay) {
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') overlay.classList.remove('show');
      });
    }
  }

  // ── Expose XW namespace ────────────────────────────────────────────

  var XW = {
    Auth: {
      getToken: getToken,
      setToken: setToken,
      clearAuth: clearAuth,
      isValidPhone: isValidPhone,
      startCountdown: startCountdown,
      requestSmsCode: requestSmsCode,
      login: login,
      passwordLogin: passwordLogin,
      register: register,
      logout: logout,
      updateNavUser: updateNavUser,
      requireRole: requireRole,
      getTargetAfterAuth: getTargetAfterAuth,
      initPage: initPage,
      TOKEN_KEY: TOKEN_KEY,
      USER_KEY: USER_KEY,
      REDIRECT_KEY: REDIRECT_KEY
    }
  };

  global.XW = XW;

})(window);
