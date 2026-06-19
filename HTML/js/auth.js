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

  function updateNavUser(phone, name) {
    var bL = document.getElementById('btnLogin');
    if (bL) bL.style.display = 'none';
    var uG = document.getElementById('userGreeting');
    if (uG) uG.style.display = 'flex';
    var ua = document.getElementById('userAvatar');
    if (ua) ua.textContent = (name || phone).slice(-2);
    var up = document.getElementById('userPhone');
    if (up) up.textContent = (phone || '').slice(0, 3) + '****' + (phone || '').slice(-4);
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

    // Tab switching
    var tabLogin = document.getElementById('tabLogin');
    var tabReg = document.getElementById('tabReg');
    var loginForm = document.getElementById('loginForm');
    var regForm = document.getElementById('regForm');

    function switchTab(toLoginTab) {
      if (!tabLogin) return;
      if (toLoginTab) {
        tabLogin.classList.add('active');
        if (tabReg) tabReg.classList.remove('active');
        if (loginForm) loginForm.classList.add('active');
        if (regForm) regForm.classList.remove('active');
      } else {
        if (tabReg) tabReg.classList.add('active');
        tabLogin.classList.remove('active');
        if (regForm) regForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
      }
    }

    if (tabLogin) tabLogin.addEventListener('click', function() { switchTab(true); });
    if (tabReg) tabReg.addEventListener('click', function() { switchTab(false); });
    var tR = document.getElementById('toRegister');
    if (tR) tR.addEventListener('click', function() { switchTab(false); });
    var tL = document.getElementById('toLogin');
    if (tL) tL.addEventListener('click', function() { switchTab(true); });

    // SMS button — Login
    var lSms = document.getElementById('loginSmsBtn');
    if (lSms) lSms.addEventListener('click', function() {
      var phone = document.getElementById('loginPhone');
      if (!phone) return;
      var phoneVal = phone.value.trim();
      var origText = lSms.textContent;
      lSms.disabled = true;
      requestSmsCode(phoneVal, null, function() {
        lSms.disabled = false;
        lSms.textContent = origText;
      });
      startCountdown(lSms);
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

    // Login submit
    var lSub = document.getElementById('loginSubmit');
    if (lSub) lSub.addEventListener('click', function() {
      var phoneEl = document.getElementById('loginPhone');
      var codeEl = document.getElementById('loginCode');
      if (!phoneEl || !codeEl) return;
      var phone = phoneEl.value.trim();
      var code = codeEl.value.trim();
      if (!isValidPhone(phone)) { alert('请输入有效的手机号'); return; }
      if (!code) { alert('请先获取验证码'); return; }
      var origText = lSub.textContent;
      lSub.disabled = true; lSub.textContent = '登录中…';
      login(phone, code, function(u) {
        if (overlay) overlay.classList.remove('show');
        var target = getTargetAfterAuth();
        if (!target) {
          target = u.role === 'admin' ? 'admin.html' : u.role === 'seller' ? 'seller.html' : u.role === 'buyer' ? 'buyer.html' : 'member.html';
        }
        setTimeout(function() { window.location.href = target; }, 400);
      }, function() {
        lSub.disabled = false; lSub.textContent = origText;
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
