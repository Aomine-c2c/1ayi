import { farmService, cropService, weatherService, recommendationService, yieldService, fieldOperationService, adminService, reportService, notificationService, authService } from './services/index.js';
import { renderGisMap, renderWeatherChart } from './components/gisMap.js';
import { showModal } from './components/modal.js';
import { authViews } from './auth/authViews.js?v=2';
import { ui } from './components/ui.js';
import { geoComponents } from './components/geoComponents.js';
import { reportBuilderComponent } from './components/reportBuilder.js';
import { notificationComponents } from './components/notificationComponents.js';
import { ZIM_FARMS } from './geo/zimGeoData.js';

export const views = {
  // 1. Core Unified Dashboard (Executive & Command Center)
  async dashboard(container) {
    const farms = await farmService.listFarms();
    const cycles = await cropService.listCycles();
    const weather = await weatherService.getRecentObservations();
    const recs = await recommendationService.listRecommendations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'National Command Center' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="status-dot"></span>
            <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary-dark); text-transform: uppercase; letter-spacing: 0.6px;">
              Agricultural Yield Intelligence Decision Chain
            </span>
          </div>
          <h1 style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
            Agricultural Command & Intelligence Center
          </h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Farm → Crop → Weather → Suitability Engine → Recommendations → Yield Estimation → Farm Decisions.
          </p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-outline" id="btnLaunchOnboarding">🌱 Farmer Onboarding Wizard</button>
          <button class="btn btn-primary" onclick="location.hash='#intelligence'">⚡ Run Suitability Engine</button>
        </div>
      </div>

      <!-- Decision Chain Pipeline Visualization -->
      <div class="panel" style="padding: 20px; margin-bottom: 24px; background: #ffffff;">
        <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.5px;">
          Core Intelligence Pipeline (Integrated Architecture)
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; overflow-x: auto; padding-bottom: 6px;">
          <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 10px 14px; text-align: center; min-width: 110px;">
            <div style="font-size: 1.2rem;">🏡</div>
            <strong style="font-size: 0.8rem; color: var(--primary-dark);">1. Farms & Fields</strong>
          </div>
          <span style="color: var(--border-color); font-weight: 900;">→</span>
          <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 10px 14px; text-align: center; min-width: 110px;">
            <div style="font-size: 1.2rem;">🌾</div>
            <strong style="font-size: 0.8rem; color: var(--primary-dark);">2. Crop Profiles</strong>
          </div>
          <span style="color: var(--border-color); font-weight: 900;">→</span>
          <div style="background: var(--accent-blue-light); border: 1px solid #7dd3fc; border-radius: var(--radius-sm); padding: 10px 14px; text-align: center; min-width: 110px;">
            <div style="font-size: 1.2rem;">⛅</div>
            <strong style="font-size: 0.8rem; color: var(--accent-blue);">3. Agromet Data</strong>
          </div>
          <span style="color: var(--border-color); font-weight: 900;">→</span>
          <div style="background: var(--accent-purple-light); border: 1px solid #c4b5fd; border-radius: var(--radius-sm); padding: 10px 14px; text-align: center; min-width: 110px;">
            <div style="font-size: 1.2rem;">🧠</div>
            <strong style="font-size: 0.8rem; color: var(--accent-purple);">4. Suitability</strong>
          </div>
          <span style="color: var(--border-color); font-weight: 900;">→</span>
          <div style="background: var(--accent-amber-light); border: 1px solid #fcd34d; border-radius: var(--radius-sm); padding: 10px 14px; text-align: center; min-width: 110px;">
            <div style="font-size: 1.2rem;">💡</div>
            <strong style="font-size: 0.8rem; color: var(--accent-amber);">5. Advisory Recs</strong>
          </div>
          <span style="color: var(--border-color); font-weight: 900;">→</span>
          <div style="background: var(--primary-light); border: 1px solid #6ee7b7; border-radius: var(--radius-sm); padding: 10px 14px; text-align: center; min-width: 110px;">
            <div style="font-size: 1.2rem;">📈</div>
            <strong style="font-size: 0.8rem; color: var(--primary-dark);">6. Yield Harvest</strong>
          </div>
        </div>
      </div>

      <!-- 8-Indicator Executive Metrics Grid -->
      <div class="metrics-grid-8">
        ${ui.metricCard({ label: 'Total Users', value: '12', subtext: 'Active across roles' })}
        ${ui.metricCard({ label: 'Active Farmers', value: '8', subtext: 'Verified in system', color: 'var(--primary-dark)' })}
        ${ui.metricCard({ label: 'Registered Farms', value: farms.length.toString(), subtext: '20.7 ha active', color: 'var(--accent-blue)' })}
        ${ui.metricCard({ label: 'Active Cycles', value: cycles.length.toString(), subtext: 'Current season', color: 'var(--primary-dark)' })}
        <div class="metric-box" style="background: var(--primary-light); border-color: #6ee7b7;">
          <span class="metric-box-label" style="color: var(--primary-dark);">Weather Ingestion</span>
          <span class="metric-box-val" style="color: var(--primary-dark); font-size: 1.25rem; margin-top: 8px;">ONLINE</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Agromet synoptic</span>
        </div>
        ${ui.metricCard({ label: 'Suitability Recs', value: recs.length.toString(), subtext: '94% adoption', color: 'var(--accent-purple)' })}
        <div class="metric-box" style="background: var(--accent-rose-light); border-color: #fda4af;">
          <span class="metric-box-label" style="color: var(--accent-rose);">Active Alerts</span>
          <span class="metric-box-val" style="color: var(--accent-rose);">1</span>
          <span class="metric-box-sub" style="color: var(--accent-rose);">Precipitation advisory</span>
        </div>
        ${ui.metricCard({ label: 'Audit Logs', value: '42', subtext: 'Past 24 hours' })}
      </div>

      <!-- Two-Column Layout: GIS Interactive Map + Diurnal Weather -->
      <div class="grid-two-col">
        <div class="panel">
          <div class="card-header">
            <div>
              <span class="card-title">Geospatial Farm & Field Boundaries</span>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Hover on markers for interactive parcel telemetry</p>
            </div>
            <span class="badge badge-green">Spatial Index Active</span>
          </div>
          <div class="card-body">
            <div class="map-canvas-container">
              <div id="dashboardGisMap" style="height: 100%; min-height: 300px; width: 100%;"></div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="card-header">
            <div>
              <span class="card-title">Diurnal Temperature Trend</span>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Harare Central [ZW-HRE] · Live AccuWeather</p>
            </div>
            <span class="badge badge-blue">Live Observations</span>
          </div>
          <div class="card-body">
            <div class="chart-canvas-container">
              <canvas id="dashboardWeatherChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnLaunchOnboarding')?.addEventListener('click', () => {
      authViews.showFarmerOnboardingWizard(() => views.dashboard(container));
    });

    setTimeout(async () => {
      const { mapFactory } = await import('./geo/mapFactory.js');
      const dashMap = mapFactory.create('dashboardGisMap', {
        center: { lat: -19.0154, lon: 29.1549 },
        zoom: 6,
        interactive: true,
        showFields: true
      });
      dashMap.setMarkers(farms.filter(f => f.latitude != null && f.longitude != null).map(f => ({
        id: f.id,
        lat: f.latitude,
        lon: f.longitude,
        title: f.name,
        crop: f.primaryCrop,
        color: '#059669'
      })));
      renderWeatherChart('dashboardWeatherChart', weather);
    }, 50);
  },

  // 2. Farms & Fields Geospatial Registry — with AccuWeather live weather per farm
  async farms(container) {
    const farms = await farmService.listFarms();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Farms & Fields Registry' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Farm & Field Geospatial Registry</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Live AccuWeather conditions per farm · MySQL 8 spatial POINT (SRID 4326) · Click a farm pin for live weather
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-outline" id="btnRefreshWeather" title="Refresh AccuWeather data for all farms">🔄 Refresh Weather</button>
          <button class="btn btn-primary" id="btnRegisterFarmPrompt">+ Register Farm (GPS)</button>
        </div>
      </div>

      <!-- Interactive Farm Map with AccuWeather pins -->
      <div class="panel" style="padding: 0; margin-bottom: 24px; overflow: hidden; border-radius: var(--radius);">
        <div style="padding: 14px 20px; border-bottom: 1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between;">
          <div>
            <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
              🗺️ Zimbabwe Farm Network — Live AccuWeather Intelligence Map
            </span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span id="weatherMapStatus" style="font-size:0.72rem;color:var(--text-muted);">Loading weather data...</span>
            <div style="display:flex;gap:4px;align-items:center;font-size:0.68rem;color:var(--text-muted);">
              <span style="background:#10b981;width:8px;height:8px;border-radius:50%;display:inline-block;"></span>&lt;22°C
              <span style="background:#f59e0b;width:8px;height:8px;border-radius:50%;display:inline-block;margin-left:4px;"></span>22-29°C
              <span style="background:#f43f5e;width:8px;height:8px;border-radius:50%;display:inline-block;margin-left:4px;"></span>30°C+
            </div>
          </div>
        </div>
        <div id="farmsWeatherMapCanvas" style="height: 380px; position: relative;"></div>
      </div>

      ${ui.searchAndFilterBar({
        id: 'farmsFilterBar',
        placeholder: 'Search farms by name, region, or primary crop...',
        filters: [
          { label: 'Region', key: 'region', options: ['Mashonaland Central', 'Mashonaland East', 'Mashonaland West', 'Manicaland', 'Midlands', 'Masvingo', 'Matabeleland North', 'Matabeleland South'] },
          { label: 'Soil Type', key: 'soil', options: ['Volcanic Loam', 'Clay Loam', 'Sandy Loam', 'Sandy Clay Loam', 'Vertisol'] }
        ]
      })}

      <div id="farmsGridContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        ${farms.map(f => `
          <div class="panel farm-card" data-id="${f.id}" data-name="${f.name.toLowerCase()}" data-region="${(f.region || '').toLowerCase()}" style="padding: 22px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${f.name}</h3>
                <span style="font-size: 0.8125rem; color: var(--primary-dark); font-weight: 700;">${f.region || 'Zimbabwe'}</span>
              </div>
              <span class="badge badge-green">${f.sizeHa} Hectares</span>
            </div>

            <!-- Live AccuWeather strip (populated asynchronously) -->
            <div id="weatherStrip_${f.id}" style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; display:flex; align-items:center; justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border:2px solid rgba(255,255,255,0.1);border-top-color:#10b981;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                <span style="font-size:0.75rem;color:#94a3b8;">Fetching AccuWeather...</span>
              </div>
              <span style="font-size:0.65rem;color:#475569;">📍 ${f.latitude != null ? `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}` : 'No GPS set'}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 18px; background: var(--bg-primary); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div><strong style="color: var(--text-muted);">Primary Crop:</strong> ${f.primaryCrop}</div>
              <div><strong style="color: var(--text-muted);">Soil Type:</strong> ${f.soilType}</div>
              <div><strong style="color: var(--text-muted);">Irrigation:</strong> ${f.irrigationType}</div>
              <div><strong style="color: var(--text-muted);">Elevation:</strong> ${f.elevationM != null ? f.elevationM + 'm' : 'N/A'}</div>
              <div style="grid-column: span 2;"><strong style="color: var(--text-muted);">GPS:</strong>
                ${f.latitude != null ? `<code>POINT(${f.longitude} ${f.latitude})</code>` : '<span style="color:#f59e0b;">⚠️ No coordinates set</span>'}
              </div>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-outline" style="flex: 1; font-size: 0.775rem;" id="btnFarmDetails_${f.id}">Farm Details</button>
              <button class="btn btn-outline" style="flex: 1; font-size: 0.775rem;" id="btnFarmWeather_${f.id}">🌤️ Full Weather</button>
              <button class="btn btn-primary" style="flex: 1; font-size: 0.775rem;" id="btnFarmMap_${f.id}">GIS Map</button>
            </div>
          </div>
        `).join('')}
      </div>

      ${ui.pagination({ current: 1, totalPages: 1 })}
    `;

    // ── Initialize canvas map with farm markers ──────────────────────────────
    let farmMap = null;
    try {
      const { mapFactory } = await import('./geo/mapFactory.js');
      farmMap = mapFactory.create('farmsWeatherMapCanvas', {
        center: { lat: -19.0154, lon: 29.1549 },
        zoom: 7,
        interactive: true,
        showFields: false
      });

      // Add farm markers
      if (farms.length > 0) {
        farmMap.addMarkers(farms.filter(f => f.latitude != null && f.longitude != null).map(f => ({
          id: f.id,
          lat: f.latitude,
          lon: f.longitude,
          title: f.name,
          crop: f.primaryCrop,
          color: '#059669'
        })));
      }
    } catch (e) {
      console.warn('[farmsView] Map initialization failed:', e);
    }

    // ── Fetch AccuWeather data per farm & update strips + map pins ───────────
    const loadWeatherForFarms = async () => {
      const statusEl = container.querySelector('#weatherMapStatus');
      if (statusEl) statusEl.textContent = 'Fetching AccuWeather data...';

      const weatherPromises = farms.map(async (f) => {
        try {
          const bundle = await weatherService.getWeatherForFarm(f);
          _updateFarmWeatherStrip(container, f, bundle);
          if (farmMap && f.latitude != null) {
            farmMap.addWeatherPin(f.id, bundle);
          }
          return bundle;
        } catch (e) {
          _setFarmWeatherStripError(container, f, 'Weather unavailable');
          return null;
        }
      });

      await Promise.allSettled(weatherPromises);
      if (statusEl) statusEl.textContent = `Live AccuWeather · Updated ${new Date().toLocaleTimeString()}`;
    };

    // Start loading weather (non-blocking)
    loadWeatherForFarms();

    // ── Refresh button ────────────────────────────────────────────────────────
    container.querySelector('#btnRefreshWeather')?.addEventListener('click', () => {
      // Reset strips to loading state
      farms.forEach(f => {
        const strip = container.querySelector(`#weatherStrip_${f.id}`);
        if (strip) {
          strip.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:20px;height:20px;border:2px solid rgba(255,255,255,0.1);border-top-color:#10b981;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
              <span style="font-size:0.72rem;color:#94a3b8;">Refreshing...</span>
            </div>`;
        }
      });
      loadWeatherForFarms();
    });

    // ── Full Weather modal per farm ───────────────────────────────────────────
    farms.forEach(f => {
      container.querySelector(`#btnFarmWeather_${f.id}`)?.addEventListener('click', async () => {
        const modal = showModal({
          title: `🌤️ Live Weather — ${f.name}`,
          contentHtml: `
            <div style="text-align:center;padding:24px;">
              <div style="width:32px;height:32px;border:3px solid rgba(0,0,0,0.1);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
              <span style="color:var(--text-muted);font-size:0.875rem;">Fetching live AccuWeather data for ${f.name}...</span>
            </div>`,
          confirmText: 'Close'
        });

        try {
          const bundle = await weatherService.getWeatherForFarm(f);
          const cc = bundle.current;
          const days = bundle.forecast?.days ?? [];
          const alerts = bundle.alerts ?? [];

          const temp = cc?.temperature?.value != null ? `${Math.round(cc.temperature.value)}°C` : 'N/A';
          const feelsLike = cc?.realFeelTemperature?.value != null ? ` (Feels ${Math.round(cc.realFeelTemperature.value)}°C)` : '';
          const humid = cc?.relativeHumidity != null ? `${cc.relativeHumidity}%` : 'N/A';
          const wind = cc?.wind?.speed != null ? `${Math.round(cc.wind.speed)} km/h ${cc.wind.direction ?? ''}` : 'N/A';
          const rain24h = cc?.precipitationLast24hMm != null ? `${cc.precipitationLast24hMm.toFixed(1)} mm` : 'N/A';
          const cond = cc?.weatherText ?? 'N/A';
          const pressure = cc?.pressureHpa != null ? `${cc.pressureHpa.toFixed(0)} hPa` : 'N/A';
          const uv = cc?.uvIndex != null ? `${cc.uvIndex} (${cc.uvIndexText ?? ''})` : 'N/A';
          const visibility = cc?.visibility != null ? `${cc.visibility} km` : 'N/A';
          const cloud = cc?.cloudCoverPct != null ? `${cc.cloudCoverPct}%` : 'N/A';
          const isDayTime = cc?.isDayTime !== false;
          const tempColor = (cc?.temperature?.value ?? 20) >= 30 ? '#f43f5e' : (cc?.temperature?.value ?? 20) >= 22 ? '#f59e0b' : '#10b981';

          const alertHtml = alerts.length > 0 ? `
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px;margin-bottom:16px;">
              <strong style="color:#92400e;">⚠️ ${alerts.length} Active Weather Alert${alerts.length > 1 ? 's' : ''}</strong>
              ${alerts.slice(0, 2).map(a => `<div style="font-size:0.78rem;color:#78350f;margin-top:4px;">• ${a.description ?? a.category}</div>`).join('')}
            </div>` : '';

          const forecastHtml = days.length > 0 ? days.slice(0, 5).map(d => {
            const dateLabel = new Date(d.date).toLocaleDateString('en-ZW', { weekday: 'short', month: 'short', day: 'numeric' });
            return `
              <div style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;padding:10px;text-align:center;min-width:100px;">
                <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px;">${dateLabel}</div>
                <div style="font-size:1.4rem;">${_getForecastEmoji(d.icon)}</div>
                <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">${d.tempMax}° / ${d.tempMin}°</div>
                <div style="font-size:0.68rem;color:#3b82f6;">${d.rainProbability}% 🌧</div>
                <div style="font-size:0.65rem;color:var(--text-muted);margin-top:3px;">${d.condition}</div>
              </div>`;
          }).join('') : '<div style="color:var(--text-muted);font-size:0.8rem;">Forecast unavailable</div>';

          const bodyEl = document.querySelector('.modal-content');
          if (bodyEl) bodyEl.innerHTML = `
            ${alertHtml}
            <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:20px;padding:16px;background:linear-gradient(135deg,${tempColor}15,transparent);border-radius:8px;border:1px solid ${tempColor}30;">
              <div>
                <div style="font-size:3rem;font-weight:900;color:${tempColor};line-height:1;">${temp}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">${feelsLike}</div>
                <div style="font-size:0.9rem;color:var(--text-primary);margin-top:4px;">${isDayTime ? '☀️' : '🌙'} ${cond}</div>
              </div>
              <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.78rem;">
                <div><span style="color:var(--text-muted);">💧 Humidity:</span> <strong>${humid}</strong></div>
                <div><span style="color:var(--text-muted);">💨 Wind:</span> <strong>${wind}</strong></div>
                <div><span style="color:var(--text-muted);">🌧 Rain 24h:</span> <strong>${rain24h}</strong></div>
                <div><span style="color:var(--text-muted);">☀️ UV:</span> <strong>${uv}</strong></div>
                <div><span style="color:var(--text-muted);">📊 Pressure:</span> <strong>${pressure}</strong></div>
                <div><span style="color:var(--text-muted);">👁️ Visibility:</span> <strong>${visibility}</strong></div>
                <div><span style="color:var(--text-muted);">☁️ Cloud Cover:</span> <strong>${cloud}</strong></div>
                <div><span style="color:var(--text-muted);">📍 GPS:</span> <strong>${f.latitude != null ? `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}` : 'N/A'}</strong></div>
              </div>
            </div>
            <div style="margin-bottom:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.5px;">5-Day Forecast</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">${forecastHtml}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);text-align:right;">Source: AccuWeather · Cached 30 min · ${new Date().toLocaleTimeString()}</div>
          `;
        } catch (err) {
          console.error('[farmsView] Full weather modal error:', err);
        }
      });
    });

    // ── Farm Details modals ───────────────────────────────────────────────────
    farms.forEach(f => {
      container.querySelector(`#btnFarmDetails_${f.id}`)?.addEventListener('click', () => {
        showModal({
          title: `Farm Details: ${f.name}`,
          contentHtml: `
            <div style="font-size: 0.875rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; background: var(--bg-primary); padding: 12px; border-radius: var(--radius-xs);">
                <div>Region: <strong>${f.region || 'Zimbabwe'}</strong></div>
                <div>Size: <strong>${f.sizeHa} Hectares</strong></div>
                <div>Primary Crop: <strong>${f.primaryCrop}</strong></div>
                <div>Soil Type: <strong>${f.soilType}</strong></div>
                <div>Irrigation: <strong>${f.irrigationType}</strong></div>
                <div>Elevation: <strong>${f.elevationM != null ? f.elevationM + 'm AMSL' : 'N/A'}</strong></div>
                <div style="grid-column: span 2;">GPS Centroid: <code>${f.latitude != null ? `POINT(${f.longitude} ${f.latitude})` : 'Not set'}</code></div>
              </div>
              <p style="color: var(--text-secondary); line-height: 1.5;">${f.description || 'Active commercial farm registered under the AYIS Zimbabwe Agricultural Intelligence System.'}</p>
            </div>
          `,
          confirmText: 'Done'
        });
      });

      container.querySelector(`#btnFarmMap_${f.id}`)?.addEventListener('click', () => {
        const matchedZimFarm = ZIM_FARMS.find(zf => zf.id === f.id) || {
          ...f,
          riskStatus: 'OPTIMAL',
          suitabilityScore: 90,
          suitabilityClass: 'Highly Suitable (S1)',
          weatherAlert: null,
          weatherContext: { temp: 23.5, humidity: 62, rain24h: 1.2, forecastRain48h: 15.0, windSpeed: 5.6 },
          fields: [
            { id: 'fld-01', name: 'North Cadastral Parcel', areaHa: (f.sizeHa * 0.6).toFixed(1), crop: f.primaryCrop },
            { id: 'fld-02', name: 'South Rotation Terrace', areaHa: (f.sizeHa * 0.4).toFixed(1), crop: 'Legume Rotation' }
          ]
        };
        geoComponents.showFarmDetailsModal(matchedZimFarm);
      });
    });

    // ── Register Farm with GPS ────────────────────────────────────────────────
    container.querySelector('#btnRegisterFarmPrompt')?.addEventListener('click', async () => {
      const { getCurrentPosition, formatCoordinates, describeAccuracy } = await import('./services/geolocationService.js');

      showModal({
        title: '📍 Register Farm with GPS Location',
        contentHtml: `
          <div style="font-size:0.875rem;">
            <div id="gpsStatus" style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;padding:14px;margin-bottom:16px;text-align:center;">
              <button class="btn btn-primary" id="btnGetGPS" style="width:100%;">📍 Get My Current GPS Location</button>
              <div id="gpsResult" style="margin-top:10px;font-size:0.8rem;color:var(--text-muted);"></div>
            </div>
            <input type="hidden" id="regFarmLat" value="">
            <input type="hidden" id="regFarmLon" value="">
            <div class="form-group">
              <label class="form-label">Farm Name *</label>
              <input class="form-input" id="regFarmName" placeholder="e.g. Mashonaland Highveld Estate">
            </div>
            <div class="form-group">
              <label class="form-label">Primary Crop *</label>
              <input class="form-input" id="regFarmCrop" placeholder="e.g. White Maize (SC719)">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Size (Hectares)</label>
                <input class="form-input" id="regFarmSize" type="number" min="0.1" placeholder="12.5">
              </div>
              <div class="form-group">
                <label class="form-label">Elevation (m AMSL)</label>
                <input class="form-input" id="regFarmElev" type="number" placeholder="1250">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Soil Classification</label>
              <select class="form-input" id="regFarmSoil">
                <option>Sandy Clay Loam (Fersiallitic)</option>
                <option>Vertisol (Black clay)</option>
                <option>Volcanic Loam</option>
                <option>Granitic Sandy Loam</option>
                <option>Alluvial Loam</option>
              </select>
            </div>
          </div>
        `,
        confirmText: 'Register Farm',
        onConfirm: async () => {
          const lat = parseFloat(document.querySelector('#regFarmLat')?.value) || -17.8252;
          const lon = parseFloat(document.querySelector('#regFarmLon')?.value) || 31.0335;
          const name = document.querySelector('#regFarmName')?.value?.trim();
          const primaryCrop = document.querySelector('#regFarmCrop')?.value?.trim() || 'White Maize (SC719)';
          const sizeHa = parseFloat(document.querySelector('#regFarmSize')?.value) || 12.5;
          const elevationM = parseInt(document.querySelector('#regFarmElev')?.value) || 1250;
          const soilType = document.querySelector('#regFarmSoil')?.value || 'Sandy Clay Loam (Fersiallitic)';

          if (!name) {
            showModal({ title: 'Validation Notice', contentHtml: '<p>Farm name is required.</p>', confirmText: 'OK' });
            return;
          }

          await farmService.createFarm({
            name,
            primaryCrop,
            sizeHa,
            latitude: lat,
            longitude: lon,
            elevationM,
            soilType,
            region: 'Natural Region II (Highveld)'
          });

          views.farms(container);
        }
      });

      // Wire up GPS button after modal renders
      setTimeout(() => {
        document.querySelector('#btnGetGPS')?.addEventListener('click', async () => {
          const btn = document.querySelector('#btnGetGPS');
          const resultEl = document.querySelector('#gpsResult');
          if (btn) { btn.textContent = '⏳ Acquiring GPS...'; btn.disabled = true; }
          try {
            const pos = await getCurrentPosition();
            if (document.querySelector('#regFarmLat')) document.querySelector('#regFarmLat').value = pos.lat;
            if (document.querySelector('#regFarmLon')) document.querySelector('#regFarmLon').value = pos.lon;
            if (resultEl) resultEl.innerHTML = `
              <span style="color:#10b981;font-weight:700;">✅ Location acquired!</span><br>
              📍 ${formatCoordinates(pos.lat, pos.lon)}<br>
              <span style="color:var(--text-muted);">Accuracy: ${describeAccuracy(pos.accuracy)} (±${pos.accuracy}m)</span>
            `;
            if (btn) { btn.textContent = '✅ GPS Location Set'; btn.style.background = '#10b981'; }
          } catch (err) {
            if (resultEl) resultEl.innerHTML = `<span style="color:#f43f5e;">❌ ${err.message}</span>`;
            if (btn) { btn.textContent = '📍 Get My Current GPS Location'; btn.disabled = false; }
          }
        });
      }, 100);
    });

    // ── Search & filter ───────────────────────────────────────────────────────
    const searchInput = container.querySelector('#farmsFilterBar .search-input');
    const cards = container.querySelectorAll('.farm-card');
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      cards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? 'block' : 'none';
      });
    });
  },

  // 3. Crops & FAO Agronomic Database

  async crops(container) {
    const crops = await cropService.listCrops();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Crop Agronomic Catalog' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Crop Agronomic Catalog & FAO Database</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Reference physiological thresholds, growing degree days (GDD), and agro-climatic boundaries
        </p>
      </div>

      ${ui.searchAndFilterBar({
        id: 'cropsFilterBar',
        placeholder: 'Search crop by common name or botanical classification...',
        filters: [
          { label: 'Category', options: ['Cereal Grain', 'Legume / Pulse', 'Tuber / Root Crop'] }
        ]
      })}

      <div class="panel">
        <table class="data-table" id="cropsTable">
          <thead>
            <tr>
              <th>Crop Name</th>
              <th>Category</th>
              <th>Optimal Temperature</th>
              <th>Growing Period</th>
              <th>Benchmark Yield Potential</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${crops.map(c => `
              <tr class="crop-row">
                <td><strong style="color: var(--text-primary); font-size: 0.9rem;">${c.name}</strong></td>
                <td><span class="badge badge-blue">${c.category}</span></td>
                <td>${c.temp}</td>
                <td>${c.days} Days</td>
                <td><strong style="color: var(--primary-dark);">${c.typicalYield}</strong></td>
                <td>
                  <button class="btn btn-outline btn-view-crop-spec" data-id="${c.id}" data-name="${c.name}" style="padding: 4px 10px; font-size: 0.75rem;">
                    🔍 Agronomic Spec
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${ui.pagination({ current: 1, totalPages: 1 })}
    `;

    // Filter table
    const searchInput = container.querySelector('#cropsFilterBar .search-input');
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      container.querySelectorAll('#cropsTable tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    // Agronomic Spec Modal
    container.querySelectorAll('.btn-view-crop-spec').forEach(btn => {
      btn.addEventListener('click', () => {
        const cropName = btn.getAttribute('data-name');
        const crop = crops.find(c => c.name === cropName) || crops[0];

        showModal({
          title: `FAO Agronomic Spec: ${crop.name}`,
          maxWidth: '640px',
          confirmText: 'Done',
          contentHtml: `
            <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 14px;">
              <div style="background: var(--bg-primary); padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${crop.name}</h3>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Category: <strong>${crop.category}</strong></div>
                </div>
                <span class="badge badge-green" style="font-size: 0.75rem;">FAO ECOCROP VERIFIED</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 12px;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">🌡️ Thermal Thresholds</strong>
                  <div>Optimal Temp: <strong>${crop.temp}</strong></div>
                  <div>Base Cardinal Temp: <strong>10.0 °C</strong></div>
                  <div>Maximum Heat Stress: <strong>36.0 °C</strong></div>
                </div>
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 12px;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">💧 Hydrological Window</strong>
                  <div>Precipitation Band: <strong>550 - 900 mm</strong></div>
                  <div>Drought Sensitivity: <strong>Moderate (Flowering sensitive)</strong></div>
                  <div>Irrigation Response: <strong>High Yield Elasticity</strong></div>
                </div>
              </div>

              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 12px;">
                <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">🧪 Soil & Nutrient Preferences</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div>pH Buffer: <strong>5.8 – 6.8 (Optimal)</strong></div>
                  <div>Drainage: <strong>Well-drained Loam / Volcanic</strong></div>
                  <div>Growing Period: <strong>${crop.days} Days to Maturity</strong></div>
                  <div>Target Yield: <strong>${crop.typicalYield}</strong></div>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-outline" onclick="location.hash='#intelligence'">Assess Field Suitability →</button>
              </div>
            </div>
          `
        });
      });
    });
  },

  // 4. Crop Phenological Cycles
  async cycles(container) {
    const cycles = await cropService.listCycles();
    const farms = await farmService.listFarms();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Crop Phenological Cycles' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Crop Phenological Cycles & Stages</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Stage progression and yield targets monitored across active production fields
          </p>
        </div>
        <button class="btn btn-primary" id="btnNewCycleModal">+ New Crop Cycle</button>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Farm & Field</th>
              <th>Crop / Variety</th>
              <th>Current Stage</th>
              <th>Target Yield</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${cycles.map(c => `
              <tr>
                <td><strong>${c.farm}</strong><br><small style="color: var(--text-muted);">${c.field}</small></td>
                <td><strong>${c.crop}</strong><br><small style="color: var(--text-muted);">${c.variety || 'Commercial'}</small></td>
                <td><span class="badge badge-blue">${c.stage}</span></td>
                <td><strong style="color: var(--text-primary);">${c.targetYield}</strong></td>
                <td>${ui.statusIndicator(c.status)}</td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#intelligence'">Suitability</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btnNewCycleModal')?.addEventListener('click', () => {
      showModal({
        title: 'Plan New Crop Phenological Cycle',
        confirmText: 'Register & Launch Cycle',
        maxWidth: '520px',
        contentHtml: `
          <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.85rem;">
            <div class="form-group">
              <label class="form-label">Select Target Farm</label>
              <select class="form-input" name="farm">
                ${farms.map(f => `<option value="${f.name}">${f.name} (${f.region})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Field / Parcel Designation</label>
              <input class="form-input" name="field" value="North Cadastral Parcel 1" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Crop Cultivar</label>
                <input class="form-input" name="crop" value="White Maize (SC719)" required>
              </div>
              <div class="form-group">
                <label class="form-label">Target Yield (MT/ha)</label>
                <input class="form-input" name="targetYield" type="number" step="0.1" value="6.5" required>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Start / Planting Date</label>
                <input class="form-input" name="startDate" type="date" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Hectares Under Cultivation</label>
                <input class="form-input" name="areaHa" type="number" step="0.1" value="5.0" required>
              </div>
            </div>
          </div>
        `,
        onConfirm: async (formData) => {
          await cropService.createCycle({
            farm: formData.farm,
            field: formData.field,
            crop: formData.crop,
            targetYield: `${formData.targetYield} t/ha`,
            startDate: formData.startDate,
            areaHa: formData.areaHa
          });
          views.cycles(container);
        }
      });
    });
  },

  // 5. Agrometeorological Weather Telemetry
  async weather(container) {
    const weather = await weatherService.getRecentObservations();
    const forecasts = await weatherService.getForecasts();
    const alerts = await weatherService.getAlerts();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Agrometeorological Telemetry' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Agrometeorological Telemetry & Synoptic Forecast</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Live observations ingested from regional weather stations with precipitation, solar radiation, and GDD metrics
        </p>
      </div>

      <!-- Active Weather Advisories -->
      ${alerts.map(a => ui.alert({
        type: a.severity === 'HIGH' ? 'critical' : 'warning',
        title: `${a.severity} ADVISORY: ${a.headline}`,
        message: `Region: <strong>${a.region}</strong> · Valid Until: ${a.effectiveUntil}`
      })).join('')}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.1rem; font-weight: 800;">Harare Central [ZW-HRE] 24h Diurnal Curve</h3>
          <span class="badge badge-green">Live Sensor Telemetry</span>
        </div>
        <div class="chart-canvas-container" style="height: 320px;">
          <canvas id="weatherFullChart"></canvas>
        </div>
      </div>

      <!-- 5-Day Agricultural Forecast Grid -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 16px;">5-Day Agricultural Forecast & Spraying Windows</h3>
        ${(Array.isArray(forecasts) ? forecasts : (forecasts?.days ?? [])).length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
            ${(Array.isArray(forecasts) ? forecasts : (forecasts?.days ?? [])).map(f => `
              <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; text-align: center;">
                <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-muted);">${f.date}</div>
                <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary); margin: 6px 0;">${f.tempMax}° / ${f.tempMin}°</div>
                <div style="font-size: 0.8rem; color: var(--accent-blue); font-weight: 700;">💧 ${f.rainMm} mm (${f.rainProbability}%)</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">${f.condition}</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="color: var(--text-muted); font-size: 0.875rem;">
            ${forecasts?.headline || 'No 5-day forecast data currently available.'}
          </div>
        `}
      </div>

      <div class="panel">
        <div class="card-header"><span class="card-title">Synoptic Station Records Feed</span></div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Observation Time</th>
              <th>Dry Bulb Temp</th>
              <th>Relative Humidity</th>
              <th>Precipitation</th>
              <th>Wind Speed</th>
            </tr>
          </thead>
          <tbody>
            ${weather.map(w => `
              <tr>
                <td><strong>${w.time}</strong></td>
                <td><strong style="color: var(--text-primary);">${w.temp}°C</strong></td>
                <td>${w.humidity}%</td>
                <td>${w.rain} mm</td>
                <td>${w.wind} km/h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    setTimeout(() => renderWeatherChart('weatherFullChart', weather), 50);
  },

  // 6. Suitability & Yield Intelligence Engine
  async intelligence(container) {
    const recs = await recommendationService.listRecommendations();
    const suitability = await recommendationService.getSuitabilityAnalysis();
    const yieldEstimates = await yieldService.getEstimates();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Suitability & Yield Intelligence' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Crop Suitability & Yield Engine</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Multi-criteria evaluation combining soil chemistry, climate thresholds, and phenological models
        </p>
      </div>

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary);">
              ${suitability.cropName} on Field A
            </h2>
            <p style="color: var(--primary-dark); font-weight: 800; font-size: 0.95rem; margin-top: 2px;">
              CLASS S1: HIGHLY SUITABLE (Score: ${suitability.overallScore} / 100)
            </p>
          </div>
          <span class="badge badge-green" style="font-size: 0.85rem; padding: 6px 14px;">Optimal Agromet Match</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div style="background: var(--bg-primary); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Thermal Regime</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">${suitability.thermalScore}%</div>
            <span style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 600;">Optimal vegetative GDD</span>
          </div>

          <div style="background: var(--bg-primary); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Water Balance</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">${suitability.rainfallScore}%</div>
            <span style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 600;">Satisfactory precipitation</span>
          </div>

          <div style="background: var(--bg-primary); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Edaphic (Soil & pH)</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">${suitability.soilScore}%</div>
            <span style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 600;">Volcanic Loam (pH 6.4)</span>
          </div>
        </div>

        <div style="margin-top: 16px; padding: 12px 16px; background: var(--bg-primary); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary);">
          <strong>Limiting Factors Analysis:</strong> ${suitability.limitingFactors}
        </div>
      </div>

      <!-- Yield Modeling Projection Table -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header"><span class="card-title">Phenological Yield Estimation Benchmarks</span></div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Crop Cultivar</th>
              <th>Planted Area</th>
              <th>County Benchmark</th>
              <th>Projected Yield</th>
              <th>Confidence</th>
              <th>Yield Delta</th>
            </tr>
          </thead>
          <tbody>
            ${yieldEstimates.map(y => `
              <tr>
                <td><strong>${y.crop}</strong></td>
                <td>${y.areaHa} ha</td>
                <td>${y.benchmarkKgHa} kg/ha</td>
                <td><strong style="color: var(--primary-dark); font-size: 0.95rem;">${y.projectedKgHa} kg/ha</strong></td>
                <td><span class="badge badge-green">${y.confidence}</span></td>
                <td><strong style="color: var(--primary-dark);">+${y.variancePct}%</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Actionable Agronomic Recommendations Feed (Using Reusable Recommendation Cards) -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">Targeted Agronomic Recommendations Feed</span>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Generated from C# suitability models, FAO criteria, and synoptic weather feeds
            </p>
          </div>
          <span class="badge badge-green">${recs.length} Active Advisories</span>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
            ${recs.map(r => ui.recommendationCard(r)).join('')}
          </div>
        </div>
      </div>
    `;

    // Bind recommendation detail modal triggers
    container.querySelectorAll('.btn-view-rec-detail').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const rec = await recommendationService.getRecommendationById(id);
        views.showRecommendationDetailModal(rec);
      });
    });
  },

  /**
   * Detailed Recommendation Page / Modal containing:
   * 1. Recommendation
   * 2. Confidence
   * 3. Supporting weather
   * 4. Crop suitability
   * 5. Risk factors
   * 6. Historical comparison
   * 7. Suggested action
   * 8. Validity period
   */
  showRecommendationDetailModal(r) {
    showModal({
      title: `Advisory Detail: ${r.crop} (${r.recommendationType})`,
      confirmText: 'Acknowledge & Close',
      contentHtml: `
        <div style="font-size: 0.875rem; line-height: 1.5;">
          
          <!-- 1. Recommendation -->
          <div style="padding: 14px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-color); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="badge ${r.riskScore > 60 ? 'badge-rose' : 'badge-green'}">${(r.recommendationType || 'ADVISORY').toUpperCase()}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">ID: <code>${r.id}</code></span>
            </div>
            <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--text-primary); margin-bottom: 6px;">
              "${r.recommendationMessage || r.title}"
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">
              <strong>Reason:</strong> ${r.recommendationReason || r.reason}
            </p>
          </div>

          <!-- 2. Confidence & 4. Crop Suitability (Visual Scoring Gauges) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); background: white;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Confidence Score</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: var(--accent-blue); margin: 4px 0;">${r.confidenceScore}%</div>
              ${ui.scoreBar({ label: 'Model Confidence', score: r.confidenceScore, color: 'var(--accent-blue)', showPercentage: false })}
            </div>

            <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); background: white;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Crop Suitability</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: var(--primary-dark); margin: 4px 0;">${r.suitabilityScore}%</div>
              ${ui.scoreBar({ label: 'Agro-Ecological Match', score: r.suitabilityScore, color: 'var(--primary)', showPercentage: false })}
            </div>
          </div>

          <!-- 3. Supporting Weather -->
          <div style="margin-bottom: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 14px; background: var(--bg-primary);">
            <strong style="display: block; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 8px;">⛅ Supporting Weather Factors</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem;">
              <div>Recent Rainfall: <strong>${r.weatherFactors?.recentRainfall || 'Adequate'}</strong></div>
              <div>Temperature: <strong>${r.weatherFactors?.temperature || 'Favourable'}</strong></div>
              <div>Forecast Rainfall: <strong>${r.weatherFactors?.forecastRainfall || 'Moderate'}</strong></div>
              <div>Current Season: <strong>${r.weatherFactors?.currentSeason || 'Suitable'}</strong></div>
            </div>
          </div>

          <!-- 5. Risk Factors -->
          <div style="margin-bottom: 16px;">
            <strong style="display: block; font-size: 0.85rem; color: #991b1b; margin-bottom: 6px;">⚠️ Identified Risk Factors (Score: ${r.riskScore}%)</strong>
            <ul style="padding-left: 18px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
              ${(r.riskFactors || ['Standard seasonal variance within manageable parameters']).map(rf => `<li>${rf}</li>`).join('')}
            </ul>
          </div>

          <!-- 6. Historical Comparison -->
          <div style="margin-bottom: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: var(--radius-xs); padding: 12px;">
            <strong style="display: block; font-size: 0.8rem; color: var(--accent-purple); text-transform: uppercase;">📊 Historical Comparison</strong>
            <p style="font-size: 0.825rem; color: #581c87; margin-top: 4px;">
              ${r.historicalComparison || 'Matches 5-year historical production averages across sub-zone.'}
            </p>
          </div>

          <!-- 7. Suggested Action -->
          <div style="margin-bottom: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-xs); padding: 12px;">
            <strong style="display: block; font-size: 0.8rem; color: #065f46; text-transform: uppercase;">🌱 Suggested Operational Action</strong>
            <p style="font-size: 0.85rem; color: #065f46; font-weight: 700; margin-top: 4px;">
              "${r.suggestedAction}"
            </p>
          </div>

          <!-- 8. Validity Period & Audit Metadata -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <span>Created: <strong>${r.createdDate}</strong></span>
            <span>Validity Window: <strong style="color: var(--accent-rose);">${r.validUntil}</strong></span>
          </div>

        </div>
      `
    });
  },

  // 7. Reports & Export Hub
  async reports(container) {
    const reports = await reportService.listReports();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Intelligence Reports' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Yield & Agromet Intelligence Reports</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Exportable seasonal analytics, farm performance summaries, and regulatory compliance audits
          </p>
        </div>
        <button class="btn btn-primary" id="btnExportReport">+ Generate Report</button>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Category</th>
              <th>Coverage Region</th>
              <th>Format</th>
              <th>Generated Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td><strong>${r.title}</strong></td>
                <td><span class="badge badge-green">${r.category}</span></td>
                <td>${r.region}</td>
                <td><span class="badge badge-blue">${r.format}</span></td>
                <td>${r.date}</td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-outline btn-download-report" data-id="${r.id}" data-title="${r.title}" data-format="${r.format}" style="padding: 4px 10px; font-size: 0.75rem;">
                      📥 Download
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Trigger file download helper
    const triggerDownload = (filename, content, mimeType) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    container.querySelectorAll('.btn-download-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        const format = btn.getAttribute('data-format') || 'CSV';

        if (format.includes('PDF')) {
          showModal({
            title: `Report Export: ${title}`,
            maxWidth: '600px',
            confirmText: 'Print / Save as PDF',
            contentHtml: `
              <div style="font-size: 0.85rem; padding: 6px 0;">
                <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px;">
                  <strong style="color: var(--text-primary); font-size: 0.95rem;">${title}</strong>
                  <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">
                    Generated: ${new Date().toLocaleDateString()} · Format: High-Resolution Vector PDF
                  </div>
                </div>
                <p style="color: var(--text-secondary); line-height: 1.5;">
                  Your seasonal report is formatted with high-contrast data charts, agro-ecological suitability scores, and spatial boundary coordinates. Click below to launch direct browser print or save to PDF.
                </p>
              </div>
            `,
            onConfirm: () => {
              window.print();
            }
          });
        } else if (format.includes('GeoJSON')) {
          const geoJsonData = {
            type: 'FeatureCollection',
            metadata: { title, id, datum: 'WGS84 EPSG:4326', generated: new Date().toISOString() },
            features: [
              {
                type: 'Feature',
                properties: { name: 'Parcel A', crop: 'Maize', suitability: 'Highly Suitable (S1)', score: 92 },
                geometry: { type: 'Polygon', coordinates: [[[31.02, -17.82], [31.05, -17.82], [31.05, -17.85], [31.02, -17.85], [31.02, -17.82]]] }
              }
            ]
          };
          triggerDownload(`${id}_spatial_boundaries.geojson`, JSON.stringify(geoJsonData, null, 2), 'application/geo+json');
        } else {
          // CSV Export
          const csvContent = [
            'ReportID,Title,Category,CoverageRegion,Metric,Value,Unit,Timestamp',
            `"${id}","${title}","Yield & Agromet","Highveld Region","Mean Biomass",5800,"kg/ha","${new Date().toISOString()}"`,
            `"${id}","${title}","Yield & Agromet","Highveld Region","Rainfall Anomaly",-12.4,"mm","${new Date().toISOString()}"`,
            `"${id}","${title}","Yield & Agromet","Highveld Region","GDD Accumulation",1420,"deg-days","${new Date().toISOString()}"`
          ].join('\n');
          triggerDownload(`${id}_telemetry_log.csv`, csvContent, 'text/csv');
        }
      });
    });

    container.querySelector('#btnExportReport')?.addEventListener('click', () => {
      showModal({
        title: 'Generate Agromet / Yield Report',
        confirmText: 'Generate & Download',
        maxWidth: '520px',
        contentHtml: `
          <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.85rem;">
            <div class="form-group">
              <label class="form-label">Report Type</label>
              <select class="form-input" name="reportType">
                <option value="CSV">Agromet Diurnal Climate Log (CSV)</option>
                <option value="GeoJSON">Geospatial Parcel Boundaries (GeoJSON)</option>
                <option value="PDF">Seasonal Harvest & Yield Forecast (PDF)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Agro-Ecological Region</label>
              <input class="form-input" name="region" value="Natural Region II (Highveld)" required>
            </div>
          </div>
        `,
        onConfirm: (formData) => {
          const repType = formData.reportType || 'CSV';
          const reg = formData.region || 'Highveld';
          if (repType === 'CSV') {
            const csv = `Region,Timestamp,Observation,TempC,RainMm\n"${reg}","${new Date().toISOString()}","Live Synoptic",22.5,4.2`;
            triggerDownload(`custom_report_${Date.now()}.csv`, csv, 'text/csv');
          } else if (repType === 'GeoJSON') {
            const geo = { type: 'FeatureCollection', region: reg, features: [] };
            triggerDownload(`custom_spatial_${Date.now()}.geojson`, JSON.stringify(geo), 'application/geo+json');
          } else {
            window.print();
          }
        }
      });
    });
  },

  // 8. Registered Farmers Directory (Super Admin & Extension Officer)
  async farmers(container) {
    const users = await adminService.listUsers();
    const farmersList = users.filter(u => u.role === 'farmer' || u.role === 'farm_manager');

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Farmer Directory' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Farmer Directory & Producer Profiles</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Registered producers, farm assignments, mobile contact records, and onboarding verification
          </p>
        </div>
        <button class="btn btn-primary" id="btnRegisterNewFarmer">+ Onboard Farmer</button>
      </div>

      ${ui.searchAndFilterBar({
        id: 'farmersSearch',
        placeholder: 'Search farmer by name, phone, or email...',
        filters: [{ label: 'Status', options: ['ACTIVE', 'INACTIVE'] }]
      })}

      <div class="panel">
        <table class="data-table" id="farmersTable">
          <thead>
            <tr>
              <th>Farmer Name</th>
              <th>Contact Phone / Email</th>
              <th>Department / Ward</th>
              <th>Assigned Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${farmersList.map(f => `
              <tr class="farmer-row" data-id="${f.id}" data-name="${f.name.toLowerCase()}" data-status="${f.status}">
                <td>
                  <strong style="color: var(--text-primary); font-size: 0.92rem;">${f.name}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${f.id}</div>
                </td>
                <td>
                  <div>${f.email}</div>
                  <small style="color: var(--text-muted); font-size: 0.75rem;">${f.phone || '+254 700 000 000'}</small>
                </td>
                <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${f.department || 'Nakuru Ward'}</span></td>
                <td><span class="badge badge-green">${f.role.toUpperCase()}</span></td>
                <td>${ui.statusIndicator(f.status)}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${f.lastLogin}</td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn btn-outline btn-farmer-dossier" data-id="${f.id}" style="padding: 4px 8px; font-size: 0.75rem;" title="View Farmer Dossier">
                      🔍 Dossier
                    </button>
                    <button class="btn btn-outline btn-farmer-edit" data-id="${f.id}" style="padding: 4px 8px; font-size: 0.75rem;" title="Edit Farmer Record">
                      ✏️ Edit
                    </button>
                    <button class="btn btn-outline btn-farmer-status" data-id="${f.id}" data-status="${f.status}" style="padding: 4px 8px; font-size: 0.75rem; color: ${f.status === 'ACTIVE' ? 'var(--accent-rose)' : 'var(--primary-dark)'};">
                      ${f.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Filter handlers
    const searchInput = container.querySelector('#farmersSearch input');
    const filterSelect = container.querySelector('#farmersSearch select');
    const resetBtn = container.querySelector('#farmersSearch .btn-reset-filters');

    const applyFilters = () => {
      const q = (searchInput?.value || '').toLowerCase().trim();
      const status = filterSelect?.value || '';

      container.querySelectorAll('.farmer-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        const rowStatus = row.getAttribute('data-status');
        const matchQ = !q || text.includes(q);
        const matchStatus = !status || rowStatus === status;
        row.style.display = (matchQ && matchStatus) ? '' : 'none';
      });
    };

    searchInput?.addEventListener('input', applyFilters);
    filterSelect?.addEventListener('change', applyFilters);
    resetBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterSelect) filterSelect.value = '';
      applyFilters();
    });

    // Action handlers: Dossier Modal
    container.querySelectorAll('.btn-farmer-dossier').forEach(btn => {
      btn.addEventListener('click', () => {
        const farmerId = btn.getAttribute('data-id');
        const farmer = farmersList.find(f => f.id === farmerId);
        if (!farmer) return;

        showModal({
          title: `Producer Dossier: ${farmer.name}`,
          maxWidth: '680px',
          confirmText: 'Done',
          contentHtml: `
            <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; gap: 16px; align-items: center; background: var(--bg-primary); padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800;">
                  🚜
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${farmer.name}</h3>
                  <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">
                    Official Contact: <strong>${farmer.email}</strong> · ${farmer.phone || '+254 712 345 678'}
                  </div>
                  <div style="margin-top: 6px;">
                    <span class="badge badge-green">${farmer.role.toUpperCase()}</span>
                    <span class="badge badge-blue">${farmer.department || 'Nakuru Ward'}</span>
                  </div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 12px 14px;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 6px;">📍 Agricultural Holdings</strong>
                  <div>Primary Farm: <strong>Green Valley Model Farm</strong></div>
                  <div>Parcels: <strong>2 Fields (10.0 Hectares total)</strong></div>
                  <div>Primary Cultivars: <strong>Highland Hybrid Maize, Dry Beans</strong></div>
                  <div>Soil Profile: <strong>Volcanic Loam (pH 6.4)</strong></div>
                </div>

                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 12px 14px;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 6px;">📋 Extension & Advisories</strong>
                  <div>Assigned Officer: <strong>Grace Wanjiku (Extension)</strong></div>
                  <div>Last Extension Visit: <strong>2026-09-14 (Field Inspection)</strong></div>
                  <div>Advisory Adoption: <strong>94% High Compliance</strong></div>
                  <div>SMS Weather Alerts: <strong style="color: var(--primary-dark);">Subscribed (Active)</strong></div>
                </div>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: var(--radius-xs); padding: 12px 14px; color: #166534;">
                <strong>Spatial Verification Status:</strong> Cadastral coordinates verified with WGS84 GPS centroid. Eligible for national fertilizer subsidy program.
              </div>
            </div>
          `
        });
      });
    });

    // Action handlers: Edit Modal
    container.querySelectorAll('.btn-farmer-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const farmerId = btn.getAttribute('data-id');
        const farmer = farmersList.find(f => f.id === farmerId);
        if (!farmer) return;

        showModal({
          title: `Edit Farmer: ${farmer.name}`,
          confirmText: 'Update Record',
          contentHtml: `
            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.85rem;">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input class="form-input" name="name" value="${farmer.name}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Contact Email</label>
                <input class="form-input" name="email" value="${farmer.email}" required>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input class="form-input" name="phone" value="${farmer.phone || '+254 700 000 000'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Ward / Sub-county</label>
                  <input class="form-input" name="department" value="${farmer.department || 'Nakuru Ward'}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Assigned Agricultural Role</label>
                <select class="form-input" name="role">
                  <option value="farmer" ${farmer.role === 'farmer' ? 'selected' : ''}>Farmer (Smallholder)</option>
                  <option value="farm_manager" ${farmer.role === 'farm_manager' ? 'selected' : ''}>Farm Manager (Commercial)</option>
                </select>
              </div>
            </div>
          `,
          onConfirm: async (formData) => {
            await adminService.updateUser(farmer.id, formData);
            views.farmers(container);
          }
        });
      });
    });

    // Action handlers: Status toggle
    container.querySelectorAll('.btn-farmer-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const farmerId = btn.getAttribute('data-id');
        const currentStatus = btn.getAttribute('data-status');
        const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        await adminService.toggleUserStatus(farmerId);
        views.farmers(container);
      });
    });

    container.querySelector('#btnRegisterNewFarmer')?.addEventListener('click', () => {
      authViews.showFarmerOnboardingWizard(() => views.farmers(container));
    });
  },

  // 9. Field Support Visits & Extension Logistics
  async fieldVisits(container) {
    const visits = await fieldOperationService.listVisits();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Portal', hash: '#dashboard' }, { label: 'Field Support Visits' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Field Extension Visits & Advisory Logistics</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            On-site farmer visits, technical assistance logs, and advisory follow-up schedules
          </p>
        </div>
        <button class="btn btn-primary" id="btnScheduleVisit">+ Schedule Visit</button>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Farmer</th>
              <th>Farm Name</th>
              <th>Visit Date</th>
              <th>Purpose / Focus</th>
              <th>Assigned Officer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${visits.map(v => `
              <tr>
                <td><strong>${v.farmer}</strong></td>
                <td>${v.farm}</td>
                <td>${v.date}</td>
                <td>${v.purpose}</td>
                <td>${v.officer || 'Extension Staff'}</td>
                <td>${ui.statusIndicator(v.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btnScheduleVisit')?.addEventListener('click', () => {
      showModal({
        title: 'Schedule Field Visit',
        confirmText: 'Dispatch Visit',
        contentHtml: `
          <div class="form-group">
            <label class="form-label">Farmer & Farm</label>
            <input class="form-input" value="John Kamau (Green Valley Model Farm)">
          </div>
          <div class="form-group">
            <label class="form-label">Scheduled Date</label>
            <input class="form-input" type="date" value="2026-09-18">
          </div>
          <div class="form-group">
            <label class="form-label">Primary Purpose</label>
            <input class="form-input" value="Top-dressing calibration & Fall Armyworm scouting">
          </div>
        `,
        onConfirm: () => {
          alert('Field visit scheduled and notification dispatched.');
          views.fieldVisits(container);
        }
      });
    });
  },

  // 10. Field Scouting Observations
  async fieldObservations(container) {
    const obs = await fieldOperationService.listObservations();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Scouting Hub', hash: '#dashboard' }, { label: 'Crop Observations' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Field Scouting Observations</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            In-field pest alerts, canopy vigor notes, and moisture deficiency records
          </p>
        </div>
        <button class="btn btn-primary" id="btnLogObservation">+ Log Scouting Note</button>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Target Parcel</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Findings & Notes</th>
              <th>Date</th>
              <th>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            ${obs.map(o => `
              <tr>
                <td><strong>${o.field}</strong></td>
                <td><span class="badge badge-blue">${o.category}</span></td>
                <td>${ui.statusIndicator(o.severity)}</td>
                <td>${o.text}</td>
                <td>${o.date}</td>
                <td>${o.followUpRequired ? '<span class="badge badge-rose">YES</span>' : '<span class="badge badge-green">NO</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btnLogObservation')?.addEventListener('click', () => {
      showModal({
        title: 'Log Field Scouting Observation',
        confirmText: 'Submit Observation',
        contentHtml: `
          <div class="form-group">
            <label class="form-label">Field / Parcel</label>
            <input class="form-input" value="North Field A">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-input">
              <option>Crop Vigor & Stand</option>
              <option>Pest & Disease Pressure</option>
              <option>Moisture Stress</option>
              <option>Nutrient Deficiency</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Observation Notes</label>
            <textarea class="form-input" rows="3">Even stand emergence, no signs of foliar blight.</textarea>
          </div>
        `,
        onConfirm: () => {
          alert('Scouting observation logged.');
          views.fieldObservations(container);
        }
      });
    });
  },

  // 11. Regulatory & Field Inspections
  async inspections(container) {
    const inspections = await fieldOperationService.listInspections();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Regulatory', hash: '#dashboard' }, { label: 'Field Inspections' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Good Agricultural Practice (GAP) Inspections</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Compliance audits, certified seed verification, and chemical storage checks
        </p>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Farm Name</th>
              <th>Inspector</th>
              <th>Date</th>
              <th>Compliance Status</th>
              <th>Score</th>
              <th>Auditor Findings</th>
            </tr>
          </thead>
          <tbody>
            ${inspections.map(i => `
              <tr>
                <td><strong>${i.farmName}</strong></td>
                <td>${i.inspector}</td>
                <td>${i.inspectionDate}</td>
                <td>${ui.statusIndicator(i.status)}</td>
                <td><strong style="color: var(--primary-dark); font-size: 1rem;">${i.score}/100</strong></td>
                <td>${i.findings}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 12. Sensor Data Quality & Station Latency (Weather Analyst)
  async dataQuality(container) {
    const metrics = await weatherService.getDataQualityMetrics();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Portal', hash: '#dashboard' }, { label: 'Sensor Data Quality' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Agromet Telemetry Ingestion & Station Quality</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Packet loss diagnostics, sensor calibration health, and API pipeline throughput
        </p>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Station Identifier</th>
              <th>Completeness</th>
              <th>Network Latency</th>
              <th>Status</th>
              <th>Last Ingested</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.map(m => `
              <tr>
                <td><strong>${m.station}</strong></td>
                <td><strong style="color: var(--primary-dark);">${m.completeness}</strong></td>
                <td>${m.latency}</td>
                <td>${ui.statusIndicator(m.status)}</td>
                <td>${m.lastPacket || 'Just now'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 13. System Users & Enterprise Access Matrix
  async users(container) {
    const users = await adminService.listUsers();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Administration', hash: '#dashboard' }, { label: 'User Directory' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">System Users & Role-Based Access Control (RBAC)</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Active platform accounts across 8 operational agronomic and administrative roles
          </p>
        </div>
        <button class="btn btn-primary" onclick="alert('User invitation modal initialized.')">+ Invite User</button>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>Last Session</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge badge-blue">${u.role.toUpperCase()}</span></td>
                <td>${ui.statusIndicator(u.status)}</td>
                <td>${u.lastLogin}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 14. Roles Matrix (System Admin)
  async roles(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Administration', hash: '#dashboard' }, { label: 'RBAC Roles Matrix' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">RBAC Role Permissions Matrix</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Fine-grained permission boundaries designed to interface directly with ASP.NET Core policies or Django permissions
        </p>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Role Identifier</th>
              <th>Display Name</th>
              <th>Geospatial Scope</th>
              <th>Suitability Write</th>
              <th>Farmer Access</th>
              <th>System Ops</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>super_admin</code></td>
              <td><strong>Super Administrator</strong></td>
              <td><span class="badge badge-green">NATIONAL</span></td>
              <td>Full</td>
              <td>Full</td>
              <td>Full</td>
            </tr>
            <tr>
              <td><code>system_admin</code></td>
              <td><strong>System Administrator</strong></td>
              <td><span class="badge badge-green">PLATFORM</span></td>
              <td>Read</td>
              <td>Full</td>
              <td>Full</td>
            </tr>
            <tr>
              <td><code>agronomist</code></td>
              <td><strong>Agronomist</strong></td>
              <td><span class="badge badge-blue">REGIONAL</span></td>
              <td>Full</td>
              <td>Read</td>
              <td>None</td>
            </tr>
            <tr>
              <td><code>extension_officer</code></td>
              <td><strong>Extension Officer</strong></td>
              <td><span class="badge badge-blue">WARD / SUBCOUNTY</span></td>
              <td>Advisory</td>
              <td>Assigned</td>
              <td>None</td>
            </tr>
            <tr>
              <td><code>weather_analyst</code></td>
              <td><strong>Weather Analyst</strong></td>
              <td><span class="badge badge-purple">AGROMET STATIONS</span></td>
              <td>Telemetry</td>
              <td>None</td>
              <td>Telemetry Ingestion</td>
            </tr>
            <tr>
              <td><code>farm_manager</code></td>
              <td><strong>Farm Manager</strong></td>
              <td><span class="badge badge-amber">ESTATE PARCELS</span></td>
              <td>Field Cycles</td>
              <td>Workers</td>
              <td>None</td>
            </tr>
            <tr>
              <td><code>farmer</code></td>
              <td><strong>Farmer</strong></td>
              <td><span class="badge badge-green">OWNED PARCELS</span></td>
              <td>Read Recommendations</td>
              <td>Self Only</td>
              <td>None</td>
            </tr>
            <tr>
              <td><code>field_officer</code></td>
              <td><strong>Field Officer</strong></td>
              <td><span class="badge badge-blue">ASSIGNED SITES</span></td>
              <td>Scouting Observations</td>
              <td>Scouted Only</td>
              <td>None</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  // 15. Audit Logs
  async auditLogs(container) {
    const logs = await adminService.listAuditLogs();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Administration', hash: '#dashboard' }, { label: 'Security Audit Logs' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Security & Governance Audit Trail</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Immutable action records logged across all role sessions and API interactions
        </p>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action Code</th>
              <th>Resource ID</th>
              <th>Origin IP</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="font-family: monospace; font-size: 0.8rem;">${l.time}</td>
                <td><strong>${l.user}</strong></td>
                <td><span class="badge badge-blue">${l.action}</span></td>
                <td><code>${l.resource}</code></td>
                <td>${l.ip || '127.0.0.1'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 16. System Health Monitoring
  async systemMonitoring(container) {
    const health = await adminService.getSystemHealth();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Operations', hash: '#dashboard' }, { label: 'System Health' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Infrastructure & Runtime Health</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Real-time service telemetry for ASP.NET Core Minimal APIs, MySQL 8 Spatial, and Agromet workers
        </p>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Subsystem</th>
              <th>Service Status</th>
              <th>Response Latency</th>
              <th>30-Day Uptime</th>
            </tr>
          </thead>
          <tbody>
            ${health.map(h => `
              <tr>
                <td><strong>${h.service}</strong></td>
                <td>${ui.statusIndicator(h.status)}</td>
                <td>${h.latency}</td>
                <td><strong style="color: var(--primary-dark);">${h.uptime}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 17. Follow-up Tasks (Field Officer)
  async tasks(container) {
    const tasks = await fieldOperationService.listTasks();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Operations', hash: '#dashboard' }, { label: 'Follow-up Tasks' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Follow-up Action Tasks</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Assigned field verification items, sensor checks, and farmer advisory deliverables
        </p>
      </div>

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task Description</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td><strong>${t.title}</strong></td>
                <td><span class="badge ${t.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${t.priority}</span></td>
                <td>${t.assignedTo}</td>
                <td>${t.due}</td>
                <td>${ui.statusIndicator(t.status)}</td>
                <td><button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="alert('Task marked as reviewed.')">Update</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 18. Settings & Architecture Overview
  async settings(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform', hash: '#dashboard' }, { label: 'System Configuration' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">System & Platform Configuration</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Runtime engine settings, MySQL connection parameters, and agromet data sync frequencies
        </p>
      </div>

      <div class="panel" style="padding: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 16px;">Active Production Architecture</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; font-size: 0.875rem;">
          <div style="background: var(--bg-primary); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <strong style="color: var(--text-primary);">Frontend Runtime:</strong>
            <p style="color: var(--text-secondary); margin-top: 4px;">Strictly Vanilla HTML5, CSS3, ES6 Modules (WCAG 2.1 AA Compliant)</p>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <strong style="color: var(--text-primary);">Backend Runtime:</strong>
            <p style="color: var(--text-secondary); margin-top: 4px;">C# ASP.NET Core Minimal APIs (.NET 8.0) + Dapper</p>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <strong style="color: var(--text-primary);">Database Engine:</strong>
            <p style="color: var(--text-secondary); margin-top: 4px;">MySQL 8.4 Spatial (POINT, POLYGON, SRID 4326)</p>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <strong style="color: var(--text-primary);">Future Django Compatibility:</strong>
            <p style="color: var(--text-secondary); margin-top: 4px;">Clean service abstraction allows seamless drop-in API replacement</p>
          </div>
        </div>
      </div>
    `;
  },

  // 19. Global Notification Center
  async notifications(container) {
    let currentCategory = 'ALL';
    let currentSeverity = 'ALL';
    let currentStatus = 'ALL'; // 'ALL', 'UNREAD', 'READ'
    let searchQuery = '';

    const categories = ['ALL', 'Weather', 'Crop', 'Farm', 'Yield', 'Recommendation', 'Field operation', 'System', 'Administrative'];
    const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

    const renderCenter = async () => {
      const allNotifs = await notificationService.listNotifications();

      // Apply search and filters
      const filtered = allNotifs.filter(n => {
        if (currentCategory !== 'ALL' && n.category !== currentCategory) return false;
        if (currentSeverity !== 'ALL' && n.severity !== currentSeverity) return false;
        if (currentStatus === 'UNREAD' && n.isRead) return false;
        if (currentStatus === 'READ' && !n.isRead) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchDesc = n.description.toLowerCase().includes(q);
          const matchFarm = (n.relatedFarm || '').toLowerCase().includes(q);
          const matchCrop = (n.relatedCrop || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchFarm && !matchCrop) return false;
        }
        return true;
      });

      const unreadTotal = allNotifs.filter(n => !n.isRead).length;

      container.innerHTML = `
        ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Notification Center' }])}

        <!-- Header Panel -->
        <div class="panel" style="padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="status-dot"></span>
                <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary-dark); text-transform: uppercase; letter-spacing: 0.5px;">
                  Global Telemetry & Agricultural Alert Center
                </span>
              </div>
              <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
                Notifications & Agricultural Alerts
              </h1>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
                Central clearinghouse for agromet warnings, crop suitability shifts, field scouting flags, and system telemetry.
              </p>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline" id="btnMarkAllNotifsRead" style="font-size: 0.85rem;">
                ✓ Mark All as Read
              </button>
              <button class="btn btn-primary" id="btnNotifPreferences" style="font-size: 0.85rem;">
                ⚙️ Notification Preferences
              </button>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls Panel -->
        <div class="panel" style="padding: 16px 20px; margin-bottom: 20px; background: #ffffff;">
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Top Controls Row: Search + Status Toggle -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <!-- Search Bar -->
              <div style="flex: 1; min-width: 260px; position: relative;">
                <input
                  type="search"
                  id="notifSearchInput"
                  class="form-input"
                  placeholder="🔍 Search title, description, farm holding, or crop..."
                  value="${searchQuery}"
                  style="width: 100%; padding: 8px 12px; font-size: 0.85rem;"
                >
              </div>

              <!-- Read/Unread Filter Pills -->
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn ${currentStatus === 'ALL' ? 'btn-primary' : 'btn-outline'} btn-status-filter" data-status="ALL" style="padding: 6px 12px; font-size: 0.775rem;">
                  All (${allNotifs.length})
                </button>
                <button class="btn ${currentStatus === 'UNREAD' ? 'btn-primary' : 'btn-outline'} btn-status-filter" data-status="UNREAD" style="padding: 6px 12px; font-size: 0.775rem;">
                  Unread (${unreadTotal})
                </button>
                <button class="btn ${currentStatus === 'READ' ? 'btn-primary' : 'btn-outline'} btn-status-filter" data-status="READ" style="padding: 6px 12px; font-size: 0.775rem;">
                  Read (${allNotifs.length - unreadTotal})
                </button>
              </div>

              <!-- Severity Filter Dropdown -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Severity:</label>
                <select id="notifSeveritySelect" class="form-input" style="padding: 6px 10px; font-size: 0.8rem; width: auto;">
                  ${severities.map(s => `
                    <option value="${s}" ${currentSeverity === s ? 'selected' : ''}>${s}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Category Filter Tabs -->
            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; border-top: 1px solid var(--border-color); padding-top: 12px;">
              ${categories.map(c => {
                const count = c === 'ALL' ? allNotifs.length : allNotifs.filter(n => n.category === c).length;
                const isSelected = currentCategory === c;
                return `
                  <button class="btn-category-tab" data-cat="${c}" style="
                    padding: 5px 12px;
                    border-radius: var(--radius-full);
                    border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                    background: ${isSelected ? 'var(--primary-light)' : '#ffffff'};
                    color: ${isSelected ? 'var(--primary-dark)' : 'var(--text-secondary)'};
                    font-size: 0.775rem;
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.15s;
                  ">
                    <span>${c === 'ALL' ? '🌐' : (notificationComponents.categoryIcons[c] || '🔔')}</span>
                    <span>${c}</span>
                    <span style="font-size: 0.7rem; opacity: 0.8;">(${count})</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Notification Feed List -->
        <div class="panel" style="background: transparent; border: none; box-shadow: none;">
          ${filtered.length === 0 ? `
            <div class="panel" style="padding: 48px 24px; text-align: center; background: #ffffff;">
              <div style="font-size: 2.5rem; margin-bottom: 12px;">📭</div>
              <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                No Notifications Found
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                No messages match the current combination of filters and search keywords.
              </p>
              <button class="btn btn-outline" id="btnResetFilters" style="margin-top: 16px; font-size: 0.8rem;">
                Reset All Filters
              </button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${filtered.map(n => {
                const sev = notificationComponents.severityStyles[n.severity] || notificationComponents.severityStyles.INFO;
                const isAgri = n.isAgriculturalAlert;
                return `
                  <div class="notif-feed-card" data-id="${n.id}" style="
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-color);
                    border-left: 5px solid ${sev.border};
                    background: ${!n.isRead ? (isAgri ? sev.bg : '#f0fdf4') : '#ffffff'};
                    padding: 18px 20px;
                    box-shadow: ${!n.isRead ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'};
                    transition: all 0.15s;
                    position: relative;
                  ">
                    <!-- Top Metadata Row -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 1.2rem;">${notificationComponents.categoryIcons[n.category] || '🔔'}</span>
                        
                        <!-- Severity Badge -->
                        <span style="font-weight: 800; font-size: 0.7rem; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: ${sev.badgeBg}; color: ${sev.badgeColor};">
                          ${n.severity}
                        </span>

                        <!-- Category Pill -->
                        <span style="font-weight: 700; font-size: 0.7rem; color: var(--text-secondary); background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">
                          ${n.category}
                        </span>

                        <!-- Agricultural Alert Highlight Pill -->
                        ${isAgri ? `
                          <span style="font-weight: 800; font-size: 0.7rem; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 4px;">
                            🌾 AGRICULTURAL ALERT
                          </span>
                        ` : ''}

                        ${!n.isRead ? `
                          <span style="font-weight: 800; font-size: 0.65rem; background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 9999px;">
                            NEW
                          </span>
                        ` : ''}
                      </div>

                      <div style="display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">
                        <span>📅 ${n.date}</span>
                        ${n.expiration ? `<span>⏳ Expires: ${n.expiration.split(' ')[0]}</span>` : ''}
                      </div>
                    </div>

                    <!-- Title & Description -->
                    <h3 style="font-size: 1.05rem; font-weight: 900; color: var(--text-primary); margin: 0 0 6px 0; line-height: 1.35;">
                      ${n.title}
                    </h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px 0;">
                      ${n.description}
                    </p>

                    <!-- Related Entities & Action Buttons Bottom Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                      <div style="display: flex; gap: 16px; font-size: 0.775rem; color: var(--text-muted); flex-wrap: wrap;">
                        ${n.relatedFarm ? `
                          <span><strong>Farm:</strong> ${n.relatedFarm}</span>
                        ` : ''}
                        ${n.relatedCrop ? `
                          <span><strong>Crop:</strong> <span style="color: var(--primary-dark); font-weight: 700;">${n.relatedCrop}</span></span>
                        ` : ''}
                      </div>

                      <div style="display: flex; gap: 8px; align-items: center;">
                        ${!n.isRead ? `
                          <button class="btn btn-outline btn-mark-read" data-id="${n.id}" style="padding: 5px 12px; font-size: 0.75rem;">
                            ✓ Mark Read
                          </button>
                        ` : ''}
                        <button class="btn btn-outline btn-inspect-notif" data-id="${n.id}" style="padding: 5px 12px; font-size: 0.75rem;">
                          Inspect Details
                        </button>
                        ${n.action ? `
                          <button class="btn btn-primary btn-action-notif" data-hash="${n.action.hash}" data-id="${n.id}" style="padding: 5px 12px; font-size: 0.75rem;">
                            ${n.action.label} →
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      // Attach Interactive Event Listeners
      const searchInput = container.querySelector('#notifSearchInput');
      searchInput?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCenter();
      });

      container.querySelectorAll('.btn-status-filter').forEach(btn => {
        btn.addEventListener('click', () => {
          currentStatus = btn.getAttribute('data-status');
          renderCenter();
        });
      });

      const severitySelect = container.querySelector('#notifSeveritySelect');
      severitySelect?.addEventListener('change', (e) => {
        currentSeverity = e.target.value;
        renderCenter();
      });

      container.querySelectorAll('.btn-category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          currentCategory = tab.getAttribute('data-cat');
          renderCenter();
        });
      });

      container.querySelector('#btnResetFilters')?.addEventListener('click', () => {
        currentCategory = 'ALL';
        currentSeverity = 'ALL';
        currentStatus = 'ALL';
        searchQuery = '';
        renderCenter();
      });

      container.querySelector('#btnMarkAllNotifsRead')?.addEventListener('click', async () => {
        await notificationService.markAllAsRead();
        notificationComponents.updateTopBadge();
        renderCenter();
      });

      container.querySelectorAll('.btn-mark-read').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await notificationService.markAsRead(id);
          notificationComponents.updateTopBadge();
          renderCenter();
        });
      });

      container.querySelectorAll('.btn-inspect-notif').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          notificationComponents.openNotificationDetailModal(id);
        });
      });

      container.querySelectorAll('.btn-action-notif').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const hash = btn.getAttribute('data-hash');
          await notificationService.markAsRead(id);
          notificationComponents.updateTopBadge();
          if (hash) location.hash = hash;
        });
      });

      // Notification Preferences Modal
      container.querySelector('#btnNotifPreferences')?.addEventListener('click', async () => {
        const prefs = await notificationService.getPreferences();
        showModal({
          title: '⚙️ Notification & Alert Preferences',
          contentHtml: `
            <div style="display: flex; flex-direction: column; gap: 16px; font-size: 0.85rem;">
              <p style="color: var(--text-muted); margin: 0;">
                Configure delivery channels, subscribed agricultural categories, and minimum alert thresholds.
              </p>

              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; background: #f8fafc;">
                <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--text-primary); margin-bottom: 8px;">
                  Delivery Channels
                </strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="chan_inApp" ${prefs.channels.inApp ? 'checked' : ''}>
                    <span>In-App Center</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="chan_sms" ${prefs.channels.sms ? 'checked' : ''}>
                    <span>SMS Urgent Broadcasts</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="chan_email" ${prefs.channels.email ? 'checked' : ''}>
                    <span>Email Digests</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="chan_pushSound" ${prefs.channels.pushSound ? 'checked' : ''}>
                    <span>Sound Alerts (Critical)</span>
                  </label>
                </div>
              </div>

              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; background: #f8fafc;">
                <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--text-primary); margin-bottom: 8px;">
                  Subscribed Agricultural Categories
                </strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  ${Object.keys(prefs.categories).map(cat => `
                    <label style="display: flex; align-items: center; gap: 8px;">
                      <input type="checkbox" name="cat_${cat}" ${prefs.categories[cat] ? 'checked' : ''}>
                      <span>${cat}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; background: #f8fafc;">
                <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--text-primary); margin-bottom: 8px;">
                  Minimum Notification Severity
                </strong>
                <select name="minSeverity" class="form-input" style="width: 100%;">
                  <option value="INFO" ${prefs.minSeverity === 'INFO' ? 'selected' : ''}>INFO (All events)</option>
                  <option value="LOW" ${prefs.minSeverity === 'LOW' ? 'selected' : ''}>LOW (Minor changes & above)</option>
                  <option value="MEDIUM" ${prefs.minSeverity === 'MEDIUM' ? 'selected' : ''}>MEDIUM (Important advisories & above)</option>
                  <option value="HIGH" ${prefs.minSeverity === 'HIGH' ? 'selected' : ''}>HIGH (Significant risks & above)</option>
                  <option value="CRITICAL" ${prefs.minSeverity === 'CRITICAL' ? 'selected' : ''}>CRITICAL (Emergency warnings only)</option>
                </select>
              </div>
            </div>
          `,
          confirmText: 'Save Notification Preferences',
          onConfirm: async (formData) => {
            const updatedPrefs = {
              channels: {
                inApp: formData.chan_inApp !== undefined,
                sms: formData.chan_sms !== undefined,
                email: formData.chan_email !== undefined,
                pushSound: formData.chan_pushSound !== undefined
              },
              categories: {
                Weather: formData['cat_Weather'] !== undefined,
                Crop: formData['cat_Crop'] !== undefined,
                Farm: formData['cat_Farm'] !== undefined,
                Yield: formData['cat_Yield'] !== undefined,
                Recommendation: formData['cat_Recommendation'] !== undefined,
                'Field operation': formData['cat_Field operation'] !== undefined,
                System: formData['cat_System'] !== undefined,
                Administrative: formData['cat_Administrative'] !== undefined
              },
              minSeverity: formData.minSeverity || 'LOW'
            };
            await notificationService.savePreferences(updatedPrefs);
            renderCenter();
          }
        });
      });
    };

    renderCenter();
  },

  // 20. Help & Documentation Center
  async help(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Help & User Guide' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">AYIS Help & Operational Documentation</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Comprehensive guides for farmers, extension officers, agronomists, and administrators
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div class="panel" style="padding: 20px;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🚜</div>
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 6px;">Farmer Decision Guide</h3>
          <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4;">
            How to read "What should I do today?" recommendations, log crop cycles, and interpret 5-day agro-weather forecasts.
          </p>
          <button class="btn btn-outline" style="margin-top: 12px; font-size: 0.775rem;" onclick="location.hash='#recommendations'">Open Advisories</button>
        </div>

        <div class="panel" style="padding: 20px;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">📋</div>
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 6px;">Field Scouting Manual</h3>
          <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4;">
            Protocol for executing the 9-step field inspection workflow, assessing vigor, tensiometer readings, and pathogen flags.
          </p>
          <button class="btn btn-outline" style="margin-top: 12px; font-size: 0.775rem;" onclick="location.hash='#inspections'">View Inspections</button>
        </div>

        <div class="panel" style="padding: 20px;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🌾</div>
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 6px;">FAO Agro-Ecological Engine</h3>
          <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4;">
            Understanding Class S1, S2, S3 suitability classifications, Growing Degree Days (GDD), and soil pH boundaries.
          </p>
          <button class="btn btn-outline" style="margin-top: 12px; font-size: 0.775rem;" onclick="location.hash='#suitability'">View Suitability</button>
        </div>

        <div class="panel" style="padding: 20px;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🔐</div>
          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 6px;">Role Security & Governance</h3>
          <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4;">
            RBAC permission matrix, user account states (active, disabled, locked), password reset, and cryptographic audit logs.
          </p>
          <button class="btn btn-outline" style="margin-top: 12px; font-size: 0.775rem;" onclick="location.hash='#roles'">Inspect Matrix</button>
        </div>
      </div>
    `;
  },

  // 21. About AYIS
  async about(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'About Platform' }])}

      <div class="panel" style="padding: 32px; max-width: 800px; margin: 0 auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🌱</div>
        <h1 style="font-size: 1.8rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
          Agricultural Yield Intelligence System (AYIS)
        </h1>
        <p style="font-size: 1rem; color: var(--primary-dark); font-weight: 700; margin-top: 6px;">
          Production Release 2026.1 · National Agricultural Decision Engine
        </p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 16px auto; max-width: 600px; line-height: 1.6;">
          Developed in partnership with KALRO and agricultural research partners to bridge hyper-local meteorological telemetry, crop phenology models, and smallholder farmer action directives.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 24px; text-align: left; background: var(--bg-primary); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Frontend Framework</div>
            <strong style="font-size: 0.85rem;">Pure Vanilla ES6 / HTML5 / CSS3</strong>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Backend Engine</div>
            <strong style="font-size: 0.85rem;">ASP.NET Core .NET 8 / Dapper</strong>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Spatial Database</div>
            <strong style="font-size: 0.85rem;">MySQL 8.4 Spatial SRID 4326</strong>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Accessibility Standard</div>
            <strong style="font-size: 0.85rem; color: var(--primary-dark);">WCAG 2.1 AA Compliant</strong>
          </div>
        </div>
      </div>
    `;
  },

  // 22. Global Search Results View
  async search(container) {
    const hash = window.location.hash || '';
    const query = decodeURIComponent((hash.split('q=')[1] || '').trim().toLowerCase());
    const farms = await farmService.listFarms();
    const crops = await cropService.listCrops();
    const alerts = await weatherService.getAlerts();

    const matchedFarms = farms.filter(f => f.name.toLowerCase().includes(query) || f.primaryCrop.toLowerCase().includes(query) || f.region.toLowerCase().includes(query));
    const matchedCrops = crops.filter(c => c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query));
    const matchedAlerts = alerts.filter(a => a.headline.toLowerCase().includes(query) || a.region.toLowerCase().includes(query));

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Search Results' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">
          Search Results for "${query || 'All Records'}"
        </h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Found ${matchedFarms.length + matchedCrops.length + matchedAlerts.length} matching entities across farms, crop profiles, and weather advisories
        </p>
      </div>

      ${matchedFarms.length > 0 ? `
        <div class="panel" style="margin-bottom: 20px;">
          <div class="card-header"><span class="card-title">Farms & Holdings (${matchedFarms.length})</span></div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 8px;">
            ${matchedFarms.map(f => `
              <div style="padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>${f.name}</strong> · <span style="color: var(--primary-dark); font-weight: 600;">${f.region}</span>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${f.sizeHa} ha · Primary Crop: ${f.primaryCrop}</div>
                </div>
                <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#farms'">View Farm</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${matchedCrops.length > 0 ? `
        <div class="panel" style="margin-bottom: 20px;">
          <div class="card-header"><span class="card-title">Crop Cultivars & Profiles (${matchedCrops.length})</span></div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 8px;">
            ${matchedCrops.map(c => `
              <div style="padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>${c.name}</strong> · <span class="badge badge-blue">${c.category}</span>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">GDD: ${c.growingDays} · Temp: ${c.temp}</div>
                </div>
                <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#crops'">View Profile</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${matchedFarms.length === 0 && matchedCrops.length === 0 && matchedAlerts.length === 0 ? ui.emptyState({
        icon: '🔍',
        title: 'No Matching Records Found',
        message: `No parcels, crops, or advisories matched "${query}". Please verify spelling or try another keyword.`,
        actionText: 'Return to Dashboard',
        onAction: "location.hash='#dashboard'"
      }) : ''}
    `;
  },

  // 23. Standard Utility Error States (404, 403, 500, Offline, Maintenance)
  renderHttpState(container, code, message) {
    container.innerHTML = ui.errorHttpState(code, message);
  },

  // 24. Dedicated Geographic & Mapping Engine Views
  async farmMap(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Farms', hash: '#farms' }, { label: 'Geographic Farm Map' }])}
      <div id="farmMapRootContainer" style="height: calc(100vh - 160px); min-height: 520px;"></div>
    `;
    geoComponents.createFarmMap({
      containerId: 'farmMapRootContainer',
      farms: ZIM_FARMS
    });
  },

  async regionalMap(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Regional Risk & Agro-Ecological Map' }])}
      <div id="regionalMapRootContainer"></div>
    `;
    geoComponents.createRegionalMap({
      containerId: 'regionalMapRootContainer',
      farms: ZIM_FARMS
    });
  },

  async farmRegistrationMap(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Farms', hash: '#farms' }, { label: 'Farm Location Registration' }])}
      <div class="panel" style="padding: 24px; margin-bottom: 20px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Farm Geographic Registration</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Set spatial coordinates (EPSG:4326), verify natural agro-ecological classification, and register cadastral centroid.
        </p>
      </div>
      <div id="registrationMapRootContainer"></div>
    `;
    geoComponents.createFarmRegistrationMap({
      containerId: 'registrationMapRootContainer',
      initialCoord: { lat: -17.5214, lon: 30.9721 }
    });
  },

  // 25. Complete Reporting and Analytics Frontend (All 10 Report Types & 7-Step Builder)
  async reports(container) {
    reportBuilderComponent.render(container);
  }
};

// ─── Module-level helpers for AccuWeather farm weather strips ──────────────────

/**
 * Update the dark weather strip inside a farm card with live AccuWeather data.
 * @param {HTMLElement} container - The page container element
 * @param {Object} farm - Farm object
 * @param {Object} bundle - { current, forecast, alerts } from weatherService.getWeatherForFarm()
 */
function _updateFarmWeatherStrip(container, farm, bundle) {
  const strip = container.querySelector(`#weatherStrip_${farm.id}`);
  if (!strip) return;

  const cc = bundle?.current;
  if (!cc || cc.temperature == null) {
    _setFarmWeatherStripError(container, farm, 'No data — check GPS coordinates');
    return;
  }

  const temp = Math.round(cc.temperature.value);
  const tempColor = temp >= 30 ? '#f43f5e' : temp >= 22 ? '#f59e0b' : '#10b981';
  const cond = cc.weatherText ?? 'N/A';
  const humid = cc.relativeHumidity ?? '--';
  const wind = cc.wind?.speed != null ? Math.round(cc.wind.speed) : '--';
  const isDayTime = cc.isDayTime !== false;
  const alertCount = bundle?.alerts?.length ?? 0;

  strip.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;">
      <span style="font-size:1.8rem;font-weight:900;color:${tempColor};">${temp}°C</span>
      <div>
        <div style="font-size:0.72rem;color:#e2e8f0;font-weight:600;">${isDayTime ? '☀️' : '🌙'} ${cond}</div>
        <div style="font-size:0.65rem;color:#64748b;margin-top:2px;">💧 ${humid}% · 💨 ${wind} km/h</div>
      </div>
    </div>
    <div style="text-align:right;">
      ${alertCount > 0 ? `<div style="background:#f59e0b;color:#fff;border-radius:4px;padding:2px 6px;font-size:0.62rem;font-weight:700;margin-bottom:2px;">⚠️ ${alertCount} alert${alertCount > 1 ? 's' : ''}</div>` : ''}
      <div style="font-size:0.6rem;color:#334155;">AccuWeather</div>
      <div style="font-size:0.58rem;color:#1e3a5f;">${new Date().toLocaleTimeString()}</div>
    </div>
  `;
}

/**
 * Show an error state in the farm weather strip.
 */
function _setFarmWeatherStripError(container, farm, message) {
  const strip = container.querySelector(`#weatherStrip_${farm.id}`);
  if (!strip) return;
  strip.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;width:100%;">
      <span style="font-size:1rem;">⚠️</span>
      <div>
        <div style="font-size:0.72rem;color:#94a3b8;">${message}</div>
        <div style="font-size:0.62rem;color:#475569;">AccuWeather · ${farm.latitude != null ? 'GPS OK' : 'No GPS coordinates'}</div>
      </div>
    </div>
  `;
}

/**
 * Map AccuWeather icon number to an emoji for forecast display.
 * @param {number} icon
 * @returns {string}
 */
function _getForecastEmoji(icon) {
  const map = {
    1:'☀️',2:'🌤️',3:'⛅',4:'🌥️',5:'🌫️',6:'🌥️',7:'☁️',8:'☁️',
    11:'🌫️',12:'🌧️',13:'🌦️',14:'🌦️',15:'⛈️',16:'⛈️',17:'🌩️',18:'🌧️',
    19:'🌨️',22:'❄️',29:'🌧️',30:'🌡️',31:'🥶',32:'💨',
    33:'🌙',34:'🌙',35:'⛅',36:'🌥️',37:'🌫️',38:'🌥️',
    39:'🌧️',40:'🌧️',41:'⛈️',42:'⛈️',43:'🌨️',44:'❄️'
  };
  return map[icon] ?? '🌤️';
}
