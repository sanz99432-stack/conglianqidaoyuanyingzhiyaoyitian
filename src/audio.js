(function(root){'use strict';
class AudioManager{
 constructor(factory){this.factory=factory;this.enabled=false;this.hidden=false;this.music={};this.effects={};this.last={};this.now=0;this.active=null;this.voices=[];this.playing=false;this.save=null;}
 unlock(){this.enabled=true;}
 create(name,loop){const node=this.factory();node.src='assets/audio/'+name+'.mp3';node.loop=loop;node.autoplay=false;if('preload' in node)node.preload='auto';return node;}
 play(node){try{const promise=node.play();if(promise&&promise.catch)promise.catch(()=>{});}catch(e){}}
 effect(name,save){
  if(name==='hit'||name.startsWith('hit-')||name==='enemy-break')return;
  if(!this.enabled||this.hidden||save.sound===false)return;
  const volume=typeof save.sfxVolume==='number'?save.sfxVolume:.65;if(volume<=0)return;
  const time=Date.now()/1000,impact=name.startsWith('hit-')||name==='enemy-break',key=impact?'impact':name;
  const limit=impact?.1:({hit:.25,sword:.28,fire:.45,thunder:.7,ice:.7,wave:.65,orbit:1.1,heal:2,speed:2,step:.4,hurt:.4,pickup:.12,'sword-ultimate':2,'fire-ultimate':2,'thunder-ultimate':2,'ice-ultimate':2}[name]||.08);
  if(time-(this.last[key]||0)<limit)return;
  this.voices=this.voices.filter(v=>v.until>time);if(impact&&this.voices.filter(v=>v.impact).length>=2)return;
  const priority=impact?3:['hurt','win','lose','upgrade','relic'].includes(name)?4:1;
  if(this.voices.length>=5){const lower=this.voices.findIndex(v=>(v.priority||1)<priority);if(lower<0)return;const removed=this.voices.splice(lower,1)[0];try{if(removed.node)removed.node.pause();}catch(e){}}
  this.last[key]=time;
  const sequence=this.variantSequence=(this.variantSequence||0)+1;
  const filename=name.startsWith('hit-')?name+'-'+sequence%3:name==='enemy-break'?name+'-'+sequence%2:({tap:'tap-v2',step:'step-v2',upgrade:'upgrade-v2',relic:'relic-v2'}[name]||name);
  try{const group=this.effects[filename]||(this.effects[filename]={nodes:[this.create(filename,false),this.create(filename,false)],index:0});const node=group.nodes[group.index++%2];
   node.volume=volume*(impact?.78:name==='step'?.12:name==='hit'?.22:name==='orbit'?.32:name.includes('ultimate')?.62:.5);
   if(node.seek)node.seek(0);else node.currentTime=0;this.play(node);
   const duration=impact?(name==='enemy-break'?.38:.26):name.includes('ultimate')?1.4:({sword:.36,fire:.65,thunder:1.15,ice:.75,wave:.65,orbit:.38,speed:.7,heal:1,pickup:.24,hit:.18,step:.16,tap:.16,hurt:.3,upgrade:.85,relic:.85,ascend:1.1,win:1.6,lose:.9}[name]||.5);
   this.voices.push({until:time+duration,node,priority,impact});
  }catch(e){}
 }

 sync(state,save){this.save=save;const volume=typeof save.musicVolume==='number'?save.musicVolume:.35;const stopped=!this.enabled||this.hidden||save.music===false||volume<=0||['paused','dead','ad'].includes(state);if(stopped){if(this.active&&this.playing){this.active.pause();this.playing=false;}return;}
  const track='music-user';try{const node=this.music[track]||(this.music[track]=this.create(track,true));if(node!==this.active){if(this.active)this.active.pause();this.active=node;this.playing=false;}node.volume=volume*(state==='upgrade'||state==='treasure'?.65:1);if(!this.playing){this.play(node);this.playing=true;}}catch(e){}
 }
 visibility(hidden){this.hidden=hidden;if(hidden){Object.values(this.music).forEach(n=>n.pause());Object.values(this.effects).forEach(g=>g.nodes.forEach(n=>n.pause()));this.playing=false;}}
}
const api={AudioManager};if(typeof module!=='undefined')module.exports=api;else root.XiuxianAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this);
