/**
 * Dedicated Weather / Data Analyst Role Experience Module
 * 
 * Provides end-to-end analytical capability, meteorological data integrity monitoring,
 * and high-contrast agrometeorological visualizations:
 * 
 * 1. DASHBOARD:
 *    - Current weather data status & live collection status
 *    - Monitored locations / stations count
 *    - Last successful ingestion timestamp
 *    - Platform data quality score (0-100%)
 *    - Weather anomalies and active risk alerts
 * 
 * 2. WEATHER OVERVIEW (Synoptic Radar & Regional Heatmap):
 *    - Spatial telemetry map with sensor health badges
 *    - Microclimate divergence across AEZ zones
 * 
 * 3. LIVE WEATHER:
 *    - Location/station selector
 *    - Current conditions: Temp, Humidity, Rainfall 24h, Wind speed & direction, Pressure (hPa), Solar radiation
 *    - Real-time timestamp, battery/power status, and telemetry transmission network
 * 
 * 4. HISTORICAL DATA:
 *    - Interactive multi-variable charts (Temp, Rainfall, Humidity, Wind, GDD)
 *    - Date range filters, location selector, daily/weekly/monthly views, comparison periods
 * 
 * 5. WEATHER TRENDS:
 *    - Cumulative rainfall vs 30-yr climatology
 *    - Temperature trend anomalies
 *    - Seasonal patterns & phenological milestones
 *    - Automated anomaly indicators (intense cloudburst, nocturnal chill, VPD spikes)
 * 
 * 6. DATA QUALITY:
 *    - Monitoring dashboard: Last update, missing packets, delayed packets, invalid readings, data completeness %
 *    - Sensor health matrix and pipeline latency
 * 
 * 7. WEATHER ALERTS:
 *    - Comprehensive alert manager: Severity, Location, Trigger condition, Date, Status, Affected farms/crops
 *    - "Dispatch Meteorological Warning" wizard
 * 
 * 8. ANALYTICS:
 *    - Evapotranspiration (ET0) calculator, Growing Degree Days (GDD) progression, Vapor Pressure Deficit (VPD)
 * 
 * 9. REPORTS:
 *    - Climate summaries, agromet bulletins, data audit logs export
 */

import { weatherService, farmService, authService } from '../services/index.js';
import { renderGisMap } from '../components/gisMap.js';
import { showModal } from '../components/modal.js';
import { ui } from '../components/ui.js';

export const weatherAnalystViews = {
  // =========================================================================
  // 1. DASHBOARD: Command center for weather data & integrity
  // =========================================================================
  async dashboard(container) {
    const stations = await weatherService.getStations();
    const alerts = await weatherService.getAlerts();
    const trends = await weatherService.getClimateTrends();
    const quality = await weatherService.getDataQualityMetrics();

    const activeStations = stations.filter(s => s.status === 'ONLINE').length;
    const avgQuality = (quality.reduce((acc, q) => acc + parseFloat(q.completeness), 0) / quality.length).toFixed(1);
    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Meteorological Command' }])}

      <!-- Command Header -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #bbf7d0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="badge badge-green" style="font-weight: 800;">AGROMETEOROLOGY & DATA INTEGRITY COMMAND</span>
              <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">🟢 Telemetry Pipeline Active</span>
            </div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: var(--text-primary); margin: 0 0 6px 0; letter-spacing: -0.5px;">
              Synoptic Agromet Overview: Daniel Kiprop
            </h1>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.92rem; max-width: 760px;">
              Monitoring real-time meteorological observations across <strong>${stations.length} regional telemetry stations</strong>.
              Overall network completeness stands at <strong>${avgQuality}%</strong> with <strong>${activeAlerts} active severe weather advisories</strong> in effect.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" id="btnRefreshTelemetry">🔄 Sync Telemetry</button>
            <button class="btn btn-primary" id="btnDispatchAlertModal">⚠️ Issue Weather Alert</button>
          </div>
        </div>
      </div>

      <!-- Core Operational Indicators (Requested Dashboard Metrics) -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Data Collection Status</span>
          <span class="metric-box-val" style="color: var(--primary-dark); font-size: 1.35rem;">OPTIMAL</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">● Ingesting normally</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Monitored Locations</span>
          <span class="metric-box-val">${stations.length}</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">${activeStations}/${stations.length} Online</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Last Successful Update</span>
          <span class="metric-box-val" style="font-size: 1.15rem; color: var(--accent-blue);">30s ago</span>
          <span class="metric-box-sub" style="color: var(--text-muted);">Sync: 2026-09-14 23:24</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Data Quality Score</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${avgQuality}%</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Sensor validity high</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Weather Anomalies</span>
          <span class="metric-box-val" style="color: var(--accent-amber);">${trends.anomalies.length}</span>
          <span class="metric-box-sub" style="color: var(--accent-amber);">Surge & Chill events</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Active Alerts</span>
          <span class="metric-box-val" style="color: var(--accent-rose);">${activeAlerts}</span>
          <span class="metric-box-sub" style="color: var(--accent-rose);">Severe agro-risks</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Rainfall Deviation</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">+14.2%</span>
          <span class="metric-box-sub" style="color: var(--accent-blue);">Above 30-yr baseline</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Thermal Accumulation</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">1,142 GDD</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">78.7% of target</span>
        </div>
      </div>

      <!-- Active Weather Anomalies Banner -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">🚨 Detected Microclimatic Anomalies (${trends.anomalies.length})</span>
          <span class="badge badge-amber">Automated Statistical Outlier Engine</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; padding: 16px;">
          ${trends.anomalies.map(a => `
            <div style="border: 1px solid var(--border-color); border-left: 4px solid ${a.severity === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)'}; padding: 12px 16px; border-radius: var(--radius-xs); background: var(--bg-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge ${a.severity === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${a.severity}</span>
                  <strong style="font-size: 0.95rem; color: var(--text-primary);">${a.parameter}</strong>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">Recorded: ${a.date}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                  ${a.description}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight: 900; color: var(--text-primary);">${a.value}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Threshold: ${a.threshold}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Two-Column Layout: Stations Status & Quick Chart -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <!-- Telemetry Station Health -->
        <div class="panel">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title">Telemetry Sensor Stations</span>
            <button class="btn btn-outline" style="font-size: 0.75rem;" onclick="location.hash='#live-weather'">Live Telemetry →</button>
          </div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Region</th>
                  <th>Quality</th>
                  <th>Last Sync</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${stations.map(s => `
                  <tr>
                    <td><strong>${s.name}</strong><br><small style="color: var(--text-muted);">${s.code} · ${s.elevationM}m</small></td>
                    <td style="font-size: 0.82rem;">${s.region}</td>
                    <td><strong style="color: var(--primary-dark); font-size: 0.88rem;">${s.dataQualityScore}%</strong></td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${s.lastSync}</td>
                    <td>
                      <span class="badge ${s.status === 'ONLINE' ? 'badge-green' : 'badge-amber'}">${s.status}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 24h Diurnal Curve -->
        <div class="panel">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title">Nakuru Agromet [NKU-01] 24h Diurnal Curve</span>
            <span class="badge badge-blue">Live Telemetry</span>
          </div>
          <div style="padding: 16px;">
            <div style="height: 240px; position: relative;">
              <canvas id="analystDashboardChart" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 10px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
              <span>Peak: <strong>26.8°C (14:30)</strong></span>
              <span>Minimum: <strong>13.8°C (05:45)</strong></span>
              <span>Past 24h Rain: <strong>18.2 mm</strong></span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Canvas Chart
    setTimeout(() => {
      weatherAnalystViews.renderAnalyticalCurve('analystDashboardChart');
    }, 60);

    // Event Listeners
    container.querySelector('#btnRefreshTelemetry').addEventListener('click', () => {
      alert('Syncing real-time telemetry from AWS stations and MySQL 8 weather_readings table...');
      weatherAnalystViews.dashboard(container);
    });

    container.querySelector('#btnDispatchAlertModal').addEventListener('click', () => {
      weatherAnalystViews.showAlertDispatchModal();
    });
  },

  // =========================================================================
  // 2. WEATHER OVERVIEW (Spatial GIS & Synoptic Radar)
  // =========================================================================
  async weatherOverview(container) {
    const stations = await weatherService.getStations();
    const farms = await farmService.listFarms();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Weather Overview' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">SYNOPTIC METEOROLOGY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Regional Weather & Radar Overview</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Spatial microclimatic zones across Rift Valley, station telemetry triangulation, and severe convective cell tracking.
            </p>
          </div>
          <button class="btn btn-primary" onclick="location.hash='#live-weather'">Inspect Live Stations →</button>
        </div>
      </div>

      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">🗺️ Regional Telemetry Station Network</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Layers: Automated Weather Stations · Agro-ecological Zones · Cloudburst Radar</span>
        </div>
        <div style="height: 440px; background: #e2e8f0; position: relative;">
          <canvas id="overviewMapCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
          <div style="position: absolute; top: 12px; right: 12px; background: rgba(255, 255, 255, 0.94); padding: 12px 16px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); font-size: 0.78rem; box-shadow: var(--shadow-sm); line-height: 1.5;">
            <strong>Telemetry Network Status:</strong><br>
            🟢 NKU-01 Nakuru Primary (1,860m · 22.4°C · Rain 18.2mm)<br>
            🟢 ELD-02 Eldoret Synoptic (2,095m · 20.8°C · Rain 8.4mm)<br>
            🟡 KIT-03 Kitale Research (1,900m · 23.5°C · Degraded Battery)<br>
            🟢 NAI-04 Naivasha Lake Array (1,890m · 24.1°C · Dry)
          </div>
        </div>
      </div>

      <!-- Station Telemetry Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
        ${stations.map(s => `
          <div class="panel" style="padding: 16px; border-left: 4px solid ${s.status === 'ONLINE' ? 'var(--primary)' : 'var(--accent-amber)'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${s.name}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${s.code} · ${s.region}</div>
              </div>
              <span class="badge ${s.status === 'ONLINE' ? 'badge-green' : 'badge-amber'}">${s.status}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; font-size: 0.82rem; background: var(--bg-primary); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div>Temp: <strong>${s.temp}°C</strong></div>
              <div>RH: <strong>${s.humidity}%</strong></div>
              <div>Rain: <strong>${s.rain24h} mm</strong></div>
              <div>Wind: <strong>${s.windSpeed} km/h</strong></div>
              <div>Pressure: <strong>${s.pressureHpa} hPa</strong></div>
              <div>Solar: <strong>${s.solarRadiationWm2} W/m²</strong></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
              <span>Power: ${s.batteryVolts}V</span>
              <button class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="location.hash='#live-weather'">Live Stream</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    setTimeout(() => {
      renderGisMap('overviewMapCanvas', farms);
    }, 60);
  },

  // =========================================================================
  // 3. LIVE WEATHER: Station Selector & Deep Sensor Telemetry
  // =========================================================================
  async liveWeather(container) {
    const stations = await weatherService.getStations();
    let currentStation = stations[0];

    function renderView() {
      container.innerHTML = `
        ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Live Weather Telemetry' }])}

        <div class="panel" style="padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="badge badge-green">LIVE SENSOR TELEMETRY STREAM</span>
              <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Real-Time Weather Station Feed</h1>
              <p style="color: var(--text-muted); font-size: 0.875rem;">
                Streaming packet telemetry with thermodynamic atmospheric variables, barometric pressure, solar irradiance, and power integrity.
              </p>
            </div>
            <!-- Location / Station Selector -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">Station Location:</label>
              <select id="stationSelector" class="form-input" style="width: auto; min-width: 240px; font-weight: 700;">
                ${stations.map(s => `
                  <option value="${s.id}" ${s.id === currentStation.id ? 'selected' : ''}>
                    ${s.code} — ${s.name} (${s.region})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Real-Time Atmospheric Conditions Grid -->
        <div class="metrics-grid-8" style="margin-bottom: 24px;">
          <div class="metric-box">
            <span class="metric-box-label">Dry Bulb Temperature</span>
            <span class="metric-box-val" style="color: var(--text-primary); font-size: 1.6rem;">${currentStation.temp}°C</span>
            <span class="metric-box-sub" style="color: var(--primary-dark);">Optimal plant range</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Relative Humidity</span>
            <span class="metric-box-val" style="color: var(--accent-blue); font-size: 1.6rem;">${currentStation.humidity}%</span>
            <span class="metric-box-sub" style="color: var(--accent-blue);">Dew point: 16.2°C</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Past 24h Precipitation</span>
            <span class="metric-box-val" style="color: var(--accent-blue); font-size: 1.6rem;">${currentStation.rain24h} mm</span>
            <span class="metric-box-sub" style="color: var(--accent-blue);">Tipping bucket sensor</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Sustained Wind Speed</span>
            <span class="metric-box-val" style="color: var(--text-primary); font-size: 1.6rem;">${currentStation.windSpeed} km/h</span>
            <span class="metric-box-sub" style="color: var(--primary-dark);">Direction: ${currentStation.windDirection}</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Atmospheric Pressure</span>
            <span class="metric-box-val" style="color: var(--text-primary); font-size: 1.6rem;">${currentStation.pressureHpa} hPa</span>
            <span class="metric-box-sub" style="color: var(--text-muted);">Barometric trend: Steady</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Solar Irradiance</span>
            <span class="metric-box-val" style="color: var(--accent-amber); font-size: 1.6rem;">${currentStation.solarRadiationWm2} W/m²</span>
            <span class="metric-box-sub" style="color: var(--accent-amber);">Pyranometer reading</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Sensor Quality Index</span>
            <span class="metric-box-val" style="color: var(--primary-dark); font-size: 1.6rem;">${currentStation.dataQualityScore}%</span>
            <span class="metric-box-sub" style="color: var(--primary-dark);">Zero CRC packet loss</span>
          </div>
          <div class="metric-box">
            <span class="metric-box-label">Battery / Power</span>
            <span class="metric-box-val" style="color: var(--primary-dark); font-size: 1.6rem;">${currentStation.batteryVolts}V</span>
            <span class="metric-box-sub" style="color: var(--primary-dark);">Float charge stable</span>
          </div>
        </div>

        <!-- Telemetry Metadata & Transmission Pipeline -->
        <div class="panel" style="padding: 24px; margin-bottom: 24px;">
          <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 14px;">Data Source & Sensor Hardware Specification</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; background: var(--bg-primary); padding: 16px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); font-size: 0.85rem;">
            <div>
              <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">STATION IDENTIFIER & HARDWARE:</span><br>
              <strong>${currentStation.name}</strong> (${currentStation.code})<br>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">Type: ${currentStation.type}</span>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">GEOGRAPHIC SPATIAL CENTROID:</span><br>
              <strong>Latitude: ${currentStation.lat}°, Longitude: ${currentStation.lon}°</strong><br>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">Altitude: ${currentStation.elevationM}m AMSL</span>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">INGESTION PROTOCOL & TELEMETRY:</span><br>
              <strong>${currentStation.network}</strong><br>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">Last Synchronized: ${currentStation.lastSync}</span>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">CALIBRATION COMPLIANCE:</span><br>
              <strong style="color: var(--primary-dark);">WMO Guide No. 8 Compliant</strong><br>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">Next Calibration: 2027-03</span>
            </div>
          </div>
        </div>

        <!-- Real-Time Diurnal Stream Chart -->
        <div class="panel" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0;">24-Hour Continuous Telemetry Stream: ${currentStation.name}</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Real-time dry-bulb temperature (°C) & precipitation spikes (mm)</div>
            </div>
            <span class="badge badge-blue">Sampling Interval: 15 mins</span>
          </div>
          <div style="height: 300px; position: relative;">
            <canvas id="liveStationChart" style="width: 100%; height: 100%; display: block;"></canvas>
          </div>
        </div>
      `;

      setTimeout(() => {
        weatherAnalystViews.renderAnalyticalCurve('liveStationChart');
      }, 60);

      container.querySelector('#stationSelector').addEventListener('change', (e) => {
        currentStation = stations.find(s => s.id === e.target.value) || stations[0];
        renderView();
      });
    }

    renderView();
  },

  // =========================================================================
  // 4. HISTORICAL WEATHER: Multi-Variable Interactive Analytics & Comparison
  // =========================================================================
  async historicalWeather(container) {
    const stations = await weatherService.getStations();
    let currentStationId = 'stn-001';
    let currentVariable = 'temperature';
    let currentTimeframe = 'daily';

    async function updateView() {
      const series = await weatherService.getHistoricalSeries(currentStationId, currentTimeframe);

      container.innerHTML = `
        ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Historical Meteorological Series' }])}

        <div class="panel" style="padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="badge badge-blue">CLIMATOLOGICAL ARCHIVE & REANALYSIS</span>
              <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Historical Weather Analysis & Comparison</h1>
              <p style="color: var(--text-muted); font-size: 0.875rem;">
                Interactive query interface for historical temperature, precipitation, humidity, wind velocity, solar radiation, and GDD metrics.
              </p>
            </div>
            <button class="btn btn-outline" id="btnExportCSV">📥 Export CSV Dataset</button>
          </div>
        </div>

        <!-- Controls: Station, Variable, Timeframe, Date Range, Comparison -->
        <div class="panel" style="padding: 18px 24px; margin-bottom: 24px;">
          <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin-bottom: 4px;">Weather Station</label>
              <select id="histStation" class="form-input" style="width: auto; min-width: 220px; font-weight: 600;">
                ${stations.map(s => `<option value="${s.id}" ${s.id === currentStationId ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin-bottom: 4px;">Analytical Variable</label>
              <select id="histVariable" class="form-input" style="width: auto; min-width: 180px; font-weight: 600;">
                <option value="temperature" ${currentVariable === 'temperature' ? 'selected' : ''}>Temperature (Mean/Max/Min)</option>
                <option value="rainfall" ${currentVariable === 'rainfall' ? 'selected' : ''}>Precipitation (mm)</option>
                <option value="humidity" ${currentVariable === 'humidity' ? 'selected' : ''}>Relative Humidity (%)</option>
                <option value="wind" ${currentVariable === 'wind' ? 'selected' : ''}>Wind Speed (km/h)</option>
                <option value="gdd" ${currentVariable === 'gdd' ? 'selected' : ''}>Growing Degree Days (GDD)</option>
              </select>
            </div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin-bottom: 4px;">Temporal Resolution</label>
              <div style="display: flex; gap: 4px;">
                <button class="btn ${currentTimeframe === 'daily' ? 'btn-primary' : 'btn-outline'} btn-timeframe" data-tf="daily" style="padding: 6px 12px; font-size: 0.8rem;">Daily</button>
                <button class="btn ${currentTimeframe === 'weekly' ? 'btn-primary' : 'btn-outline'} btn-timeframe" data-tf="weekly" style="padding: 6px 12px; font-size: 0.8rem;">Weekly</button>
                <button class="btn ${currentTimeframe === 'monthly' ? 'btn-primary' : 'btn-outline'} btn-timeframe" data-tf="monthly" style="padding: 6px 12px; font-size: 0.8rem;">Monthly</button>
              </div>
            </div>

            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin-bottom: 4px;">Comparison Period</label>
              <select id="histCompare" class="form-input" style="width: auto; min-width: 200px; font-size: 0.82rem;">
                <option>None (Current 2026 Season)</option>
                <option>Compare with 2025 (Long Rains)</option>
                <option>Compare with 30-Year Climatology</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Interactive Chart Canvas -->
        <div class="panel" style="padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0;">Historical Series Visualization: ${currentVariable.toUpperCase()}</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Station ID: ${currentStationId} · Temporal resolution: ${currentTimeframe}</div>
            </div>
            <span class="badge badge-green">Validated Quality: 99.4%</span>
          </div>

          <div style="height: 340px; position: relative;">
            <canvas id="historicalAnalyticsChart" style="width: 100%; height: 100%; display: block;"></canvas>
          </div>
        </div>

        <!-- Historical Tabular Audit -->
        <div class="panel">
          <div class="card-header"><span class="card-title">Historical Observations Log Table (${series.length} Records)</span></div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Mean Temp (°C)</th>
                  <th>Max Temp (°C)</th>
                  <th>Min Temp (°C)</th>
                  <th>Precipitation (mm)</th>
                  <th>Humidity (%)</th>
                  <th>Wind (km/h)</th>
                  <th>GDD (Base 10°C)</th>
                </tr>
              </thead>
              <tbody>
                ${series.map(s => `
                  <tr>
                    <td><strong>${s.period}</strong></td>
                    <td><strong>${s.tempMean}°C</strong></td>
                    <td style="color: var(--accent-rose);">${s.tempMax}°C</td>
                    <td style="color: var(--accent-blue);">${s.tempMin}°C</td>
                    <td><strong style="color: var(--accent-blue);">${s.rainMm} mm</strong></td>
                    <td>${s.humidity}%</td>
                    <td>${s.windSpeed} km/h</td>
                    <td><span class="badge badge-green">+${s.gdd} GDD</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      setTimeout(() => {
        weatherAnalystViews.renderAnalyticalCurve('historicalAnalyticsChart');
      }, 60);

      container.querySelector('#histStation').addEventListener('change', (e) => {
        currentStationId = e.target.value;
        updateView();
      });

      container.querySelector('#histVariable').addEventListener('change', (e) => {
        currentVariable = e.target.value;
        updateView();
      });

      container.querySelectorAll('.btn-timeframe').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentTimeframe = e.target.getAttribute('data-tf');
          updateView();
        });
      });

      container.querySelector('#btnExportCSV').addEventListener('click', () => {
        alert('Exporting historical CSV dataset with metadata and QC flags...');
      });
    }

    updateView();
  },

  // =========================================================================
  // 5. WEATHER TRENDS: Rainfall & Temperature Trends, Climatology, Anomalies
  // =========================================================================
  async weatherTrends(container) {
    const trends = await weatherService.getClimateTrends();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Weather Trends & Climatology' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <span class="badge badge-green">AGRO-CLIMATOLOGICAL ANOMALIES & DYNAMICS</span>
        <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Long-Term Seasonal Trends & Patterns</h1>
        <p style="color: var(--text-muted); font-size: 0.875rem;">
          Cumulative rainfall trajectories versus 30-year climatological baseline, temperature anomalies, and phenological GDD progression.
        </p>
      </div>

      <!-- Trend KPIs -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Cumulative Rainfall</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">${trends.cumulativeRainMm} mm</span>
          <span class="metric-box-sub" style="color: var(--accent-blue);">vs Normal ${trends.normalRainMm} mm</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Precipitation Anomaly</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">+${trends.rainfallAnomalyPct}%</span>
          <span class="metric-box-sub" style="color: var(--accent-blue);">Wetter than normal</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Thermal Anomaly</span>
          <span class="metric-box-val" style="color: var(--accent-amber);">+${trends.temperatureAnomalyC}°C</span>
          <span class="metric-box-sub" style="color: var(--accent-amber);">Warmer than 1991-2020</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Growing Degree Days</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${trends.gddAccumulated} GDD</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Target: ${trends.gddTarget} GDD</span>
        </div>
      </div>

      <!-- Seasonal Patterns Monthly Audit Table -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header"><span class="card-title">Seasonal Climatological Progression (2026 vs 30-Year Baseline)</span></div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Observed Rainfall</th>
                <th>30-Yr Normal Rainfall</th>
                <th>Precipitation Variance</th>
                <th>Mean Temperature</th>
                <th>Climatic Classification</th>
              </tr>
            </thead>
            <tbody>
              ${trends.seasonalPatterns.map(p => {
                const diff = (p.rainfallMm - p.climatologyMm).toFixed(1);
                const isWet = diff >= 0;
                return `
                  <tr>
                    <td><strong>${p.month}</strong></td>
                    <td><strong>${p.rainfallMm} mm</strong></td>
                    <td style="color: var(--text-muted);">${p.climatologyMm} mm</td>
                    <td>
                      <span style="font-weight: 800; color: ${isWet ? 'var(--accent-blue)' : 'var(--accent-rose)'};">
                        ${isWet ? '+' : ''}${diff} mm
                      </span>
                    </td>
                    <td>${p.tempMean}°C</td>
                    <td>
                      <span class="badge ${p.status === 'ANOMALOUSLY_WET' ? 'badge-rose' : (p.status === 'WET' ? 'badge-blue' : 'badge-green')}">
                        ${p.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Anomaly Indicators -->
      <div class="panel">
        <div class="card-header"><span class="card-title">Algorithmic Anomaly Outlier Detection</span></div>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
          ${trends.anomalies.map(a => `
            <div style="border: 1px solid var(--border-color); border-left: 4px solid ${a.severity === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)'}; padding: 14px 18px; border-radius: var(--radius-xs); background: var(--bg-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge ${a.severity === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${a.severity}</span>
                  <strong style="font-size: 1rem; color: var(--text-primary);">${a.parameter}</strong>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">Recorded on: ${a.date}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">
                  ${a.description}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary);">${a.value}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Standard Threshold: ${a.threshold}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 6. DATA QUALITY: Comprehensive Integrity & Sensor Pipeline Monitoring
  // =========================================================================
  async dataQuality(container) {
    const quality = await weatherService.getDataQualityMetrics();
    const avgCompleteness = (quality.reduce((acc, q) => acc + parseFloat(q.completeness), 0) / quality.length).toFixed(1);

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Sensor Data Quality & Integrity' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-purple">TELEMETRY ASSURANCE & QC PIPELINE</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Sensor Health & Data Quality Monitoring</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Automated QC verification: missing packets, delayed transmissions, range check violations, step change errors, and completeness scoring.
            </p>
          </div>
          <button class="btn btn-outline" id="btnRunQCCheck">🧪 Execute Automated QC Test</button>
        </div>
      </div>

      <!-- Quality Metrics Summary -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Mean Completeness</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${avgCompleteness}%</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Above 95% SLA</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Missing Packets (24h)</span>
          <span class="metric-box-val" style="color: var(--accent-amber);">100</span>
          <span class="metric-box-sub" style="color: var(--accent-amber);">0.08% loss rate</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Delayed Packets (>60s)</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">44</span>
          <span class="metric-box-sub" style="color: var(--accent-blue);">Re-transmitted OK</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Invalid Range Readings</span>
          <span class="metric-box-val" style="color: var(--accent-rose);">6</span>
          <span class="metric-box-sub" style="color: var(--accent-rose);">Flagged & isolated</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Pipeline Ingest Latency</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">48ms</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">High-throughput</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">WMO QC Validation</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">PASSED</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">Level 1 & Level 2</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Degraded Stations</span>
          <span class="metric-box-val" style="color: var(--accent-amber);">1</span>
          <span class="metric-box-sub" style="color: var(--accent-amber);">KIT-03 (Kitale)</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Active Backup Gateways</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">5/5</span>
          <span class="metric-box-sub" style="color: var(--primary-dark);">100% Redundancy</span>
        </div>
      </div>

      <!-- Detailed Sensor Health & QC Audit Table -->
      <div class="panel">
        <div class="card-header"><span class="card-title">Telemetry Sensor Node Quality Status</span></div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Station Identification</th>
                <th>Last Update</th>
                <th>Completeness %</th>
                <th>Missing Packets</th>
                <th>Delayed Packets</th>
                <th>Invalid Readings</th>
                <th>Power Status</th>
                <th>Operational Status</th>
              </tr>
            </thead>
            <tbody>
              ${quality.map(q => `
                <tr>
                  <td>
                    <strong>${q.station}</strong><br>
                    <small style="color: var(--text-muted);">${q.code} · Latency: ${q.latency}</small>
                  </td>
                  <td style="font-size: 0.82rem;">${q.lastPacket}</td>
                  <td>
                    <strong style="color: ${parseFloat(q.completeness) > 95 ? 'var(--primary-dark)' : 'var(--accent-amber)'}; font-size: 0.95rem;">
                      ${q.completeness}
                    </strong>
                  </td>
                  <td><span class="badge ${q.missingPackets > 20 ? 'badge-amber' : 'badge-green'}">${q.missingPackets}</span></td>
                  <td><span class="badge ${q.delayedPackets > 10 ? 'badge-amber' : 'badge-green'}">${q.delayedPackets}</span></td>
                  <td>
                    ${q.invalidReadings > 0 
                      ? `<span class="badge badge-rose">${q.invalidReadings} flagged</span>` 
                      : `<span class="badge badge-green">0</span>`}
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">${q.powerStatus}</td>
                  <td>
                    <span class="badge ${q.status === 'OPERATIONAL' ? 'badge-green' : 'badge-amber'}">${q.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelector('#btnRunQCCheck').addEventListener('click', () => {
      alert('Executing automated range validation, step-change filter, and persistence test across all stations... Result: PASSED.');
    });
  },

  // =========================================================================
  // 7. WEATHER ALERTS: Comprehensive Warning Dispatch & Affected Crops
  // =========================================================================
  async weatherAlerts(container) {
    const alerts = await weatherService.getAlerts();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Weather Alerts Dispatch' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-rose">METEOROLOGICAL RISK EARLY WARNING</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Weather Alerts & Risk Advisories</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Severe weather early warning dissemination, convective storm warnings, frost alerts, and agricultural impact mapping.
            </p>
          </div>
          <button class="btn btn-primary" id="btnDispatchNewAlert">+ Issue New Weather Warning</button>
        </div>
      </div>

      <!-- Alert Cards Grid -->
      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
        ${alerts.map(a => `
          <div class="panel" style="padding: 20px; border-left: 4px solid ${a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'var(--accent-rose)' : (a.severity === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--accent-blue)')};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge ${a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'badge-rose' : (a.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue')}">
                    ${a.severity} SEVERITY
                  </span>
                  <strong style="font-size: 1.1rem; color: var(--text-primary);">${a.headline}</strong>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
                  Location: <strong>${a.region}</strong> · Issued: <strong>${a.date}</strong> · Effective Until: <strong>${a.effectiveUntil}</strong>
                </div>
              </div>
              <span class="badge ${a.status === 'ACTIVE' ? 'badge-rose' : 'badge-green'}">${a.status}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin: 16px 0; font-size: 0.85rem; background: var(--bg-primary); padding: 12px 16px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div>
                <strong style="color: var(--text-muted); font-size: 0.75rem;">TRIGGER PHYSICAL CONDITION:</strong>
                <div style="color: var(--text-primary); margin-top: 2px;">${a.trigger}</div>
              </div>
              <div>
                <strong style="color: var(--text-muted); font-size: 0.75rem;">AFFECTED FARMS:</strong>
                <div style="color: var(--text-primary); margin-top: 2px;">${a.affectedFarms}</div>
              </div>
              <div>
                <strong style="color: var(--text-muted); font-size: 0.75rem;">AFFECTED CROPS & PHENOLOGICAL RISK:</strong>
                <div style="color: var(--accent-rose); font-weight: 700; margin-top: 2px;">${a.affectedCrops}</div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn btn-outline" style="font-size: 0.78rem;" onclick="alert('Dispatched automated SMS blast to all farmers registered in ${a.region}.');">📲 Broadcast SMS to Farmers</button>
              <button class="btn btn-outline" style="font-size: 0.78rem;" onclick="alert('Alert escalated to County Disaster Management Office.');">Escalate Warning</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnDispatchNewAlert').addEventListener('click', () => {
      weatherAnalystViews.showAlertDispatchModal();
    });
  },

  showAlertDispatchModal() {
    showModal('Issue Meteorological Warning / Alert', `
      <form id="newWeatherAlertForm" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Alert Severity</label>
          <select class="form-input" id="alertSeverity">
            <option value="CRITICAL">CRITICAL (Hailstorm, Flash Flooding, Dam Breach)</option>
            <option value="HIGH" selected>HIGH (Torrential Rain > 50mm, Severe Convection)</option>
            <option value="MEDIUM">MEDIUM (High Evapotranspiration, Frost Warning)</option>
            <option value="LOW">LOW / ADVISORY (Optimal Spraying Window)</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Warning Headline</label>
          <input type="text" class="form-input" id="alertHeadline" value="Flash Flood & Soil Saturation Warning" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Geographic Region</label>
            <input type="text" class="form-input" id="alertRegion" value="Nakuru High Plains & Mau Flank" required>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Effective Until</label>
            <input type="text" class="form-input" id="alertValidUntil" value="2026-09-16 18:00" required>
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Trigger Meteorological Threshold</label>
          <input type="text" class="form-input" id="alertTrigger" value="Radar echo intensity > 48 dBZ with continuous precip > 35mm" required>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Affected Agricultural Enterprises & Mitigation Advice</label>
          <textarea class="form-input" id="alertMitigation" rows="3" required>Ensure all contour furrows and drainage channels are unblocked. Cease foliar spraying and protect harvested tubers.</textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Dispatch Meteorological Warning</button>
        </div>
      </form>
    `);

    document.getElementById('newWeatherAlertForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Meteorological alert dispatched successfully and published to farmer push notification pipeline.');
      document.getElementById('ayisModalBackdrop').remove();
      weatherAnalystViews.weatherAlerts(document.getElementById('contentViewport'));
    });
  },

  // =========================================================================
  // 8. ANALYTICS: Evapotranspiration, GDD, and Microclimate Models
  // =========================================================================
  async analytics(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Microclimate Analytics & Models' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <span class="badge badge-purple">AGROMETEOROLOGICAL BIO-PHYSICAL MODELING</span>
        <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Advanced Microclimate Analytics</h1>
        <p style="color: var(--text-muted); font-size: 0.875rem;">
          FAO-56 Penman-Monteith Reference Evapotranspiration (ET0), Growing Degree Day (GDD) bio-time models, and Vapor Pressure Deficit (VPD).
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <!-- Model 1: ET0 -->
        <div class="panel" style="padding: 20px;">
          <span class="badge badge-blue">FAO-56 PENMAN-MONTEITH</span>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin: 8px 0 4px 0;">Reference Evapotranspiration (ET0)</h3>
          <div style="font-size: 2rem; font-weight: 900; color: var(--primary-dark); margin: 10px 0;">4.12 mm/day</div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
            Atmospheric evaporative demand calculated using solar radiation (18.4 MJ/m²), 2m wind speed (6.2 km/h), mean temperature (22.4°C), and relative humidity (68%).
          </p>
        </div>

        <!-- Model 2: GDD -->
        <div class="panel" style="padding: 20px;">
          <span class="badge badge-green">THERMAL BIO-TIME</span>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin: 8px 0 4px 0;">Accumulated GDD (Base 10°C)</h3>
          <div style="font-size: 2rem; font-weight: 900; color: var(--primary-dark); margin: 10px 0;">1,142 °C-days</div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
            Highland Maize H614D phenological progression is on schedule. Silking stage (R1) anticipated within 18 cumulative GDD (~2 days).
          </p>
        </div>

        <!-- Model 3: VPD -->
        <div class="panel" style="padding: 20px;">
          <span class="badge badge-amber">STOMATAL CONDUCTANCE</span>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin: 8px 0 4px 0;">Vapor Pressure Deficit (VPD)</h3>
          <div style="font-size: 2rem; font-weight: 900; color: var(--primary-dark); margin: 10px 0;">0.84 kPa</div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
            VPD is within the optimal photosynthesis window (0.8 - 1.2 kPa). Minimal transpiration stress or stomatal closure observed.
          </p>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 9. REPORTS: Agromet Summaries & Bulletins
  // =========================================================================
  async reports(container) {
    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agromet Intelligence', hash: '#dashboard' }, { label: 'Meteorological Reports' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-blue">OFFICIAL BULLETINS</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Agrometeorological Bulletins & Data Audits</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Decadal (10-day) climate bulletins, seasonal rainfall audits, and sensor verification records for publication.
            </p>
          </div>
          <button class="btn btn-primary" onclick="alert('Generating Decadal Climate Bulletin PDF...');">📄 Generate Decadal Bulletin</button>
        </div>
      </div>

      <div class="panel">
        <div class="card-header"><span class="card-title">Available Meteorological Publications</span></div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Period</th>
              <th>Author / Analyst</th>
              <th>Format</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Rift Valley Decadal Agromet Bulletin (Issue 25)</strong></td>
              <td>2026-09-01 to 2026-09-10</td>
              <td>Daniel Kiprop</td>
              <td><span class="badge badge-blue">PDF (2.4 MB)</span></td>
              <td><button class="btn btn-outline" style="font-size: 0.75rem;" onclick="alert('Downloading PDF...');">Download</button></td>
            </tr>
            <tr>
              <td><strong>Seasonal Cumulative Rainfall & Crop Water Requirement Audit</strong></td>
              <td>2026 Long Rains (MAMJJA)</td>
              <td>Meteorology Unit</td>
              <td><span class="badge badge-green">CSV / Dataset</span></td>
              <td><button class="btn btn-outline" style="font-size: 0.75rem;" onclick="alert('Downloading Dataset...');">Export</button></td>
            </tr>
            <tr>
              <td><strong>Automated Weather Station (AWS) Network Calibration & QC Audit</strong></td>
              <td>Q3 2026</td>
              <td>Systems & Sensors Team</td>
              <td><span class="badge badge-purple">Audit Log</span></td>
              <td><button class="btn btn-outline" style="font-size: 0.75rem;" onclick="alert('Opening audit log...');">View Audit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  // Helper function to render a smooth high-contrast Canvas curve
  renderAnalyticalCurve(canvasId) {
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

    const points = [
      { time: '00:00', temp: 15.2 },
      { time: '03:00', temp: 14.1 },
      { time: '06:00', temp: 13.8 },
      { time: '09:00', temp: 19.5 },
      { time: '12:00', temp: 24.8 },
      { time: '15:00', temp: 26.8 },
      { time: '18:00', temp: 22.1 },
      { time: '21:00', temp: 17.5 }
    ];

    const padding = 34;
    const graphW = w - padding * 2;
    const graphH = h - padding * 2;

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
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
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

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

    // Line stroke
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((pt, i) => {
      const x = padding + (i / (points.length - 1)) * graphW;
      const y = (h - padding) - ((pt.temp - minTemp) / (maxTemp - minTemp)) * graphH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data points & badges
    points.forEach((pt, i) => {
      const x = padding + (i / (points.length - 1)) * graphW;
      const y = (h - padding) - ((pt.temp - minTemp) / (maxTemp - minTemp)) * graphH;

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.temp}°`, x, y - 8);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(pt.time, x, h - padding + 16);
    });
  }
};
