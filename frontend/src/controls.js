/**
 * PhysiSim AI — Controls Module
 * Binds slider inputs to viewport and display values
 */

const SLIDERS = [
  { id: 'posX',       display: 'valX',    suffix: '',   decimals: 2 },
  { id: 'posY',       display: 'valY',    suffix: '',   decimals: 2 },
  { id: 'posZ',       display: 'valZ',    suffix: '',   decimals: 2 },
  { id: 'roll',       display: 'valRoll', suffix: '°',  decimals: 0 },
  { id: 'pitch',      display: 'valPitch',suffix: '°',  decimals: 0 },
  { id: 'yaw',        display: 'valYaw',  suffix: '°',  decimals: 0 },
  { id: 'gripSlider', display: 'valGrip', suffix: '%',  decimals: 0 },
  // Joint sliders
  { id: 'q1', display: 'valQ1', suffix: '°', decimals: 0 },
  { id: 'q2', display: 'valQ2', suffix: '°', decimals: 0 },
  { id: 'q3', display: 'valQ3', suffix: '°', decimals: 0 },
  { id: 'q4', display: 'valQ4', suffix: '°', decimals: 0 },
  { id: 'q5', display: 'valQ5', suffix: '°', decimals: 0 },
  { id: 'q6', display: 'valQ6', suffix: '°', decimals: 0 },
  { id: 'q7', display: 'valQ7', suffix: '°', decimals: 0 },
];

function initControls() {
  SLIDERS.forEach(({ id, display, suffix, decimals }) => {
    const slider = document.getElementById(id);
    const label  = document.getElementById(display);
    if (!slider || !label) return;

    slider.addEventListener('input', () => {
      label.textContent = parseFloat(slider.value).toFixed(decimals) + suffix;
      onSliderChange();
    });
  });
}

function onSliderChange() {
  const x     = parseFloat(document.getElementById('posX').value);
  const y     = parseFloat(document.getElementById('posY').value);
  const z     = parseFloat(document.getElementById('posZ').value);
  const roll  = parseFloat(document.getElementById('roll').value);
  const pitch = parseFloat(document.getElementById('pitch').value);
  const yaw   = parseFloat(document.getElementById('yaw').value);

  // Update pose display
  document.getElementById('poseX').textContent = x.toFixed(3);
  document.getElementById('poseY').textContent = y.toFixed(3);
  document.getElementById('poseZ').textContent = z.toFixed(3);

  // Update 3D viewport
  if (typeof updateRobotPose === 'function') {
    updateRobotPose(x, y, z, roll, pitch, yaw);
  }
}

function updateAllDisplayValues() {
  SLIDERS.forEach(({ id, display, suffix, decimals }) => {
    const slider = document.getElementById(id);
    const label  = document.getElementById(display);
    if (slider && label) {
      label.textContent = parseFloat(slider.value).toFixed(decimals) + suffix;
    }
  });
  onSliderChange();
}

/* ─── Joint Panel Toggle ─── */
function toggleJoints() {
  const panel = document.getElementById('jointPanel');
  const icon  = document.getElementById('jointToggleIcon');
  const open  = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  icon.textContent = open ? '▼' : '▶';
}

function resetJoints() {
  ['q1','q2','q3','q4','q5','q6','q7'].forEach(id => {
    const el = document.getElementById(id);
    const label = document.getElementById('val' + id.toUpperCase());
    if (el) el.value = id === 'q4' ? '-3' : '0';
    if (label) label.textContent = id === 'q4' ? '-3°' : '0°';
  });
  updateJointReadout([0, 0, 0, -3, 0, 0, 0]);
}

/* ─── Joint Readout Bars (Right Panel) ─── */
// ranges from Franka Panda joint limits
const JOINT_RANGES = [332, 202, 332, 172, 332, 216, 332]; // total deg range

function updateJointReadout(angles) {
  if (!angles || angles.length < 7) return;
  angles.forEach((val, i) => {
    const n   = i + 1;
    const num = document.getElementById(`num-q${n}`);
    const bar = document.getElementById(`bar-q${n}`);
    if (!num || !bar) return;
    num.textContent = val.toFixed(1);
    // Map angle to 0–100% bar width
    const pct = Math.min(100, Math.max(0, ((val + JOINT_RANGES[i] / 2) / JOINT_RANGES[i]) * 100));
    bar.style.width = pct + '%';
  });
}
