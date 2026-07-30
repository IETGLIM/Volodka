# Asset attribution

This file summarizes repo-level third-party asset sources. Per-model shipped GLB/GLTF attribution lives in [`public/models/ATTRIBUTION.md`](./public/models/ATTRIBUTION.md).

## Project-owned writing

Narrative poetry (`poem_1`-`poem_18`) is an original work by Vladimir Lebedev, the project rights holder. The poems are part of the game narrative and are not third-party licensed content.

## Procedural AAA pipeline noise

Simplex/value/Worley noise used by `src/proceduralAaa/` is **inlined** (no third-party noise package).

## Poly Haven (CC0)

Night HDRIs, PBR surface maps, modular urban GLTF props, and the menu cinematic plate are from [Poly Haven](https://polyhaven.com) under the Creative Commons Zero (CC0) license.

Assets used in this build include:

- HDRI: Moonlit Golf, Abandoned Parking Lot, Lebombo.
- Materials: `asphalt_02`, `concrete_floor_painted`, `wood_floor`, `plastered_wall`, `metal_plate`.
- Models: modular urban apartment facade, modular fire escape, concrete road barriers, painted bench/table/cabinet, hanging industrial lamp, roller shutter door/window, barrel, cardboard box, metal trash can, street lamp, trash bag, wet floor sign, gothic statue, exterior aircon, power box, security camera, utility box, old tyre, manhole cover, wooden crate, arm chair, worn bookshelf, sofa, desk lamp arm, portable cassette player.

**Powered by Poly Haven**: https://polyhaven.com

Local copies live under `public/hdri/`, `public/textures/polyhaven/`, `public/models/polyhaven/`, and `public/menu/` (`cinematic_night_plate.png`).

## Other CC0 / free asset sources

- [Quaternius](https://quaternius.com): modular character packs and humanoid animation sources.
- [Kenney](https://kenney.nl): furniture, city kit props, and interim interior shells.
- [Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models): CC0 reference/interim GLB assets.
- [three.js sample models](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf): CC0 interim rigs/models.
- [OpenGameArt](https://opengameart.org): CC0 campfire and animation sources noted in model attribution.
- [Mixamo](https://www.mixamo.com): optional animation override source, governed by Adobe/Mixamo terms.

Asset pipeline details: [`assets-source/ai3dgen/README.md`](./assets-source/ai3dgen/README.md).
