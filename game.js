const config = require('./config.js');
const engine = require('./src/engine.js');
require('./src/balance.js').install(engine.Game);
require('./src/presentation.js').install(engine.Game);
const progression=require('./src/progression.js');progression.install(engine.Game,engine.SKILLS);require('./src/world.js').install(engine.Game);require('./src/ui.js').install(engine.Game,engine.SKILLS,engine.STAGES,progression.RELICS);require('./src/content.js').install(engine.Game,engine.SKILLS,progression.RELICS);require('./src/polish.js').install(engine.Game,engine.SKILLS,engine.STAGES,progression.RELICS);
require('./src/exploration.js').install(engine.Game,engine.SKILLS,progression.RELICS,require('./src/world.js').OBJECTS);
require('./src/expansion.js').install(engine.Game);
require('./src/theme.js').install(engine.Game);
require('./src/biome-effects.js').install(engine.Game);
require('./src/mechanics.js').install(engine.Game);
require('./src/motion.js').install(engine.Game);
require('./src/refinements.js').install(engine.Game,engine.SKILLS,progression.RELICS,require('./src/exploration').BUFFS);
require('./src/clarity.js').install(engine.Game,require('./src/expansion').GEAR);
require('./src/ascended-combat.js').install(engine.Game);require('./src/approved-art.js').install(engine.Game);require('./src/quality.js').install(engine.Game,require('./src/presentation').SHEETS,progression.RELICS,require('./src/expansion').GEAR);
require('./src/realms-v15').install(engine.Game,require('./src/presentation').SHEETS);
require('./src/upgrade-choice').install(engine.Game,progression.RELICS);
const audio=new (require('./src/audio.js').AudioManager)(()=>wx.createInnerAudioContext());
const canvas = wx.createCanvas();
const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
const ratio = Math.min(info.pixelRatio || 1, 1.25);
const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
const topInset = menu ? menu.bottom + 8 : 40;
const bottomInset = info.safeArea ? Math.max(0, info.windowHeight - info.safeArea.bottom) : 0;
canvas.width = info.windowWidth * ratio;
canvas.height = info.windowHeight * ratio;
const storage = {
  get: () => wx.getStorageSync('xiuxian-save-v1'),
  set: value => wx.setStorageSync('xiuxian-save-v1', value)
};
let video, pending;
function ad(done) {
  if (!config.rewardedAdUnitId) { game.toast('广告位尚未配置，请使用普通奖励'); done(false); return; }
  if (!wx.createRewardedVideoAd) { game.toast('当前环境不支持激励视频'); done(false); return; }
  if (pending) return;
  pending = done;
  const finish = ok => { const callback = pending; pending = null; if (callback) callback(ok); };
  if (!video) {
    video = wx.createRewardedVideoAd({adUnitId:config.rewardedAdUnitId});
    video.onClose(result => { const callback = pending; pending = null; if (callback) callback(!!result && result.isEnded === true); });
    video.onError(() => { game.toast('广告暂不可用，请稍后再试'); const callback = pending; pending = null; if (callback) callback(false); });
  }
  video.show().catch(() => video.load().then(() => video.show()).catch(() => finish(false)));
}
const game = new engine.Game(canvas, {width:info.windowWidth,height:info.windowHeight,topInset,bottomInset,storage,ad,createImage:()=>wx.createImage(),platform:'wechat',audio});
function point(t) { return {x:t.clientX,y:t.clientY,id:t.identifier}; }
wx.onTouchStart(e => e.changedTouches.forEach(t => game.pointerDown(point(t))));
wx.onTouchMove(e => e.changedTouches.forEach(t => game.pointerMove(point(t))));
wx.onTouchEnd(e => e.changedTouches.forEach(t => game.pointerUp(point(t))));
wx.onTouchCancel(e => e.changedTouches.forEach(t => game.pointerCancel(point(t))));
wx.onHide(() => {audio.visibility(true);game.pause();});
if(wx.onShow)wx.onShow(()=>audio.visibility(false));
let last = Date.now();
function frame() { const now=Date.now(); game.tick(Math.min((now-last)/1000,0.05)); last=now; game.render(); canvas.requestAnimationFrame(frame); }
canvas.requestAnimationFrame(frame);
