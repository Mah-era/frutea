/* global Phaser */
(() => {
  'use strict';

  const W=1600,H=900,WORLD_W=7200,TOTAL_FRUIT=36;
  const C={cream:0xfff9ee,wine:0x57001e,deep:0x70002a,red:0xe8143e,coral:0xff5d63,yellow:0xfff04d,mango:0xff8c1a,lychee:0xff74a6,sky:0x8fe1f5,mint:0x8fe59a,green:0x17885f};
  const FRUITS=['lemon','mango','lychee','orange','strawberry'];
  const run={score:0,fruit:0,lives:3,started:false,finished:false,paused:false,sound:true};

  class RetroAudio{
    constructor(){this.ctx=null;this.master=null;this.timer=null;this.step=0;this.enabled=true;}
    init(){
      if(this.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.32;this.master.connect(this.ctx.destination);
    }
    note(freq,duration=.08,type='square',volume=.08,delay=0){
      if(!this.enabled)return;this.init();if(!this.ctx)return;this.ctx.resume();
      const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g).connect(this.master);o.start(t);o.stop(t+duration+.02);
    }
    sfx(name){
      const sounds={jump:[[330,.07,'square'],[495,.08,'square',.045]],fruit:[[660,.06,'square'],[880,.09,'square',.06]],stomp:[[150,.08,'square'],[95,.12,'square',.05]],hurt:[[180,.08,'sawtooth'],[105,.2,'sawtooth',.07]],spring:[[300,.06,'square'],[600,.07,'square',.05],[900,.1,'square',.1]],checkpoint:[[523,.08,'square'],[659,.08,'square',.09],[784,.12,'square',.18]],win:[[523,.1,'square'],[659,.1,'square',.11],[784,.12,'square',.22],[1047,.25,'square',.34]]};
      (sounds[name]||[]).forEach(([f,d,t,delay=0])=>this.note(f,d,t,.075,delay));
    }
    startMusic(){
      this.init();if(!this.ctx||this.timer)return;const melody=[659,0,784,0,880,784,659,0,587,0,659,0,784,659,587,0,523,0,659,0,784,659,523,0,440,0,523,587,659,0,587,0],bass=[131,131,165,165,147,147,196,196];
      this.timer=setInterval(()=>{if(!this.enabled||run.paused||run.finished)return;const m=melody[this.step%melody.length],b=bass[Math.floor(this.step/4)%bass.length];if(m)this.note(m,.085,'square',.025);if(this.step%4===0)this.note(b,.19,'triangle',.055);this.step++;},125);
    }
    toggle(){this.enabled=!this.enabled;if(this.master)this.master.gain.setTargetAtTime(this.enabled ? .32 : 0,this.ctx.currentTime,.02);return this.enabled;}
  }
  const audio=new RetroAudio();

  class FruitRush extends Phaser.Scene{
    constructor(){super('FruitRush');}
    preload(){
      const embedded=window.FRUTEA_GAME_ASSETS||{},load=(key,fallback)=>this.load.image(key,embedded[key]||fallback);
      ['main-mascot-clean','running','energetic','refreshed','sad','celebrating','angry','happy','surprised','confident','playful','curious','dancing','cool','thumbs-up','pointing','holding-lemon','holding-mango','holding-lychee','holding-orange','holding-strawberry'].forEach(n=>load(`mascot-${n}`,`sprites/mascot/${n}.png?v=11`));
      FRUITS.forEach(n=>load(`fruit-${n}`,`sprites/fruits/${n}.png?v=11`));
      load('mix-pack','sprites/products/mix-pack-box.png?v=11');
    }
    create(){
      Object.assign(run,{score:0,fruit:0,lives:3,started:false,finished:false,paused:false});
      this.physics.world.setBounds(0,0,WORLD_W,H);this.cameras.main.setBounds(0,0,WORLD_W,H);
      this.makeTextures();this.makeWorld();this.makePlayer();this.makeHud();this.makeIntro();this.bindControls();
      this.cameras.main.fadeIn(450,255,249,238);this.lastGroundedAt=0;this.jumpQueuedAt=-9999;this.lastInputAt=0;this.idleIndex=0;this.state='idle';this.spawnX=190;
    }
    makeTextures(){
      const g=this.make.graphics({x:0,y:0,add:false});
      g.fillStyle(C.red).fillRoundedRect(0,0,86,128,18);g.lineStyle(7,C.wine).strokeRoundedRect(0,0,86,128,18);g.fillStyle(0x21232c).fillRoundedRect(10,13,66,88,10);g.fillStyle(C.sky).fillRoundedRect(17,20,52,68,7);g.lineStyle(4,C.wine).lineBetween(24,39,36,45).lineBetween(62,39,50,45);g.fillStyle(C.wine).fillCircle(31,51,5).fillCircle(55,51,5);g.lineStyle(4,C.wine).beginPath().moveTo(29,72).lineTo(38,65).lineTo(47,72).lineTo(57,64).strokePath();g.fillStyle(C.yellow).fillCircle(43,113,7);g.generateTexture('phone',86,128);g.clear();
      g.fillStyle(C.wine).fillRect(0,0,260,54);g.fillStyle(C.red).fillRect(0,0,260,12);g.fillStyle(C.coral).fillRect(0,12,260,7);g.generateTexture('platform',260,54);g.clear();
      g.fillStyle(0xffffff,.96).fillCircle(58,66,36).fillCircle(108,44,50).fillCircle(164,65,38).fillEllipse(110,79,184,58);g.fillStyle(0xfff9ee,.55).fillEllipse(112,90,150,22);g.generateTexture('cloud',220,112);g.clear();
      g.fillStyle(C.yellow).fillRoundedRect(0,0,120,28,9);g.lineStyle(5,C.wine).strokeRoundedRect(0,0,120,28,9);for(let x=15;x<110;x+=24){g.fillStyle(C.red).fillTriangle(x,20,x+10,6,x+20,20);}g.generateTexture('spring',120,28);g.clear();
      g.fillStyle(C.red).fillCircle(18,18,18);g.fillStyle(C.yellow).fillCircle(18,18,7);g.generateTexture('spark',36,36);g.clear();
      g.fillStyle(C.cream).fillRect(0,0,44,44);g.fillStyle(C.wine).fillRect(0,0,22,22).fillRect(22,22,22,22);g.generateTexture('checker',44,44);g.destroy();
    }
    makeWorld(){
      this.zoneNames=['LEMON LANE','MANGO METRO','LYCHEE LOOP','ORANGE OVERDRIVE','STRAWBERRY SPRINT'];
      this.zoneColors=[C.yellow,C.mango,C.lychee,0xff641f,C.red];
      this.zoneBackgrounds=[C.sky,0xffc46b,0xffb7d1,0xffa45d,0xff8fa7];
      this.activeZone=0;
      this.skyBackdrop=this.add.rectangle(W/2,H/2,W,H,this.zoneBackgrounds[0]).setScrollFactor(0).setDepth(-20);
      this.add.circle(1120,170,115,C.yellow).setStrokeStyle(10,C.cream,.8);
      this.add.circle(2220,210,150,0xff7b26,.72).setStrokeStyle(16,0xffe09b,.55);
      [[3030,175,75],[3200,250,48],[3370,145,62]].forEach(([x,y,r])=>this.add.circle(x,y,r,C.lychee,.45).setStrokeStyle(8,C.cream,.45));
      const orangeRays=this.add.graphics();orangeRays.lineStyle(16,0xfff0a3,.35);for(let i=0;i<9;i++){const a=i*Math.PI/4.5;orangeRays.lineBetween(5040+Math.cos(a)*90,190+Math.sin(a)*90,5040+Math.cos(a)*260,190+Math.sin(a)*260);}orangeRays.fillStyle(0xff641f,.5).fillCircle(5040,190,105);
      for(let x=5900;x<7100;x+=150)for(let y=120;y<420;y+=125)this.add.ellipse(x+(y%250?65:0),y,18,32,C.yellow,.34).setAngle(18);
      FRUITS.forEach((type,i)=>{this.add.image(i*1440+1180,330,`fruit-${type}`).setDisplaySize(300,300).setAlpha(.1).setAngle(i%2?14:-12);this.add.image(i*1440+250,185,`fruit-${type}`).setDisplaySize(170,170).setAlpha(.12).setAngle(i%2?-18:12);});
      for(let x=120;x<WORLD_W;x+=520)this.add.image(x+Phaser.Math.Between(-80,120),Phaser.Math.Between(105,280),'cloud').setAlpha(Phaser.Math.FloatBetween(.58,.88)).setScale(Phaser.Math.FloatBetween(.7,1.25)).setScrollFactor(.18).setDepth(1);
      const hills=this.add.graphics().setScrollFactor(.3);hills.fillStyle(C.mint,1);for(let x=-400;x<WORLD_W;x+=500)hills.fillCircle(x,760,370);
      const near=this.add.graphics().setScrollFactor(.55);near.fillStyle(C.yellow,1);for(let x=-280;x<WORLD_W;x+=420)near.fillCircle(x,835,280);
      this.add.tileSprite(WORLD_W/2,780,WORLD_W,44,'checker').setAlpha(.18).setScrollFactor(.88);

      this.zoneNames.forEach((name,i)=>{const x=420+i*1440;this.add.text(x,280,name,{fontFamily:'Fredoka, sans-serif',fontSize:'38px',fontStyle:'bold',color:i===4?'#fff9ee':'#57001e',backgroundColor:Phaser.Display.Color.IntegerToColor(this.zoneColors[i]).rgba,padding:{x:18,y:9}}).setAlpha(.86);});

      this.platforms=this.physics.add.staticGroup();this.ground=this.add.rectangle(WORLD_W/2,858,WORLD_W,86,C.deep,0);this.physics.add.existing(this.ground,true);
      this.add.tileSprite(WORLD_W/2,806,WORLD_W,48,'platform').setTint(C.red);
      const ledges=[[700,672,1],[1030,540,.75],[1370,675,.82],[1710,570,1],[2110,455,.72],[2450,665,.92],[2790,535,.78],[3150,415,.86],[3530,650,1.05],[3960,520,.8],[4310,385,.76],[4660,625,.95],[5070,485,.88],[5480,650,.76],[5820,515,.86],[6210,405,.72],[6530,620,.95],[6880,520,.72]];
      ledges.forEach(([x,y,s])=>this.platforms.create(x,y,'platform').setScale(s,1).refreshBody().setTint(this.zoneColors[Math.min(4,Math.floor(x/1440))]));

      this.springs=this.physics.add.staticGroup();[[1220,778],[2610,778],[4510,778],[6080,778]].forEach(([x,y])=>this.springs.create(x,y,'spring').refreshBody());

      this.fruits=this.physics.add.group({allowGravity:false,immovable:true});
      const spots=[[390,716],[700,575],[900,718],[1030,445],[1210,708],[1370,575],[1550,720],[1710,470],[1920,710],[2110,355],[2300,710],[2450,565],[2650,710],[2790,435],[2970,705],[3150,315],[3350,710],[3530,550],[3760,710],[3960,420],[4140,705],[4310,285],[4500,700],[4660,525],[4870,710],[5070,385],[5280,710],[5480,550],[5660,710],[5820,415],[6020,705],[6210,305],[6380,710],[6530,520],[6730,710],[6880,420]];
      spots.forEach(([x,y],i)=>{const pickupY=y>=700?748:y,zone=Math.min(4,Math.floor(x/1440)),type=FRUITS[zone];this.add.circle(x,pickupY,66,this.zoneColors[zone],.2).setStrokeStyle(5,C.cream,.32);const f=this.fruits.create(x,pickupY,`fruit-${type}`).setDisplaySize(112,112);const bw=f.width*.78,bh=f.height*.78;f.body.setSize(bw,bh).setOffset((f.width-bw)/2,(f.height-bh)/2);f.setData({type,baseY:pickupY,phase:i*.61});});

      this.enemies=this.physics.add.group({allowGravity:true});
      [[900,735,790,1050],[1580,735,1460,1770],[2340,735,2200,2490],[2920,735,2810,3120],[3800,735,3650,4000],[4740,735,4620,4930],[5570,735,5460,5750],[6460,735,6350,6660]].forEach(([x,y,min,max],i)=>{const e=this.enemies.create(x,y,'phone').setDisplaySize(72,108).setVelocityX(i%2?135:-135).setData({alive:true,min,max,dir:i%2?1:-1});e.body.setSize(68,112).setOffset(9,8);});
      this.physics.add.collider(this.enemies,this.platforms);this.physics.add.collider(this.enemies,this.ground);

      this.checkpoints=[2260,4580];this.checkpointObjects=[];
      this.checkpoints.forEach((x,i)=>{const pole=this.add.rectangle(x,650,10,175,C.wine).setOrigin(.5,0),flag=this.add.triangle(x+64,675,0,0,120,30,0,60,i?C.mint:C.coral).setStrokeStyle(5,C.wine).setOrigin(.5,0),hit=this.add.zone(x,700,120,260);this.physics.add.existing(hit,true);hit.setData({activated:false,spawn:x+115,flag,pole});this.checkpointObjects.push(hit);});
      this.goal=this.physics.add.staticImage(7000,674,'mix-pack').setDisplaySize(255,255).refreshBody();this.add.text(7000,485,'MIX PACK FINISH',{fontFamily:'Poppins',fontSize:'25px',fontStyle:'bold',color:'#fff9ee',backgroundColor:'#57001e',padding:{x:18,y:10}}).setOrigin(.5);
    }
    makePlayer(){
      this.player=this.physics.add.sprite(190,650,'mascot-main-mascot-clean').setDisplaySize(142,142).setDepth(8);
      this.player.body.setSize(this.player.width*.56,this.player.height*.72).setOffset(this.player.width*.22,this.player.height*.22).setCollideWorldBounds(true).setMaxVelocity(540,1000).setDragX(1300);
      this.physics.add.collider(this.player,this.platforms);this.physics.add.collider(this.player,this.ground);this.physics.add.collider(this.player,this.springs,this.hitSpring,null,this);this.physics.add.overlap(this.player,this.fruits,this.collectFruit,null,this);this.physics.add.collider(this.player,this.enemies,this.hitEnemy,null,this);this.physics.add.overlap(this.player,this.goal,this.finish,null,this);this.checkpointObjects.forEach(c=>this.physics.add.overlap(this.player,c,this.activateCheckpoint,null,this));
      this.cameras.main.startFollow(this.player,true,.11,.11,-330,0);this.cameras.main.setDeadzone(230,160);this.lastMood='main-mascot-clean';
    }
    makeHud(){
      this.add.rectangle(34,30,570,88,C.cream,.96).setOrigin(0).setStrokeStyle(3,C.wine).setScrollFactor(0).setDepth(20);
      this.scoreText=this.add.text(60,50,`FRUIT  00 / ${TOTAL_FRUIT}`,{fontFamily:'Poppins',fontSize:'23px',fontStyle:'bold',color:'#57001e'}).setScrollFactor(0).setDepth(21);
      this.add.text(300,53,'TEA ENERGY',{fontFamily:'Poppins',fontSize:'13px',fontStyle:'bold',color:'#7d2940'}).setScrollFactor(0).setDepth(21);
      this.add.rectangle(420,60,140,15,0xe7cbd3).setOrigin(0).setScrollFactor(0).setDepth(21);this.energy=this.add.rectangle(420,60,140,15,C.red).setOrigin(0).setScrollFactor(0).setDepth(22);
      this.livesText=this.add.text(W-38,40,'♥  ♥  ♥',{fontFamily:'Fredoka, sans-serif',fontSize:'28px',fontStyle:'bold',color:'#57001e',backgroundColor:'#fff9ee',padding:{x:18,y:8}}).setOrigin(1,0).setScrollFactor(0).setDepth(20);
      this.zoneText=this.add.text(W/2,46,'LEMON LANE',{fontFamily:'Poppins',fontSize:'15px',fontStyle:'bold',color:'#57001e',backgroundColor:'#fff04d',padding:{x:15,y:8}}).setOrigin(.5,0).setScrollFactor(0).setDepth(20);
    }
    makeIntro(){
      this.overlay=this.add.container(W/2,H/2).setScrollFactor(0).setDepth(50);const shade=this.add.rectangle(0,0,W,H,C.wine,.9),sun=this.add.circle(0,-155,205,C.yellow),hero=this.add.image(0,-155,'mascot-energetic').setDisplaySize(315,315),eyebrow=this.add.text(0,40,'ONE LEVEL. FIVE FLAVOURS. PHONES ON PATROL.',{fontFamily:'Poppins',fontSize:'17px',fontStyle:'bold',color:'#ff74a6'}).setOrigin(.5),title=this.add.text(0,105,'FRUIT RUSH',{fontFamily:'Fredoka, sans-serif',fontSize:'100px',fontStyle:'bold',color:'#fff9ee',stroke:'#e8143e',strokeThickness:10}).setOrigin(.5),copy=this.add.text(0,205,'Collect every fruit. Stomp the screen-time villains.\nBring colour back to tea break.',{fontFamily:'Nunito Sans, sans-serif',fontSize:'25px',fontStyle:'bold',align:'center',color:'#fff9ee',lineSpacing:8}).setOrigin(.5),button=this.add.rectangle(0,315,280,72,C.red).setStrokeStyle(4,C.cream).setInteractive({useHandCursor:true}),label=this.add.text(0,315,'START FRESH',{fontFamily:'Poppins',fontSize:'22px',fontStyle:'bold',color:'#fff'}).setOrigin(.5);
      const begin=()=>this.startGame();button.on('pointerover',()=>button.setFillStyle(C.coral)).on('pointerout',()=>button.setFillStyle(C.red)).on('pointerdown',begin);label.setInteractive({useHandCursor:true}).on('pointerdown',begin);this.input.once('pointerdown',begin);this.input.keyboard.once('keydown-ENTER',begin);this.input.keyboard.once('keydown-SPACE',begin);this.overlay.add([shade,sun,hero,eyebrow,title,copy,button,label]);this.physics.pause();
    }
    startGame(){if(run.started)return;run.started=true;run.paused=false;this.overlay?.destroy();this.physics.resume();document.querySelector('.controls-hint')?.classList.add('hidden');audio.startMusic();audio.sfx('checkpoint');}
    bindControls(){
      this.keys=this.input.keyboard.addKeys({left:'A',right:'D',up:'W',space:'SPACE',la:'LEFT',ra:'RIGHT',ua:'UP'});this.input.keyboard.on('keydown-ESC',()=>this.togglePause());
      this.input.keyboard.on('keydown-A',()=>this.arcadeNudge(-1));this.input.keyboard.on('keydown-LEFT',()=>this.arcadeNudge(-1));this.input.keyboard.on('keydown-D',()=>this.arcadeNudge(1));this.input.keyboard.on('keydown-RIGHT',()=>this.arcadeNudge(1));
      this.input.keyboard.on('keydown-W',()=>this.queueJump());this.input.keyboard.on('keydown-UP',()=>this.queueJump());this.input.keyboard.on('keydown-SPACE',()=>this.queueJump());
      document.getElementById('pause-button').addEventListener('click',()=>this.togglePause());document.getElementById('sound-button').addEventListener('click',e=>{run.sound=audio.toggle();e.currentTarget.textContent=run.sound?'♪':'×';e.currentTarget.setAttribute('aria-pressed',String(!run.sound));});
    }
    arcadeNudge(direction){if(!run.started||run.paused||run.finished||this.state==='hurt')return;this.lastInputAt=this.time.now;const current=this.player.body.velocity.x;this.player.setVelocityX(direction<0?Math.min(current,-320):Math.max(current,320));}
    queueJump(){if(!run.started||run.paused||run.finished||this.state==='hurt')return;this.lastInputAt=this.time.now;this.jumpQueuedAt=this.time.now;}
    togglePause(){
      if(!run.started||run.finished||this.state==='hurt')return;run.paused=!run.paused;
      if(!run.paused){this.physics.resume();this.pauseCard?.destroy();this.pauseCard=null;return;}
      this.physics.pause();this.pauseCard=this.add.container(W/2,H/2).setScrollFactor(0).setDepth(60);this.pauseCard.add([this.add.rectangle(0,0,500,230,C.cream).setStrokeStyle(5,C.wine),this.add.text(0,-38,'TEA BREAK PAUSED',{fontFamily:'Fredoka, sans-serif',fontSize:'43px',fontStyle:'bold',color:'#57001e'}).setOrigin(.5),this.add.text(0,40,'Press Esc or pause to jump back in',{fontFamily:'Nunito Sans, sans-serif',fontSize:'20px',color:'#7d2940'}).setOrigin(.5)]);
    }
    mood(name,ms=0){
      if(this.lastMood===name)return;this.lastMood=name;this.player.setTexture(`mascot-${name}`).setDisplaySize(142,142);
      if(ms){this.moodTimer?.remove();this.moodTimer=this.time.delayedCall(ms,()=>{this.moodTimer=null;this.lastMood='';this.mood(this.player.body.blocked.down?'main-mascot-clean':'confident');});}
    }
    collectFruit(_player,fruit){
      if(this.state==='hurt')return;const {x,y}=fruit,type=fruit.getData('type');fruit.disableBody(true,true);run.fruit++;run.score+=100;this.scoreText.setText(`FRUIT  ${String(run.fruit).padStart(2,'0')} / ${TOTAL_FRUIT}`);this.mood(`holding-${type}`,520);audio.sfx('fruit');
      const label=this.add.text(x,y-18,`+100  ${type.toUpperCase()}!`,{fontFamily:'Poppins',fontSize:'21px',fontStyle:'bold',color:'#57001e',backgroundColor:'#fff04d',padding:{x:10,y:5}}).setOrigin(.5).setDepth(12);this.tweens.add({targets:label,y:y-105,scale:1.12,alpha:0,duration:720,ease:'Cubic.easeOut',onComplete:()=>label.destroy()});this.burst(x,y,[C.yellow,C.mango,C.lychee,0xff641f,C.red][FRUITS.indexOf(type)]);
    }
    hitSpring(player,spring){
      if(player.body.velocity.y<0||this.state==='hurt')return;player.setVelocityY(-900);this.state='air';this.lastGroundedAt=-9999;this.mood('surprised',500);audio.sfx('spring');this.tweens.add({targets:spring,scaleY:.45,duration:80,yoyo:true});this.cameras.main.shake(90,.003);
    }
    refreshEnergy(){this.livesText.setText(Array(Math.max(run.lives,0)).fill('♥').join('  '));this.energy.scaleX=Math.max(0,run.lives/3);}
    hitEnemy(player,enemy){
      if(!enemy.getData('alive')||this.state==='hurt'||this.invulnerable)return;const stomp=player.body.velocity.y>70&&player.body.bottom<=enemy.body.center.y+32;
      if(stomp){enemy.setData('alive',false);enemy.body.enable=false;player.setVelocityY(-650);this.state='air';this.mood('energetic',480);run.score+=250;audio.sfx('stomp');this.cameras.main.shake(90,.004);this.tweens.add({targets:enemy,scaleX:1.25,scaleY:.08,angle:Phaser.Math.Between(-18,18),alpha:0,duration:260,ease:'Back.easeIn',onComplete:()=>enemy.destroy()});this.burst(enemy.x,enemy.y,C.red);}else this.damage(enemy.x);
    }
    damage(enemyX){
      this.state='hurt';run.lives--;this.refreshEnergy();this.mood('angry');this.time.delayedCall(230,()=>{if(this.state==='hurt')this.mood('sad');});audio.sfx('hurt');this.player.setVelocity(this.player.x<enemyX?-430:430,-480).setTint(0xff9db1);this.player.body.checkCollision.none=true;this.cameras.main.shake(260,.012);
      this.time.delayedCall(520,()=>{this.cameras.main.fadeOut(180,87,0,30);this.time.delayedCall(190,()=>run.lives<=0?this.gameOver():this.respawn());});
    }
    respawn(){
      this.player.setPosition(this.spawnX,600).setVelocity(0,0).clearTint().setAlpha(1);this.player.body.checkCollision.none=false;this.state='air';this.invulnerable=true;this.cameras.main.fadeIn(220,255,249,238);this.mood('confident',600);
      this.tweens.add({targets:this.player,alpha:.25,duration:90,yoyo:true,repeat:5,onComplete:()=>{this.player.setAlpha(1);this.invulnerable=false;}});
    }
    gameOver(){
      this.physics.pause();run.paused=true;const p=this.add.container(W/2,H/2).setScrollFactor(0).setDepth(70),shade=this.add.rectangle(0,0,W,H,C.wine,.92),hero=this.add.image(-290,0,'mascot-sad').setDisplaySize(330,330),title=this.add.text(110,-92,'OUT OF TEA ENERGY',{fontFamily:'Fredoka, sans-serif',fontSize:'58px',fontStyle:'bold',color:'#fff04d'}).setOrigin(.5),copy=this.add.text(110,-10,'Fresh run. Fresh fruit. Same big comeback.',{fontFamily:'Nunito Sans, sans-serif',fontSize:'22px',fontStyle:'bold',color:'#fff9ee'}).setOrigin(.5),button=this.add.rectangle(110,98,250,66,C.red).setStrokeStyle(3,C.cream).setInteractive({useHandCursor:true}),label=this.add.text(110,98,'START FRESH',{fontFamily:'Poppins',fontSize:'19px',fontStyle:'bold',color:'#fff'}).setOrigin(.5);button.on('pointerdown',()=>location.reload());p.add([shade,hero,title,copy,button,label]);
    }
    activateCheckpoint(_player,checkpoint){
      if(checkpoint.getData('activated'))return;checkpoint.setData('activated',true);this.spawnX=checkpoint.getData('spawn');run.lives=3;this.refreshEnergy();checkpoint.getData('flag').setFillStyle(C.yellow);this.mood('thumbs-up',760);audio.sfx('checkpoint');this.burst(checkpoint.x,checkpoint.y-70,C.yellow);const t=this.add.text(checkpoint.x,560,'CHECKPOINT! ENERGY FULL.',{fontFamily:'Poppins',fontSize:'22px',fontStyle:'bold',color:'#fff9ee',backgroundColor:'#57001e',padding:{x:14,y:8}}).setOrigin(.5).setDepth(10);this.tweens.add({targets:t,y:505,alpha:0,duration:1100,onComplete:()=>t.destroy()});
    }
    finish(){
      if(run.finished||this.state==='hurt')return;
      if(run.fruit<TOTAL_FRUIT){this.denyFinish();return;}
      run.finished=true;this.state='finished';this.physics.pause();this.mood('celebrating');audio.sfx('win');this.cameras.main.flash(500,255,240,77);this.time.delayedCall(520,()=>{const panel=this.add.container(W/2,H/2).setScrollFactor(0).setDepth(70),shade=this.add.rectangle(0,0,W,H,C.wine,.93),hero=this.add.image(-325,-10,'mascot-celebrating').setDisplaySize(390,390),title=this.add.text(100,-135,'TEA BREAK\nRESTORED!',{fontFamily:'Fredoka, sans-serif',fontSize:'76px',fontStyle:'bold',color:'#fff04d',lineSpacing:-5}).setOrigin(.5),result=this.add.text(100,15,`${run.fruit} / ${TOTAL_FRUIT} fruits  •  ${run.score} points`,{fontFamily:'Poppins',fontSize:'21px',fontStyle:'bold',color:'#fff9ee'}).setOrigin(.5),again=this.add.rectangle(-15,125,235,66,C.red).setStrokeStyle(3,C.cream).setInteractive({useHandCursor:true}),againText=this.add.text(-15,125,'RUN FRESH',{fontFamily:'Poppins',fontSize:'19px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setInteractive({useHandCursor:true}),homeButton=this.add.rectangle(275,125,260,66,C.cream).setStrokeStyle(3,C.yellow).setInteractive({useHandCursor:true}),home=this.add.text(275,125,'BACK TO FRUTEA',{fontFamily:'Poppins',fontSize:'17px',fontStyle:'bold',color:'#57001e'}).setOrigin(.5).setInteractive({useHandCursor:true});again.on('pointerdown',()=>location.reload());againText.on('pointerdown',()=>location.reload());homeButton.on('pointerdown',()=>location.href='../index.html');home.on('pointerdown',()=>location.href='../index.html');panel.add([shade,hero,title,result,again,againText,homeButton,home]);});
    }
    denyFinish(){
      const now=this.time.now;if(this.finishPromptUntil&&now<this.finishPromptUntil)return;this.finishPromptUntil=now+1200;
      const missing=TOTAL_FRUIT-run.fruit;this.player.setVelocity(-470,-420);this.mood('pointing',650);this.cameras.main.shake(160,.006);audio.sfx('hurt');
      const t=this.add.text(this.player.x-120,this.player.y-150,`${missing} FRUIT${missing===1?'':'S'} LEFT!`,{fontFamily:'Fredoka, sans-serif',fontSize:'34px',fontStyle:'bold',color:'#fff04d',stroke:'#57001e',strokeThickness:6}).setOrigin(.5).setDepth(35);
      this.tweens.add({targets:t,y:t.y-75,scale:1.1,alpha:0,duration:900,ease:'Cubic.easeOut',onComplete:()=>t.destroy()});
    }
    burst(x,y,color){for(let i=0;i<12;i++){const p=this.add.image(x,y,'spark').setTint(color).setScale(.18).setDepth(10),a=Phaser.Math.FloatBetween(0,Math.PI*2),d=Phaser.Math.Between(55,145);this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,angle:Phaser.Math.Between(-180,180),scale:0,alpha:0,duration:440,onComplete:()=>p.destroy()});}}
    enterZone(zone){
      this.activeZone=zone;const color=Phaser.Display.Color.IntegerToColor(this.zoneColors[zone]),from=Phaser.Display.Color.IntegerToColor(this.skyBackdrop.fillColor),to=Phaser.Display.Color.IntegerToColor(this.zoneBackgrounds[zone]),blend={value:0};this.tweens.killTweensOf(this.skyBackdrop);this.tweens.add({targets:blend,value:100,duration:650,ease:'Sine.easeInOut',onUpdate:()=>{const c=Phaser.Display.Color.Interpolate.ColorWithColor(from,to,100,blend.value);this.skyBackdrop.setFillStyle(Phaser.Display.Color.GetColor(c.r,c.g,c.b));}});this.zoneText.setText(this.zoneNames[zone]).setBackgroundColor(color.rgba).setColor(zone===4?'#fff9ee':'#57001e');this.mood(`holding-${FRUITS[zone]}`,900);audio.sfx('checkpoint');this.cameras.main.flash(190,color.red,color.green,color.blue);
      const banner=this.add.text(W/2,205,`${this.zoneNames[zone]}  •  ${FRUITS[zone].toUpperCase()} TIME`,{fontFamily:'Fredoka, sans-serif',fontSize:'46px',fontStyle:'bold',color:zone===4?'#fff9ee':'#57001e',backgroundColor:color.rgba,padding:{x:24,y:12}}).setOrigin(.5).setScrollFactor(0).setDepth(30).setAlpha(0).setScale(.72);
      this.tweens.add({targets:banner,alpha:1,scale:1,duration:240,ease:'Back.easeOut',hold:650,yoyo:true,onComplete:()=>banner.destroy()});
    }
    update(time){
      if(!run.started||run.finished||run.paused||this.state==='hurt')return;
      const left=this.keys.left.isDown||this.keys.la.isDown,right=this.keys.right.isDown||this.keys.ra.isDown,jumpDown=Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.space)||Phaser.Input.Keyboard.JustDown(this.keys.ua);
      const grounded=this.player.body.blocked.down||this.player.body.touching.down;if(grounded){this.lastGroundedAt=time;if(this.state==='air')this.squash();this.state='ground';}
      if(jumpDown)this.jumpQueuedAt=time;
      if(left&&!right){this.lastInputAt=time;this.player.setAccelerationX(-2600).setFlipX(true);if(grounded&&!this.moodTimer)this.mood('running');}else if(right&&!left){this.lastInputAt=time;this.player.setAccelerationX(2600).setFlipX(false);if(grounded&&!this.moodTimer)this.mood('running');}else{this.player.setAccelerationX(0);if(grounded&&!this.moodTimer){if(time-this.lastInputAt>2400){const idle=['playful','curious','dancing','cool'][this.idleIndex++%4];this.mood(idle,1050);this.lastInputAt=time;}else this.mood('main-mascot-clean');}}
      if(time-this.jumpQueuedAt<165&&time-this.lastGroundedAt<145){this.player.setVelocityY(-825);this.state='air';this.jumpQueuedAt=-9999;this.lastGroundedAt=-9999;this.mood('energetic');audio.sfx('jump');this.stretch();}
      if(!grounded&&this.player.body.velocity.y>80&&!this.moodTimer)this.mood('confident');
      this.fruits.children.iterate(f=>{if(f?.active){f.y=f.getData('baseY')+Math.sin(time*.0035+f.getData('phase'))*11;f.angle=Math.sin(time*.0025+f.getData('phase'))*8;}});
      this.enemies.children.iterate(e=>{if(!e?.active||!e.getData('alive'))return;let dir=e.getData('dir');if(e.x<=e.getData('min'))dir=1;if(e.x>=e.getData('max'))dir=-1;e.setData('dir',dir).setVelocityX(dir*135).setFlipX(dir<0);e.angle=Math.sin(time*.006+e.x)*2;});
      if(grounded&&Math.abs(this.player.body.velocity.x)>35)this.player.angle=Math.sin(time*.018)*4;else if(!grounded)this.player.angle=Phaser.Math.Clamp(this.player.body.velocity.x*.018,-7,7);else this.player.angle=Math.sin(time*.003)*1.5;
      const zone=Math.min(4,Math.floor(this.player.x/1440));if(zone!==this.activeZone)this.enterZone(zone);
    }
    squash(){this.tweens.killTweensOf(this.player);const sx=this.player.scaleX,sy=this.player.scaleY;this.player.setScale(sx*1.08,sy*.84);this.tweens.add({targets:this.player,scaleX:sx,scaleY:sy,duration:130,ease:'Back.easeOut'});}
    stretch(){this.tweens.killTweensOf(this.player);const sx=this.player.scaleX,sy=this.player.scaleY;this.player.setScale(sx*.9,sy*1.12);this.tweens.add({targets:this.player,scaleX:sx,scaleY:sy,duration:150,ease:'Sine.easeOut'});}
  }

  const launch=()=>new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#8fe1f5',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:1650},debug:false}},scene:[FruitRush],render:{antialias:true,pixelArt:false}});
  if(document.fonts?.ready)document.fonts.ready.then(launch);else launch();
})();
