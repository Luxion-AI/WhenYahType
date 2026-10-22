// Script to generate Yah-chan pixel art SVG sprites
import fs from 'fs';
import path from 'path';

const PALETTE = {
  _: 'transparent',
  K: '#0b0d16', // Outline dark navy
  H: '#ffd84d', // Hair gold
  h: '#d4a017', // Hair shadow
  L: '#fff2a8', // Hair highlight
  S: '#ffe4c4', // Skin peach
  s: '#e2b992', // Skin shadow
  B: '#ff7aa8', // Blush pink
  P: '#ff4f9a', // Character pink
  p: '#b81d60', // Pink shadow
  C: '#37e7e7', // Electric cyan
  c: '#8affff', // Cyan light
  W: '#f5f3e8', // Primary white
  U: '#1b2032', // Uniform navy
  u: '#121524', // Navy shadow
  E: '#090b14', // Eye dark
  e: '#ffffff', // Eye highlight
  G: '#ffc83b', // Gold emblem
  D: '#00d2ff', // Blue sweatdrop
  T: '#ffe66d', // Star / Trophy
  V: '#b5a5ff', // Soft lavender
  R: '#ff657a', // Red error/pout
};

function gridToSvg(rows, title, extras = '') {
  const pixelSize = 10;
  const width = 32 * pixelSize;
  const height = 32 * pixelSize;

  let rects = '';
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      const color = PALETTE[char];
      if (color && color !== 'transparent') {
        rects += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />\n`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">
  <title>${title}</title>
  <!-- Background glow subtle disc -->
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#37e7e7" stop-opacity="0.18" />
      <stop offset="60%" stop-color="#ff4f9a" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#0b0d16" stop-opacity="0" />
    </radialGradient>
  </defs>
  <circle cx="160" cy="160" r="140" fill="url(#bgGlow)" />
  ${extras}
  <!-- Pixel Character Body -->
  <g class="character-pixels">
${rects}  </g>
</svg>`;
}

// 1. IDLE SPRITE (Warm smile, cute twin tails, headset antenna, ready pose)
const IDLE_ROWS = [
  "________________________________", // 0
  "_________KKKKKKKKKK_____________", // 1
  "_______KKCCCCCCCCCKKK___________", // 2 Headset band
  "______KCcLLLLLLLLHccK___________", // 3
  "_____KCcLHHHHHHHHHhcK___KK______", // 4 Antenna top
  "____KCcLHHHHHHHHHHHhcKKKPcK_____", // 5
  "____KCLHHHHKKKKKKHHhcK_KKPccK___", // 6
  "___KCLHHHKKKSSSSKKHHhcK_KPccK___", // 7
  "___KCLHHKSSSSSSSSKHHhcK__KKK____", // 8
  "__KCLLHKSSBSSSSBSSKHhcK_________", // 9
  "__KCLHHKSEeSKKSEeSKHhcK_________", // 10 Eyes open & clear
  "__KCLHHKSEESKKSEESKHhcK_________", // 11
  "__KCLHHKSSSSKKSSSSKHhcK_________", // 12
  "__KCLHHKSSSBPPBSSSKHhcK_________", // 13 Cute smile
  "___KCLHHKSSSSSSSSKHhcK__________", // 14
  "___KCLHHKKSSSSSSKKHhcK__________", // 15
  "____KCLHHHKKKKKKHHhcK___________", // 16
  "_____KCcLLHHHHHHHhcK____________", // 17
  "______KKCcLLLLLLccK_____________", // 18
  "________KKKCCCCKKK______________", // 19 Collar
  "_________KPPUUPPK_______________", // 20 Uniform chest
  "________KPUWWWWUPK______________", // 21
  "_______KPUWGGGGWUPK_____________", // 22 YAH badge
  "______KSSUWWWWWWUSSK____________", // 23 Hands on hip
  "______KSSUUUUUUUUSSK____________", // 24
  "_______KKUUUPPUUUKK_____________", // 25 Skirt belt
  "________KPUPPUPPK_______________", // 26 Skirt
  "________KPPUPPUPK_______________", // 27
  "_________KKKKKKK________________", // 28
  "________KSSKKKSSK_______________", // 29 Legs
  "________KSSK_KSSK_______________", // 30
  "________KWWK_KWWK_______________", // 31 Boots
];

// Let's refine the pixel layout for full 32x32 character sprites with hair twin-tails, headset ear-cups and clear expressive face:
const SPRITES = {
  idle: {
    title: 'Yah-chan Arcade Idle',
    extras: `
      <!-- Decorative pixel stars -->
      <rect x="30" y="50" width="8" height="8" fill="#ffd84d" opacity="0.8" />
      <rect x="270" y="80" width="8" height="8" fill="#37e7e7" opacity="0.8" />
      <rect x="250" y="240" width="10" height="10" fill="#ff4f9a" opacity="0.7" />
      <rect x="40" y="220" width="6" height="6" fill="#b5a5ff" opacity="0.8" />
    `,
    rows: [
      "__________KKKKKK________________", // 0
      "________KKLLLLLLKK______________", // 1
      "_______KLLHHHHHHLLK____KK_______", // 2 Antenna tip
      "______KLHHHHHHHHHHLLK_KPPK______", // 3
      "___KKKLHHHHHHHHHHHHLLK_KCCK_____", // 4 Headset antenna
      "__KCcKLLHHHHHHHHHHLLCcK_KCcK____", // 5
      "__KCcKLHHHKKKKKKKHLLCcK__KK_____", // 6
      "_KCCcKLHHKKKSSKKKKHLLCcK________", // 7
      "_KCCcKLHHKSSSSSSSKHLLCcK________", // 8
      "_KCcKKLHKSBSSSSBSKHLLCcK________", // 9 Blush
      "_KK_KLLHKSeESKKSeESKHLLK__KK____", // 10 Big shining eyes
      "____KLLHKSEESKKSEESKHLLKKKHLK___", // 11
      "___KKLLHKSBSSSSSSBSSKHLLLHLLK___", // 12
      "__KHLLLHKSKKKPPKKKSSKHLLLHLLK___", // 13 Sweet smile
      "__KHHHLLHKSSSSSSSSKKHLLLLHLK____", // 14
      "__KHHHHHLLKKSSSSKKLLLLLLLLK_____", // 15
      "___KHHHHHHHLLLLLLLLHHHHHHK______", // 16 Ponytail left / right
      "____KKHHHHHHHHHHHHHHHHHKK_______", // 17
      "______KKKPPPWWWWPPPKKK__________", // 18 Collar & ribbon
      "_______KPUUWWWWUUPK_____________", // 19
      "______KSSUUGGGGUUSSK____________", // 20 Hands cheering
      "______KSSUWWWWWWUSSK____________", // 21
      "______KSSUUUUUUUUSSK____________", // 22
      "_______KKUUUPPUUUKK_____________", // 23
      "________KPPUPPUPPK______________", // 24 Pleated skirt
      "_______KPPPPPPPPPPK_____________", // 25
      "________KKKKKKKKKK______________", // 26
      "________KSSSSSSSSK______________", // 27 Socks/Legs
      "________KSSSSSSSSK______________", // 28
      "________KWWKKKKWWK______________", // 29 Cyber boots
      "________KWWK__KWWK______________", // 30
      "________KKKK__KKKK______________", // 31
    ]
  },
  cheer: {
    title: 'Yah-chan Cheering Pose',
    extras: `
      <!-- Cheer energy lines and sparks -->
      <rect x="20" y="20" width="12" height="12" fill="#ffd84d" />
      <rect x="280" y="30" width="14" height="14" fill="#ffd84d" />
      <rect x="50" y="80" width="8" height="8" fill="#ff4f9a" />
      <rect x="250" y="90" width="10" height="10" fill="#37e7e7" />
      <polygon points="30,120 10,140 20,160 5,190" fill="#ffd84d" opacity="0.6" />
      <polygon points="290,120 310,140 300,160 315,190" fill="#37e7e7" opacity="0.6" />
    `,
    rows: [
      "__KK________________________KK__", // 0 Pompoms / sparklers
      "_KTcTK____KKKKKK__________KTcTK_", // 1
      "KTcccTK_KKLLLLLLKK_______KTcccTK", // 2 Sparkler glow
      "_KTcTK_KLLHHHHHHLLK_KK____KTcTK_", // 3
      "__KK__KLHHHHHHHHHHLLKPPK____KK__", // 4
      "_____KLHHHHHHHHHHHHLLKCcK_______", // 5
      "____KCcLLHHHHHHHHHHLLCcK________", // 6 Headset
      "____KCcKLHHHKKKKKKKHLLCcK_______", // 7
      "___KCCcKLHHKKKSSKKKKHLLCcK______", // 8
      "___KCCcKLHKSBBSSBBSSKHLLCcK_____", // 9 Cheerful blush
      "___KCcKKLHKTSeKKTSeKKHLLCcK_____", // 10 Star sparkles in eyes
      "___KK_KLLHKTSeKKTSeKKHLLK_______", // 11
      "______KLLHKSBSSSSSSBSKHLLKKK____", // 12
      "_____KKLLHKSSSKPPKSSSKHLLLHLLK__", // 13 Open joyful cheering mouth
      "____KHLLLLHKSSKPWWPKKHLLLLHLLK__", // 14
      "____KHHHHHLLKKSSSSKKLLLLLLLLK___", // 15
      "____KKHHHHHHLLLLLLLLHHHHHHK_____", // 16
      "___KSSKHHHHHHHHHHHHHHHHHKKSSK___", // 17 Raised cheer arms
      "___KSSKKKPPPWWWWPPPKKK__KSSK____", // 18
      "____KK_KPUUWWWWUUPK______KK_____", // 19
      "______KSSUUGGGGUUSSK____________", // 20
      "______KSSUWWWWWWUSSK____________", // 21
      "_______KKUUUUUUUUKK_____________", // 22
      "________KUUUPPUUUK______________", // 23
      "_______KPPUPPUPPK_______________", // 24 Jumping skirt
      "______KPPPPPPPPPPK______________", // 25
      "_______KKKKKKKKKK_______________", // 26
      "_______KSSKKKKSSK_______________", // 27 Dynamic jump pose
      "_______KSSK__KSSK_______________", // 28
      "______KWWK____KWWK______________", // 29
      "______KWWK____KWWK______________", // 30
      "______KKKK____KKKK______________", // 31
    ]
  },
  panic: {
    title: 'Yah-chan Panic Typo Pose',
    extras: `
      <!-- Panic blue sweat drops & zig-zags -->
      <path d="M40,70 Q50,50 60,70 Q60,85 50,85 Q40,85 40,70 Z" fill="#00d2ff" />
      <path d="M260,60 Q270,40 280,60 Q280,75 270,75 Q260,75 260,60 Z" fill="#00d2ff" />
      <rect x="70" y="40" width="8" height="8" fill="#37e7e7" />
      <rect x="230" y="30" width="8" height="8" fill="#37e7e7" />
    `,
    rows: [
      "__________KKKKKK________________", // 0
      "________KKLLLLLLKK______________", // 1
      "_______KLLHHHHHHLLK____KK_______", // 2
      "______KLHHHHHHHHHHLLK_KPPK______", // 3
      "___KKKLHHHHHHHHHHHHLLK_KCcK_____", // 4
      "__KCcKLLHHHHHHHHHHLLCcK_KCcK____", // 5
      "__KCcKLHHHKKKKKKKHLLCcK__KK_____", // 6
      "_KCCcKLHHKKKSSKKKKHLLCcK________", // 7
      "_KCCcKLHHKSSSSSSSKHLLCcK________", // 8
      "_KCcKKLHKSBBRRSBBRSKHLLCcK______", // 9 Heavy red blush
      "_KK_KLLHKKRRKSSKRRKKHLLK__KK____", // 10 Flustered anime > < eyes
      "____KLLHKSRRKSKSRRKKHLLKKKHLK___", // 11
      "___KKLLHKKRRKSSKRRKKHLLLHLLK____", // 12
      "__KHLLLHKSBBSSSSBBSSKHLLLHLLK___", // 13
      "__KHHHLLHKSSSKRRKSSSKHLLLLHLK___", // 14 Wavy flustered mouth
      "__KHHHHHLLKKSRRRSKKLLLLLLLLK____", // 15
      "___KHHHHHHHLLLLLLLLHHHHHHK______", // 16
      "___KSSKHHHHHHHHHHHHHHHKSSK______", // 17 Hands clutching cheeks in panic
      "___KSSKKKPPPWWWWPPPKKKKSSK______", // 18
      "____KK_KPUUWWWWUUPK___KK________", // 19
      "_______KPUUGGGGUUPK_____________", // 20
      "______KSSUWWWWWWUSSK____________", // 21
      "______KSSUUUUUUUUSSK____________", // 22
      "_______KKUUUPPUUUKK_____________", // 23
      "________KPPUPPUPPK______________", // 24
      "_______KPPPPPPPPPPK_____________", // 25
      "________KKKKKKKKKK______________", // 26
      "________KSSKKKKSSK______________", // 27 Pout stance
      "________KSSK__KSSK______________", // 28
      "________KWWK__KWWK______________", // 29
      "________KWWK__KWWK______________", // 30
      "________KKKK__KKKK______________", // 31
    ]
  },
  victory: {
    title: 'Yah-chan Victory Trophy Pose',
    extras: `
      <!-- Confetti & Victory Star Radiance -->
      <polygon points="160,5 170,25 190,25 175,40 180,60 160,48 140,60 145,40 130,25 150,25" fill="#ffd84d" />
      <rect x="25" y="45" width="10" height="10" fill="#ffd84d" />
      <rect x="275" y="45" width="10" height="10" fill="#ff4f9a" />
      <rect x="40" y="100" width="8" height="8" fill="#37e7e7" />
      <rect x="260" y="110" width="8" height="8" fill="#76f0ad" />
      <rect x="30" y="240" width="10" height="10" fill="#b5a5ff" />
      <rect x="280" y="230" width="10" height="10" fill="#ffd84d" />
    `,
    rows: [
      "__________KKKKKK________________", // 0
      "________KKLLLLLLKK______________", // 1
      "_______KLLHHHHHHLLK____KK_______", // 2
      "______KLHHHHHHHHHHLLK_KPPK______", // 3
      "___KKKLHHHHHHHHHHHHLLK_KCcK_____", // 4
      "__KCcKLLHHHHHHHHHHLLCcK_KCcK____", // 5
      "__KCcKLHHHKKKKKKKHLLCcK__KK_____", // 6
      "_KCCcKLHHKKKSSKKKKHLLCcK__KK____", // 7
      "_KCCcKLHHKSSSSSSSKHLLCcK_KTTK___", // 8 Golden trophy cup
      "_KCcKKLHKSBSSSSBSKHLLCcKKTTTTK__", // 9
      "_KK_KLLHKSeESKKSeESKHLLKKGTTGK__", // 10 Radiant proud wink / joy
      "____KLLHKSEESKKSEESKHLLK_KTTK___", // 11
      "___KKLLHKSBSSSSSSBSSKHLLK_KGK___", // 12
      "__KHLLLHKSKKSPPKKKSSKHLLKKTTK___", // 13 Big proud smile
      "__KHHHLLHKSSSKKSSSKKHLLLLHLK____", // 14
      "__KHHHHHLLKKSSSSKKLLLLLLLLK_____", // 15
      "___KHHHHHHHLLLLLLLLHHHHHHK______", // 16
      "__KSSKHHHHHHHHHHHHHHHHHKSSK_____", // 17 Holding trophy high
      "__KSSKKKKPPPWWWWPPPKKK_KSSK_____", // 18
      "___KK__KPUUWWWWUUPK_____KK______", // 19
      "______KSSUUGGGGUUSSK____________", // 20
      "______KSSUWWWWWWUSSK____________", // 21
      "______KSSUUUUUUUUSSK____________", // 22
      "_______KKUUUPPUUUKK_____________", // 23
      "________KPPUPPUPPK______________", // 24
      "_______KPPPPPPPPPPK_____________", // 25
      "________KKKKKKKKKK______________", // 26
      "________KSSKKKKSSK______________", // 27
      "________KSSK__KSSK______________", // 28
      "________KWWK__KWWK______________", // 29
      "________KWWK__KWWK______________", // 30
      "________KKKK__KKKK______________", // 31
    ]
  }
};

const outDir = path.resolve('public/assets/character');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const [key, cfg] of Object.entries(SPRITES)) {
  const filePath = path.join(outDir, `yah-chan-${key}.svg`);
  const svg = gridToSvg(cfg.rows, cfg.title, cfg.extras);
  fs.writeFileSync(filePath, svg, 'utf-8');
  console.log(`Generated ${filePath}`);
}
