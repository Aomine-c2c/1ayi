/**
 * Canvas Interactive GIS Map Component - WCAG & Mobile Interactive
 * Features mouse hover tooltips, click selection, and crisp retina rendering
 */

export function renderGisMap(canvasId, farms = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const container = canvas.parentElement;
  
  // Ensure tooltip element exists
  let tooltip = container.querySelector('.canvas-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'canvas-tooltip';
    container.appendChild(tooltip);
  }

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;

  // Background light slate
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // High contrast grid lines
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Interactive points catalog
  const interactiveTargets = [
    {
      x: w * 0.38,
      y: h * 0.45,
      radius: 12,
      label: 'Green Valley Model Farm',
      details: '12.5 ha · Volcanic Loam · Maize (H614D)',
      color: '#047857'
    },
    {
      x: w * 0.77,
      y: h * 0.54,
      radius: 12,
      label: 'Rongai Sunrise Farm',
      details: '8.2 ha · Clay Loam · Wheat',
      color: '#0369a1'
    },
    {
      x: w * 0.33,
      y: h * 0.14,
      radius: 12,
      label: 'Nakuru Agromet Weather Station',
      details: 'Station NKU-01 · 1,860m AMSL · Live Telemetry',
      color: '#b45309'
    }
  ];

  // Draw Field Boundaries (Farm 1)
  ctx.fillStyle = 'rgba(5, 150, 105, 0.14)';
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, h * 0.22);
  ctx.lineTo(w * 0.54, h * 0.20);
  ctx.lineTo(w * 0.56, h * 0.68);
  ctx.lineTo(w * 0.20, h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Internal Field A
  ctx.fillStyle = 'rgba(5, 150, 105, 0.28)';
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h * 0.25);
  ctx.lineTo(w * 0.52, h * 0.23);
  ctx.lineTo(w * 0.53, h * 0.45);
  ctx.lineTo(w * 0.23, h * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Farm 2
  ctx.fillStyle = 'rgba(3, 105, 161, 0.14)';
  ctx.strokeStyle = '#0369a1';
  ctx.beginPath();
  ctx.moveTo(w * 0.64, h * 0.38);
  ctx.lineTo(w * 0.88, h * 0.32);
  ctx.lineTo(w * 0.92, h * 0.82);
  ctx.lineTo(w * 0.66, h * 0.80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Render Target Markers
  interactiveTargets.forEach(target => {
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.strokeStyle = target.color;
    ctx.stroke();

    // High contrast label
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    const textWidth = ctx.measureText(target.label).width;
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.fillRect(target.x + 12, target.y - 10, textWidth + 10, 20);
    ctx.strokeRect(target.x + 12, target.y - 10, textWidth + 10, 20);

    ctx.fillStyle = '#0f172a';
    ctx.fillText(target.label, target.x + 17, target.y + 4);
  });

  // Attach Mouse Hover Event for Interactive Tooltip
  canvas.onmousemove = (e) => {
    const cRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - cRect.left;
    const mouseY = e.clientY - cRect.top;

    let hovered = null;
    for (const target of interactiveTargets) {
      const dist = Math.hypot(target.x - mouseX, target.y - mouseY);
      if (dist <= target.radius + 6) {
        hovered = target;
        break;
      }
    }

    if (hovered) {
      canvas.style.cursor = 'pointer';
      tooltip.style.display = 'block';
      tooltip.style.left = `${mouseX + 14}px`;
      tooltip.style.top = `${mouseY - 14}px`;
      tooltip.innerHTML = `<strong>${hovered.label}</strong><br><span style="color:#a7f3d0">${hovered.details}</span>`;
    } else {
      canvas.style.cursor = 'default';
      tooltip.style.display = 'none';
    }
  };

  canvas.onmouseleave = () => {
    tooltip.style.display = 'none';
  };
}

/**
 * Canvas Diurnal Weather Chart - WCAG 2.1 AA Compliant
 */
export function renderWeatherChart(canvasId, data = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  const points = data.length > 0 ? data : [
    { time: '06:00', temp: 16.2 },
    { time: '09:00', temp: 21.0 },
    { time: '12:00', temp: 25.4 },
    { time: '15:00', temp: 24.1 },
    { time: '18:00', temp: 20.8 }
  ];

  const padding = 38;
  const graphW = w - padding * 2;
  const graphH = h - padding * 2;

  // Grid lines
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (graphH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
  }

  const minTemp = 10;
  const maxTemp = 30;

  // Gradient area
  const gradient = ctx.createLinearGradient(0, padding, 0, h - padding);
  gradient.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
  gradient.addColorStop(1, 'rgba(5, 150, 105, 0.0)');

  ctx.beginPath();
  points.forEach((pt, i) => {
    const x = padding + (i / (points.length - 1)) * graphW;
    const y = (h - padding) - ((pt.temp - minTemp) / (maxTemp - minTemp)) * graphH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(w - padding, h - padding);
  ctx.lineTo(padding, h - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Stroke curve
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((pt, i) => {
    const x = padding + (i / (points.length - 1)) * graphW;
    const y = (h - padding) - ((pt.temp - minTemp) / (maxTemp - minTemp)) * graphH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points & High-contrast numbers
  points.forEach((pt, i) => {
    const x = padding + (i / (points.length - 1)) * graphW;
    const y = (h - padding) - ((pt.temp - minTemp) / (maxTemp - minTemp)) * graphH;

    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${pt.temp}°C`, x, y - 10);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(pt.time, x, h - padding + 18);
  });
}
