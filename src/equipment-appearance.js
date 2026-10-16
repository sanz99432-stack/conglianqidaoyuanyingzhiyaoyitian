(function(root){'use strict';
const NAMES=['青冥·竹影剑匣','流云·赤羽法衣','玄霜·悬镜冰轮','星陨·双月灵珠','九霄·驭雷臂铠','太清·天阙剑翼'];
function install(Game,SHEETS,LEGENDS){const P=Game.prototype;if(P._equipmentAppearanceInstalled)return;P._equipmentAppearanceInstalled=true;SHEETS.treasurelook18=[8,7,128];for(let i=0;i<6;i++)LEGENDS[i].name=NAMES[i];LEGENDS[1].desc=LEGENDS[1].desc.replaceAll('炉火','羽火');LEGENDS[3].desc=LEGENDS[3].desc.replaceAll('魂火','月魂');LEGENDS[4].desc=LEGENDS[4].desc.replace('敲响震雷环','臂铠引出连环电弧');
const required=P.requiredArtNames,combat=P.combatArtNames,pixel=P.pixelSprite,icon=P.treasureIcon;
P.requiredArtNames=function(){const names=required.call(this);if(this.loadout&&!names.includes('treasurelook18'))names.push('treasurelook18');return names;};
P.combatArtNames=function(){const id=this.loadout?this.save.vault?.legend:this.runLegend||this.save.vault?.legend;return combat.call(this).filter(n=>n!=='treasurelook18'||NAMES[Number(id?.slice(6))]);};
P.treasureIcon=function(item,x,y,size){if(item.rarity==='legend'&&this.art?.treasurelook18?.ready){return this.sprite('treasurelook18',48+item.stage,x,y,size,size);}return icon.call(this,item,x,y,size);};
P.pixelSprite=function(x,y,type,color,size=1,e){const stage=Number(this.runLegend?.slice(6));if(type==='hero'&&this.player&&NAMES[stage]&&this.art?.treasurelook18?.ready){const c=this.ctx,frame=this.moving?Math.floor((this.walkPhase||0)*8)%8:0;this.shadow(x,y+13*size,17*size,.28);c.save();c.translate(x,y-21*size);if(Math.cos(this.player.angle||0)<-.3)c.scale(-1,1);this.sprite('treasurelook18',stage*8+frame,0,0,96*size,96*size);c.restore();if(this.robeShield>0)this.sprite('pack',13,x,y-12,69*size,69*size,0,.5);if(this.lotusShield>0)this.sprite('qUlt',18,x,y+3,74,74,0,.65);return;}return pixel.call(this,x,y,type,color,size,e);};
}
const api={install,NAMES};if(typeof module!=='undefined')module.exports=api;else root.XiuxianEquipmentAppearance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
