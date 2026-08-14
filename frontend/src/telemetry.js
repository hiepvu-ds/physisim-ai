/**
 * PhysiSim AI — Telemetry Module
 * Manages: Force Chart (Chart.js), Wrist Cam Canvas, Pose display
 */

let forceChart;
const forceDataBuffer = new Array(CONFIG.CHART.windowSize).fill(0);
const forceLabels = Array.from({ length: CONFIG.CHART.windowSize }, (_, i) => `${i}s`);

/* ─── Force Chart ─── */

function initForceChart() {
  const ctx = document.getElementById('forceChart').getContext('2d');
  forceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...forceLabels],
      datasets: [{
        label: 'Force (N)',
        data: [...forceDataBuffer],
        borderColor: '#00f2fe',
        backgroundColor: 'rgba(0, 242, 254, 0.08)',
        borderWidth: 1.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { size: 8 }, maxTicksLimit: 8 },
        },
        y: {
          min: 0,
          max: CONFIG.CHART.maxForce,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { size: 8 } },
        },
      },
    },
  });
}

function pushForceData(value) {
  forceDataBuffer.shift();
  forceDataBuffer.push(value);
  if (forceChart) {
    forceChart.data.datasets[0].data = [...forceDataBuffer];
    forceChart.update('none');
  }
}

function clearForceData() {
  forceDataBuffer.fill(0);
  if (forceChart) {
    forceChart.data.datasets[0].data = [...forceDataBuffer];
    forceChart.update('none');
  }
}

window.clearForceData = clearForceData;

/* ─── Wrist Camera Simulation ─── */

function initWristCam() {
  const canvas = document.getElementById('wristCam');
  const ctx = canvas.getContext('2d');
  drawSimulatedCamFrame(ctx, canvas.width, canvas.height, 0);
  setInterval(() => {
    const t = performance.now() / 1000;
    drawSimulatedCamFrame(ctx, canvas.width, canvas.height, t);
  }, 100);
}

function drawSimulatedCamFrame(ctx, w, h, t) {
  // Background gradient
  const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/1.5);
  grad.addColorStop(0, '#0d1a2e');
  grad.addColorStop(1, '#020408');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

  // Grid overlay
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Simulated object (block moving slightly)
  const bx = w/2 + Math.sin(t * 0.5) * 20;
  const by = h/2 + Math.cos(t * 0.3) * 10;
  ctx.fillStyle = 'rgba(127, 0, 255, 0.6)';
  ctx.beginPath();
  ctx.roundRect(bx - 20, by - 15, 40, 30, 4);
  ctx.fill();

  // Crosshair
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(w/2-12, h/2); ctx.lineTo(w/2+12, h/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w/2, h/2-12); ctx.lineTo(w/2, h/2+12); ctx.stroke();

  // Corner brackets
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
  ctx.lineWidth = 1.5;
  const b = 8, m = 6;
  [[m,m],[w-m,m],[m,h-m],[w-m,h-m]].forEach(([x,y]) => {
    const sx = x < w/2 ? 1 : -1, sy = y < h/2 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+sx*b, y); ctx.moveTo(x, y); ctx.lineTo(x, y+sy*b); ctx.stroke();
  });

  // Depth info text
  ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.fillText(`DEPTH: ${(1.2 + Math.sin(t)*0.05).toFixed(3)}m`, 8, h-8);
  ctx.fillText(`RGB-D LIVE`, w-52, h-8);
}

let _lastLiveCamFrame = null;
function updateWristCamFrame(base64Image) {
  if (!base64Image) return;
  const canvas = document.getElementById('wristCam');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = base64Image;
}

window.updateWristCamFrame = updateWristCamFrame;

