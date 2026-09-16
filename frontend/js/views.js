import { farmService, cropService, weatherService, recommendationService, yieldService, fieldOperationService, adminService, reportService, notificationService, authService } from './services/index.js';
import { renderGisMap, renderWeatherChart } from './components/gisMap.js';
import { showModal } from './components/modal.js';
import { authViews } from './auth/authViews.js';
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
              <canvas id="dashboardGisMap"></canvas>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="card-header">
            <div>
              <span class="card-title">Diurnal Temperature Trend</span>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Nakuru Agromet [NKU-01]</p>
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

    setTimeout(() => {
      renderGisMap('dashboardGisMap', farms);
      renderWeatherChart('dashboardWeatherChart', weather);
    }, 50);
  },

  // 2. Farms & Fields Geospatial Registry
  async farms(container) {
    const farms = await farmService.listFarms();
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Platform Hub', hash: '#dashboard' }, { label: 'Farms & Fields Registry' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Farm & Field Geospatial Registry</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Native MySQL 8 spatial POINT (Centroid) and POLYGON (Boundaries) with SRID 4326
          </p>
        </div>
        <button class="btn btn-primary" id="btnRegisterFarmPrompt">+ Register Farm</button>
      </div>

      ${ui.searchAndFilterBar({
        id: 'farmsFilterBar',
        placeholder: 'Search farms by name, region, or primary crop...',
        filters: [
          { label: 'Region', key: 'region', options: ['Nakuru High Plains', 'Uasin Gishu Plateau', 'Rongai Valley'] },
          { label: 'Soil Type', key: 'soil', options: ['Volcanic Loam', 'Clay Loam', 'Sandy Loam'] }
        ]
      })}

      <div id="farmsGridContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        ${farms.map(f => `
          <div class="panel farm-card" data-name="${f.name.toLowerCase()}" data-region="${f.region.toLowerCase()}" style="padding: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${f.name}</h3>
                <span style="font-size: 0.8125rem; color: var(--primary-dark); font-weight: 700;">${f.region}</span>
              </div>
              <span class="badge badge-green">${f.sizeHa} Hectares</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.82rem; color: var(--text-secondary); margin: 18px 0; background: var(--bg-primary); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div><strong style="color: var(--text-muted);">Primary Crop:</strong> ${f.primaryCrop}</div>
              <div><strong style="color: var(--text-muted);">Soil Type:</strong> ${f.soilType}</div>
              <div><strong style="color: var(--text-muted);">Irrigation:</strong> ${f.irrigationType}</div>
              <div><strong style="color: var(--text-muted);">Elevation:</strong> ${f.elevationM}m AMSL</div>
              <div style="grid-column: span 2;"><strong style="color: var(--text-muted);">Centroid:</strong> POINT(${f.longitude} ${f.latitude})</div>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-outline" style="flex: 1; font-size: 0.775rem;" id="btnFarmDetails_${f.id}">Farm Details</button>
              <button class="btn btn-outline" style="flex: 1; font-size: 0.775rem;" id="btnFarmEdit_${f.id}">Edit Farm</button>
              <button class="btn btn-primary" style="flex: 1; font-size: 0.775rem;" id="btnFarmMap_${f.id}">GIS Map</button>
            </div>
          </div>
        `).join('')}
      </div>

      ${ui.pagination({ current: 1, totalPages: 1 })}
    `;

    // Bind interactive modals for farm details, edit, map
    farms.forEach(f => {
      container.querySelector(`#btnFarmDetails_${f.id}`)?.addEventListener('click', () => {
        showModal({
          title: `Farm Details: ${f.name}`,
          contentHtml: `
            <div style="font-size: 0.875rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; background: var(--bg-primary); padding: 12px; border-radius: var(--radius-xs);">
                <div>Region: <strong>${f.region}</strong></div>
                <div>Size: <strong>${f.sizeHa} Hectares</strong></div>
                <div>Primary Crop: <strong>${f.primaryCrop}</strong></div>
                <div>Soil Type: <strong>${f.soilType}</strong></div>
                <div>Irrigation: <strong>${f.irrigationType}</strong></div>
                <div>Elevation: <strong>${f.elevationM}m AMSL</strong></div>
                <div style="grid-column: span 2;">Centroid: <code>POINT(${f.longitude} ${f.latitude})</code></div>
              </div>
              <p style="color: var(--text-secondary); line-height: 1.5;">${f.description || 'Active smallholder model farm verified under KALRO agronomical standards.'}</p>
            </div>
          `,
          confirmText: 'Done'
        });
      });

      container.querySelector(`#btnFarmEdit_${f.id}`)?.addEventListener('click', () => {
        showModal({
          title: `Edit Farm: ${f.name}`,
          contentHtml: `
            <div class="form-group">
              <label class="form-label">Farm Holding Name</label>
              <input class="form-input" id="inpEditFarmName" value="${f.name}">
            </div>
            <div class="form-group">
              <label class="form-label">Primary Crop</label>
              <input class="form-input" id="inpEditFarmCrop" value="${f.primaryCrop}">
            </div>
            <div class="form-group">
              <label class="form-label">Soil Classification</label>
              <input class="form-input" id="inpEditFarmSoil" value="${f.soilType}">
            </div>
            <div class="form-group">
              <label class="form-label">Irrigation System</label>
              <input class="form-input" id="inpEditFarmIrr" value="${f.irrigationType}">
            </div>
          `,
          confirmText: 'Save Changes',
          onConfirm: () => {
            alert(`Farm parcel ${f.name} updated successfully in MySQL spatial store.`);
          }
        });
      });

      container.querySelector(`#btnFarmMap_${f.id}`)?.addEventListener('click', () => {
        // Find matching or fallback Zimbabwean farm data or adapt f
        const matchedZimFarm = ZIM_FARMS.find(zf => zf.id === f.id) || {
          ...f,
          riskStatus: f.riskStatus || 'OPTIMAL',
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

    container.querySelector('#btnRegisterFarmPrompt')?.addEventListener('click', () => {
      authViews.showFarmerOnboardingWizard(() => views.farms(container));
    });

    // Wire up search & filters
    const searchInput = container.querySelector('#farmsFilterBar .search-input');
    const cards = container.querySelectorAll('.farm-card');
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'block' : 'none';
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
              <tr>
                <td><strong style="color: var(--text-primary); font-size: 0.9rem;">${c.name}</strong></td>
                <td><span class="badge badge-blue">${c.category}</span></td>
                <td>${c.temp}</td>
                <td>${c.days} Days</td>
                <td><strong style="color: var(--primary-dark);">${c.typicalYield}</strong></td>
                <td><button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#intelligence'">View Agronomic Spec</button></td>
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
  },

  // 4. Crop Phenological Cycles
  async cycles(container) {
    const cycles = await cropService.listCycles();
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
                <td><strong>${c.crop}</strong></td>
                <td><span class="badge badge-blue">${c.stage}</span></td>
                <td><strong style="color: var(--text-primary);">${c.targetYield}</strong></td>
                <td>${ui.statusIndicator(c.status)}</td>
                <td><button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#intelligence'">Assess Suitability</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btnNewCycleModal')?.addEventListener('click', () => {
      showModal({
        title: 'Plan New Crop Cycle',
        confirmText: 'Register Cycle',
        contentHtml: `
          <div class="form-group">
            <label class="form-label">Select Target Farm</label>
            <select class="form-input">
              <option>Green Valley Model Farm</option>
              <option>Rongai Sunrise Farm</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Crop & Variety</label>
            <input class="form-input" value="Highland Hybrid Maize (H614D)">
          </div>
          <div class="form-group">
            <label class="form-label">Target Yield (MT/ha)</label>
            <input class="form-input" type="number" step="0.1" value="5.8">
          </div>
        `,
        onConfirm: () => {
          alert('Crop cycle planned and initialized in MySQL 8.');
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
          <h3 style="font-size: 1.1rem; font-weight: 800;">Nakuru Agromet [NKU-01] 24h Diurnal Curve</h3>
          <span class="badge badge-green">Live Sensor Telemetry</span>
        </div>
        <div class="chart-canvas-container" style="height: 320px;">
          <canvas id="weatherFullChart"></canvas>
        </div>
      </div>

      <!-- 5-Day Agricultural Forecast Grid -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 16px;">5-Day Agricultural Forecast & Spraying Windows</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
          ${forecasts.map(f => `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; text-align: center;">
              <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-muted);">${f.date}</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary); margin: 6px 0;">${f.tempMax}° / ${f.tempMin}°</div>
              <div style="font-size: 0.8rem; color: var(--accent-blue); font-weight: 700;">💧 ${f.rainMm} mm (${f.rainProbability}%)</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">${f.condition}</div>
            </div>
          `).join('')}
        </div>
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
                <td>${r.format}</td>
                <td>${r.date}</td>
                <td><button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="alert('Downloading ${r.title}...')">Download</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btnExportReport')?.addEventListener('click', () => {
      showModal({
        title: 'Generate Agromet / Yield Report',
        confirmText: 'Generate & Download',
        contentHtml: `
          <div class="form-group">
            <label class="form-label">Report Type</label>
            <select class="form-input">
              <option>Seasonal Harvest & Yield Forecast (PDF)</option>
              <option>Agromet Diurnal Climate Log (CSV)</option>
              <option>Geospatial Parcel Boundaries (GeoJSON)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Region</label>
            <input class="form-input" value="Nakuru High Plains">
          </div>
        `,
        onConfirm: () => {
          alert('Report generated and queued for download.');
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
        filters: [{ label: 'Status', options: ['ACTIVE', 'PENDING_VERIFICATION'] }]
      })}

      <div class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Farmer Name</th>
              <th>Contact Email</th>
              <th>Assigned Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${farmersList.map(f => `
              <tr>
                <td><strong>${f.name}</strong></td>
                <td>${f.email}</td>
                <td><span class="badge badge-green">${f.role.toUpperCase()}</span></td>
                <td>${ui.statusIndicator(f.status)}</td>
                <td>${f.lastLogin}</td>
                <td>
                  <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="location.hash='#farms'">View Farm</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

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

