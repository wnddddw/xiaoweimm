/* 会员门槛守卫：高级功能仅 advanced 会员可用，未达级则引导前往会员中心申请 */
(function () {
  function getToken() {
    if (window.XW && XW.Auth && XW.Auth.getToken) return XW.Auth.getToken();
    return sessionStorage.getItem('xiaoweimm_token') || localStorage.getItem('xiaoweimm_token') || '';
  }

  function guard(featureName) {
    var token = getToken();
    if (!token) {
      alert('请先登录');
      location.href = 'login.html';
      return Promise.resolve(false);
    }
    return fetch('/api/memberships', { headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var level = (data && (data.level || (data.membership && data.membership.level))) || 'basic';
        if (level === 'advanced') return true;
        var status = data && (data.advanced_status || (data.membership && data.membership.advanced_status));
        if (status === 'pending') {
          alert('您的高级会员申请正在审核中，通过后即可使用「' + featureName + '」');
        } else {
          alert('「' + featureName + '」需高级会员，前往会员中心免费申请');
          location.href = 'member.html';
        }
        return false;
      })
      .catch(function () {
        alert('网络异常，请稍后再试');
        return false;
      });
  }

  window.XW = window.XW || {};
  XW.Membership = { guard: guard };
})();
