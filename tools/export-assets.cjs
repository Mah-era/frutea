const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const previewDir = path.join(assets, 'previews');
const pngDir = path.join(previewDir, 'png');
const modelDir = path.join(assets, 'products', 'v2', 'obj-prototypes');
const mp4Dir = path.join(previewDir, 'mp4');

for (const dir of [pngDir, modelDir, mp4Dir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const sections = [
  ['hero', '#hero'],
  ['flavours', '#flavours'],
  ['hot-cold', '#hotcold'],
  ['low-sugar', '#low-sugar'],
  ['collection', '#collection'],
  ['cta', '#cta']
];

function writeBoxObj(name, width, height, depth, color) {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  const obj = [
    `mtllib ${name}.mtl`,
    `o ${name}`,
    `v ${-x} ${-y} ${z}`,
    `v ${x} ${-y} ${z}`,
    `v ${x} ${y} ${z}`,
    `v ${-x} ${y} ${z}`,
    `v ${-x} ${-y} ${-z}`,
    `v ${x} ${-y} ${-z}`,
    `v ${x} ${y} ${-z}`,
    `v ${-x} ${y} ${-z}`,
    'vt 0 0',
    'vt 1 0',
    'vt 1 1',
    'vt 0 1',
    'vn 0 0 1',
    'vn 0 0 -1',
    'vn 0 1 0',
    'vn 0 -1 0',
    'vn 1 0 0',
    'vn -1 0 0',
    'usemtl frutea_material',
    'f 1/1/1 2/2/1 3/3/1 4/4/1',
    'f 6/1/2 5/2/2 8/3/2 7/4/2',
    'f 4/1/3 3/2/3 7/3/3 8/4/3',
    'f 5/1/4 6/2/4 2/3/4 1/4/4',
    'f 2/1/5 6/2/5 7/3/5 3/4/5',
    'f 5/1/6 1/2/6 4/3/6 8/4/6',
    ''
  ].join('\n');
  const rgb = color.match(/[0-9a-f]{2}/gi).map(v => parseInt(v, 16) / 255);
  const mtl = [
    'newmtl frutea_material',
    `Kd ${rgb.map(v => v.toFixed(4)).join(' ')}`,
    'Ks 0.1800 0.1600 0.1200',
    'Ns 28',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(modelDir, `${name}.obj`), obj);
  fs.writeFileSync(path.join(modelDir, `${name}.mtl`), mtl);
}

function writeReadme() {
  const readme = `# FruTea Website Previews

Generated from the current single-file HTML project without changing \`index.html\`.

- \`assets/previews/png/\`: still captures of the main visual sections.
- \`assets/previews/mp4/\`: short motion clips built from the PNG captures.
- \`assets/products/v2/obj-prototypes/\`: simple portable OBJ product forms.
`;
  fs.writeFileSync(path.join(previewDir, 'README.md'), readme);
}

function makeMp4(name, imagePath) {
  const out = path.join(mp4Dir, `${name}.mp4`);
  execFileSync('ffmpeg', [
    '-y',
    '-loop', '1',
    '-i', imagePath,
    '-t', '4',
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z=\'min(zoom+0.0009,1.08)\':d=100:s=1920x1080:fps=25,format=yuv420p',
    '-an',
    '-movflags', '+faststart',
    out
  ], { stdio: 'ignore' });
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto(`file://${path.join(root, 'index.html')}`, { waitUntil: 'commit' });
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(3500);

  for (const [name, selector] of sections) {
    await page.evaluate((selector) => {
      document.querySelector(selector)?.scrollIntoView({ block: 'start', inline: 'nearest' });
    }, selector);
    await page.waitForTimeout(900);
    const imagePath = path.join(pngDir, `${name}.png`);
    await page.screenshot({ path: imagePath, animations: 'disabled', timeout: 60000 });
    makeMp4(name, imagePath);
  }

  await browser.close();

  writeBoxObj('frutea-single-sachet', 0.48, 2.6, 0.08, '#FFF04D');
  writeBoxObj('frutea-mix-pack-box', 1.9, 1.25, 0.55, '#8FE59A');
  writeBoxObj('frutea-low-sugar-box', 1.65, 2.1, 0.44, '#42B878');
  writeBoxObj('frutea-serving-glass', 0.82, 1.55, 0.82, '#8FE1F5');
  writeReadme();
})();
