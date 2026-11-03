#!/bin/sh
# Makes the web copy of the facility model used by tesisimiz.html.
#
#   sh tools/tesis-model.sh [source.glb]
#
# Source: the Blender export in ../facility-modelling/assets/volan-building.glb
#   (rebuild it there first: blender -b --factory-startup -P scripts/build_volan.py).
# Output: assets/models/tesis.glb
#
# Method: gltf-transform optimize with meshopt compression and quantization, the same
# extensions as the car models; the site's three.js bundle already has MeshoptDecoder.
# --palette false   keeps material names
# --flatten false   keeps the node hierarchy (MAIN / LOWER / UPPER / ENVELOPE / SITE and the
#                   zone empties); tesis.js finds zones through it
# --join false      keeps the "_cut" meshes separate from the solid ones (cutaway)
# --simplify false  keeps small details (badges, wheels); reduce in Blender instead
# To change the method (for example Draco), change only this file and the loader setup in
# assets/js/tesis.js.
set -eu
cd "$(dirname "$0")/.."
SRC=${1:-../facility-modelling/assets/volan-building.glb}
OUT=assets/models/tesis.glb
npx -y @gltf-transform/cli optimize "$SRC" "$OUT" \
  --compress meshopt --palette false --flatten false --join false --simplify false \
  --texture-compress webp
ls -l "$OUT"
