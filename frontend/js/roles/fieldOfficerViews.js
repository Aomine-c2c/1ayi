/**
 * Dedicated Field Officer Role Experience Module
 * Focuses on physical field monitoring, structured in-field scouting inspections,
 * multi-attribute field details, and categorized task tracking.
 * Optimized for mobile/tablet responsive field touch interaction.
 */

import { farmService, cropService, weatherService, fieldOperationService, reportService, authService } from '../services/index.js';
import { renderGisMap } from '../components/gisMap.js';
import { showModal } from '../components/modal.js';
import { ui } from '../components/ui.js';

export const fieldOfficerViews = {
  // =========================================================================
  // 1. DASHBOARD
  // =========================================================================
  async dashboard(container) {
    const farms = await fieldOperationService.listAssignedFarmers();
    const inspections = await fieldOperationService.listInspections();
    const tasks = await fieldOperationService.listTasks();
    const alerts = await weatherService.getAlerts();
    const obs = await fieldOperationService.listObservations();

    const todayStr = '2026-09-14';
    const todayInspections = inspections.filter(i => (i.inspectionDate || '').startsWith(todayStr));
    const pendingInspections = inspections.filter(i => i.status !== 'COMPLETED');
    const highRiskFarms = farms.filter(f => f.riskLevel === 'HIGH');
    const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE' || t.status === 'IN_PROGRESS');

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Officer Operations', hash: '#dashboard' }, { label: 'Scouting Dashboard' }])}

      <!-- Operational Header -->
      <div class="panel" style="padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #bbf7d0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-green" style="font-size: 0.75rem;">PHYSICAL FIELD MONITORING</span>
              <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">📡 Nakuru Sub-zone 4 In-Field Unit</span>
            </div>
            <h1 style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
              Field Officer Dispatch & Scouting Command
            </h1>
            <p style="color: var(--text-secondary); margin-top: 4px; font-size: 0.875rem;">
              Officer: <strong>Peter Koech</strong> · Active physical scouting, crop phenology observations, and action compliance
            </p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btnStartInspectionFast" style="font-weight: 700;">
              📋 Start Field Inspection
            </button>
            <button class="btn btn-outline" onclick="location.hash='#tasks'">
              ✅ Task Queue (${pendingTasks.length})
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary-color);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Assigned Farms</div>
          <div style="font-size: 1.8rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">${farms.length}</div>
          <div style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 600; margin-top: 2px;">
            ${farms.reduce((acc, f) => acc + (f.areaHa || 0), 0).toFixed(1)} ha monitored
          </div>
        </div>

        <div class="panel" style="padding: 16px; border-left: 4px solid #3b82f6;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Today's Inspections</div>
          <div style="font-size: 1.8rem; font-weight: 900; color: #1d4ed8; margin-top: 4px;">${todayInspections.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            ${pendingInspections.length} total pending in queue
          </div>
        </div>

        <div class="panel" style="padding: 16px; border-left: 4px solid #ef4444;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">High-Risk Fields</div>
          <div style="font-size: 1.8rem; font-weight: 900; color: #b91c1c; margin-top: 4px;">${highRiskFarms.length}</div>
          <div style="font-size: 0.75rem; color: #dc2626; font-weight: 600; margin-top: 2px;">
            Rongai Plateau (Yellow Rust)
          </div>
        </div>

        <div class="panel" style="padding: 16px; border-left: 4px solid #f59e0b;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Follow-up Tasks</div>
          <div style="font-size: 1.8rem; font-weight: 900; color: #b45309; margin-top: 4px;">${pendingTasks.length}</div>
          <div style="font-size: 0.75rem; color: #d97706; font-weight: 600; margin-top: 2px;">
            1 overdue action item
          </div>
        </div>
      </div>

      <!-- Main Operational Split: High-Risk Alert & Active Crop Conditions -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; margin-bottom: 20px;">
        
        <!-- High-Risk Fields & Crop Conditions -->
        <div class="panel">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title">🚨 High-Risk Fields & Crop Conditions</span>
            <span class="badge badge-rose">URGENT</span>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${highRiskFarms.map(f => `
                <div style="padding: 12px; border: 1px solid #fecdd3; background: #fff1f2; border-radius: var(--radius-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <strong style="color: #9f1239; font-size: 0.95rem;">${f.farmName}</strong>
                      <div style="font-size: 0.8rem; color: #881337; margin-top: 2px;">
                        Farmer: ${f.name} (${f.phone}) · ${f.location}
                      </div>
                    </div>
                    <span class="badge badge-rose">HIGH RISK</span>
                  </div>
                  <div style="font-size: 0.825rem; color: #9f1239; margin-top: 6px; background: #ffe4e6; padding: 6px 10px; border-radius: var(--radius-xs);">
                    ⚠️ <strong>Condition:</strong> ${f.riskFactors}
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
                    <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#fields'">Inspect Field</button>
                    <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.75rem;" id="btnInspectFarm_${f.id}">Launch 9-Step Inspection</button>
                  </div>
                </div>
              `).join('')}

              <div style="padding: 12px; border: 1px solid var(--border-color); background: var(--bg-primary); border-radius: var(--radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <strong style="font-size: 0.95rem;">Green Valley Model Farm — South Field B</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                      Farmer: John Kamau · Dry Beans (Rosecoco)
                    </div>
                  </div>
                  <span class="badge badge-amber">MODERATE RISK</span>
                </div>
                <div style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 6px;">
                  💧 Soil moisture deficit in flowering zone. Tensiometer at 44 kPa.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Weather Alerts for Field Movement -->
        <div class="panel">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title">⛅ Field Weather Alerts & Movement Windows</span>
            <span class="badge badge-blue">RADAR / AWS</span>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${alerts.map(a => `
                <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); border-left: 4px solid ${a.severity === 'CRITICAL' ? 'var(--accent-rose)' : (a.severity === 'HIGH' ? '#ea580c' : '#0284c7')};">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.875rem;">${a.headline}</strong>
                    <span class="badge ${a.severity === 'CRITICAL' ? 'badge-rose' : (a.severity === 'HIGH' ? 'badge-amber' : 'badge-blue')}">${a.severity}</span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                    Region: <strong>${a.region}</strong> · Effective: ${a.effectiveUntil}
                  </div>
                  <div style="font-size: 0.775rem; color: var(--text-secondary); margin-top: 4px;">
                    Impact: ${a.affectedCrops}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>

      <!-- Today's Inspection Queue & Urgent Follow-up Tasks -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px;">
        
        <!-- Inspection List -->
        <div class="panel">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title">📋 Scheduled & Recent Inspections</span>
            <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#inspections'">All Inspections</button>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${inspections.slice(0, 4).map(i => `
                <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 0.875rem;">${i.farmName}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                      ${i.fieldName} · ${i.crop}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                      Stage: <strong>${i.growthStage}</strong> · Score: <strong>${i.score}/100</strong>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    ${ui.statusIndicator(i.status)}
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${i.inspectionDate}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Follow-up Action Tasks -->
        <div class="panel">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title">✅ Follow-up Tasks Queue</span>
            <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="location.hash='#tasks'">Full Task Board</button>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${tasks.slice(0, 4).map(t => `
                <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 0.875rem;">${t.title}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                      Farm: <strong>${t.farmName}</strong> · Due: <strong>${t.due}</strong>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <span class="badge ${t.status === 'OVERDUE' ? 'badge-rose' : (t.status === 'IN_PROGRESS' ? 'badge-blue' : (t.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'))}">
                      ${t.status}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;

    // Bind Quick Actions
    container.querySelector('#btnStartInspectionFast')?.addEventListener('click', () => {
      fieldOfficerViews.showStructuredInspectionModal(container);
    });

    highRiskFarms.forEach(f => {
      container.querySelector(`#btnInspectFarm_${f.id}`)?.addEventListener('click', () => {
        fieldOfficerViews.showStructuredInspectionModal(container, f);
      });
    });
  },

  // =========================================================================
  // 2. ASSIGNED FARMS
  // =========================================================================
  async assignedFarms(container) {
    const farmers = await fieldOperationService.listAssignedFarmers();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Officer Operations', hash: '#dashboard' }, { label: 'Assigned Farms' }])}

      <div class="panel" style="padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Assigned Farms & Monitored Holdings</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Smallholder and commercial farm parcels under physical monitoring and field scouting
          </p>
        </div>
        <button class="btn btn-primary" id="btnNewInspectionFromFarms">
          📋 Log Field Inspection
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        ${farmers.map(f => `
          <div class="panel" style="border-top: 4px solid ${f.riskLevel === 'HIGH' ? 'var(--accent-rose)' : (f.riskLevel === 'MEDIUM' ? '#f59e0b' : 'var(--primary-color)')};">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="font-size: 1.05rem; color: var(--text-primary);">${f.farmName}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Farmer: <strong>${f.name}</strong> · ${f.phone}</div>
              </div>
              <span class="badge ${f.riskLevel === 'HIGH' ? 'badge-rose' : (f.riskLevel === 'MEDIUM' ? 'badge-amber' : 'badge-green')}">${f.riskLevel} RISK</span>
            </div>
            <div class="card-body">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; margin-bottom: 12px; background: var(--bg-primary); padding: 10px; border-radius: var(--radius-xs);">
                <div>Area: <strong>${f.areaHa} ha</strong></div>
                <div>Location: <strong>${f.location}</strong></div>
                <div>Primary: <strong>${f.primaryCrop}</strong></div>
                <div>Rotation: <strong>${f.secondaryCrop || 'None'}</strong></div>
                <div>Active Cycles: <strong>${f.activeCyclesCount}</strong></div>
                <div>Last Inspected: <strong>${f.lastVisitDate}</strong></div>
              </div>

              ${f.riskFactors ? `
                <div style="font-size: 0.8rem; color: #991b1b; background: #fef2f2; padding: 8px; border-radius: var(--radius-xs); margin-bottom: 12px; border: 1px solid #fecaca;">
                  ⚠️ <strong>Risk Factor:</strong> ${f.riskFactors}
                </div>
              ` : ''}

              <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="btn btn-outline" style="padding: 5px 12px; font-size: 0.775rem;" onclick="location.hash='#fields'">Field Details</button>
                <button class="btn btn-primary" style="padding: 5px 12px; font-size: 0.775rem;" id="btnScoutFarm_${f.id}">Scout & Inspect</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnNewInspectionFromFarms')?.addEventListener('click', () => {
      fieldOfficerViews.showStructuredInspectionModal(container);
    });

    farmers.forEach(f => {
      container.querySelector(`#btnScoutFarm_${f.id}`)?.addEventListener('click', () => {
        fieldOfficerViews.showStructuredInspectionModal(container, f);
      });
    });
  },

  // =========================================================================
  // 3. FIELDS & FIELD DETAILS
  // =========================================================================
  async fields(container) {
    const farms = await farmService.listFarms();
    const allFields = await farmService.listFields('farm-001');
    const weather = await weatherService.getRecentObservations();
    const latestWeather = weather[weather.length - 1] || { temp: 22.4, humidity: 68, rain: 0.0, wind: 6.2 };
    const obs = await fieldOperationService.listObservations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Officer Operations', hash: '#dashboard' }, { label: 'Field Details & Parcels' }])}

      <div class="panel" style="padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Field Details & Micro-Plots</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Physical boundaries, crop cycles, planting schedules, local weather, and historical observations
          </p>
        </div>
        <button class="btn btn-primary" id="btnInspectFieldTop">
          📋 Inspect Selected Field
        </button>
      </div>

      <!-- Field Cards Grid with Deep Details -->
      <div style="display: flex; flex-direction: column; gap: 18px;">
        ${allFields.map((fld, idx) => {
          const fieldObs = obs.filter(o => o.fieldId === fld.id || o.field.includes(fld.name.substring(0, 10)));
          return `
            <div class="panel" style="padding: 20px; border-left: 4px solid var(--primary-color);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
                <div>
                  <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <span class="badge badge-green">${fld.farmName}</span>
                    <span class="badge badge-blue">${fld.status}</span>
                  </div>
                  <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">
                    ${fld.name}
                  </h2>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">
                    Spatial ID: <code>${fld.id}</code> · Polygon Boundary: EPSG:4326
                  </div>
                </div>
                <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem;" id="btnInspectSpecific_${fld.id}">
                  + Launch Inspection
                </button>
              </div>

              <!-- Field Attributes Table Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; background: var(--bg-primary); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Field Location</div>
                  <strong style="font-size: 0.85rem;">Nakuru High Plains (Parcel ${idx + 1})</strong>
                </div>
                <div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Area</div>
                  <strong style="font-size: 0.85rem; color: var(--primary-dark);">${fld.areaHa} Hectares</strong>
                </div>
                <div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Current Crop</div>
                  <strong style="font-size: 0.85rem;">${fld.currentCrop}</strong>
                </div>
                <div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Crop Cycle</div>
                  <strong style="font-size: 0.85rem;">2026 Long Rains (${fld.stage})</strong>
                </div>
                <div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Planting Date</div>
                  <strong style="font-size: 0.85rem;">2026-04-12</strong>
                </div>
                <div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Expected Harvest</div>
                  <strong style="font-size: 0.85rem; color: var(--accent-rose);">2026-09-28</strong>
                </div>
              </div>

              <!-- Local Weather & Soil Telemetry -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 16px;">
                <div style="border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-xs);">
                  <strong style="font-size: 0.825rem; color: var(--text-primary);">⛅ Real-Time Weather Conditions</strong>
                  <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 0.8rem;">
                    <div>Temp: <strong>${latestWeather.temp}°C</strong></div>
                    <div>Humidity: <strong>${latestWeather.humidity}%</strong></div>
                    <div>Rain: <strong>${latestWeather.rain} mm</strong></div>
                    <div>Wind: <strong>${latestWeather.wind} km/h</strong></div>
                  </div>
                </div>

                <div style="border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-xs);">
                  <strong style="font-size: 0.825rem; color: var(--text-primary);">⚠️ Current Risks & Limiting Factors</strong>
                  <div style="font-size: 0.8rem; color: ${idx === 0 ? 'var(--primary-dark)' : '#b91c1c'}; margin-top: 6px;">
                    ${idx === 0 ? '🟢 Low risk: Soil moisture optimal. Vigor high.' : '🟡 Moderate risk: Soil moisture tension high (44 kPa). Tensiometer tracking active.'}
                  </div>
                </div>
              </div>

              <!-- Historical Observations Accordion -->
              <div>
                <strong style="font-size: 0.85rem; color: var(--text-primary);">🔍 Historical Field Observations (${fieldObs.length})</strong>
                <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                  ${fieldObs.length > 0 ? fieldObs.map(o => `
                    <div style="padding: 10px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-xs); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong>${o.growthStage}</strong> · <span class="badge ${o.severity === 'CRITICAL' ? 'badge-rose' : (o.severity === 'WARNING' ? 'badge-amber' : 'badge-blue')}">${o.severity}</span>
                        <div style="color: var(--text-secondary); margin-top: 2px;">${o.text}</div>
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); text-align: right;">${o.date}<br>${o.scoutName}</div>
                    </div>
                  `).join('') : `
                    <div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px;">No prior observations logged for this field plot.</div>
                  `}
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelector('#btnInspectFieldTop')?.addEventListener('click', () => {
      fieldOfficerViews.showStructuredInspectionModal(container);
    });

    allFields.forEach(fld => {
      container.querySelector(`#btnInspectSpecific_${fld.id}`)?.addEventListener('click', () => {
        fieldOfficerViews.showStructuredInspectionModal(container, null, fld);
      });
    });
  },

  // =========================================================================
  // 4. STRUCTURED 9-STEP FIELD INSPECTION WORKFLOW
  // =========================================================================
  async inspections(container) {
    const inspections = await fieldOperationService.listInspections();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Officer Operations', hash: '#dashboard' }, { label: 'Field Inspections' }])}

      <div class="panel" style="padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Field Scouting Inspections</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Execute standardized 9-step field inspections, record crop phenology, and generate follow-up tasks
          </p>
        </div>
        <button class="btn btn-primary" id="btnStart9StepInspection">
          📋 Start 9-Step Inspection Workflow
        </button>
      </div>

      <div class="panel">
        <div class="card-header">
          <span class="card-title">Completed & Active Field Inspection Records</span>
        </div>
        <div class="card-body">
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Inspection ID</th>
                  <th>Farm & Farmer</th>
                  <th>Field & Crop</th>
                  <th>Growth Stage</th>
                  <th>Condition</th>
                  <th>Severity</th>
                  <th>Inspector</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${inspections.map(i => `
                  <tr>
                    <td><code>${i.id}</code></td>
                    <td>
                      <strong>${i.farmName}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${i.farmerName || 'Registered Producer'}</div>
                    </td>
                    <td>
                      <strong>${i.fieldName}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${i.crop}</div>
                    </td>
                    <td>${i.growthStage}</td>
                    <td>
                      <span class="badge ${i.fieldCondition === 'EXCELLENT' ? 'badge-green' : (i.fieldCondition === 'POOR' ? 'badge-rose' : 'badge-amber')}">
                        ${i.fieldCondition}
                      </span>
                    </td>
                    <td>${ui.statusIndicator(i.severity)}</td>
                    <td>${i.inspector}</td>
                    <td>${i.inspectionDate}</td>
                    <td>${ui.statusIndicator(i.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnStart9StepInspection')?.addEventListener('click', () => {
      fieldOfficerViews.showStructuredInspectionModal(container);
    });
  },

  /**
   * Modal dialog implementing the complete 9-Step Inspection Workflow:
   * Step 1: Select farmer/farm
   * Step 2: Select field
   * Step 3: Select crop
   * Step 4: Select crop growth stage
   * Step 5: Record field condition
   * Step 6: Record observations
   * Step 7: Record severity
   * Step 8: Add notes
   * Step 9: Create follow-up if necessary
   */
  async showStructuredInspectionModal(container, preselectedFarm = null, preselectedField = null) {
    const farmers = await fieldOperationService.listAssignedFarmers();
    const crops = await cropService.listCrops();

    let currentStep = 1;
    const totalSteps = 9;

    const formData = {
      farmerId: preselectedFarm ? preselectedFarm.id : (farmers[0]?.id || ''),
      farmerName: preselectedFarm ? preselectedFarm.name : (farmers[0]?.name || ''),
      farmId: preselectedFarm ? preselectedFarm.farmId : (farmers[0]?.farmId || ''),
      farmName: preselectedFarm ? preselectedFarm.farmName : (farmers[0]?.farmName || ''),
      fieldId: preselectedField ? preselectedField.id : 'fld-001',
      fieldName: preselectedField ? preselectedField.name : 'North Field A (Hybrid Trial)',
      crop: crops[0]?.name || 'Highland Hybrid Maize (H614D)',
      growthStage: 'Vegetative V6 (6 Collared Leaves)',
      fieldCondition: 'EXCELLENT',
      observations: '',
      severity: 'LOW',
      notes: '',
      followUpNeeded: false,
      followUpDetails: '',
      followUpDue: '2026-09-18'
    };

    const growthStagesMap = {
      'Maize': ['Emergence VE', 'Vegetative V4', 'Vegetative V6', 'Vegetative V8', 'Tasseling VT', 'Silking R1', 'Milk R3', 'Dough R4', 'Maturity R6'],
      'Beans': ['Emergence VE', 'Primary Leaf V1', 'First Trifoliolate V2', 'Flowering R1', 'Pod Formation R3', 'Seed Filling R5', 'Physiological Maturity R7'],
      'Wheat': ['Seedling 1-3 Leaves', 'Tillering', 'Stem Elongation', 'Booting', 'Inflorescence Emergence', 'Anthesis / Flowering', 'Milk Stage', 'Dough Stage', 'Ripening'],
      'Potato': ['Sprout Development', 'Vegetative Growth', 'Tuber Initiation', 'Tuber Bulking', 'Maturation / Senescence']
    };

    function renderModalBody() {
      return `
        <div style="margin-bottom: 16px;">
          <!-- Progress Stepper -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.8rem; font-weight: 700; color: var(--primary-dark);">
            <span>Step ${currentStep} of ${totalSteps}</span>
            <span>${Math.round((currentStep / totalSteps) * 100)}% Completed</span>
          </div>
          <div style="height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; width: ${(currentStep / totalSteps) * 100}%; background: var(--primary-color); transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div style="min-height: 240px; display: flex; flex-direction: column; justify-content: center;">
          ${getStepContent(currentStep)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 14px;">
          <button class="btn btn-outline" id="btnStepPrev" ${currentStep === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            ← Back
          </button>
          <button class="btn btn-primary" id="btnStepNext">
            ${currentStep === totalSteps ? '✅ Finish & Submit Inspection' : 'Next Step →'}
          </button>
        </div>
      `;
    }

    function getStepContent(step) {
      switch (step) {
        case 1:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 1: SELECT FARMER & FARM</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Which farm are you currently scouting?</h3>
              <div class="form-group">
                <label class="form-label">Assigned Farm / Producer</label>
                <select class="form-input" id="inpStepFarmer">
                  ${farmers.map(f => `
                    <option value="${f.id}" data-farmer="${f.name}" data-farmid="${f.farmId}" data-farmname="${f.farmName}" ${formData.farmerId === f.id ? 'selected' : ''}>
                      ${f.farmName} — Farmer: ${f.name} (${f.location})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>
          `;
        case 2:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 2: SELECT FIELD</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Select field plot or micro-parcel</h3>
              <div class="form-group">
                <label class="form-label">Field Boundary / Plot</label>
                <select class="form-input" id="inpStepField">
                  <option value="fld-001" ${formData.fieldId === 'fld-001' ? 'selected' : ''}>North Field A (Hybrid Trial) — 5.20 ha</option>
                  <option value="fld-002" ${formData.fieldId === 'fld-002' ? 'selected' : ''}>South Field B (Legume Rotation) — 4.80 ha</option>
                  <option value="fld-003" ${formData.fieldId === 'fld-003' ? 'selected' : ''}>East Plateau Parcel 1 — 6.10 ha</option>
                  <option value="fld-004" ${formData.fieldId === 'fld-004' ? 'selected' : ''}>West Terraces Parcel 2 — 4.00 ha</option>
                  <option value="fld-005" ${formData.fieldId === 'fld-005' ? 'selected' : ''}>South Plot Block B — 6.40 ha</option>
                  <option value="fld-006" ${formData.fieldId === 'fld-006' ? 'selected' : ''}>Terrace Parcel 1 — 4.80 ha</option>
                </select>
              </div>
            </div>
          `;
        case 3:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 3: SELECT CROP</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Confirm cultivated crop cultivar</h3>
              <div class="form-group">
                <label class="form-label">Active Crop Variety</label>
                <select class="form-input" id="inpStepCrop">
                  ${crops.map(c => `
                    <option value="${c.name}" ${formData.crop === c.name ? 'selected' : ''}>
                      ${c.name} (${c.category})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>
          `;
        case 4:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 4: SELECT CROP GROWTH STAGE</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">What is the current phenological growth stage?</h3>
              <div class="form-group">
                <label class="form-label">Crop Phenology Stage</label>
                <select class="form-input" id="inpStepGrowthStage">
                  <option value="Emergence VE" ${formData.growthStage.includes('Emergence') ? 'selected' : ''}>Emergence (VE / Stand Uniformity)</option>
                  <option value="Vegetative V4" ${formData.growthStage.includes('V4') ? 'selected' : ''}>Early Vegetative (V4)</option>
                  <option value="Vegetative V6 (6 Collared Leaves)" ${formData.growthStage.includes('V6') ? 'selected' : ''}>Vegetative V6 (Rapid Girth & Root Surge)</option>
                  <option value="Flowering R1 (Early Bloom)" ${formData.growthStage.includes('Flowering') ? 'selected' : ''}>Flowering / Anthesis (R1)</option>
                  <option value="Grain Filling (Hard Dough)" ${formData.growthStage.includes('Grain Filling') ? 'selected' : ''}>Grain Filling / Tuber Bulking</option>
                  <option value="Physiological Maturity" ${formData.growthStage.includes('Maturity') ? 'selected' : ''}>Physiological Maturity (Ready for Harvest)</option>
                </select>
              </div>
            </div>
          `;
        case 5:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 5: RECORD FIELD CONDITION</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Assess overall physical stand & soil condition</h3>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <label style="border: 2px solid ${formData.fieldCondition === 'EXCELLENT' ? 'var(--primary-color)' : 'var(--border-color)'}; padding: 14px; border-radius: var(--radius-sm); text-align: center; cursor: pointer; background: ${formData.fieldCondition === 'EXCELLENT' ? '#ecfdf5' : 'white'};">
                  <input type="radio" name="fieldConditionRadio" value="EXCELLENT" ${formData.fieldCondition === 'EXCELLENT' ? 'checked' : ''} style="display:none;">
                  <div style="font-size: 1.5rem;">🌟</div>
                  <strong style="color: #065f46; display: block; margin-top: 4px;">EXCELLENT</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">High vigor, no stress</span>
                </label>

                <label style="border: 2px solid ${formData.fieldCondition === 'FAIR' ? '#f59e0b' : 'var(--border-color)'}; padding: 14px; border-radius: var(--radius-sm); text-align: center; cursor: pointer; background: ${formData.fieldCondition === 'FAIR' ? '#fffbeb' : 'white'};">
                  <input type="radio" name="fieldConditionRadio" value="FAIR" ${formData.fieldCondition === 'FAIR' ? 'checked' : ''} style="display:none;">
                  <div style="font-size: 1.5rem;">⚠️</div>
                  <strong style="color: #92400e; display: block; margin-top: 4px;">FAIR</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Mild stress / weed signs</span>
                </label>

                <label style="border: 2px solid ${formData.fieldCondition === 'POOR' ? 'var(--accent-rose)' : 'var(--border-color)'}; padding: 14px; border-radius: var(--radius-sm); text-align: center; cursor: pointer; background: ${formData.fieldCondition === 'POOR' ? '#fef2f2' : 'white'};">
                  <input type="radio" name="fieldConditionRadio" value="POOR" ${formData.fieldCondition === 'POOR' ? 'checked' : ''} style="display:none;">
                  <div style="font-size: 1.5rem;">🚨</div>
                  <strong style="color: #991b1b; display: block; margin-top: 4px;">POOR</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Severe pest/drought</span>
                </label>
              </div>
            </div>
          `;
        case 6:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 6: RECORD OBSERVATIONS</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Physical observations & symptom description</h3>
              <div class="form-group">
                <label class="form-label">Canopy, Soil & Pest Findings</label>
                <textarea class="form-input" id="inpStepObs" rows="4" placeholder="Detail canopy color, stand density, leaf curling, pest presence, or weed distribution...">${formData.observations}</textarea>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.725rem;" onclick="document.getElementById('inpStepObs').value += 'Optimal stand vigor, no foliar chlorosis. ';">+ Stand Vigor</button>
                <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.725rem;" onclick="document.getElementById('inpStepObs').value += 'Midday leaf curling detected, topsoil dry. ';">+ Moisture Stress</button>
                <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.725rem;" onclick="document.getElementById('inpStepObs').value += 'Sub-canopy fungal pustules identified on lower leaves. ';">+ Pathogen Pressure</button>
              </div>
            </div>
          `;
        case 7:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 7: RECORD SEVERITY</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Risk & Urgency Severity Classification</h3>
              <div class="form-group">
                <label class="form-label">Severity Level</label>
                <select class="form-input" id="inpStepSeverity">
                  <option value="LOW" ${formData.severity === 'LOW' ? 'selected' : ''}>🟢 LOW — Normal progression / Routine verification</option>
                  <option value="WARNING" ${formData.severity === 'WARNING' ? 'selected' : ''}>🟡 WARNING — Action required within 72 hours</option>
                  <option value="CRITICAL" ${formData.severity === 'CRITICAL' ? 'selected' : ''}>🔴 CRITICAL — Immediate intervention required within 24 hours</option>
                </select>
              </div>
            </div>
          `;
        case 8:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 8: ADD NOTES</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Agronomic recommendations & instructions for farmer</h3>
              <div class="form-group">
                <label class="form-label">Inspector Technical Notes</label>
                <textarea class="form-input" id="inpStepNotes" rows="4" placeholder="Provide actionable steps for the producer or extension team...">${formData.notes}</textarea>
              </div>
            </div>
          `;
        case 9:
          return `
            <div>
              <span class="badge badge-green" style="margin-bottom: 8px;">STEP 9: CREATE FOLLOW-UP TASK</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Is an automated follow-up inspection required?</h3>
              <div class="form-group" style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700;">
                  <input type="checkbox" id="inpStepFollowUpCheck" ${formData.followUpNeeded ? 'checked' : ''} style="width: 18px; height: 18px;">
                  <span>Yes, schedule a follow-up action task for this field</span>
                </label>
              </div>
              <div id="stepFollowUpFields" style="display: ${formData.followUpNeeded ? 'block' : 'none'}; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-xs); background: var(--bg-primary);">
                <div class="form-group">
                  <label class="form-label">Follow-up Action Details</label>
                  <input class="form-input" id="inpStepFollowUpDetails" value="${formData.followUpDetails || 'Verify chemical/fertilizer application and inspect flag leaf.'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Target Completion Date</label>
                  <input class="form-input" type="date" id="inpStepFollowUpDue" value="${formData.followUpDue}">
                </div>
              </div>
            </div>
          `;
        default:
          return '';
      }
    }

    const modal = showModal({
      title: 'Physical Field Inspection (9-Step Workflow)',
      contentHtml: `<div id="inspectionModalContainer">${renderModalBody()}</div>`,
      showFooter: false
    });

    const modalContainer = document.getElementById('inspectionModalContainer');

    function bindStepEvents() {
      if (!modalContainer) return;

      // Update state before moving
      saveCurrentStepValues();

      modalContainer.querySelector('#btnStepPrev')?.addEventListener('click', () => {
        if (currentStep > 1) {
          currentStep--;
          modalContainer.innerHTML = renderModalBody();
          bindStepEvents();
        }
      });

      modalContainer.querySelector('#btnStepNext')?.addEventListener('click', async () => {
        saveCurrentStepValues();
        if (currentStep < totalSteps) {
          currentStep++;
          modalContainer.innerHTML = renderModalBody();
          bindStepEvents();
        } else {
          // Final Step: Submit Inspection
          await fieldOperationService.createInspection(formData);
          if (formData.followUpNeeded) {
            // Also create follow up task
            await fieldOperationService.updateTaskStatus('tsk-' + Math.random().toString(36).substring(2, 6), 'PENDING');
          }
          alert(`Field inspection recorded successfully for ${formData.farmName} — ${formData.fieldName}!`);
          modal.close();
          fieldOfficerViews.inspections(container);
        }
      });

      // Interactive condition radios
      modalContainer.querySelectorAll('input[name="fieldConditionRadio"]').forEach(r => {
        r.addEventListener('change', (e) => {
          formData.fieldCondition = e.target.value;
          modalContainer.innerHTML = renderModalBody();
          bindStepEvents();
        });
      });

      // Follow up toggle
      const check = modalContainer.querySelector('#inpStepFollowUpCheck');
      if (check) {
        check.addEventListener('change', (e) => {
          formData.followUpNeeded = e.target.checked;
          const box = modalContainer.querySelector('#stepFollowUpFields');
          if (box) box.style.display = e.target.checked ? 'block' : 'none';
        });
      }
    }

    function saveCurrentStepValues() {
      const fmr = modalContainer.querySelector('#inpStepFarmer');
      if (fmr) {
        const opt = fmr.options[fmr.selectedIndex];
        formData.farmerId = fmr.value;
        formData.farmerName = opt.getAttribute('data-farmer');
        formData.farmId = opt.getAttribute('data-farmid');
        formData.farmName = opt.getAttribute('data-farmname');
      }
      const fld = modalContainer.querySelector('#inpStepField');
      if (fld) {
        formData.fieldId = fld.value;
        formData.fieldName = fld.options[fld.selectedIndex].text;
      }
      const crp = modalContainer.querySelector('#inpStepCrop');
      if (crp) formData.crop = crp.value;

      const stg = modalContainer.querySelector('#inpStepGrowthStage');
      if (stg) formData.growthStage = stg.value;

      const obsText = modalContainer.querySelector('#inpStepObs');
      if (obsText) formData.observations = obsText.value;

      const sev = modalContainer.querySelector('#inpStepSeverity');
      if (sev) formData.severity = sev.value;

      const nts = modalContainer.querySelector('#inpStepNotes');
      if (nts) formData.notes = nts.value;

      const chk = modalContainer.querySelector('#inpStepFollowUpCheck');
      if (chk) formData.followUpNeeded = chk.checked;

      const fDet = modalContainer.querySelector('#inpStepFollowUpDetails');
      if (fDet) formData.followUpDetails = fDet.value;

      const fDue = modalContainer.querySelector('#inpStepFollowUpDue');
      if (fDue) formData.followUpDue = fDue.value;
    }

    bindStepEvents();
  },

  // =========================================================================
  // 5. OBSERVATIONS
  // =========================================================================
  async observations(container) {
    const obs = await fieldOperationService.listObservations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Officer Operations', hash: '#dashboard' }, { label: 'Scouting Observations' }])}

      <div class="panel" style="padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Physical Crop & Field Observations</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            In-field pest alerts, canopy vigor notes, disease symptoms, and moisture deficiency records
          </p>
        </div>
        <button class="btn btn-primary" id="btnLogObservationFromObs">
          + Record Field Observation
        </button>
      </div>

      <div class="panel">
        <div class="card-header">
          <span class="card-title">Chronological Scouting Log</span>
        </div>
        <div class="card-body">
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Farm & Field</th>
                  <th>Crop & Growth Stage</th>
                  <th>Observation Category</th>
                  <th>Severity</th>
                  <th>Findings & Description</th>
                  <th>Date & Scout</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                ${obs.map(o => `
                  <tr>
                    <td>
                      <strong>${o.farm}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${o.field}</div>
                    </td>
                    <td>
                      <strong>${o.crop}</strong>
                      <div style="font-size: 0.75rem; color: var(--primary-dark); font-weight: 600;">${o.growthStage}</div>
                    </td>
                    <td><span class="badge badge-blue">${o.category}</span></td>
                    <td>${ui.statusIndicator(o.severity)}</td>
                    <td style="max-width: 320px; font-size: 0.8rem;">
                      ${o.text}
                      ${o.notes ? `<div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 2px;">Note: ${o.notes}</div>` : ''}
                    </td>
                    <td>
                      <div style="font-size: 0.8rem;">${o.date}</div>
                      <div style="font-size: 0.725rem; color: var(--text-muted);">${o.scoutName}</div>
                    </td>
                    <td>
                      ${o.followUpRequired ? '<span class="badge badge-rose">ACTION REQUIRED</span>' : '<span class="badge badge-green">RESOLVED</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnLogObservationFromObs')?.addEventListener('click', () => {
      fieldOfficerViews.showStructuredInspectionModal(container);
    });
  },

  // =========================================================================
  // 6. TASKS: Categorized Task Interface (Pending, In Progress, Completed, Overdue)
  // =========================================================================
  async tasks(container) {
    const tasks = await fieldOperationService.listTasks();

    const pending = tasks.filter(t => t.status === 'PENDING');
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const completed = tasks.filter(t => t.status === 'COMPLETED');
    const overdue = tasks.filter(t => t.status === 'OVERDUE');

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Field Officer Operations', hash: '#dashboard' }, { label: 'Task Queue' }])}

      <div class="panel" style="padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">Field Scouting Action Tasks</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
            Categorized follow-up actions: Pending, In Progress, Completed, and Overdue tasks
          </p>
        </div>
        <button class="btn btn-primary" id="btnCreateNewTask">
          + Create Action Task
        </button>
      </div>

      <!-- Task Category Filter Tabs -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="btn btn-primary task-tab-btn" data-target="all" style="padding: 6px 14px; font-size: 0.8rem;">
          All Tasks (${tasks.length})
        </button>
        <button class="btn btn-outline task-tab-btn" data-target="overdue" style="padding: 6px 14px; font-size: 0.8rem; border-color: #fca5a5; color: #b91c1c;">
          🚨 Overdue (${overdue.length})
        </button>
        <button class="btn btn-outline task-tab-btn" data-target="in_progress" style="padding: 6px 14px; font-size: 0.8rem; border-color: #93c5fd; color: #1d4ed8;">
          🔄 In Progress (${inProgress.length})
        </button>
        <button class="btn btn-outline task-tab-btn" data-target="pending" style="padding: 6px 14px; font-size: 0.8rem; border-color: #fde68a; color: #b45309;">
          ⏳ Pending (${pending.length})
        </button>
        <button class="btn btn-outline task-tab-btn" data-target="completed" style="padding: 6px 14px; font-size: 0.8rem; border-color: #86efac; color: #15803d;">
          ✅ Completed (${completed.length})
        </button>
      </div>

      <!-- 4 Categorized Columns / Sections -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        
        <!-- Overdue Column -->
        <div class="panel task-category-col" data-col="overdue" style="border-top: 4px solid var(--accent-rose);">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #991b1b; font-size: 0.95rem;">🚨 OVERDUE (${overdue.length})</strong>
            <span class="badge badge-rose">ACTION NOW</span>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 10px;">
            ${overdue.length > 0 ? overdue.map(t => renderTaskCard(t)).join('') : '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No overdue tasks.</div>'}
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="panel task-category-col" data-col="in_progress" style="border-top: 4px solid #3b82f6;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #1d4ed8; font-size: 0.95rem;">🔄 IN PROGRESS (${inProgress.length})</strong>
            <span class="badge badge-blue">ACTIVE</span>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 10px;">
            ${inProgress.length > 0 ? inProgress.map(t => renderTaskCard(t)).join('') : '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No tasks currently in progress.</div>'}
          </div>
        </div>

        <!-- Pending Column -->
        <div class="panel task-category-col" data-col="pending" style="border-top: 4px solid #f59e0b;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #b45309; font-size: 0.95rem;">⏳ PENDING (${pending.length})</strong>
            <span class="badge badge-amber">SCHEDULED</span>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 10px;">
            ${pending.length > 0 ? pending.map(t => renderTaskCard(t)).join('') : '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No pending tasks.</div>'}
          </div>
        </div>

        <!-- Completed Column -->
        <div class="panel task-category-col" data-col="completed" style="border-top: 4px solid var(--primary-color);">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #15803d; font-size: 0.95rem;">✅ COMPLETED (${completed.length})</strong>
            <span class="badge badge-green">VERIFIED</span>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 10px;">
            ${completed.length > 0 ? completed.map(t => renderTaskCard(t)).join('') : '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No completed tasks yet.</div>'}
          </div>
        </div>

      </div>
    `;

    function renderTaskCard(t) {
      return `
        <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); background: var(--bg-primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <strong style="font-size: 0.85rem; color: var(--text-primary);">${t.title}</strong>
            <span class="badge ${t.priority === 'HIGH' ? 'badge-rose' : (t.priority === 'MEDIUM' ? 'badge-amber' : 'badge-blue')}" style="font-size: 0.65rem;">
              ${t.priority}
            </span>
          </div>
          <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 4px;">
            Farm: <strong>${t.farmName}</strong> · Field: ${t.field}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
            Due Date: <strong>${t.due}</strong> · Assigned: ${t.assignedTo}
          </div>
          ${t.notes ? `
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; font-style: italic;">
              "${t.notes}"
            </div>
          ` : ''}
          <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px;">
            ${t.status !== 'COMPLETED' ? `
              <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.7rem;" onclick="alert('Task status updated to COMPLETED.'); location.hash='#tasks';">
                Mark Completed
              </button>
            ` : `
              <span style="font-size: 0.7rem; color: var(--primary-dark); font-weight: 700;">Verified ✔</span>
            `}
          </div>
        </div>
      `;
    }

    // Filter tab buttons
    container.querySelectorAll('.task-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.task-tab-btn').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
        });
        e.target.classList.remove('btn-outline');
        e.target.classList.add('btn-primary');

        const target = e.target.getAttribute('data-target');
        container.querySelectorAll('.task-category-col').forEach(col => {
          if (target === 'all' || col.getAttribute('data-col') === target) {
            col.style.display = 'block';
          } else {
            col.style.display = 'none';
          }
        });
      });
    });

    container.querySelector('#btnCreateNewTask')?.addEventListener('click', () => {
      showModal({
        title: 'Create Field Action Task',
        confirmText: 'Create Task',
        contentHtml: `
          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input class="form-input" placeholder="e.g. Inspect border rows for cutworm activity">
          </div>
          <div class="form-group">
            <label class="form-label">Target Farm</label>
            <input class="form-input" value="Green Valley Model Farm">
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-input">
              <option>HIGH</option>
              <option selected>MEDIUM</option>
              <option>LOW</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Due Date</label>
            <input class="form-input" type="date" value="2026-09-20">
          </div>
        `,
        onConfirm: () => {
          alert('Task scheduled and added to queue.');
          fieldOfficerViews.tasks(container);
        }
      });
    });
  }
};
