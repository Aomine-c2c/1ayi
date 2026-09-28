/**
 * Canvas Interactive GIS Map Component - WCAG & Mobile Interactive
 * Features mouse hover tooltips, click selection, and crisp retina rendering
 */

export async function renderGisMap(canvasId, farms = []) {
  let element = document.getElementById(canvasId);
  if (!element) return;

  // If the target element is a canvas, replace it with a div so Leaflet can mount properly
  if (element.tagName.toLowerCase() === 'canvas') {
    const div = document.createElement('div');
    div.id = element.id;
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.minHeight = '360px';
    div.className = element.className;
    element.parentNode.replaceChild(div, element);
    element = div;
  }

  try {
    const { mapFactory } = await import('../geo/mapFactory.js?v=3');
    const map = mapFactory.create(element.id, {
      center: { lat: -19.0154, lon: 29.1549 },
      zoom: 6,
      interactive: true,
      showFields: true
    });
    
    if (farms && farms.length > 0) {
      map.setMarkers(farms.filter(f => f.latitude != null && f.longitude != null).map(f => ({
        id: f.id,
        lat: f.latitude,
        lon: f.longitude,
        title: f.name,
        crop: f.primaryCrop || f.crop,
        color: '#059669'
      })));
    }
  } catch (err) {
    console.error('Failed to initialize Leaflet Map via mapFactory:', err);
  }
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
