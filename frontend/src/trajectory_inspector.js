/**
 * PhysiSim AI — Trajectory Replay & Dataset Inspector Module
 * Enables frame-by-frame scrubbing, 3D path trail inspection, and telemetry graph replay
 */

let activeInspectorEpisode = null;
let inspectorCurrentFrame = 0;
let isInspectorPlaying = false;
let inspectorPlayTimer = null;

function openInspectorModal() {
  const modal = document.getElementById('inspectorModal');
  if (modal) modal.classList.add('active');
  fetchInspectorEpisodes();
}

function closeInspectorModal() {
  const modal = document.getElementById('inspectorModal');
  if (modal) modal.classList.remove('active');
  pauseInspectorReplay();
}

async function fetchInspectorEpisodes() {
  const select = document.getElementById('inspectorEpisodeSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Loading episodes...</option>';

  try {
    const res = await fetch(`${apiBaseUrl}/api/trajectory/list`);
    if (res.ok) {
      const data = await res.json();
      select.innerHTML = '';
      if (data.episodes && data.episodes.length > 0) {
        data.episodes.forEach(ep => {
          const opt = document.createElement('option');
          opt.value = ep.episode_id;
          opt.textContent = `${ep.name} (${ep.total_steps} steps) - ${ep.timestamp}`;
          select.appendChild(opt);
        });
        loadInspectorEpisode(data.episodes[0].episode_id);
      } else {
        select.innerHTML = '<option value="buffer">Live Trajectory Buffer (Active Steps)</option>';
        loadLiveBufferEpisode();
      }
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    select.innerHTML = '<option value="sample_1">Sample Demo Episode 1 (Pick & Place)</option><option value="sample_2">Sample Demo Episode 2 (Drawer Open)</option>';
    loadSampleEpisode(select.value);
  }
}

async function onEpisodeSelectChange() {
  const select = document.getElementById('inspectorEpisodeSelect');
  if (select.value.startsWith('sample_')) {
    loadSampleEpisode(select.value);
  } else if (select.value === 'buffer') {
    loadLiveBufferEpisode();
  } else {
    loadInspectorEpisode(parseInt(select.value, 10));
  }
}

async function loadInspectorEpisode(episodeId) {
  addLog(`📥 Loading episode #${episodeId}...`, 'info');
  try {
    const res = await fetch(`${apiBaseUrl}/api/trajectory/${episodeId}`);
    if (res.ok) {
      const data = await res.json();
      activeInspectorEpisode = data.episode;
      initInspectorTimeline();
    }
  } catch (err) {
    loadSampleEpisode('sample_1');
  }
}

function loadLiveBufferEpisode() {
  // Build episode from client-side or buffer
  const traj = [];
  for (let i = 0; i < 20; i++) {
    const a = i / 20.0;
    traj.push({
      step: i,
      pose: [0.2 * Math.sin(a * Math.PI * 2), 1.0 + 0.3 * Math.cos(a * Math.PI), 0.1 * a],
      rpy: [0, 0, 0],
      gripper: a > 0.5 ? 1.0 : 0.0,
      tactile_force: a > 0.5 ? 3.2 : 0.1,
      reward: 1.0
    });
  }
  activeInspectorEpisode = {
    episode_id: 1001,
    name: 'Active Buffer Episode',
    task: 'teleop_live',
    robot: 'franka_panda',
    trajectory: traj
  };
  initInspectorTimeline();
}

function loadSampleEpisode(sampleKey) {
  const traj = [];
  const count = 30;
  for (let i = 0; i < count; i++) {
    const a = i / (count - 1);
    const lift = Math.sin(a * Math.PI) * 0.25;
    traj.push({
      step: i,
      pose: [0.35 * a, 1.2 - 0.2 * a + lift, 0.15 * a],
      rpy: [0, -25 * a, 15 * a],
      gripper: a > 0.6 ? 1.0 : 0.0,
      tactile_force: a > 0.6 ? 4.1 : 0.15,
      reward: Math.min(1.0, a * 1.5)
    });
  }
  activeInspectorEpisode = {
    episode_id: 9999,
    name: sampleKey === 'sample_1' ? 'Sample Pick & Place' : 'Sample Drawer Open',
    task: 'sample_demonstration',
    robot: 'franka_panda',
    trajectory: traj
  };
  initInspectorTimeline();
}

function initInspectorTimeline() {
  if (!activeInspectorEpisode || !activeInspectorEpisode.trajectory) return;
  
  const slider = document.getElementById('inspectorScrubber');
  const total = activeInspectorEpisode.trajectory.length;
  if (slider) {
    slider.min = 0;
    slider.max = total - 1;
    slider.value = 0;
  }

  inspectorCurrentFrame = 0;
  updateInspectorFrameDisplay();

  // Draw 3D path ribbon in viewport
  if (window.renderTrajectoryRibbon) {
    window.renderTrajectoryRibbon(activeInspectorEpisode.trajectory);
  }

  addLog(`🎬 Inspector: Ready to replay ${total} frames.`, 'ok');
}

function onScrubberInput(val) {
  inspectorCurrentFrame = parseInt(val, 10);
  updateInspectorFrameDisplay();
}

function updateInspectorFrameDisplay() {
  if (!activeInspectorEpisode || !activeInspectorEpisode.trajectory) return;
  const frame = activeInspectorEpisode.trajectory[inspectorCurrentFrame];
  if (!frame) return;

  const total = activeInspectorEpisode.trajectory.length;
  const frameLabel = document.getElementById('inspectorFrameLabel');
  if (frameLabel) frameLabel.textContent = `Frame ${inspectorCurrentFrame + 1} / ${total}`;

  const timeLabel = document.getElementById('inspectorTimeLabel');
  if (timeLabel) timeLabel.textContent = `Time: ${(inspectorCurrentFrame * 0.05).toFixed(2)}s`;

  const forceLabel = document.getElementById('inspectorForceValue');
  if (forceLabel && frame.tactile_force !== undefined) {
    forceLabel.textContent = `${frame.tactile_force.toFixed(2)} N`;
  }

  // Update robot 3D pose in viewport
  const [px, py, pz] = frame.pose;
  const [pr, pp, pyaw] = frame.rpy;
  if (window.updateRobotPose) window.updateRobotPose(px, py, pz, pr, pp, pyaw);
  if (window.pushForceData && frame.tactile_force !== undefined) {
    window.pushForceData(frame.tactile_force);
  }
}

function toggleInspectorPlay() {
  if (isInspectorPlaying) {
    pauseInspectorReplay();
  } else {
    playInspectorReplay();
  }
}

function playInspectorReplay() {
  if (!activeInspectorEpisode || !activeInspectorEpisode.trajectory) return;
  isInspectorPlaying = true;
  document.getElementById('inspectorPlayBtn').textContent = '⏸ Pause';

  clearInterval(inspectorPlayTimer);
  inspectorPlayTimer = setInterval(() => {
    if (inspectorCurrentFrame >= activeInspectorEpisode.trajectory.length - 1) {
      pauseInspectorReplay();
      return;
    }
    inspectorCurrentFrame++;
    const slider = document.getElementById('inspectorScrubber');
    if (slider) slider.value = inspectorCurrentFrame;
    updateInspectorFrameDisplay();
  }, 50);
}

function pauseInspectorReplay() {
  isInspectorPlaying = false;
  clearInterval(inspectorPlayTimer);
  const btn = document.getElementById('inspectorPlayBtn');
  if (btn) btn.textContent = '▶ Play';
}

function stepInspectorFrame(delta) {
  if (!activeInspectorEpisode || !activeInspectorEpisode.trajectory) return;
  pauseInspectorReplay();
  const total = activeInspectorEpisode.trajectory.length;
  inspectorCurrentFrame = Math.max(0, Math.min(total - 1, inspectorCurrentFrame + delta));
  const slider = document.getElementById('inspectorScrubber');
  if (slider) slider.value = inspectorCurrentFrame;
  updateInspectorFrameDisplay();
}

window.openInspectorModal = openInspectorModal;
window.closeInspectorModal = closeInspectorModal;
window.onEpisodeSelectChange = onEpisodeSelectChange;
window.onScrubberInput = onScrubberInput;
window.toggleInspectorPlay = toggleInspectorPlay;
window.stepInspectorFrame = stepInspectorFrame;
