(function(root){'use strict';
const clamp=v=>Math.max(0,Math.min(1,v));
function install(Game,RELICS){const P=Game.prototype;if(P._upgradeChoiceInstalled)return;P._upgradeChoiceInstalled=true;
const levelUp=P.levelUp,down=P.pointerDown,move=P.pointerMove,up=P.pointerUp,pause=P.pause;
P.beginUpgradeChoice=function(){this.upgradeChoice={opened:this.clock,selected:null,selectedAt:0,committed:false};this.upgradePress=null;this.joy=null;this.keys={};this.buttons=[];if(this.targetTaps)this.targetTaps.clear();};
P.levelUp=function(){levelUp.call(this);if(this.state==='upgrade')this.beginUpgradeChoice();};
P.cancelPointerInputs=function(){this.heldPointers=new Set();this.upgradePress=null;this.joy=null;if(this.targetTaps)this.targetTaps.clear();};
P.pause=function(){this.cancelPointerInputs();return pause.call(this);};
P.pointerDown=function(p){const held=this.heldPointers||(this.heldPointers=new Set()),alreadyHeld=held.size;held.add(p.id);if(this.state!=='upgrade')return down.call(this,p);
 if(this.options.audio)this.options.audio.unlock();const ui=this.upgradeChoice;if(!ui||ui.committed||this.clock-ui.opened<.36||alreadyHeld){this.upgradePress=null;return;}
 const q=this.inputPoint(p),button=this.buttons.slice().reverse().find(b=>q.x>=b.x&&q.x<=b.x+b.w&&q.y>=b.y&&q.y<=b.y+b.h);
 this.upgradePress=button?{id:p.id,x:q.x,y:q.y,button,ui,moved:false}:null;
};
P.pointerMove=function(p){if(this.state!=='upgrade')return move.call(this,p);const press=this.upgradePress;if(press&&press.id===p.id){const q=this.inputPoint(p);if(Math.hypot(q.x-press.x,q.y-press.y)>10)press.moved=true;}};
P.pointerUp=function(p){if(this.heldPointers)this.heldPointers.delete(p.id);if(this.state!=='upgrade')return up.call(this,p);const press=this.upgradePress;if(!press||press.id!==p.id)return;this.upgradePress=null;const q=this.inputPoint(p),b=press.button;
 if(press.ui===this.upgradeChoice&&!press.moved&&Math.hypot(q.x-press.x,q.y-press.y)<=10&&q.x>=b.x&&q.x<=b.x+b.w&&q.y>=b.y&&q.y<=b.y+b.h)b.action();
};
P.pointerCancel=function(p){if(this.heldPointers)this.heldPointers.delete(p.id);if(this.upgradePress?.id===p.id)this.upgradePress=null;up.call(this,p);};
P.selectUpgradeChoice=function(id,ui=this.upgradeChoice){if(this.state!=='upgrade'||ui!==this.upgradeChoice||ui.committed||this.clock-ui.opened<.36||!this.choices.some(s=>s.id===id))return;ui.selected=id;ui.selectedAt=this.clock;this.soundEvent('tap');};
P.confirmUpgradeChoice=function(ui=this.upgradeChoice){if(this.state!=='upgrade'||!ui||ui!==this.upgradeChoice||ui.committed||!ui.selected||this.clock-ui.selectedAt<.18||!this.choices.some(s=>s.id===ui.selected))return false;
 ui.committed=true;const id=ui.selected;this.upgradePress=null;this.buttons=[];this.choose(id);this.effects.push({x:this.player.x,y:this.player.y,r:46,life:.6,max:.6,art:'heal',color:'#e8d49a'});return true;
};
P.renderUpgrade=function(){if(!this.upgradeChoice)this.beginUpgradeChoice();const ui=this.upgradeChoice,age=this.clock-ui.opened,c=this.ctx;this.overlay();this.heading('灵 气 充 盈','悟得新功法','第 '+this.level+' 阶');
 this.choices.forEach((s,i)=>{const t=clamp((age-i*.045)/.25),ease=1-(1-t)**3,y=219+i*124,offset=(1-ease)*16,selected=ui.selected===s.id,select=selected?clamp((this.clock-ui.selectedAt)/.2):0,lv=this.skills[s.id]||0,r=RELICS.find(r=>r.id===s.id);
 c.save();c.globalAlpha=t;c.translate(0,offset);this.panel(24,y,342,112,'#15342ff5',s.color);
 if(selected){this.rect(33,y+10,324,92,'#b8c78118');c.strokeStyle='#e6d18d';c.lineWidth=1+select;c.strokeRect(31,y+7,328,98);for(let j=0;j<4;j++){const x=38+j*103;this.rect(x,y+5,5,3,'#ead89e');}this.text('已选',339,y+88,11,'#f0dc9e','right');}
 this.skillIcon(s.id,65,y+47,selected?62+Math.sin(select*Math.PI)*5:58);this.text(s.name,107,y+25,18,'#f0e4bf');this.text((lv?'精进':'领悟')+' · '+(lv+1)+'重',343,y+25,11,s.color,'right');this.wrappedText(lv?s.effect:s.desc,107,y+50,235,11,'#bed0bd',2);
 const recipe=r?(this.relics?.[s.id]?'法宝已齐 · ':'需 '+r.name+' · ')+r.evolution:'道法自然';this.wrappedText(recipe,107,y+88,selected?190:235,10,'#d3c18d',1);
 for(let j=0;j<6;j++)this.rect(108+j*13,y+101,9,3,j<lv?'#b3bd88':j===lv?'#ead49a':'#304a3c');c.restore();
 if(age>=.36)this.buttons.push({x:24,y,w:342,h:112,action:()=>this.selectUpgradeChoice(s.id,ui)});
 });
 const selected=this.choices.find(s=>s.id===ui.selected),ready=selected&&this.clock-ui.selectedAt>=.18;
 this.button(selected?'确认修习 · '+selected.name:'请选择功法',36,612,318,48,()=>this.confirmUpgradeChoice(ui),true,!ready);
};
}
const api={install};if(typeof module!=='undefined')module.exports=api;else root.XiuxianUpgradeChoice=api;
})(typeof globalThis!=='undefined'?globalThis:this);
