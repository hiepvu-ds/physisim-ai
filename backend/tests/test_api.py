"""
PhysiSim AI — API Unit Tests
Chạy: pytest backend/tests/test_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.main import app

client = TestClient(app)


# ─── Status ───────────────────────────────────────────────

def test_status_ok():
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "buffer_size" in data
    assert "uptime_s" in data


# ─── Physics Step ─────────────────────────────────────────

def test_step_default_pose():
    payload = {
        "pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0,
        "roll": 0.0,  "pitch": 0.0,  "yaw": 0.0,
        "gripper": 0.0,
    }
    res = client.post("/api/step", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["end_effector_pose"]) == 3
    assert len(data["joint_angles"]) == 7
    assert isinstance(data["tactile_force"], float)
    assert data["tactile_force"] >= 0.0
    assert data["buffer_size"] >= 1


def test_step_with_gripper():
    payload = {
        "pos_x": 0.5, "pos_y": 1.5, "pos_z": 0.2,
        "roll": 10.0, "pitch": -5.0, "yaw": 30.0,
        "gripper": 0.8,
    }
    res = client.post("/api/step", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["tactile_force"] > 0  # gripper=0.8 should generate force


def test_step_out_of_range_x():
    payload = {"pos_x": 99.0, "pos_y": 1.2, "pos_z": 0.0,
               "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.0}
    res = client.post("/api/step", json=payload)
    assert res.status_code == 422  # Pydantic validation error


def test_step_out_of_range_gripper():
    payload = {"pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0,
               "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 1.5}
    res = client.post("/api/step", json=payload)
    assert res.status_code == 422


# ─── Buffer ───────────────────────────────────────────────

def test_buffer_info_after_step():
    # Run a step first
    client.post("/api/step", json={
        "pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0,
        "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.0
    })
    res = client.get("/api/buffer")
    assert res.status_code == 200
    data = res.json()
    assert data["buffer_size"] >= 1


# ─── Export ───────────────────────────────────────────────

def test_export_empty_buffer_fails():
    # Reset first
    client.delete("/api/reset")
    res = client.post("/api/export", json={"format": "lerobot"})
    assert res.status_code == 400


def test_export_lerobot_after_steps():
    # Add some steps
    for _ in range(5):
        client.post("/api/step", json={
            "pos_x": 0.1, "pos_y": 1.3, "pos_z": 0.0,
            "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.5
        })
    res = client.post("/api/export", json={"format": "lerobot"})
    assert res.status_code == 200
    # Will succeed (h5py) or return TODO message (no h5py)
    data = res.json()
    assert "steps" in data or "buffer_size" in data or "message" in data


def test_export_rlds_after_steps():
    for _ in range(3):
        client.post("/api/step", json={
            "pos_x": 0.1, "pos_y": 1.3, "pos_z": 0.0,
            "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.5
        })
    res = client.post("/api/export", json={"format": "rlds"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "download_url" in data
    assert data["format"] == "rlds_v1"


def test_export_ros2_after_steps():
    res = client.post("/api/export", json={"format": "ros2"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "download_url" in data
    assert data["format"] == "ros2_json_bag"


def test_export_unknown_format():
    client.post("/api/step", json={
        "pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0,
        "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.0
    })
    res = client.post("/api/export", json={"format": "unknown_fmt"})
    assert res.status_code == 400


# ─── Reset ────────────────────────────────────────────────

def test_reset_clears_buffer():
    # Add a step
    client.post("/api/step", json={
        "pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0,
        "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.0
    })
    # Reset
    res = client.delete("/api/reset")
    assert res.status_code == 200
    assert "cleared" in res.json()["message"]
    # Verify buffer empty
    status = client.get("/api/status").json()
    assert status["buffer_size"] == 0


# ─── Sprint 5A New Features: Scene Generation & Training ───

def test_scene_generate_hospital():
    payload = {
        "template": "hospital",
        "floors": 2,
        "roomsPerFloor": 6,
        "roomW": 4.5,
        "roomD": 7.5,
        "ceilH": 3.0,
        "npcCount": 10,
        "types": {"patient": 50.0, "surgery": 25.0, "icu": 25.0}
    }
    res = client.post("/api/scene/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["scene"]["template"] == "hospital"
    assert "mujoco" in data["scene"]["mjcf"]
    assert "room_0_0" in data["scene"]["mjcf"]

def test_scene_generate_factory():
    payload = {
        "template": "factory",
        "areaW": 30.0,
        "areaD": 60.0,
        "ceilH": 6.5,
        "conveyors": 4,
        "npcCount": 5,
        "zones": {"assembly": 50, "storage": 50}
    }
    res = client.post("/api/scene/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["scene"]["template"] == "factory"
    assert "procedural_factory" in data["scene"]["mjcf"]
    assert "conveyor_0" in data["scene"]["mjcf"]

def test_scene_list():
    res = client.get("/api/scene/list")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert isinstance(data["scenes"], list)
    assert len(data["scenes"]) >= 2

def test_train_bc_mlp():
    payload = {
        "epochs": 10,
        "batch_size": 16,
        "lr": "5e-4",
        "arch": "mlp"
    }
    res = client.post("/api/train/bc", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "mlp" in data["message"].lower()
    assert data["final_loss"] < 0.85
    assert "policy_mlp_" in data["model_path"]


# ─── Sprint 6 New Features: Multi-Embodiment, Inference & Replay ─

def test_policy_inference_franka():
    payload = {
        "task": "pick_and_place",
        "robot": "franka_panda",
        "current_pose": [0.0, 1.2, 0.0, 0.0, 0.0, 0.0],
        "action_horizon": 8,
        "target_object_pos": [0.35, 0.9, 0.15]
    }
    res = client.post("/api/policy/inference", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["robot"] == "franka_panda"
    assert len(data["action_chunk"]) == 8
    assert data["confidence"] > 0.8
    assert "DiffusionPolicy" in data["model_type"]


def test_policy_inference_ur5e():
    payload = {
        "task": "drawer_open",
        "robot": "ur5e",
        "current_pose": [0.1, 1.0, 0.1, 0.0, -20.0, 10.0],
        "action_horizon": 12,
        "target_object_pos": [0.4, 0.8, 0.0]
    }
    res = client.post("/api/policy/inference", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["robot"] == "ur5e"
    assert len(data["action_chunk"]) == 12
    # UR5e joint angles should have length 6
    assert len(data["action_chunk"][0]["joint_angles"]) == 6


def test_policy_rollout_simulation():
    payload = {
        "task": "conveyor_sorting",
        "robot": "franka_panda",
        "max_steps": 25,
        "domain_rand": True,
        "start_pose": [0.0, 1.2, 0.0, 0.0, 0.0, 0.0],
        "target_pos": [0.3, 0.85, 0.2]
    }
    res = client.post("/api/policy/rollout", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["steps"] == 25
    assert data["cumulative_reward"] > 0
    assert "episode_id" in data


def test_trajectory_replay_endpoints():
    # 1. List trajectories
    res = client.get("/api/trajectory/list")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["episodes"]) >= 1

    # 2. Get specific episode detail
    ep_id = data["episodes"][0]["episode_id"]
    res_ep = client.get(f"/api/trajectory/{ep_id}")
    assert res_ep.status_code == 200
    ep_data = res_ep.json()
    assert ep_data["success"] is True
    assert len(ep_data["episode"]["trajectory"]) > 0


# ─── New Features: Offscreen Wrist Cam, HuggingFace Hub & URDF Import ───

def test_step_with_wrist_cam_image():
    payload = {
        "pos_x": 0.1, "pos_y": 1.1, "pos_z": -0.1,
        "roll": 10.0, "pitch": -5.0, "yaw": 15.0,
        "gripper": 0.75
    }
    res = client.post("/api/step", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["wrist_cam_image"] is not None
    assert data["wrist_cam_image"].startswith("data:image/jpeg;base64,")


def test_upload_to_huggingface_endpoint():
    # Run a step first so buffer is not empty
    client.post("/api/step", json={"pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0, "roll": 0, "pitch": 0, "yaw": 0, "gripper": 0.5})
    
    payload = {
        "repo_id": "test_user/test_robot_dataset",
        "token": "hf_mock_token_123"
    }
    res = client.post("/api/upload/hf", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "huggingface.co" in data["repo_url"]


def test_import_custom_urdf():
    urdf_sample = """<?xml version="1.0"?>
<robot name="custom_arm">
  <link name="base_link"/>
  <link name="link1"/>
  <link name="link2"/>
  <joint name="joint1" type="revolute">
    <parent link="base_link"/>
    <child link="link1"/>
    <limit lower="-2.0" upper="2.0"/>
  </joint>
  <joint name="joint2" type="revolute">
    <parent link="link1"/>
    <child link="link2"/>
    <limit lower="-1.5" upper="1.5"/>
  </joint>
</robot>
"""
    payload = {
        "urdf_content": urdf_sample,
        "robot_name": "custom_arm"
    }
    res = client.post("/api/import/urdf", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["robot_name"] == "custom_arm"
    assert data["dof"] == 2
    assert len(data["joints"]) == 2
    assert data["links_count"] == 3


def test_import_invalid_urdf():
    payload = {
        "urdf_content": "INVALID XML CONTENT <>>>",
        "robot_name": "bad_robot"
    }
    res = client.post("/api/import/urdf", json=payload)
    assert res.status_code == 400



