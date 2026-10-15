(function(root){
'use strict';
const TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const TYPES=[
 {id:'bamboo',name:'竹灵',hp:1,speed:34,radius:13,damage:9},
 {id:'fox',name:'赤狐',hp:.95,speed:43,radius:13,damage:12},
 {id:'armor',name:'岩甲龟',hp:3.1,speed:22,radius:20,damage:16,armor:.25},
 {id:'shaman',name:'符咒师',hp:1.6,speed:29,radius:15,damage:10},
 {id:'bat',name:'夜翼',hp:.8,speed:60,radius:12,damage:10},
 {id:'bomber',name:'丹炉妖',hp:1.8,speed:39,radius:16,damage:19}
];
function install(Game){
 if(Game.prototype._balanceInstalled)return;Game.prototype._balanceInstalled=true;
 const P=Game.prototype,baseStart=P.start,baseTick=P.tick,baseDamage=P.damage,baseBossAttack=P.bossAttack,baseBattle=P.renderBattle;
 P.start=function(stage){baseStart.call(this,stage);this.hazards=[];this.particles=[];this.trails=[];this.shake=0;this.moving=false;this.messages=[];this.healEffectTimer=1;this.resetWaves();};
 P.resetWaves=function(){this.waveIndex=0;this.wave={number:0,count:this.mode==='tower'?3:6,phase:'breather',rest:1.5,elapsed:0,kills:0,minKills:0,spawned:0,gateId:null,gateDefeated:false,eliteAt:0,spawnIn:0};};
 P.combatProgress=function(){return this.wave?Math.max(0,this.wave.number-1)*45:this.time;};
 P.pressure=function(time=this.combatProgress()){const t=Math.min(time,270);return (1+t*.0048+Math.floor(t/60)*.14)*(this.mode==='tower'?1+(this.towerFloor-1)*.22:1);};
 P.unlockedTypes=function(){return Math.min(6,1+Math.floor(this.combatProgress()/45)+Math.floor(this.stage*.6));};
 P.livingWaveEnemies=function(){return this.enemies.filter(e=>e.hp>0&&e.kind!=='obstacle');};
 P.onWaveEnemyDefeated=function(e){const w=this.wave;if(w&&w.phase==='fighting'&&e.hp<=0&&e.kind==='normal'&&!e.questSupport&&!e.waveKillCounted){e.waveKillCounted=true;w.kills++;}if(w&&w.phase==='fighting'&&e.hp<=0&&e.waveGate===true&&!e.questTarget&&e.id===w.gateId&&e.waveNumber===w.number)w.gateDefeated=true;};
 P.updateWaves=function(dt){const w=this.wave;if(!w||this.bossKilled||this.bossSpawned)return;
  if(w.phase==='breather'){
   w.rest=Math.max(0,w.rest-dt);if(w.rest>0)return;
   if(w.number>=w.count){w.phase='boss';this.spawnEnemy('boss');this.bossSpawned=true;this.toast('首领降临');this.sound(130);return;}
   w.number++;this.waveIndex=w.number-1;w.phase='fighting';w.elapsed=0;w.kills=0;w.minKills=14+(w.number-1)*2;w.spawned=0;w.gateId=null;w.gateDefeated=false;w.eliteAt=(this.mode==='tower'?45:55)+(w.number-1)*5;w.spawnIn=0;this.toast('第 '+w.number+' / '+w.count+' 波');
  }
  if(w.phase!=='fighting')return;
  if(w.gateDefeated){w.phase='breather';w.rest=8;this.toast(w.number===w.count?'首领即将降临':'第 '+w.number+' 波结束');return;}
  w.elapsed+=dt;w.spawnIn-=dt;
  if(w.spawnIn<=0){const cap=72+this.stage*4,count=w.number>=4?2:1;for(let i=0;i<count&&this.livingWaveEnemies().length<cap;i++){this.spawnEnemy('normal');this.enemies.at(-1).waveNumber=w.number;w.spawned++;}w.spawnIn=Math.max(.7,1.15-w.number*.06);}
  if(w.gateId===null&&w.elapsed>=w.eliteAt&&w.kills>=w.minKills){this.spawnEnemy('elite');const e=this.enemies.at(-1);e.waveNumber=w.number;e.waveGate=true;w.gateId=e.id;this.toast('守关精英现身');}
 };
 P.renderBattle=function(){baseBattle.call(this);if(this.options.preview)return;const w=this.wave;if(!w)return;const prefix=this.mode==='tower'?'塔 '+this.towerFloor+'层 · ':'';let label;if(this.bossKilled)label='首领已击败 · 靠近遗宝领取战利品';else if(this.bossSpawned)label='首领战 · 击败首领后拾取镇妖遗宝';else if(w.phase==='breather')label=(w.number===w.count?'首领准备':w.number?'守关已破 · 下一波':'入山准备')+' '+Math.ceil(w.rest)+'秒';else label='第 '+w.number+'/'+w.count+' 波 · '+(w.gateId===null?(w.elapsed<w.eliteAt?'妖潮':'蓄势'):'守关精英')+' · 妖物 '+this.livingWaveEnemies().length;this.rect(18,638,354,21,'#0b211ee8');this.text(prefix+label,195,650,10,'#cfddba','center');
  const gate=this.enemies.find(e=>e.id===w.gateId&&e.hp>0&&e.waveGate);if(gate){const q=this.worldPoint(gate);if(q.x<22||q.x>368||q.y<160||q.y>590){const x=clamp(q.x,25,365),y=clamp(q.y,200,570),angle=Math.atan2(gate.y-this.player.y,gate.x-this.player.x),c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#f1d27a';c.beginPath();c.moveTo(10,0);c.lineTo(-5,-6);c.lineTo(-5,6);c.closePath();c.fill();c.restore();this.text('守关',x,y+19,9,'#f1d27a','center');}}
 };
 P.spawnEnemy=function(kind='normal',forcedType){const count=this.unlockedTypes(),roll=Math.random();
  let type=forcedType===undefined?Math.floor(Math.random()*count):forcedType;
  // Keep readable packs: common pursuers anchor waves; specialists remain a minority.
  if(forcedType===undefined&&roll<.4)type=0;
  const spec=TYPES[type],angle=Math.random()*TAU,r=kind==='boss'?255:280+Math.random()*60,baseHp=48*Math.pow(1.17,this.stage)*this.pressure();
  const growthTime=Math.min(this.combatProgress(),270);let hp=baseHp*spec.hp,speed=(spec.speed+this.stage*1.4+growthTime*.018)*.88,radius=spec.radius,damage=spec.damage+this.stage+Math.floor(growthTime/90);
  if(kind==='elite'){hp=baseHp*10.5*Math.min(1.5,spec.hp);speed*=1.08;radius*=1.25;damage*=1.25;}
  if(kind==='boss'){hp=5600*Math.pow(1.2,this.stage)*(this.mode==='tower'?1+(this.towerFloor-1)*.3:1);speed=30+this.stage*2;radius=34;damage=24+this.stage*2;}
  const id=this.enemyId=(this.enemyId||0)+1;this.enemies.push({id,x:this.player.x+Math.cos(angle)*r,y:this.player.y+Math.sin(angle)*r,hp,maxHp:hp,speed:kind==='boss'?speed:0,baseSpeed:speed,radius,damage:Math.round(damage),kind,type,armor:kind==='boss'?.08:spec.armor||0,color:['#9fcc7c','#efa566','#a6cebe','#b997de','#ae9add','#efb26b'][type],shot:2,ability:kind==='elite'?1:2.4+Math.random()*2,phase:'chase',variant:type%3,age:0});
 };
 P.emit=function(x,y,color,count=7,power=65){this.particles=this.particles||[];for(let i=0;i<count;i++){const a=Math.random()*TAU,s=power*(.3+Math.random()*.7);this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.25,max:.5,color,size:1+Math.random()*2});}if(this.particles.length>220)this.particles.splice(0,this.particles.length-220);};
 P.enemyShot=function(e,n=1){const a=Math.atan2(this.player.y-e.y,this.player.x-e.x);for(let i=0;i<n;i++){const angle=a+(i-(n-1)/2)*.19;this.bullets.push({x:e.x,y:e.y-8,vx:Math.cos(angle)*115,vy:Math.sin(angle)*115,life:3.5,enemy:true,damage:10+this.stage*2,color:'#bc8bdd',radius:6,art:'talisman'});}};
 P.hazard=function(x,y,radius,damage,delay=.9,color='#f3987c',biome=this.stage,style='blast'){this.hazards.push({x,y,r:radius,damage,life:delay,max:delay,color,biome,style});};
 P.specialists=function(dt){const p=this.player;for(const e of this.enemies){if(e.hp<=0)continue;e.age+=dt;if(e.kind==='boss'){e.speed=e.baseSpeed*(e.hp<e.maxHp*.5?1.2:1);continue;}e.speed=0;e.ability-=dt;const d=dist(e,p)||1,a=Math.atan2(p.y-e.y,p.x-e.x),slow=e.slow>0?.3:1;let vx=Math.cos(a),vy=Math.sin(a),speed=e.baseSpeed;
  if(e.type===1){if(e.phase==='warn'){e.phaseTime-=dt;speed=0;if(e.phaseTime<=0){e.phase='dash';e.phaseTime=.65;}}
   else if(e.phase==='dash'){e.phaseTime-=dt;vx=Math.cos(e.dashAngle);vy=Math.sin(e.dashAngle);speed=220+this.stage*8;if(e.phaseTime<=0){e.phase='chase';e.ability=e.kind==='elite'?2.8:4;}}
   else if(e.ability<=0&&d<300){e.phase='warn';e.phaseTime=.7;e.dashAngle=a;speed=0;}}
  if(e.type===3){if(d>185)speed*=.9;else if(d<115){vx=-vx;vy=-vy;}else speed=0;if(e.ability<=0&&d<380){this.enemyShot(e,e.kind==='elite'?3:1);e.ability=e.kind==='elite'?2.2:3.5;this.effects.push({x:e.x,y:e.y-10,r:22,life:.3,max:.3,color:'#c7a3e8',cast:true,enemyVfx:'cast',biome:e.biome});}}
  if(e.type===4){const weave=Math.sin(e.age*4+e.id)*.65;vx=Math.cos(a+weave);vy=Math.sin(a+weave);}
  if(e.type===5){if(e.phase==='armed'){speed=0;e.phaseTime-=dt;if(e.phaseTime<=0){this.hazard(e.x,e.y,60+(e.kind==='elite'?15:0),e.damage,.02,undefined,e.biome);e.hp=0;}}
   else if(d<72){e.phase='armed';e.phaseTime=1.1;speed=0;}}
  let step=speed*slow*dt;if(e.type!==3&&e.phase!=='dash')step=Math.min(step,Math.max(0,d-e.radius-8));
  this.moveEntity(e,vx*step,vy*step,e.radius);
 }};
 P.separateEnemies=function(dt){const units=this.enemies.filter(e=>e.hp>0&&!e.phased&&e.kind!=='obstacle'&&e.phase!=='dash'),cell=80;
  // Local neighbours only: dense waves don't need an all-pairs crowd check.
  for(let pass=0;pass<2;pass++){const grid=new Map();units.forEach((e,i)=>{const key=Math.floor(e.x/cell)+','+Math.floor(e.y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);});
   for(let i=0;i<units.length;i++){const a=units[i],cx=Math.floor(a.x/cell),cy=Math.floor(a.y/cell);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)for(const j of grid.get(x+','+y)||[]){if(j<=i)continue;const b=units[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),gap=a.radius+b.radius+20;if(d>=gap)continue;if(d<.001){const angle=(a.id*17+b.id*31)*2.39996;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}else{dx/=d;dy/=d;}const push=Math.min((gap-d)*.5,90*dt),fixedA=a.castHold>0||a.mechanic==='turret',fixedB=b.castHold>0||b.mechanic==='turret';if(!fixedA)this.moveEntity(a,-dx*push*(fixedB?2:1),-dy*push*(fixedB?2:1),a.radius);if(!fixedB)this.moveEntity(b,dx*push*(fixedA?2:1),dy*push*(fixedA?2:1),b.radius);}
   }
  }
  for(const e of units){if(e.castHold>0||e.mechanic==='turret')continue;let dx=e.x-this.player.x,dy=e.y-this.player.y,d=Math.hypot(dx,dy),r=e.radius+8;if(d>=r)continue;if(d<.001){const a=e.id*2.39996;dx=Math.cos(a);dy=Math.sin(a);d=1;}else{dx/=d;dy/=d;}this.moveEntity(e,dx*(r-d),dy*(r-d),e.radius);}
 };
 P.tick=function(dt){if(this.state==='playing'){
   this.specialists(dt);const p=this.player;this.moving=!!this.joy&&Math.hypot(this.joy.dx,this.joy.dy)>.02||Object.keys(this.keys).some(k=>['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&this.keys[k]);this.healEffectTimer-=dt;if(this.skills.heal&&this.healEffectTimer<=0){this.healEffectTimer=4;if(this.soundEvent)this.soundEvent('heal');this.effects.push({x:p.x,y:p.y,r:34,life:.8,max:.8,color:'#a9dca1',art:'heal'});}
   for(const h of this.hazards){h.life-=dt;if(h.life<=0&&!h.done){h.done=true;this.effects.push({x:h.x,y:h.y,r:h.r,life:.5,max:.5,color:h.color,blast:true,enemyVfx:h.style||'blast',biome:h.biome});this.emit(h.x,h.y,h.color,16,110);if(dist(p,h)<h.r+10&&p.invincible<=0){if(this.receiveHit)this.receiveHit(h.damage);else{p.hp-=h.damage;p.invincible=.75;this.sound(100);}this.shake=5;}}}this.hazards=this.hazards.filter(h=>!h.done);
   for(const b of this.bullets)if(!b.enemy&&b.art!=='sword'){this.trails.push({x:b.x,y:b.y,color:b.color,life:.16});}if(this.trails.length>150)this.trails.splice(0,this.trails.length-150);
   for(const particle of this.particles){particle.life-=dt;particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vx*=.94;particle.vy*=.94;}this.particles=this.particles.filter(p=>p.life>0);this.trails.forEach(t=>t.life-=dt);this.trails=this.trails.filter(t=>t.life>0);this.shake=Math.max(0,this.shake-dt*18);
  }
  baseTick.call(this,dt);
 };
 P.damage=function(e,n){if(e.hp<=0)return;const old=e.hp;baseDamage.call(this,e,n*(1-(e.armor||0)));if(e.hp<=0){this.emit(e.x,e.y,e.color,e.kind==='boss'?45:10,e.kind==='boss'?130:65);this.effects.push({x:e.x,y:e.y-8,r:e.kind==='boss'?90:32,life:.35,max:.35,color:e.color,impact:true});if(e.kind!=='normal')this.shake=3;}else if(old-e.hp>25&&Math.random()<.28)this.emit(e.x,e.y-6,'#e6daa2',3,40);};
 P.bossAttack=function(e){baseBossAttack.call(this,e);const enraged=e.hp<e.maxHp*.5;e.shot=enraged?1.9:2.8;if(enraged||this.stage>=2){const n=enraged?3:1;for(let i=0;i<n;i++)this.hazard(this.player.x+(i?Math.cos(i*TAU/n)*65:0),this.player.y+(i?Math.sin(i*TAU/n)*65:0),42+this.stage*3,18+this.stage*3,1.05,'#e8997e',e.biome);}if(enraged&&!e.enraged){e.enraged=true;this.toast('首领狂暴 · 注意红圈预警！');}};
 P.damageScale=function(){return 1+this.save.upgrades.attack*.05;};
}
const api={install,TYPES};if(typeof module!=='undefined')module.exports=api;else root.XiuxianBalance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
