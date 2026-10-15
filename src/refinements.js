(function(root){'use strict';
const TAU=Math.PI*2;
const HINTS=new Set(['灵石投入后立即生效，永久保留','战场已启用动态减光与特效分层','已暂停妖潮、伤害与技能计时','失败也会保留本次普通灵石奖励','普通奖励已保存 · 无需观看广告','较弱设备可关闭柔光，保留技能主体','精英掉落法宝 · 流派组合带来不同道途','点击领悟 →','点击查看解读','六重功法 × 本命法宝 = 道法升华','小怪持续出现 · 击败守关精英进入下一波','任务精英不计波次 · 六波后挑战首领']);
function install(Game,SKILLS,RELICS,BUFFS){const P=Game.prototype;if(P._refinementsInstalled)return;P._refinementsInstalled=true;
const tick=P.tick,text=P.text,heading=P.heading,codex=P.renderCodex,open=P.openCodex,bag=P.openBag,damage=P.damage,sound=P.soundEvent,pixel=P.pixelSprite;
P.text=function(value,...args){const label=String(value);if(HINTS.has(label))return;if(/^v\d/.test(label)&&label.includes(' · '))value='v1.14';text.call(this,value,...args);};
P.heading=function(kicker,title,subtitle){if(this.state==='upgrade')subtitle=subtitle&&subtitle.split(' · ')[0];else if(this.state!=='ad')subtitle=undefined;heading.call(this,kicker,title,subtitle);};
P.soundEvent=function(name){if(this.options.preview||name==='hit'&&this.hitFeedbackDepth)return;sound.call(this,name);};
P.damage=function(e,n){this.hitFeedbackDepth=(this.hitFeedbackDepth||0)+1;try{damage.call(this,e,n);}finally{this.hitFeedbackDepth--;}};
P.pixelSprite=function(x,y,type,color,size,e){if(e&&e.flash>0&&e.kind!=='obstacle'){const d=Math.hypot(e.x-this.player.x,e.y-this.player.y)||1,k=Math.sin(e.flash/.09*Math.PI)*2.4;x+=(e.x-this.player.x)/d*k;y+=(e.y-this.player.y)/d*k;pixel.call(this,x,y,type,color,size,e);const c=this.ctx;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.25;pixel.call(this,x,y,type,color,size,e);c.restore();return;}pixel.call(this,x,y,type,color,size,e);};
P.openCodex=function(){open.call(this);this.joy=null;this.keys={};this.catalogTab='skills';this.bagDetail=null;this.skillDemo=null;this.previewMode='normal';};
P.openBag=function(){bag.call(this);this.catalogTab='skills';this.bagDetail=null;this.skillDemo=null;this.previewMode='normal';};
P.selectCatalogItem=function(item){this.bagDetail=item;this.previewMode=item.kind==='relic'?'evolved':'normal';this.skillDemo=null;this.previewLoops=0;};
P.createSkillDemo=function(id,mode){if(!this.art||!(this.getArtProgress?this.getArtProgress().ready:Object.values(this.art).every(a=>a.ready)))return null;
 const images={};for(const [key,value]of Object.entries(this.art))if(value.ready)images[key]=value.image;
 const g=new Game(this.canvas,{width:390,height:720,images,preview:true});g.start(0);g.initArt();g.bossSpawned=true;g.wave.phase='boss';g.time=12;g.xpNeed=Infinity;g.player.invincible=9999;g.enemies=[];g.obstacles=[];g.events=[];g.refreshChunks=()=>{};g.messages=[];for(const s of SKILLS)g.skills[s.id]=0;
 const level=mode==='normal'?1:6;for(let i=0;i<level;i++)g.choose(id);if(mode==='evolved'&&RELICS.some(r=>r.id===id)){g.relics[id]=true;g.checkEvolutions();}g.player.hp=Math.floor(g.player.maxHp*.55);g.floaters=[];g.messages=[];g.previewRefill=0;
 return {game:g,key:id+':'+mode,elapsed:0,id,mode};
};
P.updateSkillDemo=function(dt){const item=this.bagDetail;if(!item||item.kind==='buff')return;const id=item.id,key=id+':'+this.previewMode;if(!this.skillDemo||this.skillDemo.key!==key)this.skillDemo=this.createSkillDemo(id,this.previewMode);const demo=this.skillDemo;if(!demo)return;demo.elapsed+=dt;
 if(demo.elapsed>=7){this.previewLoops=(this.previewLoops||0)+1;this.skillDemo=this.createSkillDemo(id,this.previewMode);return;}
 const g=demo.game;g.previewRefill-=dt;if(g.enemies.filter(e=>e.hp>0).length<3&&g.previewRefill<=0){const positions=[[-58,-18],[72,-8],[30,58],[-80,48]];for(let i=0;i<4;i++){g.spawnEnemy('normal',0);const e=g.enemies.at(-1);Object.assign(e,{x:g.player.x+positions[i][0],y:g.player.y+positions[i][1],hp:140,maxHp:140,baseSpeed:0,speed:0,damage:0,ability:Infinity,mechanicTimer:Infinity});}g.previewRefill=.8;}
 if(id==='speed'){const phase=Math.floor(demo.elapsed/1.6)%4;g.keys={};g.keys[['d','s','a','w'][phase]]=true;}
 g.tick(dt);g.gems=[];g.lootDrops=[];g.chests=[];g.xp=0;g.state='playing';
};
P.tick=function(dt){tick.call(this,dt);if(!this.options.preview&&this.state==='codex'&&!this.loadout&&this.bagDetail&&this.bagDetail.kind!=='buff')this.updateSkillDemo(Math.min(.05,dt));else if(this.state!=='codex')this.skillDemo=null;};
P.wrappedText=function(value,x,y,width,size=12,color='#bed0bd',limit=2){const c=this.ctx;c.save();c.font=size+'px "Microsoft YaHei",sans-serif';let line='',row=0;for(const char of String(value)){if(c.measureText(line+char).width>width){this.text(line,x,y+row*20,size,color);row++;line='';if(row>=limit)break;}line+=char;}if(row<limit&&line)this.text(line,x,y+row*20,size,color);c.restore();};
P.drawSkillDemo=function(x,y,w,h){const c=this.ctx,demo=this.skillDemo;this.rect(x,y,w,h,'#102622');if(!demo){this.fxRing(x+w/2,y+h/2,14,'#a7c7ab',.65,this.clock,Math.PI*1.3);return;}const g=demo.game,scale=w/390;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 const terrain=this.art.terrain.image,offsetX=(-g.player.x*scale)%96,offsetY=(-g.player.y*scale)%96;for(let row=-1;row<4;row++)for(let col=-1;col<6;col++)c.drawImage(terrain,0,0,192,192,x+offsetX+col*96,y+offsetY+row*96,96,96);
 c.translate(x,y);c.scale(scale,scale);c.translate(0,-235);g.buttons=[];const protection=g.player.invincible;g.player.invincible=0;g.renderBattle();g.player.invincible=protection;c.restore();if(demo.id==='heal')this.text(Math.ceil(g.player.hp)+' / '+g.player.maxHp,x+12,y+18,11,'#cce4ba');
};
P.renderCatalogDetail=function(item){const skill=SKILLS.find(s=>s.id===item.id),relic=RELICS.find(r=>r.id===item.id),evolved=this.previewMode==='evolved'&&relic;this.heading('',evolved?relic.evolution:item.name);if(skill)this.skillIcon(item.id,329,151,43);
 if(item.kind==='buff'){item.id==='naling'&&this.nalingIcon?this.nalingIcon(195,300,76):this.sprite('explore',item.icon,195,300,76,76);this.wrappedText(item.detail,42,403,306,14);this.button('返回储物袋',24,650,342,42,()=>{this.bagDetail=null;this.skillDemo=null;});return;}
 this.button('普通',24,211,163,34,()=>{this.previewMode='normal';this.skillDemo=null;},this.previewMode==='normal');this.button(relic?'道法升华':'道法自然',203,211,163,34,()=>{this.previewMode=relic?'evolved':'max';this.skillDemo=null;},this.previewMode!=='normal');
 if(!this.skillDemo)this.updateSkillDemo(0);this.panel(24,260,342,200);this.drawSkillDemo(34,270,322,180);this.text(evolved?'升华效果':'功法效果',38,482,13,'#dacf9d');this.wrappedText(evolved?relic.detail:skill.desc,38,505,314,12);
 this.text('升级效果',38,552,13,'#dacf9d');this.wrappedText(skill.effect,38,574,314,12);
 this.text(this.previewMode==='normal'?'一重':'六重',38,601,11,'#a3c6bb');if(relic)this.wrappedText('六重＋'+relic.name+' → '+relic.evolution,91,623,262,11,'#a3c6bb',1);
 this.button('返回储物袋',24,650,342,42,()=>{this.bagDetail=null;this.skillDemo=null;});
};
P.renderCodex=function(){if(this.loadout){codex.call(this);return;}this.overlay();if(this.bagDetail){this.renderCatalogDetail(this.bagDetail);return;}
 this.heading('','储物袋');this.sprite('explore',0,326,154,49,49);this.button('功法',24,211,163,34,()=>(this.catalogTab='skills',this.catalogPage=0),this.catalogTab!=='relics');this.button('法宝',203,211,163,34,()=>(this.catalogTab='relics',this.catalogPage=0),this.catalogTab==='relics');
 const current=this.codexReturn!=='home'&&this.player;let items;if(this.catalogTab==='relics'){items=RELICS.map(r=>({...r,kind:'relic'}));if(current)for(const [id,b]of Object.entries(BUFFS))if(this.buffs[id]>0)items.push({...b,id,kind:'buff'});}else items=SKILLS.map(s=>({...s,kind:'skill'}));
 const catalogPages=Math.max(1,Math.ceil(items.length/8));this.catalogPage=Math.min(this.catalogPage||0,catalogPages-1);items.slice(this.catalogPage*8,this.catalogPage*8+8).forEach((item,i)=>{const x=24+(i%2)*179,y=259+Math.floor(i/2)*86;this.panel(x,y,163,76);if(item.kind==='skill')this.skillIcon(item.id,x+30,y+29,38);else if(item.kind==='relic')this.relicIcon(item.id,x+30,y+29,38);else this.sprite('explore',item.icon,x+30,y+29,38,38);this.text(item.name,x+56,y+26,13,item.color||'#d7dfbd');
 const value=item.kind==='skill'?(current?(this.skills[item.id]?this.skills[item.id]+'重':'未领悟'):(this.save.collection.skills.includes(item.id)?'已发现':'未发现')):item.kind==='buff'?Math.ceil(this.buffs[item.id])+'秒':current?(this.relics[item.id]?'已获得':'未获得'):(this.save.collection.relics.includes(item.id)?'已收集':'未收集');this.text(value,x+56,y+50,10,'#a7bcaa');if(item.kind!=='buff'){const c=this.ctx;c.save();c.fillStyle='#c9ba87';c.beginPath();c.moveTo(x+142,y+42);c.lineTo(x+142,y+54);c.lineTo(x+151,y+48);c.closePath();c.fill();c.restore();}this.buttons.push({x,y,w:163,h:76,action:()=>this.selectCatalogItem(item)});});
 if(catalogPages>1){this.button('上一页',24,182,95,24,()=>this.catalogPage=Math.max(0,this.catalogPage-1));this.button('下一页',271,182,95,24,()=>this.catalogPage=Math.min(catalogPages-1,this.catalogPage+1));}this.button(this.codexReturn==='home'?'返回洞府':'返回历练',24,650,342,42,()=>{this.bagMode=false;this.skillDemo=null;this.state=this.codexReturn||'home';},true);
};
}
const api={install};if(typeof module!=='undefined')module.exports=api;else root.XiuxianRefinements=api;
})(typeof globalThis!=='undefined'?globalThis:this);
