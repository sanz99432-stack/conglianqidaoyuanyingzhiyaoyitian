(function(root){'use strict';
const TAU=Math.PI*2;
const RELICS=[
 {id:'sword',name:'青冥剑匣',evolution:'万剑归宗',color:'#a1e2d3',desc:'剑伤提高10%，飞剑六重后进阶',detail:'剑轮展开，十八柄飞剑随机分散追敌',school:'御剑流'},
 {id:'fire',name:'离火神炉',evolution:'焚天业火',color:'#ffb884',desc:'火伤提高10%，离火六重后进阶',detail:'火莲法域展开，地火柱持续灼烧',school:'业火流'},
 {id:'thunder',name:'九霄雷印',evolution:'九霄雷劫',color:'#cbb8ff',desc:'雷伤提高10%，神雷六重后进阶',detail:'连续落雷与连锁电弧；冰冻目标增伤',school:'雷冰流'},
 {id:'ice',name:'玄冰灵珠',evolution:'冰封万里',color:'#a8ddff',desc:'冰伤提高10%，玄冰六重后进阶',detail:'寒潮扩散，多目标冰牢冻结妖物',school:'寒冰流'}
];
function install(Game,skills){const P=Game.prototype;if(P._progressionInstalled)return;P._progressionInstalled=true;const start=P.start,tick=P.tick,attack=P.attack,damage=P.damage,choose=P.choose,down=P.pointerDown;
 P.start=function(stage){start.call(this,stage);this.relics={};this.evolved={};this.chests=[];this.zones=[];this.evolutionTimers={sword:1,fire:1,thunder:1,ice:1};this.walkPhase=0;this.visualRow=0;this.rowCandidate=0;this.rowHold=0;this.lastFootstep=0;this.ascensionFlash=0;this.soundEvent('relic');};
 P.soundEvent=function(name){if(this.options.audio)this.options.audio.effect(name,this.save);};
 P.sound=function(tone){const name=tone<150?'hurt':tone<250?'lose':tone>=950?'win':tone>=800?'upgrade':tone>=600?'tap':tone===480?'thunder':'hit';this.soundEvent(name);};
 P.pointerDown=function(p){if(this.options.audio)this.options.audio.unlock();down.call(this,p);};
 P.checkEvolutions=function(){let changed=false;for(const r of RELICS)if(this.skills[r.id]>=6&&this.relics[r.id]&&!this.evolved[r.id]){this.evolved[r.id]=true;changed=true;this.evolutionTimers[r.id]=.05;this.toast('道法升华 · '+r.evolution);this.ascensionFlash=2;this.emit(this.player.x,this.player.y,r.color,40,100);}if(changed)this.soundEvent('ascend');};
 P.choose=function(id){choose.call(this,id);this.soundEvent('upgrade');this.checkEvolutions();};
 P.takeRelic=function(id){if(this.state!=='treasure'||this.relics[id])return;this.relics[id]=true;this.state='playing';this.chestChoices=[];this.soundEvent('relic');this.toast('获得法宝 · '+RELICS.find(r=>r.id===id).name);this.checkEvolutions();};
 P.damage=function(e,n){damage.call(this,e,n);};
 P.attack=function(dt){const before=this.bullets.length;attack.call(this,dt);for(let i=before;i<this.bullets.length;i++){const b=this.bullets[i];if(!b.enemy&&this.relics[b.art])b.damage*=1.1;if(b.art==='fire'&&this.evolved.fire)b.ember=true;}

  const p=this.player,scale=this.damageScale(),near=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<430).sort((a,b)=>(a.kind==='boss'?-1:Math.hypot(a.x-p.x,a.y-p.y))-(b.kind==='boss'?-1:Math.hypot(b.x-p.x,b.y-p.y)));
  for(const r of RELICS){if(!this.evolved[r.id])continue;this.evolutionTimers[r.id]-=dt;if(this.evolutionTimers[r.id]>0||!near.length)continue;
   if(this.castAscended){this.castAscended(r.id,near,scale);this.soundEvent(r.id+'-ultimate');continue;}
   if(r.id==='sword'){const synergy=this.skills.orbit>=3;for(let i=0;i<18;i++){const target=near[i%Math.min(near.length,6)],a=i*TAU/18,from={x:p.x+Math.cos(a)*78,y:p.y+Math.sin(a)*78},angle=Math.atan2(target.y-from.y,target.x-from.x);this.bullets.push({x:from.x,y:from.y,vx:Math.cos(angle)*400,vy:Math.sin(angle)*400,life:1.35,hit:new Set(),pierce:synergy,radius:5,damage:47*scale,color:'#e2f8bf',art:'sword',ultimate:true});}this.effects.push({x:p.x,y:p.y,r:95,life:.85,max:.85,color:r.color,ultimate:'sword'});this.evolutionTimers.sword=5.5;}
   if(r.id==='fire'){const target=near[0];this.zones.push({x:target.x,y:target.y,r:92,life:3.5,pulse:0,art:'fire',damage:22*scale});this.effects.push({x:target.x,y:target.y,r:90,life:.7,max:.7,color:r.color,blast:true,ultimate:'fire'});this.evolutionTimers.fire=4;}
   if(r.id==='thunder'){near.slice(0,6).forEach(e=>{const combo=e.slow>0&&this.skills.ice>=3;this.damage(e,(combo?132:98)*scale*(this.spellBonus?this.spellBonus('thunder'):1));this.effects.push({x:e.x,y:e.y,r:25,life:.4,max:.4,color:r.color,bolt:true,ultimate:'thunder'});});this.evolutionTimers.thunder=3.8;}
   if(r.id==='ice'){this.zones.push({x:p.x,y:p.y,r:125,life:3,pulse:0,art:'ice',damage:20*scale});this.effects.push({x:p.x,y:p.y,r:145,life:.9,max:.9,color:r.color,art:'ice',ultimate:'ice'});this.evolutionTimers.ice=5.5;}
   this.soundEvent(r.id+'-ultimate');
  }
 };
 P.tick=function(dt){const running=this.state==='playing',before=this.player?{x:this.player.x,y:this.player.y,hp:this.player.hp}:null;if(running){
   for(const zone of this.zones){zone.life-=dt;zone.pulse-=dt;if(zone.pulse<=0){zone.pulse=.5;for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-zone.x,e.y-zone.y)<zone.r+e.radius){this.damage(e,zone.damage);if(zone.art==='ice')e.slow=Math.max(e.slow||0,1.6);}}}this.zones=this.zones.filter(z=>z.life>0);
   // Evolved fireballs leave bounded burn patches once, at their first real hit.
   for(const b of this.bullets)if(b.ember&&!b.burned&&b.hit.size){b.burned=true;this.zones.push({x:b.x,y:b.y,r:48,life:2,pulse:0,art:'fire',damage:13*this.damageScale()});}if(this.zones.length>16)this.zones.splice(0,this.zones.length-16);
   this.ascensionFlash=Math.max(0,this.ascensionFlash-dt);
  }
  tick.call(this,dt);
  if(running&&before){const p=this.player,distance=Math.hypot(p.x-before.x,p.y-before.y);this.moving=distance>.03;this.walkPhase=(this.walkPhase+distance/66)%1;const angle=p.angle,newRow=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?(Math.cos(angle)>0?2:1):(Math.sin(angle)>0?0:3);
   if(newRow!==this.rowCandidate){this.rowCandidate=newRow;this.rowHold=0;}else this.rowHold+=dt;if(this.rowHold>.065&&this.moving)this.visualRow=newRow;
   if(this.moving&&this.time-this.lastFootstep>.28){this.lastFootstep=this.time;this.soundEvent('step');if(this.skills.speed&&this.time-(this.lastWindSound||0)>3){this.lastWindSound=this.time;this.soundEvent('speed');}}if(p.hp<before.hp)this.soundEvent('hurt');
   if(this.state==='playing'){const chest=this.chests.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<28);if(chest){this.chests.splice(this.chests.indexOf(chest),1);const eligible=RELICS.filter(r=>!this.relics[r.id]&&(!chest.relicId||r.id===chest.relicId));this.chestChoices=eligible.sort((a,b)=>this.skills[b.id]-this.skills[a.id]).slice(0,3);if(!this.chestChoices.length){this.save.coins+=12;this.persist();this.toast('法宝已齐 · 遗宝折算为12灵石');this.soundEvent('pickup');}if(this.chestChoices.length){this.state='treasure';this.joy=null;this.keys={};p.vx=p.vy=0;this.soundEvent('relic');}}}
  }
  if(this.options.audio)this.options.audio.sync(['settings','codex'].includes(this.state)&&this.player&&this[this.state+'Return']==='paused'?'paused':this.state,this.save);
 };
 P.buildSummary=function(){const active=RELICS.filter(r=>this.evolved&&this.evolved[r.id]);return active.length?active.map(r=>r.evolution).join(' · '):'法宝＋六重功法，可触发升华';};
}
const api={install,RELICS};if(typeof module!=='undefined')module.exports=api;else root.XiuxianProgression=api;
})(typeof globalThis!=='undefined'?globalThis:this);
