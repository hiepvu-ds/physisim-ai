# PhysiSim AI — API Reference

## Base URL

```
https://<ngrok-subdomain>.ngrok-free.app
```

---

## Endpoints

### `GET /api/status`

Health check. Frontend dùng để kiểm tra kết nối.

**Response:**
```json
{
  "status": "ok",
  "engine": "mujoco",
  "gpu_available": true,
  "buffer_size": 42,
  "uptime_s": 183.4
}
```

---

### `POST /api/step`

Execute one physics simulation step.

**Request Body:**
```json
{
  "pos_x":   0.0,
  "pos_y":   1.2,
  "pos_z":   0.0,
  "roll":    0.0,
  "pitch":   0.0,
  "yaw":     0.0,
  "gripper": 0.75
}
```

| Field | Type | Range | Mô tả |
|-------|------|-------|-------|
| `pos_x` | float | `-2.5 ~ 2.5` | X position (meters) |
| `pos_y` | float | `0.3 ~ 3.5` | Y position (meters) |
| `pos_z` | float | `-2.5 ~ 2.5` | Z position (meters) |
| `roll` | float | `-180 ~ 180` | Roll (degrees) |
| `pitch` | float | `-180 ~ 180` | Pitch (degrees) |
| `yaw` | float | `-180 ~ 180` | Yaw (degrees) |
| `gripper` | float | `0.0 ~ 1.0` | 0=open, 1=fully closed |

**Response:**
```json
{
  "success": true,
  "end_effector_pose": [0.0, 1.2, 0.0],
  "joint_angles": [0.0, 24.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  "tactile_force": 2.63,
  "buffer_size": 43,
  "compute_ms": 3.14,
  "message": "Physics step executed in 3.14ms"
}
```

---

### `POST /api/export`

Export trajectory buffer to dataset file.

**Request Body:**
```json
{
  "format": "lerobot",
  "channels": {
    "rgb_d": true,
    "pose_6dof": true,
    "tactile_force": true,
    "joint_torques": false
  }
}
```

| Format | Mô tả |
|--------|-------|
| `lerobot` | LeRobot / HuggingFace HDF5 (.h5) |
| `rlds` | RLDS (Google DeepMind standard) |
| `ros2` | ROS2 Bag (.db3) |

**Response:**
```json
{
  "success": true,
  "file_path": "/tmp/physisim_dataset_1234567890.h5",
  "steps": 100
}
```

---

### `GET /api/buffer`

Get metadata about current trajectory buffer.

**Response:**
```json
{
  "buffer_size": 100,
  "first_timestamp": 1720000000.0,
  "last_timestamp": 1720000050.5
}
```

---

### `DELETE /api/reset`

Clear trajectory buffer and reset session.

**Response:**
```json
{
  "message": "Session reset. 100 steps cleared."
}
```

---

## Error Codes

| Code | Mô tả |
|------|-------|
| `400` | Bad request (invalid params, empty buffer) |
| `422` | Validation error (out of range values) |
| `500` | Internal server error (engine crash) |

---

## Swagger UI

Khi server đang chạy:
```
http://localhost:8000/docs      # Swagger
http://localhost:8000/redoc     # ReDoc
```
