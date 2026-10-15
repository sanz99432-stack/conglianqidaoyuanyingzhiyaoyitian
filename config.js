/* 发布时填入微信流量主后台的激励视频广告位。未配置时微信端不会发放广告奖励。 */
(function (root) {
  const config = { rewardedAdUnitId: '', debug: false, version: '1.4.0' };
  if (typeof module !== 'undefined') module.exports = config;
  else root.XIUXIAN_CONFIG = config;
})(typeof globalThis !== 'undefined' ? globalThis : this);