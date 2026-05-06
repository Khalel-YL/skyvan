# Workshop Asset File Standard

## 1. Purpose

Workshop Assets are separate from the Media Library.

This standard is for product visuals, model-specific visual assets, coating visuals, wood/texture previews, 2.5D image layers, and future GLB/texture references used by Workshop.

This standard does not define website, blog, SEO, public page, or general Media Library assets.

## 2. Storage Location

Recommended future local public path:

```text
public/workshop-assets/
```

Recommended public URL prefix:

```text
/workshop-assets/
```

Files placed under `public/workshop-assets/` are served by Next.js from `/workshop-assets/...`.

Important:

- Do not create real files in this sprint.
- Do not add binaries in this sprint.
- Do not add placeholder image files.
- This document defines the standard only.

## 3. Folder Convention

Recommended structure:

```text
public/workshop-assets/
  models/
    <model-slug>/
      products/
        <product-slug-or-sku>/
          <camera-view>/
            layer-<z-index>-<asset-purpose>.webp
            layer-<z-index>-<asset-purpose>.png
      fallback/
        missing-layer.webp
```

Use product-specific layers when the asset belongs to a selected product and should appear only when that product is selected.

Use model-specific fallback layers when a visual communicates missing, generic, or model-bound fallback state without being tied to a specific product.

Use texture preview folders or files for coating, wood, fabric, flooring, or surface previews that are not final placed furniture layers.

Future 3D references should stay under Workshop Assets when they describe Workshop/product/model visual behavior. They must not be mixed into the Media Library.

## 4. Naming Convention

Model slug:

- Use the existing model slug from Admin Models.
- Keep lowercase kebab-case.
- Do not rename a model slug after assets are created unless all related asset records are updated.

Product slug or SKU:

- Use the existing product slug or SKU.
- Prefer SKU when it is more stable than a marketing slug.
- Use lowercase file/folder names when possible.
- Do not use spaces or Turkish characters in file or folder names.

Camera view:

- Use a stable English technical key.
- Use lowercase kebab-case.
- Do not translate stored camera keys.

Layer index:

- Use a numeric `zIndexLayer`.
- Zero padding is optional but recommended for filenames.
- Recommended filename form: `layer-010-table.webp`.

Asset purpose:

- Use a short kebab-case purpose.
- Keep it descriptive enough for operators.
- Examples: `table`, `bed-base`, `oak-overlay`, `soft-shadow`.

Extension:

- Prefer `.webp` for web delivery.
- Use `.png` for transparent high-fidelity layers when alpha precision matters.
- Use `.jpg` or `.jpeg` only for non-transparent photo/reference assets.

Examples:

```text
/workshop-assets/models/ducato-class-l2h2/products/mas-001/isometric/layer-010-table.webp
/workshop-assets/models/ducato-class-l2h2/products/mas-001/isometric/layer-010-table.png
/workshop-assets/models/ducato-class-l2h2/fallback/missing-layer.webp
```

## 5. Camera View Standard

Allowed initial camera keys:

- `isometric`
- `side`
- `front`
- `rear`
- `texture-preview`
- `interior`
- `exterior`

Rules:

- Use lowercase kebab-case.
- Do not translate camera keys in stored values.
- Visible UI may show Turkish labels later.
- `isometric` is the preferred default camera view.
- Avoid creating new camera keys until the renderer and QA flow explicitly support them.

## 6. Layer Ordering Standard

`zIndexLayer` controls draw order.

- Lower `zIndexLayer` draws earlier and appears behind.
- Higher `zIndexLayer` draws later and appears on top.
- Avoid duplicate `zIndexLayer` for the same product/model/camera unless intentional.
- If duplicates are intentional, document the reason in the asset work note or task.

Recommended bands:

| Band | Purpose |
| --- | --- |
| `0-99` | Base vehicle/model shadows and shell references |
| `100-199` | Fixed interior structure |
| `200-399` | Furniture/product layers |
| `400-599` | Material/coating/texture overlays |
| `600-799` | Highlights, shadows, and effects |
| `800-999` | Annotation/debug-only temporary layers |

Temporary debug-only layers must not be treated as production assets.

## 7. File Type Standard

Current image-layer extensions:

- `.webp`
- `.png`
- `.jpg`
- `.jpeg`
- `.svg`

Transparent overlay preferred formats:

- `.png`
- `.webp` with alpha

Photo or non-transparent reference formats:

- `.jpg`
- `.jpeg`
- `.webp`

Future model3d-reference extensions:

- `.glb`
- `.gltf`

Future video-reference extensions:

- `.mp4`
- `.webm`

Link-reference:

- Use only for safe external references.
- Link-reference records are not rendered by Workshop.
- Avoid random external URLs for production assets.

## 8. Admin Entry Mapping

`/admin/workshop-assets` maps to `visualAssets2d`.

| Admin field | DB field | Standard |
| --- | --- | --- |
| Product | `productId` | Select the exact product the layer belongs to. |
| Araç modeli | `modelId` | Select the exact model the layer is designed for. |
| Kamera görünümü | `cameraView` | Use the camera key, for example `isometric`. |
| Katman sırası | `zIndexLayer` | Use the numeric layer order. |
| Varlık URL | `assetUrl` | Use `/workshop-assets/...` for public Workshop asset files. |
| Yedek URL | `fallbackUrl` | Optional safe fallback URL, preferably under `/workshop-assets/...`. |

Admin validation currently accepts safe HTTP(S) URLs or safe relative storage-style paths. For production Workshop assets, prefer root-relative public URLs beginning with `/workshop-assets/` when files are served from `public/workshop-assets/`.

## 9. QA Checklist Before Adding a Real Asset

Before adding a real Workshop Asset:

- Model slug matches the Workshop selected model.
- Product slug or SKU matches the selected product.
- Camera view matches the selected camera.
- URL opens directly in the browser.
- File extension is supported.
- Transparent layers have alpha if needed.
- Image dimensions match the current asset composition expectation.
- The visual aligns with the target camera.
- `zIndexLayer` does not conflict accidentally.
- Fallback URL opens if used.
- `/admin/workshop-assets` shows the asset.
- `/workshop` shows non-zero asset readiness after refresh.
- Selecting the product updates render plan/image-layer count.
- No raw URL is shown in Workshop UI.
- No red Next.js issue appears from handled image failures.

## 10. Do-Not Rules

Do not:

- Use `/home/...` filesystem paths.
- Use random external URLs for production assets.
- Upload website media into Workshop Assets.
- Store public/blog/media assets as Workshop Assets.
- Use Turkish characters in file names.
- Use spaces in file names.
- Change camera keys after assets are created.
- Add fake asset records for production.
- Add placeholder image files as if they were real assets.
- Connect Workshop Assets to the Media Library.
- Use Workshop Assets for general website content.

## 11. Future Renderer Notes

W9/W10 currently render only `image-layer` assets in an isolated preview component.

Full 2.5D composition is future work.

GLB, GLTF, video, and link references are not rendered by Workshop yet.

Before full renderer work begins, standardize:

- asset dimensions,
- transparent alignment,
- camera coordinate expectations,
- fallback behavior,
- z-index band ownership,
- asset QA screenshot requirements.

The future full renderer should consume the existing render contract rather than reading DB rows or Media Library records directly.
