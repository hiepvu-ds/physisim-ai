/**
 * PhysiSim AI — API Client
 * Handles all communication with Colab FastAPI backend
 */

let apiBaseUrl = CONFIG.COLAB_API_URL;
let isConnected = false;
let stepCount = 0;
let latencyMs = 0;

// Headers mặc định — bypass ngrok browser warning page
const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

/* ─── Connection Management ─── */

async function connectAPI() {
  const inputUrl = document.getElementById('apiUrlInput').value.trim();
  if (inputUrl) apiBaseUrl = inputUrl.replace(/\/$/, '');

  if (!apiBaseUrl) {
    addLog('⚠ No API URL provided. Enter ngrok/Cloudflare URL first.', 'warn');
    return;
  }

  setConnectionStatus('connecting');
  addLog(`Connecting to ${apiBaseUrl} ...`, 'info');

  try {
    const t0 = performance.now();
    const res = await fetch(`${apiBaseUrl}${CONFIG.ENDPOINTS.status}`, {
      headers: BASE_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    latencyMs = Math.round(performance.now() - t0);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      isConnected = true;
      setConnectionStatus('connected');
      document.getElementById('modeDisplay').textContent = 'Live';
      document.getElementById('modeDisplay').style.color = '#10b981';
      addLog(`✅ Connected! Latency: ${latencyMs}ms | Engine: ${data.physics_engine || 'unknown'}`, 'ok');
      updateLatencyDisplay();
    } else if (res.status === 404) {
      // ngrok tunnel alive but FastAPI not running
      throw new Error(`HTTP 404 — Tunnel alive but backend offline`);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    isConnected = false;
    setConnectionStatus('disconnected');

    // ── Smart error diagnosis ──
    const msg = err.message;
    if (msg.includes('404') || msg.includes('offline')) {
      addLog(`❌ Tunnel alive but FastAPI backend is DOWN`, 'error');
      addLog(`💡 Fix: In Colab, re-run Cell 4 (uvicorn) then Cell 5 (tunnel)`, 'warn');
    } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('net::')) {
      addLog(`❌ Cannot reach tunnel — ngrok/Cloudflare URL may have expired`, 'error');
      addLog(`💡 Fix: Re-run Cell 5 in Colab to get a fresh tunnel URL`, 'warn');
    } else if (msg.includes('timeout') || msg.includes('AbortError')) {
      addLog(`❌ Connection timed out (8s) — backend too slow to respond`, 'error');
      addLog(`💡 Fix: Check Colab GPU is active (Runtime → Change runtime type → T4 GPU)`, 'warn');
    } else {
      addLog(`❌ Connection failed: ${msg}`, 'error');
      addLog(`💡 Check Colab notebook and run backend_status() to diagnose`, 'warn');
    }
  }
}

function setConnectionStatus(state) {
  const dot = document.querySelector('#apiStatus .dot');
  const text = document.getElementById('statusText');
  dot.className = 'dot';
  if (state === 'connected') {
    dot.classList.add('dot--green');
    text.textContent = `API: Connected (${latencyMs}ms)`;
  } else if (state === 'connecting') {
    dot.classList.add('dot--amber');
    text.textContent = 'API: Connecting...';
  } else {
    dot.classList.add('dot--red');
    text.textContent = 'API: Disconnected';
  }
}

/* ─── Physics Step ─── */

async function triggerStep() {
  if (!isConnected) {
    runMockStep();
    return;
  }

  const payload = {
    pos_x:   parseFloat(document.getElementById('posX').value),
    pos_y:   parseFloat(document.getElementById('posY').value),
    pos_z:   parseFloat(document.getElementById('posZ').value),
    roll:    parseFloat(document.getElementById('roll').value),
    pitch:   parseFloat(document.getElementById('pitch').value),
    yaw:     parseFloat(document.getElementById('yaw').value),
    gripper: parseFloat(document.getElementById('gripSlider').value) / 100,
  };

  const btn = document.getElementById('runBtn');
  btn.disabled = true;

  try {
    const t0 = performance.now();
    const res = await fetch(`${apiBaseUrl}${CONFIG.ENDPOINTS.step}`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    latencyMs = Math.round(performance.now() - t0);

    const data = await res.json();
    if (data.success) {
      stepCount++;
      handleStepResponse(data);
      addLog(`✅ Step ${stepCount} OK | F=${data.tactile_force?.toFixed(2)}N | ${latencyMs}ms`, 'ok');
    } else {
      addLog(`❌ Step failed: ${data.message}`, 'error');
    }
  } catch (err) {
    addLog(`❌ Request error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    updateLatencyDisplay();
  }
}

function handleStepResponse(data) {
  // Update pose display
  if (data.end_effector_pose) {
    document.getElementById('poseX').textContent = data.end_effector_pose[0]?.toFixed(3) ?? '—';
    document.getElementById('poseY').textContent = data.end_effector_pose[1]?.toFixed(3) ?? '—';
    document.getElementById('poseZ').textContent = data.end_effector_pose[2]?.toFixed(3) ?? '—';
  }
  if (data.tactile_force !== undefined) {
    document.getElementById('poseF').textContent = data.tactile_force.toFixed(2);
    pushForceData(data.tactile_force);
  }
  // Update wrist camera frame if offscreen render is received
  if (data.wrist_cam_image && typeof updateWristCamFrame === 'function') {
    updateWristCamFrame(data.wrist_cam_image);
  }
  // Update joint angle readout bars
  if (data.joint_angles && typeof updateJointReadout === 'function') {
    updateJointReadout(data.joint_angles);
  }
  // Update session info
  document.getElementById('stepCount').textContent = stepCount;
  document.getElementById('bufferSize').textContent = `${data.buffer_size ?? 0} ep`;
  // Mode indicator
  const modeEl = document.getElementById('modeDisplay');
  if (modeEl) {
    const isReal = data.compute_ms !== undefined;
    modeEl.textContent = isReal ? `Live (${data.compute_ms}ms)` : 'Mock';
    modeEl.style.color = isReal ? '#10b981' : '#f59e0b';
  }
}

/* ─── Export API & Hugging Face Hub ─── */

async function requestExport(format, channels) {
  const res = await fetch(`${apiBaseUrl}${CONFIG.ENDPOINTS.export}`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ format, channels }),
    signal: AbortSignal.timeout(60000),
  });
  return await res.json();
}

async function pushToHF() {
  const repoId = document.getElementById('hfRepoId')?.value.trim();
  const token = document.getElementById('hfToken')?.value.trim();
  if (!repoId) {
    addLog('⚠ Please enter a Hugging Face Repo ID (e.g. username/my-dataset)', 'warn');
    return;
  }
  addLog(`🤗 Uploading dataset to Hugging Face: ${repoId}...`, 'info');
  try {
    const res = await fetch(`${apiBaseUrl}/api/upload/hf`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({ repo_id: repoId, token: token || 'hf_mock_token' })
    });
    const data = await res.json();
    if (data.success) {
      addLog(`🎉 Pushed to HF Hub! ${data.repo_url}`, 'ok');
    } else {
      addLog(`❌ HF Upload error: ${data.message || data.detail}`, 'error');
    }
  } catch (err) {
    addLog(`❌ Upload request failed: ${err.message}`, 'error');
  }
}
window.pushToHF = pushToHF;

async function importURDF(content, robotName = 'custom_robot') {
  addLog(`🤖 Parsing URDF '${robotName}'...`, 'info');
  try {
    const res = await fetch(`${apiBaseUrl}/api/import/urdf`, {
      method: 'POST',
      headers: BASE_HEADERS,
      body: JSON.stringify({ urdf_content: content, robot_name: robotName })
    });
    const data = await res.json();
    if (data.success) {
      addLog(`✅ Custom Robot Imported: ${data.robot_name} (${data.dof} DoF, ${data.links_count} links)`, 'ok');
      return data;
    } else {
      addLog(`❌ URDF Parse error: ${data.detail}`, 'error');
    }
  } catch (err) {
    addLog(`❌ URDF request error: ${err.message}`, 'error');
  }
}
window.importURDF = importURDF;

/* ─── Utility ─── */

function updateLatencyDisplay() {
  const el = document.getElementById('latency');
  if (el) el.textContent = latencyMs > 0 ? `${latencyMs}ms` : '—';
}

function addLog(message, type = 'info') {
  const box = document.getElementById('logBox');
  if (!box) return;
  const entry = document.createElement('div');
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  entry.className = `log-entry log--${type}`;
  entry.textContent = `[${time}] ${message}`;
  box.appendChild(entry);
  box.scrollTop = box.scrollHeight;

  // Keep max 50 entries
  while (box.children.length > 50) box.removeChild(box.firstChild);
}

function resetPose() {
  const d = CONFIG.DEFAULT_POSE;
  document.getElementById('posX').value = d.x;
  document.getElementById('posY').value = d.y;
  document.getElementById('posZ').value = d.z;
  document.getElementById('roll').value = d.roll;
  document.getElementById('pitch').value = d.pitch;
  document.getElementById('yaw').value = d.yaw;
  document.getElementById('gripSlider').value = d.gripper;
  updateAllDisplayValues();
  if (typeof resetJoints === 'function') resetJoints();
  addLog('↺ All controls reset to default', 'info');
}

/* ─── Mock Step (no API) ─── */
function runMockStep() {
  const grip = parseFloat(document.getElementById('gripSlider').value) / 100;
  const force = parseFloat((grip * 3.5 + Math.random() * 0.3).toFixed(2));
  const mockJoints = [0,1,2,3,4,5,6].map(i => parseFloat((Math.random() * 20 - 10).toFixed(1)));
  stepCount++;
  pushForceData(force);
  if (typeof updateJointReadout === 'function') updateJointReadout(mockJoints);
  document.getElementById('poseF').textContent = force.toFixed(2);
  document.getElementById('stepCount').textContent = stepCount;
  addLog(`🧪 Mock step ${stepCount} | F=${force}N (no API)`, 'warn');
}

