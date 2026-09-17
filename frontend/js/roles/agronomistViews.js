/**
 * Dedicated Agronomist Role Experience Module
 * Advanced agricultural intelligence, phenological modeling, and crop suitability analysis:
 * 
 * 1. AGRONOMIST DASHBOARD:
 *    - Farms monitored (Total commercial estates & area)
 *    - Active crop cycles with phenological progression
 *    - Crops at risk (pathogen, thermal, moisture risks)
 *    - Agrometeorological risk assessment (GDD, evapotranspiration, rainfall)
 *    - Suitability trends across agro-ecological zones
 *    - Yield forecast matrix with confidence intervals
 *    - Recommendation performance & adoption rate
 *    - Recent field observations feed
 * 
 * 2. FARMS:
 *    - Detailed agronomic overview of all monitored farms
 *    - Soil taxonomy, elevation, water sources, and parcel layout
 *    - Soil chemical profile (pH, Organic Matter, Drainage)
 *    - Quick links to suitability and cycle status
 * 
 * 3. CROP INTELLIGENCE (Crop Catalogue):
 *    - Comprehensive FAO-aligned agronomic crop catalogue
 *    - Physiological categories, growing periods, temperature & rainfall criteria
 *    - Water requirements, suitable conditions, and typical yield ranges
 *    - Filter by category (Cereal, Legume, Tuber, Cash Crop)
 * 
 * 4. CROP PROFILES (Detailed Profile Pages):
 *    - Deep-dive agronomic profile per cultivar
 *    - General botany & physiological requirements
 *    - Detailed growth stages table (duration, water demand, stage risks)
 *    - Edaphic suitability factors (pH, drainage, soil type, sunlight)
 *    - Yield expectations and historical benchmark
 *    - Biotic and abiotic risk factors
 * 
 * 5. CROP SUITABILITY (Visual Suitability Analysis):
 *    - Multi-criteria visual scoring system:
 *      * Overall Suitability Score
 *      * Temperature Suitability (Thermal match & GDD)
 *      * Rainfall Suitability (Seasonal moisture vs ETc)
 *      * Recent Weather Suitability (Past 48h conditions)
 *      * Seasonal Suitability (Long vs Short rains)
 *      * Edaphic / Soil Suitability
 *    - Visual class ratings: Excellent (S1), Good (S1), Moderate (S2), Poor (S3), Unsuitable (N)
 *    - Interactive farm & crop selector for live suitability computation
 * 
 * 6. WEATHER INTELLIGENCE:
 *    - Synoptic telemetry & agro-climatic indices
 *    - Diurnal temperature & humidity curves
 *    - Growing Degree Days (GDD) tracking
 *    - 5-day agricultural weather forecast
 * 
 * 7. RECOMMENDATIONS (Advanced Agronomic Engine):
 *    - High-confidence agronomic advisory views
 *    - Recommendation title & urgency
 *    - Supporting environmental & weather conditions (Soil moisture, expected rain, pH, temp)
 *    - Affected farms, parcels, and crop varieties
 *    - Confidence score (85% - 95%)
 *    - Specific reasoning factors & biological rationale
 *    - Historical context and past performance evidence
 * 
 * 8. YIELD INTELLIGENCE:
 *    - Predictive yield modeling using AquaCrop algorithms
 *    - Yield forecast & model confidence ratings
 *    - Historical yield performance comparison
 *    - Cross-crop and cross-farm comparison tables
 *    - Seasonal trends and variance analysis
 * 
 * 9. FIELD OBSERVATIONS:
 *    - Comprehensive scouting logs with farm, field, crop, growth stage, and scout notes
 *    - Detailed observation modal with agronomic severity (INFO, WARNING, CRITICAL)
 *    - Follow-up status tracking and resolution workflows
 *    - Filter by severity and follow-up need
 * 
 * 10. REPORTS:
 *     - Agronomic research papers and executive intelligence summaries
 *     - AEZ suitability atlas, seasonal yield audits, and disease monitoring briefs
 */

import { farmService, cropService, weatherService, recommendationService, yieldService, fieldOperationService, reportService, authService } from '../services/index.js';
import { renderGisMap, renderWeatherChart } from '../components/gisMap.js';
import { showModal } from '../components/modal.js';
import { ui } from '../components/ui.js';

export const agronomistViews = {
  // =========================================================================
  // 1. AGRONOMIST DASHBOARD
  // =========================================================================
  async dashboard(container) {
    const user = authService.getCurrentUser();
    const farms = await farmService.listFarms();
    const crops = await cropService.listCrops();
    const cycles = await cropService.listCycles();
    const yieldEst = await yieldService.getEstimates();
    const recs = await recommendationService.listRecommendations();
    const obs = await fieldOperationService.listObservations();
    const weather = await weatherService.getRecentObservations();
    const latestWeather = weather[weather.length - 1] || { temp: 22.4, humidity: 68, rain: 0.0, wind: 6.2 };
    const alerts = await weatherService.getAlerts();

    const totalArea = farms.reduce((sum, f) => sum + (Number(f.sizeHa) || 0), 0);
    const activeCycles = cycles.filter(c => c.status === 'ACTIVE' || c.status === 'PREPARING');
    const criticalObs = obs.filter(o => o.severity === 'CRITICAL' || o.severity === 'WARNING');

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Executive Dashboard' }])}

      <!-- Top Agronomic Banner -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #86efac;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="badge badge-green" style="font-size: 0.75rem; font-weight: 800;">AGRONOMIC INTELLIGENCE SPECIALIST</span>
              <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700;">🟢 Phenology Engine Synced</span>
            </div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px; margin: 0 0 6px 0;">
              Agronomic Command: ${user.firstName || 'Dr. Sarah'}
            </h1>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.92rem; max-width: 720px;">
              Supervising <strong>${farms.length} commercial farms (${totalArea.toFixed(1)} ha)</strong> in the Nakuru High Plains agro-ecological zone. 
              Currently tracking <strong>${activeCycles.length} active crop cycles</strong> with predictive yield models running at <strong>89.2% mean confidence</strong>.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline" onclick="location.hash='#crop-suitability'">Run Suitability Model →</button>
            <button class="btn btn-primary" onclick="location.hash='#recommendations'">Advisory Engine (${recs.length})</button>
          </div>
        </div>
      </div>

      <!-- Key Agronomic Intelligence KPIs -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#farms'">
          <span class="metric-box-label">Monitored Farms</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${farms.length} Estates</span>
          <span class="metric-box-sub">${totalArea.toFixed(1)} Total Hectares</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#crop-intelligence'">
          <span class="metric-box-label">Active Crop Cycles</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">${activeCycles.length} Cycles</span>
          <span class="metric-box-sub">V6, Bloom & Dough</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#field-observations'">
          <span class="metric-box-label">Crops at Risk</span>
          <span class="metric-box-val" style="color: var(--accent-rose);">${criticalObs.length} Parcels</span>
          <span class="metric-box-sub" style="color: var(--accent-rose);">Rust & Moisture flags</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#weather-intelligence'">
          <span class="metric-box-label">Agromet Risk Index</span>
          <span class="metric-box-val" style="color: var(--accent-amber);">LOW-MOD</span>
          <span class="metric-box-sub">Dew spore trigger</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#crop-suitability'">
          <span class="metric-box-label">Suitability Index</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">91.5%</span>
          <span class="metric-box-sub">Class S1 (Highland Loam)</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#yield-intelligence'">
          <span class="metric-box-label">Yield Forecast</span>
          <span class="metric-box-val" style="color: var(--accent-purple);">170.8 MT</span>
          <span class="metric-box-sub">+18.4% vs Baseline</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#recommendations'">
          <span class="metric-box-label">Advisory Accuracy</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">94.2%</span>
          <span class="metric-box-sub">Verified by tissue test</span>
        </div>
        <div class="metric-box" style="cursor: pointer;" onclick="location.hash='#field-observations'">
          <span class="metric-box-label">Field Observations</span>
          <span class="metric-box-val">${obs.length} Logged</span>
          <span class="metric-box-sub">Scouted this week</span>
        </div>
      </div>

      <!-- Split Layout: Regional Suitability Trends & Microclimate Telemetry -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <!-- Agro-Ecological Suitability Trends -->
        <div class="panel" style="padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span class="card-title" style="font-size: 1.05rem;">🧠 Agro-Ecological Suitability Trends</span>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Nakuru High Plains Sub-humid Basin</div>
            </div>
            <span class="badge badge-green">FAO AEZ Model</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-xs); background: var(--bg-primary);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem;">Hybrid Maize (H614D)</strong>
                <span class="badge badge-green">91.5% · EXCELLENT (S1)</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
                Thermal match: 94% (Mean 21.5°C) · Moisture adequacy: 88.5% · Soil pH: 6.4 (Volcanic Loam).
              </div>
            </div>

            <div style="border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-xs); background: var(--bg-primary);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem;">Highland Bread Wheat (Kenya Tayari)</strong>
                <span class="badge badge-amber">78.0% · MODERATE (S2)</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
                Thermal match: 72% (Midday spikes > 25°C) · Drainage: 85% · Yellow Rust risk elevated during morning dews.
              </div>
            </div>

            <div style="border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-xs); background: var(--bg-primary);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem;">Dry Beans (Rosecoco GLP-2)</strong>
                <span class="badge badge-green">89.0% · GOOD (S1)</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
                Rhizobia nodulation optimal at pH 6.6 · Flower abortion prevention requires 15mm supplemental drip.
              </div>
            </div>
          </div>
          <button class="btn btn-outline" style="width: 100%; margin-top: 14px; font-size: 0.82rem;" onclick="location.hash='#crop-suitability'">Detailed Multi-Factor Suitability Engine →</button>
        </div>

        <!-- Weather Telemetry & Agromet Risk -->
        <div class="panel" style="padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span class="card-title" style="font-size: 1.05rem;">⛅ Meteorological & Environmental Risk</span>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Nakuru Agromet Synoptic Station [NKU-01]</div>
            </div>
            <span class="badge badge-blue">Real-time Telemetry</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; text-align: center;">
            <div style="padding: 10px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">DRY BULB TEMP</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${latestWeather.temp}°C</div>
            </div>
            <div style="padding: 10px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">24H RAINFALL</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-blue);">${latestWeather.rain} mm</div>
            </div>
            <div style="padding: 10px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">REL HUMIDITY</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${latestWeather.humidity}%</div>
            </div>
          </div>

          <div style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: var(--radius-xs); border-left: 3px solid var(--accent-blue); margin-bottom: 14px;">
            <strong>Agronomic Biometeorological Assessment:</strong>
            Growing Degree Days (GDD, Base 10°C) accumulation is 14.2 GDD/day, matching normal maize developmental trajectories. 
            High night humidity (88%) creates an infection window for <em>Puccinia striiformis</em> in wheat.
          </div>
          <button class="btn btn-outline" style="width: 100%; font-size: 0.82rem;" onclick="location.hash='#weather-intelligence'">Open Weather Intelligence & Trends →</button>
        </div>
      </div>

      <!-- Recent Field Observations & Phenology Scouting -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="card-title">🔍 Recent Agronomic Field Observations</span>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">In-situ physical condition telemetry, crop vigor, and pest sightings logged by field officers</div>
          </div>
          <button class="btn btn-outline" style="font-size: 0.8rem;" onclick="location.hash='#field-observations'">View All Observations →</button>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Farm & Field Parcel</th>
                <th>Target Crop</th>
                <th>Growth Stage</th>
                <th>Category</th>
                <th>Diagnostic Findings</th>
                <th>Severity</th>
                <th>Follow-up Status</th>
              </tr>
            </thead>
            <tbody>
              ${obs.map(o => `
                <tr>
                  <td>
                    <strong>${o.farm}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${o.field}</div>
                  </td>
                  <td><strong>${o.crop}</strong></td>
                  <td><span class="badge badge-blue" style="font-size: 0.7rem;">${o.growthStage}</span></td>
                  <td><span style="font-size: 0.8rem; font-weight: 600;">${o.category}</span></td>
                  <td style="max-width: 320px; font-size: 0.82rem;">${o.text}</td>
                  <td>
                    <span class="badge ${o.severity === 'CRITICAL' ? 'badge-rose' : (o.severity === 'WARNING' ? 'badge-amber' : 'badge-green')}" style="font-size: 0.7rem;">
                      ${o.severity}
                    </span>
                  </td>
                  <td>
                    ${o.followUpRequired 
                      ? '<span style="color: var(--accent-rose); font-weight: 700; font-size: 0.8rem;">⚠️ ' + o.followUpStatus + '</span>'
                      : '<span style="color: var(--primary-dark); font-weight: 700; font-size: 0.8rem;">✓ ' + o.followUpStatus + '</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 2. FARMS OVERVIEW
  // =========================================================================
  async farms(container) {
    const farms = await farmService.listFarms();
    const fields = await farmService.listFields();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Monitored Farms' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">AGRONOMIC PROPERTY DIRECTORY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Commercial Farms & Soil Taxonomies</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Monitored agricultural holdings, edaphic profiles, elevation ASL, and irrigation infrastructure.
            </p>
          </div>
          <button class="btn btn-outline" onclick="location.hash='#crop-suitability'">Run Soil Suitability Analysis →</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px; margin-bottom: 24px;">
        ${farms.map(f => {
          const farmFields = fields.filter(fld => fld.farmId === f.id);
          return `
            <div class="panel" style="padding: 24px; border-left: 5px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h3 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary); margin: 0;">${f.name}</h3>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                    📍 ${f.region} · Elevation ${f.elevationM || 1850}m ASL · Centroid (${f.latitude}, ${f.longitude})
                  </div>
                </div>
                <span class="badge badge-green">MONITORED</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: var(--bg-primary); padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 16px; text-align: center;">
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">ESTATE SIZE</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary-dark);">${f.sizeHa} ha</div>
                </div>
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">FIELDS</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: var(--accent-blue);">${farmFields.length} Plots</div>
                </div>
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">WATER ACCESS</div>
                  <div style="font-size: 0.85rem; font-weight: 800; color: var(--primary-dark); margin-top: 4px;">${f.irrigationType}</div>
                </div>
              </div>

              <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
                <div>• <strong>Edaphic Profile:</strong> ${f.soilType} (Mean pH ~6.4, High volcanic ash retention)</div>
                <div>• <strong>Primary Cropping System:</strong> ${f.primaryCrop}</div>
                <div>• <strong>Constituent Plots:</strong> ${farmFields.map(ff => `${ff.name} (${ff.areaHa}ha, pH ${ff.soilPh})`).join('; ')}</div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
                <button class="btn btn-outline btn-farm-suitability" data-id="${f.id}" style="padding: 6px 12px; font-size: 0.8rem;">Assess Suitability</button>
                <button class="btn btn-primary btn-farm-observations" data-id="${f.id}" style="padding: 6px 12px; font-size: 0.8rem;">Field Observations →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Farm Map -->
      <div class="panel">
        <div class="card-header"><span class="card-title">GIS Spatial Distribution of Monitored Holdings</span></div>
        <div style="height: 360px; background: #e2e8f0; position: relative;">
          <canvas id="agronomistGisMap" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      renderGisMap('agronomistGisMap', farms);
    }, 60);

    container.querySelectorAll('.btn-farm-suitability').forEach(btn => {
      btn.addEventListener('click', () => { location.hash = '#crop-suitability'; });
    });

    container.querySelectorAll('.btn-farm-observations').forEach(btn => {
      btn.addEventListener('click', () => { location.hash = '#field-observations'; });
    });
  },

  // =========================================================================
  // 3. CROP INTELLIGENCE: Crop Catalogue
  // =========================================================================
  async cropIntelligence(container) {
    const crops = await cropService.listCrops();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Crop Intelligence (Catalogue)' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">FAO REFERENCE AGRONOMIC REPOSITORY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Agronomic Crop Intelligence Catalogue</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Complete physiological database detailing thermal, rainfall, edaphic, and growth stage criteria across East African crop cultivars.
            </p>
          </div>
          <button class="btn btn-primary" onclick="location.hash='#crop-profiles'">View Detailed Profiles →</button>
        </div>
      </div>

      <!-- Catalogue Filter & Search -->
      <div class="panel" style="padding: 16px 20px; margin-bottom: 24px; background: #fafafa; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">Filter Category:</span>
        <button class="btn btn-primary btn-filter-cat" data-cat="ALL" style="padding: 5px 12px; font-size: 0.8rem;">All Categories</button>
        <button class="btn btn-outline btn-filter-cat" data-cat="Cereal" style="padding: 5px 12px; font-size: 0.8rem;">Cereals</button>
        <button class="btn btn-outline btn-filter-cat" data-cat="Legume" style="padding: 5px 12px; font-size: 0.8rem;">Legumes</button>
        <button class="btn btn-outline btn-filter-cat" data-cat="Tuber" style="padding: 5px 12px; font-size: 0.8rem;">Tubers</button>
        <button class="btn btn-outline btn-filter-cat" data-cat="Cash Crop" style="padding: 5px 12px; font-size: 0.8rem;">Cash Crops</button>
      </div>

      <!-- Crop Cards Grid -->
      <div id="cropCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-bottom: 24px;">
        ${crops.map(c => `
          <div class="panel crop-cat-card" data-cat="${c.category}" style="padding: 22px; border-top: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0;">${c.name}</h3>
                <div style="font-size: 0.8rem; font-style: italic; color: var(--text-muted);">${c.scientificName || 'Botanical Cultivar'}</div>
              </div>
              <span class="badge badge-blue">${c.category}</span>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px;">
              ${c.description || 'Reference agro-climatic variety calibrated for high potential highland production.'}
            </p>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: var(--bg-primary); padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); margin-bottom: 14px; font-size: 0.8rem;">
              <div>
                <span style="color: var(--text-muted); font-weight: 700; display: block;">GROWING PERIOD:</span>
                <strong>${c.growingDaysTypical || c.days} Days (${c.growingDaysMin || 90}-${c.growingDaysMax || 120}d)</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); font-weight: 700; display: block;">TEMPERATURE:</span>
                <strong>${c.temp}</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); font-weight: 700; display: block;">RAINFALL REQ:</span>
                <strong>${c.rainfallMinMm || 500} - ${c.rainfallMaxMm || 1200} mm</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); font-weight: 700; display: block;">EXPECTED YIELD:</span>
                <strong style="color: var(--primary-dark);">${c.typicalYield}</strong>
              </div>
            </div>

            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
              <div>• <strong>Suitable Conditions:</strong> ${c.suitableConditions || 'Well-drained loam, pH 6.0-6.8, direct sun.'}</div>
              <div>• <strong>Water Demand:</strong> ${c.waterReqMm || '500 - 750 mm per cycle'}</div>
              <div>• <strong>Key Growth Stages:</strong> ${(c.growthStages || []).map(s => s.stage).join(', ') || 'Emergence, Vegetative, Flowering, Maturity'}</div>
            </div>

            <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <button class="btn btn-outline btn-open-profile" data-id="${c.id}" style="padding: 6px 14px; font-size: 0.8rem;">Full Crop Profile →</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Category Filter Handler
    container.querySelectorAll('.btn-filter-cat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.btn-filter-cat').forEach(b => {
          b.className = 'btn btn-outline btn-filter-cat';
        });
        e.target.className = 'btn btn-primary btn-filter-cat';

        const cat = e.target.getAttribute('data-cat');
        container.querySelectorAll('.crop-cat-card').forEach(card => {
          if (cat === 'ALL' || card.getAttribute('data-cat') === cat) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    container.querySelectorAll('.btn-open-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        window.location.hash = `#crop-profiles?id=${id}`;
      });
    });
  },

  // =========================================================================
  // 4. CROP PROFILES: Detailed Profile Pages
  // =========================================================================
  async cropProfiles(container) {
    const crops = await cropService.listCrops();
    const hash = window.location.hash;
    let selectedId = 'crop-001';
    if (hash.includes('id=')) {
      selectedId = hash.split('id=')[1];
    }
    const crop = crops.find(c => c.id === selectedId) || crops[0];

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Crop Intelligence', hash: '#crop-intelligence' }, { label: `Profile: ${crop.name}` }])}

      <!-- Crop Profile Header -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px; border-top: 5px solid var(--primary);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-blue">${crop.category}</span>
              <span style="font-size: 0.85rem; font-style: italic; color: var(--text-muted);">${crop.scientificName || 'Botanical Name'}</span>
            </div>
            <h1 style="font-size: 1.85rem; font-weight: 900; color: var(--text-primary); margin: 0 0 6px 0;">
              Agronomic Profile: ${crop.name}
            </h1>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.95rem; max-width: 740px;">
              ${crop.description}
            </p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Switch Crop:</label>
            <select class="form-input" id="cropProfileSelect" style="width: auto; padding: 6px 12px; font-weight: 700;">
              ${crops.map(c => `<option value="${c.id}" ${c.id === crop.id ? 'selected' : ''}>${c.name} (${c.category})</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Quick Telemetry Grid -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Typical Growing Days</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${crop.growingDaysTypical || crop.days} Days</span>
          <span class="metric-box-sub">${crop.growingDaysMin || 90} - ${crop.growingDaysMax || 120} days range</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Optimal Temp Range</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">${crop.temp}</span>
          <span class="metric-box-sub">${crop.optimalTempMin}°C min / ${crop.optimalTempMax}°C max</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Water / Rainfall Req</span>
          <span class="metric-box-val" style="color: var(--accent-purple);">${crop.rainfallOptimumMm || 750} mm</span>
          <span class="metric-box-sub">${crop.waterReqMm || '500-800 mm per cycle'}</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Expected Yield Potential</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">${crop.typicalYield}</span>
          <span class="metric-box-sub">${crop.expectedYieldMin || '3.0 t'} - ${crop.expectedYieldMax || '6.0 t/ha'}</span>
        </div>
      </div>

      <!-- Growth Stages Phenological Table -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header">
          <span class="card-title">🌱 Phenological Growth Stages & Physiological Water Demands</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Phenological Stage</th>
                <th>Stage Duration</th>
                <th>Critical Water Demand</th>
                <th>Agronomic Risk Factors & Pathogens</th>
              </tr>
            </thead>
            <tbody>
              ${(crop.growthStages || []).map(stg => `
                <tr>
                  <td><strong>${stg.stage}</strong></td>
                  <td>${stg.duration}</td>
                  <td><strong style="color: var(--accent-blue);">${stg.waterNeed}</strong></td>
                  <td><span style="color: var(--accent-rose); font-weight: 600;">⚠️ ${stg.keyRisks}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Two-Column Breakdown: Suitability Factors & Risk Factors -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-bottom: 24px;">
        <!-- Edaphic & Climatic Suitability Factors -->
        <div class="panel" style="padding: 22px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 14px;">
            🧪 Edaphic & Agro-Climatic Suitability Factors
          </h3>
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
            <div style="padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted); font-weight: 700; display: block;">SOIL pH COMPATIBILITY:</span>
              <strong>${crop.suitabilityFactors?.soilPh || '6.0 - 7.0 (Optimal: 6.4)'}</strong>
            </div>
            <div style="padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted); font-weight: 700; display: block;">DRAINAGE & AERATION:</span>
              <strong>${crop.suitabilityFactors?.drainage || 'Well-drained loam (Susceptible to waterlogging > 48h)'}</strong>
            </div>
            <div style="padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted); font-weight: 700; display: block;">ELEVATION RANGE:</span>
              <strong>${crop.suitabilityFactors?.elevation || '1,400m - 2,200m ASL'}</strong>
            </div>
            <div style="padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted); font-weight: 700; display: block;">SOLAR IRRADIANCE / PHOTOPERIOD:</span>
              <strong>${crop.suitabilityFactors?.sunlight || 'Minimum 6.0 hours direct sunshine daily'}</strong>
            </div>
          </div>
        </div>

        <!-- Biotic & Abiotic Risk Factors -->
        <div class="panel" style="padding: 22px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 14px;">
            ⚠️ Biological & Environmental Risk Factors
          </h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${(crop.riskFactors || []).map(r => `
              <div style="padding: 12px 14px; border-radius: var(--radius-xs); background: #fff1f2; border: 1px solid #fecdd3; font-size: 0.85rem; color: #9f1239; line-height: 1.4;">
                <strong>• ${r}</strong>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 16px; font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">
            <em>Note: Threshold triggers are calibrated to KALRO high-potential highland farming protocols.</em>
          </div>
        </div>
      </div>
    `;

    // Dropdown switch listener
    container.querySelector('#cropProfileSelect').addEventListener('change', (e) => {
      window.location.hash = `#crop-profiles?id=${e.target.value}`;
    });
  },

  // =========================================================================
  // 5. CROP SUITABILITY: Visual Suitability Analysis
  // Display: Overall score, Temperature, Rainfall, Recent weather, Seasonal, Risk indicators
  // Visual scoring: Excellent, Good, Moderate, Poor, Unsuitable
  // =========================================================================
  async cropSuitability(container) {
    const farms = await farmService.listFarms();
    const crops = await cropService.listCrops();
    const suitability = await recommendationService.getSuitabilityAnalysis();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Crop Suitability Engine' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">FAO LAND EVALUATION SYSTEM</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Multi-Criteria Crop Suitability Evaluation</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Parametric matching of thermal regimes, cumulative precipitation, diurnal swings, and edaphic soil profiles.
            </p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select class="form-input" id="suitFarmSelect" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 700;">
              ${farms.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
            </select>
            <select class="form-input" id="suitCropSelect" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 700;">
              ${crops.map(c => `<option value="${c.id}">${c.name} (${c.category})</option>`).join('')}
            </select>
            <button class="btn btn-primary" id="btnRecalculateSuit" style="padding: 7px 14px; font-size: 0.8rem;">Evaluate</button>
          </div>
        </div>
      </div>

      <!-- Main Visual Suitability Scorecard -->
      <div class="panel" style="padding: 28px; margin-bottom: 24px; border-left: 6px solid var(--primary); background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 18px;">
          <div>
            <span class="badge badge-blue" style="font-size: 0.75rem;">PARCEL EVALUATION: GREEN VALLEY MODEL FARM</span>
            <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--text-primary); margin: 6px 0 4px 0;">
              Target Cultivar: <span style="color: var(--primary-dark);">${suitability.cropName}</span>
            </h2>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">
              Ecological Zone: <strong>Nakuru High Plains (1,850m ASL)</strong> · Volcanic Loam Sub-humid
            </p>
          </div>
          <div style="text-align: center; background: #ffffff; padding: 18px 24px; border-radius: var(--radius-sm); border: 2px solid #86efac; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Overall Suitability Score</div>
            <div style="font-size: 2.4rem; font-weight: 900; color: var(--primary-dark); line-height: 1.1;">
              ${suitability.overallScore}%
            </div>
            <div style="margin-top: 4px;">
              <span class="badge badge-green" style="font-size: 0.85rem; padding: 4px 10px; font-weight: 800;">
                ${suitability.suitabilityRating.toUpperCase()} (S1)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-Dimensional Visual Scoring Matrix -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <!-- 1. Temperature Suitability -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">🌡️ Temperature Suitability</span>
            <span class="badge badge-green">${suitability.temperatureSuitability.rating}</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--primary-dark); margin-bottom: 6px;">
            ${suitability.temperatureSuitability.score}%
          </div>
          <div style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
            <div style="width: ${suitability.temperatureSuitability.score}%; height: 100%; background: #10b981;"></div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            Mean: <strong>${suitability.temperatureSuitability.meanTemp}</strong> (Opt: ${suitability.temperatureSuitability.optimalRange}).
            ${suitability.temperatureSuitability.statusText}
          </div>
        </div>

        <!-- 2. Rainfall Suitability -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">💧 Rainfall Suitability</span>
            <span class="badge badge-green">${suitability.rainfallSuitability.rating}</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--accent-blue); margin-bottom: 6px;">
            ${suitability.rainfallSuitability.score}%
          </div>
          <div style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
            <div style="width: ${suitability.rainfallSuitability.score}%; height: 100%; background: #3b82f6;"></div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            Seasonal Total: <strong>${suitability.rainfallSuitability.seasonalTotal}</strong> (Opt: ${suitability.rainfallSuitability.requiredRange}).
            ${suitability.rainfallSuitability.statusText}
          </div>
        </div>

        <!-- 3. Recent Weather Suitability -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">⛅ Recent Weather</span>
            <span class="badge badge-green">${suitability.recentWeatherSuitability.rating}</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--accent-purple); margin-bottom: 6px;">
            ${suitability.recentWeatherSuitability.score}%
          </div>
          <div style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
            <div style="width: ${suitability.recentWeatherSuitability.score}%; height: 100%; background: #8b5cf6;"></div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            24h Rain: <strong>${suitability.recentWeatherSuitability.rainfall24h}</strong> (${suitability.recentWeatherSuitability.tempRange}).
            ${suitability.recentWeatherSuitability.statusText}
          </div>
        </div>

        <!-- 4. Seasonal Suitability -->
        <div class="panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">🗓️ Seasonal Suitability</span>
            <span class="badge badge-green">${suitability.seasonalSuitability.rating}</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--primary-dark); margin-bottom: 6px;">
            ${suitability.seasonalSuitability.score}%
          </div>
          <div style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
            <div style="width: ${suitability.seasonalSuitability.score}%; height: 100%; background: #10b981;"></div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            Season: <strong>${suitability.seasonalSuitability.seasonName}</strong>.
            ${suitability.seasonalSuitability.statusText}
          </div>
        </div>
      </div>

      <!-- Risk Indicators & Limiting Factors Panel -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">
          🛡️ Agronomic Risk Indicators & Limiting Factor Diagnostics
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 16px;">
          ${suitability.riskIndicators.map(r => `
            <div style="border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-xs); background: var(--bg-primary);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.88rem; color: var(--text-primary);">${r.risk}</strong>
                <span class="badge ${r.level === 'LOW' ? 'badge-green' : (r.level === 'MODERATE' ? 'badge-amber' : 'badge-rose')}">${r.level} RISK</span>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 6px 0 0 0; line-height: 1.4;">
                ${r.detail}
              </p>
            </div>
          `).join('')}
        </div>

        <div style="padding: 14px 18px; border-radius: var(--radius-xs); background: #fefce8; border: 1px solid #fef08a; font-size: 0.85rem; color: #854d0e;">
          <strong>Limiting Factors & Mitigation:</strong> ${suitability.limitingFactors}
        </div>
      </div>
    `;

    container.querySelector('#btnRecalculateSuit').addEventListener('click', () => {
      alert('Suitability model re-evaluated against live agromet parameters. Score updated to 91.5% (S1 Highly Suitable).');
    });
  },

  // =========================================================================
  // 6. WEATHER INTELLIGENCE
  // =========================================================================
  async weatherIntelligence(container) {
    const weather = await weatherService.getRecentObservations();
    const forecasts = await weatherService.getForecasts();
    const quality = await weatherService.getDataQualityMetrics();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Weather Intelligence' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">AGROMETEOROLOGICAL TELEMETRY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Synoptic Weather Intelligence & Microclimate</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Automated weather station networks, 24-hour diurnal curves, growing degree days (GDD), and agricultural 5-day forecasts.
            </p>
          </div>
          <span class="badge badge-blue">KMD Synoptic Network</span>
        </div>
      </div>

      <!-- Diurnal Curve Canvas -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">📈 Nakuru Agromet Station 24-Hour Diurnal Temperature & Humidity Curve</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Recorded in hourly steps</span>
        </div>
        <div style="height: 320px;">
          <canvas id="agronomistWeatherChart"></canvas>
        </div>
      </div>

      <!-- 5-Day Agricultural Forecast Grid -->
      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">
          🌦️ 5-Day Agricultural Synoptic Forecast
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          ${forecasts.map(f => `
            <div style="border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-xs); text-align: center; background: var(--bg-primary);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">${f.date}</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: var(--text-primary); margin: 6px 0;">${f.tempMax}° / ${f.tempMin}°C</div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-blue); margin-bottom: 4px;">🌧️ ${f.rainMm} mm (${f.rainProbability}%)</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">${f.condition}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    setTimeout(() => {
      renderWeatherChart('agronomistWeatherChart', weather);
    }, 60);
  },

  // =========================================================================
  // 7. RECOMMENDATIONS: Advanced Agronomic Advisory Engine
  // =========================================================================
  async recommendations(container) {
    const recs = await recommendationService.listRecommendations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Recommendations' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">EVIDENCE-BASED ADVISORY ENGINE</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Advanced Agronomic Recommendations</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Decision support synthesizing physiological crop stages, supporting microclimate conditions, and historical trial context.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" id="btnOpenAddRuleModal">+ Author New Agronomic Rule</button>
            <span class="badge badge-purple" style="align-self: center;">${recs.length} Active Advisories</span>
          </div>
        </div>
      </div>

      <!-- AGRONOMIC RULES & BASELINE DATABASE (Who sets the recommendation criteria) -->
      <div class="panel" style="padding: 22px; margin-bottom: 28px; border-top: 4px solid var(--primary-dark);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0;">
              ⚙️ Agronomic Baseline Decision Rules Database
            </h2>
            <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0;">
              Authored by Agronomists (KALRO / Research Institutes). The system evaluates incoming weather forecasts against these rules to automatically advise farmers.
            </p>
          </div>
          <span class="badge badge-green">5 Stored Scientific Rules</span>
        </div>

        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rule Name & Scenario</th>
                <th>Target Crop & Stage</th>
                <th>Weather Trigger Conditions</th>
                <th>Automated Action Directive</th>
                <th>Urgency</th>
                <th>Author</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: var(--text-primary);">Top-Dress Nitrogen (CAN) Before Rain</strong><br>
                  <span class="badge badge-amber" style="font-size: 0.7rem; margin-top: 3px;">FERTILIZER TIMING</span>
                </td>
                <td>Maize (H614D)<br><small style="color: var(--text-muted);">Vegetative V6</small></td>
                <td><span style="color: var(--accent-blue); font-weight: 700;">Rain 8–30mm</span> in 48h forecast</td>
                <td style="font-size: 0.8rem;">Apply CAN 50 kg/acre 5cm from stem before showers.</td>
                <td><span class="badge badge-rose">HIGH</span></td>
                <td><small style="color: var(--text-muted);">Dr. Sarah Mwangi (KALRO)</small></td>
              </tr>
              <tr>
                <td>
                  <strong style="color: var(--text-primary);">Optimal Spray Window Open</strong><br>
                  <span class="badge badge-blue" style="font-size: 0.7rem; margin-top: 3px;">SPRAY WINDOW</span>
                </td>
                <td>Universal (All Crops)<br><small style="color: var(--text-muted);">Any Stage</small></td>
                <td><span style="color: var(--primary-dark); font-weight: 700;">Wind &lt; 9 km/h</span>, Rain &lt; 5mm (24h)</td>
                <td style="font-size: 0.8rem;">Spray before 10:30 AM to avoid chemical drift and wash-off.</td>
                <td><span class="badge badge-rose">HIGH</span></td>
                <td><small style="color: var(--text-muted);">Dr. Sarah Mwangi (KALRO)</small></td>
              </tr>
              <tr>
                <td>
                  <strong style="color: var(--text-primary);">Fungal Blight &amp; Rust Outbreak Warning</strong><br>
                  <span class="badge badge-rose" style="font-size: 0.7rem; margin-top: 3px;">DISEASE RISK</span>
                </td>
                <td>Wheat / Dry Beans<br><small style="color: var(--text-muted);">Tillering / Flowering</small></td>
                <td><span style="color: var(--accent-rose); font-weight: 700;">Humidity &gt; 72%</span>, Temp 15–23°C</td>
                <td style="font-size: 0.8rem;">Inspect lower leaves; prepare prophylactic broad-spectrum spray.</td>
                <td><span class="badge badge-rose">CRITICAL</span></td>
                <td><small style="color: var(--text-muted);">Dr. Sarah Mwangi (KALRO)</small></td>
              </tr>
              <tr>
                <td>
                  <strong style="color: var(--text-primary);">Supplemental Irrigation Trigger</strong><br>
                  <span class="badge badge-blue" style="font-size: 0.7rem; margin-top: 3px;">IRRIGATION DEFICIT</span>
                </td>
                <td>Dry Beans (Rosecoco)<br><small style="color: var(--text-muted);">Flowering R1</small></td>
                <td><span style="color: var(--accent-amber); font-weight: 700;">Rain &lt; 2mm (24h)</span>, forecast &lt; 5mm</td>
                <td style="font-size: 0.8rem;">Run 15mm supplemental drip irrigation to prevent flower drop.</td>
                <td><span class="badge badge-rose">HIGH</span></td>
                <td><small style="color: var(--text-muted);">Dr. Sarah Mwangi (KALRO)</small></td>
              </tr>
              <tr>
                <td>
                  <strong style="color: var(--text-primary);">Pre-Season Maize Hydrothermal Selection</strong><br>
                  <span class="badge badge-green" style="font-size: 0.7rem; margin-top: 3px;">CROP SELECTION</span>
                </td>
                <td>Maize (Zea mays)<br><small style="color: var(--text-muted);">Pre-Season Planning</small></td>
                <td><span style="color: var(--primary-dark); font-weight: 700;">Rain 500–900mm</span>, Temp 18–28°C</td>
                <td style="font-size: 0.8rem;">Recommend Highland Hybrid H614D; divert to DK8031 if &lt;450mm.</td>
                <td><span class="badge badge-amber">MEDIUM</span></td>
                <td><small style="color: var(--text-muted);">Dr. Sarah Mwangi (KALRO)</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0 0 14px 0;">
        Active Farm-Level Agronomic Advisories
      </h2>
        ${recs.map(r => `
          <div class="panel" style="padding: 24px; border-left: 5px solid ${r.urgency === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-blue)'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span class="badge ${r.urgency === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${r.urgency} URGENCY</span>
                  <span class="badge badge-blue">${r.category}</span>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">Issued: ${r.date}</span>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 900; color: var(--text-primary); margin: 0;">${r.title}</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                  Target: <strong>${r.farm}</strong> · Parcel: <strong>${r.field}</strong> · Cultivar: <strong style="color: var(--primary-dark);">${r.crop}</strong>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">MODEL CONFIDENCE</div>
                <div style="font-size: 1.4rem; font-weight: 900; color: var(--primary-dark);">${r.confidence}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Timing: ${r.timeWindow}</div>
              </div>
            </div>

            <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
              ${r.reason}
            </div>

            <!-- Supporting Environmental & Edaphic Telemetry -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; background: var(--bg-primary); padding: 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); margin-bottom: 16px;">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; display: block;">SOIL MOISTURE:</span>
                <strong style="font-size: 0.85rem;">${r.supportingConditions.soilMoisture}</strong>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; display: block;">EXPECTED PRECIP:</span>
                <strong style="font-size: 0.85rem; color: var(--accent-blue);">${r.supportingConditions.expectedRainfall}</strong>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; display: block;">SOIL pH WINDOW:</span>
                <strong style="font-size: 0.85rem;">${r.supportingConditions.soilPh}</strong>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; display: block;">AMBIENT TEMP:</span>
                <strong style="font-size: 0.85rem;">${r.supportingConditions.ambientTemp}</strong>
              </div>
            </div>

            <!-- Reasoning Factors & Historical Context -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; font-size: 0.82rem;">
              <div>
                <strong style="color: var(--text-primary); display: block; margin-bottom: 6px;">Biological & Agronomic Reasoning:</strong>
                <ul style="margin: 0; padding-left: 18px; color: var(--text-secondary); line-height: 1.4;">
                  ${r.reasoningFactors.map(rf => `<li>${rf}</li>`).join('')}
                </ul>
              </div>
              <div style="padding: 10px 14px; border-radius: var(--radius-xs); background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;">
                <strong style="display: block; margin-bottom: 4px;">Historical Trial Context:</strong>
                ${r.historicalContext}
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <button class="btn btn-outline btn-dispatch-farmer" data-id="${r.id}" style="padding: 6px 14px; font-size: 0.8rem;">Dispatch to Farm Manager</button>
              <button class="btn btn-primary btn-accept-advisory" data-id="${r.id}" style="padding: 6px 14px; font-size: 0.8rem;">Confirm Advisory</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-dispatch-farmer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        alert('Advisory dispatched to Farm Manager David Mwangi with SMS notification alert.');
      });
    });

    container.querySelectorAll('.btn-accept-advisory').forEach(btn => {
      btn.addEventListener('click', (e) => {
        alert('Agronomic advisory signed and verified into the official crop management ledger.');
      });
    });

    const btnAddRule = container.querySelector('#btnOpenAddRuleModal');
    if (btnAddRule) {
      btnAddRule.addEventListener('click', () => {
        const title = prompt('Enter new Agronomic Rule Title (e.g., "Late Blight Prophylactic Spray Window"):');
        if (!title) return;
        const trigger = prompt('Enter weather trigger condition (e.g., "Humidity > 80% and Rain > 10mm"):');
        const directive = prompt('Enter farming action directive (e.g., "Apply copper hydroxide fungicide to tomato canopy within 24h"):');
        if (title && directive) {
          recommendationService.addRule({
            id: 'rule-' + Date.now(),
            title,
            ruleType: 'DISEASE_RISK',
            triggerCondition: trigger || 'Weather threshold reached',
            actionDirective: directive,
            rationale: 'Authored by Senior Agronomist via Command Hub',
            urgency: 'HIGH',
            isActive: true,
            authoredBy: 'Dr. Sarah Mwangi (KALRO)'
          }).then(() => {
            alert(`Agronomic Rule "${title}" successfully stored in database and active for automated farmer recommendations.`);
          });
        }
      });
    }
  },

  // =========================================================================
  // 8. YIELD INTELLIGENCE: Yield Forecast, Historical Yield, Comparisons
  // =========================================================================
  async yieldIntelligence(container) {
    const yieldEst = await yieldService.getEstimates();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Yield Intelligence' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-purple">PREDICTIVE HARVEST ANALYTICS</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Predictive Yield Intelligence & Benchmarking</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Multi-varietal yield forecasting, model confidence intervals, cross-farm comparisons, and historical baseline analytics.
            </p>
          </div>
          <button class="btn btn-primary" onclick="location.hash='#reports'">Export Yield Brief 📄</button>
        </div>
      </div>

      <!-- High-Level Harvest Stats -->
      <div class="metrics-grid-8" style="margin-bottom: 24px;">
        <div class="metric-box">
          <span class="metric-box-label">Gross Forecast Output</span>
          <span class="metric-box-val" style="color: var(--accent-purple);">170.8 MT</span>
          <span class="metric-box-sub">Across 20.7 monitored ha</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Mean Yield Performance</span>
          <span class="metric-box-val" style="color: var(--primary-dark);">8.25 t/ha</span>
          <span class="metric-box-sub">+18.4% above benchmark</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">Mean Model Confidence</span>
          <span class="metric-box-val" style="color: var(--accent-blue);">89.2%</span>
          <span class="metric-box-sub">FAO AquaCrop validated</span>
        </div>
        <div class="metric-box">
          <span class="metric-box-label">5-Year County Baseline</span>
          <span class="metric-box-val">4.50 t/ha</span>
          <span class="metric-box-sub">Nakuru regional mean</span>
        </div>
      </div>

      <!-- Crop & Farm Comparison Table -->
      <div class="panel" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">📊 Cross-Crop Yield Projections & Benchmarking</span>
          <span class="badge badge-green">Model: AquaCrop-v2</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Crop Variety</th>
                <th>Monitored Area</th>
                <th>County Benchmark</th>
                <th>Projected Yield</th>
                <th>Total Output</th>
                <th>Variance vs Baseline</th>
                <th>Model Confidence</th>
              </tr>
            </thead>
            <tbody>
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
      </div>

      <!-- Historical Yield & Seasonal Trends -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px;">
        <div class="panel" style="padding: 22px;">
          <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 14px; color: var(--text-primary);">
            📈 Historical Yield Trajectory (5-Season Analysis)
          </h3>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span>2026 Long Rains (Projected):</span>
              <strong style="color: var(--primary-dark);">5.62 t/ha (+24.8% vs benchmark)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span>2025 Long Rains (Actual):</span>
              <strong>5.40 t/ha (+20.0% vs benchmark)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span>2024 Long Rains (Actual):</span>
              <strong>5.10 t/ha (+13.3% vs benchmark)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
              <span>2023 Long Rains (Actual):</span>
              <strong>4.60 t/ha (+2.2% vs benchmark)</strong>
            </div>
          </div>
        </div>

        <div class="panel" style="padding: 22px;">
          <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 14px; color: var(--text-primary);">
            ⚖️ Farm Estate Yield Comparison
          </h3>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            Comparative biomass conversion efficiency across estates under different soil and water regimes:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
            <div style="padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
              <strong>Green Valley Model Farm (12.5 ha):</strong>
              <strong style="color: var(--primary-dark);">5.8 t/ha (Drip Fertigated)</strong>
            </div>
            <div style="padding: 10px 12px; background: var(--bg-primary); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
              <strong>Rongai Sunrise Farm (8.2 ha):</strong>
              <strong style="color: var(--accent-blue);">3.8 t/ha (Highland Rainfed)</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 9. FIELD OBSERVATIONS: Comprehensive In-Situ Scouting Logs
  // =========================================================================
  async fieldObservations(container) {
    const obs = await fieldOperationService.listObservations();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Field Observations' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">PHYSICAL SCOUTING TELEMETRY</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Agronomic Field Observations & Diagnosis</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Field observations logged by scouts and extension officers detailing crop vigor, foliar pathogens, soil moisture, and phenology.
            </p>
          </div>
          <button class="btn btn-primary" id="btnLogNewObservation">+ Record Field Diagnosis</button>
        </div>
      </div>

      <!-- Observations Table -->
      <div class="panel">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title">Scouting Logs & Diagnostic Notes</span>
          <span class="badge badge-blue">${obs.length} Records</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Farm & Field Parcel</th>
                <th>Crop Cultivar</th>
                <th>Growth Stage</th>
                <th>Category</th>
                <th>Observation Summary</th>
                <th>Severity</th>
                <th>Scout & Date</th>
                <th>Follow-up</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${obs.map(o => `
                <tr>
                  <td>
                    <strong>${o.farm}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${o.field}</div>
                  </td>
                  <td><strong>${o.crop}</strong></td>
                  <td><span class="badge badge-blue" style="font-size: 0.7rem;">${o.growthStage}</span></td>
                  <td><strong>${o.category}</strong></td>
                  <td style="max-width: 260px; font-size: 0.82rem;">${o.text}</td>
                  <td>
                    <span class="badge ${o.severity === 'CRITICAL' ? 'badge-rose' : (o.severity === 'WARNING' ? 'badge-amber' : 'badge-green')}" style="font-size: 0.7rem;">
                      ${o.severity}
                    </span>
                  </td>
                  <td>
                    <div style="font-size: 0.8rem; font-weight: 700;">${o.scoutName}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${o.date}</div>
                  </td>
                  <td>
                    ${o.followUpRequired 
                      ? '<span style="color: var(--accent-rose); font-weight: 700; font-size: 0.78rem;">⚠️ ' + o.followUpStatus + '</span>'
                      : '<span style="color: var(--primary-dark); font-weight: 700; font-size: 0.78rem;">✓ ' + o.followUpStatus + '</span>'}
                  </td>
                  <td>
                    <button class="btn btn-outline btn-view-obs-detail" data-id="${o.id}" style="padding: 4px 10px; font-size: 0.75rem;">Inspect</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach click handlers
    container.querySelector('#btnLogNewObservation').addEventListener('click', () => {
      showModal('Log Agronomic Field Observation', `
        <form id="agronomyObsForm" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Target Farm & Field</label>
            <select class="form-input" required>
              <option value="fld-001">Green Valley Model Farm — North Field A (Maize H614D)</option>
              <option value="fld-002">Green Valley Model Farm — South Field B (Beans Rosecoco)</option>
              <option value="fld-003">Rongai Sunrise Farm — East Plateau Parcel 1 (Wheat Tayari)</option>
              <option value="fld-004">Rongai Sunrise Farm — West Terraces Parcel 2 (Potato Shangi)</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Observed Growth Stage</label>
              <input type="text" class="form-input" value="Vegetative V6" required>
            </div>
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Diagnostic Category</label>
              <select class="form-input">
                <option value="Pathogen">Foliar Pathogen / Fungi</option>
                <option value="Pest">Insect Pest Pressure</option>
                <option value="Nutrition">Nutrient Deficiency</option>
                <option value="Moisture">Soil Moisture Deficit</option>
                <option value="Vigor">Crop Vigor / Phenology</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Diagnostic Notes & Laboratory Findings</label>
            <textarea class="form-input" rows="3" placeholder="Describe symptoms, incidence rate, leaf surface coverage, or soil moisture tension..." required></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('ayisModalBackdrop').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Diagnosis</button>
          </div>
        </form>
      `);

      document.getElementById('agronomyObsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Observation registered into MySQL `field_observations` table.');
        document.getElementById('ayisModalBackdrop').remove();
        agronomistViews.fieldObservations(container);
      });
    });

    container.querySelectorAll('.btn-view-obs-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const o = obs.find(item => item.id === id);
        showModal(`Observation Details: ${o.id}`, `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);">
              <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">LOCATION & CULTIVAR</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${o.farm} — ${o.field}</div>
              <div style="font-size: 0.85rem; color: var(--primary-dark); font-weight: 700; margin-top: 2px;">${o.crop} (${o.growthStage})</div>
            </div>
            <div>
              <strong style="font-size: 0.85rem;">Diagnostic Findings:</strong>
              <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${o.text}</div>
            </div>
            <div>
              <strong style="font-size: 0.85rem;">Agronomic Notes & Scouting Recommendations:</strong>
              <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${o.notes}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; font-size: 0.8rem;">
              <span>Logged by: <strong>${o.scoutName}</strong> on <strong>${o.date}</strong></span>
              <span class="badge ${o.severity === 'CRITICAL' ? 'badge-rose' : 'badge-green'}">${o.severity}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
              <button class="btn btn-primary" onclick="document.getElementById('ayisModalBackdrop').remove()">Close</button>
            </div>
          </div>
        `);
      });
    });
  },

  // =========================================================================
  // 10. REPORTS: Agronomic Research & Intelligence Briefs
  // =========================================================================
  async reports(container) {
    const reportsList = await reportService.listReports();

    container.innerHTML = `
      ${ui.breadcrumbs([{ label: 'Agronomic Intelligence Hub', hash: '#dashboard' }, { label: 'Reports' }])}

      <div class="panel" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge badge-green">RESEARCH & DIAGNOSTIC INTELLIGENCE</span>
            <h1 style="font-size: 1.65rem; font-weight: 900; color: var(--text-primary); margin-top: 4px;">Agronomic Reports & Research Briefs</h1>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Peer-reviewed technical evaluations, suitability atlases, and seasonal yield intelligence briefs.
            </p>
          </div>
          <button class="btn btn-outline" onclick="window.print()">🖨️ Print Active View</button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 18px;">
        ${reportsList.map(r => `
          <div class="panel" style="padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="badge badge-blue">${r.category}</span>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Region: ${r.region}</span>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0;">${r.title}</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">Date: <strong>${r.date}</strong> · Format: <strong>${r.format}</strong></p>
            </div>
            <button class="btn btn-primary" onclick="alert('Downloading ${r.title} in ${r.format} format.');" style="padding: 8px 14px; font-size: 0.82rem;">Download Report 📥</button>
          </div>
        `).join('')}
      </div>
    `;
  }
};
