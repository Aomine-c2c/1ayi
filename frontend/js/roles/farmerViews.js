/**
 * Dedicated Farmer Role Experience Module
 * Provides intuitive, understandable agricultural decision assistance:
 * - Dashboard: Practical overview, greeting, current weather, farm status, active cycles,
 *   crop health/suitability, estimated yield, recommendations, alerts, and "What should I do?"
 *   action directives (Plant, Wait, Irrigate, Monitor, Protect, Harvest, Prepare).
 * - My Farms: Farm list/cards, interactive parcel map, registration launcher, detailed farm view,
 *   fields breakdown, coordinates, weather and active crops.
 * - Crops: Crop cycles list, growth stages, planting/harvest dates, suitability status, yield targets,
 *   and "Log New Planting" workflow.
 * - Weather: Current conditions, 5-day plain-language forecast, historical trend, interactive
 *   rainfall/temp/humidity curves, and weather suitability score with farmer-friendly advice.
 * - Recommendations: Actionable recommendation cards with reasons, confidence, supporting weather
 *   telemetry (recent rain, expected rain, temperature, soil moisture), and timing.
 * - Yield: Production forecasts, crop breakdown, historical benchmark comparisons, and harvest planning.
 * - Alerts: Understandable agricultural risk advisories (Drought, Excess Rain, Extreme Temp,
 *   Unsuitable Conditions, Crop Warnings) across all 5 severity levels with clear plain-language explanations.
 */
import { farmService, cropService, weatherService, recommendationService, yieldService, authService } from '../services/index.js';
import { renderGisMap, renderWeatherChart } from '../components/gisMap.js';
import { showModal } from '../components/modal.js';
import { authViews } from '../auth/authViews.js';
import { ui } from '../components/ui.js';
import { geoComponents } from '../components/geoComponents.js';
import { ZIM_FARMS } from '../geo/zimGeoData.js';

export const farmerViews = {
  // =========================================================================
  // 1. FARMER DASHBOARD (Actionable Agricultural Decision Assistant)
  // =========================================================================
  async dashboard(container) {
    const user = authService.getCurrentUser();
    const farms = await farmService.listFarms();
    const weather = await weatherService.getRecentObservations();
    const latestWeather = weather[weather.length - 1] || { temp: 22.4, humidity: 68, rain: 0.0, wind: 6.2 };
    const cycles = await cropService.listCycles();
    const recs = await recommendationService.listRecommendations();
    const alerts = await weatherService.getAlerts();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'Today\'s Decisions' }])}

      <!-- Welcoming Decision Banner -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%); border: 1px solid #a7f3d0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="badge badge-green" style="font-size: 0.75rem;">FARM DECISION ASSISTANT</span>
              <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">🟢 Good Farming Conditions Today</span>
            </div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
              Habari, ${user.firstName}! Welcome to Your Farm
            </h1>
            <p style="color: var(--text-secondary); margin-top: 4px; font-size: 0.95rem; max-width: 680px;">
              Your parcel at <strong>Green Valley Model Farm</strong> is currently in the <strong>V6 Vegetative Stage</strong>. 
              Soil moisture is optimal and favorable for top-dressing fertilizer.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" id="btnFarmerNewCrop">+ Log New Planting</button>
            <button class="btn btn-primary" onclick="location.hash='#recommendations'">View All Advisories →</button>
          </div>
        </div>
      </div>

      <!-- Live Micro-Climate Bar (Simple farmer-friendly parameters) -->
      <div class="panel" style="padding: 20px 24px; margin-bottom: 24px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
            ⛅ Local Field Weather (Nakuru High Plains Station)
          </div>
          <a href="#weather" style="font-size: 0.8125rem; font-weight: 700; color: var(--primary-dark); text-decoration: none;">View 5-Day Forecast →</a>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 14px;">
          <div style="background: var(--bg-primary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Temperature</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: var(--primary); margin: 4px 0 2px;">${latestWeather.temp}°C</div>
            <div style="font-size: 0.7rem; color: var(--primary-dark); font-weight: 600;">Optimal for Maize</div>
          </div>
          <div style="background: var(--bg-primary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Rain (Past 24h)</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: var(--accent-blue); margin: 4px 0 2px;">${latestWeather.rain} mm</div>
            <div style="font-size: 0.7rem; color: var(--accent-blue); font-weight: 600;">Good soil moisture</div>
          </div>
          <div style="background: var(--bg-primary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Air Humidity</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: var(--text-primary); margin: 4px 0 2px;">${latestWeather.humidity}%</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;">Moderate dew point</div>
          </div>
          <div style="background: var(--bg-primary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Wind Speed</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: var(--text-primary); margin: 4px 0 2px;">${latestWeather.wind} km/h</div>
            <div style="font-size: 0.7rem; color: var(--primary-dark); font-weight: 600;">Safe for Spraying</div>
          </div>
          <div style="background: var(--bg-primary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Sky Condition</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: var(--accent-amber); margin: 4px 0 2px;">⛅</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Scattered Clouds</div>
          </div>
        </div>
      </div>

      <!-- "WHAT SHOULD I DO TODAY?" ACTION CENTER -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; border-left: 6px solid var(--primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary);">
              ⚡ What should I do today? (Action Directives)
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Practical actions translated directly from weather telemetry and crop stage analysis.</p>
          </div>
          <span class="badge badge-green">3 Actions Pending</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <!-- Action 1: FERTILIZE -->
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="badge badge-amber" style="font-weight: 800;">FERTILIZE / TOP-DRESS</span>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-amber);">DUE IN 3 DAYS</span>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 6px 0;">Apply Top-Dressing CAN (V6 Stage)</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                Apply 50 kg/acre CAN fertilizer before Thursday afternoon's forecasted showers for maximum root assimilation in Field A.
              </p>
            </div>
            <button class="btn btn-outline" style="margin-top: 12px; width: 100%; font-size: 0.8rem; justify-content: center;" onclick="alert('Marked as scheduled in farm diary.')">Mark Action Scheduled</button>
          </div>

          <!-- Action 2: MONITOR -->
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="badge badge-blue" style="font-weight: 800;">MONITOR / SCOUT</span>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-blue);">ROUTINE</span>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 6px 0;">Scout Dry Beans for Pod Borer</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                Inspect the flowering edges in Field B (Rosecoco variety). Extension officer Grace Wanjiku is scheduled to review tomorrow morning.
              </p>
            </div>
            <button class="btn btn-outline" style="margin-top: 12px; width: 100%; font-size: 0.8rem; justify-content: center;" onclick="alert('Observation note opened.')">Log Field Finding</button>
          </div>

          <!-- Action 3: PREPARE -->
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="badge badge-purple" style="font-weight: 800;">PREPARE / TOOLS</span>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-purple);">NEXT WEEK</span>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 6px 0;">Clear Terraced Drainage Ditches</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                Heavy rainfall predicted toward the end of the month. Clear debris from lower furrows to prevent root waterlogging.
              </p>
            </div>
            <button class="btn btn-outline" style="margin-top: 12px; width: 100%; font-size: 0.8rem; justify-content: center;" onclick="alert('Added to farm task list.')">Add to Task List</button>
          </div>
        </div>
      </div>

      <!-- Quick KPI Stats -->
      <div class="metrics-grid-8" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div class="metric-box">
          <span class="metric-box-label">Active Crop Cycle</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">Maize (H614D)</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Stage: V6 (Vegetative)</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Cultivated Land</span>
          <span class="metric-box-val">12.5 ha</span>
          <span class="metric-box-sub" style="color: var(--text-muted);">2 active plots</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Expected Harvest</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">5.6 t/ha</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">+24% vs county average</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Weather Suitability</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">91.5%</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">CLASS S1: Highly Suitable</span>
        </div>
      </div>

      <!-- Two-Column Farm Overview & Map -->
      <div class="grid-two-col">
        <!-- Interactive Parcel View -->
        <div class="panel">
          <div class="card-header">
            <div>
              <span class="card-title">My Farm Land & Agromet Link</span>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">WGS84 centroid mapped with automatic station telemetry</p>
            </div>
            <span class="badge badge-green">GPS Connected</span>
          </div>
          <div class="card-body">
            <div class="map-canvas-container" style="height: 260px;">
              <canvas id="farmerDashboardMap"></canvas>
            </div>
          </div>
        </div>

        <!-- Recent Farm Alerts & Recommendations Summary -->
        <div class="panel">
          <div class="card-header">
            <div>
              <span class="card-title">Important Alerts & Recommendations</span>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Key updates for your land parcels</p>
            </div>
            <a href="#alerts" style="font-size: 0.8rem; font-weight: 700; color: var(--primary-dark); text-decoration: none;">All Alerts →</a>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 12px; padding: 18px 24px;">
            ${alerts.slice(0, 2).map(a => `
              <div style="background: ${a.severity === 'HIGH' ? 'var(--accent-rose-light)' : 'var(--accent-amber-light)'}; border-left: 4px solid ${a.severity === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)'}; padding: 12px 14px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.875rem; color: var(--text-primary);">${a.headline}</strong>
                  <span class="badge ${a.severity === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${a.severity}</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">Region: ${a.region} · Valid: ${a.effectiveUntil}</div>
              </div>
            `).join('')}

            ${recs.slice(0, 1).map(r => `
              <div style="background: var(--primary-light); border-left: 4px solid var(--primary); padding: 12px 14px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.875rem; color: var(--text-primary);">${r.title}</strong>
                  <span class="badge badge-green">ADVISORY</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${r.field} · Due: ${r.due}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnFarmerNewCrop')?.addEventListener('click', () => {
      farmerViews.showAddCropCycleModal(() => farmerViews.dashboard(container));
    });

    setTimeout(() => {
      renderGisMap('farmerDashboardMap', farms);
    }, 50);
  },

  // =========================================================================
  // 2. MY FARMS (Parcels, Map, Details, Registration)
  // =========================================================================
  async myFarms(container) {
    const farms = await farmService.listFarms();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'My Farms' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">My Land Parcels & Farm Holdings</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Overview of your registered agricultural parcels, soil types, and GPS coordinates.
          </p>
        </div>
        <button class="btn btn-primary" id="btnRegisterNewFarmPrompt">+ Register New Farm</button>
      </div>

      <!-- Farm Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${farms.map((f, idx) => `
          <div class="panel" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <span class="badge badge-green" style="margin-bottom: 6px;">PARCEL #${idx + 1}</span>
                  <h3 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary);">${f.name}</h3>
                  <div style="font-size: 0.8125rem; color: var(--primary-dark); font-weight: 700;">${f.region}</div>
                </div>
                <span class="badge badge-green" style="font-size: 0.85rem; padding: 6px 12px;">${f.sizeHa} Hectares</span>
              </div>

              <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin: 16px 0; font-size: 0.825rem; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong style="color: var(--text-muted);">Primary Crop:</strong> ${f.primaryCrop}</div>
                <div><strong style="color: var(--text-muted);">Soil Type:</strong> ${f.soilType}</div>
                <div><strong style="color: var(--text-muted);">Irrigation:</strong> ${f.irrigationType}</div>
                <div><strong style="color: var(--text-muted);">Elevation:</strong> ${f.elevationM}m AMSL</div>
                <div style="grid-column: span 2;"><strong style="color: var(--text-muted);">Coordinates:</strong> POINT(${f.longitude} ${f.latitude})</div>
              </div>

              <!-- Historical Production Note -->
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 16px;">
                <strong>Historical Harvest:</strong> 2025 Long Rains yielded 58 Tonnes maize with 89% quality rating.
              </div>
            </div>

            <div style="display: flex; gap: 10px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
              <button class="btn btn-outline" style="flex: 1;" onclick="farmerViews.showFarmDetailsModal('${f.id}')">Farm Details</button>
              <button class="btn btn-primary" style="flex: 1;" onclick="location.hash='#crops'">View Crop Cycles</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Farm GIS Map -->
      <div class="panel">
        <div class="card-header">
          <div>
            <span class="card-title">Geospatial Farm Centroids</span>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Hover on parcel markers for parcel specifications</p>
          </div>
          <span class="badge badge-green">Spatial Index Synced</span>
        </div>
        <div class="card-body">
          <div class="map-canvas-container" style="height: 300px;">
            <canvas id="myFarmsGisCanvas"></canvas>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnRegisterNewFarmPrompt')?.addEventListener('click', () => {
      authViews.showFarmerOnboardingWizard(() => farmerViews.myFarms(container));
    });

    setTimeout(() => {
      renderGisMap('myFarmsGisCanvas', farms);
    }, 50);
  },

  // Farm Details Dialog with Geographic Cadastral Map
  async showFarmDetailsModal(farmId) {
    const farm = await farmService.getFarmById(farmId);
    const fields = await farmService.listFields(farmId);
    const weather = await weatherService.getRecentObservations();
    const curWeather = weather[weather.length - 1] || { temp: 22.4, rain: 0 };

    // Format rich spatial farm object
    const matchedZimFarm = ZIM_FARMS.find(zf => zf.id === farmId) || {
      ...farm,
      riskStatus: farm.riskStatus || 'OPTIMAL',
      suitabilityScore: 91,
      suitabilityClass: 'Highly Suitable (S1)',
      weatherAlert: null,
      weatherContext: {
        temp: curWeather.temp,
        humidity: curWeather.humidity || 65,
        rain24h: curWeather.rain || 0,
        forecastRain48h: 12.4,
        windSpeed: curWeather.wind || 6.2
      },
      fields: fields.map((fld, idx) => ({
        id: fld.id,
        name: fld.name,
        areaHa: fld.areaHa,
        crop: fld.currentCrop || farm.primaryCrop,
        stage: fld.stage || 'Vegetative'
      }))
    };

    geoComponents.showFarmDetailsModal(matchedZimFarm);
  },

  // =========================================================================
  // 3. CROPS & ACTIVE CYCLES (Growth stages, planting & harvest dates)
  // =========================================================================
  async crops(container) {
    const cycles = await cropService.listCycles();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'My Crops' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">My Crops & Active Phenological Cycles</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Track your current crop stages from germination through flowering to expected harvest dates.
          </p>
        </div>
        <button class="btn btn-primary" id="btnAddNewCropCycle">+ Add Crop Cycle</button>
      </div>

      <!-- Active Crop Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${cycles.map(c => `
          <div class="panel" style="padding: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span class="badge badge-blue">${c.farm}</span>
                <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-top: 6px;">${c.crop}</h3>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${c.field} · ${c.seasonName || '2026 Long Rains'}</div>
              </div>
              <span class="badge badge-green">${c.status}</span>
            </div>

            <!-- Stage Progress Bar -->
            <div style="margin: 16px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px;">
                <span style="color: var(--primary-dark);">Growth Stage: ${c.stage}</span>
                <span style="color: var(--text-muted);">60% to Harvest</span>
              </div>
              <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: var(--radius-full); overflow: hidden;">
                <div style="height: 100%; width: 60%; background: var(--primary);"></div>
              </div>
            </div>

            <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.8125rem; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
              <div><strong>Planting Date:</strong><br><span style="color: var(--text-secondary);">${c.startDate || '2026-04-10'}</span></div>
              <div><strong>Expected Harvest:</strong><br><span style="color: var(--text-secondary);">${c.expectedHarvestDate || '2026-09-28'}</span></div>
              <div><strong>Target Yield:</strong><br><span style="color: var(--primary-dark); font-weight: 800;">${c.targetYield}</span></div>
              <div><strong>Suitability Score:</strong><br><span style="color: var(--primary-dark); font-weight: 800;">91.5% (Optimal)</span></div>
            </div>

            <button class="btn btn-outline" style="width: 100%; justify-content: center;" onclick="location.hash='#recommendations'">
              View Recommended Field Actions →
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnAddNewCropCycle')?.addEventListener('click', () => {
      farmerViews.showAddCropCycleModal(() => farmerViews.crops(container));
    });
  },

  // Modal to log new crop cycle
  showAddCropCycleModal(onSuccess) {
    showModal({
      title: 'Plan & Register New Crop Cycle',
      confirmText: 'Save Crop Cycle',
      contentHtml: `
        <div class="form-group">
          <label class="form-label">Select Target Farm & Field</label>
          <select class="form-input" id="newCycleField">
            <option>Green Valley Model Farm — North Field A (12.5 ha)</option>
            <option>Green Valley Model Farm — South Field B (8.2 ha)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Crop & Variety</label>
          <select class="form-input" id="newCycleCrop">
            <option>Highland Hybrid Maize (H614D)</option>
            <option>Wheat (Kenya Tayari)</option>
            <option>Dry Beans (Rosecoco GLP-2)</option>
            <option>Irish Potatoes (Shangi)</option>
          </select>
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label class="form-label">Planting / Sowing Date</label>
            <input class="form-input" type="date" id="newCycleStart" value="2026-09-18">
          </div>
          <div>
            <label class="form-label">Expected Harvest Date</label>
            <input class="form-input" type="date" id="newCycleEnd" value="2027-02-15">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Target Yield Expectation (t/ha)</label>
          <input class="form-input" type="number" step="0.1" id="newCycleYield" value="5.8">
        </div>
      `,
      onConfirm: () => {
        alert('🎉 New crop cycle planned and logged to active farm records.');
        if (onSuccess) onSuccess();
      }
    });
  },

  // =========================================================================
  // 4. WEATHER & PLAIN-LANGUAGE FORECAST
  // =========================================================================
  async weather(container) {
    const weather = await weatherService.getRecentObservations();
    const forecasts = await weatherService.getForecasts();
    const latest = weather[weather.length - 1] || { temp: 22.4, humidity: 68, rain: 0.0, wind: 6.2 };

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'Weather & Forecast' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Hyper-Local Agrometeorological Weather</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Plain-language agricultural weather insights to help you decide when to plant, spray, irrigate, or harvest.
        </p>
      </div>

      <!-- Weather Suitability Scorecard -->
      <div class="panel" style="padding: 20px 24px; margin-bottom: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%); border-color: #a7f3d0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <span class="badge badge-green" style="font-size: 0.75rem;">TODAY'S WEATHER SUITABILITY SCORE</span>
            <div style="font-size: 1.8rem; font-weight: 900; color: var(--primary-dark); margin-top: 4px;">
              94 / 100 — Excellent for Top-Dressing
            </div>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px;">
              Moderate air temperatures, low wind speeds, and incoming Thursday showers provide ideal conditions for nitrogen fertilizer absorption.
            </p>
          </div>
          <button class="btn btn-primary" onclick="location.hash='#recommendations'">See Recommended Action →</button>
        </div>
      </div>

      <!-- 5-Day Practical Agricultural Forecast -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">
          5-Day Agricultural Forecast & Spray Windows
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
          ${forecasts.map(f => `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; text-align: center;">
              <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">${f.date}</div>
              <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin: 6px 0;">${f.tempMax}° / ${f.tempMin}°</div>
              <div style="font-size: 0.85rem; font-weight: 800; color: var(--accent-blue);">💧 ${f.rainMm} mm</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">(${f.rainProbability}% rain chance)</div>
              <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">${f.condition}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Temperature & Rainfall Trends -->
      <div class="panel">
        <div class="card-header">
          <div>
            <span class="card-title">24-Hour Diurnal Temperature Trend</span>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Hourly observations showing day/night temperature spread</p>
          </div>
          <span class="badge badge-green">Live Station NKU-01</span>
        </div>
        <div class="card-body">
          <div class="chart-canvas-container" style="height: 280px;">
            <canvas id="farmerWeatherTrendChart"></canvas>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      renderWeatherChart('farmerWeatherTrendChart', weather);
    }, 50);
  },

  // =========================================================================
  // 5. RECOMMENDATIONS CENTER (Scenario 1: Pre-Season Crops & Scenario 2: Daily Operations)
  // =========================================================================
  async recommendations(container) {
    const preSeasonCrops = await recommendationService.getPreSeasonCrops();
    const dailyDirectives = await recommendationService.getDailyDirectives();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'Recommendations' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #bbf7d0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-green">AGRO-INTELLIGENCE DECISION SUPPORT</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary-dark);">Live Sensor & Forecast Engine</span>
            </div>
            <h1 style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
              Farmer Recommendation & Decision Center
            </h1>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px; max-width: 700px;">
              Translating complex weather forecasts, moisture levels, and soil metrics into clear farming instructions.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" id="tabBtnDaily" style="font-size: 0.85rem;">⚡ In-Season Daily Actions</button>
            <button class="btn btn-outline" id="tabBtnPreSeason" style="font-size: 0.85rem;">🌱 Pre-Season Crop Selection</button>
          </div>
        </div>
      </div>

      <!-- SECTION 1: IN-SEASON DAILY OPERATIONAL DIRECTIVES (SCENARIO 2) -->
      <div id="sectionDailyDirectives" style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Scenario 2: In-Season Daily Operational Directives
            </h2>
            <p style="font-size: 0.825rem; color: var(--text-muted);">Real-time instructions based on live 24h weather observations and upcoming 48h forecasts.</p>
          </div>
          <span class="badge badge-green">${dailyDirectives.length} Actions Generated</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${dailyDirectives.map(d => `
            <div class="panel" style="padding: 22px; border-left: 6px solid ${d.urgency === 'CRITICAL' ? 'var(--accent-rose, #ef4444)' : d.category === 'FERTILIZER' ? 'var(--accent-amber)' : 'var(--primary)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 10px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge ${d.urgency === 'CRITICAL' ? 'badge-rose' : d.category === 'FERTILIZER' ? 'badge-amber' : 'badge-blue'}">${d.category}</span>
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted);">Urgency: ${d.urgency} · Due: ${d.dueTimeframe}</span>
                  </div>
                  <h3 style="font-size: 1.2rem; font-weight: 900; color: var(--text-primary); margin: 4px 0;">${d.title}</h3>
                  <div style="font-size: 0.825rem; color: var(--text-muted);">Target: <strong>${d.crop}</strong> (${d.field})</div>
                </div>
                <span class="badge badge-green" style="font-size: 0.825rem; padding: 4px 10px;">${d.confidenceScore}% Model Confidence</span>
              </div>

              <!-- Suggested Action -->
              <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin: 12px 0;">
                <strong style="color: var(--primary-dark); font-size: 0.875rem; display: block; margin-bottom: 4px;">⚡ Suggested Farming Action:</strong>
                <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">${d.actionRequired}</p>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;"><strong>Why:</strong> ${d.why}</div>
              </div>

              <!-- Supporting Telemetry Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-top: 12px;">
                ${Object.entries(d.supportingWeather || {}).map(([k, v]) => `
                  <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 8px 12px; border-radius: var(--radius-xs); font-size: 0.775rem;">
                    <span style="color: var(--text-muted); font-weight: 700; display: block;">${k}:</span>
                    <strong style="color: var(--text-primary);">${v}</strong>
                  </div>
                `).join('')}
              </div>

              <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;">
                <button class="btn btn-outline" style="font-size: 0.8rem; padding: 6px 14px;" onclick="alert('Directive marked as completed in farm activity log.')">✔ Mark as Done</button>
                <button class="btn btn-primary" style="font-size: 0.8rem; padding: 6px 14px;" onclick="alert('Action scheduled in your mobile calendar.')">📅 Add to Schedule</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SECTION 2: PRE-SEASON CROP SELECTION (SCENARIO 1) -->
      <div id="sectionPreSeasonCrops" style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Scenario 1: Pre-Season Crop Selection & Suitability Ranking
            </h2>
            <p style="font-size: 0.825rem; color: var(--text-muted);">Long-range seasonal forecast (680mm rain, 21.5°C mean, 65% humidity) matched against crop profiles.</p>
          </div>
          <span class="badge badge-green">Seasonal Outlook: Favourable</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px;">
          ${preSeasonCrops.map(c => `
            <div class="panel" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid ${c.suitabilityScore >= 85 ? 'var(--primary)' : c.suitabilityScore >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)'};">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="badge ${c.suitabilityScore >= 85 ? 'badge-green' : c.suitabilityScore >= 70 ? 'badge-amber' : 'badge-rose'}">
                    ${c.suitabilityClass.replace('_', ' ')}
                  </span>
                  <strong style="font-size: 1.1rem; color: var(--primary-dark); font-weight: 900;">${c.suitabilityScore}% Score</strong>
                </div>

                <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--text-primary); margin: 6px 0;">${c.cropName}</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">${c.rationale}</p>

                <div style="background: var(--bg-primary); padding: 10px 12px; border-radius: var(--radius-xs); font-size: 0.8rem; margin-bottom: 12px;">
                  <strong style="color: var(--primary-dark);">Recommended Variety:</strong>
                  <div style="color: var(--text-primary); font-weight: 700; margin-top: 2px;">${c.recommendedVarieties}</div>
                </div>

                <div style="font-size: 0.775rem; color: var(--text-muted); margin-bottom: 6px;">
                  <strong style="color: var(--primary-dark);">Key Opportunities:</strong>
                  <ul style="margin: 4px 0 8px 16px; padding: 0;">
                    ${(c.keyOpportunities || []).map(o => `<li>${o}</li>`).join('')}
                  </ul>
                </div>

                <div style="font-size: 0.775rem; color: var(--text-muted);">
                  <strong style="color: var(--accent-amber);">Risks to Mitigate:</strong>
                  <ul style="margin: 4px 0 0 16px; padding: 0;">
                    ${(c.riskFactors || []).map(r => `<li>${r}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <button class="btn btn-outline" style="margin-top: 18px; width: 100%; font-size: 0.8rem; justify-content: center;" onclick="location.hash='#crops'">
                Select for Planting Season →
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Traditional Detailed Advisories Archive -->
      <div class="panel" style="padding: 24px; margin-top: 16px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px;">
          📚 Agronomic Advisory Archive & Soil Health Records
        </h3>
            <strong style="color: var(--primary-dark); font-size: 0.9rem; display: block; margin-bottom: 4px;">💡 Suggested Action:</strong>
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
              Apply 50 kg/acre Calcium Ammonium Nitrate (CAN) placed 5cm away from plant stems. 
              Incorporate lightly into topsoil before Thursday afternoon showers.
            </p>
          </div>

          <!-- Supporting Weather & Agronomic Evidence -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.825rem;">
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-xs);">
              <span style="color: var(--text-muted); display: block; font-weight: 700;">Recent Rainfall:</span>
              <strong style="color: var(--text-primary);">18 mm in past 48h</strong>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Soil moisture level is adequate</div>
            </div>
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-xs);">
              <span style="color: var(--text-muted); display: block; font-weight: 700;">Expected Rainfall:</span>
              <strong style="color: var(--accent-blue);">18 mm Thursday afternoon</strong>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Will dissolve fertilizer efficiently</div>
            </div>
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-xs);">
              <span style="color: var(--text-muted); display: block; font-weight: 700;">Temperature Suitability:</span>
              <strong style="color: var(--primary-dark);">22-24°C daytime mean</strong>
              <div style="color: var(--text-muted); font-size: 0.75rem;">No volatilization risk (< 28°C)</div>
            </div>
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-xs);">
              <span style="color: var(--text-muted); display: block; font-weight: 700;">Soil Condition:</span>
              <strong style="color: var(--text-primary);">Volcanic Loam (pH 6.4)</strong>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Optimal nutrient exchange</div>
            </div>
          </div>
        </div>

        <!-- Detailed Recommendation Card 2: Pest Monitoring -->
        <div class="panel" style="padding: 24px; border-left: 6px solid var(--accent-blue);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="badge badge-blue">PEST & DISEASE SCOUTING</span>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-blue);">Urgency: Routine</span>
              </div>
              <h2 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary);">
                Scout dry bean parcel for African Bollworm / Pod Borer
              </h2>
              <div style="font-size: 0.825rem; color: var(--text-muted); margin-top: 2px;">
                Relevant Crop: <strong>Dry Beans (Rosecoco)</strong> · Target Farm: <strong>Green Valley Model Farm (South Field B)</strong>
              </div>
            </div>
            <span class="badge badge-green" style="font-size: 0.85rem; padding: 6px 14px;">88% Model Confidence</span>
          </div>

          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; margin: 16px 0;">
            <strong style="color: var(--primary-dark); font-size: 0.9rem; display: block; margin-bottom: 4px;">💡 Suggested Action:</strong>
            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
              Inspect 20 random plants across field diagonals for flower damage or early pod bores. 
              Hold off spraying pesticides unless threshold exceeds 2 larvae per 10 plants.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.825rem;">
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-xs);">
              <span style="color: var(--text-muted); display: block; font-weight: 700;">Phenological Stage:</span>
              <strong style="color: var(--text-primary);">Flowering & Early Pod Set</strong>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Most susceptible to damage</div>
            </div>
            <div style="background: #ffffff; border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-xs);">
              <span style="color: var(--text-muted); display: block; font-weight: 700;">Relative Humidity:</span>
              <strong style="color: var(--text-primary);">68% Morning Average</strong>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Favorable for natural biocontrols</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Interactive Tab Switching
    const tabDaily = container.querySelector('#tabBtnDaily');
    const tabPre = container.querySelector('#tabBtnPreSeason');
    const secDaily = container.querySelector('#sectionDailyDirectives');
    const secPre = container.querySelector('#sectionPreSeasonCrops');

    if (tabDaily && tabPre && secDaily && secPre) {
      tabDaily.addEventListener('click', () => {
        tabDaily.className = 'btn btn-primary';
        tabPre.className = 'btn btn-outline';
        secDaily.style.display = 'flex';
        secPre.style.display = 'none';
      });

      tabPre.addEventListener('click', () => {
        tabPre.className = 'btn btn-primary';
        tabDaily.className = 'btn btn-outline';
        secDaily.style.display = 'none';
        secPre.style.display = 'flex';
      });
    }
  },

  // =========================================================================
  // 6. YIELD PREDICTION & PRODUCTION PLANNING
  // =========================================================================
  async yield(container) {
    const yieldEstimates = await yieldService.getEstimates();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'Yield Estimates' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Expected Harvest & Yield Projections</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Production estimates based on active planted area, agro-climatic growth models, and regional benchmarks.
        </p>
      </div>

      <!-- Yield Metrics -->
      <div class="metrics-grid-8" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Total Expected Harvest</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">70.2 Tonnes</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Across all 12.5 hectares</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Maize Yield Projection</span>
          <span class="metric-box-val" style="color: var(--primary);">5.62 t/ha</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">+24.8% vs county baseline</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Historical Harvest 2025</span>
          <span class="metric-box-val">4.50 t/ha</span>
          <span class="metric-box-sub" style="color: var(--text-muted);">Normal Long Rains</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Projection Confidence</span>
          <span class="metric-box-val" style="color: var(--accent-purple);">89%</span>
          <span class="metric-box-sub" style="color: var(--accent-purple);">High statistical reliability</span>
        </div>
      </div>

      <!-- Breakdown Table -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header"><span class="card-title">Production Breakdown by Crop & Variety</span></div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Crop & Variety</th>
              <th>Planted Area</th>
              <th>County Benchmark</th>
              <th>Estimated Yield</th>
              <th>Total Output Forecast</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${yieldEstimates.map(y => `
              <tr>
                <td><strong>${y.crop}</strong></td>
                <td>${y.areaHa} Hectares</td>
                <td>${y.benchmarkKgHa} kg/ha</td>
                <td><strong style="color: var(--primary-dark); font-size: 0.95rem;">${y.projectedKgHa} kg/ha</strong></td>
                <td><strong style="color: var(--text-primary);">${((y.areaHa * y.projectedKgHa) / 1000).toFixed(1)} MT</strong></td>
                <td><span class="badge badge-green">On Target</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Production Planning Tip -->
      <div class="panel" style="padding: 20px; background: var(--bg-primary); border-left: 4px solid var(--primary);">
        <strong style="color: var(--primary-dark); font-size: 0.9rem; display: block; margin-bottom: 4px;">
          🌾 Post-Harvest & Storage Planning Note:
        </strong>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
          With a projected harvest of over 70 Metric Tonnes across your parcels, secure hermetic bags (PICS bags) or local warehouse space by October to prevent post-harvest weevil loss.
        </p>
      </div>
    `;
  },

  // =========================================================================
  // 7. ALERTS (Drought, Excess Rain, Temp Extremes, Crop Warnings)
  // =========================================================================
  async alerts(container) {
    const alertCatalog = [
      {
        id: 'alt-101',
        title: 'Excess Rainfall Advisory',
        type: 'Rainfall Risk',
        severity: 'HIGH',
        explanation: 'Predicted rainfall exceeding 50mm within 36 hours. Risk of localized furrow flooding.',
        action: 'Inspect field runoff channels. Do not spray foliar fertilizers as they will wash off.',
        region: 'Nakuru High Plains',
        time: 'Active for next 48h'
      },
      {
        id: 'alt-102',
        title: 'Mild Evapotranspiration Dry Spell',
        type: 'Drought Risk',
        severity: 'MEDIUM',
        explanation: '3 consecutive sunny days with low humidity (< 45%) expected early next week.',
        action: 'Ensure drip irrigation lines are flushed and ready for supplemental watering if topsoil dries out.',
        region: 'Rongai Valley',
        time: 'Starting next Monday'
      },
      {
        id: 'alt-103',
        title: 'Optimal Crop Spraying Window',
        type: 'Unsuitable Conditions Warning',
        severity: 'INFORMATIONAL',
        explanation: 'Wind speed under 7 km/h and dry canopy expected tomorrow from 07:00 to 11:00.',
        action: 'Ideal window for routine weed and pest maintenance before afternoon wind picks up.',
        region: 'Green Valley Model Farm',
        time: 'Tomorrow 07:00 - 11:00'
      },
      {
        id: 'alt-104',
        title: 'V6 Crop Phenological Stage Transition',
        type: 'Crop-Cycle Warning',
        severity: 'LOW',
        explanation: 'Maize stands have completed 6 leaves. Crop enters rapid stem elongation phase.',
        action: 'Nutrient demand surges over the next 14 days. Ensure top-dressing CAN is applied.',
        region: 'North Field A',
        time: 'Current stage'
      }
    ];

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'My Farm Assistant', hash: '#dashboard' }, { label: 'Farm Alerts' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Farm Risk Advisories & Weather Alerts</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
          Easy-to-understand alerts explaining weather risks and the exact precautions to take.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${alertCatalog.map(a => {
          const badgeClass = a.severity === 'HIGH' || a.severity === 'CRITICAL' 
            ? 'badge-rose' 
            : (a.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue');
          const borderStyle = a.severity === 'HIGH' 
            ? 'border-left: 6px solid var(--accent-rose);' 
            : (a.severity === 'MEDIUM' ? 'border-left: 6px solid var(--accent-amber);' : 'border-left: 6px solid var(--accent-blue);');

          return `
            <div class="panel" style="padding: 22px; ${borderStyle}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 10px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge ${badgeClass}">${a.severity}</span>
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${a.type}</span>
                  </div>
                  <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${a.title}</h3>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${a.region} · ${a.time}</div>
                </div>
              </div>

              <div style="margin: 12px 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                <strong>What this means:</strong> ${a.explanation}
              </div>

              <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 14px; font-size: 0.825rem;">
                <strong style="color: var(--primary-dark);">Recommended Farmer Action:</strong> ${a.action}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
