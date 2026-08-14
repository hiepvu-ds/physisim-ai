/**
 * PhysiSim AI — Autonomous Policy Rollout & Inference Module
 * Manages closed-loop Diffusion Policy / BC rollout simulation in 3D Viewport
 */

let isPolicyRunning = false;
let rolloutTimer = null;
let currentRolloutStep = 0;
let currentRolloutData = null;
let rolloutSpeed = 1.0;

function openPolicyModal() {
  const modal = document.getElementById('policyModal');
  if (modal) modal.classList.add('active');
}

function closePolicyModal() {
  const modal = document.getElementById('policyModal');
  if (modal) modal.classList.remove('active');
  pausePolicyRollout();
}

async function requestPolicyInferenceChunk() {
  const task = document.getElementById('policyTaskSelect')?.value || 'pick_and_place';
  const robot = document.getElementById('robotSelect')?.value || 'franka_panda';
  
  // Get current pose from sliders or robot
  const cx = parseFloat(document.getElementById('posX')?.value || 0.0);
  const cy = parseFloat(document.getElementById('posY')?.value || 1.2);
  const cz = parseFloat(document.getElementById('posZ')?.value || 0.0);
  const cr = parseFloat(document.getElementById('roll')?.value || 0.0);
  const cp = parseFloat(document.getElementById('pitch')?.value || 0.0);
  const cyaw = parseFloat(document.getElementById('yaw')?.value || 0.0);

  addLog(`🤖 Running Diffusion Policy inference for [${task}] on [${robot}]...`, 'info');

  try {
    const res = await fetch(`${apiBaseUrl}/api/policy/inference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: task,
        robot: robot,
        current_pose: [cx, cy, cz, cr, cp, cyaw],
        action_horizon: 12,
        target_object_pos: [0.35, 0.88, 0.15]
      })
    });

    if (res.ok) {
      const data = await res.json();
      addLog(`✨ Inference OK! Latency: ${data.latency_ms}ms | Confidence: ${(data.confidence*100).toFixed(1)}%`, 'ok');
      
      // Visualize predicted action chunk in 3D viewport
      if (window.renderTrajectoryGhosting) {
        window.renderTrajectoryGhosting(data.action_chunk);
      }

      // Update Policy UI metrics
      const confEl = document.getElementById('policyConfidence');
      if (confEl) confEl.textContent = `${(data.confidence * 100).toFixed(1)}%`;
      const latEl = document.getElementById('policyLatency');
      if (latEl) latEl.textContent = `${data.latency_ms} ms`;
      
      return data.action_chunk;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    addLog(`⚠ Policy inference fallback (local generator): ${err.message}`, 'warn');
    // Local simulation fallback
    const fallbackChunk = generateLocalActionChunk(task, [cx, cy, cz, cr, cp, cyaw]);
    if (window.renderTrajectoryGhosting) {
      window.renderTrajectoryGhosting(fallbackChunk);
    }
    return fallbackChunk;
  }
}

function generateLocalActionChunk(task, currPose) {
  const [cx, cy, cz, cr, cp, cyaw] = currPose;
  const chunk = [];
  const tx = 0.35, ty = 0.88, tz = 0.15;
  for (let i = 1; i <= 8; i++) {
    const a = i / 8.0;
    const lift = Math.sin(a * Math.PI) * 0.15;
    chunk.push({
      step_index: i,
      pos: [cx + (tx - cx) * a, cy + (ty - cy) * a + lift, cz + (tz - cz) * a],
      rpy: [cr, cp - 15 * a, cyaw + 10 * a],
      gripper: a > 0.5 ? 1.0 : 0.0,
      estimated_force: a > 0.5 ? 3.5 : 0.2
    });
  }
  return chunk;
}

async function startFullPolicyRollout() {
  const task = document.getElementById('policyTaskSelect')?.value || 'pick_and_place';
  const robot = document.getElementById('robotSelect')?.value || 'franka_panda';
  const domainRand = document.getElementById('policyDomainRand')?.checked || false;
  const maxSteps = parseInt(document.getElementById('policyStepsInput')?.value || '35', 10);

  addLog(`🚀 Initiating Autonomous Policy Rollout (${task}, ${maxSteps} steps)...`, 'info');

  try {
    const res = await fetch(`${apiBaseUrl}/api/policy/rollout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: task,
        robot: robot,
        max_steps: maxSteps,
        domain_rand: domainRand,
        start_pose: [0.0, 1.2, 0.0, 0.0, 0.0, 0.0],
        target_pos: [0.4, 0.85, 0.2]
      })
    });

    if (res.ok) {
      const data = await res.json();
      currentRolloutData = data.episode;
      currentRolloutStep = 0;
      addLog(`🎯 Rollout generated! Cumulative Reward: ${data.cumulative_reward}`, 'ok');
      
      // Update UI
      const rewEl = document.getElementById('rolloutRewardDisplay');
      if (rewEl) rewEl.textContent = `Reward: ${data.cumulative_reward}`;
      const statusEl = document.getElementById('rolloutStatusBanner');
      if (statusEl) {
        statusEl.textContent = data.task_success ? 'STATUS: TASK SUCCESSFUL (REWARD MAX)' : 'STATUS: EXECUTING';
        statusEl.className = data.task_success ? 'status-tag status-success' : 'status-tag status-active';
      }

      // Draw full 3D trajectory ribbon
      if (window.renderTrajectoryRibbon && currentRolloutData.trajectory) {
        window.renderTrajectoryRibbon(currentRolloutData.trajectory);
      }

      playPolicyRollout();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    addLog(`⚠ Server rollout error: ${err.message}. Running client-side rollout.`, 'warn');
    runClientSideRollout(task, maxSteps);
  }
}

function playPolicyRollout() {
  if (!currentRolloutData || !currentRolloutData.trajectory) return;
  isPolicyRunning = true;
  document.getElementById('policyPlayBtn').textContent = '⏸ Pause';
  
  clearInterval(rolloutTimer);
  const intervalMs = Math.max(20, Math.round(50 / rolloutSpeed));
  
  rolloutTimer = setInterval(() => {
    if (currentRolloutStep >= currentRolloutData.trajectory.length) {
      pausePolicyRollout();
      addLog('🏁 Policy Rollout execution completed!', 'ok');
      return;
    }

    const frame = currentRolloutData.trajectory[currentRolloutStep];
    applyRolloutFrame(frame);
    currentRolloutStep++;
    
    // Update progress bar
    const progress = Math.round((currentRolloutStep / currentRolloutData.trajectory.length) * 100);
    const progBar = document.getElementById('rolloutProgressFill');
    if (progBar) progBar.style.width = `${progress}%`;
    const stepLabel = document.getElementById('rolloutStepLabel');
    if (stepLabel) stepLabel.textContent = `Step ${currentRolloutStep}/${currentRolloutData.trajectory.length}`;
  }, intervalMs);
}

function pausePolicyRollout() {
  isPolicyRunning = false;
  clearInterval(rolloutTimer);
  const btn = document.getElementById('policyPlayBtn');
  if (btn) btn.textContent = '▶ Play';
}

function togglePolicyPlay() {
  if (isPolicyRunning) {
    pausePolicyRollout();
  } else {
    if (!currentRolloutData) {
      startFullPolicyRollout();
    } else {
      playPolicyRollout();
    }
  }
}

function resetPolicyRollout() {
  pausePolicyRollout();
  currentRolloutStep = 0;
  if (currentRolloutData && currentRolloutData.trajectory.length > 0) {
    applyRolloutFrame(currentRolloutData.trajectory[0]);
  }
  const progBar = document.getElementById('rolloutProgressFill');
  if (progBar) progBar.style.width = '0%';
  const stepLabel = document.getElementById('rolloutStepLabel');
  if (stepLabel) stepLabel.textContent = 'Step 0/0';
}

function applyRolloutFrame(frame) {
  if (!frame) return;
  const [px, py, pz] = frame.pose;
  const [pr, pp, pyaw] = frame.rpy;

  // Update slider inputs visually
  const sx = document.getElementById('posX');
  const sy = document.getElementById('posY');
  const sz = document.getElementById('posZ');
  const sroll = document.getElementById('roll');
  const spitch = document.getElementById('pitch');
  const syaw = document.getElementById('yaw');
  const sgrip = document.getElementById('gripSlider');

  if (sx) sx.value = px;
  if (sy) sy.value = py;
  if (sz) sz.value = pz;
  if (sroll) sroll.value = pr;
  if (spitch) spitch.value = pp;
  if (syaw) syaw.value = pyaw;
  if (sgrip) sgrip.value = Math.round(frame.gripper * 100);

  if (window.updateAllDisplayValues) window.updateAllDisplayValues();
  if (window.updateRobotPose) window.updateRobotPose(px, py, pz, pr, pp, pyaw);
  if (window.pushForceData && frame.tactile_force !== undefined) {
    window.pushForceData(frame.tactile_force);
  }
}

function setRolloutSpeed(speed) {
  rolloutSpeed = speed;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
  });
  if (isPolicyRunning) {
    playPolicyRollout(); // restart timer with new speed
  }
}

function runClientSideRollout(task, maxSteps) {
  const traj = [];
  const sx = 0.0, sy = 1.2, sz = 0.0;
  const tx = 0.4, ty = 0.85, tz = 0.2;
  for (let s = 0; s < maxSteps; s++) {
    const a = (s + 1) / maxSteps;
    const lift = Math.sin(a * Math.PI) * 0.2;
    traj.push({
      step: s,
      pose: [sx + (tx - sx) * a, sy + (ty - sy) * a + lift, sz + (tz - sz) * a],
      rpy: [0, -20 * a, 15 * a],
      gripper: a > 0.5 ? 1.0 : 0.0,
      tactile_force: a > 0.5 ? 3.8 : 0.1,
      reward: 1.0 - (1 - a) * 0.5
    });
  }
  currentRolloutData = { task: task, trajectory: traj, success: true };
  currentRolloutStep = 0;
  if (window.renderTrajectoryRibbon) {
    window.renderTrajectoryRibbon(traj);
  }
  playPolicyRollout();
}

window.openPolicyModal = openPolicyModal;
window.closePolicyModal = closePolicyModal;
window.requestPolicyInferenceChunk = requestPolicyInferenceChunk;
window.startFullPolicyRollout = startFullPolicyRollout;
window.togglePolicyPlay = togglePolicyPlay;
window.resetPolicyRollout = resetPolicyRollout;
window.setRolloutSpeed = setRolloutSpeed;
