import { MapAdapter } from './mapAdapter.js';

/**
 * High-Performance Interactive HTML5 Canvas Map Provider
 * Renders spatial projections, grid lines, vector polygons, markers,
 * interactive hover tooltips, click selection, pan/zoom simulations,
 * and loading / error / empty / selected state management.
 */
export class CanvasMapProvider extends MapAdapter {
  constructor(containerId, options = {}) {
    super(containerId, options);
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.canvas = null;
    this.ctx = null;
    this.tooltip = null;
    this.stateOverlay = null;

    // Viewport bounds & center
    this.center = options.center || { lat: -19.0154, lon: 30.0 }; // Zimbabwe default center
    this.zoom = options.zoom || 7;
    this.interactive = options.interactive !== false;
    this.allowLocationSelect = options.allowLocationSelect || false;
    this.showFields = options.showFields || false;

    this.init();
  }

  init() {
    if (!this.container) {
      this.setState('ERROR', new Error(`Container #${this.containerId} not found in DOM.`));
      return;
    }

    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    // Clear existing children
    this.container.innerHTML = '';

    // Create Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Create Tooltip Overlay
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'canvas-map-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      display: none;
      pointer-events: none;
      background: rgba(15, 23, 42, 0.95);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      line-height: 1.4;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.15);
      z-index: 50;
      max-width: 260px;
    `;
    this.container.appendChild(this.tooltip);

    // Create State Overlay (for Loading, Error, No-Location, Selected)
    this.stateOverlay = document.createElement('div');
    this.stateOverlay.className = 'canvas-map-state-overlay';
    this.stateOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(248, 250, 252, 0.85);
      backdrop-filter: blur(2px);
      z-index: 40;
      text-align: center;
      padding: 20px;
    `;
    this.container.appendChild(this.stateOverlay);

    // Weather popup overlay (persists on click, dismissible)
    this.weatherPopup = document.createElement('div');
    this.weatherPopup.className = 'canvas-map-weather-popup';
    this.weatherPopup.style.cssText = `
      position: absolute;
      display: none;
      background: linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%);
      color: #f1f5f9;
      border-radius: 12px;
      box-shadow: 0 8px 32px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
      z-index: 60;
      width: 280px;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
      backdrop-filter: blur(12px);
    `;
    this.container.appendChild(this.weatherPopup);

    // Map of farmId → weather data (populated by addWeatherPin)
    this._weatherData = new Map();
    // Map of farmId → accu weather icon number
    this._weatherIconMap = new Map();

    // Resize observer for responsive behavior
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // Event Listeners
    if (this.interactive) {
      this.bindEvents();
    }

    this.setState('READY');
    this.handleResize();
  }

  handleResize() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());
    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  setState(newState, error = null) {
    super.setState(newState, error);
    this.renderStateOverlay();
  }

  renderStateOverlay() {
    if (!this.stateOverlay) return;

    switch (this.state) {
      case 'LOADING':
        this.stateOverlay.style.display = 'flex';
        this.stateOverlay.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <div style="width: 28px; height: 28px; border: 3px solid #cbd5e1; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <strong style="color: var(--text-primary); font-size: 0.85rem;">Loading Geographic Engine...</strong>
            <span style="color: var(--text-muted); font-size: 0.75rem;">Initializing coordinate projections</span>
          </div>
        `;
        break;

      case 'ERROR':
        this.stateOverlay.style.display = 'flex';
        this.stateOverlay.innerHTML = `
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px 20px; max-width: 320px;">
            <span style="font-size: 1.5rem; display: block; margin-bottom: 6px;">⚠️</span>
            <strong style="color: #be123c; font-size: 0.875rem;">Map Initialization Error</strong>
            <p style="color: #4c0519; font-size: 0.78rem; margin-top: 4px;">${this.lastError?.message || 'Failed to render geographic boundaries.'}</p>
            <button class="btn btn-outline" style="margin-top: 10px; font-size: 0.72rem; padding: 4px 10px;" onclick="this.closest('.canvas-map-state-overlay').style.display='none'">Dismiss</button>
          </div>
        `;
        break;

      case 'NO_LOCATION':
        this.stateOverlay.style.display = 'flex';
        this.stateOverlay.innerHTML = `
          <div style="background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 8px; padding: 18px 24px; max-width: 340px;">
            <span style="font-size: 1.8rem; display: block; margin-bottom: 6px;">📍</span>
            <strong style="color: var(--text-primary); font-size: 0.9rem;">No Geographic Location Set</strong>
            <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 4px;">
              Coordinates have not been specified for this entity yet. Click on the map to place a location pin.
            </p>
          </div>
        `;
        break;

      case 'SELECTED':
        // Selected location banner (subtle, doesn't block the canvas)
        this.stateOverlay.style.display = 'none';
        break;

      case 'READY':
      default:
        this.stateOverlay.style.display = 'none';
        break;
    }
  }

  // Coordinate Conversion (Equirectangular Projection mapped to bounds)
  coordToPoint(lat, lon) {
    // Zimbabwe bounding box: Lat -15.5 to -22.5, Lon 25.0 to 33.5
    const minLat = -22.5;
    const maxLat = -15.5;
    const minLon = 25.0;
    const maxLon = 33.5;

    const pad = 40;
    const availW = this.width - pad * 2;
    const availH = this.height - pad * 2;

    const x = pad + ((lon - minLon) / (maxLon - minLon)) * availW;
    // Invert Y because latitude goes negative southward
    const y = pad + ((maxLat - lat) / (maxLat - minLat)) * availH;

    return { x, y };
  }

  pointToCoord(x, y) {
    const minLat = -22.5;
    const maxLat = -15.5;
    const minLon = 25.0;
    const maxLon = 33.5;

    const pad = 40;
    const availW = this.width - pad * 2;
    const availH = this.height - pad * 2;

    const lon = minLon + ((x - pad) / availW) * (maxLon - minLon);
    const lat = maxLat - ((y - pad) / availH) * (maxLat - minLat);

    return {
      lat: parseFloat(lat.toFixed(4)),
      lon: parseFloat(lon.toFixed(4))
    };
  }

  setCenter(coord, zoom = 7) {
    this.center = coord;
    this.zoom = zoom;
    this.render();
  }

  setMarkers(markers = []) {
    this.markers = markers;
    this.render();
  }

  setPolygons(polygons = []) {
    this.polygons = polygons;
    this.render();
  }

  setSelectedLocation(coord) {
    if (!coord || typeof coord.lat !== 'number' || typeof coord.lon !== 'number') {
      this.selectedLocation = null;
      this.setState('NO_LOCATION');
    } else {
      this.selectedLocation = coord;
      this.setState('SELECTED');
    }
    this.render();
  }

  selectMarkerById(markerId) {
    this.selectedMarker = this.markers.find(m => m.id === markerId) || null;
    this.render();
    if (this.selectedMarker && this.onMarkerClick) {
      this.onMarkerClick(this.selectedMarker);
    }
  }

  render() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Background Base Map Canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // 2. High-contrast Grid Lines (Geographic Graticule)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const step = 45;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Render Zimbabwe Stylized National Outline & Agro-Ecological Zones
    this.drawZimbabweAgroZones(ctx, w, h);

    // 4. Render Polygons (Cadastral farm and field boundary contours)
    this.drawPolygons(ctx);

    // 5. Render Markers
    this.drawMarkers(ctx);

    // 6. Render Selected Location Pin (Registration Map)
    if (this.selectedLocation) {
      this.drawSelectedPin(ctx, this.selectedLocation);
    }

    // 7. Legend & Compass Overlay
    this.drawCompassAndScale(ctx, w, h);

    // 8. Weather temperature badges (rendered on top of markers)
    if (this._weatherData && this._weatherData.size > 0) {
      this._renderWeatherBadges();
    }
  }

  drawZimbabweAgroZones(ctx, w, h) {
    // Approximate coordinate polygons for Zimbabwe agro-ecological zones
    // Region I: Eastern Highlands
    const reg1Coords = [
      { lat: -17.8, lon: 32.5 },
      { lat: -18.2, lon: 33.0 },
      { lat: -19.5, lon: 33.0 },
      { lat: -20.2, lon: 32.6 },
      { lat: -19.2, lon: 32.2 }
    ];
    this.renderZonePolygon(ctx, reg1Coords, 'rgba(5, 150, 105, 0.12)', '#059669', 'NR-I (Highland)');

    // Region II: Highveld (Intensive Grain Basin)
    const reg2Coords = [
      { lat: -16.6, lon: 30.0 },
      { lat: -16.8, lon: 32.0 },
      { lat: -18.5, lon: 32.2 },
      { lat: -18.5, lon: 29.5 },
      { lat: -17.2, lon: 29.2 }
    ];
    this.renderZonePolygon(ctx, reg2Coords, 'rgba(3, 105, 161, 0.08)', '#0284c7', 'NR-II (Grain/Tobacco)');

    // Region III: Midlands
    const reg3Coords = [
      { lat: -18.5, lon: 29.5 },
      { lat: -18.5, lon: 32.0 },
      { lat: -19.8, lon: 31.5 },
      { lat: -20.0, lon: 29.2 }
    ];
    this.renderZonePolygon(ctx, reg3Coords, 'rgba(217, 119, 6, 0.08)', '#d97706', 'NR-III (Semi-Intensive)');

    // Region V: Lowveld Canal / Sugar Belt
    const reg5Coords = [
      { lat: -20.4, lon: 31.0 },
      { lat: -20.8, lon: 32.5 },
      { lat: -22.2, lon: 31.5 },
      { lat: -22.0, lon: 29.5 }
    ];
    this.renderZonePolygon(ctx, reg5Coords, 'rgba(109, 40, 217, 0.08)', '#7c3aed', 'NR-V (Lowveld Irrigation)');
  }

  renderZonePolygon(ctx, coords, fillColor, strokeColor, label) {
    if (coords.length < 3) return;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    coords.forEach((c, idx) => {
      const pt = this.coordToPoint(c.lat, c.lon);
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Label at centroid
    const centerPt = this.coordToPoint(
      coords.reduce((sum, c) => sum + c.lat, 0) / coords.length,
      coords.reduce((sum, c) => sum + c.lon, 0) / coords.length
    );
    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, centerPt.x, centerPt.y);
  }

  drawPolygons(ctx) {
    this.polygons.forEach(poly => {
      if (!poly.coordinates || poly.coordinates.length < 3) return;
      ctx.fillStyle = poly.fillColor || 'rgba(5, 150, 105, 0.15)';
      ctx.strokeStyle = poly.strokeColor || '#059669';
      ctx.lineWidth = poly.strokeWidth || 2;

      ctx.beginPath();
      poly.coordinates.forEach((c, idx) => {
        const pt = this.coordToPoint(c.lat, c.lon);
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (poly.label) {
        const pt = this.coordToPoint(poly.coordinates[0].lat, poly.coordinates[0].lon);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(poly.label, pt.x + 5, pt.y - 5);
      }
    });
  }

  drawMarkers(ctx) {
    this.markers.forEach(m => {
      const pt = this.coordToPoint(m.lat, m.lon);
      const isSelected = this.selectedMarker && this.selectedMarker.id === m.id;

      // Color mapping by risk or custom color
      let markerColor = m.color || '#059669';
      if (m.riskLevel === 'HIGH' || m.riskLevel === 'CRITICAL') markerColor = '#be123c';
      else if (m.riskLevel === 'MEDIUM') markerColor = '#d97706';
      else if (m.riskLevel === 'OPTIMAL') markerColor = '#047857';

      // Halo for selection
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(5, 150, 105, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Pin body
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = markerColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Outer ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 13 : 11, 0, Math.PI * 2);
      ctx.strokeStyle = markerColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text label box
      ctx.font = 'bold 11px sans-serif';
      const txt = m.title;
      const metrics = ctx.measureText(txt);
      const boxW = metrics.width + 12;
      const boxH = 20;

      ctx.fillStyle = isSelected ? '#0f172a' : '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pt.x + 14, pt.y - 10, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#ffffff' : '#0f172a';
      ctx.textAlign = 'left';
      ctx.fillText(txt, pt.x + 20, pt.y + 4);

      // Subtitle / crop badge
      if (m.crop) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`🌾 ${m.crop}`, pt.x + 20, pt.y + 20);
      }
    });
  }

  drawSelectedPin(ctx, coord) {
    const pt = this.coordToPoint(coord.lat, coord.lon);

    // Glowing circle
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(190, 18, 60, 0.2)';
    ctx.fill();

    // Tear pin
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt.x - 7, pt.y - 10);
    ctx.lineTo(pt.x + 7, pt.y - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📍 ${coord.lat.toFixed(4)}, ${coord.lon.toFixed(4)}`, pt.x, pt.y + 20);
  }

  drawCompassAndScale(ctx, w, h) {
    // Compass Rose in top-right
    const cx = w - 40;
    const cy = 40;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx - 5, cy + 4);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 5, cy + 4);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('N', cx, cy - 18);
    ctx.restore();

    // Scale Bar in bottom-left
    const sx = 20;
    const sy = h - 20;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 80, sy);
    ctx.moveTo(sx, sy - 4);
    ctx.lineTo(sx, sy + 4);
    ctx.moveTo(sx + 80, sy - 4);
    ctx.lineTo(sx + 80, sy + 4);
    ctx.stroke();

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText('0', sx, sy - 6);
    ctx.textAlign = 'right';
    ctx.fillText('100 km', sx + 80, sy - 6);
  }

  onMouseMove(e) {
    if (!this.tooltip) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hovered = null;
    for (const m of this.markers) {
      const pt = this.coordToPoint(m.lat, m.lon);
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist <= 16) {
        hovered = m;
        break;
      }
    }

    if (hovered) {
      this.canvas.style.cursor = 'pointer';
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = `${Math.min(mouseX + 16, this.width - 240)}px`;
      this.tooltip.style.top = `${Math.max(mouseY - 20, 10)}px`;
      this.tooltip.innerHTML = `
        <strong style="color: #ffffff; font-size: 0.82rem; display: block; margin-bottom: 2px;">${hovered.title}</strong>
        <div style="color: #94a3b8; font-size: 0.72rem;">📍 ${hovered.lat.toFixed(4)}, ${hovered.lon.toFixed(4)}</div>
        ${hovered.areaHa ? `<div style="margin-top: 4px;">📐 Area: <strong>${hovered.areaHa} ha</strong></div>` : ''}
        ${hovered.crop ? `<div>🌱 Crop: <strong>${hovered.crop}</strong></div>` : ''}
        ${hovered.riskLevel ? `<div>⚠️ Risk: <span style="color: ${hovered.riskLevel === 'HIGH' ? '#f43f5e' : '#10b981'}; font-weight: 700;">${hovered.riskLevel}</span></div>` : ''}
        ${hovered.suitability ? `<div>🧠 Suitability: <strong>${hovered.suitability}</strong></div>` : ''}
        ${hovered.weatherAlert ? `<div style="color: #f59e0b; margin-top: 2px;">⚡ ${hovered.weatherAlert}</div>` : ''}
      `;
    } else {
      this.canvas.style.cursor = this.allowLocationSelect ? 'crosshair' : 'default';
      this.tooltip.style.display = 'none';
    }
  }

  onMouseLeave() {
    if (this.tooltip) this.tooltip.style.display = 'none';
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicking a marker
    let clickedMarker = null;
    for (const m of this.markers) {
      const pt = this.coordToPoint(m.lat, m.lon);
      const dist = Math.hypot(pt.x - clickX, pt.y - clickY);
      if (dist <= 16) {
        clickedMarker = m;
        break;
      }
    }

    if (clickedMarker) {
      this.selectMarkerById(clickedMarker.id);
      // Show weather popup if this marker has weather data
      if (this._weatherData.has(clickedMarker.id)) {
        this._showWeatherPopup(clickedMarker, e.clientX - this.container.getBoundingClientRect().left, e.clientY - this.container.getBoundingClientRect().top);
      }
      return;
    }

    // If location selection is enabled, pick coordinates
    if (this.allowLocationSelect) {
      const coord = this.pointToCoord(clickX, clickY);
      this.setSelectedLocation(coord);
      if (this.onLocationSelect) {
        this.onLocationSelect(coord);
      }
    }
  }

  /**
   * Attach live AccuWeather data to a farm marker.
   * The marker will display a temperature badge and clicking it opens a weather popup.
   * @param {string} farmId - Must match a marker id already added via addMarkers()
   * @param {Object} weatherBundle - { current, forecast, alerts } from weatherService.getWeatherForFarm()
   */
  addWeatherPin(farmId, weatherBundle) {
    if (!weatherBundle || !weatherBundle.current) return;
    this._weatherData.set(farmId, weatherBundle);
    this.render(); // Re-render so temperature badge appears on the pin
  }

  /**
   * Remove weather data for a farm (reverts to plain marker).
   */
  removeWeatherPin(farmId) {
    this._weatherData.delete(farmId);
    this._weatherIconMap.delete(farmId);
    if (this.weatherPopup && this.weatherPopup.dataset.farmId === farmId) {
      this.weatherPopup.style.display = 'none';
    }
    this.render();
  }

  /**
   * Called from render() — draws temperature badge on markers that have weather data.
   * @private
   */
  _renderWeatherBadges() {
    const ctx = this.ctx;
    for (const [farmId, bundle] of this._weatherData) {
      const marker = this.markers.find(m => m.id === farmId);
      if (!marker) continue;
      const { x, y } = this.coordToPoint(marker.lat, marker.lon);
      const temp = bundle.current?.temperature?.value;
      if (temp == null) continue;

      const tempLabel = `${Math.round(temp)}°C`;
      const badgeW = 36;
      const badgeH = 18;
      const bx = x + 8;
      const by = y - 28;

      // Badge background
      ctx.save();
      const tempColor = temp >= 30 ? '#f43f5e' : temp >= 22 ? '#f59e0b' : '#10b981';
      ctx.fillStyle = tempColor;
      this._roundRect(ctx, bx, by, badgeW, badgeH, 4);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tempLabel, bx + badgeW / 2, by + badgeH / 2);
      ctx.restore();
    }
  }

  /**
   * Draw a rounded rectangle path on context.
   * @private
   */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Show the weather popup card for a clicked marker.
   * @private
   */
  _showWeatherPopup(marker, clickX, clickY) {
    const bundle = this._weatherData.get(marker.id);
    if (!bundle || !this.weatherPopup) return;

    const cc = bundle.current;
    const days = bundle.forecast?.days ?? [];
    const alerts = bundle.alerts ?? [];
    const temp = cc?.temperature?.value != null ? `${Math.round(cc.temperature.value)}°C` : 'N/A';
    const feelsLike = cc?.realFeelTemperature?.value != null ? `${Math.round(cc.realFeelTemperature.value)}°C` : '';
    const humidity = cc?.relativeHumidity != null ? `${cc.relativeHumidity}%` : 'N/A';
    const wind = cc?.wind?.speed != null ? `${Math.round(cc.wind.speed)} km/h ${cc.wind.direction ?? ''}` : 'N/A';
    const rain24h = cc?.precipitationLast24hMm != null ? `${cc.precipitationLast24hMm.toFixed(1)} mm` : 'N/A';
    const condition = cc?.weatherText ?? 'N/A';
    const isDayTime = cc?.isDayTime !== false;
    const uv = cc?.uvIndexText ?? '';
    const tempColor = (cc?.temperature?.value ?? 20) >= 30 ? '#f43f5e' : (cc?.temperature?.value ?? 20) >= 22 ? '#f59e0b' : '#10b981';

    // 3-day mini forecast
    const forecastHtml = days.slice(0, 3).map(d => {
      const dateLabel = new Date(d.date).toLocaleDateString('en-ZW', { weekday: 'short' });
      return `
        <div style="text-align:center; flex:1; padding: 6px 4px; background: rgba(255,255,255,0.05); border-radius: 6px;">
          <div style="font-size:0.65rem; color:#94a3b8; margin-bottom:2px;">${dateLabel}</div>
          <div style="font-size:1rem; margin-bottom:2px;">${_getWeatherEmoji(d.icon)}</div>
          <div style="font-size:0.7rem; font-weight:700; color:#f1f5f9;">${d.tempMax}°</div>
          <div style="font-size:0.65rem; color:#64748b;">${d.tempMin}°</div>
          <div style="font-size:0.6rem; color:#38bdf8; margin-top:2px;">${d.rainProbability}% 🌧</div>
        </div>
      `;
    }).join('');

    const alertBadge = alerts.length > 0
      ? `<div style="background:#fef3c7;color:#92400e;padding:4px 8px;font-size:0.68rem;font-weight:600;border-radius:4px;margin-top:6px;">⚠️ ${alerts.length} active alert${alerts.length > 1 ? 's' : ''}</div>`
      : '';

    this.weatherPopup.dataset.farmId = marker.id;
    this.weatherPopup.innerHTML = `
      <div style="background: linear-gradient(135deg, ${tempColor}22, transparent); padding: 14px 16px 10px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
          <div style="font-size:0.7rem; font-weight:700; color:#94a3b8; letter-spacing:0.05em; text-transform:uppercase;">
            📍 ${marker.title ?? 'Farm'}
          </div>
          <button id="wp-close-${marker.id}" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:1rem;line-height:1;padding:2px 4px;" aria-label="Close">&times;</button>
        </div>
        <div style="display:flex; align-items:flex-end; gap:6px;">
          <span style="font-size:2.5rem; font-weight:800; color:${tempColor}; line-height:1;">${temp}</span>
          ${feelsLike ? `<span style="font-size:0.72rem; color:#64748b; padding-bottom:6px;">Feels ${feelsLike}</span>` : ''}
        </div>
        <div style="font-size:0.78rem; color:#e2e8f0; margin-top:2px;">${isDayTime ? '☀️' : '🌙'} ${condition}</div>
        ${alertBadge}
      </div>
      <div style="padding: 8px 16px 12px; border-top: 1px solid rgba(255,255,255,0.06);">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
          <div style="font-size:0.72rem; color:#94a3b8;">💧 Humidity</div><div style="font-size:0.72rem; font-weight:600;">${humidity}</div>
          <div style="font-size:0.72rem; color:#94a3b8;">💨 Wind</div><div style="font-size:0.72rem; font-weight:600;">${wind}</div>
          <div style="font-size:0.72rem; color:#94a3b8;">🌧 Rain 24h</div><div style="font-size:0.72rem; font-weight:600;">${rain24h}</div>
          ${uv ? `<div style="font-size:0.72rem; color:#94a3b8;">☀️ UV</div><div style="font-size:0.72rem; font-weight:600;">${uv}</div>` : ''}
        </div>
        ${days.length > 0 ? `
          <div style="font-size:0.65rem; color:#475569; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:5px;">5-Day Outlook</div>
          <div style="display:flex; gap:4px;">${forecastHtml}</div>
        ` : '<div style="font-size:0.7rem;color:#475569;">Forecast loading...</div>'}
        <div style="margin-top:8px; font-size:0.6rem; color:#334155;">Source: AccuWeather · Cached 30 min</div>
      </div>
    `;

    // Position popup
    const popupW = 280;
    const popupH = 280;
    let left = clickX + 16;
    let top = clickY - popupH / 2;
    if (left + popupW > this.width - 10) left = clickX - popupW - 8;
    if (top < 8) top = 8;
    if (top + popupH > this.height - 8) top = this.height - popupH - 8;

    this.weatherPopup.style.left = `${left}px`;
    this.weatherPopup.style.top = `${top}px`;
    this.weatherPopup.style.display = 'block';

    // Close button handler
    const closeBtn = this.weatherPopup.querySelector(`#wp-close-${marker.id}`);
    if (closeBtn) closeBtn.addEventListener('click', () => { this.weatherPopup.style.display = 'none'; }, { once: true });
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.canvas) {
      this.canvas.remove();
    }
    if (this.tooltip) {
      this.tooltip.remove();
    }
    if (this.stateOverlay) {
      this.stateOverlay.remove();
    }
    if (this.weatherPopup) {
      this.weatherPopup.remove();
    }
  }
}

// Module-level helper: AccuWeather icon number → weather emoji
function _getWeatherEmoji(icon) {
  const map = {
    1:'☀️',2:'🌤️',3:'⛅',4:'🌥️',5:'🌫️',6:'🌥️',7:'☁️',8:'☁️',
    11:'🌫️',12:'🌧️',13:'🌦️',14:'🌦️',15:'⛈️',16:'⛈️',17:'🌩️',18:'🌧️',
    19:'🌨️',22:'❄️',29:'🌧️',30:'🌡️',31:'🥶',32:'💨',
    33:'🌙',34:'🌙',35:'⛅',36:'🌥️',37:'🌫️',38:'🌥️',39:'🌧️',
    40:'🌧️',41:'⛈️',42:'⛈️',43:'🌨️',44:'❄️'
  };
  return map[icon] ?? '🌤️';
}
