const app = getApp();

Page({
  data: {
    url: ''
  },
  onLoad(options) {
    let url = app.globalData.h5BaseUrl;
    // 支持通过 query 透传路径，例如 pages/index/index?path=/buyer.html
    if (options && options.path) {
      url = url.replace(/\/$/, '') + options.path;
    }
    this.setData({ url });
  }
});
