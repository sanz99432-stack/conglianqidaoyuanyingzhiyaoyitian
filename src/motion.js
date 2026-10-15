(function(root){'use strict';
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ROWS=[4,0,1,3,2,5],COLORS=['#a2d988','#ffad70','#a5dfff','#b8c5fa','#bcceff','#93e9d8'];
const PERSISTENT=new Set(['poison','fire','ice','beam','sweep','chain']);
function frameFor(progress){return Math.min(7,Math.floor(clamp(progress)*8));}
function install(Game){const P=Game.prototype;if(P._motionInstalled)return;P._motionInstalled=true;
const start=P.start,tick=P.tick,resolve=P.resolveThreat,battle=P.renderBattle,effect=P.renderEffect,projectile=P.renderProjectile;
P.start=function(stage){start.call(this,stage);this.motionTime=0;this.fxEchoes=[];};
P.tick=function(dt){if(this.state==='playing'){this.motionTime=(this.motionTime||0)+dt;for(const e of this.fxEchoes||[])e.life-=dt;this.fxEchoes=(this.fxEchoes||[]).filter(e=>e.life>0);}tick.call(this,dt);};
P.resolveThreat=function(t,dt){if(t.age>=t.delay&&!t.motionStarted&&t.kind!=='followStrike'){
 t.motionStarted=true;if(!PERSISTENT.has(t.kind)&&(t.kind!=='portal'||this.enemies.some(e=>e.id===t.owner&&e.hp>0))){const duration=t.kind==='portal'?.8:['iceCone','fireCone'].includes(t.kind)?.65:.55;this.fxEchoes=this.fxEchoes||[];this.fxEchoes.push({...t,life:duration,max:duration});if(this.fxEchoes.length>40)this.fxEchoes.shift();}
}resolve.call(this,t,dt);};
P.combatClip=function(draw){const c=this.ctx;c.save();c.beginPath();c.rect(0,98,390,535);c.clip();draw();c.restore();};
P.motionSprite=function(row,progress,x,y,w,h=w,angle=0,alpha=1){return this.sprite('motionfx',row*8+frameFor(progress),x,y,w,h,angle,clamp(alpha));};
P.fxGlow=function(x,y,r,color,strength){if(!this.save.glow||this.detailGlowBudget--<=0)return;const c=this.ctx;c.save();const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.globalAlpha=clamp(strength);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();};
P.fxRing=function(x,y,r,color,alpha=1,angle=0,span=TAU){const c=this.ctx;c.save();c.strokeStyle=color;c.globalAlpha=clamp(alpha);c.lineWidth=1.3;c.beginPath();c.arc(x,y,Math.max(1,r),angle,angle+span);c.stroke();c.restore();};
P.drawTelegraph=function(t,progress){const c=this.ctx,q=this.worldPoint(t),p=clamp(progress),radius=t.r||35;if(q.x<-380||q.x>770||q.y<-230||q.y>970)return;
 const path=()=>{c.beginPath();if(t.kind==='beam'||t.kind==='sweep'||t.kind==='dash'){const end=t.kind==='dash'?{x:t.x+Math.cos(t.angle)*145,y:t.y+Math.sin(t.angle)*145}:this.rayEnd(t,t.angle),b=this.worldPoint(end),nx=-Math.sin(t.angle)*10,ny=Math.cos(t.angle)*10;c.moveTo(q.x+nx,q.y+ny);c.lineTo(b.x+nx,b.y+ny);c.lineTo(b.x-nx,b.y-ny);c.lineTo(q.x-nx,q.y-ny);c.closePath();}
 else if(t.kind==='chain'){for(let i=0;i<t.nodes.length-1;i++){const a=this.worldPoint(t.nodes[i]),b=this.worldPoint(t.nodes[i+1]);const d=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/d*10,ny=(b.x-a.x)/d*10;c.moveTo(a.x+nx,a.y+ny);c.lineTo(b.x+nx,b.y+ny);c.lineTo(b.x-nx,b.y-ny);c.lineTo(a.x-nx,a.y-ny);c.closePath();}}
 else if(t.kind==='iceCone'||t.kind==='fireCone'){c.moveTo(q.x,q.y);c.arc(q.x,q.y,radius,t.angle-t.spread,t.angle+t.spread);c.closePath();}
 else c.arc(q.x,q.y,radius,0,TAU);};
 c.save();path();c.strokeStyle='#071713';c.globalAlpha=.7;c.lineWidth=3.5;c.stroke();path();c.strokeStyle='#f5b77b';c.globalAlpha=.6+p*.22;c.lineWidth=1.2;c.stroke();
 if(t.kind!=='chain'){c.fillStyle='#f2ac77';c.globalAlpha=.025+p*.018;c.fill();}
 if(!['beam','sweep','dash','chain','iceCone','fireCone'].includes(t.kind)){c.globalAlpha=.7;c.strokeStyle='#ffe0a3';c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,radius+2,-Math.PI/2,-Math.PI/2+TAU*p);c.stroke();}
 else if(t.kind==='iceCone'||t.kind==='fireCone'){c.globalAlpha=.8;c.strokeStyle='#ffe0a3';c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,radius,t.angle-t.spread,t.angle-t.spread+2*t.spread*p);c.stroke();}
 else if(t.kind==='chain'){for(const n of t.nodes){const v=this.worldPoint(n);this.fxRing(v.x,v.y,10,'#ffe0a3',.75,-Math.PI/2,TAU*p);}}
 c.restore();};
P.renderCombatGround=function(){this.combatClip(()=>{
 for(const h of this.hazards||[])this.drawTelegraph({kind:'circle',x:h.x,y:h.y,r:h.r},1-h.life/h.max);
 for(const t of this.threats||[]){if(t.kind==='followStrike'||t.kind==='portal'&&!this.enemies.some(e=>e.id===t.owner&&e.hp>0))continue;if(t.age<t.delay){this.drawTelegraph(t,t.age/(t.delay||1));continue;}if(['fire','ice','poison'].includes(t.kind)){const q=this.worldPoint(t);this.fxRing(q.x,q.y,t.r,'#e2ad7d',.36);}}
 for(const e of this.enemies){if(e.hp<=0)continue;if(e.phase==='warn')this.drawTelegraph({kind:'dash',x:e.x,y:e.y,angle:e.dashAngle||0},1-e.phaseTime/.7);if(e.phase==='armed')this.drawTelegraph({kind:'circle',x:e.x,y:e.y,r:60+(e.kind==='elite'?15:0)},1-e.phaseTime/1.1);}
 const p=this.player,q=this.worldPoint(p),cycle=(this.motionTime*10)%8/8;if(p.root>0){this.motionSprite(4,cycle,q.x,q.y+10,56,42,0,.55);this.fxRing(q.x,q.y+10,21,'#a7df93',.6);}if(p.freeze>0){this.motionSprite(1,.25+cycle*.35,q.x,q.y+12,58,40,0,.7);this.fxRing(q.x,q.y,24,'#b3eaff',.6);}
});};
P.drawEnergyLine=function(a,b,color,lightning=false,seed=0){const c=this.ctx,d=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/(d||1),ny=(b.x-a.x)/(d||1);c.save();c.strokeStyle=color;c.globalAlpha=.17;c.lineWidth=18;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.globalAlpha=.72;c.lineWidth=lightning?2.1:6;c.beginPath();c.moveTo(a.x,a.y);const n=Math.ceil(d/22);for(let i=1;i<n;i++){const f=i/n,j=lightning?Math.sin(i*11+Math.floor(this.motionTime*24)+seed)*5:Math.sin(f*15-this.motionTime*15)*1.3;c.lineTo(a.x+(b.x-a.x)*f+nx*j,a.y+(b.y-a.y)*f+ny*j);}c.lineTo(b.x,b.y);c.stroke();c.globalAlpha=.85;c.strokeStyle='#eefaf2';c.lineWidth=1;c.stroke();c.restore();};
P.drawThreatMotion=function(t,progress,fade=1){const q=this.worldPoint(t),c=this.ctx,time=this.motionTime||0;if(q.x<-380||q.x>770||q.y<-230||q.y>970)return;
 if(t.kind==='beam'||t.kind==='sweep'){const angle=t.kind==='sweep'?t.angle+(t.age-t.delay)*1.25:t.angle,end=this.rayEnd(t,angle),b=this.worldPoint(end);this.drawEnergyLine(q,b,'#83dfc7',false);this.motionSprite(5,(time*16)%8/8,q.x+Math.cos(angle)*12,q.y+Math.sin(angle)*12,48,48,angle,.6);return;}
 if(t.kind==='chain'){for(let i=0;i<t.nodes.length-1;i++)this.drawEnergyLine(this.worldPoint(t.nodes[i]),this.worldPoint(t.nodes[i+1]),'#b6cfff',true,i);for(const n of t.nodes){const v=this.worldPoint(n);this.motionSprite(2,(time*13)%8/8,v.x,v.y-9,38,46,0,.65);}return;}
 const rows={fire:0,fireBlast:0,fireCone:0,ice:1,spike:1,iceCone:1,strike:2,portal:3,ambush:3,poison:4,thornSeed:4},row=rows[t.kind]===undefined?5:rows[t.kind];
 if(['fire','ice','poison'].includes(t.kind)){const r=t.r||40,phase=((time*10+(t.x+t.y)*.03)%8+8)%8/8;for(let i=0;i<(this.detailDense?2:3);i++){const a=i*TAU/3+time*.16,x=q.x+Math.cos(a)*r*.35,y=q.y+Math.sin(a)*r*.3;this.motionSprite(row,(phase+i*.23)%1,x,y-5,r*.85,r*.75,0,.44);}return;}
 if(t.kind==='fireCone'||t.kind==='iceCone'){c.save();c.beginPath();c.moveTo(q.x,q.y);c.arc(q.x,q.y,t.r,t.angle-t.spread,t.angle+t.spread);c.closePath();c.clip();const travel=t.r*(.3+progress*.6),x=q.x+Math.cos(t.angle)*travel,y=q.y+Math.sin(t.angle)*travel;this.motionSprite(row,progress,x,y,t.r*.95,t.r*.95,t.angle,fade*.78);c.restore();return;}
 const r=t.r||40,size=t.kind==='strike'?88:Math.min(150,r*2);this.motionSprite(row,progress,q.x,q.y-(t.kind==='strike'?24:0),size,t.kind==='strike'?132:size,0,fade*.85);
 if(progress<.6){const color=['#ffb079','#a6def5','#b8caff','#bfceee','#a2d988','#93e9d8'][row];this.fxRing(q.x,q.y,Math.max(9,r*(.3+progress*1.2)),color,fade*.38);this.fxGlow(q.x,q.y,Math.min(65,r),color,.12*fade);}
};
P.renderCombatForeground=function(){this.combatClip(()=>{
 for(const t of this.threats||[])if(t.age>=t.delay&&PERSISTENT.has(t.kind))this.drawThreatMotion(t,(this.motionTime*12)%8/8);
 for(const e of this.fxEchoes||[])this.drawThreatMotion(e,1-e.life/e.max,Math.min(1,e.life/e.max*2));
 for(const e of this.enemies){const q=this.worldPoint(e);if(q.x<-90||q.x>480||q.y<70||q.y>690)continue;if(e.phase==='dash'){const a=e.dashAngle||0;this.motionSprite(ROWS[e.biome||0],(this.motionTime*18)%8/8,q.x-Math.cos(a)*18,q.y-Math.sin(a)*18,44,35,a,.35);}if(e.guard>0){this.sprite('mechanicfx',20,q.x,q.y,67,67,e.guardAngle,.5+Math.sin(this.motionTime*6)*.07);this.fxRing(q.x,q.y,29,'#9be8ce',.6,e.guardAngle-.65,1.3);}}
});};
P.renderEffect=function(e,q){if(q.x<-180||q.x>570||q.y<25||q.y>820)return;const progress=clamp(1-e.life/e.max),fade=Math.min(1,e.life/e.max*2),time=this.motionTime||0;
 if(e.gearShield){this.sprite('pack',13,q.x,q.y-12,73+Math.sin(progress*Math.PI)*7,73+Math.sin(progress*Math.PI)*7,0,fade*.62);this.motionSprite(5,progress,q.x,q.y,56,56,time*.15,fade*.28);return;}
 if(e.enemyVfx&&e.biome!==undefined){const row=ROWS[e.biome],r=e.enemyVfx==='cast'?Math.min(45,e.r):Math.min(76,e.r);if(e.enemyVfx==='cast'){this.sprite('biomefx',e.biome*6+1,q.x,q.y,r*1.5,r*1.5,time*.5,fade*.72);this.fxRing(q.x,q.y,r*(.6+progress*.35),COLORS[e.biome],fade*.55,-time,TAU*.7);this.motionSprite(row,progress,q.x,q.y,40,40,0,fade*.6);}else this.motionSprite(row,progress,q.x,q.y-(row===2?18:0),r*2,row===2?r*2.8:r*2,0,fade*.8);return;}
 if(e.bolt||e.ultimate==='thunder'){const ult=e.ultimate==='thunder';this.motionSprite(2,progress,q.x,q.y-(ult?38:25),ult?91:57,ult?151:102,0,fade*(ult?.83:.68));if(ult){for(let i=0;i<2;i++){const a={x:q.x+(i?14:-14),y:q.y-70},b={x:q.x+(i?26:-26),y:q.y+2};this.drawEnergyLine(a,b,'#e4d7ff',true,i);}this.fxRing(q.x,q.y+3,25+progress*18,'#d8dcff',fade*.52);}return;}
 if(e.ultimate==='fire'||e.ultimate==='ice'||e.art==='ice'){const row=e.ultimate==='fire'?0:1,r=Math.min(e.ultimate?155:105,e.r*1.5);this.motionSprite(row,progress,q.x,q.y,r,r,0,fade*(e.ultimate?.72:.5));this.fxRing(q.x,q.y,e.r*(.3+progress*.7),row?'#b3dfff':'#f3b580',fade*.4);return;}
 if(e.ultimate==='sword'){this.sprite('ultimate',frameFor(progress)>>1,q.x,q.y,140,140,progress*.3,fade*.36);for(let i=0;i<6;i++){const a=i*TAU/6+progress*1.3,r=e.r*(.4+progress*.55);this.drawSword(q.x+Math.cos(a)*r,q.y+Math.sin(a)*r,a+Math.PI/2,true,.85,false);}this.fxRing(q.x,q.y,e.r*(.35+progress*.6),'#bde2bd',fade*.4);return;}
 if(e.art==='wave'){for(let i=0;i<2;i++){const p=clamp(progress-i*.12);this.fxRing(q.x,q.y,e.r*(.18+p*.82),'#e6c5d0',fade*(i?.3:.6));}this.sprite('vfx2',8+(frameFor(progress)>>1),q.x,q.y,e.r*1.25,e.r*1.25,progress*.2,fade*.35);return;}
 if(e.art==='heal'){this.sprite('vfx2',12+(frameFor(progress)>>1),q.x,q.y-16,e.r*1.7,e.r*1.7,progress*.18,fade*.6);for(let i=0;i<3;i++){const a=time*1.2+i*TAU/3,x=q.x+Math.cos(a)*22,y=q.y-Math.sin(a)*8-progress*24;this.rect(x,y,2,3,'#c8ebaf');}return;}
 if(e.impact){if(this.detailSparkBudget--<=0)return;this.sprite('vfx',12+(frameFor(progress)>>1),q.x,q.y,30*(.6+progress*.7),30*(.6+progress*.7),0,fade*.68);return;}
 effect.call(this,e,q);
};
P.renderProjectile=function(b,q){if(q.x<-65||q.x>455||q.y<65||q.y>685)return;const time=this.motionTime||0,a=Math.atan2(b.vy,b.vx),phase=((time*14+(b.x+b.y)*.004)%8+8)%8/8,c=this.ctx;
 if(b.enemy){const biome=b.biome||0;if(biome===1)this.sprite('vfx',4+(frameFor(phase)>>1),q.x,q.y,29,29,a,.92);else this.sprite('biomefx',biome*6,q.x,q.y,26,26,a+Math.sin(time*10)*.07,.9);c.save();c.strokeStyle=COLORS[biome];c.globalAlpha=.35;c.lineWidth=2;c.beginPath();c.moveTo(q.x-Math.cos(a)*7,q.y-Math.sin(a)*7);c.lineTo(q.x-Math.cos(a)*20,q.y-Math.sin(a)*20);c.stroke();c.restore();return;}
 if(b.art==='fire'){this.sprite('vfx',4+(frameFor(phase)>>1),q.x,q.y,30,30,a,.9);if(!this.detailDense)this.motionSprite(0,phase,q.x-Math.cos(a)*13,q.y-Math.sin(a)*13,23,20,a,.35);return;}
 projectile.call(this,b,q);
};
P.renderZone=function(z,q){if(q.x<-z.r||q.x>390+z.r||q.y<98-z.r||q.y>633+z.r)return;const row=z.art==='fire'?0:1,color=row?'#96d8e5':'#dfa36b';this.fxRing(q.x,q.y,z.r,color,.16);const count=this.detailDense?2:3;for(let i=0;i<count;i++){const a=i*TAU/count+this.motionTime*.1,phase=((this.motionTime*9+i*1.7)%8)/8;this.motionSprite(row,phase,q.x+Math.cos(a)*z.r*.4,q.y+Math.sin(a)*z.r*.35,42,42,0,.24);}};
P.renderBattle=function(){this.detailDense=this.bullets.length>35||this.enemies.length>60;this.detailSparkBudget=this.detailDense?5:14;this.detailGlowBudget=this.detailDense?2:6;battle.call(this);if(this.player.cold>1){const y=302;this.sprite('mechanicfx',8,32,y-2,21,21);this.text('寒冷 '+Math.round(this.player.cold)+'%',48,y,10,'#b6dff0');}};
}
const api={install,frameFor};if(typeof module!=='undefined')module.exports=api;else root.XiuxianMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
