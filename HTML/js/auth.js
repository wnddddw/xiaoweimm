/**
 * Shared Authentication & API Module
 */
(function(global) {
  'use strict';

  var TOKEN_KEY = 'xiaoweimm_token';
  var USER_KEY = 'xiaoweimm_user';
  var REDIRECT_KEY = 'redirectAfterLogin';
  var TOAST_ROOT_ID = 'xwAuthToastRoot';
  var TOAST_ID = 'xwAuthToast';
  var toastTimer = null;

  function getToken() {
    var raw = sessionStorage.getItem(TOKEN_KEY);
    if (raw) return raw;
    try {
      var user = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
      if (user && user.token) return user.token;
    } catch (error) {}
    return null;
  }

  function getStoredUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    } catch (error) {
      return null;
    }
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

  function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  function ensureToast() {
    if (!document || !document.body) return null;

    var root = document.getElementById(TOAST_ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = TOAST_ROOT_ID;
      root.style.position = 'fixed';
      root.style.top = '20px';
      root.style.left = '50%';
      root.style.transform = 'translateX(-50%)';
      root.style.zIndex = '10020';
      root.style.pointerEvents = 'none';
      root.style.width = 'min(92vw, 420px)';
      document.body.appendChild(root);
    }

    var toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = TOAST_ID;
      toast.style.display = 'none';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '14px';
      toast.style.boxShadow = '0 14px 32px rgba(15, 23, 42, 0.18)';
      toast.style.fontSize = '14px';
      toast.style.lineHeight = '1.5';
      toast.style.fontWeight = '600';
      toast.style.textAlign = 'center';
      toast.style.pointerEvents = 'auto';
      toast.style.border = '1px solid transparent';
      toast.style.backdropFilter = 'blur(10px)';
      root.appendChild(toast);
    }

    return toast;
  }

  function showAuthMessage(message, type, duration) {
    var toast = ensureToast();
    if (!toast) {
      console.warn('[XW.Auth]', message);
      return;
    }

    var variant = type || 'error';
    var timeout = typeof duration === 'number' ? duration : 2200;

    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = variant === 'success' ? 'rgba(22, 163, 74, 0.96)' : 'rgba(190, 24, 93, 0.96)';
    toast.style.color = '#fff';
    toast.style.borderColor = variant === 'success' ? 'rgba(187, 247, 208, 0.7)' : 'rgba(251, 207, 232, 0.7)';

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function() {
      toast.style.display = 'none';
    }, timeout);
  }

  function parseJson(response) {
    return response.json().catch(function() {
      return { success: false, error: '服务器返回异常' };
    });
  }

  function startCountdown(btn, seconds) {
    var sec = seconds || 60;
    var originalText = btn.getAttribute('data-orig-text') || btn.textContent;

    btn.setAttribute('data-orig-text', originalText);
    btn.disabled = true;
    btn.textContent = sec + '秒后重发';

    var timer = setInterval(function() {
      sec -= 1;
      btn.textContent = sec + '秒后重发';
      if (sec <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = btn.getAttribute('data-orig-text') || '获取验证码';
      }
    }, 1000);
  }

  function requestSmsCode(phone, onSuccess, onError) {
    if (!isValidPhone(phone)) {
      showAuthMessage('请输入有效的手机号');
      if (onError) onError();
      return;
    }

    fetch('/api/auth/sms-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone })
    }).then(parseJson)
      .then(function(data) {
        if (data && data.success) {
          if (data.data && data.data.dev_mode) {
            console.log('[DEV] SMS code sent. Check server logs for code for phone ' + phone.slice(-4));
            showAuthMessage('验证码已发送，开发模式请查看服务端日志', 'success');
          } else {
            showAuthMessage('验证码已发送至 ' + phone, 'success');
          }
          if (onSuccess) onSuccess(data);
          return;
        }

        showAuthMessage('发送失败：' + ((data && data.error) || '未知错误'));
        if (onError) onError();
      }).catch(function(error) {
        showAuthMessage('网络错误：' + (error.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function passwordLogin(phone, password, onSuccess, onError) {
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, password: password })
    }).then(parseJson)
      .then(function(data) {
        if (data && data.success && data.data && data.data.token) {
          var user = data.data;
          setToken(user.token, user);
          updateNavUser(user.phone, user.name, user.role);
          showAuthMessage('登录成功', 'success', 1200);
          if (onSuccess) onSuccess(user);
          return;
        }

        showAuthMessage('登录失败：' + ((data && data.error) || '密码错误'));
        if (onError) onError();
      }).catch(function(error) {
        showAuthMessage('网络错误：' + (error.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function login(phone, code, onSuccess, onError) {
    fetch('/api/auth/login-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, code: code })
    }).then(parseJson)
      .then(function(data) {
        if (data && data.success && data.data && data.data.token) {
          var user = data.data;
          setToken(user.token, user);
          updateNavUser(user.phone, user.name, user.role);
          showAuthMessage('登录成功', 'success', 1200);
          if (onSuccess) onSuccess(user);
          return;
        }

        showAuthMessage('登录失败：' + ((data && data.error) || '未知错误'));
        if (onError) onError();
      }).catch(function(error) {
        showAuthMessage('网络错误：' + (error.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function register(phone, code, name, role, password, onSuccess, onError) {
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        code: code,
        name: name,
        role: role,
        password: password
      })
    }).then(parseJson)
      .then(function(data) {
        if (data && data.success && data.data && data.data.token) {
          var user = data.data;
          setToken(user.token, user);
          updateNavUser(user.phone, user.name, user.role);
          showAuthMessage('注册成功', 'success', 1200);
          if (onSuccess) onSuccess(user);
          return;
        }

        showAuthMessage('注册失败：' + ((data && data.error) || '未知错误'));
        if (onError) onError();
      }).catch(function(error) {
        showAuthMessage('网络错误：' + (error.message || '无法连接服务器'));
        if (onError) onError();
      });
  }

  function logout() {
    clearAuth();
    var btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.style.display = '';
    var userGreeting = document.getElementById('userGreeting');
    if (userGreeting) userGreeting.style.display = 'none';
    showAuthMessage('已退出登录', 'success');
  }

  function updateNavUser(phone, name, role) {
    var btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.style.display = 'none';

    var userGreeting = document.getElementById('userGreeting');
    if (userGreeting) userGreeting.style.display = 'flex';

    var userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = (name || phone).slice(-2);

    var userPhone = document.getElementById('userPhone');
    if (userPhone) userPhone.textContent = (phone || '').slice(0, 3) + '****' + (phone || '').slice(-4);

    var resolvedRole = role || '';
    var memberLink = document.querySelector('#userGreeting a[href*="member.html"], #userGreeting a[href*="admin.html"]');

    if (!resolvedRole) {
      var storedUser = getStoredUser();
      resolvedRole = storedUser && storedUser.role ? storedUser.role : '';
    }

    if (memberLink) {
      if (resolvedRole === 'admin') {
        memberLink.href = 'admin.html';
        memberLink.textContent = '管理后台';
      } else {
        memberLink.href = 'member.html';
        memberLink.textContent = '会员中心';
      }
    }
  }

  function requireRole(allowedRoles, pageName) {
    var token = getToken();
    if (!token) {
      sessionStorage.setItem(REDIRECT_KEY, pageName);
      showAuthMessage('请先登录');
      window.location.href = 'index.html';
      return;
    }

    fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(parseJson)
      .then(function(data) {
        if (data && data.success && data.data) {
          var user = data.data;
          sessionStorage.setItem(USER_KEY, JSON.stringify({
            phone: user.phone,
            role: user.role,
            name: user.name || '',
            time: Date.now(),
            token: token
          }));

          if (allowedRoles.indexOf(user.role) === -1) {
            var roleMap = { seller: 'seller.html', buyer: 'buyer.html', admin: 'admin.html' };
            showAuthMessage('当前账号无权访问该页面');
            window.location.href = roleMap[user.role] || 'index.html';
            return;
          }

          updateNavUser(user.phone, user.name, user.role);
          return;
        }

        clearAuth();
        sessionStorage.setItem(REDIRECT_KEY, pageName);
        showAuthMessage('登录已过期，请重新登录');
        window.location.href = 'index.html';
      }).catch(function() {
        console.warn('[XW.Auth] Cannot reach server for role check, using cached session');
        var user = getStoredUser();
        if (user && user.phone) {
          if (allowedRoles.indexOf(user.role) === -1) {
            var roleMap = { seller: 'seller.html', buyer: 'buyer.html', admin: 'admin.html' };
            showAuthMessage('当前账号无权访问该页面');
            window.location.href = roleMap[user.role] || 'index.html';
            return;
          }

          updateNavUser(user.phone, user.name, user.role);
          return;
        }

        clearAuth();
        sessionStorage.setItem(REDIRECT_KEY, pageName);
        showAuthMessage('请先登录');
        window.location.href = 'index.html';
      });
  }

  function getTargetAfterAuth() {
    var redirectTarget = sessionStorage.getItem(REDIRECT_KEY);
    if (redirectTarget) {
      sessionStorage.removeItem(REDIRECT_KEY);
      return redirectTarget;
    }
    return null;
  }

  function initPage() {
    var overlay = document.getElementById('modalOverlay');
    var btnLogin = document.getElementById('btnLogin');
    var modalClose = document.getElementById('modalClose');

    if (btnLogin) {
      btnLogin.addEventListener('click', function() {
        if (overlay) overlay.classList.add('show');
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', function() {
        if (overlay) overlay.classList.remove('show');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
          overlay.classList.remove('show');
        }
      });
    }

    var tabPhone = document.getElementById('tabPhone') || document.getElementById('tabLogin');
    var tabPwd = document.getElementById('tabPwd');
    var tabReg = document.getElementById('tabReg');
    var phoneForm = document.getElementById('phoneForm') || document.getElementById('loginForm');
    var pwdForm = document.getElementById('pwdForm');
    var regForm = document.getElementById('regForm');
    var allTabs = [tabPhone, tabPwd, tabReg].filter(Boolean);
    var allForms = [phoneForm, pwdForm, regForm].filter(Boolean);

    function switchTab(tab) {
      if (!tab) return;
      allTabs.forEach(function(item) { item.classList.remove('active'); });
      allForms.forEach(function(item) { item.classList.remove('active'); });
      tab.classList.add('active');
      if (tab === tabPhone && phoneForm) phoneForm.classList.add('active');
      if (tab === tabPwd && pwdForm) pwdForm.classList.add('active');
      if (tab === tabReg && regForm) regForm.classList.add('active');
    }

    if (tabPhone) tabPhone.addEventListener('click', function() { switchTab(tabPhone); });
    if (tabPwd) tabPwd.addEventListener('click', function() { switchTab(tabPwd); });
    if (tabReg) tabReg.addEventListener('click', function() { switchTab(tabReg); });

    switchTab(tabPwd || tabPhone || tabReg);

    var toRegister = document.getElementById('toRegister');
    if (toRegister) toRegister.addEventListener('click', function() { switchTab(tabReg); });

    var phoneSwitchLinks = document.querySelectorAll('[data-auth-switch="phone"]');
    Array.prototype.forEach.call(phoneSwitchLinks, function(link) {
      link.addEventListener('click', function() { switchTab(tabPhone); });
    });

    var toPwd = document.getElementById('toPwd');
    if (toPwd) toPwd.addEventListener('click', function() { switchTab(tabPwd); });

    var phoneSmsBtn = document.getElementById('phoneSmsBtn') || document.getElementById('loginSmsBtn');
    if (phoneSmsBtn) {
      phoneSmsBtn.addEventListener('click', function() {
        var phoneInput = document.getElementById('phoneLoginPhone') || document.getElementById('loginPhone');
        if (!phoneInput) return;

        var phone = phoneInput.value.trim();
        if (!isValidPhone(phone)) {
          showAuthMessage('请输入有效的手机号');
          return;
        }

        var originalText = phoneSmsBtn.textContent;
        phoneSmsBtn.disabled = true;
        requestSmsCode(phone, function() {
          phoneSmsBtn.textContent = originalText;
          startCountdown(phoneSmsBtn);
        }, function() {
          phoneSmsBtn.disabled = false;
          phoneSmsBtn.textContent = originalText;
        });
      });
    }

    var regSmsBtn = document.getElementById('regSmsBtn');
    if (regSmsBtn) {
      regSmsBtn.addEventListener('click', function() {
        var phoneInput = document.getElementById('regPhone');
        if (!phoneInput) return;

        var phone = phoneInput.value.trim();
        if (!isValidPhone(phone)) {
          showAuthMessage('请输入有效的手机号');
          return;
        }

        var originalText = regSmsBtn.textContent;
        regSmsBtn.disabled = true;
        requestSmsCode(phone, function() {
          regSmsBtn.textContent = originalText;
          startCountdown(regSmsBtn);
        }, function() {
          regSmsBtn.disabled = false;
          regSmsBtn.textContent = originalText;
        });
      });
    }

    var phoneSubmit = document.getElementById('phoneSubmit') || document.getElementById('loginSubmit');
    if (phoneSubmit) {
      phoneSubmit.addEventListener('click', function() {
        var phoneInput = document.getElementById('phoneLoginPhone') || document.getElementById('loginPhone');
        var codeInput = document.getElementById('phoneLoginCode') || document.getElementById('loginCode');
        if (!phoneInput || !codeInput) return;

        var phone = phoneInput.value.trim();
        var code = codeInput.value.trim();

        if (!isValidPhone(phone)) {
          showAuthMessage('请输入有效的手机号');
          return;
        }

        if (!code) {
          showAuthMessage('请先获取验证码');
          return;
        }

        var originalText = phoneSubmit.textContent;
        phoneSubmit.disabled = true;
        phoneSubmit.textContent = '登录中…';

        login(phone, code, function(user) {
          if (overlay) overlay.classList.remove('show');
          var target = getTargetAfterAuth() || (user.role === 'admin' ? 'admin.html' : user.role === 'seller' ? 'seller.html' : user.role === 'buyer' ? 'buyer.html' : 'member.html');
          setTimeout(function() { window.location.href = target; }, 300);
        }, function() {
          phoneSubmit.disabled = false;
          phoneSubmit.textContent = originalText;
        });
      });
    }

    var pwdSubmit = document.getElementById('pwdSubmit');
    if (pwdSubmit) {
      pwdSubmit.addEventListener('click', function() {
        var phoneInput = document.getElementById('pwdLoginPhone');
        var passwordInput = document.getElementById('pwdLoginPassword');
        if (!phoneInput || !passwordInput) return;

        var phone = phoneInput.value.trim();
        var password = passwordInput.value;

        if (!isValidPhone(phone)) {
          showAuthMessage('请输入有效的手机号');
          return;
        }

        if (!password) {
          showAuthMessage('请输入密码');
          return;
        }

        var originalText = pwdSubmit.textContent;
        pwdSubmit.disabled = true;
        pwdSubmit.textContent = '登录中…';

        passwordLogin(phone, password, function(user) {
          if (overlay) overlay.classList.remove('show');
          var target = getTargetAfterAuth() || (user.role === 'admin' ? 'admin.html' : user.role === 'seller' ? 'seller.html' : user.role === 'buyer' ? 'buyer.html' : 'member.html');
          setTimeout(function() { window.location.href = target; }, 300);
        }, function() {
          pwdSubmit.disabled = false;
          pwdSubmit.textContent = originalText;
        });
      });
    }

    var regSubmit = document.getElementById('regSubmit');
    if (regSubmit) {
      regSubmit.addEventListener('click', function() {
        var phoneInput = document.getElementById('regPhone');
        var codeInput = document.getElementById('regCode');
        var passwordInput = document.getElementById('regPassword');
        var nameInput = document.getElementById('regName');
        var roleInput = document.getElementById('regRole');
        var agreeInput = document.getElementById('regAgree');
        if (!phoneInput || !codeInput || !passwordInput) return;

        var phone = phoneInput.value.trim();
        var code = codeInput.value.trim();
        var password = passwordInput.value;
        var name = nameInput ? nameInput.value.trim() : '';
        var role = roleInput ? roleInput.value : 'buyer';

        if (!isValidPhone(phone)) {
          showAuthMessage('请输入有效的手机号');
          return;
        }

        if (!code) {
          showAuthMessage('请先获取验证码');
          return;
        }

        if (!password) {
          showAuthMessage('请设置登录密码');
          return;
        }

        if (password.length < 6) {
          showAuthMessage('登录密码至少需要 6 位');
          return;
        }

        if (!role) {
          showAuthMessage('请选择使用角色');
          return;
        }

        if (agreeInput && !agreeInput.checked) {
          showAuthMessage('请先同意服务协议和隐私政策');
          return;
        }

        var originalText = regSubmit.textContent;
        regSubmit.disabled = true;
        regSubmit.textContent = '注册中…';

        register(phone, code, name, role, password, function(user) {
          if (overlay) overlay.classList.remove('show');
          var target = getTargetAfterAuth() || (user.role === 'seller' ? 'seller.html' : user.role === 'buyer' ? 'buyer.html' : 'verify.html');
          setTimeout(function() { window.location.href = target; }, 300);
        }, function() {
          regSubmit.disabled = false;
          regSubmit.textContent = originalText;
        });
      });
    }

    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', function() { logout(); });

    var user = getStoredUser();
    if (user && user.phone) {
      updateNavUser(user.phone, user.name, user.role);
    }

    if (overlay) {
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') overlay.classList.remove('show');
      });
    }
  }

  global.XW = {
    Auth: {
      getToken: getToken,
      setToken: setToken,
      clearAuth: clearAuth,
      isValidPhone: isValidPhone,
      showAuthMessage: showAuthMessage,
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
})(window);
