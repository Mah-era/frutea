const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const version = process.env.FRUTEA_ASSET_VERSION || 'v2';
const sourceHtml = path.resolve(process.env.FRUTEA_SOURCE_HTML || path.join(root, 'index.html'));
const legacy = process.env.FRUTEA_LEGACY === '1';
const productDir = path.join(assets, 'products', version);
const pngDir = path.join(productDir, 'png');
const glbDir = path.join(productDir, 'glb');

for (const dir of [pngDir, glbDir]) fs.mkdirSync(dir, { recursive: true });

const productExports = [
  { name: 'sachet-lemon', kind: 'stick', flavour: 0 },
  { name: 'sachet-mango', kind: 'stick', flavour: 1 },
  { name: 'sachet-lychee', kind: 'stick', flavour: 2 },
  { name: 'sachet-orange', kind: 'stick', flavour: 3 },
  { name: 'sachet-strawberry', kind: 'stick', flavour: 4 },
  { name: 'mix-pack-box', kind: 'mix' },
  { name: 'low-sugar-lemon-box', kind: 'lowBox' },
  { name: 'low-sugar-honey-lemon-box', kind: 'lowHoneyBox' },
  { name: 'low-sugar-lemon-sachet', kind: 'lowStick' },
  { name: 'low-sugar-honey-lemon-sachet', kind: 'lowHoneyStick' },
  { name: 'hot-tea-glass', kind: 'glassHot' },
  { name: 'iced-tea-glass', kind: 'glassCold' },
  { name: 'lemon-whole', kind: 'fruit', flavour: 0 },
  { name: 'mango-whole', kind: 'fruit', flavour: 1 },
  { name: 'lychee-whole', kind: 'fruit', flavour: 2 },
  { name: 'orange-whole', kind: 'fruit', flavour: 3 },
  { name: 'strawberry-whole', kind: 'fruit', flavour: 4 },
  { name: 'lemon-slice', kind: 'slice', flavour: 0 },
  { name: 'orange-slice', kind: 'slice', flavour: 3 },
  { name: 'ice-cube', kind: 'ice' },
  { name: 'mint-leaf', kind: 'leaf' },
  { name: 'striped-straw', kind: 'straw' }
];
if (legacy) {
  productExports.splice(5, 0,
    { name: 'bulk-pouch-lemon', kind: 'pouch', flavour: 0 },
    { name: 'bulk-pouch-mango', kind: 'pouch', flavour: 1 },
    { name: 'bulk-pouch-lychee', kind: 'pouch', flavour: 2 },
    { name: 'bulk-pouch-orange', kind: 'pouch', flavour: 3 },
    { name: 'bulk-pouch-strawberry', kind: 'pouch', flavour: 4 }
  );
}

function pad4(buffer, padByte = 0) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, padByte)]) : buffer;
}

function accessorMinMax(values, size) {
  const min = Array(size).fill(Infinity);
  const max = Array(size).fill(-Infinity);
  for (let i = 0; i < values.length; i += size) {
    for (let j = 0; j < size; j++) {
      min[j] = Math.min(min[j], values[i + j]);
      max[j] = Math.max(max[j], values[i + j]);
    }
  }
  return { min, max };
}

function writeGlbFromRealMeshes(name, exported) {
  const buffers = [];
  const bufferViews = [];
  const accessors = [];
  const images = [];
  const materials = [];
  const textures = [];
  const primitives = [];
  const pushBuffer = (buffer, target) => {
    const byteOffset = buffers.reduce((sum, item) => sum + item.length, 0);
    const padded = pad4(buffer);
    buffers.push(padded);
    const view = { buffer: 0, byteOffset, byteLength: buffer.length };
    if (target) view.target = target;
    bufferViews.push(view);
    return bufferViews.length - 1;
  };
  const pushAccessor = (values, componentType, type, target) => {
    const array = componentType === 5126 ? new Float32Array(values) : new Uint32Array(values);
    const buffer = Buffer.from(array.buffer);
    const viewIndex = pushBuffer(buffer, target);
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type];
    const accessor = { bufferView: viewIndex, byteOffset: 0, componentType, count: values.length / size, type };
    if (componentType === 5126) Object.assign(accessor, accessorMinMax(values, size));
    accessors.push(accessor);
    return accessors.length - 1;
  };
  const materialKey = new Map();
  const imageKey = new Map();

  for (const mesh of exported.meshes) {
    let imageIndex = -1;
    if (mesh.imageData) {
      if (!imageKey.has(mesh.imageData)) {
        const imageBuffer = Buffer.from(mesh.imageData.replace(/^data:image\/png;base64,/, ''), 'base64');
        const viewIndex = pushBuffer(imageBuffer, undefined);
        images.push({ bufferView: viewIndex, mimeType: 'image/png' });
        textures.push({ source: images.length - 1 });
        imageKey.set(mesh.imageData, images.length - 1);
      }
      imageIndex = imageKey.get(mesh.imageData);
    }

    const matKey = `${mesh.color.join(',')}|${mesh.opacity}|${imageIndex}`;
    if (!materialKey.has(matKey)) {
      const mat = {
        name: mesh.materialName || 'material',
        pbrMetallicRoughness: {
          baseColorFactor: [...mesh.color, mesh.opacity],
          metallicFactor: 0,
          roughnessFactor: mesh.roughness ?? 0.55
        },
        doubleSided: true
      };
      if (imageIndex >= 0) {
        mat.pbrMetallicRoughness.baseColorTexture = { index: textures.length - 1 };
      }
      if (mesh.opacity < 1) {
        mat.alphaMode = 'BLEND';
      }
      materials.push(mat);
      materialKey.set(matKey, materials.length - 1);
    }

    const attributes = {
      POSITION: pushAccessor(mesh.position, 5126, 'VEC3', 34962)
    };
    if (mesh.normal?.length) attributes.NORMAL = pushAccessor(mesh.normal, 5126, 'VEC3', 34962);
    if (mesh.uv?.length) attributes.TEXCOORD_0 = pushAccessor(mesh.uv, 5126, 'VEC2', 34962);
    primitives.push({
      attributes,
      indices: pushAccessor(mesh.index, 5125, 'SCALAR', 34963),
      material: materialKey.get(matKey)
    });
  }

  const bin = Buffer.concat(buffers);
  const gltf = {
    asset: { version: '2.0', generator: 'FruTea real Three.js object exporter' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [{ primitives }],
    materials,
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors
  };
  if (images.length) {
    gltf.images = images;
    gltf.textures = textures;
  }

  const json = pad4(Buffer.from(JSON.stringify(gltf)), 0x20);
  const paddedBin = pad4(bin);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + paddedBin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(path.join(glbDir, `${name}.glb`), Buffer.concat([header, jsonHeader, json, binHeader, paddedBin]));
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 1 });
  await page.goto(`file://${sourceHtml}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  for (const asset of productExports) {
    const exported = await page.evaluate(async (asset) => {
      document.body.innerHTML = '<canvas id="asset-canvas" width="1400" height="1400" style="width:1400px;height:1400px;background:transparent"></canvas>';
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.style.margin = '0';
      const canvas = document.getElementById('asset-canvas');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(1400, 1400, false);
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(28, 1, .01, 200);
      studioLights(scene, true);

      const makeObject = () => {
        if (asset.kind === 'stick') return makeStick(STICK_TEX[asset.flavour], STICK_BAK[asset.flavour]);
        if (asset.kind === 'pouch') return makePouch(POUCH_TEX[asset.flavour], POUCH_BAK[asset.flavour]);
        if (asset.kind === 'mix') return typeof makeMixBox === 'function' ? makeMixBox(MIX_BOX_TEX) : makeMixPouch(MIX_BOX_TEX);
        if (asset.kind === 'lowBox') return makeCarton(LOW_BOX_TEX, LOW_SIDE_TEX, 2.62, 3.35, .72);
        if (asset.kind === 'lowHoneyBox') return makeCarton(LOW_HONEY_BOX_TEX, LOW_HONEY_SIDE_TEX, 2.62, 3.35, .72);
        if (asset.kind === 'lowStick') return makeStick(LOW_STICK_TEX, LOW_STICK_BAK);
        if (asset.kind === 'lowHoneyStick') return makeStick(LOW_HONEY_STICK_TEX, LOW_HONEY_STICK_BAK);
        if (asset.kind === 'glassHot') return makeGlass(0xB85F12, { ice: 0, fizz: 5, style: 'rocks' });
        if (asset.kind === 'glassCold') return makeGlass(0xD9154F, { ice: 14, fizz: 22, style: 'highball' });
        if (asset.kind === 'fruit') return makeWholeFruit(FLAVOURS[asset.flavour], .78);
        if (asset.kind === 'slice') return makeSliceFruit(FLAVOURS[asset.flavour], .82);
        if (asset.kind === 'ice') return makeIceCube(.9);
        if (asset.kind === 'leaf') return makeLeaf(1.2, 0x42B878);
        if (asset.kind === 'straw') return makeStraw(3.1, '#FFF04D');
        throw new Error(`Unknown asset kind: ${asset.kind}`);
      };

      const obj = makeObject();
      obj.rotation.y = asset.kind === 'slice' ? .25 : -.25;
      obj.rotation.x = asset.kind === 'slice' ? 1.18 : .04;
      if (asset.kind === 'pouch') obj.scale.setScalar(.82);
      else if (asset.kind === 'stick' || asset.kind.includes('Stick')) obj.scale.setScalar(.78);
      else if (asset.kind.includes('Box') || asset.kind === 'mix') obj.scale.setScalar(.78);
      else if (asset.kind.includes('glass')) obj.scale.setScalar(.86);
      else if (asset.kind === 'straw') obj.scale.setScalar(.78);
      else obj.scale.setScalar(.92);
      scene.add(obj);

      obj.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) * 1.55;
      cam.position.set(center.x, center.y + maxDim * .04, center.z + distance);
      cam.lookAt(center);
      cam.near = Math.max(.01, distance / 80);
      cam.far = distance * 80;
      cam.updateProjectionMatrix();
      renderer.render(scene, cam);

      window.__fruteaGLTFExporterPromise ||= (async () => {
        if (!document.querySelector('script[data-frutea-importmap]')) {
          const importMap = document.createElement('script');
          importMap.type = 'importmap';
          importMap.dataset.fruteaImportmap = 'true';
          importMap.textContent = JSON.stringify({
            imports: {
              three: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
            }
          });
          document.head.appendChild(importMap);
        }
        const mod = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/exporters/GLTFExporter.js');
        return mod.GLTFExporter;
      })();

      const GLTFExporter = await window.__fruteaGLTFExporterPromise;
      const exporter = new GLTFExporter();
      const arrayBuffer = await new Promise((resolve, reject) => {
        exporter.parse(
          obj,
          resolve,
          reject,
          {
            binary: true,
            embedImages: true,
            trs: false,
            onlyVisible: true,
            maxTextureSize: 2048
          }
        );
      });
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      };
      return { glbBase64: btoa(binary) };
    }, asset);

    await page.locator('#asset-canvas').screenshot({
      path: path.join(pngDir, `${asset.name}.png`),
      omitBackground: true,
      animations: 'disabled'
    });
    fs.writeFileSync(path.join(glbDir, `${asset.name}.glb`), Buffer.from(exported.glbBase64, 'base64'));
  }

  await browser.close();

  const sourceDescription = legacy
    ? 'Recovered from the pre-pricing-update website source at commit `699ae60`.'
    : 'Generated from the current `index.html` Three.js product builders.';
  const rangeDescription = legacy
    ? 'Historical reference only. This version contains former prices and the discontinued consumer bulk-pouch range.'
    : 'Current approved range. Use this version for all new website, campaign, and presentation work.';
  const readme = `# FruTea Product Assets ${version.toUpperCase()}

${sourceDescription}

${rangeDescription}

- PNG cutouts: \`assets/products/${version}/png/\`
- GLB meshes: \`assets/products/${version}/glb/\`

The PNG files are transparent, uncropped product/element renders. The GLB files are glTF Binary exports from the actual Three.js objects used by the page, including geometry and embedded canvas texture maps where available.
`;
  fs.writeFileSync(path.join(productDir, 'README.md'), readme);
})();
