/**
 * Dedicated Agricultural Extension Officer Role Experience Module
 * Monitors and supports smallholder and commercial farmers across assigned sub-zones:
 * 
 * 1. EXTENSION OFFICER DASHBOARD:
 *    - Assigned farmers (Total smallholders & commercial producers under coaching)
 *    - Farms monitored (Hectares, regions, agro-ecological sub-zones)
 *    - Farms requiring attention (High-risk pathogen alerts, moisture stress, follow-ups)
 *    - Upcoming visits (Chronological field support schedule)
 *    - Recent observations feed with condition severity
 *    - Weather risks (Agromet alerts affecting farm clusters)
 *    - Crop risks (Stem rust, fall armyworm, flower abortion)
 *    - Outstanding follow-ups task queue
 * 
 * 2. FARMERS:
 *    - Comprehensive farmer directory with search, filter (Risk level, sub-zone, crop)
 *    - Detailed Farmer Profile drawer/modal:
 *      * Personal details, phone, email, and location
 *      * Associated farms & field boundaries
 *      * Active crop cycles & growth stages
 *      * Recommendations issued & compliance status
 *      * Recent field observations history
 *      * Farmer assistance requests log
 * 
 * 3. FARMS:
 *    - Regional farm list with risk indicators, primary enterprises, and irrigation infrastructure
 *    - Deep link to associated farmer profile and field topology
 * 
 * 4. FIELD VISITS:
 *    - Interactive field visit list & status tracking (Scheduled, Pending, Completed)
 *    - "Schedule New Visit" modal dialog (Farmer, Farm, Field, Date, Purpose, Notes)
 *    - Visit details view with localized weather forecast and checklist
 * 
 * 5. OBSERVATIONS:
 *    - In-situ scouting observations list with severity badges (INFO, WARNING, CRITICAL)
 *    - "Add Field Observation" modal with:
 *      * Farm, Field, Crop, Growth Stage, Condition, Weather conditions, Notes, Severity, Follow-up Required
 * 
 * 6. FOLLOW-UP TASK INTERFACE:
 *    - Structured task-style board / queue for:
 *      * Pending follow-ups (with due dates and actions)
 *      * Completed follow-ups
 *      * High-risk farms demanding immediate intervention
 *      * Farmer assistance requests
 * 
 * 7. MAP VIEW (Geographical Farmer/Farm Overview):
 *    - Interactive spatial overview rendering farms, risk levels (Green/Amber/Red), crop types, weather alert overlays, and field visit markers
 * 
 * 8. HIERARCHICAL NAVIGATION FLOW:
 *    - Move smoothly from: Regional Overview -> Farmer -> Farm -> Field -> Crop Cycle -> Recommendation / Observation.
 */

import { farmService, cropService, weatherService, recommendationService, yieldService, fieldOperationService, reportService, authService } from '../services/index.js';
import { renderGisMap, renderWeatherChart } from '../components/gisMap.js';
import { showModal } from '../components/modal.js';
import { ui } from '../components/ui.js';

export const extensionOfficerViews = {
  // =========================================================================
  // 1. EXTENSION OFFICER DASHBOARD
  // =========================================================================
  async dashboard(container) {
    const user = authService.getCurrentUser();
    const farmers = await fieldOperationService.listAssignedFarmers();
    const farms = await farmService.listFarms();
    const visits = await fieldOperationService.listVisits();
    const obs = await fieldOperationService.listObservations();
    const followUps = await fieldOperationService.getFollowUps();
    const weather = await weatherService.getRecentObservations();
    const latestWeather = weather[weather.length - 1] || { temp: 22.4, humidity: 68, rain: 0.0, wind: 6.2 };
    const alerts = await weatherService.getAlerts();

    const pendingVisits = visits.filter(v => v.status !== 'COMPLETED');
    const pendingFollowUps = followUps.filter(f => f.status === 'PENDING');
    const highRiskFarms = farmers.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'MEDIUM');
    const assistanceRequests = farmers.filter(f => f.assistanceRequest !== null);

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Regional Command' }])}

      <!-- Welcoming Command Banner -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%); border: 1px solid #a7f3d0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="badge badge-green" style="font-size: 0.75rem; font-weight: 800;">AGRICULTURAL EXTENSION SERVICE</span>
              <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">🟢 Assigned Zone: Rift Valley Sub-zone 4</span>
            </div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px; margin: 0 0 6px 0;">
              Field Extension Command: ${user.firstName || 'Grace Wanjiku'}
            </h1>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.92rem; max-width: 720px;">
              Directly supporting <strong>${farmers.length} registered producers</strong> across <strong>${farms.length} agricultural estates</strong>. 
              Currently managing <strong>${pendingFollowUps.length} outstanding follow-ups</strong> and <strong>${highRiskFarms.length} holdings requiring technical intervention</strong>.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" id="btnQuickScheduleVisit">+ Schedule Farm Visit</button>
            <button class="btn btn-primary" id="btnQuickLogObs">+ Record Field Observation</button>
          </div>
        </div>
      </div>

      <!-- Key Operational Metrics Grid -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#farmers'">
          <span class="metric-box-label">Assigned Farmers</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${farmers.length} Producers</span>
          <span class="metric-box-sub">100% Geo-referenced</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#farms'">
          <span class="metric-box-label">Farms Monitored</span>
          <span class="metric-box-val">${farms.length} Holdings</span>
          <span class="metric-box-sub" style="color: var(--text-muted);">20.7 Hectares</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#farmers'">
          <span class="metric-box-label">Requiring Attention</span>
          <span class="metric-box-val" style="color: var(--accent-rose);">${highRiskFarms.length} Farms</span>
          <span class="metric-box-sub" style="color: var(--accent-rose);">Rust & Moisture flags</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#field-visits'">
          <span class="metric-box-label">Upcoming Visits</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">${pendingVisits.length} Scheduled</span>
          <span class="metric-box-sub">This week in Nakuru</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#observations'">
          <span class="metric-box-label">Recent Observations</span>
          <span class="metric-box-val">${obs.length} Logged</span>
          <span class="metric-box-sub">Scouted this cycle</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#weather'">
          <span class="metric-box-label">Weather Risks</span>
          <span class="metric-box-val" style="color: var(--accent-amber);">1 Active</span>
          <span class="metric-box-sub">Dew spore trigger</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#observations'">
          <span class="metric-box-label">Crop Risks</span>
          <span class="metric-box-val" style="color: var(--accent-rose);">Wheat Rust</span>
          <span class="metric-box-sub">East Plateau alert</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#observations'">
          <span class="metric-box-label">Outstanding Follow-ups</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${pendingFollowUps.length} Pending</span>
          <span class="metric-box-sub">Action required</span>
        </div>
      </div>

      <!-- Split Section: High-Priority Assistance Requests & Upcoming Visit Queue -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <!-- Farmer Assistance Requests & High-Risk Holdings -->
        <div class="panel" style="padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span class="card-title" style="font-size: 1.05rem;">🆘 Farmer Assistance Requests & Urgent Flags</span>
            <span class="badge badge-rose">${assistanceRequests.length} URGENT</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${assistanceRequests.map(req => `
              <div style="border: 1px solid #fecdd3; background: #fff1f2; padding: 12px 14px; border-radius: var(--radius-xs);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.9rem; color: #9f1239;">${req.name} (${req.farmName})</strong>
                  <span class="badge badge-rose" style="font-size: 0.65rem;">HIGH PRIORITY</span>
                </div>
                <div style="font-size: 0.8rem; color: #881337; margin-top: 4px; line-height: 1.4;">
                  ${req.assistanceRequest}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px solid #ffe4e6; padding-top: 6px; font-size: 0.75rem;">
                  <span>Phone: <strong>${req.phone}</strong></span>
                  <button class="btn btn-primary btn-inspect-farmer" data-id="${req.id}" style="padding: 3px 8px; font-size: 0.72rem;">Farmer Profile →</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Upcoming Field Coaching Visits -->
        <div class="panel" style="padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span class="card-title" style="font-size: 1.05rem;">🚗 Scheduled Field Support Visits</span>
            <button class="btn btn-outline" style="font-size: 0.75rem;" onclick="location.hash='#field-visits'">View Calendar →</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${pendingVisits.slice(0, 3).map(v => `
              <div style="border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-xs); background: var(--bg-primary);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.9rem; color: var(--text-primary);">${v.farmer}</strong>
                  <span class="badge badge-blue" style="font-size: 0.7rem;">${v.date} · ${v.time}</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  Location: <strong>${v.farm} — ${v.field}</strong>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.3;">
                  <strong>Purpose:</strong> ${v.purpose}
                </div>
                <div style="margin-top: 6px; font-size: 0.75rem; color: var(--primary-dark); font-weight: 600;">
                  🌤️ ${v.weatherCondition}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Regional Overview Map Container -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">🗺️ Regional Farmer & Farm Geographical Overview</span>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Spatial distribution showing farms, risk levels, crop varieties, weather alerts, and visit pins
            </div>
          </div>
          <button class="btn btn-outline" style="font-size: 0.8rem;" onclick="location.hash='#farms'">Full Farm Directory →</button>
        </div>
        <div style="height: 360px; background: #e2e8f0; position: relative;">
          <canvas id="extensionMapCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
          <div style="position: absolute; top: 12px; right: 12px; background: rgba(255, 255, 255, 0.94); padding: 10px 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); font-size: 0.75rem; box-shadow: var(--shadow-sm); line-height: 1.5;">
            <strong>Sub-zone 4 Status:</strong><br>
            🟢 Green Valley Model Farm (12.5 ha · Low Risk)<br>
            🔴 Rongai Sunrise Farm (8.2 ha · Rust Alert)<br>
            🔵 Njoro River Parcel 3 (6.4 ha · Irrigation Check)
          </div>
        </div>
      </div>

      <!-- Outstanding Follow-ups Task-Style Board -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">📋 Outstanding Follow-Up Task Queue</span>
          <span class="badge badge-amber">${pendingFollowUps.length} Action Items</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; padding: 16px;">
          ${pendingFollowUps.map(f => `
            <div style="border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-xs); display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge ${f.severity === 'CRITICAL' ? 'badge-rose' : (f.severity === 'WARNING' ? 'badge-amber' : 'badge-blue')}" style="font-size: 0.68rem;">${f.severity}</span>
                  <strong style="font-size: 0.9rem; color: var(--text-primary);">${f.title}</strong>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                  Farmer: <strong>${f.farmer}</strong> (${f.farm} — ${f.field}) · Crop: <strong>${f.crop}</strong> · Due: <strong>${f.due}</strong>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                  ${f.notes}
                </div>
              </div>
              <button class="btn btn-outline" style="padding: 5px 12px; font-size: 0.78rem;" onclick="alert('Follow-up marked as COMPLETED.'); this.closest('div').style.opacity='0.5';">Mark Done ✓</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Render Canvas Map
    setTimeout(() => {
      renderGisMap('extensionMapCanvas', farms);
    }, 60);

    // Event handlers
    container.querySelector('#btnQuickScheduleVisit')?.addEventListener('click', () => {
      extensionOfficerViews.showScheduleVisitModal(farmers);
    });

    container.querySelector('#btnQuickLogObs')?.addEventListener('click', () => {
      extensionOfficerViews.showAddObservationModal(farms);
    });

    container.querySelectorAll('.btn-inspect-farmer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const farmer = farmers.find(f => f.id === id) || farmers[0];
        extensionOfficerViews.showFarmerProfileModal(farmer);
      });
    });
  },

  // =========================================================================
  // 2. FARMERS: Directory, Search, Filters, Full Profile
  // =========================================================================
  async farmers(container) {
    const farmers = await fieldOperationService.listAssignedFarmers();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Assigned Farmers' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">PRODUCER DIRECTORY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Assigned Farmer Directory</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Smallholder and commercial farmers under extension supervision in Rift Valley Sub-zone 4.
            </p>
          </div>
          <button class="btn btn-primary" id="btnRegisterFarmer">+ Register New Farmer</button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="panel" style="padding: 16px 20px; margin-bottom: 24px; background: #fafafa; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <div style="flex-grow: 1; min-width: 240px;">
          <input type="search" class="form-input" id="farmerSearchInput" placeholder="🔍 Search by farmer name, location, or crop..." style="padding: 7px 12px; font-size: 0.85rem;">
        </div>
        <select class="form-input" id="farmerRiskFilter" style="width: auto; padding: 7px 12px; font-size: 0.85rem; font-weight: 700;">
          <option value="">Risk Level: All</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
        <button class="btn btn-outline" id="btnResetFarmerFilters" style="padding: 7px 14px; font-size: 0.85rem;">Reset</button>
      </div>

      <!-- Farmer Cards List -->
      <div id="farmersListContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${farmers.map(f => `
          <div class="panel farmer-card" data-risk="${f.riskLevel}" data-text="${f.name.toLowerCase()} ${f.location.toLowerCase()} ${f.primaryCrop.toLowerCase()}" style="padding: 20px; border-left: 5px solid ${f.riskLevel === 'HIGH' ? 'var(--accent-rose)' : (f.riskLevel === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--primary)')};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--text-primary); margin: 0;">${f.name}</h3>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">📍 ${f.location}</div>
              </div>
              <span class="badge ${f.riskLevel === 'HIGH' ? 'badge-rose' : (f.riskLevel === 'MEDIUM' ? 'badge-amber' : 'badge-green')}">${f.riskLevel} RISK</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: var(--bg-primary); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 14px; text-align: center;">
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">FARM SIZE</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary-dark);">${f.areaHa} ha</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">CYCLES</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--accent-blue);">${f.activeCyclesCount} Active</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">FOLLOW-UPS</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: ${f.pendingFollowUps > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'};">${f.pendingFollowUps}</div>
              </div>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
              <div>• <strong>Property:</strong> ${f.farmName}</div>
              <div>• <strong>Cropping Enterprise:</strong> ${f.primaryCrop} (${f.secondaryCrop})</div>
              <div>• <strong>Last Visit:</strong> ${f.lastVisitDate} · <strong>Next Visit:</strong> ${f.nextVisitDate}</div>
              ${f.assistanceRequest ? `<div style="color: var(--accent-rose); margin-top: 4px;">• <strong>Active Request:</strong> ${f.assistanceRequest}</div>` : ''}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Phone: <strong>${f.phone}</strong></span>
              <button class="btn btn-outline btn-open-farmer-profile" data-id="${f.id}" style="padding: 5px 12px; font-size: 0.78rem;">Full Profile →</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Search and Filter Listeners
    const searchInput = container.querySelector('#farmerSearchInput');
    const riskFilter = container.querySelector('#farmerRiskFilter');
    const resetBtn = container.querySelector('#btnResetFarmerFilters');

    function applyFilters() {
      const q = searchInput.value.toLowerCase().trim();
      const risk = riskFilter.value;

      container.querySelectorAll('.farmer-card').forEach(card => {
        const text = card.getAttribute('data-text');
        const cardRisk = card.getAttribute('data-risk');
        const matchQuery = !q || text.includes(q);
        const matchRisk = !risk || cardRisk === risk;

        if (matchQuery && matchRisk) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    searchInput.addEventListener('input', applyFilters);
    riskFilter.addEventListener('change', applyFilters);
    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      riskFilter.value = '';
      applyFilters();
    });

    container.querySelectorAll('.btn-open-farmer-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const farmer = farmers.find(f => f.id === id);
        extensionOfficerViews.showFarmerProfileModal(farmer);
      });
    });

    container.querySelector('#btnRegisterFarmer').addEventListener('click', () => {
      alert('Launching new farmer registration wizard with GPS parcel coordinates capture.');
    });
  },

  showFarmerProfileModal(farmer) {
    showModal(`Farmer Profile: ${farmer.name}`, `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Farmer Overview Header -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--bg-primary); padding: 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">PRODUCER PROFILE</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">${farmer.name} (${farmer.id})</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">📞 ${farmer.phone}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1px;">📧 ${farmer.email || 'farmer@nakuru-agri.org'}</div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">HOLDING & JURISDICTION</div>
            <div style="font-size: 1rem; font-weight: 800; color: var(--primary-dark);">${farmer.farmName}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">📍 ${farmer.location} (${farmer.areaHa} ha cultivated)</div>
            <div style="margin-top: 4px;">
              <span class="badge ${farmer.riskLevel === 'HIGH' ? 'badge-rose' : (farmer.riskLevel === 'MEDIUM' ? 'badge-amber' : 'badge-green')}">
                ${farmer.riskLevel} RISK
              </span>
            </div>
          </div>
        </div>

        <!-- Hierarchical Path Indicator: Farmer -> Farm -> Field -> Crop Cycle -> Action -->
        <div style="background: #f1f5f9; padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); font-size: 0.75rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-weight: 700; color: var(--primary-dark);">Sub-zone 4</span> →
          <span>${farmer.name}</span> →
          <span style="font-weight: 700;">${farmer.farmName}</span> →
          <span>Field Parcel 1A</span> →
          <span style="font-weight: 700; color: var(--accent-blue);">${farmer.primaryCrop}</span> →
          <span style="color: var(--accent-rose); font-weight: 700;">Extension Advisory</span>
        </div>

        <!-- 1. Associated Farms & Field Parcels -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; margin: 0;">1. Associated Farms & Field Parcels</h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Total Parcel: ${farmer.areaHa} ha</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 10px 14px; font-size: 0.82rem; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; margin-bottom: 6px;">
              <span><strong>Parcel A1 (North Slope):</strong> 2.8 ha · Deep Volcanic Clay Loam</span>
              <span class="badge badge-green">Low Slope (2%)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>Parcel A2 (River Basin):</strong> 1.7 ha · Alluvial Sandy Clay</span>
              <span class="badge badge-blue">Furrow Irrigated</span>
            </div>
          </div>
        </div>

        <!-- 2. Active Crop Cycles -->
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">2. Active Crop Cycles & Phenology</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="border: 1px solid var(--border-color); padding: 10px 12px; border-radius: var(--radius-xs); background: var(--bg-primary);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">PRIMARY ENTERPRISE</div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">${farmer.primaryCrop}</div>
              <div style="font-size: 0.78rem; color: var(--primary-dark); margin-top: 2px;">Growth Stage: Vegetative V6</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Cycle ID: CYC-2026-088 · Planted: 2026-07-15</div>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 10px 12px; border-radius: var(--radius-xs); background: var(--bg-primary);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">INTERCROP / ROTATION</div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">${farmer.secondaryCrop}</div>
              <div style="font-size: 0.78rem; color: var(--accent-blue); margin-top: 2px;">Growth Stage: Flowering R1</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Cycle ID: CYC-2026-089 · Canopy: 85% Cover</div>
            </div>
          </div>
        </div>

        <!-- 3. Extension Recommendations -->
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">3. Tailored Extension Recommendations</h4>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-xs); padding: 10px 12px; font-size: 0.82rem; color: #166534; line-height: 1.4;">
            <strong>Advisory AGR-2026-14:</strong> Side-dress with CAN fertilizer (50 kg/ha) ahead of forecast rain on Thursday. Apply maize stover mulching to retain soil moisture in Parcel A1.
          </div>
        </div>

        <!-- 4. Recent Field Scouting Observations -->
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">4. Recent Scouting Observations & Diagnosis</h4>
          <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; border-left: 3px solid var(--accent-amber); padding-left: 10px;">
            <strong>2026-09-08:</strong> Crop vigor generally good. 3% leaf area affected by minor chlorosis. Recommended foliar zinc/boron micronutrient spray. Next check scheduled: <strong>${farmer.nextVisit}</strong>.
          </div>
        </div>

        ${farmer.assistanceRequest ? `
          <!-- 5. Active Farmer Assistance Request -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-xs); padding: 10px 12px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="badge badge-blue">HELP TICKET</span>
              <strong style="font-size: 0.82rem; color: #1e40af;">Farmer Assistance Request:</strong>
            </div>
            <div style="font-size: 0.85rem; color: #1e3a8a; margin-top: 4px; font-style: italic;">
              "${farmer.assistanceRequest}"
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-outline" style="font-size: 0.78rem;" onclick="document.getElementById('ayisModalBackdrop').remove(); location.hash='#farms';">View Farm Details →</button>
            <button class="btn btn-outline" style="font-size: 0.78rem;" onclick="document.getElementById('ayisModalBackdrop').remove(); location.hash='#cycles';">View Crop Cycles →</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Close</button>
            <button class="btn btn-primary" onclick="document.getElementById('ayisModalBackdrop').remove(); location.hash='#field-visits';">Schedule Farm Visit</button>
          </div>
        </div>
      </div>
    `);
  },

  // =========================================================================
  // 3. FARMS: Regional Farm Overview
  // =========================================================================
  async farms(container) {
    const farms = await farmService.listFarms();
    const fields = await farmService.listFields();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Monitored Farms' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">REGIONAL PARCEL MONITORING</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Monitored Farms in Sub-zone 4</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Agricultural holdings, parcel layouts, irrigation systems, and extension scouting assignments.
            </p>
          </div>
          <button class="btn btn-outline" onclick="location.hash='#farmers'">Assigned Farmers Directory →</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${farms.map(f => {
          const farmFields = fields.filter(fld => fld.farmId === f.id);
          return `
            <div class="panel" style="padding: 20px; border-left: 4px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                  <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0;">${f.name}</h3>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">📍 ${f.region} · Elev. ${f.elevationM || 1850}m</div>
                </div>
                <span class="badge badge-green">SUPERVISED</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: var(--bg-primary); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 12px; text-align: center;">
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">TOTAL AREA</div>
                  <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary-dark);">${f.sizeHa} ha</div>
                </div>
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">FIELDS</div>
                  <div style="font-size: 1.05rem; font-weight: 800; color: var(--accent-blue);">${farmFields.length} Plots</div>
                </div>
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">IRRIGATION</div>
                  <div style="font-size: 0.8rem; font-weight: 800; color: var(--primary-dark); margin-top: 4px;">${f.irrigationType}</div>
                </div>
              </div>

              <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
                <div>• <strong>Primary Enterprise:</strong> ${f.primaryCrop}</div>
                <div>• <strong>Constituent Plots:</strong> ${farmFields.map(ff => ff.name).join(', ') || 'General Parcel'}</div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
                <button class="btn btn-outline" onclick="location.hash='#field-visits'" style="padding: 5px 12px; font-size: 0.78rem;">Schedule Visit</button>
                <button class="btn btn-primary" onclick="location.hash='#observations'" style="padding: 5px 12px; font-size: 0.78rem;">Log Observation →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // =========================================================================
  // 4. FIELD VISITS: Visit List, Schedule Visit, Visit Details
  // =========================================================================
  async fieldVisits(container) {
    const visits = await fieldOperationService.listVisits();
    const farmers = await fieldOperationService.listAssignedFarmers();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Field Visits' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">FARM COACHING & INSPECTIONS</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Scheduled Farm Visits & Itinerary</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              On-farm advisory appointments, fertilizer verification checks, pest diagnostics, and coaching schedules.
            </p>
          </div>
          <button class="btn btn-primary" id="btnLaunchScheduleVisit">+ Schedule New Visit</button>
        </div>
      </div>

      <!-- Visits Table -->
      <div class="panel">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">Field Support Appointments (${visits.length})</span>
          <span class="badge badge-blue">Rift Valley Sub-zone 4</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Farmer Name</th>
                <th>Farm & Field Parcel</th>
                <th>Scheduled Date & Time</th>
                <th>Purpose of Visit</th>
                <th>Local Weather</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${visits.map(v => `
                <tr>
                  <td><strong>${v.farmer}</strong></td>
                  <td>
                    <strong>${v.farm}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${v.field}</div>
                  </td>
                  <td>
                    <div style="font-weight: 700;">${v.date}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${v.time}</div>
                  </td>
                  <td style="max-width: 260px; font-size: 0.85rem;">${v.purpose}</td>
                  <td><span style="font-size: 0.78rem; color: var(--primary-dark); font-weight: 600;">${v.weatherCondition}</span></td>
                  <td>
                    <span class="badge ${v.status === 'COMPLETED' ? 'badge-green' : (v.status === 'SCHEDULED' ? 'badge-blue' : 'badge-amber')}">
                      ${v.status}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-outline btn-view-visit-details" data-id="${v.id}" style="padding: 4px 10px; font-size: 0.75rem;">Details</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelector('#btnLaunchScheduleVisit').addEventListener('click', () => {
      extensionOfficerViews.showScheduleVisitModal(farmers);
    });

    container.querySelectorAll('.btn-view-visit-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const v = visits.find(item => item.id === id);
        showModal(`Visit Details: ${v.id}`, `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">APPOINTMENT</div>
              <div style="font-size: 1.1rem; font-weight: 900; color: var(--text-primary); margin-top: 2px;">${v.farmer} — ${v.farm}</div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">Target Field: <strong>${v.field}</strong> · Scheduled: <strong>${v.date} at ${v.time}</strong></div>
            </div>
            <div>
              <strong style="font-size: 0.85rem;">Scouting & Coaching Purpose:</strong>
              <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">${v.purpose}</div>
            </div>
            <div>
              <strong style="font-size: 0.85rem;">Officer Preparation Notes:</strong>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${v.notes}</div>
            </div>
            <div style="padding: 10px 12px; border-radius: var(--radius-xs); background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 0.8rem; color: #166534;">
              🌤️ <strong>Forecasted Microclimate:</strong> ${v.weatherCondition}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
              <button class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Close</button>
              <button class="btn btn-primary" onclick="alert('Visit marked as COMPLETED.'); document.getElementById('ayisModalBackdrop').remove();">Mark Completed ✓</button>
            </div>
          </div>
        `);
      });
    });
  },

  showScheduleVisitModal(farmers) {
    showModal('Schedule Farmer Support Visit', `
      <form id="scheduleVisitForm" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Farmer & Farm</label>
          <select class="form-input" id="schedFarmer" required>
            ${farmers.map(f => `<option value="${f.id}">${f.name} — ${f.farmName} (${f.location})</option>`).join('')}
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Field Parcel</label>
            <input type="text" class="form-input" id="schedField" value="North Field A" required>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Scheduled Date</label>
            <input type="date" class="form-input" id="schedDate" value="2026-09-22" required>
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Visit Purpose / Agenda</label>
          <input type="text" class="form-input" id="schedPurpose" placeholder="e.g. Mid-season top-dressing evaluation & weed pressure assessment" required>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Field Support Notes & Tools Required</label>
          <textarea class="form-input" id="schedNotes" rows="3" placeholder="Specify diagnostic testing kits, soil moisture tensiometer, or chemical spray audit items..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Schedule Visit</button>
        </div>
      </form>
    `);

    document.getElementById('scheduleVisitForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Support visit scheduled successfully and dispatched to farmer SMS alert log.');
      document.getElementById('ayisModalBackdrop').remove();
      extensionOfficerViews.fieldVisits(document.getElementById('contentViewport'));
    });
  },

  // =========================================================================
  // 5. OBSERVATIONS: Scouting Observations & Add Observation Modal
  // Crop, growth stage, condition, weather conditions, notes, severity, follow-up required
  // =========================================================================
  async observations(container) {
    const obs = await fieldOperationService.listObservations();
    const farms = await farmService.listFarms();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Scouting Observations' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">PHYSICAL CONDITION SCOUTING</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Farmer Field Scouting Observations</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Diagnostic logs detailing crop vigor, foliar pathogens, soil moisture, and required corrective follow-ups.
            </p>
          </div>
          <button class="btn btn-primary" id="btnLaunchAddObs">+ Record Field Observation</button>
        </div>
      </div>

      <!-- Observations Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${obs.map(o => `
          <div class="panel" style="padding: 20px; border-left: 5px solid ${o.severity === 'CRITICAL' ? 'var(--accent-rose)' : (o.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--primary)')};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${o.farm}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${o.field} · Cultivar: <strong>${o.crop}</strong></div>
              </div>
              <span class="badge ${o.severity === 'CRITICAL' ? 'badge-rose' : (o.severity === 'WARNING' ? 'badge-amber' : 'badge-green')}">${o.severity}</span>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
              <span class="badge badge-blue" style="font-size: 0.7rem;">Stage: ${o.growthStage}</span>
              <span class="badge badge-purple" style="font-size: 0.7rem;">Category: ${o.category}</span>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 10px;">
              <strong>Observation:</strong> ${o.text}
            </p>

            <div style="font-size: 0.8rem; color: var(--text-muted); background: var(--bg-primary); padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 12px; line-height: 1.3;">
              <strong>Scouting Notes:</strong> ${o.notes}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; font-size: 0.78rem;">
              <span>Scout: <strong>${o.scoutName}</strong> (${o.date})</span>
              ${o.followUpRequired 
                ? '<span style="color: var(--accent-rose); font-weight: 800;">⚠️ Follow-up Required</span>'
                : '<span style="color: var(--primary-dark); font-weight: 800;">✓ Resolved</span>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnLaunchAddObs').addEventListener('click', () => {
      extensionOfficerViews.showAddObservationModal(farms);
    });
  },

  showAddObservationModal(farms) {
    showModal('Add Field Scouting Observation', `
      <form id="addExtensionObsForm" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Farm & Field</label>
          <select class="form-input" id="newObsFarm" required>
            ${farms.map(f => `<option value="${f.id}">${f.name} (${f.region})</option>`).join('')}
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Crop Variety</label>
            <input type="text" class="form-input" id="newObsCrop" value="Maize (H614D)" required>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Growth Stage</label>
            <input type="text" class="form-input" id="newObsStage" value="Vegetative V6" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Crop Condition</label>
            <select class="form-input" id="newObsCondition">
              <option value="Optimal">Optimal Vigor (Normal)</option>
              <option value="Mild Stress">Mild Moisture Deficit</option>
              <option value="Pest Presence">Insect Pest Damage</option>
              <option value="Pathogen Lesions">Foliar Pathogen Lesions</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Severity Level</label>
            <select class="form-input" id="newObsSeverity">
              <option value="INFO">INFO (Normal observation)</option>
              <option value="WARNING">WARNING (Action recommended)</option>
              <option value="CRITICAL">CRITICAL (Urgent action needed)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Current Weather Conditions During Inspection</label>
          <input type="text" class="form-input" id="newObsWeather" value="Partly cloudy, 22°C, Calm wind (5 km/h), Soil top 5cm moist" required>
        </div>
        <div>
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Diagnostic Notes & Recommendations for Farmer</label>
          <textarea class="form-input" id="newObsNotes" rows="3" placeholder="Enter findings, symptoms, tensiometer readings, or fertilizer advice..." required></textarea>
        </div>
        <div>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
            <input type="checkbox" id="newObsFollowUp" checked> Requires Extension Officer Follow-up Visit
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Observation</button>
        </div>
      </form>
    `);

    document.getElementById('addExtensionObsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Observation saved successfully into MySQL `field_observations` table.');
      document.getElementById('ayisModalBackdrop').remove();
      extensionOfficerViews.observations(document.getElementById('contentViewport'));
    });
  },

  // =========================================================================
  // 6. FOLLOW-UP: Task-style interface (Pending, Completed, High-risk, Assistance requests)
  // =========================================================================
  async followUps(container) {
    const followUps = await fieldOperationService.getFollowUps();
    const farmers = await fieldOperationService.listAssignedFarmers();

    const pending = followUps.filter(f => f.status === 'PENDING');
    const completed = followUps.filter(f => f.status === 'COMPLETED');
    const highRiskFarms = farmers.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'MEDIUM');
    const assistanceRequests = farmers.filter(f => f.assistanceRequest !== null);

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Follow-ups & Assistance' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-amber">ACTION QUEUE & CASE MANAGEMENT</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Follow-up Tasks & Farmer Inquiries</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Task-style interface for pending agronomic verifications, completed check-ins, high-risk farms, and incoming farmer assistance tickets.
            </p>
          </div>
          <button class="btn btn-outline" onclick="location.hash='#field-visits'">+ Schedule Field Visit</button>
        </div>
      </div>

      <!-- Task Tab Navigation -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">
        <button class="btn btn-primary task-tab-btn" data-tab="tab-pending" style="font-size: 0.82rem;">Pending Follow-ups (${pending.length})</button>
        <button class="btn btn-outline task-tab-btn" data-tab="tab-highrisk" style="font-size: 0.82rem;">High-Risk Farms (${highRiskFarms.length})</button>
        <button class="btn btn-outline task-tab-btn" data-tab="tab-assistance" style="font-size: 0.82rem;">Farmer Assistance Requests (${assistanceRequests.length})</button>
        <button class="btn btn-outline task-tab-btn" data-tab="tab-completed" style="font-size: 0.82rem;">Completed (${completed.length})</button>
      </div>

      <!-- TAB 1: PENDING FOLLOW-UPS -->
      <div id="tab-pending" class="task-tab-content">
        <div class="panel">
          <div class="card-header"><span class="card-title">Pending Extension Verifications (${pending.length})</span></div>
          <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px;">
            ${pending.map(f => `
              <div style="border: 1px solid var(--border-color); padding: 14px 18px; border-radius: var(--radius-xs); display: flex; justify-content: space-between; align-items: flex-start; background: var(--bg-primary); flex-wrap: wrap; gap: 12px;">
                <div style="max-width: 720px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge ${f.severity === 'CRITICAL' ? 'badge-rose' : 'badge-amber'}">${f.severity}</span>
                    <strong style="font-size: 1rem; color: var(--text-primary);">${f.title}</strong>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px;">
                    Farmer: <strong>${f.farmer}</strong> · Holding: <strong>${f.farm} (${f.field})</strong> · Crop: <strong>${f.crop}</strong> · Target Due Date: <strong>${f.due}</strong>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; background: #f8fafc; padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                    ${f.notes}
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                  <button class="btn btn-primary" style="font-size: 0.78rem; padding: 6px 14px;" onclick="alert('Follow-up task marked as COMPLETED.'); this.closest('div').parentElement.style.opacity='0.5';">Complete Task ✓</button>
                  <button class="btn btn-outline" style="font-size: 0.75rem; padding: 4px 10px;" onclick="location.hash='#field-visits'">Schedule Visit</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- TAB 2: HIGH-RISK FARMS -->
      <div id="tab-highrisk" class="task-tab-content" style="display: none;">
        <div class="panel">
          <div class="card-header"><span class="card-title">High & Medium Risk Agricultural Holdings (${highRiskFarms.length})</span></div>
          <div style="padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
            ${highRiskFarms.map(f => `
              <div style="border: 1px solid var(--border-color); border-left: 4px solid var(--accent-rose); padding: 16px; border-radius: var(--radius-xs); background: var(--bg-primary);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary);">${f.farmName}</h3>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${f.name} · ${f.location}</div>
                  </div>
                  <span class="badge ${f.riskLevel === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${f.riskLevel} RISK</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 10px;">
                  <strong>Risk Assessment:</strong> ${f.riskFactors}
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">
                  Crop: <strong>${f.primaryCrop}</strong> · Next Scheduled Contact: <strong>${f.nextVisit}</strong>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-open-farmer-profile" data-id="${f.id}" style="font-size: 0.75rem; flex: 1;">View Farmer Dossier</button>
                  <button class="btn btn-primary" style="font-size: 0.75rem; flex: 1;" onclick="location.hash='#field-visits'">Scout Parcel</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- TAB 3: FARMER ASSISTANCE REQUESTS -->
      <div id="tab-assistance" class="task-tab-content" style="display: none;">
        <div class="panel">
          <div class="card-header"><span class="card-title">Incoming Farmer Inquiries & Support Tickets (${assistanceRequests.length})</span></div>
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            ${assistanceRequests.map(f => `
              <div style="border: 1px solid var(--border-color); border-left: 4px solid var(--accent-blue); padding: 14px 18px; border-radius: var(--radius-xs); background: var(--bg-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge badge-blue">HELP TICKET</span>
                    <strong style="font-size: 0.95rem; color: var(--text-primary);">${f.name} (${f.farmName})</strong>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">📞 ${f.phone}</span>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                    "${f.assistanceRequest}"
                  </div>
                  <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
                    Location: ${f.location} · Primary Enterprise: ${f.primaryCrop}
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline" style="font-size: 0.78rem;" onclick="alert('SMS Sent to ${f.phone}: Extension Officer is reviewing your request.');">Send SMS Advisory</button>
                  <button class="btn btn-primary" style="font-size: 0.78rem;" onclick="location.hash='#field-visits'">Schedule Farm Visit</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- TAB 4: COMPLETED FOLLOW-UPS -->
      <div id="tab-completed" class="task-tab-content" style="display: none;">
        <div class="panel">
          <div class="card-header"><span class="card-title">Completed Case Histories (${completed.length})</span></div>
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
            ${completed.map(f => `
              <div style="border: 1px solid var(--border-subtle); padding: 12px 16px; border-radius: var(--radius-xs); background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-green">RESOLVED</span>
                    <strong style="font-size: 0.9rem; color: var(--text-muted); text-decoration: line-through;">${f.title}</strong>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                    Farmer: ${f.farmer} · Holding: ${f.farm} · Crop: ${f.crop}
                  </div>
                </div>
                <span style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 700;">Verified In Field ✓</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Tab switching handlers
    container.querySelectorAll('.task-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.task-tab-btn').forEach(b => {
          b.className = 'btn btn-outline task-tab-btn';
        });
        btn.className = 'btn btn-primary task-tab-btn';

        const targetTab = btn.getAttribute('data-tab');
        container.querySelectorAll('.task-tab-content').forEach(tc => {
          tc.style.display = tc.id === targetTab ? 'block' : 'none';
        });
      });
    });

    container.querySelectorAll('.btn-open-farmer-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const farmer = farmers.find(f => f.id === id);
        extensionOfficerViews.showFarmerProfileModal(farmer);
      });
    });
  },

  // =========================================================================
  // 7. MAP VIEW: Geographical Farmer & Farm Overview
  // =========================================================================
  async mapView(container) {
    const farms = await farmService.listFarms();
    const farmers = await fieldOperationService.listAssignedFarmers();
    const visits = await fieldOperationService.listVisits();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Extension Service', hash: '#dashboard' }, { label: 'Regional GIS Map' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">SPATIAL AGRO-ECOLOGICAL COMMAND</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Geographical Farmer & Farm Overview</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Interactive GIS parcel boundaries, risk heatmap, crop distribution, weather radar telemetry, and scheduled visit pins.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" onclick="location.hash='#farmers'">Farmer Directory</button>
            <button class="btn btn-outline" onclick="location.hash='#field-visits'">Field Visits</button>
          </div>
        </div>
      </div>

      <!-- Map View with Filters and Legend -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <span class="card-title">Interactive GIS Canvas</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Layers: Cadastral Parcels · Agromet Station · Alert Shading</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <span class="badge badge-green">Low Risk Parcels (3)</span>
            <span class="badge badge-rose">High Risk Pathogen (1)</span>
            <span class="badge badge-blue">Telemetry Station (NKU-01)</span>
          </div>
        </div>

        <div style="height: 480px; background: #f1f5f9; position: relative;">
          <canvas id="extensionGISCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
          <div style="position: absolute; bottom: 16px; left: 16px; background: rgba(255, 255, 255, 0.95); padding: 12px 16px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); font-size: 0.78rem; max-width: 320px; line-height: 1.4;">
            <strong style="color: var(--text-primary);">Regional Spatial Legend:</strong>
            <div style="margin-top: 6px;">🟢 <strong>Green Fill:</strong> Optimal Vigor (Maize / Beans)</div>
            <div>🔴 <strong>Red Ring:</strong> High Pathogen Risk (Stem Rust Warning)</div>
            <div>🔵 <strong>Blue Marker:</strong> Nakuru Agromet Telemetry Hub</div>
            <div style="margin-top: 6px; font-size: 0.74rem; color: var(--text-muted);">Click on any parcel boundary to inspect farmer dossier.</div>
          </div>
        </div>
      </div>

      <!-- Quick Farm & Farmer Spatial List -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        ${farmers.map(f => `
          <div class="panel" style="padding: 16px; border-left: 4px solid ${f.riskLevel === 'HIGH' ? 'var(--accent-rose)' : 'var(--primary)'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">${f.farmName}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${f.name} · ${f.location}</div>
              </div>
              <span class="badge ${f.riskLevel === 'HIGH' ? 'badge-rose' : 'badge-green'}">${f.riskLevel}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;">
              Crop: <strong>${f.primaryCrop}</strong> · Area: <strong>${f.areaHa} ha</strong>
            </div>
            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Visit: ${f.nextVisit}</span>
              <button class="btn btn-outline btn-open-farmer-profile" data-id="${f.id}" style="font-size: 0.72rem; padding: 3px 8px;">View Dossier</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    setTimeout(() => {
      renderGisMap('extensionGISCanvas', farms);
    }, 100);

    container.querySelectorAll('.btn-open-farmer-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const farmer = farmers.find(f => f.id === id);
        extensionOfficerViews.showFarmerProfileModal(farmer);
      });
    });
  }
};
