// Builds a low-resolution variant of a site vehicle GLB: same nodes, materials and names,
// fewer triangles, smaller textures. The page shows it first and swaps in the full model later.
// Run from a folder that has these packages (none are shipped with the site):
//   npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
//   node tools/dusuk-model.mjs assets/models/volvo-xc60.glb assets/models/volvo-xc60-dusuk.glb
// Add --boya-tam to leave the paint untouched: the XC60's smooth panels show dents when
// simplified (3d-modeller/KARARLAR.md, D27), so its small model is built with it.
// Re-run for a vehicle whenever its full model changes.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [src, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const keepPaint = process.argv.includes('--boya-tam');
await MeshoptDecoder.ready; await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src);
await doc.transform(weld());

// How much of each material's triangles to keep, and how far (as a share of the mesh size) a
// surface may move. Paint and glass are what the eye reads on a car this size; they move least.
const RULES = [
  [/^VOLAN_GOLGE$|^Plaka/, null],
  [/^VOLAN_BOYA$/, keepPaint ? null : { ratio: 0.3, error: 0.0015 }],
  [/^VOLAN_CAM_Cam$|lamba|^Far$|^Krom$|^Jant$/, { ratio: 0.3, error: 0.003 }],
  [/^Ic_|^Fren$|^Kaliper$/, { ratio: 0.08, error: 0.02 }],
  [/./, { ratio: 0.2, error: 0.006 }],
];
let before = 0, after = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const name = prim.getMaterial()?.getName() ?? '';
    const rule = RULES.find(([re]) => re.test(name))[1];
    const n = prim.getIndices().getCount() / 3; before += n;
    if (rule && n > 200) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, lockBorder: false, ...rule });
    after += prim.getIndices().getCount() / 3;
  }
}
for (const tex of doc.getRoot().listTextures()) {
  const width = tex.getName() === 'golge' ? 256 : 512;
  if (tex.getSize()[0] <= width) continue;
  tex.setImage(await sharp(tex.getImage()).resize({ width }).webp({ quality: 80, alphaQuality: 80 }).toBuffer()).setMimeType('image/webp');
}
await doc.transform(prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(out, doc);
console.log(out.split('/').pop(), 'tris', before, '->', after);
