"""Original Last Metro props. Run with Blender 4.5 LTS in background mode."""
import bpy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models'
SOURCE = ROOT / 'assets/source/models'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)


def material(name, color, metallic=0.0, roughness=0.6, emission=0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metallic
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Emission Color'].default_value = (*color, 1)
    node.inputs['Emission Strength'].default_value = emission
    return mat


STEEL = material('Brushed steel', (0.24, 0.29, 0.27), 0.72, 0.38)
DARK = material('Painted charcoal', (0.028, 0.045, 0.041), 0.35, 0.65)
BRASS = material('Old brass', (0.4, 0.28, 0.1), 0.58, 0.48)
GREEN = material('Enamel station green', (0.10, 0.19, 0.15), 0.25, 0.58)
SCREEN = material('Idle screen', (0.038, 0.12, 0.095), 0.1, 0.4, 0.35)


def box(name, position, dimensions, mat, bevel=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Manufactured edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normal = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=normal.name)
    return obj


def rod(name, a, b, radius, mat):
    from mathutils import Vector
    delta = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=radius, depth=delta.length, location=(Vector(a) + Vector(b)) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def bench():
    # Blender Z is up; glTF exporter maps it to Three.js Y. Local +Y is the rear.
    # Match the existing 2.8m x 0.65m seat collider and 0.65m seat height.
    for y in [-0.24, -0.08, 0.08, 0.24]:
        box('Seat slat', (0, y, 0.65), (2.72, 0.13, 0.07), STEEL, 0.016)
    for z in [0.84, 1.00, 1.16]:
        box('Back slat', (0, 0.29, z), (2.72, 0.06, 0.12), STEEL, 0.014)
    for x in [-0.98, 0.98]:
        box('Foot plate', (x, 0, 0.04), (0.22, 0.6, 0.08), DARK)
        box('Leg', (x, 0, 0.34), (0.095, 0.14, 0.58), DARK)
        rod('Rear upright', (x, 0.24, 0.58), (x, 0.29, 1.22), 0.025, DARK)
        for y in [-0.21, 0.21]:
            rod('Fixing bolt', (x, y, 0.076), (x, y, 0.091), 0.018, BRASS)
    for x in [-1.33, 0, 1.33]:
        rod('Arm front', (x, -0.21, 0.68), (x, -0.21, 0.87), 0.022, DARK)
        rod('Arm rest', (x, -0.21, 0.87), (x, 0.27, 0.90), 0.027, DARK)


def cabinet():
    # 1.8m wide, 0.45m deep, 1.9m tall; front faces local -Y.
    box('Cabinet shell', (0, 0, 0.95), (1.78, 0.43, 1.9), DARK, 0.035)
    for x in [-0.45, 0.45]:
        box('Door', (x, -0.226, 0.97), (0.875, 0.035, 1.82), GREEN, 0.018)
        for z in [0.2, 0.27, 0.34, 1.59, 1.66, 1.73]:
            box('Vent slot', (x, -0.248, z), (0.6, 0.012, 0.014), DARK, 0)
        rod('Hinge', (x + 0.4, -0.25, 0.52), (x + 0.4, -0.25, 0.68), 0.015, STEEL)
    box('Door handle', (0.1, -0.271, 0.91), (0.035, 0.042, 0.17), STEEL)
    box('Rating plate', (-0.52, -0.25, 0.6), (0.24, 0.018, 0.1), BRASS, 0.004)


def ticket_machine():
    box('Kiosk body', (0, 0, 1), (0.9, 0.55, 2), GREEN, 0.04)
    box('Kiosk plinth', (0, 0.01, 0.08), (0.95, 0.57, 0.16), DARK)
    box('Face inset', (0, -0.285, 1.31), (0.73, 0.035, 1.18), DARK)
    box('Screen bezel', (-0.06, -0.31, 1.56), (0.55, 0.048, 0.43), STEEL)
    box('Screen glass', (-0.06, -0.338, 1.56), (0.49, 0.012, 0.37), SCREEN, 0.01)
    box('Card slot', (0.22, -0.313, 1.1), (0.17, 0.025, 0.035), BRASS, 0.004)
    for row in range(3):
        for col in range(3):
            box('Key', (-0.22 + col * 0.072, -0.316, 1.19 - row * 0.075), (0.046, 0.025, 0.042), STEEL, 0.005)
    box('Ticket tray', (0, -0.32, 0.74), (0.48, 0.11, 0.1), DARK)
    box('Header plate', (0, -0.289, 1.9), (0.7, 0.026, 0.11), BRASS, 0.008)


def export(name, build):
    clear()
    build()
    # Keep editable individual pieces in .blend, but combine by material for GLB.
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / (name + '.blend')))
    objects = list(bpy.context.scene.objects)
    groups = {}
    for obj in objects:
        groups.setdefault(obj.data.materials[0].name, []).append(obj)
    for name_key in sorted(groups):
        bpy.ops.object.select_all(action='DESELECT')
        meshes = groups[name_key]
        for obj in meshes:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
    bpy.ops.object.select_all(action='SELECT')
    triangles = 0
    for obj in bpy.context.scene.objects:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    bpy.ops.export_scene.gltf(filepath=str(OUT / (name + '.glb')), export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
    return {'file': name + '.glb', 'triangles': triangles, 'drawMeshes': len(bpy.context.scene.objects), 'bytes': (OUT / (name + '.glb')).stat().st_size}


manifest = {'author': 'Last Metro original project work', 'tool': bpy.app.version_string, 'source': 'scripts/build-props.py', 'models': []}
for name, build in [('platform-bench', bench), ('electrical-cabinet', cabinet), ('ticket-machine', ticket_machine)]:
    manifest['models'].append(export(name, build))
(SOURCE / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
