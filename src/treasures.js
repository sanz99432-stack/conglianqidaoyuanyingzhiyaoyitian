(function(root){'use strict';
const TAU=Math.PI*2,STAGES=['青竹山','落霞谷','寒潭洞','幽冥林','雷鸣峰','天阙台'];
const LEGENDS=[
 {id:'legend0',name:'青木剑匣',stage:0,desc:'命中积攒剑息，六层生出缚根剑阵；御剑命中积攒双倍。剑阵伤敌、减速并回复2气血。',short:'缚根剑阵 · 剑诀协同'},
 {id:'legend1',name:'炎凰宝炉',stage:1,desc:'命中积攒炉火，八层引发三段焰爆；离火命中积攒双倍。焰爆在落点持续轰击附近妖物。',short:'三段焰爆 · 离火协同'},
 {id:'legend2',name:'玄冥寒镜',stage:2,desc:'命中积攒寒光，八层映出寒镜冰旋；攻击减速妖物积攒双倍。冻结与伤害附近妖物，首领仅短暂凝滞。',short:'寒镜冰旋 · 寒冰协同'},
 {id:'legend3',name:'摄魂幡',stage:3,desc:'命中积攒魂息，击杀额外积攒；九层释放三枚魂火，分别攻击附近目标。',short:'三魂追击 · 击杀积魂'},
 {id:'legend4',name:'震霄雷钟',stage:4,desc:'命中积攒雷鸣，九层敲响震雷环，最多连击四个近敌；神雷命中积攒双倍。',short:'震雷连环 · 雷法协同'},
 {id:'legend5',name:'太清剑印',stage:5,desc:'全部伤害增加8%。命中积攒剑印，十层释放六方穿透剑光；掌法和剑阵命中积攒双倍。',short:'六方剑狱 · 掌阵协同'}
].map(x=>({...x,desc:x.desc+'触发冷却'+(x.stage===0?4:5)+'秒。',rarity:'legend'}));
const MINORS=[
 ['苔纹护符','气血上限增加18'],['青竹剑穗','御剑与万剑伤害增加8%'],['余烬石','离火与焰域伤害增加10%'],['赤砂护腕','全部功法伤害增加5%'],
 ['寒玉坠','玄冰与冰牢伤害增加10%'],['暖玉衣','气血上限增加24，寒意积累减少10%'],['引灵铃','灵气拾取范围增加18'],['镇魂戒','受到的伤害减少6%'],
 ['聚雷腕','神雷与雷劫伤害增加10%'],['疾雷羽','功法释放速度增加6%'],['太清簪','掌法与护体剑阵伤害增加10%'],['流云带','移动速度增加6%']
].map(([name,desc],i)=>({id:'minor'+i,name,desc,short:desc,stage:Math.floor(i/2),rarity:'minor',index:i}));
function install(Game,SHEETS,GEAR){const P=Game.prototype;if(P._treasuresInstalled)return;P._treasuresInstalled=true;
Object.assign(SHEETS,{legend16:[8,6,128],minor16:[6,2,128],treasurefx16:[8,6,128],chest16:[8,1,128]});
const requiredArt=P.requiredArtNames;P.requiredArtNames=function(){const names=requiredArt.call(this);if(this.loadout)for(const name of ['legend16','minor16'])if(!names.includes(name))names.push(name);return names;};
const start=P.start,spawn=P.spawnEnemy,pressure=P.pressure,damage=P.damage,scale=P.damageScale,attack=P.attack,tick=P.tick,hit=P.receiveHit,move=P.moveEntity,cold=P.addCold,cast=P.castBiome,release=P.releaseRealmAttack,ultimate=P.castRealmUltimate,addThreat=P.addThreat,resolve=P.resolveThreat,collect=P.collectBossLoot,render=P.render,codex=P.renderCodex,open=P.openLoadout,adorn=P.renderGearAdornment,shot=P.renderProjectile,battle=P.renderBattle;
P.vaultData=function(){return this.save.vault||(this.save.vault={owned:[],legend:null,minor:[],pity:[0,0,0,0,0,0],clears:[0,0,0,0,0,0]});};
P.ownsTreasure=function(item){return item.rarity==='legacy'?(this.save.gear[item.id]||0)>0:this.vaultData().owned.includes(item.id);};
P.minorActive=function(i){return this.runMinors?.includes('minor'+i)||false;};
P.start=function(stage){const v=this.vaultData();this.runLegend=v.owned.includes(v.legend)?v.legend:null;this.runMinors=[...v.minor].filter(id=>v.owned.includes(id)).slice(0,2);this.artifactCharge=0;this.artifactCooldown=0;this.artifactJobs=[];this.artifactBursts=[];this.lastBossDrop=null;this.treasureReveal=null;start.call(this,stage);const hp=(this.minorActive(0)?18:0)+(this.minorActive(5)?24:0);this.player.maxHp+=hp;this.player.hp+=hp;};
P.pressure=function(t){return pressure.call(this,t)*(1+Math.min(1,Math.max(0,(this.time||0)-120)/900)*.25);};
P.spawnEnemy=function(kind,type){spawn.call(this,kind,type);const e=this.enemies.at(-1),wave=Math.max(0,(this.wave?.number||1)-1),s=this.stage||0;let hp=1.04+wave*.025+s*.012,damageFactor=1;
 if(kind==='elite'){hp=1.18+wave*.035+s*.015;damageFactor=1.07+s*.012;e.baseSpeed*=1.025;}if(kind==='boss'){hp=(1.22+s*.025)*(1+Math.min(.15,(this.time||0)*.00025));damageFactor=1.1+s*.01;}
 e.hp=e.maxHp=Math.round(e.maxHp*hp);e.damage=Math.round(e.damage*damageFactor);
};
P.castBiome=function(e){cast.call(this,e);if(e.kind==='elite')e.mechanicTimer*=e.rage16?.85:.93;};
P.bossCadence=function(){return .94;};
P.releaseRealmAttack=function(e){const old=this.challengeMultiplier;this.challengeMultiplier=1.08+this.stage*.012;try{return release.call(this,e)}finally{this.challengeMultiplier=old}};
P.castRealmUltimate=function(e){const old=this.challengeMultiplier;this.challengeMultiplier=1.08+this.stage*.012;try{ultimate.call(this,e);e.ultimateIn*=.94;}finally{this.challengeMultiplier=old}};
P.addThreat=function(t){const mult=this.challengeMultiplier||1;if(mult>1){t.challengeMultiplier=mult;if(t.damage)t.damage=Math.round(t.damage*mult);}return addThreat.call(this,t);};
P.resolveThreat=function(t,dt){const old=this.challengeMultiplier;this.challengeMultiplier=t.challengeMultiplier||1;try{return resolve.call(this,t,dt)}finally{this.challengeMultiplier=old}};
P.damageScale=function(){return scale.call(this)*(this.minorActive(3)?1.05:1);};
P.attack=function(dt){return attack.call(this,dt*(this.minorActive(9)?1.06:1));};
P.receiveHit=function(n,source){return hit.call(this,n*(this.minorActive(7)?.94:1),source);};
P.moveEntity=function(e,dx,dy,r){const k=e===this.player&&this.minorActive(11)?1.06:1;return move.call(this,e,dx*k,dy*k,r);};
P.addCold=function(n,force){return cold.call(this,n*(this.minorActive(5)?.9:1),force);};
P.extraPickupRadius=function(){return this.minorActive(6)?18:0;};
P.treasureBurst=function(stage,x,y,size=110,life=.85){this.artifactBursts=this.artifactBursts||[];this.artifactBursts.push({stage,x,y,size,life,age:0});if(this.artifactBursts.length>8)this.artifactBursts.shift();};
P.procArtifact=function(e){const stage=Number(this.runLegend?.slice(6));if(!Number.isInteger(stage)||stage<0||stage>5||this.artifactCooldown>0||Math.hypot(e.x-this.player.x,e.y-this.player.y)>330)return;this.artifactCooldown=stage===0?4:5;this.artifactCharge=0;this.treasureBurst(stage,e.x,e.y,stage===5?140:115);this.soundEvent(['sword','fire','ice','wave','thunder','sword-ultimate'][stage]);
 const nearby=this.enemies.filter(t=>t.hp>0&&!t.phased&&t.kind!=='obstacle'&&Math.hypot(t.x-this.player.x,t.y-this.player.y)<=320),scale=this.damageScale();
 const previous=this.damageSource;this.damageSource={art:'artifact16'};this.artifactProcessing=true;
 try{
 if(stage===0||stage===2){for(const t of nearby.filter(t=>Math.hypot(t.x-e.x,t.y-e.y)<85).slice(0,6)){this.damage(t,(stage===0?28:34)*scale);t.slow=Math.max(t.slow||0,stage===0?2:2.5);if(stage===2)t.frostHold=Math.max(t.frostHold||0,t.kind==='boss'?.18:t.kind==='elite'?.4:.8);}if(stage===0)this.player.hp=Math.min(this.player.maxHp,this.player.hp+2);}
 if(stage===1){for(let i=0;i<3;i++)this.artifactJobs.push({wait:i*.4,stage,x:e.x,y:e.y,r:85,damage:20*scale});}
 if(stage===3){for(const t of nearby.slice(0,3)){const a=Math.atan2(t.y-this.player.y,t.x-this.player.x);this.bullets.push({x:this.player.x,y:this.player.y-12,vx:Math.cos(a)*200,vy:Math.sin(a)*200,life:1.4,radius:8,hit:new Set(),damage:32*scale,art:'soul16'});}}
 if(stage===4){for(const t of nearby.slice(0,4)){this.damage(t,40*scale);this.effects.push({x:e.x,y:e.y,end:{x:t.x,y:t.y},life:.3,max:.3,chainArc:true});}}
 if(stage===5){const p=this.player;for(let i=0;i<6;i++){const a=this.clock+i*TAU/6;this.bullets.push({x:p.x,y:p.y-10,vx:Math.cos(a)*220,vy:Math.sin(a)*220,life:1.2,hit:new Set(),pierce:true,radius:6,damage:24*scale,art:'seal16'});}this.treasureBurst(5,p.x,p.y,135);}
 }finally{this.artifactProcessing=false;this.damageSource=previous;}
};
P.damage=function(e,n){const source=this.damageSource,art=source?.art,spell=this._qualityThunderHit||source?.qualityThunder?'thunder':art==='palm'||art==='qPalm'||art==='qShock'?'wave':art;let bonus=1;if(!this.artifactProcessing){if(spell==='sword'&&this.minorActive(1))bonus+=.08;if(spell==='fire'&&this.minorActive(2))bonus+=.1;if(spell==='ice'&&this.minorActive(4))bonus+=.1;if(spell==='thunder'&&this.minorActive(8))bonus+=.1;if(['wave','orbit'].includes(spell)&&this.minorActive(10))bonus+=.1;}
 const hp=e.hp;damage.call(this,e,n*bonus);if(this.artifactProcessing||this.activeTreasureSpec?.()||!this.runLegend||hp<=e.hp||e.kind==='obstacle'||this.bossEntrance)return;
 const index=Number(this.runLegend.slice(6)),synergy=index===0&&spell==='sword'||index===1&&spell==='fire'||index===2&&e.slow>0||index===4&&spell==='thunder'||index===5&&['wave','orbit'].includes(spell);this.artifactCharge=Math.min([6,8,8,9,9,10][index],this.artifactCharge+(synergy?2:1)+(index===3&&e.hp<=0?2:0));if(this.artifactCharge>=[6,8,8,9,9,10][index])this.procArtifact(e);
};
P.tick=function(dt){if(this.state==='playing'&&!this.bossEntrance){this.artifactCooldown=Math.max(0,(this.artifactCooldown||0)-dt);for(const b of this.artifactBursts||[])b.age+=dt;this.artifactBursts=(this.artifactBursts||[]).filter(b=>b.age<b.life);const jobs=this.artifactJobs||[];for(const j of jobs){j.wait-=dt;if(j.wait<=0&&!j.done){j.done=true;this.treasureBurst(j.stage,j.x,j.y,105,.65);const source=this.damageSource;this.artifactProcessing=true;this.damageSource={art:'artifact16'};try{for(const e of this.enemies)if(e.hp>0&&!e.phased&&Math.hypot(e.x-j.x,e.y-j.y)<j.r)this.damage(e,j.damage);}finally{this.damageSource=source;this.artifactProcessing=false;}}}this.artifactJobs=jobs.filter(j=>!j.done);
 for(const e of this.enemies)if(e.kind==='elite'&&!e.rage16&&e.hp>0&&e.hp<e.maxHp*.35){e.rage16=true;e.mechanicTimer=Math.min(e.mechanicTimer||2,1.6);}}
 const result=tick.call(this,dt),r=this.treasureReveal;if(this.state==='lootReveal'&&r&&!r.sounded&&this.clock-r.started>=(r.rare?2.5:1.65)){r.sounded=true;this.soundEvent(r.rare?'ascend':'relic');}return result;
};
P.rollBossEquipment=function(stage,random=Math.random){const v=this.vaultData(),legend=LEGENDS[stage],missing=!this.ownsTreasure(legend),pity=missing&&v.pity[stage]>=4,rare=missing&&(pity||random()<.2),legacyId=['blade','robe','seal','orb','seal','orb'][stage],legacy={...GEAR.find(x=>x.id===legacyId),rarity:'legacy',stage};let item;
 if(rare)item=legend;else{const pool=[MINORS[stage*2],MINORS[stage*2+1],legacy],unowned=pool.filter(x=>!this.ownsTreasure(x)),eligible=unowned.length?unowned:pool;item=eligible[Math.min(eligible.length-1,Math.floor(random()*eligible.length))];}
 const duplicate=this.ownsTreasure(item);if(!duplicate){if(item.rarity==='legacy')this.save.gear[item.id]=1;else v.owned.push(item.id);}if(missing)v.pity[stage]=rare?0:Math.min(4,v.pity[stage]+1);else v.pity[stage]=0;v.clears[stage]++;const shards=duplicate?30:20;this.save.shards+=shards;this.persist();return this.lastBossDrop={item,duplicate,shards,stage,guaranteed:rare&&pity,pity:v.pity[stage],rare};
};
P.collectBossLoot=function(){const receipt=this.bossReceipt;collect.call(this);if(this.state==='bossReward'&&this.bossReceipt!==receipt&&this.lastBossDrop){this.treasureReveal={...this.lastBossDrop,next:this.bossReceipt.next,started:this.clock};this.state='lootReveal';this.buttons=[];this.joy=null;this.keys={};if(this.cancelPointerInputs)this.cancelPointerInputs();}};
P.finishTreasureReveal=function(){const r=this.treasureReveal;if(this.state!=='lootReveal'||!r||this.clock-r.started<(r.rare?3.2:2.1))return;this.state=r.next;this.bossReceipt=null;this.treasureReveal=null;this.lastBossDrop=null;this.artifactJobs=[];this.artifactBursts=[];};
P.treasureIcon=function(item,x,y,size){if(item.rarity==='legend')return this.sprite('legend16',item.stage*8+Math.floor(this.clock*8)%8,x,y,size,size);if(item.rarity==='minor')return this.sprite('minor16',item.index,x,y,size,size,Math.sin(this.clock*2)*.025);const index=GEAR.findIndex(g=>g.id===item.id);return this.sprite('qPeople',Math.max(0,index),x,y,size,size);};
P.openLoadout=function(...args){this.vaultView=false;this.vaultDetail=null;return open.apply(this,args);};
P.toggleTreasure=function(item){if(!this.loadout||!this.ownsTreasure(item))return;const v=this.vaultData();if(item.rarity==='legend')v.legend=v.legend===item.id?null:item.id;else if(item.rarity==='minor'){if(v.minor.includes(item.id))v.minor=v.minor.filter(id=>id!==item.id);else if(v.minor.length<2)v.minor.push(item.id);else{this.toast('先卸下一件次级装备');return;}}this.persist();};
P.renderVault=function(){const v=this.vaultData(),legend=this.vaultTab!=='minor',pool=legend?LEGENDS:MINORS,page=Math.max(0,Math.min(Math.ceil(pool.length/3)-1,this.vaultPage||0));this.vaultPage=page;this.buttons=[];this.overlay();this.heading('','珍宝阁');this.text(legend?'专属强装 · 限携一件':'次级装备 · 可携两件',195,198,12,'#c5d4b9','center');this.button('专属强装',24,217,163,29,()=>{this.vaultTab='legend';this.vaultPage=0},legend);this.button('次级装备',203,217,163,29,()=>{this.vaultTab='minor';this.vaultPage=0},!legend);
 pool.slice(page*3,page*3+3).forEach((item,i)=>{const y=257+i*105,on=legend?v.legend===item.id:v.minor.includes(item.id),owned=this.ownsTreasure(item);this.panel(24,y,342,98);this.treasureIcon(item,65,y+46,68);this.text(item.name,109,y+22,17,legend?'#ecd48b':'#cae1ce');this.wrappedText(item.short||item.desc,109,y+44,238,10,'#c6d3be',2);this.text(STAGES[item.stage],109,y+82,10,'#8daf9c');this.button(on?'卸下':owned?'携带':'未获得',267,y+69,84,23,()=>this.toggleTreasure(item),on,!owned);});
 this.text(legend?'专属20% · 未获得时第五次保底':'同关次级池优先获得未收集装备',195,586,10,'#b5c6aa','center');this.button('上一页',24,604,100,30,()=>this.vaultPage--,false,page===0);this.text((page+1)+' / '+Math.ceil(pool.length/3),195,619,12,'#d4d4ad','center');this.button('下一页',266,604,100,30,()=>this.vaultPage++,false,page>=Math.ceil(pool.length/3)-1);this.button('返回整备',24,651,342,36,()=>this.vaultView=false,true);
};
P.renderCodex=function(){if(this.loadout&&this.vaultView){this.renderVault();return;}codex.call(this);if(this.loadout){const selected=LEGENDS.find(x=>x.id===this.vaultData().legend);this.button('珍宝阁 · '+(selected?selected.name:'选择专属强装'),24,670,342,31,()=>{this.vaultView=true;this.vaultTab='legend';this.vaultPage=Math.floor((this.entryStage||0)/3);});}};
const vaultList=P.renderVault;P.renderVault=function(){const item=this.vaultDetail;if(!item){vaultList.call(this);const pool=this.vaultTab==='minor'?MINORS:LEGENDS;pool.slice(this.vaultPage*3,this.vaultPage*3+3).forEach((v,i)=>this.buttons.push({x:24,y:257+i*105,w:238,h:98,action:()=>this.vaultDetail=v}));return;}
 this.buttons=[];this.overlay();this.heading('',item.name);this.treasureIcon(item,195,291,142);this.wrappedText(item.desc,40,395,310,13,'#d2dfc7',6);const owned=this.ownsTreasure(item),v=this.vaultData(),on=item.rarity==='legend'?v.legend===item.id:v.minor.includes(item.id);this.text(STAGES[item.stage]+'首领遗宝',195,528,12,'#bdd0b3','center');if(item.rarity==='legend')this.text(owned?'已收集 · 每局限携一件':'20%概率 · 再领取'+(5-v.pity[item.stage])+'次必得',195,553,12,'#e5d096','center');this.button(on?'卸下':owned?'携带':'尚未获得',48,590,294,37,()=>this.toggleTreasure(item),true,!owned);this.button('返回珍宝阁',48,644,294,35,()=>this.vaultDetail=null);
};
P.renderGearAdornment=function(x,y,size=1){adorn.call(this,x,y,size);const item=LEGENDS.find(v=>v.id===this.runLegend);if(item){const a=this.clock*.7;this.treasureIcon(item,x+Math.cos(a)*35*size,y-25*size+Math.sin(a)*12*size,34*size);}};
P.renderProjectile=function(b,q){if(b.art==='soul16'||b.art==='seal16'){if(q.x<-60||q.x>450||q.y<30||q.y>770)return;const frame=b.art==='soul16'?5+Math.floor(this.clock*14)%3:Math.floor(this.clock*14)%8;this.sprite('treasurefx16',(b.art==='soul16'?3:5)*8+frame,q.x,q.y,b.art==='soul16'?38:34,b.art==='soul16'?38:34,Math.atan2(b.vy,b.vx),.95);return;}return shot.call(this,b,q);};
P.renderTreasureReveal=function(){const r=this.treasureReveal;if(!r)return;const age=this.clock-r.started,rare=r.rare,shown=age>=(rare?2.5:1.65),ready=age>=(rare?3.2:2.1),c=this.ctx;this.buttons=[];this.rect(0,0,390,720,'#061813fa');this.heading('',shown?(rare?'至宝现世':'镇妖得宝'):'遗宝启封');const reveal=rare?2.5:1.65,openProgress=Math.max(0,Math.min(1,(age-.25)/(reveal-.25)));
 if(!shown){const shake=age>.4&&age<1.1?Math.sin(age*55)*2:0;this.sprite('chest16',Math.min(7,Math.floor(openProgress*8)),195+shake,340,205,205);if(rare&&age>1.35){const p=Math.min(1,(age-1.35)/1.15);this.sprite('treasurefx16',r.item.stage*8+Math.min(7,Math.floor(p*8)),195,320,210,210,0,.8);}}
 else{const p=Math.min(1,(age-reveal)/.5);if(rare){for(let j=0;j<12;j++){const a=j*TAU/12+age*.24,radius=132+Math.sin(age*2+j)*8,mx=195+Math.cos(a)*radius,my=340+Math.sin(a)*116;c.globalAlpha=.45+Math.sin(age*4+j)*.25;this.rect(mx-2,my,5,2,'#efdb9b');this.rect(mx,my-2,2,6,'#fff0bd');}c.globalAlpha=1;for(let i=0;i<8;i++){const a=i*TAU/8+age*.2;this.energyStroke([{x:195+Math.cos(a)*95,y:342+Math.sin(a)*95},{x:195+Math.cos(a)*120,y:342+Math.sin(a)*120}],'#e8d48b',2,.5);}}c.save();c.translate(195,340);c.scale(Math.max(.04,Math.sin(p*Math.PI/2)),1);this.panel(-119,-92,238,191);this.treasureIcon(r.item,0,0,175+Math.sin(p*Math.PI)*8);c.restore();this.text(r.item.name,195,472,23,rare?'#f4d58b':'#dce3bd','center');this.wrappedText(r.item.desc,40,507,310,12,'#c2d3bd',3);this.text(r.duplicate?'重复装备 · 转为玄晶 ＋30':'新获装备 · 玄晶 ＋20',195,588,12,'#c6dbb6','center');if(rare&&r.guaranteed)this.text('镇妖保底 · 专属至宝',195,222,12,'#e8d08f','center');else if(!rare&&!this.vaultData().owned.includes(LEGENDS[r.stage].id))this.text(STAGES[r.stage]+'专属保底 '+r.pity+' / 5',195,222,12,'#acc8b4','center');}
 if(!shown&&age>reveal-.7){const turn=Math.min(1,(age-reveal+.7)/.7);c.save();c.translate(195,340);c.scale(Math.max(.04,Math.cos(turn*Math.PI/2)),1);this.panel(-119,-95,238,191);this.sprite('pack',14,0,-8,68,68);this.text('镇 妖 遗 宝',0,49,18,rare?'#efd18c':'#c9ddc8','center');c.restore();}
 if(ready)this.button('收下遗宝',48,629,294,43,()=>this.finishTreasureReveal(),true);
};
P.renderBattle=function(){battle.call(this);if(this.player)this.combatClip(()=>{for(const b of this.artifactBursts||[]){const q=this.worldPoint(b);if(q.x<-160||q.x>550||q.y<0||q.y>780)continue;this.sprite('treasurefx16',b.stage*8+Math.min(7,Math.floor(b.age/b.life*8)),q.x,q.y-12,b.size,b.size);}});};
const scenery=P.scenery;P.scenery=function(home){scenery.call(this,home);if(!home&&this.bossLoot){const q=this.worldPoint(this.bossLoot);this.sprite('chest16',0,q.x,q.y-15,95,95);}};
P.render=function(){render.call(this);if(this.state==='lootReveal')this.renderTreasureReveal();};
}
const api={install,LEGENDS,MINORS,STAGES};if(typeof module!=='undefined')module.exports=api;else root.XiuxianTreasures=api;
})(typeof globalThis!=='undefined'?globalThis:this);
