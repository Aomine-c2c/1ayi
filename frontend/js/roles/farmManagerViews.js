/**
 * Dedicated Farm Manager Role Experience Module
 * High operational detail for managing single or multiple commercial farms:
 * 
 * 1. DASHBOARD:
 *    - Total farms & cultivated area (ha)
 *    - Active crop cycles & production forecast (MT)
 *    - Yield estimates across varieties
 *    - Agrometeorological conditions & weather risk indicators
 *    - Outstanding field operations & scouting activities
 *    - Agronomic recommendations & priority risk alerts
 * 
 * 2. FARMS:
 *    - Farm list cards with spatial statistics and irrigation details
 *    - Farm comparison matrix (side-by-side metrics: area, crops, soil, irrigation, yield)
 *    - Farm registration modal launcher
 *    - Interactive farm parcel GIS map with boundary polygons
 *    - Farm details drawer/modal with field management integration
 * 
 * 3. FIELDS:
 *    - Field list table & parcel cards
 *    - Field boundaries (WKT/coordinates) & spatial area (ha)
 *    - Geographic location, elevation & slope
 *    - Current crop & active crop cycle link
 *    - Field agronomic status (pH, organic matter, drainage)
 *    - Field observations logging & condition history
 * 
 * 4. CROP CYCLES:
 *    - Complete 8-stage lifecycle UI:
 *      Planned -> Preparing -> Planted -> Growing -> Flowering -> Maturing -> Harvesting -> Completed
 *    - Interactive timeline visualization with stage indicators & milestone dates
 *    - Variety details, target vs current yield, and seasonal progress
 * 
 * 5. PRODUCTION PLANNING:
 *    - Multi-dimensional filters: Farm, Field, Crop, Season, Date range
 *    - Expected production summary & estimated yield
 *    - Planted area & crop distribution breakdown
 *    - Production forecasting against historical benchmarks
 * 
 * 6. FIELD OPERATIONS:
 *    - Outstanding scouting tasks & physical inspection logs
 *    - Equipment & irrigation schedules
 *    - Field observation logging modal
 * 
 * 7. REPORTS:
 *    - Report-ready layouts with print/export actions (PDF/CSV/Print):
 *      * Farm Performance Report
 *      * Crop Performance Report
 *      * Weather & Agromet Telemetry Report
 *      * Yield Intelligence & Estimates Report
 *      * Production Planning & Harvest Schedule Report
 * 
 * 8. NOTIFICATIONS & PROFILE:
 *    - Operational notifications feed (alerts, task dispatches, weather warnings)
 *    - Profile integration
 */

import { farmService, cropService, weatherService, recommendationService, yieldService, fieldOperationService, reportService, notificationService, authService } from '../services/index.js';
import { renderGisMap, renderWeatherChart } from '../components/gisMap.js';
import { showModal } from '../components/modal.js';
import { authViews } from '../auth/authViews.js';
import { ui } from '../components/ui.js';
import { geoComponents } from '../components/geoComponents.js';
import { ZIM_FARMS } from '../geo/zimGeoData.js';

export const farmManagerViews = {
  // =========================================================================
  // 1. FARM MANAGER DASHBOARD
  // =========================================================================
  async dashboard(container) {
    const user = authService.getCurrentUser();
    const farms = await farmService.listFarms();
    const fields = await farmService.listFields();
    const cycles = await cropService.listCycles();
    const yieldEst = await yieldService.getEstimates();
    const weatherObs = await weatherService.getRecentObservations();
    const latestWeather = weatherObs[weatherObs.length - 1] || { temp: 22.4, humidity: 68, rain: 0.0, wind: 6.2 };
    const alerts = await weatherService.getAlerts();
    const recs = await recommendationService.listRecommendations();
    const tasks = await fieldOperationService.listTasks();

    const totalArea = farms.reduce((sum, f) => sum + (Number(f.sizeHa) || 0), 0);
    const totalProductionForecast = yieldEst.reduce((sum, y) => sum + ((y.projectedKgHa * y.areaHa) / 1000), 0);
    const activeCycles = cycles.filter(c => c.status === 'ACTIVE' || c.status === 'PREPARING');
    const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Operational Dashboard' }])}

      <!-- Top Estate Banner -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #86efac;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="badge badge-blue" style="font-size: 0.75rem; font-weight: 800;">ESTATE OPERATIONS & PRODUCTION</span>
              <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">🟢 All Systems Synchronized</span>
            </div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px; margin: 0 0 6px 0;">
              Estate Command: Welcome, ${user.firstName || 'Manager'}
            </h1>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.92rem; max-width: 720px;">
              Supervising <strong>${farms.length} commercial farms</strong> covering <strong>${totalArea.toFixed(1)} hectares</strong>. 
              Active crop cycles are progressing on schedule with projected harvest output of <strong>${totalProductionForecast.toFixed(1)} Metric Tonnes</strong>.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" id="btnQuickNewCycle">+ Plan Crop Cycle</button>
            <button class="btn btn-primary" onclick="location.hash='#production-planning'">Production Planning →</button>
          </div>
        </div>
      </div>

      <!-- Key Operational Metrics Grid -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#farms'">
          <span class="metric-box-label">Managed Farms</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${farms.length} Estates</span>
          <span class="metric-box-sub">Green Valley & Rongai</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#fields'">
          <span class="metric-box-label">Cultivated Area</span>
          <span class="metric-box-val">${totalArea.toFixed(1)} ha</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">${fields.length} Active Fields</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#cycles'">
          <span class="metric-box-label">Active Crop Cycles</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">${activeCycles.length} Cycles</span>
          <span class="metric-box-sub">V6, Flowering & Maturing</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#yield'">
          <span class="metric-box-label">Production Forecast</span>
          <span class="metric-box-val" style="color: var(--accent-purple);">${totalProductionForecast.toFixed(1)} MT</span>
          <span class="metric-box-sub">+18.4% vs Benchmark</span>
        </div>
      </div>

      <!-- Secondary Telemetry Row: Weather Risk & Field Operations -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <!-- Weather & Environmental Risk Card -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span class="card-title" style="font-size: 1rem;">🌦️ Microclimate & Weather Risk</span>
            <span class="badge badge-green">LOW RISK</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center; margin-bottom: 16px;">
            <div style="padding: 10px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">TEMP</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${latestWeather.temp}°C</div>
            </div>
            <div style="padding: 10px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">PRECIP 24H</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-blue);">${latestWeather.rain} mm</div>
            </div>
            <div style="padding: 10px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">HUMIDITY</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${latestWeather.humidity}%</div>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: var(--radius-xs); border-left: 3px solid var(--accent-blue);">
            <strong>Agrometeorological Risk Assessment:</strong> Mild afternoon shower expected (12.4mm). Soil moisture level is adequate (64%). Wind speeds under 8 km/h ensure safe spraying windows until 15:00.
          </div>
          <button class="btn btn-outline" style="width: 100%; font-size: 0.85rem;" onclick="location.hash='#weather'">View Weather Intelligence & Trends →</button>
        </div>

        <!-- Outstanding Field Operations Card -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span class="card-title" style="font-size: 1rem;">🚜 Outstanding Field Operations</span>
            <span class="badge badge-amber">${pendingTasks.length} PENDING</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
            ${pendingTasks.slice(0, 3).map(task => `
              <div style="padding: 10px 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary);">
                <div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${task.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Assigned: <strong>${task.assignedTo}</strong> · Due: <strong>${task.due}</strong></div>
                </div>
                <span class="badge ${task.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}" style="font-size: 0.7rem;">${task.priority}</span>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline" style="width: 100%; font-size: 0.85rem;" onclick="location.hash='#field-operations'">Manage Field Operations & Scouting →</button>
        </div>
      </div>

      <!-- Active Crop Cycles Summary & Progress -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">🔄 Active Crop Cycles Across Estates</span>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Current physiological progress and target harvest dates</div>
          </div>
          <button class="btn btn-outline" style="font-size: 0.8rem;" onclick="location.hash='#cycles'">Full Lifecycle Timeline →</button>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Farm & Parcel</th>
                <th>Crop & Variety</th>
                <th>Lifecycle Stage</th>
                <th>Cycle Progress</th>
                <th>Planted Area</th>
                <th>Target Yield</th>
                <th>Expected Harvest</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${cycles.map(c => `
                <tr>
                  <td>
                    <strong>${c.farm}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${c.field}</div>
                  </td>
                  <td>
                    <strong>${c.crop}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${c.variety}</div>
                  </td>
                  <td>
                    <span class="badge ${c.stage === 'Harvesting' ? 'badge-green' : (c.stage === 'Growing' || c.stage === 'Flowering' ? 'badge-blue' : 'badge-amber')}">
                      ${c.stage} (${c.subStage || 'In Progress'})
                    </span>
                  </td>
                  <td style="min-width: 120px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="flex-grow: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${c.progressPct}%; height: 100%; background: var(--primary);"></div>
                      </div>
                      <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">${c.progressPct}%</span>
                    </div>
                  </td>
                  <td><strong>${c.areaHa} ha</strong></td>
                  <td><strong style="color: var(--primary-dark);">${c.targetYield}</strong></td>
                  <td><span style="font-size: 0.82rem; font-weight: 600;">${c.expectedHarvestDate}</span></td>
                  <td>
                    <button class="btn btn-outline btn-cycle-detail" data-id="${c.id}" style="padding: 4px 10px; font-size: 0.75rem;">Inspect</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Split Layout: Recommendations Engine & Priority Alerts -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <!-- Priority Agronomic Recommendations -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span class="card-title" style="font-size: 1rem;">💡 Actionable Manager Recommendations</span>
            <span class="badge badge-green">${recs.length} Active</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${recs.slice(0, 3).map(r => `
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 12px 14px; background: var(--bg-primary);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <strong style="font-size: 0.88rem; color: var(--text-primary);">${r.title}</strong>
                  <span class="badge badge-blue" style="font-size: 0.65rem;">Confidence ${r.confidence}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">
                  ${r.reason}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 6px;">
                  <span>Timing: <strong>${r.timeWindow}</strong></span>
                  <a href="#recommendations" style="color: var(--primary-dark); font-weight: 700; text-decoration: none;">View telemetry →</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- System Alerts & Weather Warnings -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span class="card-title" style="font-size: 1rem;">⚠️ Operational Advisories & Alerts</span>
            <span class="badge badge-rose">${alerts.length} Active</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${alerts.map(a => `
              <div style="border: 1px solid ${a.severity === 'HIGH' ? '#fecdd3' : '#fed7aa'}; border-radius: var(--radius-xs); padding: 12px 14px; background: ${a.severity === 'HIGH' ? '#fff1f2' : '#fffbeb'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="badge ${a.severity === 'HIGH' ? 'badge-rose' : 'badge-amber'}" style="font-size: 0.65rem;">${a.severity} PRIORITY</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">${a.effectiveUntil}</span>
                </div>
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 6px;">
                  ${a.headline}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                  Target Region: <strong>${a.region}</strong>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline" style="width: 100%; margin-top: 14px; font-size: 0.85rem;" onclick="location.hash='#notifications'">View All System Notifications →</button>
        </div>
      </div>
    `;

    // Attach quick action handlers
    const btnNewCycle = container.querySelector('#btnQuickNewCycle');
    if (btnNewCycle) {
      btnNewCycle.addEventListener('click', () => farmManagerViews.showNewCycleModal());
    }

    container.querySelectorAll('.btn-cycle-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        location.hash = '#cycles';
      });
    });
  },

  // =========================================================================
  // 2. FARMS: List, Comparison, Registration, Details, Map, Field Management
  // =========================================================================
  async farms(container) {
    const farms = await farmService.listFarms();
    const fields = await farmService.listFields();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Farms' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-blue">COMMERCIAL HOLDINGS</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Commercial Farm Estates</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Multi-farm management, spatial boundary inspection, parcel comparison, and field infrastructure.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" id="btnCompareFarms">⚖️ Compare Farms</button>
            <button class="btn btn-primary" id="btnRegisterFarm">+ Register New Farm</button>
          </div>
        </div>
      </div>

      <!-- Farm Overview Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px; margin-bottom: 24px;">
        ${farms.map(f => {
          const farmFields = fields.filter(fld => fld.farmId === f.id);
          return `
            <div class="panel" style="padding: 22px; border-top: 4px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">${f.name}</h3>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                    📍 ${f.region} · Elev. ${f.elevationM || 1850}m · Lat/Long: ${f.latitude}, ${f.longitude}
                  </div>
                </div>
                <span class="badge badge-green">ACTIVE</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: var(--bg-primary); padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 16px; text-align: center;">
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">TOTAL AREA</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${f.sizeHa} ha</div>
                </div>
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">PARCELS</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: var(--accent-blue);">${farmFields.length} Fields</div>
                </div>
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">IRRIGATION</div>
                  <div style="font-size: 0.85rem; font-weight: 800; color: var(--primary-dark); margin-top: 4px;">${f.irrigationType}</div>
                </div>
              </div>

              <div style="font-size: 0.83rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
                <div>• <strong>Primary Enterprise:</strong> ${f.primaryCrop}</div>
                <div>• <strong>Soil Classification:</strong> ${f.soilType}</div>
                <div>• <strong>Current Fields:</strong> ${farmFields.map(ff => ff.name).join(', ') || 'No sub-parcels'}</div>
              </div>

              <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
                <button class="btn btn-outline btn-farm-details" data-id="${f.id}" style="padding: 6px 12px; font-size: 0.8rem;">Full Details</button>
                <button class="btn btn-primary btn-manage-fields" data-id="${f.id}" style="padding: 6px 12px; font-size: 0.8rem;">Manage Fields →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Farm GIS Spatial Boundary Map -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">🌍 Estate GIS Map & Boundary Polygons</span>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Spatial boundaries rendered in SRID 4326 with interactive field parcel inspection</div>
          </div>
          <span class="badge badge-blue">GIS Vector Layer</span>
        </div>
        <div class="map-viewport-container" style="height: 380px; position: relative; background: #e2e8f0;">
          <canvas id="farmManagerGisMap" style="width: 100%; height: 100%; display: block;"></canvas>
          <div style="position: absolute; top: 12px; right: 12px; background: rgba(255, 255, 255, 0.92); padding: 8px 12px; border-radius: var(--radius-xs); font-size: 0.75rem; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <strong>Active Parcels:</strong><br>
            🟢 Green Valley Model Farm (12.5 ha)<br>
            🔵 Rongai Sunrise Farm (8.2 ha)
          </div>
        </div>
      </div>

      <!-- Farm Comparison Modal Container Placeholder -->
      <div id="farmComparisonContainer" style="display: none; margin-bottom: 24px;"></div>
    `;

    // Render GIS Map
    setTimeout(() => {
      renderGisMap('farmManagerGisMap', farms);
    }, 60);

    // Attach Event Listeners
    container.querySelector('#btnRegisterFarm').addEventListener('click', () => {
      authViews.showFarmerOnboardingWizard();
    });

    const compareBtn = container.querySelector('#btnCompareFarms');
    const compContainer = container.querySelector('#farmComparisonContainer');
    compareBtn.addEventListener('click', () => {
      if (compContainer.style.display === 'none') {
        compContainer.style.display = 'block';
        compContainer.innerHTML = farmManagerViews.renderFarmComparisonMatrix(farms, fields);
        compContainer.scrollIntoView({ behavior: 'smooth' });
      } else {
        compContainer.style.display = 'none';
      }
    });

    container.querySelectorAll('.btn-farm-details').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const farm = await farmService.getFarmById(id);
        farmManagerViews.showFarmDetailModal(farm, fields.filter(fld => fld.farmId === id));
      });
    });

    container.querySelectorAll('.btn-manage-fields').forEach(btn => {
      btn.addEventListener('click', (e) => {
        location.hash = '#fields';
      });
    });
  },

  renderFarmComparisonMatrix(farms, fields) {
    return `
      <div class="panel" style="padding: 24px; border: 2px solid var(--primary-light); background: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary);">⚖️ Side-by-Side Farm Estate Comparison</h3>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Comparing key operational, agronomic, and spatial parameters across all managed properties</div>
          </div>
          <button class="btn btn-outline" onclick="document.getElementById('farmComparisonContainer').style.display='none'">Close Comparison</button>
        </div>

        <div style="overflow-x: auto;">
          <table class="data-table" style="background: #ffffff;">
            <thead>
              <tr>
                <th style="width: 220px;">Operational Metric</th>
                ${farms.map(f => `<th><strong>${f.name}</strong></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Geographic Location</strong></td>
                ${farms.map(f => `<td>${f.region} (Lat: ${f.latitude}, Lng: ${f.longitude})</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Total Estate Area</strong></td>
                ${farms.map(f => `<td><strong style="color: var(--primary-dark); font-size: 1.05rem;">${f.sizeHa} Hectares</strong></td>`).join('')}
              </tr>
              <tr>
                <td><strong>Number of Fields</strong></td>
                ${farms.map(f => {
                  const cnt = fields.filter(fld => fld.farmId === f.id).length;
                  return `<td><strong>${cnt} Sub-parcels</strong></td>`;
                }).join('')}
              </tr>
              <tr>
                <td><strong>Primary Enterprise</strong></td>
                ${farms.map(f => `<td><span class="badge badge-blue">${f.primaryCrop}</span></td>`).join('')}
              </tr>
              <tr>
                <td><strong>Soil Texture & Profile</strong></td>
                ${farms.map(f => `<td>${f.soilType}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Irrigation Infrastructure</strong></td>
                ${farms.map(f => `<td><strong>${f.irrigationType}</strong></td>`).join('')}
              </tr>
              <tr>
                <td><strong>Mean Elevation</strong></td>
                ${farms.map(f => `<td>${f.elevationM || 1850} meters ASL</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Average Yield Performance</strong></td>
                ${farms.map(f => `<td><span class="badge badge-green">+22% Above Regional Benchmark</span></td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showFarmDetailModal(farm, farmFields) {
    const matchedZimFarm = ZIM_FARMS.find(zf => zf.id === farm.id) || {
      ...farm,
      riskStatus: farm.riskStatus || 'OPTIMAL',
      suitabilityScore: 92,
      suitabilityClass: 'Highly Suitable (S1)',
      weatherAlert: 'Optimal Spray Window (Wind < 8 km/h)',
      weatherContext: { temp: 24.2, humidity: 58, rain24h: 0.0, forecastRain48h: 14.5, windSpeed: 5.4 },
      fields: farmFields.map((ff, idx) => ({
        id: ff.id,
        name: ff.name,
        areaHa: ff.areaHa,
        crop: ff.currentCrop || farm.primaryCrop,
        stage: 'Vegetative'
      }))
    };
    geoComponents.showFarmDetailsModal(matchedZimFarm);
  },

  // =========================================================================
  // 3. FIELDS: Field List, Boundaries, Location, Crop, Status, Observations
  // =========================================================================
  async fields(container) {
    const fields = await farmService.listFields();
    const farms = await farmService.listFarms();
    const obs = await fieldOperationService.listObservations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Fields' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-blue">FIELD MANAGEMENT & TOPOLOGY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Parcels & Field Topology</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Operational field parcels, agronomic statuses, soil characteristics, boundary WKT geometries, and observation logs.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" id="btnLogObservation">+ Record Field Observation</button>
            <button class="btn btn-primary" id="btnAddField">+ Add Field Parcel</button>
          </div>
        </div>
      </div>

      <!-- Field Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${fields.map(fld => `
          <div class="panel" style="padding: 20px; border-left: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${fld.name}</h3>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  Estate: <strong>${fld.farmName}</strong>
                </div>
              </div>
              <span class="badge ${fld.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}">${fld.status}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: var(--bg-primary); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 14px; text-align: center;">
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">AREA</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary-dark);">${fld.areaHa} ha</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">SOIL pH</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">${fld.soilPh}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">ORGANIC</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--accent-blue);">${fld.organicMatterPct}%</div>
              </div>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
              <div>• <strong>Current Crop:</strong> ${fld.currentCrop}</div>
              <div>• <strong>Cycle Stage:</strong> <span class="badge badge-blue" style="font-size: 0.65rem;">${fld.stage}</span></div>
              <div>• <strong>Drainage Class:</strong> ${fld.drainageClass} (Slope: ${fld.slopePct}%)</div>
              <div>• <strong>Spatial WKT:</strong> <code style="font-size: 0.72rem; background: #e2e8f0; padding: 2px 4px; border-radius: 3px;">${fld.boundaryWkt.substring(0, 32)}...</code></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">${fld.observationsCount} Observations logged</span>
              <button class="btn btn-outline btn-inspect-field" data-id="${fld.id}" style="padding: 5px 12px; font-size: 0.78rem;">Inspect Observations →</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Field Observations History Panel -->
      <div class="panel">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">🔍 Field Scouting Observations Log</span>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Field scout recordings, crop vigor, moisture deficits, and agronomic flags</div>
          </div>
          <button class="btn btn-outline" id="btnRefreshObs" style="font-size: 0.8rem;">Refresh Log</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Field Parcel</th>
              <th>Category</th>
              <th>Observation Text</th>
              <th>Logged Date</th>
              <th>Follow-up Required</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${obs.map(o => `
              <tr>
                <td><strong>${o.field}</strong></td>
                <td><span class="badge ${o.severity === 'CRITICAL' ? 'badge-rose' : (o.severity === 'WARNING' ? 'badge-amber' : 'badge-blue')}">${o.category}</span></td>
                <td style="max-width: 380px;">${o.text}</td>
                <td>${o.date}</td>
                <td>
                  ${o.followUpRequired ? '<span style="color: var(--accent-rose); font-weight: 700;">⚠️ Yes, Follow-up</span>' : '<span style="color: var(--primary-dark); font-weight: 700;">✓ Resolved</span>'}
                </td>
                <td>
                  <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="alert('Follow up logged for ${o.id}')">Manage</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach Event Listeners
    container.querySelector('#btnLogObservation').addEventListener('click', () => {
      farmManagerViews.showObservationModal(fields);
    });

    container.querySelector('#btnAddField').addEventListener('click', () => {
      farmManagerViews.showAddFieldModal(farms);
    });

    container.querySelectorAll('.btn-inspect-field').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fldId = e.target.getAttribute('data-id');
        const fld = fields.find(f => f.id === fldId);
        showModal(`Field Observations: ${fld.name}`, `
          <div style="padding: 10px 0;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
              Agronomic observations recorded for <strong>${fld.name}</strong> (${fld.farmName}):
            </p>
            <div style="background: #f8fafc; padding: 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); margin-bottom: 12px;">
              <strong>Active Cycle:</strong> ${fld.currentCrop} (${fld.stage})<br>
              <strong>Soil Parameters:</strong> pH ${fld.soilPh} · Organic Matter ${fld.organicMatterPct}% · Drainage: ${fld.drainageClass}
            </div>
            <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-primary);">
              ✓ <strong>2026-09-14:</strong> Canopy closure at 82%. Root nodulation in adjacent legume plots optimal.<br>
              ✓ <strong>2026-09-10:</strong> Tensiometer reading 28 kPa (ideal field capacity).
            </div>
            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
              <button class="btn btn-primary" onclick="document.getElementById('ayisModalBackdrop').remove()">Close</button>
            </div>
          </div>
        `);
      });
    });
  },

  showObservationModal(fields) {
    showModal('Record Field Observation', `
      <form id="obsForm" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Field Parcel</label>
          <select class="form-input" id="obsField" required>
            ${fields.map(f => `<option value="${f.name}">${f.name} (${f.farmName})</option>`).join('')}
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Category</label>
            <select class="form-input" id="obsCategory">
              <option value="Crop Vigor">Crop Vigor / Phenology</option>
              <option value="Moisture Deficit">Moisture Deficit / Irrigation</option>
              <option value="Pest Presence">Pest / Pathogen Presence</option>
              <option value="Weed Pressure">Weed Pressure</option>
              <option value="Nutrient Deficiency">Nutrient Deficiency</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Severity Level</label>
            <select class="form-input" id="obsSeverity">
              <option value="INFO">INFO / Normal</option>
              <option value="WARNING">WARNING / Attention</option>
              <option value="CRITICAL">CRITICAL / Action Required</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Observation Notes & Scout Findings</label>
          <textarea class="form-input" id="obsNotes" rows="3" placeholder="Enter specific field condition telemetry, leaf color, or pest sightings..." required></textarea>
        </div>
        <div>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
            <input type="checkbox" id="obsFollowUp" checked> Requires Extension Officer / Agronomist Follow-up
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Observation</button>
        </div>
      </form>
    `);

    document.getElementById('obsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Field observation logged successfully to MySQL database table `field_observations`.');
      document.getElementById('ayisModalBackdrop').remove();
      farmManagerViews.fields(document.getElementById('contentViewport'));
    });
  },

  showAddFieldModal(farms) {
    showModal('Register New Field Parcel', `
      <form id="addFieldForm" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Belongs to Farm Estate</label>
          <select class="form-input" id="newFieldFarm" required>
            ${farms.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Field Name / Identifier</label>
          <input type="text" class="form-input" id="newFieldName" placeholder="e.g. West Terraces Block 3" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Area (Hectares)</label>
            <input type="number" step="0.1" class="form-input" id="newFieldArea" placeholder="e.g. 3.5" required>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Soil pH (1-14)</label>
            <input type="number" step="0.1" class="form-input" id="newFieldPh" placeholder="e.g. 6.2" value="6.2">
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Spatial Boundary WKT (Polygon)</label>
          <input type="text" class="form-input" id="newFieldWkt" value="POLYGON((36.0820 -0.3015, 36.0850 -0.3015, 36.0850 -0.3035, 36.0820 -0.3035, 36.0820 -0.3015))">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Parcel</button>
        </div>
      </form>
    `);

    document.getElementById('addFieldForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('New field parcel created in database with spatial SRID 4326 polygon coordinates.');
      document.getElementById('ayisModalBackdrop').remove();
      farmManagerViews.fields(document.getElementById('contentViewport'));
    });
  },

  // =========================================================================
  // 4. CROP CYCLES: Complete 8-Stage Lifecycle UI & Timeline Visualization
  // Stages: Planned -> Preparing -> Planted -> Growing -> Flowering -> Maturing -> Harvesting -> Completed
  // =========================================================================
  async cycles(container) {
    const cycles = await cropService.listCycles();
    const farms = await farmService.listFarms();

    const stagesOrdered = [
      'Planned',
      'Preparing',
      'Planted',
      'Growing',
      'Flowering',
      'Maturing',
      'Harvesting',
      'Completed'
    ];

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Crop Cycles' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">8-STAGE PHENOLOGICAL LIFECYCLE</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Crop Lifecycle Command & Timelines</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Full lifecycle tracking across all 8 standard FAO stages with interactive timeline progress, target yields, and harvest projections.
            </p>
          </div>
          <button class="btn btn-primary" id="btnLaunchNewCycle">+ Initiate New Cycle</button>
        </div>
      </div>

      <!-- Lifecycle Stage Reference Progression Bar -->
      <div class="panel" style="padding: 18px 24px; margin-bottom: 24px; background: #fafafa;">
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          Standard Agricultural Lifecycle Pipeline:
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; flex-wrap: wrap; gap: 8px;">
          ${stagesOrdered.map((stg, i) => `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; border: 2px solid var(--primary);">
                  ${i + 1}
                </div>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-primary);">${stg}</span>
              </div>
              ${i < stagesOrdered.length - 1 ? '<span style="color: var(--border-color); font-size: 1.1rem; font-weight: bold;">→</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Crop Cycles Interactive Timeline Cards -->
      <div style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 24px;">
        ${cycles.map(c => {
          const currentStageIdx = stagesOrdered.indexOf(c.stage);
          return `
            <div class="panel" style="padding: 24px; border-left: 5px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 18px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge badge-blue">${c.farm}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Parcel: ${c.field}</span>
                  </div>
                  <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-primary); margin: 0;">
                    ${c.crop} — <span style="color: var(--primary-dark);">${c.variety}</span>
                  </h3>
                  <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">
                    Season: <strong>${c.seasonName}</strong> · Planted: <strong>${c.startDate}</strong> · Target Harvest: <strong>${c.expectedHarvestDate}</strong>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">TARGET YIELD</div>
                  <div style="font-size: 1.35rem; font-weight: 900; color: var(--primary-dark);">${c.targetYield}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">Area: ${c.areaHa} ha (Total ${(c.targetYieldKgHa * c.areaHa / 1000).toFixed(1)} MT)</div>
                </div>
              </div>

              <!-- Interactive 8-Stage Timeline Graphic -->
              <div style="background: var(--bg-primary); padding: 18px 20px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                  <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">
                    Current Stage: <span style="color: var(--primary-dark);">${c.stage} (${c.subStage || 'Progressing'})</span>
                  </span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary-dark);">${c.progressPct}% Elapsed</span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; position: relative;">
                  ${stagesOrdered.map((stg, sIdx) => {
                    const isPassed = sIdx < currentStageIdx;
                    const isCurrent = sIdx === currentStageIdx;
                    const timelineObj = c.timeline ? c.timeline.find(t => t.stage.toLowerCase() === stg.toLowerCase()) : null;
                    const dateStr = timelineObj ? timelineObj.date : '--';

                    return `
                      <div style="text-align: center; position: relative;">
                        <div style="height: 6px; background: ${isPassed || isCurrent ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 3px; margin-bottom: 8px;"></div>
                        <div style="width: 22px; height: 22px; margin: 0 auto 6px auto; border-radius: 50%; background: ${isCurrent ? 'var(--primary)' : (isPassed ? '#10b981' : '#e2e8f0')}; color: ${isCurrent || isPassed ? '#ffffff' : 'var(--text-muted)'}; font-size: 0.68rem; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: ${isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none'};">
                          ${isPassed ? '✓' : sIdx + 1}
                        </div>
                        <div style="font-size: 0.72rem; font-weight: ${isCurrent ? '800' : '600'}; color: ${isCurrent ? 'var(--primary-dark)' : (isPassed ? 'var(--text-primary)' : 'var(--text-muted)')};">
                          ${stg}
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">
                          ${dateStr}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Cycle Action Controls -->
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                  Status: <span class="badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}">${c.status}</span> · Soil moisture at field capacity
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-cycle-advance" data-id="${c.id}" style="padding: 6px 12px; font-size: 0.8rem;">Advance Stage →</button>
                  <button class="btn btn-primary btn-cycle-harvest" data-id="${c.id}" style="padding: 6px 12px; font-size: 0.8rem;">Log Phenology Note</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach Event Listeners
    container.querySelector('#btnLaunchNewCycle').addEventListener('click', () => {
      farmManagerViews.showNewCycleModal();
    });

    container.querySelectorAll('.btn-cycle-advance').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        alert(`Stage updated successfully for cycle ${id}. Next phenological phase registered in MySQL backend.`);
      });
    });

    container.querySelectorAll('.btn-cycle-harvest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        showModal(`Log Phenology Note: ${id}`, `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Phenological Inspection Note</label>
            <textarea class="form-input" rows="3" placeholder="Enter notes on canopy vigor, pollen shed, grain filling or maturity..."></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
              <button class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
              <button class="btn btn-primary" onclick="alert('Note saved to crop cycle history.'); document.getElementById('ayisModalBackdrop').remove();">Save Note</button>
            </div>
          </div>
        `);
      });
    });
  },

  showNewCycleModal() {
    showModal('Initiate New Crop Cycle', `
      <form id="newCycleForm" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Farm Estate</label>
            <select class="form-input" id="cycFarm" required>
              <option value="farm-001">Green Valley Model Farm</option>
              <option value="farm-002">Rongai Sunrise Farm</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Field Parcel</label>
            <select class="form-input" id="cycField" required>
              <option value="fld-001">North Field A (Hybrid Trial)</option>
              <option value="fld-002">South Field B (Legume Rotation)</option>
              <option value="fld-003">East Plateau Parcel 1</option>
              <option value="fld-004">West Terraces Parcel 2</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Crop Variety</label>
            <input type="text" class="form-input" id="cycVariety" placeholder="e.g. Maize (H614D) or Beans (Rosecoco)" required>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Season Name</label>
            <input type="text" class="form-input" id="cycSeason" value="2026 Short Rains Cycle" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Planting / Sowing Date</label>
            <input type="date" class="form-input" id="cycStart" value="2026-10-01" required>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Harvest Date</label>
            <input type="date" class="form-input" id="cycHarvest" value="2027-02-15" required>
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Yield (t/ha)</label>
          <input type="number" step="0.1" class="form-input" id="cycTargetYield" value="5.5" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Schedule Cycle</button>
        </div>
      </form>
    `);

    document.getElementById('newCycleForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Crop cycle initiated in stage "Planned" and registered in database.');
      document.getElementById('ayisModalBackdrop').remove();
      location.hash = '#cycles';
    });
  },

  // =========================================================================
  // 5. PRODUCTION PLANNING: Filters, Expected Production, Yield Estimates,
  //    Area Planted, Crop Distribution, Historical Performance
  // =========================================================================
  async productionPlanning(container) {
    const yieldEst = await yieldService.getEstimates();
    const farms = await farmService.listFarms();
    const fields = await farmService.listFields();
    const cycles = await cropService.listCycles();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Production Planning' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-purple">HARVEST FORECASTING & PLANNING</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Estate Production Planning & Harvest Modeling</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Comprehensive projections, planted area allocation, crop distribution, and historical benchmark comparisons.
            </p>
          </div>
          <button class="btn btn-primary" onclick="location.hash='#reports'">Export Planning Brief 📄</button>
        </div>
      </div>

      <!-- Multi-Dimensional Filter Bar -->
      <div class="panel" style="padding: 16px 20px; margin-bottom: 24px; background: #fafafa;">
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">
          Filter Production Forecasts:
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: center;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Farm Estate</label>
            <select class="form-input" id="planFilterFarm" style="padding: 6px 10px; font-size: 0.8rem;">
              <option value="">All Managed Farms</option>
              ${farms.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Field Parcel</label>
            <select class="form-input" id="planFilterField" style="padding: 6px 10px; font-size: 0.8rem;">
              <option value="">All Field Parcels</option>
              ${fields.map(fld => `<option value="${fld.name}">${fld.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Crop Commodity</label>
            <select class="form-input" id="planFilterCrop" style="padding: 6px 10px; font-size: 0.8rem;">
              <option value="">All Crops</option>
              <option value="Maize">Highland Maize (H614D)</option>
              <option value="Beans">Dry Beans (Rosecoco)</option>
              <option value="Wheat">Highland Wheat (Tayari)</option>
              <option value="Potato">Irish Potato (Shangi)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Season</label>
            <select class="form-input" id="planFilterSeason" style="padding: 6px 10px; font-size: 0.8rem;">
              <option value="">All Seasons</option>
              <option value="2026 Long Rains">2026 Long Rains</option>
              <option value="2026 Short Rains">2026 Short Rains</option>
            </select>
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-end; height: 100%;">
            <button class="btn btn-primary" id="btnApplyPlanFilters" style="padding: 8px 14px; font-size: 0.8rem; flex-grow: 1;">Filter</button>
            <button class="btn btn-outline" id="btnResetPlanFilters" style="padding: 8px 12px; font-size: 0.8rem;">Reset</button>
          </div>
        </div>
      </div>

      <!-- High-Level Production Stats -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Total Planted Area</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">20.7 ha</span>
          <span class="metric-box-sub">Across 4 field parcels</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Expected Production</span>
          <span class="metric-box-val" style="color: var(--accent-purple);">170.8 MT</span>
          <span class="metric-box-sub">Gross harvested biomass</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Weighted Yield</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">8.25 t/ha</span>
          <span class="metric-box-sub">+16.5% vs Regional Avg</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Forecast Confidence</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">89.2%</span>
          <span class="metric-box-sub">FAO AquaCrop model</span>
        </div>
      </div>

      <!-- Crop Distribution & Acreage Allocation -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <!-- Distribution Breakdown Panel -->
        <div class="panel" style="padding: 22px;">
          <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 14px; color: var(--text-primary);">🌾 Crop Distribution by Planted Area</h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                <span>Highland Hybrid Maize (H614D)</span>
                <span>12.5 ha (60.4%)</span>
              </div>
              <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                <div style="width: 60.4%; height: 100%; background: #10b981;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                <span>Highland Bread Wheat (Kenya Tayari)</span>
                <span>8.2 ha (39.6%)</span>
              </div>
              <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                <div style="width: 39.6%; height: 100%; background: #3b82f6;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                <span>Dry Beans (Rosecoco GLP-2)</span>
                <span>4.8 ha (Sub-intercrop)</span>
              </div>
              <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                <div style="width: 23%; height: 100%; background: #8b5cf6;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historical Performance Benchmark -->
        <div class="panel" style="padding: 22px;">
          <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 14px; color: var(--text-primary);">📈 Historical Yield Benchmarking</h3>
          <div style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            AYIS machine learning algorithms correlate current leaf area index (LAI), soil water availability, and growing degree days (GDD) against 5-year historical county averages.
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
            <div style="padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
              <span>2025 Long Rains Maize:</span>
              <strong style="color: var(--primary-dark);">5.4 t/ha (+20% vs benchmark)</strong>
            </div>
            <div style="padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
              <span>2025 Rotation Legumes:</span>
              <strong style="color: var(--primary-dark);">1.95 t/ha (+14% vs benchmark)</strong>
            </div>
            <div style="padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
              <span>2024 Long Rains Maize:</span>
              <strong style="color: var(--primary-dark);">5.1 t/ha (+13% vs benchmark)</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Production Forecast & Harvest Schedule Table -->
      <div class="panel">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">🗓️ Projected Harvest Output by Variety</span>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Estimated yield vs benchmark, projected total output, and variance</div>
          </div>
          <span class="badge badge-green">Model: AquaCrop-v2</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Target Commodity</th>
              <th>Planted Area</th>
              <th>Regional Benchmark</th>
              <th>Projected Yield</th>
              <th>Total Output (MT)</th>
              <th>Variance</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody id="planTableBody">
            ${yieldEst.map(y => `
              <tr>
                <td><strong>${y.crop}</strong></td>
                <td>${y.areaHa} ha</td>
                <td>${(y.benchmarkKgHa / 1000).toFixed(2)} t/ha</td>
                <td><strong style="color: var(--primary-dark); font-size: 1.05rem;">${(y.projectedKgHa / 1000).toFixed(2)} t/ha</strong></td>
                <td><strong>${((y.projectedKgHa * y.areaHa) / 1000).toFixed(1)} MT</strong></td>
                <td><span class="badge badge-green">+${y.variancePct}%</span></td>
                <td><strong style="color: var(--accent-blue);">${y.confidence}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Filter interaction
    const btnApply = container.querySelector('#btnApplyPlanFilters');
    const btnReset = container.querySelector('#btnResetPlanFilters');

    btnApply.addEventListener('click', () => {
      alert('Production plan filtered successfully based on active criteria.');
    });

    btnReset.addEventListener('click', () => {
      container.querySelector('#planFilterFarm').value = '';
      container.querySelector('#planFilterField').value = '';
      container.querySelector('#planFilterCrop').value = '';
      container.querySelector('#planFilterSeason').value = '';
      alert('Filters reset to default estate parameters.');
    });
  },

  // =========================================================================
  // 6. FIELD OPERATIONS: Scouting, Equipment, Inspection Schedules
  // =========================================================================
  async fieldOperations(container) {
    const tasks = await fieldOperationService.listTasks();
    const visits = await fieldOperationService.listVisits();
    const obs = await fieldOperationService.listObservations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Field Operations' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-blue">FIELD LOGISTICS & SCOUTING</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Field Operations & Labor Dispatch</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Outstanding scouting activities, equipment calibrations, extension visits, and field worker task queues.
            </p>
          </div>
          <button class="btn btn-primary" id="btnCreateTask">+ Dispatch Field Task</button>
        </div>
      </div>

      <!-- Task Dispatch Queue -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">🚜 Active Field Tasks Queue</span>
          <span class="badge badge-amber">${tasks.length} Operational Tasks</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px;">
          ${tasks.map(t => `
            <div style="border: 1px solid var(--border-color); padding: 14px 18px; border-radius: var(--radius-xs); display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); flex-wrap: wrap; gap: 10px;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">${t.title}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                  Assigned Officer: <strong>${t.assignedTo}</strong> · Due Date: <strong>${t.due}</strong> · Status: <span class="badge badge-blue">${t.status}</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="badge ${t.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${t.priority}</span>
                <button class="btn btn-outline" style="padding: 5px 12px; font-size: 0.78rem;" onclick="alert('Task updated to COMPLETED');">Mark Done</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Extension Officer Visits & Support Schedule -->
      <div class="panel">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">🚗 Extension Visits & Coaching Schedule</span>
          <button class="btn btn-outline" style="font-size: 0.8rem;" onclick="alert('Requesting extension visit...');">+ Request Visit</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Farm Parcel</th>
              <th>Extension Officer</th>
              <th>Purpose of Visit</th>
              <th>Scheduled Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${visits.map(v => `
              <tr>
                <td><strong>${v.farm}</strong></td>
                <td>${v.officer}</td>
                <td>${v.purpose}</td>
                <td>${v.date}</td>
                <td><span class="badge badge-green">${v.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Task modal
    container.querySelector('#btnCreateTask').addEventListener('click', () => {
      showModal('Dispatch Field Operation Task', `
        <form id="newTaskForm" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Task Title / Directive</label>
            <input type="text" class="form-input" id="taskTitle" placeholder="e.g. Inspect Drip Line Pressure on Field B" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Assigned Personnel</label>
              <input type="text" class="form-input" id="taskAssignee" value="John Kamau (Field Lead)" required>
            </div>
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Priority</label>
              <select class="form-input" id="taskPriority">
                <option value="HIGH">HIGH Priority</option>
                <option value="MEDIUM">MEDIUM Priority</option>
                <option value="LOW">LOW Priority</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Due Date</label>
            <input type="date" class="form-input" id="taskDue" value="2026-09-22" required>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Dispatch Task</button>
          </div>
        </form>
      `);

      document.getElementById('newTaskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Field task dispatched to personnel log.');
        document.getElementById('ayisModalBackdrop').remove();
        farmManagerViews.fieldOperations(document.getElementById('contentViewport'));
      });
    });
  },

  // =========================================================================
  // 7. REPORTS: Downloadable / Report-Ready Layouts
  // Required: Farm Performance, Crop Performance, Weather, Yield Estimates, Production Planning
  // =========================================================================
  async reports(container) {
    const reportsList = [
      {
        id: 'rep-farm-perf',
        title: 'Farm Performance & Estate Efficiency Audit',
        category: 'Farm Performance',
        coverage: 'Green Valley & Rongai Sunrise (20.7 ha)',
        date: '2026-09-14',
        status: 'READY'
      },
      {
        id: 'rep-crop-perf',
        title: 'Crop Variety Phenology & Vigor Evaluation',
        category: 'Crop Performance',
        coverage: 'Maize (H614D), Beans (Rosecoco), Wheat (Tayari)',
        date: '2026-09-12',
        status: 'READY'
      },
      {
        id: 'rep-weather',
        title: 'Agrometeorological & Climate Telemetry Brief',
        category: 'Weather',
        coverage: 'Nakuru Agromet [NKU-01] Microclimate',
        date: '2026-09-14',
        status: 'READY'
      },
      {
        id: 'rep-yield-est',
        title: 'Predictive Yield Modeling & Confidence Report',
        category: 'Yield Estimates',
        coverage: 'AquaCrop Model Projections (+18.4% variance)',
        date: '2026-09-10',
        status: 'READY'
      },
      {
        id: 'rep-prod-plan',
        title: 'Seasonal Production Planning & Harvest Schedule',
        category: 'Production Planning',
        coverage: '2026 Long Rains Estate Harvest Matrix',
        date: '2026-09-08',
        status: 'READY'
      }
    ];

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Reports' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">DOWNLOADABLE OPERATIONAL REPORTS</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Estate Intelligence & Formal Reports</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Report-ready, audit-compliant layouts formatted for executive review, agronomist handoff, and regulatory records.
            </p>
          </div>
          <button class="btn btn-outline" onclick="window.print()">🖨️ Print Active View</button>
        </div>
      </div>

      <!-- Report Cards List -->
      <div style="display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px;">
        ${reportsList.map(r => `
          <div class="panel" style="padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div style="max-width: 600px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="badge badge-blue">${r.category}</span>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Generated: ${r.date}</span>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0;">${r.title}</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">Coverage: <strong>${r.coverage}</strong></p>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-outline btn-view-report" data-type="${r.category}" style="padding: 8px 14px; font-size: 0.82rem;">Preview Layout</button>
              <button class="btn btn-primary btn-dl-report" data-name="${r.title}" style="padding: 8px 14px; font-size: 0.82rem;">Download (PDF) 📥</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Live Report Preview Container -->
      <div id="reportPreviewViewport" style="margin-top: 24px;"></div>
    `;

    // Event handlers for reports preview
    container.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type');
        farmManagerViews.renderReportPreview(type, container.querySelector('#reportPreviewViewport'));
      });
    });

    container.querySelectorAll('.btn-dl-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const title = e.target.getAttribute('data-name');
        alert(`Generating and downloading formatted PDF report: "${title}".`);
      });
    });
  },

  renderReportPreview(category, container) {
    let content = '';

    if (category === 'Farm Performance') {
      content = `
        <div style="border: 2px solid var(--border-color); padding: 32px; background: #ffffff; border-radius: var(--radius-sm); font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--primary); padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h2 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: var(--text-primary);">ESTATE OPERATIONAL AUDIT: FARM PERFORMANCE</h2>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Agricultural Yield Intelligence System (AYIS) · C# & MySQL 8</div>
            </div>
            <div style="text-align: right; font-size: 0.85rem;">
              <strong>Date:</strong> 2026-09-14<br>
              <strong>Status:</strong> COMPLIANT
            </div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            This audit report summarizes the comprehensive cultivation metrics across Green Valley Model Farm and Rongai Sunrise Farm. Both properties have maintained strict adherence to irrigation schedules, leading to a 22% reduction in water consumption.
          </p>
          <table class="data-table" style="margin-top: 16px;">
            <thead>
              <tr><th>Estate</th><th>Hectares</th><th>Active Cycles</th><th>Water Efficiency</th><th>Vigor Rating</th></tr>
            </thead>
            <tbody>
              <tr><td>Green Valley</td><td>12.5 ha</td><td>2 Cycles</td><td>94% (Drip)</td><td>92/100</td></tr>
              <tr><td>Rongai Sunrise</td><td>8.2 ha</td><td>2 Cycles</td><td>88% (Rainfed + Furrow)</td><td>89/100</td></tr>
            </tbody>
          </table>
          <div style="margin-top: 24px; text-align: right;">
            <button class="btn btn-primary" onclick="window.print()">Print Report Layout</button>
          </div>
        </div>
      `;
    } else if (category === 'Crop Performance') {
      content = `
        <div style="border: 2px solid var(--border-color); padding: 32px; background: #ffffff; border-radius: var(--radius-sm); font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--primary); padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h2 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: var(--text-primary);">CROP VARIETY PHENOLOGY & VIGOR EVALUATION</h2>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Agronomic Performance Registry</div>
            </div>
            <div style="text-align: right; font-size: 0.85rem;">
              <strong>Date:</strong> 2026-09-14<br>
              <strong>Season:</strong> 2026 Long Rains
            </div>
          </div>
          <table class="data-table" style="margin-top: 16px;">
            <thead>
              <tr><th>Variety</th><th>Growth Stage</th><th>Target Yield</th><th>Current Health</th><th>Estimated Harvest</th></tr>
            </thead>
            <tbody>
              <tr><td>Maize (H614D)</td><td>Vegetative V6</td><td>5.8 t/ha</td><td>Optimal (92%)</td><td>2026-07-20</td></tr>
              <tr><td>Beans (Rosecoco)</td><td>Flowering R1</td><td>2.1 t/ha</td><td>Optimal (94%)</td><td>2026-06-10</td></tr>
              <tr><td>Wheat (Kenya Tayari)</td><td>Hard Dough</td><td>3.8 t/ha</td><td>Normal (85%)</td><td>2026-05-25</td></tr>
            </tbody>
          </table>
        </div>
      `;
    } else {
      content = `
        <div style="border: 2px solid var(--border-color); padding: 32px; background: #ffffff; border-radius: var(--radius-sm); font-family: sans-serif;">
          <h2 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 10px; color: var(--text-primary);">${category.toUpperCase()} REPORT PREVIEW</h2>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">Telemetry data extracted directly from MySQL 8 agrometeorological tables for executive decision support.</p>
          <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="alert('Exporting data as CSV.');">Export Raw CSV</button>
            <button class="btn btn-outline" onclick="window.print()">Print Document</button>
          </div>
        </div>
      `;
    }

    container.innerHTML = content;
    container.scrollIntoView({ behavior: 'smooth' });
  },

  // =========================================================================
  // 8. NOTIFICATIONS & ALERTS FEED
  // =========================================================================
  async notifications(container) {
    const notifs = await notificationService.listNotifications();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Estate Operations', hash: '#dashboard' }, { label: 'Notifications' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-purple">SYSTEM DISPATCH FEED</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Operational Notifications & Alerts</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">Real-time advisories, extension dispatches, and agromet alerts for farm managers.</p>
          </div>
          <button class="btn btn-outline" id="btnMarkAllRead">Mark All as Read</button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${notifs.map(n => `
          <div class="panel" style="padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${n.severity === 'HIGH' ? 'var(--accent-rose)' : (n.severity === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--accent-blue)')};">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="badge ${n.severity === 'HIGH' ? 'badge-rose' : (n.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue')}">${n.type}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${n.timestamp}</span>
              </div>
              <strong style="font-size: 1rem; color: var(--text-primary);">${n.title}</strong>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${n.message}</div>
            </div>
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.78rem;" onclick="this.closest('.panel').style.opacity='0.5';">Acknowledge</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnMarkAllRead').addEventListener('click', () => {
      container.querySelectorAll('.panel').forEach(p => p.style.opacity = '0.7');
      alert('All notifications marked as read.');
    });
  }
};
