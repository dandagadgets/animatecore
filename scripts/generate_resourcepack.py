#!/usr/bin/env python3
"""
Generates AnimateCore's Blockbench source projects and the matching Minecraft resource pack.

This is the bridge between "authored in Blockbench" and "a working CustomModelData resource pack":
each tool is defined once (geometry + a simple swing animation) below, then this script emits:
  - blockbench/<tool>.bbmodel   - a real Blockbench project (open it, tweak it, re-export if you like)
  - resourcepack/assets/animatecore/textures/item/<tool>.png
  - resourcepack/assets/animatecore/models/item/<tool>_{idle,swing_1..4,use_5..7,crit_8}.json
  - resourcepack/assets/minecraft/models/item/<material>_<tool>.json (adds the CustomModelData
    overrides on top of vanilla's own model, sorted descending - see the long comment in
    build_vanilla_override() for why the ordering matters)

Re-run this after editing the geometry/colors below (or a re-exported .bbmodel - see README) to
regenerate the resource pack. Nothing here is loaded by the plugin at runtime; it only produces
static files under resourcepack/ and blockbench/.
"""
import base64
import io
import json
import os
import uuid
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKBENCH_DIR = os.path.join(ROOT, "blockbench")
PACK_DIR = os.path.join(ROOT, "resourcepack")
NAMESPACE = "animatecore"

TEX_SIZE = 32

# CustomModelData layout - mirrors com.animatecore.items.ModelData
IDLE, SWING_START, SWING_END, USE_START, USE_END, CRIT = 0, 1, 4, 5, 7, 8
FRAMES = {
    "idle": IDLE,
    "swing_1": 1, "swing_2": 2, "swing_3": 3, "swing_4": 4,
    "use_5": 5, "use_6": 6, "use_7": 7,
    "crit_8": CRIT,
}
# Per-frame element rotation: (angle, axis). Minecraft only accepts -45/-22.5/0/22.5/45 for
# element rotation angles, so the swing/use arcs are built entirely out of those five snap values.
FRAME_POSE = {
    "idle": (0, "y"),
    "swing_1": (-45, "y"), "swing_2": (-22.5, "y"), "swing_3": (22.5, "y"), "swing_4": (45, "y"),
    "use_5": (-22.5, "x"), "use_6": (0, "x"), "use_7": (22.5, "x"),
    "crit_8": (45, "x"),
}


def new_uuid():
    return str(uuid.uuid4())


def shade(color, amount):
    return tuple(max(0, min(255, c + amount)) for c in color)


# ---------------------------------------------------------------------------------------------
# Tool definitions: each part is a cuboid in the standard 0-16 Minecraft item-model grid.
# swatch_size controls how big a solid-color texture swatch the part gets (kept simple: flat
# color + a darker outline + one highlight row, in the style of vanilla's own tool textures).
# ---------------------------------------------------------------------------------------------
WOOD = (121, 85, 58)
STEEL = (196, 199, 206)
DARK_STEEL = (110, 112, 120)
GOLD = (222, 189, 66)
LEATHER = (92, 60, 40)

TOOLS = {
    "sword": {
        "model_base": 1000,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "handle", "from": [7, 0, 7.5], "to": [9, 4, 8.5], "color": WOOD},
            {"name": "guard", "from": [6, 4, 7], "to": [10, 5, 9], "color": GOLD},
            {"name": "blade", "from": [7.25, 5, 7.75], "to": [8.75, 16, 8.25], "color": STEEL},
        ],
    },
    "axe": {
        "model_base": 1100,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "handle", "from": [7.5, 0, 7.5], "to": [8.5, 13, 8.5], "color": WOOD},
            {"name": "head", "from": [4, 11, 7], "to": [8.5, 15.5, 9.5], "color": STEEL},
        ],
    },
    "pickaxe": {
        "model_base": 1200,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "handle", "from": [7.5, 0, 7.5], "to": [8.5, 12, 8.5], "color": WOOD},
            {"name": "head", "from": [3, 12, 7], "to": [13, 14, 9], "color": STEEL},
        ],
    },
    "shovel": {
        "model_base": 1300,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "handle", "from": [7.5, 0, 7.5], "to": [8.5, 13, 8.5], "color": WOOD},
            {"name": "blade", "from": [6.5, 13, 7.5], "to": [9.5, 16, 8.5], "color": STEEL},
        ],
    },
    "hoe": {
        "model_base": 1400,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "handle", "from": [7.5, 0, 7.5], "to": [8.5, 13, 8.5], "color": WOOD},
            {"name": "blade", "from": [4, 13, 7.25], "to": [12, 14.5, 8.75], "color": STEEL},
        ],
    },
    "spear": {
        "model_base": 1500,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "shaft", "from": [7.5, 0, 7.5], "to": [8.5, 14, 8.5], "color": WOOD},
            {"name": "socket", "from": [6.5, 13.5, 6.5], "to": [9.5, 15, 9.5], "color": DARK_STEEL},
            {"name": "tip", "from": [7.25, 15, 7.25], "to": [8.75, 18, 8.75], "color": STEEL},
        ],
    },
    "mace": {
        "model_base": 1600,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "handle", "from": [7.5, 0, 7.5], "to": [8.5, 10, 8.5], "color": LEATHER},
            {"name": "head", "from": [5, 10, 5], "to": [11, 16, 11], "color": DARK_STEEL},
            {"name": "stud_a", "from": [4.2, 10.5, 7.2], "to": [5, 15.5, 8.8], "color": STEEL},
            {"name": "stud_b", "from": [11, 10.5, 7.2], "to": [11.8, 15.5, 8.8], "color": STEEL},
            {"name": "stud_c", "from": [7.2, 10.5, 4.2], "to": [8.8, 15.5, 5], "color": STEEL},
            {"name": "stud_d", "from": [7.2, 10.5, 11], "to": [8.8, 15.5, 11.8], "color": STEEL},
        ],
    },
}

# Non-held "prop" models puppeted by Display entities (roll dodge streak + cinematic actors).
# These override item/paper.json instead of a vanilla tool, keyed by PropModelData's constants.
PROPS = {
    "roll_streak": {
        "custom_model_data": 9000,
        "pivot": [8, 8, 0],
        "parts": [
            {"name": "streak", "from": [7, 0, 7.9], "to": [9, 16, 8.1], "color": (200, 230, 255)},
        ],
    },
    "cinematic_knight": {
        "custom_model_data": 9100,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "legs", "from": [6, 0, 6], "to": [10, 6, 10], "color": DARK_STEEL},
            {"name": "body", "from": [6, 6, 6], "to": [10, 14, 10], "color": STEEL},
            {"name": "head", "from": [6.5, 14, 6.5], "to": [9.5, 17, 9.5], "color": (222, 196, 160)},
        ],
    },
    "cinematic_torch": {
        "custom_model_data": 9200,
        "pivot": [8, 0, 8],
        "parts": [
            {"name": "stick", "from": [7, 0, 7], "to": [9, 2, 9], "color": WOOD},
            {"name": "flame", "from": [6.5, 2, 6.5], "to": [9.5, 7, 9.5], "color": (255, 170, 40)},
        ],
    },
}

FACES = ["north", "east", "south", "west", "up", "down"]


def build_texture(parts):
    """One small swatch per part, stacked in a column; every face of that part samples its swatch."""
    swatch = 8
    img = Image.new("RGBA", (TEX_SIZE, max(TEX_SIZE, swatch * len(parts))), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    uv_by_part = {}
    for i, part in enumerate(parts):
        y0 = i * swatch
        color = part["color"]
        alpha = 255
        if part["name"] in ("streak",):
            alpha = 160
        draw.rectangle([0, y0, swatch - 1, y0 + swatch - 1], fill=(*shade(color, -30), alpha))
        draw.rectangle([1, y0 + 1, swatch - 2, y0 + swatch - 2], fill=(*color, alpha))
        draw.line([(1, y0 + 1), (swatch - 2, y0 + 1)], fill=(*shade(color, 45), alpha))
        uv_by_part[part["name"]] = (0, y0, swatch, y0 + swatch)
    return img, uv_by_part


def png_data_uri(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def build_elements(parts, uv_by_part, pose=None):
    elements = []
    ids = {}
    for part in parts:
        eid = new_uuid()
        ids[part["name"]] = eid
        u0, v0, u1, v1 = uv_by_part[part["name"]]
        faces = {f: {"uv": [u0, v0, u1, v1], "texture": 0} for f in FACES}
        el = {
            "name": part["name"],
            "from": part["from"],
            "to": part["to"],
            "autouv": 0,
            "color": 0,
            "origin": part["from"],
            "faces": faces,
            "type": "cube",
            "uuid": eid,
        }
        elements.append(el)
    return elements, ids


def apply_pose(elements, pivot, angle, axis):
    if angle == 0:
        return
    for el in elements:
        el["rotation"] = {"angle": angle, "axis": axis, "origin": pivot}


def build_bbmodel(tool_name, definition):
    parts = definition["parts"]
    img, uv_by_part = build_texture(parts)
    elements, ids = build_elements(parts, uv_by_part)

    group_uuid = new_uuid()
    tex_uuid = new_uuid()

    # A short illustrative "swing" preview animation on the whole-tool group, authored the same
    # way you would refine it by hand in Blockbench's Animation tab.
    animators = {
        group_uuid: {
            "name": tool_name,
            "type": "bone",
            "keyframes": [
                {"channel": "rotation", "data_points": [{"x": "-45", "y": "0", "z": "0"}],
                 "time": 0, "uuid": new_uuid(), "interpolation": "linear"},
                {"channel": "rotation", "data_points": [{"x": "45", "y": "0", "z": "0"}],
                 "time": 0.4, "uuid": new_uuid(), "interpolation": "linear"},
                {"channel": "rotation", "data_points": [{"x": "0", "y": "0", "z": "0"}],
                 "time": 0.6, "uuid": new_uuid(), "interpolation": "linear"},
            ],
        }
    }

    model = {
        "meta": {"format_version": "4.10", "model_format": "free", "box_uv": False},
        "name": tool_name,
        "model_identifier": f"{NAMESPACE}:{tool_name}",
        "visible_box": [1, 1, 0],
        "resolution": {"width": TEX_SIZE, "height": img.height},
        "elements": elements,
        "outliner": [
            {"name": tool_name, "origin": definition["pivot"], "uuid": group_uuid,
             "children": [ids[p["name"]] for p in parts]}
        ],
        "textures": [
            {"path": "", "name": f"{tool_name}.png", "folder": "item", "namespace": "",
             "id": "0", "particle": True, "uuid": tex_uuid,
             "relative_path": f"../resourcepack/assets/{NAMESPACE}/textures/item/{tool_name}.png",
             "source": png_data_uri(img)}
        ],
        "animations": [
            {"uuid": new_uuid(), "name": "swing", "loop": "once", "override": False,
             "length": 0.6, "snapping": 24, "animators": animators}
        ],
    }

    os.makedirs(BLOCKBENCH_DIR, exist_ok=True)
    with open(os.path.join(BLOCKBENCH_DIR, f"{tool_name}.bbmodel"), "w") as f:
        json.dump(model, f, indent=2)

    return img, uv_by_part, parts


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def build_frame_models(tool_name, parts, uv_by_part, pivot):
    """One resource-pack item model per animation frame, each a static snapshot of the pose."""
    for frame_name, cmd_offset in FRAMES.items():
        elements, _ = build_elements(parts, uv_by_part)
        angle, axis = FRAME_POSE[frame_name]
        apply_pose(elements, pivot, angle, axis)
        model = {
            "parent": "item/handheld",
            "textures": {"layer0": f"{NAMESPACE}:item/{tool_name}"},
            "elements": elements,
        }
        write_json(os.path.join(PACK_DIR, "assets", NAMESPACE, "models", "item",
                                 f"{tool_name}_{frame_name}.json"), model)


def build_vanilla_override(material_item, tool_name, model_base):
    """
    Rewrites (fully replaces) a vanilla tool's own item model to add AnimateCore's frame
    overrides on top of its untouched default look.

    IMPORTANT ordering note: Java Edition's `custom_model_data` predicate matches when
    itemCustomModelData >= predicateValue, and overrides are scanned top-to-bottom with the
    FIRST match winning. To make each frame value select an EXACT, distinct model (rather than
    every higher frame also matching a lower threshold first), the entries below are sorted
    DESCENDING by CustomModelData - highest/most-specific frame checked first, idle (no
    override matches, CustomModelData 0/absent) falling through to the untouched base model.
    """
    overrides = []
    for frame_name, offset in sorted(FRAMES.items(), key=lambda kv: -kv[1]):
        if offset == IDLE:
            continue
        overrides.append({
            "predicate": {"custom_model_data": model_base + offset},
            "model": f"{NAMESPACE}:item/{tool_name}_{frame_name}",
        })

    model = {
        "parent": "item/handheld",
        "textures": {"layer0": f"item/{material_item}"},
        "overrides": overrides,
    }
    write_json(os.path.join(PACK_DIR, "assets", "minecraft", "models", "item", f"{material_item}.json"), model)


MATERIAL_TOOLS = {
    "sword": ["wooden_sword", "stone_sword", "iron_sword", "golden_sword", "diamond_sword", "netherite_sword"],
    "axe": ["wooden_axe", "stone_axe", "iron_axe", "golden_axe", "diamond_axe", "netherite_axe"],
    "pickaxe": ["wooden_pickaxe", "stone_pickaxe", "iron_pickaxe", "golden_pickaxe", "diamond_pickaxe", "netherite_pickaxe"],
    "shovel": ["wooden_shovel", "stone_shovel", "iron_shovel", "golden_shovel", "diamond_shovel", "netherite_shovel"],
    "hoe": ["wooden_hoe", "stone_hoe", "iron_hoe", "golden_hoe", "diamond_hoe", "netherite_hoe"],
    "spear": ["trident"],
    "mace": ["mace"],
}


def build_prop(prop_name, definition):
    parts = definition["parts"]
    img, uv_by_part = build_texture(parts)
    tex_path = os.path.join(PACK_DIR, "assets", NAMESPACE, "textures", "item", f"{prop_name}.png")
    os.makedirs(os.path.dirname(tex_path), exist_ok=True)
    img.save(tex_path)

    elements, ids = build_elements(parts, uv_by_part)
    model = {
        "parent": "item/generated",
        "textures": {"layer0": f"{NAMESPACE}:item/{prop_name}"},
        "elements": elements,
    }
    write_json(os.path.join(PACK_DIR, "assets", NAMESPACE, "models", "item", f"{prop_name}.json"), model)

    # Blockbench source for the prop too, so every model in the pack has an editable origin.
    group_uuid = new_uuid()
    bb = {
        "meta": {"format_version": "4.10", "model_format": "free", "box_uv": False},
        "name": prop_name,
        "resolution": {"width": TEX_SIZE, "height": img.height},
        "elements": elements,
        "outliner": [{"name": prop_name, "origin": definition["pivot"], "uuid": group_uuid,
                       "children": [ids[p["name"]] for p in parts]}],
        "textures": [{"path": "", "name": f"{prop_name}.png", "folder": "item", "namespace": "",
                       "id": "0", "particle": True, "uuid": new_uuid(), "source": png_data_uri(img)}],
    }
    write_json(os.path.join(BLOCKBENCH_DIR, f"{prop_name}.bbmodel"), bb)
    return prop_name


def main():
    for tool_name, definition in TOOLS.items():
        img, uv_by_part, parts = build_bbmodel(tool_name, definition)
        tex_path = os.path.join(PACK_DIR, "assets", NAMESPACE, "textures", "item", f"{tool_name}.png")
        os.makedirs(os.path.dirname(tex_path), exist_ok=True)
        img.save(tex_path)

        build_frame_models(tool_name, parts, uv_by_part, definition["pivot"])
        for material_item in MATERIAL_TOOLS[tool_name]:
            build_vanilla_override(material_item, tool_name, definition["model_base"])

        print(f"built {tool_name}: {len(parts)} parts, {len(MATERIAL_TOOLS[tool_name])} material override(s)")

    for prop_name, definition in PROPS.items():
        build_prop(prop_name, definition)
        print(f"built prop {prop_name}")

    # paper.json needs the prop overrides added on top of vanilla paper's own (plain) model.
    overrides = [{"predicate": {"custom_model_data": d["custom_model_data"]}, "model": f"{NAMESPACE}:item/{name}"}
                 for name, d in sorted(PROPS.items(), key=lambda kv: -kv[1]["custom_model_data"])]
    write_json(os.path.join(PACK_DIR, "assets", "minecraft", "models", "item", "paper.json"), {
        "parent": "item/generated",
        "textures": {"layer0": "item/paper"},
        "overrides": overrides,
    })
    print("built paper.json prop overrides")


if __name__ == "__main__":
    main()
