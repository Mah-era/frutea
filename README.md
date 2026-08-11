# FruTea

FruTea is an interactive product website for a fruit-flavoured instant tea brand. It combines animated 3D product packaging, flavour-led storytelling, product guidance, and the desktop arcade game **Fruit Rush**.

## Live Site

- Website: https://mah-era.github.io/frutea/
- Fruit Rush: https://mah-era.github.io/frutea/game/
- Repository: https://github.com/Mah-era/frutea

## Website Features

- Animated 3D FruTea packaging and product scenes
- Five flavour presentations with tailored visual treatments
- Hot-or-iced service story and a scroll-reveal for the planned Year 2 Low Sugar range
- Product selection and preparation guidance
- Interactive FruTea mascot guide
- Smooth scroll-based transitions and motion
- Direct access to the Fruit Rush game

## Current Product Plan

- Five 15g single-sachet flavours at BDT 20 per cup
- Ten-sachet, five-flavour Mix Pack at BDT 200
- No consumer bulk-pouch format in the current range
- Low Sugar Green Tea planned for Year 2 at BDT 35 per 12g sachet

## Fruit Rush

Fruit Rush is a desktop-focused, single-level arcade platformer built with Phaser.

### Controls

- `A` or Left Arrow: move left
- `D` or Right Arrow: move right
- `W`, Up Arrow, or Space: jump
- Jump on mobile-phone enemies to defeat them
- Collect fruit, activate checkpoints, and reach the Mix Pack finish

The game starts fresh on every reload and includes retro sound, flavour-specific scenery, mascot mood changes, checkpoints, and animated sky transitions.

## Project Structure

```text
.
├── index.html                       # Main FruTea website
├── assets/
│   ├── Logo/versions/               # Runtime logo assets
│   ├── Mascot/                      # Mascot poses used by the website
│   ├── png/products-elements/       # Approved transparent product renders
│   ├── glb/                         # Approved 3D product and element exports
│   └── brand-guideline/             # Product, packaging, and motion guidance
├── product.md                       # Current product and pricing source
├── frutea-guide.md                  # Brand and website source guide
└── game/
    ├── index.html                   # Game page
    ├── game.css                     # Game interface styling
    ├── game.js                      # Phaser game logic
    ├── assets.generated.js          # Embedded game sprite bundle
    └── vendor/phaser-3.90.0.min.js  # Local Phaser runtime
```

Deployment dependencies plus the current product specification, packaging guide, and approved product exports are tracked. Historical working files remain excluded.

## Dependencies

The website uses:

- Three.js 0.160.0
- GSAP 3.12.5 and ScrollTrigger
- Google Fonts: Fredoka, Poppins, and Nunito Sans

Fruit Rush uses a locally bundled Phaser 3.90.0 runtime and embedded sprite assets, allowing the game to work without loading individual game textures from external sources.

## Run Locally

The site can be opened directly through `index.html`. For the most consistent browser behavior, serve the project directory locally:

```bash
python3 -m http.server 4174
```

Then open:

```text
http://localhost:4174/
```

## Deployment

The public site is deployed with GitHub Pages from the root of the `main` branch. Pushing a new commit to `main` triggers a new Pages build.
