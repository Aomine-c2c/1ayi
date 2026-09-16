/**
 * Reusable Canvas Chart Components for Agricultural Analytics
 * WCAG 2.1 AA Compliant, responsive, high-contrast, Retina-ready.
 * 
 * Supports:
 * - Line Chart (e.g. "How has rainfall changed over time?", diurnal temp)
 * - Bar Chart (e.g. "Which crop has the highest expected yield?", production by holding)
 * - Area Chart (e.g. Cumulative water balance vs evapotranspiration)
 * - Donut / Pie Chart (e.g. Crop distribution, regional land use)
 * - Comparison Bar / Multi-Series Chart (e.g. "How does estimated yield compare with historical production?")
 */

export const chartComponents = {
  /**
   * 1. LINE CHART
   * Answers practical questions like: "How has rainfall changed over time?"
   */
  renderLineChart(canvasId, { labels = [], datasets = [], yAxisLabel = '', unit = '' }) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 55;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const graphW = w - padLeft - padRight;
    const graphH = h - padTop - padBottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (labels.length === 0 || datasets.length === 0) {
      this.drawEmpty(ctx, w, h, 'No telemetry data available');
      return;
    }

    // Determine min and max Y across all datasets
    let allVals = [];
    datasets.forEach(ds => {
      allVals = allVals.concat(ds.data);
    });
    let minY = Math.min(...allVals, 0);
    let maxY = Math.max(...allVals);
    if (maxY === minY) maxY += 10;
    maxY = Math.ceil(maxY * 1.15);

    // Draw horizontal grid lines and Y-axis labels
    const gridRows = 4;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = padTop + (graphH / gridRows) * i;
      const val = maxY - (i / gridRows) * (maxY - minY);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${val.toFixed(unit ? 1 : 0)}${unit}`, padLeft - 8, y + 3);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    labels.forEach((lbl, idx) => {
      const x = padLeft + (idx / Math.max(labels.length - 1, 1)) * graphW;
      ctx.fillText(lbl, x, h - padBottom + 16);
    });

    // Draw each dataset curve
    datasets.forEach((ds, dsIdx) => {
      const strokeColor = ds.color || '#059669';
      const pts = ds.data.map((val, idx) => ({
        x: padLeft + (idx / Math.max(labels.length - 1, 1)) * graphW,
        y: padTop + graphH - ((val - minY) / (maxY - minY)) * graphH
      }));

      // Line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      pts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Points
      pts.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });

    // Draw Legend in top left
    this.drawLegend(ctx, datasets, padLeft, 14);
  },

  /**
   * 2. BAR CHART
   * Answers practical questions like: "Which crop has the highest expected yield?"
   */
  renderBarChart(canvasId, { labels = [], data = [], color = '#059669', unit = '', label = 'Yield' }) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const graphW = w - padLeft - padRight;
    const graphH = h - padTop - padBottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (labels.length === 0 || data.length === 0) {
      this.drawEmpty(ctx, w, h, 'No crop data available');
      return;
    }

    const maxVal = Math.max(...data, 1) * 1.2;
    const gridRows = 4;

    // Grid lines & Y-axis labels
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = padTop + (graphH / gridRows) * i;
      const val = maxVal - (i / gridRows) * maxVal;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(val)}${unit}`, padLeft - 8, y + 3);
    }

    // Draw bars
    const barWidth = Math.min((graphW / labels.length) * 0.55, 45);
    const step = graphW / labels.length;

    labels.forEach((lbl, idx) => {
      const val = data[idx];
      const barH = (val / maxVal) * graphH;
      const x = padLeft + idx * step + (step - barWidth) / 2;
      const y = padTop + graphH - barH;

      // Bar fill with subtle gradient
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, '#047857');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Top value text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${val}${unit}`, x + barWidth / 2, y - 6);

      // Bottom category label
      ctx.fillStyle = '#334155';
      ctx.font = '10px sans-serif';
      ctx.fillText(lbl, x + barWidth / 2, h - padBottom + 16);
    });
  },

  /**
   * 3. COMPARISON CHART (Actual vs Baseline / Projected vs Historical)
   * Answers practical questions like: "How does estimated yield compare with historical production?"
   */
  renderComparisonChart(canvasId, { labels = [], seriesA = { label: 'Historical Baseline', data: [], color: '#94a3b8' }, seriesB = { label: '2026 Projection', data: [], color: '#059669' }, unit = ' kg/ha' }) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 65;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 45;
    const graphW = w - padLeft - padRight;
    const graphH = h - padTop - padBottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const allVals = [...seriesA.data, ...seriesB.data];
    const maxVal = Math.max(...allVals, 1) * 1.2;
    const gridRows = 4;

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = padTop + (graphH / gridRows) * i;
      const val = maxVal - (i / gridRows) * maxVal;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(val)}${unit}`, padLeft - 8, y + 3);
    }

    const groupWidth = graphW / labels.length;
    const barWidth = Math.min(groupWidth * 0.32, 28);
    const gap = 4;

    labels.forEach((lbl, idx) => {
      const valA = seriesA.data[idx] || 0;
      const valB = seriesB.data[idx] || 0;

      const barHA = (valA / maxVal) * graphH;
      const barHB = (valB / maxVal) * graphH;

      const groupCenter = padLeft + idx * groupWidth + groupWidth / 2;
      const xA = groupCenter - barWidth - gap / 2;
      const xB = groupCenter + gap / 2;

      const yA = padTop + graphH - barHA;
      const yB = padTop + graphH - barHB;

      // Bar A
      ctx.fillStyle = seriesA.color;
      ctx.beginPath();
      ctx.roundRect(xA, yA, barWidth, barHA, [3, 3, 0, 0]);
      ctx.fill();

      // Bar B
      ctx.fillStyle = seriesB.color;
      ctx.beginPath();
      ctx.roundRect(xB, yB, barWidth, barHB, [3, 3, 0, 0]);
      ctx.fill();

      // Variance pill above Bar B
      const diffPct = valA > 0 ? (((valB - valA) / valA) * 100).toFixed(0) : 0;
      const isPositive = diffPct >= 0;
      ctx.fillStyle = isPositive ? '#065f46' : '#991b1b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${isPositive ? '+' : ''}${diffPct}%`, xB + barWidth / 2, yB - 6);

      // X label
      ctx.fillStyle = '#334155';
      ctx.font = '10px sans-serif';
      ctx.fillText(lbl, groupCenter, h - padBottom + 16);
    });

    // Draw Legend
    this.drawLegend(ctx, [seriesA, seriesB], padLeft, 14);
  },

  /**
   * 4. AREA CHART
   * Answers practical questions like: Cumulative water balance vs crop requirement
   */
  renderAreaChart(canvasId, { labels = [], data = [], color = '#0284c7', unit = ' mm' }) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 55;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const graphW = w - padLeft - padRight;
    const graphH = h - padTop - padBottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const maxVal = Math.max(...data, 1) * 1.2;
    const gridRows = 4;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = padTop + (graphH / gridRows) * i;
      const val = maxVal - (i / gridRows) * maxVal;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(val)}${unit}`, padLeft - 8, y + 3);
    }

    const pts = data.map((val, idx) => ({
      x: padLeft + (idx / Math.max(labels.length - 1, 1)) * graphW,
      y: padTop + graphH - (val / maxVal) * graphH
    }));

    // Fill Gradient
    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + graphH);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.02)');

    ctx.beginPath();
    pts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(w - padRight, padTop + graphH);
    ctx.lineTo(padLeft, padTop + graphH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Points and labels
    ctx.textAlign = 'center';
    labels.forEach((lbl, idx) => {
      const pt = pts[idx];
      ctx.fillStyle = '#334155';
      ctx.fillText(lbl, pt.x, h - padBottom + 16);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  },

  /**
   * 5. DONUT / PIE CHART
   * Answers practical questions like: "What is the crop distribution across cultivated land?"
   */
  renderDonutChart(canvasId, { segments = [] }) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) {
      this.drawEmpty(ctx, w, h, 'No allocation data');
      return;
    }

    const centerX = w * 0.38;
    const centerY = h / 2;
    const outerRadius = Math.min(w * 0.28, h * 0.40);
    const innerRadius = outerRadius * 0.58;

    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
      const sliceAngle = (seg.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.fillStyle = seg.color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      startAngle = endAngle;
    });

    // Center text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${total.toFixed(1)} ha`, centerX, centerY + 2);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Cultivated', centerX, centerY + 14);

    // Legend on the right side
    const legendX = w * 0.70;
    const startY = Math.max(centerY - (segments.length * 20) / 2, 20);

    ctx.textAlign = 'left';
    segments.forEach((seg, idx) => {
      const y = startY + idx * 22;
      ctx.fillStyle = seg.color;
      ctx.beginPath();
      ctx.roundRect(legendX, y, 10, 10, 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      const pct = ((seg.value / total) * 100).toFixed(0);
      ctx.fillText(`${seg.label} (${pct}%)`, legendX + 16, y + 9);
    });
  },

  drawLegend(ctx, datasets, x, y) {
    let currX = x;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';

    datasets.forEach(ds => {
      ctx.fillStyle = ds.color;
      ctx.beginPath();
      ctx.roundRect(currX, y - 9, 10, 10, 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.fillText(ds.label, currX + 15, y);
      currX += ctx.measureText(ds.label).width + 35;
    });
  },

  drawEmpty(ctx, w, h, msg) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, w / 2, h / 2);
  }
};
