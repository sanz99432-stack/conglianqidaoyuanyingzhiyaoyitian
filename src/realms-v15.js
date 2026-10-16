(function(root){'use strict';
const TAU=Math.PI*2,PALETTE=['#a2d98e','#ffac65','#b3eeff','#b6b0fa','#ffe393','#bceedd'];
const NAMES=[['缚根竹巫','穿林竹狐','苔甲山君','育种长老','蝶羽祭司','盘根古卫'],['余烬炎巫','逐焰狼将','玄岩甲兽','熔心祭司','赤羽焰使','焚山鬼将'],['霜纹灵使','踏雪豹将','玄冰甲卫','寒魄巫祝','晶翼冰使','极寒巨灵'],['引魂灯使','掠影冥犬','白骨盾卫','招魂祭司','幽蛾咒使','冥镰战将'],['聚雷灵使','奔雷虎将','磁岩甲卫','御雷道使','风雷鹰使','雷铸巨灵'],['玉符灵使','逐光剑卫','玄玉盾卫','天机阵师','云鹤仙使','天阙禁卫']];
const BLESSINGS=[{name:'剑意贯通',detail:'本次登塔功法伤害增加12%',id:'power'},{name:'灵泉养元',detail:'恢复35%气血，提高气血上限15',id:'life'},{name:'御风乘云',detail:'本次登塔移速增加6%，获取一张纳灵符',id:'wind'}];
function install(Game,SHEETS){const P=Game.prototype;if(P._realms15)return;P._realms15=true;
for(let i=0;i<6;i++)SHEETS['elite15'+i]=[8,6,128];SHEETS.relic15=[8,4,128];SHEETS.realmfx15=[8,6,128];
P.sprite=function(sheet,index,x,y,w,h,angle=0,alpha=1){const entry=this.art&&this.art[sheet];if(!entry?.ready)return false;const spec=SHEETS[sheet];if(!spec)return false;const [cols,,cell]=spec,c=this.ctx,sx=index%cols*cell,sy=Math.floor(index/cols)*cell,old=c.globalAlpha;if(alpha!==1)c.globalAlpha=old*alpha;if(angle){c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.drawImage(entry.image,sx,sy,cell,cell,Math.round(-w/2),Math.round(-h/2),Math.round(w),Math.round(h));c.restore();}else c.drawImage(entry.image,sx,sy,cell,cell,Math.round(x-w/2),Math.round(y-h/2),Math.round(w),Math.round(h));if(alpha!==1)c.globalAlpha=old;return true;};
const move=P.moveEntity;P.moveEntity=function(e,dx,dy,r){const boost=e===this.player?1+Math.min(.3,.06*(this.towerBlessings?.wind||0)):1;return move.call(this,e,dx*boost,dy*boost,r);};
const start=P.start,spawn=P.spawnEnemy,tick=P.tick,pixel=P.pixelSprite,battle=P.renderBattle,cast=P.castBiome,release=P.releaseRealmAttack,damageScale=P.damageScale,collect=P.collectBossLoot,render=P.render,scenery=P.scenery,relic=P.relicIcon;
const resolve=P.resolveThreat;P.resolveThreat=function(t,dt){if(!t.realm15Seen&&t.age>=t.delay){t.realm15Seen=true;if(!['fire','poison','ice','followStrike','portal'].includes(t.kind))this.realm15Burst(t.x,t.y,this.stage,Math.min(140,(t.r||40)*2),.75);}return resolve.call(this,t,dt);};
const bossAttack=P.bossAttack;P.bossAttack=function(e){if(e.ultimateLock>0){e.shot=.3;return;}return bossAttack.call(this,e);};
const drawEffect=P.renderEffect,drawProjectile=P.renderProjectile;
P.renderEffect=function(e,q){const r=Math.max(180,e.r||0);if(q.x<-r||q.x>390+r||q.y<-r||q.y>720+r)return;drawEffect.call(this,e,q);};
P.renderProjectile=function(b,q){if(q.x<-70||q.x>460||q.y<-70||q.y>790)return;drawProjectile.call(this,b,q);};
P.start=function(s){start.call(this,s);this.realm15Bursts=[];this.towerBlessings={power:0,wind:0};this.towerChoice=false;this.towerOath=null;};
P.spawnEnemy=function(kind,type){spawn.call(this,kind,type);const e=this.enemies.at(-1);if(kind==='elite'&&!this.quest?.spawning){e.eliteRole=Math.max(0,Math.min(5,(this.wave?.number||1)-1));e.monsterName=NAMES[this.stage][e.eliteRole];e.type=[0,1,2,3,4,0][e.eliteRole];e.ability=2.8;e.eliteCast=0;e.guard=e.eliteRole===2?2:0;}if(kind==='boss'){e.ultimateIn=12;e.realmCombo=0;}};
P.damageScale=function(){return damageScale.call(this)*(1+.12*(this.towerBlessings?.power||0));};
P.realm15Burst=function(x,y,stage,size=90,life=.85){this.realm15Bursts=this.realm15Bursts||[];this.realm15Bursts.push({x,y,stage,size,age:0,life});if(this.realm15Bursts.length>16)this.realm15Bursts.shift();};
P.eliteVolley=function(e,count=5,speed=110,spread=TAU){const a=Math.atan2(this.player.y-e.y,this.player.x-e.x);for(let i=0;i<count;i++){const angle=a+(spread===TAU?i*TAU/count:(i/(count-1||1)-.5)*spread);this.bullets.push({x:e.x,y:e.y-8,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:2.8,enemy:true,damage:9+this.stage,biome:this.stage,color:PALETTE[this.stage],radius:5,art:'talisman'});}};
P.castBiome=function(e){if(e.eliteRole===undefined||e.questTarget)return cast.call(this,e);const p=this.player,a=Math.atan2(p.y-e.y,p.x-e.x),s=this.stage,icon=[0,6,10,15,19,22][s],kind=['thornSeed','fireBlast','spike','ambush','strike','fireBlast'][s];e.eliteCast=1.1;e.castHold=.9;
 const strike=(x,y,r=40,delay=1.05)=>this.addThreat({kind,x,y,r,delay,duration:.3,damage:11+s,icon});
 switch(e.eliteRole){
 case 0: strike(p.x,p.y);strike(p.x+Math.cos(a+1.4)*75,p.y+Math.sin(a+1.4)*75,32,1.4);break;
 case 1:e.dashAngle=a;e.phase='warn';e.phaseTime=.85;e.castHold=0;strike(e.x+Math.cos(a)*80,e.y+Math.sin(a)*80,35,1.2);break;
 case 2:e.guard=2.2;e.guardAngle=a;if(s===1||s===2)this.addThreat({kind:s===2?'iceCone':'fireCone',x:e.x,y:e.y,r:135,angle:a,spread:.65,delay:1.3,duration:.2,damage:13,icon});else if(s===5)this.addThreat({kind:'beam',x:e.x,y:e.y,angle:a,delay:1.3,duration:.35,damage:13,icon:22});else strike(p.x,p.y,55,1.3);break;
 case 3:this.addThreat({kind:'portal',x:e.x+Math.cos(a)*45,y:e.y+Math.sin(a)*45,owner:e.id,delay:1.2,duration:.2,icon:12});strike(p.x,p.y,36,1.5);break;
 case 4:e.pendingVolley=.95;this.addThreat({kind:'chain',x:e.x,y:e.y,nodes:[{x:p.x-70,y:p.y+45},{x:p.x,y:p.y-70},{x:p.x+70,y:p.y+45}],delay:1.35,duration:.7,damage:10,icon:16});break;
 case 5:e.pendingVolley=.95;for(let i=0;i<3;i++)strike(p.x+Math.cos(a+i*TAU/3)*85,p.y+Math.sin(a+i*TAU/3)*85,36,1.1+i*.25);break;
 }
 this.realm15Burst(e.x,e.y,s,85,1.1);
};
P.releaseRealmAttack=function(e){release.call(this,e);e.realmCombo=(e.realmCombo||0)+1;if(e.realmCombo%3!==0)return;const s=this.stage,p=this.player,kind=['thornSeed','fireBlast','spike','ambush','strike','beam'][s];this.addThreat({kind,x:s===5?e.x:p.x,y:s===5?e.y:p.y,r:48,angle:Math.atan2(p.y-e.y,p.x-e.x),delay:1.25,duration:.35,damage:15,icon:[0,6,10,15,19,22][s]});this.realm15Burst(e.x,e.y,s,130,1.4);};
P.castRealmUltimate=function(e){const s=this.stage,p=this.player,angle=Math.atan2(p.y-e.y,p.x-e.x);e.castHold=2;e.ultimateLock=3;e.attackWait=0;e.attackAge=0;e.ultimateIn=e.hp<e.maxHp*.5?15:20;this.toast(['万根封山','焚谷流星','冰狱潮汐','百鬼巡夜','九霄落罚','天阙剑狱'][s]);
 if(s===0){for(let i=0;i<5;i++){const a=angle+.6+i*(TAU-1.2)/5;this.addThreat({kind:'thornSeed',x:p.x+Math.cos(a)*95,y:p.y+Math.sin(a)*95,delay:1.6,duration:.1,icon:0});}this.addThreat({kind:'poison',x:p.x,y:p.y,r:55,delay:2.8,duration:2,damage:7,icon:2});}
 if(s===1){for(let i=0;i<4;i++)this.addThreat({kind:'fireBlast',x:p.x+(i%2?80:-80),y:p.y+(i<2?-65:65),r:50,delay:1.5+i*.3,duration:.3,damage:18,icon:6});}
 if(s===2){for(let i=0;i<3;i++)this.addThreat({kind:'iceCone',x:e.x,y:e.y,r:245,angle:angle+(i-1)*.8,spread:.3,delay:1.5+i*.55,duration:.3,damage:16,icon:11});}
 if(s===3){for(let i=0;i<2;i++)this.addThreat({kind:'portal',x:p.x+Math.cos(angle+i*Math.PI)*110,y:p.y+Math.sin(angle+i*Math.PI)*110,owner:e.id,delay:1.6,duration:.2,icon:12});e.pendingVolley=1.4;}
 if(s===4){for(let i=0;i<5;i++)this.addThreat({kind:'followStrike',x:p.x,y:p.y,delay:1.1+i*.55,duration:.1,icon:18});}
 if(s===5){for(let i=0;i<3;i++)this.addThreat({kind:'sweep',x:e.x,y:e.y,angle:angle+(i-1)*TAU/3,delay:1.7,duration:1.1,damage:16,owner:e.id,icon:23});}
 this.realm15Burst(e.x,e.y,s,190,2.2);
};
P.tick=function(dt){if(this.state==='playing'&&!this.bossEntrance){for(const b of this.realm15Bursts||[])b.age+=dt;this.realm15Bursts=(this.realm15Bursts||[]).filter(b=>b.age<b.life);for(const e of this.enemies){e.ultimateLock=Math.max(0,(e.ultimateLock||0)-dt);e.eliteCast=Math.max(0,(e.eliteCast||0)-dt);if(e.pendingVolley>0){e.pendingVolley-=dt;if(e.pendingVolley<=0)this.eliteVolley(e,e.kind==='boss'?9:5,105);}if(e.kind==='boss'&&e.hp>0){e.ultimateIn=(e.ultimateIn??12)-dt;if(e.ultimateIn<=0)this.castRealmUltimate(e);}}
 if(this.mode==='tower'&&this.towerOath?.id==='hunt'&&!this.towerOath.done&&this.kills-this.towerOath.kills>=35){this.towerOath.done=true;this.nalingCharms++;this.player.hp=Math.min(this.player.maxHp,this.player.hp+15);this.toast('猎妖誓约达成 · 纳灵符');}
 }tick.call(this,dt);};
P.collectBossLoot=function(){const floor=this.towerFloor;collect.call(this);if(this.mode==='tower'&&this.towerFloor>floor){if(this.bossReceipt)this.bossReceipt.next='towerChoice';else this.state='towerChoice';this.realm15Bursts=[];this.towerChoice=true;this.joy=null;this.towerOath=null;}};
P.chooseTowerBlessing=function(id){if(this.state!=='towerChoice')return;if(id==='power')this.towerBlessings.power++;if(id==='life'){this.player.maxHp+=15;this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*.35);}if(id==='wind'){this.towerBlessings.wind++;this.nalingCharms++;}this.towerOath={id:'hunt',kills:this.kills,done:false};this.state='playing';this.towerChoice=false;};
P.pixelSprite=function(x,y,type,color,size,e){if(e?.kind==='elite'&&e.eliteRole!==undefined){const frame=e.eliteCast>0?4+Math.min(3,Math.floor((1.1-e.eliteCast)*4)):Math.floor((e.age||0)*8)%4;this.shadow(x,y+8,20,.25);if(this.sprite('elite15'+(e.biome??this.stage),e.eliteRole*8+frame,x,y-17,78*size,78*size))return;}pixel.call(this,x,y,type,color,size,e);};
P.relicIcon=function(id,x,y,size){const row=['orbit','wave','heal','speed'].indexOf(id);if(row>=0&&this.sprite('relic15',row*8+Math.floor(this.clock*9)%8,x,y,size,size))return;relic.call(this,id,x,y,size);};
P.scenery=function(home){scenery.call(this,home);if(home)return;for(const b of this.realm15Bursts||[]){const q=this.worldPoint(b);if(q.x<-150||q.x>540||q.y<0||q.y>790)continue;this.sprite('realmfx15',b.stage*8+Math.min(7,Math.floor(b.age/b.life*8)),q.x,q.y-12,b.size,b.size,0,.9);}};
P.renderBattle=function(){battle.call(this);if(this.player)for(const [i,id] of ['orbit','wave','heal','speed'].entries())if(this.relics?.[id]){const a=this.clock*.5+i*TAU/4,q=this.worldPoint(this.player);this.relicIcon(id,q.x+Math.cos(a)*35,q.y-35+Math.sin(a)*10,29);}if(this.mode==='tower'&&this.towerOath&&!this.towerOath.done)this.text('猎妖誓约 '+Math.min(35,this.kills-this.towerOath.kills)+'/35',365,157,10,'#c9d8b1','right');};
P.render=function(){render.call(this);if(this.state==='towerChoice'){this.overlay();this.buttons=[];this.heading('登 塔 悟 道','选择本次登塔祝福','');for(let i=0;i<3;i++){const b=BLESSINGS[i],y=250+i*100;this.panel(28,y,334,86);this.relicIcon(['wave','heal','speed'][i],65,y+41,54);this.text(b.name,105,y+27,16,'#ead7a0');this.text(b.detail,105,y+51,10,'#bdcdbb');this.buttons.push({x:28,y,w:334,h:86,action:()=>this.chooseTowerBlessing(b.id)});}}};
}
const api={install,NAMES,BLESSINGS};if(typeof module!=='undefined')module.exports=api;else root.XiuxianRealms15=api;
})(typeof globalThis!=='undefined'?globalThis:this);
