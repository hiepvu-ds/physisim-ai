"""
PhysiSim AI — Procedural Scene Generation Backend Module
Generates Hospital and Factory XML MJCF files and waypoint path configurations.
"""

import random
import math
from typing import Dict, Any, List

def generate_hospital_mjcf(config: Dict[str, Any]) -> str:
    """
    Generates a MuJoCo XML (MJCF) string representing a procedural hospital scene.
    Config parameters:
        floors: int
        roomsPerFloor: int
        roomW: float
        roomD: float
        ceilH: float
        types: Dict[str, float]  # room type distribution percents
        npcCount: int
    """
    floors = int(config.get("floors", 3))
    rooms_per_floor = int(config.get("roomsPerFloor", 20))
    room_w = float(config.get("roomW", 4.0))
    room_d = float(config.get("roomD", 8.0))
    ceil_h = float(config.get("ceilH", 3.0))
    npc_count = int(config.get("npcCount", 30))
    
    types = config.get("types", {"patient": 60, "surgery": 10, "icu": 10, "corridor": 20})
    
    cols = math.ceil(math.sqrt(rooms_per_floor))
    
    # MJCF header
    mjcf = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<mujoco model="procedural_hospital">',
        '  <compiler angle="radian" coordinate="local"/>',
        '  <option timestep="0.002" gravity="0 -9.81 0"/>',
        '  <worldbody>',
        '    <light directional="true" diffuse=".6 .6 .6" specular="0.2 0.2 0.2" pos="0 10 0" dir="0 -1 0"/>',
        '    <geom name="ground" type="plane" size="100 100 0.1" rgba="0.3 0.3 0.3 1" friction="0.6"/>'
    ]
    
    body_idx = 0
    
    for f in range(floors):
        base_y = f * (ceil_h + 0.2)
        
        # Floor slab
        mjcf.append(f'    <body name="floor_slab_{f}" pos="{(cols * room_w) / 2 - room_w} {base_y - 0.075} {(cols * room_d) / 2}">')
        mjcf.append(f'      <geom type="box" size="{(cols * room_w) / 2} 0.075 {(cols * room_d) / 2 + 1}" rgba="0.9 0.9 0.9 1" friction="0.6"/>')
        mjcf.append('    </body>')
        
        for r in range(rooms_per_floor):
            col = r % cols
            row = r // cols
            px = col * room_w
            pz = row * room_d
            
            # Select room type based on probability distribution
            rand_val = random.random() * 100
            cumulative = 0.0
            room_type = "patient"
            for k, v in types.items():
                cumulative += v
                if rand_val < cumulative:
                    room_type = k
                    break
            
            # Wall properties
            rgba_map = {
                "patient": "0.22 0.74 0.97 1",
                "surgery": "0.93 0.26 0.26 1",
                "icu": "0.96 0.62 0.04 1",
                "corridor": "0.39 0.45 0.54 1"
            }
            rgba = rgba_map.get(room_type, "0.5 0.5 0.5 1")
            
            # Back Wall
            mjcf.append(f'    <body name="room_{f}_{r}_backwall" pos="{px + room_w/2} {base_y + ceil_h/2} {pz}">')
            mjcf.append(f'      <geom type="box" size="{room_w/2} {ceil_h/2} 0.06" rgba="{rgba}"/>')
            mjcf.append('    </body>')
            
            # Left Wall
            mjcf.append(f'    <body name="room_{f}_{r}_leftwall" pos="{px} {base_y + ceil_h/2} {pz + room_d/2}">')
            mjcf.append(f'      <geom type="box" size="0.06 {ceil_h/2} {room_d/2}" rgba="{rgba}"/>')
            mjcf.append('    </body>')
            
            # Room Equipments
            cx, cy, cz = px + room_w/2, base_y, pz + room_d/2
            if room_type == "patient":
                # Bed
                mjcf.append(f'    <body name="bed_{f}_{r}" pos="{cx - 0.3} {cy + 0.35} {cz}">')
                mjcf.append('      <geom type="box" size="0.45 0.35 1.0" rgba="0.22 0.74 0.97 1" mass="50"/>')
                mjcf.append('      <joint type="free"/>')
                mjcf.append('    </body>')
                # Monitor
                mjcf.append(f'    <body name="monitor_{f}_{r}" pos="{cx + 0.7} {cy + 0.6} {cz - 0.5}">')
                mjcf.append('      <geom type="box" size="0.15 0.4 0.15" rgba="0.06 0.09 0.16 1" mass="10"/>')
                mjcf.append('      <joint type="free"/>')
                mjcf.append('    </body>')
            elif room_type == "surgery":
                # Operating Table
                mjcf.append(f'    <body name="optable_{f}_{r}" pos="{cx} {cy + 0.6} {cz}">')
                mjcf.append('      <geom type="box" size="0.35 0.3 1.0" rgba="0.88 0.91 0.94 1" mass="150"/>')
                mjcf.append('      <joint type="free"/>')
                mjcf.append('    </body>')
            elif room_type == "icu":
                # ICU Bed
                mjcf.append(f'    <body name="icubed_{f}_{r}" pos="{cx} {cy + 0.3} {cz}">')
                mjcf.append('      <geom type="box" size="0.45 0.15 1.0" rgba="0.22 0.74 0.97 1" mass="60"/>')
                mjcf.append('      <joint type="free"/>')
                mjcf.append('    </body>')

    # Close tags
    mjcf.append('  </worldbody>')
    mjcf.append('</mujoco>')
    
    return "\n".join(mjcf)


def generate_factory_mjcf(config: Dict[str, Any]) -> str:
    """
    Generates a MuJoCo XML (MJCF) string representing a procedural factory scene.
    Config parameters:
        areaW: float
        areaD: float
        ceilH: float
        zones: Dict[str, float]
        conveyors: int
        npcCount: int
    """
    w = float(config.get("areaW", 50.0))
    d = float(config.get("areaD", 100.0))
    h = float(config.get("ceilH", 8.0))
    conveyors_count = int(config.get("conveyors", 6))
    zones = config.get("zones", {"assembly": 40, "storage": 30, "qc": 20, "loading": 10})
    
    mjcf = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<mujoco model="procedural_factory">',
        '  <compiler angle="radian" coordinate="local"/>',
        '  <option timestep="0.002" gravity="0 -9.81 0"/>',
        '  <worldbody>',
        '    <light directional="true" diffuse=".6 .6 .6" specular="0.2 0.2 0.2" pos="0 20 0" dir="0 -1 0"/>',
        '    <geom name="ground" type="plane" size="150 150 0.1" rgba="0.2 0.2 0.2 1" friction="0.7"/>',
        f'    <body name="floor" pos="{w/2} 0 {d/2}">',
        f'      <geom type="box" size="{w/2} 0.1 {d/2}" rgba="0.21 0.25 0.32 1"/>',
        '    </body>'
    ]
    
    z_start = 0.0
    for zone, pct in zones.items():
        z_d = d * (pct / 100.0)
        
        rgba_map = {
            "assembly": "0.96 0.62 0.11 1",
            "storage": "0.39 0.45 0.54 1",
            "qc": "0.06 0.72 0.5 1",
            "loading": "0.93 0.26 0.26 1"
        }
        rgba = rgba_map.get(zone, "0.5 0.5 0.5 1")
        
        # Draw zone floor boundary
        mjcf.append(f'    <body name="zone_{zone}" pos="{w/2} 0.11 {z_start + z_d/2}">')
        mjcf.append(f'      <geom type="box" size="{w/2} 0.01 {z_d/2}" rgba="{rgba}"/>')
        mjcf.append('    </body>')
        
        if zone == "assembly":
            for i in range(conveyors_count):
                cx = 3.0 + i * (w - 6.0) / max(conveyors_count - 1, 1)
                # Conveyor structure
                mjcf.append(f'    <body name="conveyor_{i}" pos="{cx} 0.5 {z_start + z_d*0.4}">')
                mjcf.append(f'      <geom type="box" size="0.4 0.25 {z_d*0.4}" rgba="0.11 0.16 0.23 1"/>')
                mjcf.append('    </body>')
                # Boxes on conveyor
                for b in range(3):
                    mjcf.append(f'    <body name="box_{i}_{b}" pos="{cx} 0.95 {z_start + 1.0 + b*z_d*0.2}">')
                    mjcf.append('      <geom type="box" size="0.15 0.15 0.15" rgba="0.85 0.46 0.02 1" mass="5"/>')
                    mjcf.append('      <joint type="free"/>')
                    mjcf.append('    </body>')
                    
        elif zone == "storage":
            for r in range(4):
                for col in range(6):
                    rx = 2.0 + col * (w - 4.0) / 5
                    rz = z_start + 1.0 + r * (z_d - 2.0) / 3
                    mjcf.append(f'    <body name="rack_{r}_{col}" pos="{rx} 1.5 {rz}">')
                    mjcf.append('      <geom type="box" size="0.5 1.5 0.05" rgba="0.27 0.33 0.41 1" mass="200"/>')
                    mjcf.append('    </body>')
                    
        z_start += z_d
        
    mjcf.append('  </worldbody>')
    mjcf.append('</mujoco>')
    
    return "\n".join(mjcf)
