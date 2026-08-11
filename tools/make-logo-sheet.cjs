const fs = require('fs');
const path = require('path');
const sharp = require('/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { PNG } = require('/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');

const root = path.resolve(__dirname, '..');
const logoPath = path.join(root, 'assets/logo/logo-main.png');
const referencePath = '/var/folders/pg/w8dyn4s94771fqghwk36mt340000gn/T/codex-clipboard-9c18d31c-db17-421b-a594-6dbb6de30907.png';
const outPath = path.join(root, 'assets/logo/frutea-logo-versions-preview.png');

const BRAND = {
  wine: '#57001E',
  red: '#E8143E',
  cream: '#FFF9EE',
  yellow: '#FFF04D',
  mint: '#8FE59A',
  sky: '#8FE1F5',
  ink: '#2A0A16'
};

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function dataUri(buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function cleanLogo(input) {
  const png = PNG.sync.read(input);
  const background = new Uint8Array(png.width * png.height);
  const stack = [];
  const isLightBackground = id => {
    const i = id * 4;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    return Math.max(r, g, b) > 178 && Math.max(r, g, b) - Math.min(r, g, b) < 72;
  };
  for (let x = 0; x < png.width; x++) stack.push(x, (png.height - 1) * png.width + x);
  for (let y = 0; y < png.height; y++) stack.push(y * png.width, y * png.width + png.width - 1);
  while (stack.length) {
    const id = stack.pop();
    if (background[id] || !isLightBackground(id)) continue;
    background[id] = 1;
    const x = id % png.width;
    const y = Math.floor(id / png.width);
    if (x > 0) stack.push(id - 1);
    if (x + 1 < png.width) stack.push(id + 1);
    if (y > 0) stack.push(id - png.width);
    if (y + 1 < png.height) stack.push(id + png.width);
  }
  const enclosedSeen = background.slice();
  for (let start = 0; start < png.width * png.height; start++) {
    if (enclosedSeen[start] || !isLightBackground(start)) continue;
    const component = [];
    const pending = [start];
    enclosedSeen[start] = 1;
    while (pending.length) {
      const id = pending.pop();
      component.push(id);
      const x = id % png.width;
      const y = Math.floor(id / png.width);
      for (const next of [x > 0 ? id - 1 : -1, x + 1 < png.width ? id + 1 : -1, y > 0 ? id - png.width : -1, y + 1 < png.height ? id + png.width : -1]) {
        if (next >= 0 && !enclosedSeen[next] && isLightBackground(next)) {
          enclosedSeen[next] = 1;
          pending.push(next);
        }
      }
    }
    if (component.length > 50) component.forEach(id => { background[id] = 1; });
  }
  let minX = png.width;
  let minY = png.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) * 4;
      const isBackground = background[y * png.width + x] === 1;
      png.data[i + 3] = isBackground ? 0 : 255;
      if (!isBackground) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const margin = 28;
  const bbox = {
    left: Math.max(0, minX - margin),
    top: Math.max(0, minY - margin),
    width: Math.min(png.width - Math.max(0, minX - margin), maxX - minX + margin * 2),
    height: Math.min(png.height - Math.max(0, minY - margin), maxY - minY + margin * 2)
  };

  return { buffer: PNG.sync.write(png), bbox };
}

function removeLightBackground(input) {
  const png = PNG.sync.read(input);
  const background = new Uint8Array(png.width * png.height);
  const stack = [];
  const isBackground = id => {
    const i = id * 4;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    return Math.max(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 65;
  };
  for (let x = 0; x < png.width; x++) stack.push(x, (png.height - 1) * png.width + x);
  for (let y = 0; y < png.height; y++) stack.push(y * png.width, y * png.width + png.width - 1);
  while (stack.length) {
    const id = stack.pop();
    if (background[id] || !isBackground(id)) continue;
    background[id] = 1;
    const x = id % png.width;
    const y = Math.floor(id / png.width);
    if (x > 0) stack.push(id - 1);
    if (x + 1 < png.width) stack.push(id + 1);
    if (y > 0) stack.push(id - png.width);
    if (y + 1 < png.height) stack.push(id + png.width);
  }
  const enclosedSeen = background.slice();
  for (let start = 0; start < png.width * png.height; start++) {
    if (enclosedSeen[start] || !isBackground(start)) continue;
    const component = [];
    const pending = [start];
    enclosedSeen[start] = 1;
    while (pending.length) {
      const id = pending.pop();
      component.push(id);
      const x = id % png.width;
      const y = Math.floor(id / png.width);
      for (const next of [x > 0 ? id - 1 : -1, x + 1 < png.width ? id + 1 : -1, y > 0 ? id - png.width : -1, y + 1 < png.height ? id + png.width : -1]) {
        if (next >= 0 && !enclosedSeen[next] && isBackground(next)) {
          enclosedSeen[next] = 1;
          pending.push(next);
        }
      }
    }
    if (component.length >= 30 && component.length <= 1000) component.forEach(id => { background[id] = 1; });
  }
  for (let id = 0; id < png.width * png.height; id++) png.data[id * 4 + 3] = background[id] ? 0 : 255;
  return PNG.sync.write(png);
}

function extractLetterComponent(input, order) {
  const png = PNG.sync.read(input);
  const seen = new Uint8Array(png.width * png.height);
  const components = [];
  const isInk = id => {
    const i = id * 4;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    return Math.min(r, g, b) < 245 && Math.max(r, g, b) - Math.min(r, g, b) > 8;
  };

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const start = y * png.width + x;
      if (seen[start] || !isInk(start)) continue;
      const stack = [start];
      const pixels = [];
      seen[start] = 1;
      let minX = x;
      while (stack.length) {
        const id = stack.pop();
        const px = id % png.width;
        const py = Math.floor(id / png.width);
        pixels.push(id);
        minX = Math.min(minX, px);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= png.width || ny >= png.height) continue;
          const next = ny * png.width + nx;
          if (!seen[next] && isInk(next)) {
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
      if (pixels.length > 500) components.push({ minX, pixels });
    }
  }

  components.sort((a, b) => a.minX - b.minX);
  const keep = new Set(components[order].pixels);
  for (let id = 0; id < png.width * png.height; id++) {
    png.data[id * 4 + 3] = keep.has(id) ? 255 : 0;
  }
  return PNG.sync.write(png);
}

function extractConnectedAt(input, seedX, seedY) {
  const png = PNG.sync.read(input);
  const start = seedY * png.width + seedX;
  const seen = new Uint8Array(png.width * png.height);
  const stack = [start];
  seen[start] = 1;
  while (stack.length) {
    const id = stack.pop();
    const x = id % png.width;
    const y = Math.floor(id / png.width);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= png.width || ny >= png.height) continue;
      const next = ny * png.width + nx;
      if (!seen[next] && png.data[next * 4 + 3] > 0) {
        seen[next] = 1;
        stack.push(next);
      }
    }
  }
  for (let id = 0; id < png.width * png.height; id++) {
    if (!seen[id]) png.data[id * 4 + 3] = 0;
  }
  return PNG.sync.write(png);
}

async function crop(buffer, extract, width) {
  return sharp(buffer).extract(extract).resize({ width, withoutEnlargement: true }).png().toBuffer();
}

async function resize(buffer, width, height) {
  return sharp(buffer).resize({ width, height, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
}

async function silhouette(buffer, color, width) {
  const resized = await sharp(buffer).resize({ width, withoutEnlargement: true }).ensureAlpha().png().toBuffer();
  const png = PNG.sync.read(resized);
  const rgb = color.match(/[0-9a-f]{2}/gi).map(v => parseInt(v, 16));
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] > 0) {
      png.data[i] = rgb[0];
      png.data[i + 1] = rgb[1];
      png.data[i + 2] = rgb[2];
    }
  }
  return PNG.sync.write(png);
}

async function grayscale(buffer, width) {
  return sharp(buffer).grayscale().resize({ width, withoutEnlargement: true }).png().toBuffer();
}

function imageTag(uri, x, y, w, h) {
  return `<image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

function textLines(lines, x, y, size, fill, weight = 600) {
  return lines
    .map((line, i) => `<text x="${x}" y="${y + i * (size + 8)}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(line)}</text>`)
    .join('');
}

function cell({ x, y, title, use, feature, art, dark = false, accent = BRAND.red }) {
  const bg = dark ? BRAND.wine : '#FFFFFF';
  const border = dark ? 'rgba(255,255,255,.28)' : 'rgba(87,0,30,.18)';
  const titleColor = dark ? '#FFFFFF' : BRAND.wine;
  const bodyColor = dark ? 'rgba(255,255,255,.78)' : '#7D2940';
  return `
    <g>
      <rect x="${x}" y="${y}" width="500" height="330" rx="16" fill="${bg}" stroke="${border}" stroke-width="2"/>
      <rect x="${x + 22}" y="${y + 20}" width="456" height="174" rx="12" fill="${dark ? 'rgba(255,255,255,.08)' : BRAND.cream}"/>
      <circle cx="${x + 455}" cy="${y + 48}" r="10" fill="${accent}"/>
      ${art(x + 36, y + 34, 428, 145)}
      <text x="${x + 24}" y="${y + 235}" font-size="24" font-weight="800" fill="${titleColor}">${escapeXml(title)}</text>
      ${textLines([use], x + 24, y + 267, 14, bodyColor, 600)}
      ${textLines([feature], x + 24, y + 296, 12, bodyColor, 500)}
    </g>`;
}

(async () => {
  const original = fs.readFileSync(logoPath);
  const { buffer: transparent, bbox } = cleanLogo(original);
  const full = await crop(transparent, bbox, 360);
  const reference = fs.readFileSync(referencePath);
  const symbolCrop = await sharp(reference).extract({ left: 78, top: 596, width: 345, height: 190 }).png().toBuffer();
  const wordmarkCrop = await sharp(reference).extract({ left: 447, top: 603, width: 390, height: 180 }).png().toBuffer();
  const symbol = await sharp(removeLightBackground(symbolCrop)).trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } }).resize({ width: 250 }).png().toBuffer();
  const wordmark = await sharp(removeLightBackground(wordmarkCrop)).trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } }).resize({ width: 340 }).png().toBuffer();
  const letterF = await sharp(extractConnectedAt(transparent, 160, 700)).trim().resize({ height: 130 }).png().toBuffer();
  const letterT = await sharp(extractConnectedAt(transparent, 700, 700)).trim().resize({ height: 117 }).png().toBuffer();
  const fullSmall = await resize(full, 260, 150);
  const symbolSmall = await resize(symbol, 150, 150);
  const wordSmall = await resize(wordmark, 300, 120);
  const wine = await silhouette(full, BRAND.wine, 300);
  const black = await silhouette(full, '#111111', 300);
  const white = await silhouette(full, '#FFFFFF', 300);
  const gray = await grayscale(full, 300);
  const markWine = await silhouette(symbol, BRAND.wine, 150);
  const markWhite = await silhouette(symbol, '#FFFFFF', 150);

  const img = {
    full: dataUri(fullSmall),
    fullLarge: dataUri(full),
    symbol: dataUri(symbolSmall),
    wordmark: dataUri(wordSmall),
    wine: dataUri(wine),
    black: dataUri(black),
    white: dataUri(white),
    gray: dataUri(gray),
    markWine: dataUri(markWine),
    markWhite: dataUri(markWhite),
    letterF: dataUri(letterF),
    letterT: dataUri(letterT)
  };

  const monogram = (x, y, w, h) => `
    <g transform="translate(${x + w / 2 - 87} ${y + h / 2 - 65})">
      ${imageTag(img.letterF, 0, 0, 92, 130)}
      ${imageTag(img.letterT, 70, 22, 104, 117)}
    </g>`;

  const appIcon = (x, y, w, h) => `
    <g transform="translate(${x + w / 2 - 74} ${y + h / 2 - 74})">
      <rect x="0" y="0" width="148" height="148" rx="34" fill="${BRAND.cream}" stroke="${BRAND.wine}" stroke-width="5"/>
      ${imageTag(img.symbol, 24, 22, 100, 100)}
    </g>`;

  const seal = (x, y, w, h) => `
    <g transform="translate(${x + w / 2} ${y + h / 2})">
      <circle r="72" fill="${BRAND.yellow}" stroke="${BRAND.wine}" stroke-width="5"/>
      <circle r="50" fill="${BRAND.cream}" stroke="${BRAND.red}" stroke-width="3"/>
      ${imageTag(img.markWine, -38, -40, 76, 76)}
      <text y="60" text-anchor="middle" font-size="13" font-weight="800" fill="${BRAND.wine}">FRUTEA</text>
    </g>`;

  const responsive = (x, y, w, h) => `
    ${imageTag(img.full, x, y + 18, 145, 90)}
    <text x="${x + 172}" y="${y + 72}" font-size="44" font-weight="900" fill="${BRAND.wine}" font-family="Arial Black, Poppins, sans-serif">→</text>
    ${imageTag(img.wordmark, x + 230, y + 30, 116, 70)}
    <text x="${x + 362}" y="${y + 72}" font-size="44" font-weight="900" fill="${BRAND.wine}" font-family="Arial Black, Poppins, sans-serif">→</text>
    ${imageTag(img.symbol, x + 414, y + 18, 72, 72)}`;

  const variants = [
    ['Primary Logo', 'Website header, packaging front, ads', 'Complete official logo with symbol and brand name', (x, y, w, h) => imageTag(img.full, x + 48, y, w - 96, h)],
    ['Secondary Logo', 'Social banners, footers, merchandise', 'Compact master composition with the approved cup-to-T overlap', (x, y, w, h) => imageTag(img.full, x + 84, y + 4, w - 168, h - 8)],
    ['Logo Mark / Symbol', 'App icon, seal, favicon, stickers', 'Cup, fruit slice and leaf symbol without wordmark', (x, y, w, h) => imageTag(img.symbol, x + 96, y - 6, 236, h + 12)],
    ['Wordmark', 'Documents, navigation, storefronts', 'FruTea name only in the distinctive display style', (x, y, w, h) => imageTag(img.wordmark, x + 36, y + 30, w - 72, h - 60)],
    ['Lettermark / Monogram', 'Small spaces, clothing, profile icons', 'FT initials for compact brand recognition', (x, y, w, h) => monogram(x, y, w, h)],
    ['Logo with Tagline', 'Not part of the approved identity system', 'Not applicable — FruTea has no approved tagline', (x, y, w, h) => `<g opacity=".42">${imageTag(img.full, x + 80, y - 8, w - 160, h - 16)}</g><line x1="${x + 88}" y1="${y + 18}" x2="${x + w - 88}" y2="${y + h - 18}" stroke="${BRAND.red}" stroke-width="8"/><text x="${x + w / 2}" y="${y + h - 4}" text-anchor="middle" font-size="15" font-weight="800" fill="${BRAND.wine}">NOT USED</text>`],
    ['Logo without Tagline', 'Small packaging, social, mobile screens', 'Official logo without slogan for readability', (x, y, w, h) => imageTag(img.full, x + 54, y, w - 108, h)],
    ['Full-Colour Logo', 'Main website, print, packaging, brochures', 'Uses official red, wine, green and cream palette', (x, y, w, h) => imageTag(img.full, x + 48, y, w - 96, h)],
    ['Single-Colour Logo', 'Stamps, embroidery, invoices, merch', `One approved brand colour: ${BRAND.wine}`, (x, y, w, h) => imageTag(img.wine, x + 60, y, w - 120, h)],
    ['Black Logo', 'Formal documents and photocopies', 'Solid black for maximum contrast on light surfaces', (x, y, w, h) => imageTag(img.black, x + 60, y, w - 120, h)],
    ['White / Reverse Logo', 'Dark backgrounds and video overlays', 'Solid white for contrast on wine or photo backgrounds', (x, y, w, h) => imageTag(img.white, x + 60, y, w - 120, h), true],
    ['Grayscale Logo', 'Black-and-white printing', 'Grey treatment preserving hierarchy', (x, y, w, h) => imageTag(img.gray, x + 60, y, w - 120, h)],
    ['Horizontal Logo', 'Headers, signatures, banners, signs', 'Large symbol and wordmark share one visual centreline', (x, y, w, h) => `${imageTag(img.symbol, x + 16, y - 2, 164, 150)}${imageTag(img.wordmark, x + 176, y + 32, 236, 84)}`],
    ['Vertical / Stacked Logo', 'Square packaging, posters, badges', 'Master composition; cup remains positioned over the T', (x, y, w, h) => imageTag(img.full, x + 92, y - 4, w - 184, h + 8)],
    ['Responsive Logo', 'Mobile and very small digital placements', 'Simplifies from full logo to wordmark to symbol', (x, y, w, h) => responsive(x, y, w, h)],
    ['Favicon', 'Browser tabs and bookmarks', 'Extremely simplified logo mark at tiny sizes', (x, y, w, h) => imageTag(img.markWine, x + 148, y + 20, 132, 132)],
    ['App Icon', 'Mobile apps and digital platforms', 'Logo mark inside a rounded-square frame', (x, y, w, h) => appIcon(x, y, w, h)],
    ['Seal / Badge Logo', 'Stickers, cups and limited editions', 'Circular enclosed mark for product applications', (x, y, w, h) => seal(x, y, w, h)]
  ];

  const width = 1660;
  const height = 2360;
  const margin = 50;
  const gap = 28;
  const cellW = 500;
  const cellH = 330;

  let cells = '';
  variants.forEach((variant, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    cells += cell({
      x: margin + col * (cellW + gap),
      y: 210 + row * (cellH + gap),
      title: variant[0],
      use: variant[1],
      feature: variant[2],
      art: variant[3],
      dark: variant[4] || false,
      accent: [BRAND.red, BRAND.yellow, BRAND.mint, BRAND.sky][i % 4]
    });
  });

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${BRAND.cream}"/>
    <rect x="0" y="0" width="${width}" height="154" fill="${BRAND.wine}"/>
    <circle cx="70" cy="78" r="10" fill="${BRAND.red}"/>
    <circle cx="96" cy="78" r="10" fill="${BRAND.yellow}"/>
    <circle cx="122" cy="78" r="10" fill="${BRAND.mint}"/>
    <text x="158" y="72" font-family="Arial Black, Poppins, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF">FruTea Logo Versions</text>
    <text x="158" y="110" font-family="Arial, Poppins, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,.72)">Preview sheet based on assets/logo/logo-main.png · no tagline approved</text>
    <text x="${width - 54}" y="84" text-anchor="end" font-family="Arial, Poppins, sans-serif" font-size="18" font-weight="700" fill="${BRAND.yellow}">Approval Preview</text>
    ${cells}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
  const versionsDir = path.join(root, 'assets/logo/versions');
  fs.mkdirSync(versionsDir, { recursive: true });

  const save = (name, buffer) => sharp(buffer).png().toFile(path.join(versionsDir, name));
  const render = (name, width, height, content, background = 'transparent') => {
    const artSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${background}"/>
      ${content}
    </svg>`;
    return sharp(Buffer.from(artSvg)).png().toFile(path.join(versionsDir, name));
  };

  await Promise.all([
    save('primary-logo.png', full),
    save('secondary-logo.png', fullSmall),
    save('logo-mark-symbol.png', symbol),
    save('wordmark.png', wordmark),
    render('lettermark-monogram-ft.png', 420, 320, monogram(0, 0, 420, 320)),
    save('logo-without-tagline.png', full),
    save('full-colour-logo.png', full),
    save('single-colour-wine-logo.png', wine),
    save('black-logo.png', black),
    render('white-reverse-logo.png', 640, 440, imageTag(img.white, 70, 45, 500, 350), BRAND.wine),
    save('grayscale-logo.png', gray),
    render('horizontal-logo.png', 1000, 340, `${imageTag(img.symbol, 35, 35, 300, 270)}${imageTag(img.wordmark, 340, 80, 620, 190)}`),
    save('vertical-stacked-logo.png', full),
    render('responsive-logo.png', 1000, 300, responsive(30, 70, 940, 160)),
    render('favicon.png', 256, 256, imageTag(img.markWine, 36, 36, 184, 184)),
    render('app-icon.png', 512, 512, appIcon(42, 42, 428, 428)),
    render('seal-badge-logo.png', 512, 512, seal(42, 42, 428, 428))
  ]);
  console.log(outPath);
  console.log(versionsDir);
})();
