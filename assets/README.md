# FruTea Assets

## Folder Map

- `Logo/versions/`: runtime logo files used by the website and game.
- `Mascot/`: clean mascot poses used by the website and game.
- `products/v1/`: local-only pre-update archive, including former prices and bulk pouches.
- `products/v2/`: current approved product and scene-element assets.
- `brand-guideline/`: brand, packaging, motion, 3D, asset index, and reusable design-token files.

## Version Rule

Use `products/v2/` for all current website, presentation, and campaign work. Keep `products/v1/` unchanged as a local historical archive; it is excluded from Git and deployment. Each version stores transparent PNG cutouts and matching GLB models; the older portable OBJ prototypes are retained under `products/v1/obj/`.

The website builds its live product scenes directly from `index.html`, so the versioned folders are reusable exports rather than runtime dependencies.
