(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const QA = params.has('qa');
  const START_LEVEL = QA ? Phaser.Math.Clamp(parseInt(params.get('level') || '0', 10) || 0, 0, 4) : 0;
  if (params.has('touch')) document.body.classList.add('force-touch');

  const W = 1600;
  const H = 900;
  const WORLD_W = QA ? 5000 : 10000;
  const MAX_LIVES = 5;
  const FRUIT_GOAL = QA ? 5 : 12;
  const CHEST_GOAL = 3;
  const C = {
    cream: 0xfff8e8, wine: 0x57001e, ink: 0x240510, red: 0xe8143e,
    coral: 0xff5d63, yellow: 0xffe64d, mint: 0x5ee2a0, green: 0x238f54,
    forest: 0x103f3b, dirt: 0x8e481f, dirtLight: 0xc56a2c, white: 0xffffff,
    pink: 0xf65aa0, orange: 0xff8a24, blue: 0x65d7e7, purple: 0x9c4dcc
  };
  const LEVELS = [
    { key: 'lemon', name: 'LEMON CANOPY', zone: 'SUNBEAM HEIGHTS', color: 0xffe64d, grass: 0x78cf45, grassHi: 0xc9f36a, dirt: 0x9b5525, rock: 0x684021, fog: 0x9ff2c6, sky: 0x63d4b0, accent: 0xfff6a0, boss: 'SOUR SNAPDRAGON', hp: 6, hazard: 'CITRUS SAP' },
    { key: 'mango', name: 'MANGO RUINS', zone: 'GOLDEN TEMPLE', color: 0xff9a24, grass: 0x58b94b, grassHi: 0xb9dc52, dirt: 0xad5c27, rock: 0x6b3920, fog: 0xffc466, sky: 0x2a8f70, accent: 0xffc93d, boss: 'MANGO MAULER', hp: 7, hazard: 'TEMPLE TRAPS' },
    { key: 'lychee', name: 'LYCHEE LAGOON', zone: 'BUBBLE MARSH', color: 0xf65aa0, grass: 0x67d09a, grassHi: 0xb7f2cd, dirt: 0x744b88, rock: 0x463658, fog: 0xf9b8d9, sky: 0x477e91, accent: 0xffd7ec, boss: 'BUBBLE BEAST', hp: 8, hazard: 'DEEP WATER' },
    { key: 'orange', name: 'ORANGE CRATER', zone: 'EMBER JUNGLE', color: 0xff6c21, grass: 0x93b83f, grassHi: 0xd8dc58, dirt: 0x8c3d25, rock: 0x3b2928, fog: 0xff9254, sky: 0x70333f, accent: 0xffb52e, boss: 'PEEL VOLCANO', hp: 9, hazard: 'MOLTEN PEEL' },
    { key: 'strawberry', name: 'STRAWBERRY WILDS', zone: 'BERRY MOON', color: 0xe8143e, grass: 0x2cb76d, grassHi: 0x7de19c, dirt: 0x6e314e, rock: 0x3a213d, fog: 0xff6f9d, sky: 0x3d2859, accent: 0xffb8cf, boss: 'JAM TITAN', hp: 12, hazard: 'THORN JAM' }
  ];
  const WORLD_LAYOUTS = [
    {
      ground: [[0, 1900], [2260, 1800], [4380, 2050], [6830, 3170]],
      platforms: [[780, 610, 500], [1450, 420, 440], [2020, 575, 360], [2860, 430, 540], [3630, 610, 470], [4320, 355, 470], [5140, 545, 560], [5920, 320, 430], [6600, 590, 500], [7420, 410, 470], [8200, 565, 550], [8910, 335, 470]],
      ladders: [[1450, 420], [2860, 430], [4320, 355], [5920, 320], [7420, 410], [8910, 335]],
      movers: [[3300, 520], [6260, 400], [7860, 500]],
      crates: [[1080, 740], [2020, 515], [3890, 740], [5140, 485], [6870, 740], [8200, 505]],
      spikes: [1880, 4070, 6410, 8400]
    },
    {
      ground: [[0, 1550], [1840, 1200], [3330, 1600], [5260, 1160], [6750, 3250]],
      platforms: [[670, 570, 430], [1280, 365, 360], [2110, 630, 400], [2700, 430, 440], [3510, 585, 380], [4100, 365, 520], [4920, 535, 370], [5630, 330, 430], [6240, 570, 380], [7040, 470, 500], [7820, 300, 430], [8550, 500, 520]],
      ladders: [[1280, 365], [2700, 430], [4100, 365], [5630, 330], [7040, 470], [7820, 300]],
      movers: [[1640, 500], [3150, 350], [6530, 390]],
      crates: [[900, 740], [2110, 570], [3680, 520], [4920, 475], [7040, 410], [8550, 440]],
      spikes: [1490, 3080, 4920, 6450, 8180]
    },
    {
      ground: [[0, 2050], [2460, 1450], [4240, 1270], [5800, 1740], [7850, 2150]],
      platforms: [[820, 575, 470], [1540, 350, 420], [2240, 570, 330], [2920, 420, 500], [3800, 620, 360], [4510, 410, 430], [5260, 260, 390], [5980, 540, 470], [6740, 335, 420], [7490, 580, 360], [8210, 390, 500], [8950, 250, 430]],
      ladders: [[1540, 350], [2920, 420], [4510, 410], [5260, 260], [6740, 335], [8950, 250]],
      movers: [[2270, 350], [4050, 300], [7700, 350]],
      crates: [[1180, 740], [2920, 360], [4660, 350], [5980, 480], [8210, 330], [9070, 710]],
      spikes: [1980, 4050, 5580, 7700]
    },
    {
      ground: [[0, 1720], [2130, 1370], [3850, 1000], [5160, 1470], [7000, 3000]],
      platforms: [[720, 600, 450], [1370, 410, 430], [1970, 610, 320], [2580, 360, 460], [3310, 540, 350], [3960, 310, 410], [4700, 610, 360], [5400, 420, 470], [6160, 250, 400], [6840, 580, 340], [7580, 390, 450], [8380, 540, 520]],
      ladders: [[1370, 410], [2580, 360], [3960, 310], [5400, 420], [6160, 250], [7580, 390]],
      movers: [[1830, 380], [3650, 470], [6650, 350]],
      crates: [[980, 740], [2580, 300], [4200, 740], [5400, 360], [7580, 330], [8380, 480]],
      spikes: [1690, 3520, 4860, 6710, 8530]
    },
    {
      ground: [[0, 1320], [1650, 1080], [3090, 1190], [4640, 1200], [6250, 1100], [7700, 2300]],
      platforms: [[590, 570, 360], [1180, 330, 390], [1810, 610, 340], [2410, 380, 410], [3150, 570, 330], [3730, 300, 420], [4460, 500, 350], [5070, 265, 390], [5720, 580, 340], [6350, 350, 400], [7040, 540, 330], [7650, 280, 420], [8380, 500, 500]],
      ladders: [[1180, 330], [2410, 380], [3730, 300], [5070, 265], [6350, 350], [7650, 280]],
      movers: [[1450, 490], [2860, 320], [6020, 300], [7350, 390]],
      crates: [[780, 740], [2410, 320], [3920, 740], [5070, 205], [6500, 740], [8380, 440]],
      spikes: [1300, 2890, 4390, 5950, 7410, 8810]
    }
  ];
  const SCORE_KEY = 'frutea-jungle-quest-v2-best';
  const S = {
    level: START_LEVEL, score: 0, best: 0, lives: MAX_LIVES, keys: 0, gems: 0,
    fruit: 0, chests: 0, enemies: 0, combo: 1, comboUntil: 0,
    started: false, paused: false, finished: false
  };
  const embedded = (key, fallback) => (window.FRUTEA_GAME_ASSETS && window.FRUTEA_GAME_ASSETS[key]) || fallback;

  class JungleQuest extends Phaser.Scene {
    constructor() { super('JungleQuest'); }

    preload() {
      this.load.image('jungle-bg', 'assets/jungle-backdrop.png?v=73');
      const moods = ['main-mascot-clean', 'running', 'energetic', 'angry', 'sad', 'celebrating', 'confident', 'cool', 'surprised', 'thumbs-up'];
      moods.forEach(name => this.load.image(`mascot-${name}`, embedded(`mascot-${name}`, `../sprites/mascot/${name}.png`)));
      LEVELS.forEach(level => this.load.image(`fruit-${level.key}`, embedded(`fruit-${level.key}`, `../sprites/fruits/${level.key}.png`)));
      this.load.audio('quest-theme', 'audio/frutea-expedition-theme.mp3?v=73');
    }

    create() {
      S.best = this.loadBest();
      this.soundEnabled = true;
      this.makeTextures();
      this.makeBackdrop();
      this.makeHud();
      this.bindControls();
      this.buildLevel(S.level);
      this.makeIntro();
      this.physics.pause();
    }

    makeTextures() {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.white).fillRect(0, 0, 8, 8); g.generateTexture('blank', 8, 8); g.clear();
      g.fillStyle(C.wine).fillCircle(28, 28, 26).fillStyle(C.yellow).fillCircle(28, 28, 20).fillStyle(C.red).fillCircle(22, 23, 4).fillCircle(35, 23, 4).lineStyle(4, C.wine).beginPath().arc(28, 31, 9, .15, Math.PI - .15).strokePath(); g.generateTexture('fruit-shot', 56, 56); g.clear();
      g.fillStyle(0x381408).fillRoundedRect(0, 0, 320, 70, 16).fillStyle(C.dirt).fillRoundedRect(6, 6, 308, 58, 12).fillStyle(C.green).fillRoundedRect(0, 0, 320, 21, 10).fillStyle(0x8be45f).fillRoundedRect(5, 3, 310, 9, 5); for (let x = 12; x < 320; x += 28) g.fillStyle(C.green).fillTriangle(x, 17, x + 11, 34, x + 22, 17); g.lineStyle(5, 0x381408).strokeRoundedRect(1, 1, 318, 68, 15); g.generateTexture('moving-platform', 320, 70); g.clear();
      g.fillStyle(0x4b1c0c).fillRoundedRect(2, 12, 78, 58, 8).fillStyle(0xa95328).fillRoundedRect(8, 18, 66, 46, 5).lineStyle(5, 0x4b1c0c).strokeRoundedRect(2, 12, 78, 58, 8).lineBetween(8, 18, 74, 64).lineBetween(74, 18, 8, 64).fillStyle(C.yellow).fillCircle(41, 41, 8); g.generateTexture('crate', 82, 74); g.clear();
      g.fillStyle(0x3c160b).fillRoundedRect(2, 23, 94, 64, 10).fillStyle(0xb86629).fillRoundedRect(8, 29, 82, 52, 7).lineStyle(6, C.yellow).strokeRoundedRect(4, 20, 90, 68, 10).fillStyle(C.yellow).fillRect(43, 48, 12, 23).fillStyle(0x3c160b).fillCircle(49, 52, 4); g.generateTexture('chest-closed', 98, 92); g.clear();
      g.fillStyle(0x3c160b).fillRoundedRect(2, 43, 94, 46, 9).fillStyle(0xb86629).fillRoundedRect(8, 49, 82, 34, 6).lineStyle(6, C.yellow).strokeRoundedRect(4, 40, 90, 50, 9).lineStyle(8, C.yellow).beginPath().arc(49, 40, 40, Math.PI, Math.PI * 2).strokePath().fillStyle(C.yellow).fillRect(43, 56, 12, 22); g.generateTexture('chest-open', 98, 92); g.clear();
      g.fillStyle(0x4d245b).fillCircle(32, 32, 30).lineStyle(5, 0x2a0e32).strokeCircle(32, 32, 29).fillStyle(C.pink).fillTriangle(32, 8, 54, 25, 45, 52).fillTriangle(32, 8, 10, 25, 19, 52).fillStyle(0xffa8dd).fillTriangle(32, 8, 41, 25, 23, 25); g.generateTexture('gem', 64, 64); g.clear();
      g.fillStyle(C.yellow).fillCircle(30, 30, 27).lineStyle(5, C.wine).strokeCircle(30, 30, 27).fillStyle(C.wine).fillRoundedRect(25, 8, 10, 37, 4).fillCircle(30, 46, 10).fillRect(30, 12, 28, 9).fillStyle(C.yellow).fillCircle(50, 16, 5); g.generateTexture('key', 60, 60); g.clear();
      g.fillStyle(0x2a0e32).fillRoundedRect(0, 0, 90, 120, 16).fillStyle(C.purple).fillRoundedRect(7, 7, 76, 106, 12).fillStyle(0x17091c).fillRoundedRect(20, 23, 50, 62, 9).fillStyle(C.yellow).fillCircle(45, 101, 7); g.generateTexture('gate-locked', 90, 120); g.clear();
      g.fillStyle(C.yellow, .24).fillCircle(60, 60, 56).lineStyle(7, C.yellow).strokeCircle(60, 60, 52).lineStyle(5, C.coral).strokeCircle(60, 60, 37).fillStyle(C.white, .65).fillCircle(60, 60, 22); g.generateTexture('portal', 120, 120); g.clear();
      g.fillStyle(0x431508).fillTriangle(0, 60, 30, 4, 60, 60).fillStyle(C.coral).fillTriangle(10, 55, 30, 18, 50, 55); g.generateTexture('spike', 60, 60); g.clear();
      LEVELS.forEach((level, index) => {
        if (index === 0) {
          g.fillStyle(0x472610).fillEllipse(53, 61, 96, 52).fillStyle(0xffdc35).fillCircle(28, 58, 24).fillCircle(51, 57, 27).fillCircle(76, 56, 24);
          g.fillStyle(0xfff49a).fillCircle(22, 48, 7).fillCircle(46, 46, 7).fillCircle(70, 46, 7).fillStyle(C.wine).fillCircle(75, 54, 5);
          g.lineStyle(5, 0x4da642).beginPath().arc(77, 33, 22, 3.6, 5.7).strokePath().lineBetween(85, 30, 95, 13).lineBetween(73, 31, 68, 12);
        } else if (index === 1) {
          g.fillStyle(0x3c291c).fillEllipse(53, 60, 96, 62).fillStyle(0xe89425).fillEllipse(53, 60, 78, 52).fillStyle(0xffc94c).fillTriangle(53, 22, 22, 68, 84, 68);
          g.lineStyle(7, 0x71421e).lineBetween(53, 26, 53, 84).lineBetween(28, 46, 8, 25).lineBetween(78, 46, 98, 25).lineBetween(28, 72, 8, 91).lineBetween(78, 72, 98, 91);
          g.fillStyle(C.cream).fillCircle(39, 52, 8).fillCircle(67, 52, 8).fillStyle(C.wine).fillCircle(39, 52, 4).fillCircle(67, 52, 4);
        } else if (index === 2) {
          g.fillStyle(0x5e325f).fillCircle(52, 52, 45).fillStyle(0xf67db7, .9).fillCircle(52, 52, 37).lineStyle(5, 0xffd7ec).strokeCircle(52, 52, 35);
          g.fillStyle(0xffffff, .62).fillCircle(38, 36, 11).fillStyle(C.wine).fillCircle(42, 54, 5).fillCircle(66, 54, 5);
          g.lineStyle(7, 0x9252a2).beginPath().arc(26, 77, 24, .2, 1.8).strokePath().beginPath().arc(53, 82, 24, .2, 1.8).strokePath().beginPath().arc(77, 76, 24, .2, 1.8).strokePath();
        } else if (index === 3) {
          g.fillStyle(0x321d25).fillCircle(52, 58, 31).fillTriangle(27, 58, 2, 20, 36, 39).fillTriangle(77, 58, 102, 20, 68, 39);
          g.fillStyle(0xff6c21).fillTriangle(22, 55, 5, 30, 35, 44).fillTriangle(82, 55, 99, 30, 69, 44).fillTriangle(38, 31, 51, 5, 65, 31);
          g.fillStyle(C.cream).fillCircle(42, 56, 7).fillCircle(64, 56, 7).fillStyle(C.wine).fillCircle(42, 56, 4).fillCircle(64, 56, 4).lineStyle(5, 0xffad31).lineBetween(41, 75, 65, 75);
        } else {
          g.fillStyle(0x4c1837).fillCircle(52, 58, 42).fillStyle(0xe8143e).fillTriangle(52, 95, 16, 44, 88, 44).fillCircle(52, 53, 34);
          g.fillStyle(0x35ad65).fillTriangle(24, 30, 45, 4, 53, 31).fillTriangle(80, 30, 59, 4, 52, 31).fillTriangle(52, 26, 52, -2, 65, 27);
          g.fillStyle(C.cream).fillCircle(42, 52, 7).fillCircle(66, 52, 7).fillStyle(C.wine).fillCircle(42, 52, 4).fillCircle(66, 52, 4);
          g.lineStyle(7, 0xb02764).lineBetween(17, 60, 2, 40).lineBetween(87, 60, 102, 40).fillStyle(C.cream).fillCircle(34, 74, 3).fillCircle(55, 82, 3).fillCircle(71, 68, 3);
        }
        g.generateTexture(`enemy-${index}`, 106, 104); g.clear();

        if (index === 0) {
          g.lineStyle(18, 0x3b8f44).beginPath().arc(132, 205, 58, 2.4, 6.1).strokePath().lineBetween(128, 178, 128, 286);
          g.fillStyle(0x4faa4b).fillEllipse(82, 244, 94, 38).fillEllipse(183, 230, 92, 38);
          g.fillStyle(0xffd92f).fillCircle(132, 103, 80).fillStyle(0xfff187).fillCircle(132, 103, 62).lineStyle(8, 0x76223d).strokeCircle(132, 103, 63);
          for (let a = 0; a < 6; a++) { const angle = a * Math.PI / 3; g.fillStyle(a % 2 ? 0xf2bd22 : 0xffe64d).fillTriangle(132 + Math.cos(angle) * 60, 103 + Math.sin(angle) * 60, 132 + Math.cos(angle + .38) * 112, 103 + Math.sin(angle + .38) * 112, 132 + Math.cos(angle - .38) * 112, 103 + Math.sin(angle - .38) * 112); }
          g.fillStyle(C.wine).fillTriangle(77, 110, 187, 110, 132, 170).fillStyle(C.white).fillTriangle(92, 116, 111, 116, 102, 136).fillTriangle(153, 116, 172, 116, 162, 136).fillCircle(108, 83, 9).fillCircle(157, 83, 9);
        } else if (index === 1) {
          g.fillStyle(0x49311e).fillRoundedRect(24, 42, 216, 242, 28).fillStyle(0xd88b2c).fillRoundedRect(36, 54, 192, 218, 22).fillStyle(0xffc64a).fillTriangle(132, 12, 42, 100, 222, 100);
          g.fillStyle(0x74451f).fillRect(48, 111, 168, 95).fillStyle(C.cream).fillCircle(90, 142, 16).fillCircle(174, 142, 16).fillStyle(C.wine).fillCircle(90, 142, 8).fillCircle(174, 142, 8);
          g.lineStyle(12, C.wine).lineBetween(83, 183, 132, 212).lineBetween(181, 183, 132, 212).lineBetween(132, 212, 132, 242);
          g.fillStyle(0xb86a26).fillRoundedRect(0, 148, 53, 82, 18).fillRoundedRect(211, 148, 53, 82, 18).lineStyle(7, level.accent).strokeRoundedRect(5, 153, 43, 72, 14).strokeRoundedRect(216, 153, 43, 72, 14);
        } else if (index === 2) {
          g.fillStyle(0xf7add2, .72).fillCircle(132, 150, 105).lineStyle(9, 0xffe4f3).strokeCircle(132, 150, 101);
          g.fillStyle(0xffd6e9, .66).fillCircle(59, 74, 51).fillCircle(211, 86, 57).fillCircle(74, 226, 48).fillCircle(204, 227, 49);
          g.fillStyle(0xffffff, .65).fillCircle(94, 103, 28).fillStyle(C.wine).fillCircle(101, 148, 13).fillCircle(165, 148, 13).lineStyle(10, C.wine).beginPath().arc(133, 170, 42, .15, Math.PI - .15).strokePath();
          g.lineStyle(12, 0x8b4f9c).beginPath().arc(72, 253, 60, -.3, 1.4).strokePath().beginPath().arc(190, 253, 60, 1.7, 3.4).strokePath();
        } else if (index === 3) {
          g.fillStyle(0x39242a).fillTriangle(132, 20, 17, 276, 247, 276).fillStyle(0x8f3827).fillTriangle(132, 44, 39, 262, 225, 262);
          g.fillStyle(0xff6c21).fillTriangle(77, 72, 111, 8, 126, 90).fillTriangle(119, 79, 151, 0, 170, 87).fillTriangle(155, 81, 202, 30, 188, 111);
          g.fillStyle(0xffb130).fillCircle(103, 158, 18).fillCircle(164, 158, 18).fillStyle(C.wine).fillCircle(103, 158, 9).fillCircle(164, 158, 9);
          g.fillStyle(0x28141f).fillTriangle(76, 194, 191, 194, 134, 252).fillStyle(C.white).fillTriangle(96, 199, 116, 199, 106, 221).fillTriangle(151, 199, 171, 199, 161, 221);
          g.lineStyle(17, 0xff8130).lineBetween(41, 170, 2, 111).lineBetween(225, 170, 263, 111);
        } else {
          g.fillStyle(0x4b1736).fillRoundedRect(31, 54, 202, 236, 42).fillStyle(0xe8143e).fillRoundedRect(44, 69, 176, 204, 34);
          g.fillStyle(0x32ad68).fillTriangle(43, 80, 90, 8, 126, 83).fillTriangle(221, 80, 174, 8, 138, 83).fillTriangle(83, 65, 132, 0, 181, 65);
          g.fillStyle(C.cream).fillCircle(95, 139, 20).fillCircle(169, 139, 20).fillStyle(C.wine).fillCircle(95, 139, 10).fillCircle(169, 139, 10);
          g.lineStyle(13, C.wine).lineBetween(82, 195, 183, 195).lineBetween(88, 195, 101, 225).lineBetween(177, 195, 164, 225);
          g.lineStyle(18, 0x9e245d).lineBetween(38, 150, 2, 94).lineBetween(226, 150, 262, 94);
          for (let i = 0; i < 8; i++) g.fillStyle(C.cream).fillCircle(70 + (i % 4) * 42, 100 + Math.floor(i / 4) * 145, 5);
        }
        g.generateTexture(`boss-${index}`, 264, 304); g.clear();

        if (index === 0) g.fillStyle(0xffd72e).fillEllipse(48, 50, 88, 34).fillStyle(0xfff192).fillEllipse(48, 45, 70, 18).lineStyle(5, C.wine).strokeEllipse(48, 50, 88, 34);
        if (index === 1) g.fillStyle(0x5c3c27).fillRect(6, 31, 84, 36).fillStyle(0xe3a03c).fillTriangle(10, 63, 24, 5, 38, 63).fillTriangle(34, 63, 48, 5, 62, 63).fillTriangle(58, 63, 72, 5, 86, 63);
        if (index === 2) g.fillStyle(0x53bfc4, .7).fillEllipse(48, 50, 92, 34).lineStyle(5, 0xe4ffff).strokeEllipse(48, 50, 88, 30).fillStyle(0xf77eba, .8).fillCircle(48, 42, 13);
        if (index === 3) g.fillStyle(0xff6c21).fillTriangle(7, 66, 27, 14, 46, 66).fillTriangle(29, 66, 49, 2, 68, 66).fillTriangle(51, 66, 72, 18, 91, 66).fillStyle(0xffd246).fillCircle(49, 42, 12);
        if (index === 4) g.fillStyle(0x91244f).fillTriangle(3, 67, 22, 12, 40, 67).fillTriangle(29, 67, 48, 2, 67, 67).fillTriangle(56, 67, 75, 12, 94, 67).fillStyle(0xff9fbc).fillCircle(48, 46, 9);
        g.generateTexture(`hazard-${index}`, 96, 70); g.clear();
      });
      g.destroy();
    }

    makeBackdrop() {
      this.bg = this.add.image(W / 2, H / 2, 'jungle-bg').setScrollFactor(0).setDisplaySize(W, H).setDepth(-50);
      this.fog = this.add.rectangle(W / 2, H / 2, W, H, LEVELS[0].fog, .1).setScrollFactor(0).setDepth(-49);
      this.vignette = this.add.graphics().setScrollFactor(0).setDepth(60);
      this.vignette.fillStyle(C.ink, .28).fillRect(0, 0, W, 22).fillRect(0, H - 18, W, 18);
    }

    makeHud() {
      const panel = this.add.rectangle(24, 20, 550, 112, C.cream, .96).setOrigin(0).setStrokeStyle(4, C.wine).setScrollFactor(0).setDepth(70);
      this.scoreText = this.add.text(48, 39, 'SCORE  000000', this.font('Fredoka', 24, '#57001e')).setScrollFactor(0).setDepth(71);
      this.bestText = this.add.text(260, 45, 'BEST  000000', this.font('Poppins', 13, '#7d2940')).setScrollFactor(0).setDepth(71);
      this.counterText = this.add.text(48, 91, 'FRUIT 0/12   KEY 0   GEM 0   CHEST 0/3', this.font('Poppins', 13, '#57001e')).setScrollFactor(0).setDepth(71);
      this.levelText = this.add.text(W / 2, 28, '01  LEMON CANOPY', { ...this.font('Poppins', 15, '#57001e'), backgroundColor: '#ffe64d', padding: { x: 16, y: 9 } }).setOrigin(.5, 0).setScrollFactor(0).setDepth(71);
      this.objectiveText = this.add.text(W / 2, 80, 'FIND FRUIT AND TREASURE KEYS', { ...this.font('Poppins', 12, '#57001e'), backgroundColor: '#fff8e8', padding: { x: 12, y: 6 } }).setOrigin(.5, 0).setScrollFactor(0).setDepth(71);
      this.hearts = this.add.text(W - 30, 28, '♥  ♥  ♥  ♥  ♥', { ...this.font('Fredoka', 26, '#57001e'), backgroundColor: '#fff8e8', padding: { x: 16, y: 8 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(71);
      this.bossBack = this.add.rectangle(W / 2 - 180, 121, 360, 13, 0xead8dd).setOrigin(0).setScrollFactor(0).setDepth(70);
      this.bossBar = this.add.rectangle(W / 2 - 180, 121, 360, 13, C.red).setOrigin(0).setScrollFactor(0).setDepth(71);
      this.dashBack = this.add.rectangle(W - 380, 112, 190, 9, 0xead8dd).setOrigin(0).setScrollFactor(0).setDepth(70);
      this.dashBar = this.add.rectangle(W - 380, 112, 190, 9, C.mint).setOrigin(0).setScrollFactor(0).setDepth(71);
      this.chainText = this.add.text(W - 380, 83, 'CHAIN  x1', this.font('Poppins', 12, '#fff8e8')).setScrollFactor(0).setDepth(71);
      this.hudObjects = [panel];
    }

    font(family, size, color) {
      return { fontFamily: `${family}, sans-serif`, fontSize: `${size}px`, fontStyle: 'bold', color };
    }

    buildLevel(index) {
      this.clearLevel();
      const level = LEVELS[index];
      this.applyTheme(level, index);
      this.worldLayer = this.add.container(0, 0).setDepth(-5);
      this.solids = this.physics.add.staticGroup();
      this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
      this.fruits = this.physics.add.group({ allowGravity: false, immovable: true });
      this.keysGroup = this.physics.add.group({ allowGravity: false, immovable: true });
      this.gems = this.physics.add.group({ allowGravity: false, immovable: true });
      this.chests = this.physics.add.group({ allowGravity: false, immovable: true });
      this.enemies = this.physics.add.group({ allowGravity: false, immovable: true });
      this.spikes = this.physics.add.group({ allowGravity: false, immovable: true });
      this.shots = this.physics.add.group({ allowGravity: false });
      this.bossShots = this.physics.add.group({ allowGravity: false });
      this.ladders = [];
      this.drawWorld(level, index);
      this.makePlayer();
      this.makeCollectibles(level, index);
      this.makeEnemies(level, index);
      this.makeBoss(level, index);
      this.levelColliders = [
        this.physics.add.collider(this.player, this.solids),
        this.physics.add.collider(this.player, this.movers),
        this.physics.add.overlap(this.player, this.fruits, this.collectFruit, null, this),
        this.physics.add.overlap(this.player, this.keysGroup, this.collectKey, null, this),
        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this),
        this.physics.add.overlap(this.player, this.chests, this.openChest, null, this),
        this.physics.add.overlap(this.player, this.enemies, this.touchEnemy, null, this),
        this.physics.add.overlap(this.shots, this.enemies, this.hitEnemy, null, this),
        this.physics.add.overlap(this.player, this.spikes, (_p, spike) => this.damage(spike.x), null, this),
        this.physics.add.overlap(this.player, this.bossShots, (_p, shot) => { shot.destroy(); this.damage(shot.x); }, null, this),
        this.physics.add.overlap(this.shots, this.boss, this.hitBoss, null, this),
        this.physics.add.collider(this.player, this.boss, () => this.damage(this.boss.x), null, this)
      ];
      S.fruit = 0; S.keys = 0; S.gems = 0; S.chests = 0; S.combo = 1; S.comboUntil = 0;
      S.lives = index === 0 ? MAX_LIVES : Math.min(MAX_LIVES, S.lives + 1);
      this.checkpointX = QA && params.has('arena') ? WORLD_W - 1650 : 180;
      this.nextDashAt = 0; this.dashingUntil = 0; this.nextFireAt = 0; this.nextBossAttack = this.time.now + 1800;
      this.cameras.main.setBounds(0, 0, WORLD_W, H).startFollow(this.player, true, .09, .09, -225, 0).setDeadzone(400, 210);
      this.physics.world.setBounds(0, 0, WORLD_W, H);
      this.updateHud();
    }

    clearLevel() {
      this.levelColliders?.forEach(collider => collider.destroy());
      ['solids', 'movers', 'fruits', 'keysGroup', 'gems', 'chests', 'enemies', 'spikes', 'shots', 'bossShots'].forEach(name => this[name]?.clear(true, true));
      this.player?.destroy(); this.boss?.destroy(); this.portal?.destroy(); this.worldLayer?.destroy(true); this.themeBackdrop?.destroy(true);
      this.gateBody = null; this.bossLabel = null;
    }

    applyTheme(level, index) {
      this.bg.clearTint().setTint(level.sky);
      this.fog.setFillStyle(level.fog, [.08, .15, .16, .2, .22][index]);
      this.themeBackdrop = this.add.container(0, 0).setScrollFactor(0).setDepth(-48);
      const g = this.add.graphics();
      if (index === 0) {
        g.fillStyle(0xfff7b0, .52).fillCircle(1320, 175, 138);
        g.fillStyle(0xfff9cb, .12);
        for (let x = 300; x < W + 300; x += 330) g.fillTriangle(x, 0, x + 280, 0, x + 80, H);
        g.lineStyle(7, 0xe6ff9b, .3);
        for (let x = 80; x < W; x += 210) g.beginPath().arc(x, 270 + (x % 170), 120, .2, 2.2).strokePath();
      } else if (index === 1) {
        g.fillStyle(0xffb52f, .32).fillCircle(1260, 170, 180);
        g.fillStyle(0x173f39, .6);
        for (let x = 0; x < W; x += 260) g.fillRect(x, 430 - (x % 130), 150, 470).fillTriangle(x - 40, 430 - (x % 130), x + 75, 300 - (x % 130), x + 190, 430 - (x % 130));
        g.lineStyle(8, 0xffd355, .22);
        for (let x = 170; x < W; x += 310) g.strokeCircle(x, 230 + (x % 190), 48);
      } else if (index === 2) {
        g.fillStyle(0xfbd9ed, .3).fillCircle(1260, 170, 125);
        g.fillStyle(0x85e3d2, .12).fillRect(0, 560, W, 340);
        g.lineStyle(5, 0xffd8ef, .32);
        for (let x = 70; x < W; x += 145) g.strokeCircle(x, 140 + (x * 7 % 520), 18 + (x % 45));
        g.fillStyle(0xffffff, .18);
        for (let x = 100; x < W; x += 240) g.fillCircle(x, 110 + (x % 350), 7);
      } else if (index === 3) {
        g.fillStyle(0xff8c32, .42).fillCircle(1260, 190, 210);
        g.fillStyle(0x301b27, .56);
        for (let x = -60; x < W + 200; x += 280) g.fillTriangle(x, 700, x + 150, 320 + (x % 190), x + 320, 700);
        g.fillStyle(0xffb02e, .6);
        for (let x = 80; x < W; x += 180) g.fillCircle(x, 160 + (x * 3 % 570), 3 + (x % 5));
      } else {
        g.fillStyle(0xffe6ee, .72).fillCircle(1280, 165, 150).fillStyle(0xff9ec2, .16).fillCircle(1280, 165, 210);
        g.fillStyle(0x251933, .5);
        for (let x = -40; x < W + 180; x += 230) g.fillTriangle(x, 700, x + 115, 300 + (x % 220), x + 250, 700);
        g.fillStyle(0xfff4bd, .7);
        for (let x = 90; x < W; x += 155) g.fillCircle(x, 100 + (x * 5 % 540), 3);
      }
      this.themeBackdrop.add(g);
    }

    drawWorld(level, index) {
      const scale = WORLD_W / 10000;
      const layout = WORLD_LAYOUTS[index];
      layout.ground.forEach(([x, width], i) => this.addIsland((x + width / 2) * scale, 828, width * scale, 150, level, true, i, index));
      layout.platforms.forEach((item, i) => this.addIsland(item[0] * scale, item[1], item[2] * Math.max(.72, scale), 86, level, false, i, index));
      layout.ladders.forEach(item => this.addLadder(item[0] * scale, item[1] + 35, 790, level, index));
      layout.movers.forEach((item, i) => this.addMovingPlatform(item[0] * scale, item[1], level, i));
      layout.crates.forEach(item => this.addCrate(item[0] * scale, item[1], level, index));
      layout.spikes.forEach((x, i) => {
        const spike = this.spikes.create(x * scale, 760, `hazard-${index}`).setDisplaySize(index === 3 || index === 4 ? 76 : 68, index === 2 ? 50 : 62).setDepth(8);
        spike.body.setSize(58, 34).setOffset(19, 30); spike.setData({ baseX: spike.x, baseY: spike.y, baseScaleX: spike.scaleX, baseScaleY: spike.scaleY, phase: i * .83, theme: index });
      });
      this.addDecor(level, index);
      this.checkpointMarker = this.add.text(WORLD_W / 2, 690, `CHECKPOINT  •  ${level.hazard}`, { ...this.font('Poppins', 14, '#57001e'), backgroundColor: '#fff8e8', padding: { x: 10, y: 7 } }).setOrigin(.5).setDepth(10);
      this.worldLayer.add(this.checkpointMarker);
    }

    addIsland(x, y, width, height, level, ground = false, seed = 0, index = 0) {
      const visual = this.add.graphics().setDepth(0);
      const top = y - height / 2;
      visual.fillStyle(index === 3 ? 0x21191b : 0x321207).fillRoundedRect(x - width / 2 - 5, top - 5, width + 10, height + 12, ground ? 16 : 18);
      visual.fillStyle(level.dirt).fillRoundedRect(x - width / 2, top, width, height, ground ? 12 : 15);
      visual.fillStyle(level.grass).fillRoundedRect(x - width / 2, top, width, 26, 10);
      visual.fillStyle(level.grassHi).fillRoundedRect(x - width / 2 + 5, top + 4, width - 10, 10, 5);
      for (let px = x - width / 2 + 8; px < x + width / 2 - 12; px += 30) visual.fillStyle(level.grass).fillTriangle(px, top + 20, px + 12, top + 39 + ((px + seed) % 9), px + 24, top + 20);
      for (let r = 0; r < Math.max(2, width / 190); r++) {
        const rx = x - width / 2 + 65 + ((r * 137 + seed * 41) % Math.max(80, width - 130));
        const ry = top + 57 + (r % 2) * 25;
        if (index === 1) visual.fillStyle(level.rock).fillRect(rx - 20, ry - 12, 40, 24).lineStyle(3, 0xe0a83d).strokeRect(rx - 20, ry - 12, 40, 24);
        else if (index === 2) visual.fillStyle(level.rock).fillCircle(rx, ry, 14).lineStyle(3, 0xf2a8d0).strokeCircle(rx, ry, 14);
        else if (index === 4) visual.fillStyle(level.rock).fillTriangle(rx, ry - 18, rx - 18, ry + 13, rx + 18, ry + 13).lineStyle(3, level.accent).strokeTriangle(rx, ry - 18, rx - 18, ry + 13, rx + 18, ry + 13);
        else visual.fillStyle(level.rock).fillRoundedRect(rx - 18, ry - 8, 36, 16, 8).lineStyle(3, 0x321207).strokeRoundedRect(rx - 18, ry - 8, 36, 16, 8);
      }
      const body = this.solids.create(x, y, 'blank').setDisplaySize(width, height).setAlpha(0).refreshBody();
      this.worldLayer.add(visual);
      return body;
    }

    addLadder(x, top, bottom, level, index) {
      const visual = this.add.graphics().setDepth(5);
      visual.lineStyle(10, index === 1 ? 0x59381e : index === 3 ? 0x33272a : C.wine).lineBetween(x - 30, top, x - 30, bottom).lineBetween(x + 30, top, x + 30, bottom);
      visual.lineStyle(7, index === 2 ? level.accent : index === 4 ? level.color : C.coral);
      for (let y = top + 15; y < bottom; y += 42) visual.lineBetween(x - 29, y, x + 29, y);
      this.worldLayer.add(visual);
      this.ladders.push(new Phaser.Geom.Rectangle(x - 48, top - 24, 96, bottom - top + 55));
    }

    addMovingPlatform(x, y, level, index) {
      const mover = this.movers.create(x, y, 'moving-platform').setDisplaySize(280, 62).setDepth(8).setTint(level.color);
      mover.body.setSize(280, 52).setOffset(20, 5).setVelocityX(index % 2 ? -90 : 90);
      mover.setData({ min: x - 280, max: x + 280 });
    }

    addCrate(x, y, level, index) {
      const crate = this.add.image(x, y, 'crate').setDepth(8).setTint(index === 0 ? 0xfff19c : index === 2 ? 0xffb6d6 : index === 3 ? 0xc56b45 : index === 4 ? 0xff8eb3 : 0xffb64c);
      const body = this.solids.create(x, y, 'blank').setDisplaySize(76, 72).setAlpha(0).refreshBody();
      this.worldLayer.add(crate);
      return body;
    }

    addDecor(level, index) {
      const g = this.add.graphics().setDepth(-1);
      if (index === 2) g.fillStyle(0x7ae3d0, .46).fillRect(0, 800, WORLD_W, 100).lineStyle(6, 0xd8fff5, .72).lineBetween(0, 801, WORLD_W, 801);
      if (index === 3) g.fillStyle(0xff5528, .66).fillRect(0, 804, WORLD_W, 96).lineStyle(7, 0xffc43e, .8).lineBetween(0, 804, WORLD_W, 804);
      if (index === 4) g.fillStyle(0x9a143f, .5).fillRect(0, 810, WORLD_W, 90).lineStyle(7, 0xff739c, .65).lineBetween(0, 810, WORLD_W, 810);
      for (let x = 450, n = 0; x < WORLD_W; x += QA ? 820 : 980, n++) {
        if (index === 0) {
          g.fillStyle(0x623512).fillRoundedRect(x - 18, 500, 36, 270, 15);
          g.fillStyle(level.grass).fillEllipse(x - 65, 500, 170, 74).fillEllipse(x + 58, 478, 180, 82).fillEllipse(x, 425, 136, 116);
          g.fillStyle(level.color).fillCircle(x - 45, 500, 23).fillCircle(x + 52, 450, 20).lineStyle(5, 0xffffff, .55).strokeCircle(x - 45, 500, 17);
          g.lineStyle(7, 0x69c653).beginPath().arc(x + 110, 545, 95, -.7, 1.7).strokePath();
        } else if (index === 1) {
          g.fillStyle(0x5e4527).fillRect(x - 48, 470, 96, 300).fillStyle(0xc48634).fillRect(x - 60, 455, 120, 28).fillRect(x - 60, 740, 120, 30);
          g.lineStyle(5, level.accent, .58).strokeCircle(x, 560, 28).strokeRect(x - 22, 620, 44, 58);
          g.fillStyle(level.color).fillTriangle(x - 18, 475, x + 62, 475, x + 22, 610);
          g.fillStyle(0xffdf55, .55).fillCircle(x + 88, 692, 20).fillStyle(0xff7135, .75).fillCircle(x + 88, 692, 10);
        } else if (index === 2) {
          g.fillStyle(0x2f665f).fillRoundedRect(x - 11, 610, 22, 170, 10);
          for (let r = -2; r <= 2; r++) g.fillStyle(0x65d29b).fillEllipse(x + r * 18, 600 - Math.abs(r) * 22, 42, 120).fillStyle(level.accent, .5).fillCircle(x + 85 + r * 25, 530 - r * 44, 10 + Math.abs(r) * 4);
          g.fillStyle(0x72c882).fillEllipse(x - 80, 760, 150, 34).lineStyle(4, 0xd5ffd7).strokeEllipse(x - 80, 760, 150, 34);
          g.fillStyle(level.color).fillCircle(x + 55, 730, 25).fillStyle(C.cream).fillCircle(x + 55, 730, 8);
        } else if (index === 3) {
          g.fillStyle(0x302123).fillRoundedRect(x - 18, 500, 36, 275, 10).fillTriangle(x, 530, x - 100, 430, x - 20, 545).fillTriangle(x, 580, x + 105, 470, x + 18, 600);
          g.fillStyle(level.color, .84).fillTriangle(x - 95, 770, x - 68, 690, x - 42, 770).fillTriangle(x + 48, 770, x + 73, 715, x + 98, 770);
          g.fillStyle(0xffc148, .7).fillCircle(x - 30, 650, 7).fillCircle(x + 55, 590, 5).fillCircle(x + 92, 520, 4);
        } else {
          g.fillStyle(0x4a2045).fillRoundedRect(x - 15, 510, 30, 260, 13);
          g.fillStyle(level.grass).fillEllipse(x - 55, 500, 155, 72).fillEllipse(x + 52, 475, 165, 76).fillEllipse(x, 430, 128, 108);
          g.fillStyle(level.color).fillTriangle(x - 55, 570, x, 410, x + 55, 570).fillCircle(x, 505, 58);
          g.fillStyle(C.cream).fillCircle(x - 22, 485, 5).fillCircle(x + 17, 520, 5).fillCircle(x + 26, 478, 5);
          g.lineStyle(8, 0xb72868).beginPath().arc(x + 82, 590, 120, -.8, 1.7).strokePath();
        }
        if (n % 2 === 0) {
          const messages = ['SQUEEZE!', 'TEMPLE', 'BUBBLES', 'HOT!', 'BEWARE'];
          const sign = this.add.text(x + 145, 680, n % 4 ? '→' : messages[index], { ...this.font('Fredoka', 24, '#57001e'), backgroundColor: index === 4 ? '#ff9cbd' : '#ffe64d', padding: { x: 12, y: 7 } }).setAngle(n % 4 ? 4 : -4).setDepth(4);
          this.worldLayer.add(sign);
        }
      }
      this.worldLayer.add(g);
      const zone = this.add.text(110, 190, `${level.name}\n${level.zone}`, { fontFamily: 'Fredoka, sans-serif', fontSize: '52px', fontStyle: 'bold', color: index >= 3 ? '#fff8e8' : '#57001e', lineSpacing: -3, stroke: index >= 3 ? '#57001e' : '#fff8e8', strokeThickness: 7 }).setDepth(-1);
      this.worldLayer.add(zone);
    }

    makePlayer() {
      const startX = QA && params.has('arena') ? WORLD_W - 1650 : 180;
      this.player = this.physics.add.sprite(startX, 675, 'mascot-main-mascot-clean').setDisplaySize(154, 154).setDepth(20);
      this.player.body.setSize(this.player.width * .5, this.player.height * .66).setOffset(this.player.width * .25, this.player.height * .3).setCollideWorldBounds(true).setMaxVelocity(QA ? 690 : 440, 1050).setDragX(1250);
      this.playerState = 'ground'; this.invulnerable = false; this.climbing = false; this.lastGroundedAt = 0;
    }

    makeCollectibles(level, index) {
      const scale = WORLD_W / 10000;
      const layout = WORLD_LAYOUTS[index];
      const spots = [[640, 690], ...layout.platforms.map(item => [item[0], item[1] - 88])];
      for (let i = 0; i < FRUIT_GOAL; i++) {
        const source = spots[i % spots.length], x = source[0] * scale, y = source[1];
        const fruit = this.fruits.create(x, y, `fruit-${level.key}`).setDisplaySize(82, 82).setDepth(12);
        fruit.body.setCircle(fruit.width * .32, fruit.width * .18, fruit.height * .18);
        fruit.setData({ baseX: x, baseY: y, phase: i * 1.17, range: 32 + (i % 3) * 20 });
      }
      [layout.platforms[1], layout.platforms[5], layout.platforms[9]].forEach((spot, i) => {
        const pos = [spot[0], spot[1] - 92];
        const key = this.keysGroup.create(pos[0] * scale, pos[1], 'key').setDisplaySize(62, 62).setDepth(13);
        key.body.setCircle(25, 5, 5); key.setData({ baseY: pos[1], phase: i * 1.8 });
      });
      [layout.platforms[2], layout.platforms[7], layout.platforms[10]].forEach((spot, i) => {
        const pos = [spot[0], spot[1] - 62];
        const chest = this.chests.create(pos[0] * scale, pos[1], 'chest-closed').setDisplaySize(98, 92).setDepth(11);
        chest.body.setSize(88, 70).setOffset(5, 20); chest.setData({ opened: false, id: i });
      });
      for (let i = 0; i < (QA ? 6 : 18); i++) {
        const spot = spots[(i * 2 + index) % spots.length], x = spot[0] * scale + (i % 2 ? 65 : -65), y = spot[1] - 18;
        const gem = this.gems.create(x, y, 'gem').setDisplaySize(44, 44).setDepth(12);
        gem.body.setCircle(18, 5, 5); gem.setData({ baseY: y, phase: i * .72 });
      }
    }

    makeEnemies(level, index) {
      const count = QA ? 8 : 24;
      const layout = WORLD_LAYOUTS[index];
      const groundSpots = layout.ground.flatMap(([x, width]) => [x + width * .28, x + width * .65]);
      const platformSpots = layout.platforms.map(item => [item[0], item[1] - 78]);
      const species = [
        ['patrol', 'hopper'],
        ['sentry', 'patrol', 'hopper'],
        ['floater', 'bubble'],
        ['charger', 'hopper'],
        ['hunter', 'thorn', 'hopper']
      ][index];
      for (let i = 0; i < count; i++) {
        const source = i % 3 === 0 ? platformSpots[i % platformSpots.length] : [groundSpots[i % groundSpots.length], 710];
        const x = source[0] * (WORLD_W / 10000), baseY = source[1];
        const enemy = this.enemies.create(x, baseY, `enemy-${index}`).setDisplaySize(82 + index * 2, 82 + index * 2).setDepth(14);
        enemy.body.setCircle(31, 17, 17);
        enemy.setData({ baseX: x, baseY, phase: i * .8, range: 80 + (i % 4) * 35, speed: .0012 + index * .00012, type: species[i % species.length], hp: index > 2 && i % 4 === 0 ? 2 : 1 });
      }
    }

    makeBoss(level, index) {
      const arena = this.add.graphics().setDepth(3);
      arena.fillStyle(index === 1 ? 0xb27c30 : index === 3 ? 0x3a2628 : index === 4 ? 0x552849 : level.dirt).fillRoundedRect(WORLD_W - 1320, 705, 1200, 115, 18);
      arena.fillStyle(level.grass).fillRoundedRect(WORLD_W - 1320, 697, 1200, 30, 12).fillStyle(level.grassHi).fillRoundedRect(WORLD_W - 1310, 702, 1180, 9, 5);
      if (index === 0) arena.fillStyle(level.color).fillCircle(WORLD_W - 1010, 670, 45).lineStyle(7, C.cream).strokeCircle(WORLD_W - 1010, 670, 32);
      if (index === 1) arena.fillStyle(0xd69b3d).fillRect(WORLD_W - 1090, 430, 90, 280).fillRect(WORLD_W - 310, 430, 90, 280).lineStyle(8, level.accent).strokeRect(WORLD_W - 1080, 440, 70, 250).strokeRect(WORLD_W - 300, 440, 70, 250);
      if (index === 2) for (let i = 0; i < 7; i++) arena.lineStyle(5, level.accent, .6).strokeCircle(WORLD_W - 1040 + i * 130, 625 - (i % 3) * 55, 25 + i % 2 * 15);
      if (index === 3) for (let i = 0; i < 6; i++) arena.fillStyle(level.color, .8).fillTriangle(WORLD_W - 1120 + i * 170, 705, WORLD_W - 1075 + i * 170, 610 - (i % 2) * 45, WORLD_W - 1030 + i * 170, 705);
      if (index === 4) for (let i = 0; i < 8; i++) arena.fillStyle(i % 2 ? level.color : level.accent).fillTriangle(WORLD_W - 1180 + i * 135, 705, WORLD_W - 1148 + i * 135, 625 - (i % 3) * 28, WORLD_W - 1116 + i * 135, 705);
      this.gateBody = this.solids.create(WORLD_W - 1150, 650, 'blank').setDisplaySize(90, 300).setAlpha(0).refreshBody();
      this.gateArt = this.add.image(WORLD_W - 1150, 645, 'gate-locked').setDisplaySize(118, 300).setDepth(9).setTint(level.color);
      this.portal = this.add.image(WORLD_W - 280, 655, 'portal').setDisplaySize(150, 150).setDepth(10).setAlpha(.22).setTint(level.accent);
      this.boss = this.physics.add.sprite(WORLD_W - 650, 630, `boss-${index}`).setDisplaySize(230 + index * 8, 266 + index * 8).setDepth(15).setImmovable(true);
      this.boss.body.setAllowGravity(false);
      this.boss.body.setSize(170, 210).setOffset(24, 22);
      this.boss.body.enable = false;
      this.boss.setAlpha(0).setAngle(-9).setData({ hp: level.hp, max: level.hp, alive: true, awake: false, revealed: false, baseX: WORLD_W - 650, baseY: 630 });
      this.bossLabel = this.add.text(WORLD_W - 650, 410, level.boss, { ...this.font('Fredoka', 30, '#fff8e8'), backgroundColor: '#57001e', padding: { x: 16, y: 8 } }).setOrigin(.5).setDepth(12);
      this.worldLayer.add([arena, this.gateArt, this.bossLabel]);
    }

    revealBoss() {
      if (!this.boss?.active || this.boss.getData('revealed')) return;
      const level = LEVELS[S.level];
      this.boss.setData('revealed', true); this.boss.body.enable = true; this.bossLabel.setAlpha(0);
      this.sfx('warning'); this.cameras.main.shake(260, .012);
      this.tweens.add({ targets: this.boss, alpha: 1, angle: 0, duration: 620, ease: 'Back.easeOut' });
      this.tweens.add({ targets: this.bossLabel, alpha: 1, duration: 420, delay: 260 });
      this.banner(`${level.boss} BLOCKS THE EXIT`, level.color);
    }

    makeIntro() {
      this.intro = this.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(100);
      const shade = this.add.rectangle(0, 0, W, H, C.forest, .35), panel = this.add.rectangle(250, 0, 760, 650, C.cream, .96).setStrokeStyle(5, C.wine), island = this.add.graphics();
      island.fillStyle(0x321207).fillRoundedRect(-750, 90, 610, 250, 40).fillStyle(C.dirt).fillRoundedRect(-740, 80, 590, 245, 34).fillStyle(C.green).fillRoundedRect(-750, 65, 610, 55, 25);
      const mascot = this.add.image(-440, 15, 'mascot-energetic').setDisplaySize(360, 360), eyebrow = this.add.text(250, -245, 'A FIVE-FLAVOUR PLATFORM ADVENTURE', this.font('Poppins', 14, '#e8143e')).setOrigin(.5), title = this.add.text(250, -110, 'JUNGLE\nQUEST', { ...this.font('Fredoka', 102, '#57001e'), align: 'center', lineSpacing: -28 }).setOrigin(.5), copy = this.add.text(250, 74, 'Climb layered islands. Find keys. Crack treasure chests.\nCollect moving fruit and defeat every jungle guardian.', { ...this.font('Nunito Sans', 21, '#6f263e'), align: 'center', lineSpacing: 8 }).setOrigin(.5), button = this.add.rectangle(250, 220, 340, 76, C.red).setStrokeStyle(4, C.wine), label = this.add.text(250, 220, 'START JUNGLE QUEST', this.font('Poppins', 18, '#ffffff')).setOrigin(.5), tip = this.add.text(250, 305, 'MOVE  •  CLIMB  •  THROW  •  DASH  •  EXPLORE', this.font('Poppins', 11, '#7d2940')).setOrigin(.5);
      this.intro.add([shade, island, mascot, panel, eyebrow, title, copy, button, label, tip]);
      this.showAction('START JUNGLE QUEST', 1050, 670, 340, 76, () => this.startGame());
    }

    bindControls() {
      this.keys = this.input.keyboard.addKeys({ left: 'A', right: 'D', up: 'W', down: 'S', jump: 'SPACE', la: 'LEFT', ra: 'RIGHT', ua: 'UP', da: 'DOWN' });
      this.touch = { left: false, right: false, up: false };
      ['W', 'UP', 'SPACE'].forEach(key => this.input.keyboard.on(`keydown-${key}`, () => this.jump()));
      this.input.keyboard.on('keydown-F', () => this.fire());
      this.input.keyboard.on('keydown-SHIFT', () => this.dash());
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
      if (QA) {
        this.input.keyboard.on('keydown-N', () => { if (S.started && S.level < LEVELS.length - 1) this.nextLevel(); });
        this.input.keyboard.on('keydown-K', () => { S.fruit = FRUIT_GOAL; S.chests = CHEST_GOAL; this.checkGate(); this.updateHud(); });
        this.input.keyboard.on('keydown-B', () => { if (S.started && this.boss?.active) { this.revealBoss(); this.boss.setData('awake', true); this.defeatBoss(); } });
      }
      document.getElementById('pause-button')?.addEventListener('click', () => this.togglePause());
      document.getElementById('sound-button')?.addEventListener('click', event => this.toggleSound(event.currentTarget));
      document.querySelectorAll('[data-control]').forEach(button => {
        const control = button.dataset.control;
        const set = value => {
          button.classList.toggle('is-down', value);
          if (control === 'left' || control === 'right' || control === 'up') this.touch[control] = value;
          if ((control === 'jump' || control === 'up') && value) this.jump();
          if (control === 'attack' && value) this.fire();
          if (control === 'dash' && value) this.dash();
        };
        button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); set(true); });
        button.addEventListener('pointerup', () => set(false));
        button.addEventListener('pointercancel', () => set(false));
      });
    }

    showAction(label, x, y, width, height, handler) {
      const trigger = document.getElementById('action-trigger'), stage = document.querySelector('.stage-wrap');
      if (!trigger || !stage) return;
      if (this.positionAction) window.removeEventListener('resize', this.positionAction);
      const position = () => {
        const canvas = this.game.canvas.getBoundingClientRect(), box = stage.getBoundingClientRect(), sx = canvas.width / W, sy = canvas.height / H;
        trigger.style.left = `${canvas.left - box.left + (x - width / 2) * sx}px`;
        trigger.style.top = `${canvas.top - box.top + (y - height / 2) * sy}px`;
        trigger.style.width = `${width * sx}px`; trigger.style.height = `${height * sy}px`;
        trigger.style.fontSize = `${Math.max(11, 18 * sy)}px`;
      };
      this.positionAction = position; trigger.textContent = label; trigger.setAttribute('aria-label', label); trigger.hidden = false; position();
      window.addEventListener('resize', position);
      trigger.onclick = () => { trigger.hidden = true; window.removeEventListener('resize', position); this.positionAction = null; handler(); };
    }

    startGame() {
      if (S.started) return;
      S.started = true; this.intro.destroy(); this.physics.resume(); document.querySelector('.controls-hint')?.classList.add('hidden');
      this.music = this.sound.add('quest-theme', { loop: true, volume: .34 }); if (this.soundEnabled) this.music.play();
      this.sfx('start'); this.banner(`${LEVELS[S.level].name}  •  QUEST BEGINS`, LEVELS[S.level].color);
    }

    collectFruit(_player, fruit) {
      if (!fruit.active) return;
      const { x, y } = fruit; fruit.disableBody(true, true); S.fruit++; this.raiseCombo(); this.addScore(150, x, y, 'FRUIT'); this.sfx('collect'); this.burst(x, y, LEVELS[S.level].color, 12); this.checkGate();
    }

    collectKey(_player, key) {
      if (!key.active) return;
      const { x, y } = key; key.disableBody(true, true); S.keys++; this.raiseCombo(); this.addScore(260, x, y, 'JUNGLE KEY'); this.sfx('key'); this.burst(x, y, C.yellow, 14); this.banner('TREASURE KEY FOUND', C.yellow);
    }

    collectGem(_player, gem) {
      if (!gem.active) return;
      const { x, y } = gem; gem.disableBody(true, true); S.gems++; this.raiseCombo(); this.addScore(90, x, y, 'GEM'); this.sfx('gem');
    }

    openChest(_player, chest) {
      if (!chest.active || chest.getData('opened')) return;
      if (S.keys < 1) { if (this.time.now > (chest.getData('warnAt') || 0)) { chest.setData('warnAt', this.time.now + 1800); this.banner('THIS CHEST NEEDS A KEY', C.coral); } return; }
      S.keys--; S.chests++; chest.setData('opened', true).setTexture('chest-open'); chest.body.enable = false; this.raiseCombo(2); this.addScore(650, chest.x, chest.y - 30, 'CHEST OPEN'); this.sfx('chest');
      for (let i = 0; i < 5; i++) { const gem = this.gems.create(chest.x, chest.y - 45, 'gem').setDisplaySize(42, 42).setDepth(16); gem.body.setCircle(17, 5, 5); gem.setVelocity(Phaser.Math.Between(-220, 220), Phaser.Math.Between(-420, -230)); gem.body.allowGravity = true; gem.setData({ born: this.time.now, bonus: true, baseY: chest.y, phase: i }); }
      this.checkGate();
    }

    touchEnemy(_player, enemy) {
      if (!enemy.active) return;
      if (this.time.now < this.dashingUntil) { this.clearEnemy(enemy, 300, 'DASH BREAK'); return; }
      this.damage(enemy.x);
    }

    hitEnemy(shot, enemy) {
      if (!shot.active || !enemy.active) return;
      shot.destroy(); const hp = enemy.getData('hp') - 1; enemy.setData('hp', hp);
      if (hp > 0) { enemy.setTint(C.yellow); this.time.delayedCall(140, () => enemy.active && enemy.clearTint()); this.addScore(80, enemy.x, enemy.y, 'ARMOR CRACK'); return; }
      this.clearEnemy(enemy, 220, 'BLOCKER');
    }

    clearEnemy(enemy, points, label) {
      const { x, y } = enemy; enemy.destroy(); S.enemies++; this.raiseCombo(); this.addScore(points, x, y, label); this.sfx('hit'); this.burst(x, y, LEVELS[S.level].color, 8);
    }

    checkGate() {
      if (!this.gateBody?.active || S.fruit < FRUIT_GOAL || S.chests < CHEST_GOAL) return;
      this.gateBody.destroy(); this.gateBody = null; this.gateArt.setAlpha(0); this.portal.setAlpha(.62); this.boss.setData('awake', true); this.sfx('gate'); this.banner(`${LEVELS[S.level].boss} AWAKENS`, C.yellow);
    }

    jump() {
      if (!S.started || S.paused || S.finished || this.playerState === 'hurt') return;
      if (this.climbing) { this.climbing = false; this.player.body.allowGravity = true; this.player.setVelocityY(-620); return; }
      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      if (grounded || this.time.now - this.lastGroundedAt < 150) { this.player.setVelocityY(-760); this.playerState = 'air'; this.sfx('jump'); this.mood('energetic', 280); }
    }

    dash() {
      if (!S.started || S.paused || S.finished || this.playerState === 'hurt' || this.time.now < this.nextDashAt) return;
      const direction = this.player.flipX ? -1 : 1; this.nextDashAt = this.time.now + 1500; this.dashingUntil = this.time.now + 330; this.invulnerable = true;
      this.player.body.allowGravity = true; this.player.setVelocity(direction * (QA ? 880 : 750), -60).setTint(C.yellow); this.sfx('dash'); this.mood('cool', 310);
      this.time.delayedCall(340, () => { this.player.clearTint(); if (this.playerState !== 'hurt') this.invulnerable = false; });
    }

    fire() {
      if (!S.started || S.paused || S.finished || this.playerState === 'hurt' || this.time.now < this.nextFireAt) return;
      this.nextFireAt = this.time.now + 260; const direction = this.player.flipX ? -1 : 1;
      const shot = this.shots.create(this.player.x + direction * 55, this.player.y - 15, 'fruit-shot').setDisplaySize(44, 44).setVelocity(direction * 900, -40).setDepth(22);
      shot.body.setCircle(18, 10, 10); shot.setData('born', this.time.now); this.tweens.add({ targets: shot, angle: direction * 720, duration: 650 }); this.sfx('throw'); this.mood('confident', 220);
    }

    hitBoss(shot, boss) {
      if (!shot.active || !boss.active || !boss.getData('alive')) return;
      shot.destroy();
      if (!boss.getData('awake')) { this.sfx('block'); this.banner(`FIND ${FRUIT_GOAL - S.fruit} FRUIT  •  OPEN ${CHEST_GOAL - S.chests} CHESTS`, C.coral); return; }
      const hp = boss.getData('hp') - 1; boss.setData('hp', hp); this.raiseCombo(); this.addScore(330, boss.x, boss.y - 100, 'BOSS HIT'); this.sfx('hit'); boss.setTint(C.yellow); this.time.delayedCall(110, () => boss.active && boss.clearTint()); this.cameras.main.shake(100, .005);
      if (hp <= 0) this.defeatBoss();
    }

    defeatBoss() {
      const level = LEVELS[S.level]; this.boss.setData('alive', false); this.boss.body.enable = false; this.bossShots.clear(true, true); this.portal.setAlpha(1); this.addScore(2200 + S.level * 500, this.boss.x, this.boss.y - 120, 'GUARDIAN CLEAR'); this.sfx('clear');
      this.tweens.add({ targets: this.boss, scale: .12, angle: 720, alpha: 0, duration: 700, ease: 'Back.easeIn' });
      if (S.level === LEVELS.length - 1) { this.time.delayedCall(950, () => this.showWin()); return; }
      this.banner(`${level.name} COMPLETE`, level.color); this.time.delayedCall(1300, () => this.nextLevel());
    }

    nextLevel() {
      S.level++; this.physics.pause(); this.cameras.main.fadeOut(300, 18, 63, 59);
      this.time.delayedCall(340, () => { this.buildLevel(S.level); this.physics.resume(); this.cameras.main.fadeIn(430, 255, 248, 232); this.banner(`${LEVELS[S.level].name}  •  ${LEVELS[S.level].zone}`, LEVELS[S.level].color); });
    }

    damage(fromX) {
      if (this.invulnerable || this.playerState === 'hurt' || S.finished) return;
      S.lives--; S.combo = 1; this.invulnerable = true; this.playerState = 'hurt'; this.sfx('hurt'); this.updateHud(); this.player.body.allowGravity = true; this.player.setVelocity(this.player.x < fromX ? -420 : 420, -420).setTint(0xff8ca7); this.cameras.main.shake(170, .009); this.mood('angry', 260);
      if (S.lives <= 0) { this.time.delayedCall(520, () => this.showGameOver()); return; }
      const respawn = Math.max(this.checkpointX, this.player.x - 620);
      this.time.delayedCall(620, () => { this.player.setPosition(respawn, 660).setVelocity(0, 0).clearTint().setAlpha(1); this.playerState = 'ground'; this.tweens.add({ targets: this.player, alpha: .25, duration: 120, yoyo: true, repeat: 7 }); this.time.delayedCall(1900, () => { this.invulnerable = false; this.player.setAlpha(1); }); });
    }

    bossAttack(time) {
      if (!this.boss?.active || !this.boss.getData('alive') || !this.boss.getData('revealed') || !this.boss.getData('awake') || this.player.x < WORLD_W - 1800 || time < this.nextBossAttack) return;
      const level = LEVELS[S.level], count = 2 + Math.min(3, S.level); this.nextBossAttack = time + 2050 - S.level * 150; this.sfx('warning'); this.boss.setTint(C.coral); this.time.delayedCall(130, () => this.boss?.active && this.boss.clearTint());
      for (let i = 0; i < count; i++) {
        let x = this.boss.x - 90, y = 680 - i * 115, vx = -350 - S.level * 55, vy = (i - count / 2) * 55, type = 'wave', size = 44;
        if (S.level === 1 && i % 2 === 0) { x = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-320, 320), WORLD_W - 1650, WORLD_W - 180); y = 180 - i * 45; vx = 0; vy = 430; type = 'rain'; size = 58; }
        if (S.level === 2) { vx = -275; vy = 0; type = 'bubble'; size = 62 - i * 4; }
        if (S.level === 3) { vx = -520 - i * 35; vy = -170 + i * 85; type = 'ember'; size = 50; }
        if (S.level === 4 && i % 2 === 0) { x = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-420, 420), WORLD_W - 1700, WORLD_W - 180); y = 120 - i * 20; vx = Phaser.Math.Between(-80, 80); vy = 540; type = 'thorn'; size = 64; }
        const shot = this.bossShots.create(x, y, `hazard-${S.level}`).setDisplaySize(size + 14, size).setVelocity(vx, vy).setDepth(19);
        shot.body.setCircle(Math.max(14, size * .36), 5, 5); shot.setData({ born: time, baseY: y, phase: i, type });
      }
    }

    raiseCombo(amount = 1) { S.combo = Math.min(9, S.combo + amount); S.comboUntil = this.time.now + 4000; }

    addScore(base, x, y, label) {
      const value = base * S.combo; S.score += value; if (S.score > S.best) { S.best = S.score; try { localStorage.setItem(SCORE_KEY, String(S.best)); } catch {} }
      const text = this.add.text(x, y - 25, `${label}  +${value}`, { ...this.font('Poppins', 16, '#57001e'), backgroundColor: '#ffe64d', padding: { x: 9, y: 5 } }).setOrigin(.5).setDepth(40);
      this.tweens.add({ targets: text, y: y - 90, alpha: 0, duration: 720, onComplete: () => text.destroy() }); this.updateHud();
    }

    updateHud() {
      if (!this.player || !this.boss) return;
      const level = LEVELS[S.level], dash = Math.min(1, Math.max(0, 1 - (this.nextDashAt - this.time.now) / 1500));
      this.scoreText.setText(`SCORE  ${String(S.score).padStart(6, '0')}`); this.bestText.setText(`BEST  ${String(S.best).padStart(6, '0')}`); this.counterText.setText(`FRUIT ${S.fruit}/${FRUIT_GOAL}   KEY ${S.keys}   GEM ${S.gems}   CHEST ${S.chests}/${CHEST_GOAL}`); this.hearts.setText(Array(Math.max(0, S.lives)).fill('♥').join('  ') || 'EMPTY');
      this.levelText.setText(`${String(S.level + 1).padStart(2, '0')}  ${level.name}`).setBackgroundColor(Phaser.Display.Color.IntegerToColor(level.color).rgba).setColor(S.level === 4 ? '#fff8e8' : '#57001e');
      if (S.fruit < FRUIT_GOAL) this.objectiveText.setText(`FIND ${FRUIT_GOAL - S.fruit} MOVING FRUIT`); else if (S.chests < CHEST_GOAL) this.objectiveText.setText(`OPEN ${CHEST_GOAL - S.chests} TREASURE CHESTS`); else this.objectiveText.setText(`${level.boss}  •  GATE OPEN`);
      this.bossBar.scaleX = this.boss.active ? Math.max(0, this.boss.getData('hp') / this.boss.getData('max')) : 0; const bossVisible = this.boss.getData('revealed'); this.bossBack.setAlpha(bossVisible ? 1 : .12); this.bossBar.setAlpha(bossVisible ? 1 : .12); this.dashBar.scaleX = dash; this.chainText.setText(`CHAIN  x${S.combo}`).setColor(S.combo >= 5 ? '#ffe64d' : '#fff8e8');
    }

    loadBest() { try { return Math.max(0, parseInt(localStorage.getItem(SCORE_KEY) || '0', 10) || 0); } catch { return 0; } }

    banner(message, color) {
      const text = this.add.text(W / 2, 175, message, { ...this.font('Fredoka', 34, '#57001e'), backgroundColor: Phaser.Display.Color.IntegerToColor(color).rgba, padding: { x: 18, y: 9 } }).setOrigin(.5).setScrollFactor(0).setDepth(90).setAlpha(0).setScale(.82);
      this.tweens.add({ targets: text, alpha: 1, scale: 1, duration: 190, ease: 'Back.easeOut', hold: 820, yoyo: true, onComplete: () => text.destroy() });
    }

    burst(x, y, color, count) { for (let i = 0; i < count; i++) { const dot = this.add.circle(x, y, Phaser.Math.Between(4, 9), color).setDepth(30), angle = Phaser.Math.FloatBetween(0, Math.PI * 2), distance = Phaser.Math.Between(45, 120); this.tweens.add({ targets: dot, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, alpha: 0, scale: .1, duration: 440, onComplete: () => dot.destroy() }); } }
    mood(name, duration = 0) { this.player.setTexture(`mascot-${name}`).setDisplaySize(154, 154); if (duration) this.time.delayedCall(duration, () => { if (this.playerState !== 'hurt') this.player.setTexture('mascot-main-mascot-clean'); }); }

    sfx(name) {
      if (!this.soundEnabled) return;
      const context = this.sound.context; if (!context) return;
      const map = { start: [392, 620], jump: [260], dash: [150, 520], throw: [180], collect: [620, 880], key: [440, 760], gem: [760], chest: [220, 440, 720], hit: [210, 510], hurt: [170], gate: [330, 660], warning: [120], block: [130], clear: [420, 650, 880], win: [392, 588, 784] };
      (map[name] || []).forEach((frequency, index) => { const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime + index * .06; oscillator.type = name === 'hurt' || name === 'warning' ? 'sawtooth' : 'triangle'; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * 1.18), now + .12); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.035, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + .15); oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now + .17); });
    }

    toggleSound(button) { this.soundEnabled = !this.soundEnabled; button.textContent = this.soundEnabled ? '♪' : '×'; button.setAttribute('aria-pressed', String(this.soundEnabled)); if (this.music) { if (this.soundEnabled) this.music.resume(); else this.music.pause(); } }

    togglePause() {
      if (!S.started || S.finished || this.playerState === 'hurt') return;
      S.paused = !S.paused;
      if (S.paused) { this.physics.pause(); this.music?.pause(); this.pauseCard = this.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(110); this.pauseCard.add([this.add.rectangle(0, 0, 540, 220, C.cream).setStrokeStyle(5, C.wine), this.add.text(0, -35, 'QUEST PAUSED', this.font('Fredoka', 44, '#57001e')).setOrigin(.5), this.add.text(0, 43, 'Press Esc or pause to continue', this.font('Nunito Sans', 19, '#7d2940')).setOrigin(.5)]); } else { this.pauseCard?.destroy(); this.pauseCard = null; this.physics.resume(); if (this.soundEnabled) this.music?.resume(); }
    }

    showGameOver() {
      S.finished = true; this.physics.pause(); this.music?.stop(); this.sfx('hurt'); const panel = this.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(120), shade = this.add.rectangle(0, 0, W, H, C.wine, .95), mascot = this.add.image(-330, 0, 'mascot-sad').setDisplaySize(350, 350), score = this.add.text(150, -130, String(S.score).padStart(6, '0'), this.font('Fredoka', 82, '#ffe64d')).setOrigin(.5), title = this.add.text(150, -48, 'LOST IN THE JUNGLE', this.font('Fredoka', 40, '#fff8e8')).setOrigin(.5), copy = this.add.text(150, 35, `BEST  ${String(S.best).padStart(6, '0')}\nReached ${LEVELS[S.level].name}.`, { ...this.font('Poppins', 17, '#fff8e8'), align: 'center', lineSpacing: 8 }).setOrigin(.5), button = this.add.rectangle(150, 160, 260, 66, C.red).setStrokeStyle(3, C.cream), label = this.add.text(150, 160, 'TRY AGAIN', this.font('Poppins', 18, '#ffffff')).setOrigin(.5); panel.add([shade, mascot, score, title, copy, button, label]); this.showAction('TRY AGAIN', 950, 610, 260, 66, () => location.reload());
    }

    showWin() {
      S.finished = true; this.physics.pause(); this.music?.stop(); this.sfx('win'); const panel = this.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(120), shade = this.add.rectangle(0, 0, W, H, C.forest, .97), halo = this.add.circle(-330, 0, 210, C.yellow), mascot = this.add.image(-330, 0, 'mascot-celebrating').setDisplaySize(390, 390), score = this.add.text(175, -165, String(S.score).padStart(6, '0'), this.font('Fredoka', 88, '#ffe64d')).setOrigin(.5), title = this.add.text(175, -72, 'JUNGLE RESTORED', this.font('Fredoka', 45, '#fff8e8')).setOrigin(.5), copy = this.add.text(175, 18, `${S.gems} gems  •  ${S.enemies} blockers\n5 flavour guardians defeated`, { ...this.font('Poppins', 18, '#fff8e8'), align: 'center', lineSpacing: 9 }).setOrigin(.5), button = this.add.rectangle(175, 155, 270, 68, C.red).setStrokeStyle(3, C.cream), label = this.add.text(175, 155, 'PLAY AGAIN', this.font('Poppins', 18, '#ffffff')).setOrigin(.5); panel.add([shade, halo, mascot, score, title, copy, button, label]); this.showAction('PLAY AGAIN', 975, 605, 270, 68, () => location.reload());
    }

    update(time) {
      if (!S.started || S.paused || S.finished || this.playerState === 'hurt') return;
      if (S.combo > 1 && time > S.comboUntil) S.combo = 1;
      const left = this.keys.left.isDown || this.keys.la.isDown || this.touch.left, right = this.keys.right.isDown || this.keys.ra.isDown || this.touch.right, up = this.keys.up.isDown || this.keys.ua.isDown || this.touch.up, down = this.keys.down.isDown || this.keys.da.isDown;
      const grounded = this.player.body.blocked.down || this.player.body.touching.down; if (grounded) this.lastGroundedAt = time;
      const ladder = this.ladders.find(zone => zone.contains(this.player.x, this.player.y));
      if (ladder && (up || down || this.climbing)) { this.climbing = true; this.player.body.allowGravity = false; this.player.x = Phaser.Math.Linear(this.player.x, ladder.centerX, .25); this.player.setVelocityY(up ? -260 : down ? 260 : 0).setVelocityX(0); this.player.setTexture('mascot-running').setAngle(Math.sin(time * .012) * 4); }
      else { this.climbing = false; this.player.body.allowGravity = true; this.player.setAngle(0); if (left && !right) { this.player.setAccelerationX(QA ? -3000 : -1900).setFlipX(true); if (grounded && time > this.dashingUntil) this.player.setTexture('mascot-running'); } else if (right && !left) { this.player.setAccelerationX(QA ? 3000 : 1900).setFlipX(false); if (grounded && time > this.dashingUntil) this.player.setTexture('mascot-running'); } else { this.player.setAccelerationX(0); if (grounded && time > this.dashingUntil) this.player.setTexture('mascot-main-mascot-clean'); } }
      this.playerState = grounded ? 'ground' : 'air';
      this.movers.children.iterate(mover => { if (!mover?.active) return; if (mover.x <= mover.getData('min')) mover.setVelocityX(Math.abs(mover.body.velocity.x)); if (mover.x >= mover.getData('max')) mover.setVelocityX(-Math.abs(mover.body.velocity.x)); });
      this.fruits.children.iterate(fruit => { if (!fruit?.active) return; const phase = time * .0015 + fruit.getData('phase'); fruit.x = fruit.getData('baseX') + Math.sin(phase) * fruit.getData('range'); fruit.y = fruit.getData('baseY') + Math.cos(phase * 1.3) * 16; fruit.angle = Math.sin(phase) * 10; });
      this.keysGroup.children.iterate(key => { if (key?.active) { const phase = time * .002 + key.getData('phase'); key.y = key.getData('baseY') + Math.sin(phase) * 17; key.angle = Math.sin(phase) * 8; } });
      this.gems.children.iterate(gem => { if (!gem?.active || gem.getData('bonus')) return; const phase = time * .0022 + gem.getData('phase'); gem.y = gem.getData('baseY') + Math.sin(phase) * 15; gem.angle += .7; });
      this.enemies.children.iterate(enemy => {
        if (!enemy?.active) return;
        const phase = time * enemy.getData('speed') + enemy.getData('phase'), type = enemy.getData('type');
        let x = enemy.getData('baseX') + Math.sin(phase) * enemy.getData('range'), y = enemy.getData('baseY') + Math.cos(phase * 1.5) * 8;
        if (type === 'hopper') y -= Math.abs(Math.sin(phase * 1.2)) * 105;
        if (type === 'sentry') { x = enemy.getData('baseX'); enemy.angle = Math.sin(phase * 2) * 4; }
        if (type === 'floater') y -= 55 + Math.sin(phase * 1.7) * 65;
        if (type === 'bubble') { x += Math.cos(phase * 1.4) * 42; y -= 45 + Math.sin(phase * 1.4) * 55; }
        if (type === 'charger' && Math.abs(this.player.x - enemy.x) < 520) x += Math.sign(this.player.x - enemy.x) * 145;
        if (type === 'hunter' && Math.abs(this.player.x - enemy.x) < 520) x += Math.sign(this.player.x - enemy.x) * 120;
        if (type === 'thorn') { y -= Math.abs(Math.sin(phase * 2)) * 55; enemy.angle = Math.sin(phase) * 12; }
        enemy.setPosition(x, y).setFlipX(Math.cos(phase) < 0);
      });
      this.spikes.children.iterate(hazard => {
        if (!hazard?.active) return;
        const phase = time * .002 + hazard.getData('phase'), theme = hazard.getData('theme');
        if (theme === 0) hazard.setScale(hazard.getData('baseScaleX') * (1 + Math.sin(phase) * .08), hazard.getData('baseScaleY') * (1 - Math.sin(phase) * .06));
        if (theme === 1) hazard.y = hazard.getData('baseY') + Math.max(0, Math.sin(phase * 1.5)) * 18;
        if (theme === 2) hazard.x = hazard.getData('baseX') + Math.sin(phase) * 38;
        if (theme === 3) hazard.setAlpha(.72 + Math.sin(phase * 2) * .28).setScale(hazard.getData('baseScaleX'), hazard.getData('baseScaleY') * (1 + Math.max(0, Math.sin(phase * 2)) * .22));
        if (theme === 4) hazard.setAngle(Math.sin(phase) * 7);
      });
      this.shots.children.iterate(shot => { if (shot?.active && (time - shot.getData('born') > 2200 || shot.x < -100 || shot.x > WORLD_W + 100)) shot.destroy(); });
      this.bossShots.children.iterate(shot => {
        if (!shot?.active) return;
        const type = shot.getData('type'), age = time - shot.getData('born');
        if (type === 'wave') shot.y = shot.getData('baseY') + Math.sin(time * .006 + shot.getData('phase')) * 24;
        if (type === 'bubble') { shot.y = shot.getData('baseY') + Math.sin(time * .004 + shot.getData('phase')) * 95; shot.angle += 1.2; }
        if (type === 'ember') { shot.setVelocityY(shot.body.velocity.y + 5); shot.angle += 4; }
        if (type === 'rain' || type === 'thorn') shot.angle += type === 'thorn' ? 5 : 2;
        if (age > 5200 || shot.y > H + 100) shot.destroy();
      });
      if (this.player.x > WORLD_W / 2 && this.checkpointX < WORLD_W / 2) { this.checkpointX = WORLD_W / 2 + 90; S.lives = Math.min(MAX_LIVES, S.lives + 1); this.sfx('key'); this.banner('CHECKPOINT  •  HEART RESTORED', C.mint); }
      if (this.player.y > 850) this.damage(this.player.x);
      if (!this.boss.getData('revealed') && this.player.x > WORLD_W - 1900) this.revealBoss();
      if (this.boss?.active && this.boss.getData('alive') && this.boss.getData('revealed')) {
        const awake = this.boss.getData('awake'), phase = time * (.0019 + S.level * .00016), baseX = this.boss.getData('baseX'), baseY = this.boss.getData('baseY');
        if (S.level === 0) { this.boss.x = baseX + Math.sin(phase) * (awake ? 72 : 20); this.boss.y = baseY + Math.cos(phase * 1.4) * 22; }
        if (S.level === 1) { this.boss.x = baseX + Math.sign(Math.sin(phase)) * (awake ? 52 : 10); this.boss.y = baseY - Math.abs(Math.sin(phase * 1.2)) * (awake ? 70 : 14); }
        if (S.level === 2) { this.boss.x = baseX + Math.sin(phase) * (awake ? 105 : 24); this.boss.y = baseY + Math.cos(phase) * (awake ? 65 : 18); }
        if (S.level === 3) { this.boss.x = baseX + Math.sin(phase * 1.3) * (awake ? 95 : 18); this.boss.y = baseY - Math.abs(Math.sin(phase * 1.6)) * (awake ? 92 : 16); }
        if (S.level === 4) { this.boss.x = baseX + Math.sin(phase * 1.7) * (awake ? 132 : 22); this.boss.y = baseY + Math.sin(phase * 2.1) * (awake ? 34 : 14); }
      }
      this.bossAttack(time); this.updateHud();
    }
  }

  const config = {
    type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#0d4e48',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 1550 }, debug: false } },
    scene: [JungleQuest], render: { antialias: true, pixelArt: false }
  };
  const launch = () => new Phaser.Game(config);
  if (document.fonts?.ready) document.fonts.ready.then(launch); else launch();
})();
