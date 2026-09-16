import { reportService, farmService, cropService, authService } from '../services/index.js';
import { chartComponents } from './chartComponents.js';
import { ZIM_FARMS, ZIM_GEO_REGIONS } from '../geo/zimGeoData.js';
import { ui } from './ui.js';

export const reportBuilderComponent = {
  state: {
    step: 1,
    selectedType: 'yield_forecast',
    selectedRegion: 'Natural Region II (Highveld)',
    selectedFarm: 'all',
    selectedCrop: 'White Maize (SC719)',
    dateRange: 'Last 30 Days',
    customStartDate: '2026-08-15',
    customEndDate: '2026-09-15',
    metrics: ['yield', 'rainfall', 'suitability', 'soil_ph', 'risk'],
    reportData: null,
    isGenerating: false,
    exportStatus: null
  },

  // Available crops in system
  crops: [
    { id: 'maize_sc719', name: 'White Maize (SC719)', category: 'Grain' },
    { id: 'winter_wheat', name: 'Winter Wheat (SC Sky)', category: 'Grain' },
    { id: 'seed_potato', name: 'Seed Potato (BP1)', category: 'Tuber' },
    { id: 'virginia_tobacco', name: 'Virginia Tobacco (Kutsaga 51E)', category: 'Commercial' },
    { id: 'soybeans', name: 'Soybeans (SC Squire)', category: 'Legume' },
    { id: 'arabica_coffee', name: 'Arabica Coffee (Catimor 129)', category: 'Beverage' },
    { id: 'hort_blueberries', name: 'Horticultural Blueberries', category: 'Horticulture' },
    { id: 'sugarcane', name: 'Commercial Sugarcane (NCo376)', category: 'Commercial' }
  ],

  // Available metrics to select
  metricOptions: [
    { id: 'yield', label: 'Mean Projected Yield (kg/ha)', icon: '📈', desc: 'Predicted biomass & grain harvest vs historical benchmark' },
    { id: 'rainfall', label: 'Precipitation & Rainfall Anomaly (mm)', icon: '🌦️', desc: 'Recorded rainfall vs 30-year climatological normal' },
    { id: 'suitability', label: 'Agro-Ecological Suitability Score (%)', icon: '🧠', desc: 'FAO thermal & moisture suitability class (S1, S2, N)' },
    { id: 'soil_ph', label: 'Soil Acidity & Nutrient Indices (pH)', icon: '🧪', desc: 'Topsoil pH, cation exchange capacity, moisture buffer' },
    { id: 'risk', label: 'Pathogen & Climate Risk Index', icon: '⚠️', desc: 'Fall armyworm, rust, dry spell vulnerability ratings' },
    { id: 'evapotranspiration', label: 'Reference Evapotranspiration (ETo)', icon: '☀️', desc: 'Vapor pressure deficit & crop water balance demand' },
    { id: 'ndvi_vigor', label: 'NDVI Canopy Vigor & Greenness', icon: '🌿', desc: 'Remote sensing vegetative index across parcels' }
  ],

  // Quick date ranges
  dateRanges: [
    { id: 'Last 7 Days', label: 'Last 7 Days', desc: 'Scouting & recent weather' },
    { id: 'Last 30 Days', label: 'Last 30 Days', desc: 'Recent vegetative cycle' },
    { id: 'Season to Date', label: 'Season to Date (2026 Long Rains)', desc: 'Full active season tracking' },
    { id: 'Annual 2026', label: 'Annual 2026 / 12 Months', desc: 'Strategic planning & rotation' },
    { id: 'Custom', label: 'Custom Date Range', desc: 'Specify exact calendar bounds' }
  ],

  render(container) {
    if (!container) return;

    // Check user permission
    const currentRole = authService.getCurrentRole();
    const isRestricted = currentRole === 'farmer';

    if (isRestricted) {
      container.innerHTML = `
        <div class="panel" style="padding: 40px; text-align: center; max-width: 600px; margin: 40px auto;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🔐</div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
            Access Restricted to Platform Analysts & Managers
          </h2>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px;">
            Individual farmers have access to their personalized <strong>Yield Estimates</strong> and <strong>Weather Alerts</strong> in their dedicated dashboard. Custom multi-farm report generation requires Agronomist, Extension Officer, Farm Manager, or Super Admin credentials.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-primary" onclick="location.hash='#yield'">View My Yield Estimates</button>
            <button class="btn btn-outline" onclick="location.hash='#dashboard'">Return to Dashboard</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div id="reportBuilderRoot">
        <!-- Header & Breadcrumbs -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="status-dot"></span>
                <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary-dark); text-transform: uppercase; letter-spacing: 0.5px;">
                  Agricultural Intelligence Reporting Engine
                </span>
              </div>
              <h1 style="font-size: 1.7rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">
                Reports & Analytics Command
              </h1>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">
                Generate customized multi-variable agricultural reports, visual comparisons, and telemetry downloads.
              </p>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="btn btn-outline" id="btnToggleCatalogue" style="font-size: 0.85rem;">
                📁 Reports Directory
              </button>
              <button class="btn btn-primary" id="btnResetBuilder" style="font-size: 0.85rem;">
                ✨ New Custom Report
              </button>
            </div>
          </div>
        </div>

        <!-- 7-Step Progression Stepper Indicator -->
        <div class="panel" style="padding: 16px 20px; margin-bottom: 24px; background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; overflow-x: auto; padding-bottom: 4px;">
            ${[
              { num: 1, label: 'Report Type', key: 'type' },
              { num: 2, label: 'Farm / Region', key: 'region' },
              { num: 3, label: 'Crop Cultivar', key: 'crop' },
              { num: 4, label: 'Date Range', key: 'date' },
              { num: 5, label: 'Metrics', key: 'metrics' },
              { num: 6, label: 'Live Preview', key: 'preview' },
              { num: 7, label: 'Export / State', key: 'export' }
            ].map(s => {
              const isActive = this.state.step === s.num;
              const isDone = this.state.step > s.num;
              return `
                <div class="stepper-step" data-step="${s.num}" style="display: flex; align-items: center; gap: 8px; cursor: pointer; opacity: ${this.state.step >= s.num ? '1' : '0.45'}; transition: all 0.2s;">
                  <div style="
                    width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800;
                    background: ${isActive ? 'var(--primary)' : isDone ? '#10b981' : '#e2e8f0'};
                    color: ${isActive || isDone ? '#ffffff' : 'var(--text-muted)'};
                  ">
                    ${isDone ? '✓' : s.num}
                  </div>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Step ${s.num}</span>
                    <strong style="font-size: 0.8rem; color: ${isActive ? 'var(--primary)' : 'var(--text-primary)'}; white-space: nowrap;">${s.label}</strong>
                  </div>
                  ${s.num < 7 ? '<span style="color: #cbd5e1; font-weight: bold; margin-left: 6px;">→</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Main Step Workspace Container -->
        <div id="stepWorkspace"></div>
      </div>
    `;

    this.renderCurrentStep();
    this.attachHeaderEvents();
  },

  attachHeaderEvents() {
    const btnToggleCatalogue = document.getElementById('btnToggleCatalogue');
    if (btnToggleCatalogue) {
      btnToggleCatalogue.addEventListener('click', () => {
        this.renderReportsCatalogue();
      });
    }

    const btnResetBuilder = document.getElementById('btnResetBuilder');
    if (btnResetBuilder) {
      btnResetBuilder.addEventListener('click', () => {
        this.state.step = 1;
        this.renderCurrentStep();
      });
    }

    // Stepper header click to jump back
    document.querySelectorAll('.stepper-step').forEach(el => {
      el.addEventListener('click', () => {
        const targetStep = parseInt(el.getAttribute('data-step'), 10);
        if (targetStep < this.state.step || this.state.reportData) {
          this.state.step = targetStep;
          this.renderCurrentStep();
        }
      });
    });
  },

  renderCurrentStep() {
    const workspace = document.getElementById('stepWorkspace');
    if (!workspace) return;

    switch (this.state.step) {
      case 1:
        this.renderStep1(workspace);
        break;
      case 2:
        this.renderStep2(workspace);
        break;
      case 3:
        this.renderStep3(workspace);
        break;
      case 4:
        this.renderStep4(workspace);
        break;
      case 5:
        this.renderStep5(workspace);
        break;
      case 6:
        this.renderStep6(workspace);
        break;
      case 7:
        this.renderStep7(workspace);
        break;
      default:
        this.renderStep1(workspace);
    }
  },

  /**
   * STEP 1: SELECT REPORT TYPE (10 Required Types)
   */
  renderStep1(container) {
    const types = reportService.getReportTypes();

    container.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Step 1: Select Agricultural Report Type
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Choose from 10 validated analytical paradigms designed for agronomic intelligence.
            </p>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 4px 10px; border-radius: 9999px;">
            10 Standard Report Types Available
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
          ${types.map(t => {
            const isSelected = this.state.selectedType === t.id;
            return `
              <div class="report-type-card ${isSelected ? 'selected' : ''}" data-type="${t.id}" style="
                border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                background: ${isSelected ? '#f0fdf4' : '#ffffff'};
                border-radius: var(--radius-md);
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
              ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                  <div style="font-size: 1.6rem; width: 40px; height: 40px; border-radius: var(--radius-sm); background: #f8fafc; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;">
                    ${t.icon}
                  </div>
                  <div>
                    <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin: 0;">${t.name}</h3>
                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">${t.category}</span>
                  </div>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin: 0;">
                  ${t.description}
                </p>
                ${isSelected ? `
                  <div style="position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                    ✓
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-primary" id="btnStep1Next" style="padding: 10px 24px;">
            Continue to Step 2: Farm & Region →
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.report-type-card').forEach(card => {
      card.addEventListener('click', () => {
        this.state.selectedType = card.getAttribute('data-type');
        this.renderStep1(container);
      });
    });

    document.getElementById('btnStep1Next')?.addEventListener('click', () => {
      this.state.step = 2;
      this.renderCurrentStep();
    });
  },

  /**
   * STEP 2: SELECT FARM / REGION
   */
  renderStep2(container) {
    container.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Step 2: Select Farm Holding or Agro-Ecological Region
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Filter analytical telemetry by geographic natural region (I-V) or specific estate boundary.
            </p>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Step 2 of 7</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          <!-- Region Selection -->
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
              Zimbabwe Natural Agro-Ecological Region:
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${ZIM_GEO_REGIONS.map(reg => {
                const isSelected = this.state.selectedRegion === reg.name;
                return `
                  <label style="
                    display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                    border-radius: var(--radius-sm); background: ${isSelected ? '#f0fdf4' : '#ffffff'}; cursor: pointer;
                  ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <input type="radio" name="selRegion" value="${reg.name}" ${isSelected ? 'checked' : ''} style="accent-color: var(--primary);">
                      <div>
                        <strong style="font-size: 0.85rem; color: var(--text-primary);">${reg.name}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${reg.description} · ${reg.rainfallRange}</div>
                      </div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e2e8f0; color: #334155;">
                      ${reg.id}
                    </span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Specific Farm Filter -->
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
              Specific Commercial / Smallholder Farm Holding:
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label style="
                display: flex; align-items: center; gap: 10px; padding: 12px; border: 1.5px solid ${this.state.selectedFarm === 'all' ? 'var(--primary)' : 'var(--border-color)'};
                border-radius: var(--radius-sm); background: ${this.state.selectedFarm === 'all' ? '#f0fdf4' : '#ffffff'}; cursor: pointer;
              ">
                <input type="radio" name="selFarm" value="all" ${this.state.selectedFarm === 'all' ? 'checked' : ''} style="accent-color: var(--primary);">
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary);">All Farms in Selected Region (Aggregated Matrix)</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Synthesize cross-estate performance, regional benchmarking</div>
                </div>
              </label>

              ${ZIM_FARMS.map(farm => {
                const isSelected = this.state.selectedFarm === farm.id;
                return `
                  <label style="
                    display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                    border-radius: var(--radius-sm); background: ${isSelected ? '#f0fdf4' : '#ffffff'}; cursor: pointer;
                  ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <input type="radio" name="selFarm" value="${farm.id}" ${isSelected ? 'checked' : ''} style="accent-color: var(--primary);">
                      <div>
                        <strong style="font-size: 0.85rem; color: var(--text-primary);">${farm.name}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${farm.province} · ${farm.areaHa} ha · Primary: ${farm.primaryCrop}</div>
                      </div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${farm.riskLevel === 'HIGH' ? '#fee2e2' : farm.riskLevel === 'MEDIUM' ? '#fef3c7' : '#dcfce7'}; color: ${farm.riskLevel === 'HIGH' ? '#991b1b' : farm.riskLevel === 'MEDIUM' ? '#92400e' : '#166534'};">
                      ${farm.riskLevel} RISK
                    </span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-outline" id="btnStep2Prev">← Back to Report Type</button>
          <button class="btn btn-primary" id="btnStep2Next">Continue to Step 3: Crop Selection →</button>
        </div>
      </div>
    `;

    container.querySelectorAll('input[name="selRegion"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.selectedRegion = e.target.value;
      });
    });

    container.querySelectorAll('input[name="selFarm"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.selectedFarm = e.target.value;
      });
    });

    document.getElementById('btnStep2Prev')?.addEventListener('click', () => {
      this.state.step = 1;
      this.renderCurrentStep();
    });

    document.getElementById('btnStep2Next')?.addEventListener('click', () => {
      this.state.step = 3;
      this.renderCurrentStep();
    });
  },

  /**
   * STEP 3: SELECT CROP
   */
  renderStep3(container) {
    container.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Step 3: Select Target Crop or Cultivar Group
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Isolate phenological requirements, GDD thresholds, and specific harvest parameters.
            </p>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Step 3 of 7</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-bottom: 24px;">
          <div class="crop-select-card ${this.state.selectedCrop === 'All Crops (Cross-Commodity)' ? 'selected' : ''}" data-crop="All Crops (Cross-Commodity)" style="
            border: 2px solid ${this.state.selectedCrop === 'All Crops (Cross-Commodity)' ? 'var(--primary)' : 'var(--border-color)'};
            background: ${this.state.selectedCrop === 'All Crops (Cross-Commodity)' ? '#f0fdf4' : '#ffffff'};
            border-radius: var(--radius-md); padding: 14px; cursor: pointer;
          ">
            <div style="font-size: 1.5rem; margin-bottom: 6px;">🌾</div>
            <strong style="font-size: 0.9rem; color: var(--text-primary); display: block;">All Crops (Cross-Commodity)</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Comparative harvest & multi-crop suitability overview</span>
          </div>

          ${this.crops.map(c => {
            const isSelected = this.state.selectedCrop === c.name;
            return `
              <div class="crop-select-card ${isSelected ? 'selected' : ''}" data-crop="${c.name}" style="
                border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                background: ${isSelected ? '#f0fdf4' : '#ffffff'};
                border-radius: var(--radius-md); padding: 14px; cursor: pointer;
              ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                  <span style="font-size: 1.5rem;">🌱</span>
                  <span style="font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px;">
                    ${c.category}
                  </span>
                </div>
                <strong style="font-size: 0.9rem; color: var(--text-primary); display: block;">${c.name}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Specific yield benchmark and agromet tolerances</span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-outline" id="btnStep3Prev">← Back to Farm / Region</button>
          <button class="btn btn-primary" id="btnStep3Next">Continue to Step 4: Date Range →</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.crop-select-card').forEach(card => {
      card.addEventListener('click', () => {
        this.state.selectedCrop = card.getAttribute('data-crop');
        this.renderStep3(container);
      });
    });

    document.getElementById('btnStep3Prev')?.addEventListener('click', () => {
      this.state.step = 2;
      this.renderCurrentStep();
    });

    document.getElementById('btnStep3Next')?.addEventListener('click', () => {
      this.state.step = 4;
      this.renderCurrentStep();
    });
  },

  /**
   * STEP 4: SELECT DATE RANGE
   */
  renderStep4(container) {
    container.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Step 4: Select Historical & Predictive Date Range
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Specify the temporal window for weather aggregation, scouting logs, and yield projection.
            </p>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Step 4 of 7</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px;">
          ${this.dateRanges.map(dr => {
            const isSelected = this.state.dateRange === dr.id;
            return `
              <div class="date-range-card ${isSelected ? 'selected' : ''}" data-range="${dr.id}" style="
                border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                background: ${isSelected ? '#f0fdf4' : '#ffffff'};
                border-radius: var(--radius-md); padding: 14px; cursor: pointer;
              ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-size: 1.2rem;">📅</span>
                  <strong style="font-size: 0.9rem; color: var(--text-primary);">${dr.label}</strong>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${dr.desc}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Custom Calendar Bounds (Enabled when Custom is chosen) -->
        <div class="panel" style="padding: 16px; background: #f8fafc; border: 1px dashed var(--border-color); margin-bottom: 24px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">
            Custom Temporal Bounds (C# DateTime Compatible):
          </div>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">Start Date</label>
              <input type="date" id="inpStartDate" class="form-input" value="${this.state.customStartDate}" style="width: 100%;">
            </div>
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">End Date</label>
              <input type="date" id="inpEndDate" class="form-input" value="${this.state.customEndDate}" style="width: 100%;">
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-outline" id="btnStep4Prev">← Back to Crop Selection</button>
          <button class="btn btn-primary" id="btnStep4Next">Continue to Step 5: Select Metrics →</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.date-range-card').forEach(card => {
      card.addEventListener('click', () => {
        this.state.dateRange = card.getAttribute('data-range');
        this.renderStep4(container);
      });
    });

    document.getElementById('inpStartDate')?.addEventListener('change', (e) => {
      this.state.customStartDate = e.target.value;
    });

    document.getElementById('inpEndDate')?.addEventListener('change', (e) => {
      this.state.customEndDate = e.target.value;
    });

    document.getElementById('btnStep4Prev')?.addEventListener('click', () => {
      this.state.step = 3;
      this.renderCurrentStep();
    });

    document.getElementById('btnStep4Next')?.addEventListener('click', () => {
      this.state.step = 5;
      this.renderCurrentStep();
    });
  },

  /**
   * STEP 5: SELECT METRICS
   */
  renderStep5(container) {
    container.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Step 5: Select Agricultural Telemetry Metrics
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Select the data variables to include in the visual charts, KPI indicator cards, and export tables.
            </p>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Step 5 of 7</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-bottom: 24px;">
          ${this.metricOptions.map(m => {
            const isChecked = this.state.metrics.includes(m.id);
            return `
              <label class="metric-checkbox-card" style="
                display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 2px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'};
                border-radius: var(--radius-md); background: ${isChecked ? '#f0fdf4' : '#ffffff'}; cursor: pointer; transition: all 0.2s;
              ">
                <input type="checkbox" class="metric-cb" value="${m.id}" ${isChecked ? 'checked' : ''} style="margin-top: 3px; accent-color: var(--primary);">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>${m.icon}</span>
                    <strong style="font-size: 0.875rem; color: var(--text-primary);">${m.label}</strong>
                  </div>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 0 0; line-height: 1.4;">
                    ${m.desc}
                  </p>
                </div>
              </label>
            `;
          }).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-outline" id="btnStep5Prev">← Back to Date Range</button>
          <button class="btn btn-primary" id="btnStep5Next" style="padding: 10px 24px;">
            ⚡ Generate & Preview Report (Step 6) →
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.metric-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const val = cb.value;
        if (cb.checked) {
          if (!this.state.metrics.includes(val)) this.state.metrics.push(val);
        } else {
          this.state.metrics = this.state.metrics.filter(m => m !== val);
        }
        this.renderStep5(container);
      });
    });

    document.getElementById('btnStep5Prev')?.addEventListener('click', () => {
      this.state.step = 4;
      this.renderCurrentStep();
    });

    document.getElementById('btnStep5Next')?.addEventListener('click', async () => {
      this.state.step = 6;
      this.renderCurrentStep();
    });
  },

  /**
   * STEP 6: PREVIEW REPORT (Answers practical agricultural questions with reusable charts)
   */
  async renderStep6(container) {
    container.innerHTML = `
      <div class="panel" style="padding: 40px; text-align: center;" aria-busy="true">
        <div style="font-size: 2.5rem; margin-bottom: 12px; animation: pulse 1s infinite;">🌱</div>
        <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">
          Synthesizing Agricultural Intelligence Report...
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
          Aggregating agro-climatic readings, running suitability cross-tabulation, and preparing C# report payload.
        </p>
      </div>
    `;

    // Fetch report data from reportService (designed for C# API consumption)
    const report = await reportService.generateReport({
      reportType: this.state.selectedType,
      region: this.state.selectedRegion,
      farm: this.state.selectedFarm,
      crop: this.state.selectedCrop,
      dateRange: this.state.dateRange,
      metrics: this.state.metrics
    });

    this.state.reportData = report;

    container.innerHTML = `
      <div style="animation: fadeIn 0.25s ease;">
        <!-- Top Toolbar with Actions -->
        <div class="panel" style="padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.4rem;">📄</span>
            <div>
              <div style="font-size: 0.75rem; font-weight: 800; color: var(--primary); text-transform: uppercase;">
                Step 6: Live Report Preview
              </div>
              <strong style="font-size: 1.1rem; color: var(--text-primary);">${report.metadata.title}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" id="btnStep6Prev">← Edit Parameters (Step 5)</button>
            <button class="btn btn-primary" id="btnStep6Next">Proceed to Export / Download (Step 7) →</button>
          </div>
        </div>

        <!-- Printable Report Canvas Shell -->
        <div class="printable-report" id="reportPrintArea" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Report Header Banner -->
          <div style="border-bottom: 2px solid var(--border-color); padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-weight: 900; color: var(--primary-dark); font-size: 0.85rem; letter-spacing: 0.5px;">AYIS · AGRICULTURAL YIELD INTELLIGENCE PLATFORM</span>
                <span style="background: #e2e8f0; color: #475569; font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">C# BACKEND VERIFIED</span>
              </div>
              <h1 style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin: 0 0 6px 0;">
                ${report.metadata.title}
              </h1>
              <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 16px; flex-wrap: wrap;">
                <span><strong>Region:</strong> ${report.metadata.region}</span>
                <span><strong>Holding:</strong> ${report.metadata.farm === 'all' ? 'All Regional Holdings' : report.metadata.farm}</span>
                <span><strong>Crop:</strong> ${report.metadata.crop}</span>
                <span><strong>Period:</strong> ${report.metadata.dateRange}</span>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Generated: ${report.metadata.generatedAt}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Report Ref: <code>${report.metadata.id}</code></div>
              <div style="margin-top: 6px;">
                <span style="font-size: 0.75rem; font-weight: 800; color: #166534; background: #dcfce7; padding: 3px 8px; border-radius: 9999px;">
                  Confidence: ${report.metadata.confidenceScore}%
                </span>
              </div>
            </div>
          </div>

          <!-- Section 1: KPI Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px;">
            ${report.kpis.map(kpi => `
              <div class="panel" style="padding: 16px; border-left: 4px solid ${kpi.positive ? 'var(--primary)' : '#f59e0b'}; background: #f8fafc;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${kpi.label}</span>
                <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary); margin: 4px 0;">${kpi.value}</div>
                <span style="font-size: 0.75rem; font-weight: 700; color: ${kpi.positive ? '#166534' : '#b45309'};">
                  ${kpi.change}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Practical Questions & Reusable Charts Section -->
          <div style="margin-bottom: 32px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: var(--primary-dark); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
              Agronomic Inquiries & Empirical Evidence
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <!-- Practical Question 1: How has rainfall changed? (Line Chart) -->
              <div class="panel" style="padding: 20px; background: #ffffff;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 0.7rem; font-weight: 800; color: #0284c7; text-transform: uppercase;">Practical Question 1</div>
                  <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 2px 0 4px 0;">
                    ${report.practicalQuestions.rainfallQuestion}
                  </h3>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
                    Bi-weekly recorded precipitation vs 30-year climatological normal baseline.
                  </p>
                </div>
                <div style="height: 220px; width: 100%; position: relative;">
                  <canvas id="chartRainfallTrend" style="width: 100%; height: 100%;"></canvas>
                </div>
              </div>

              <!-- Practical Question 2: Which crop has the highest expected yield? (Bar Chart) -->
              <div class="panel" style="padding: 20px; background: #ffffff;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 0.7rem; font-weight: 800; color: #059669; text-transform: uppercase;">Practical Question 2</div>
                  <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 2px 0 4px 0;">
                    ${report.practicalQuestions.yieldQuestion}
                  </h3>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
                    Projected mean yield (kg/ha) across evaluated cultivar groups.
                  </p>
                </div>
                <div style="height: 220px; width: 100%; position: relative;">
                  <canvas id="chartCropYieldRanking" style="width: 100%; height: 100%;"></canvas>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <!-- Practical Question 3: How does estimated yield compare with historical production? (Comparison Chart) -->
              <div class="panel" style="padding: 20px; background: #ffffff;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 0.7rem; font-weight: 800; color: #d97706; text-transform: uppercase;">Practical Question 3</div>
                  <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 2px 0 4px 0;">
                    ${report.practicalQuestions.comparisonQuestion}
                  </h3>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
                    Side-by-side variance analysis: 5-Year Historic Mean vs 2026 Model Forecast.
                  </p>
                </div>
                <div style="height: 220px; width: 100%; position: relative;">
                  <canvas id="chartHistoricalComparison" style="width: 100%; height: 100%;"></canvas>
                </div>
              </div>

              <!-- Practical Question 4: Crop Cultivated Area Distribution (Donut Chart) -->
              <div class="panel" style="padding: 20px; background: #ffffff;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 0.7rem; font-weight: 800; color: #8b5cf6; text-transform: uppercase;">Crop Land Allocation</div>
                  <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 2px 0 4px 0;">
                    Hectares Cultivated by Strategic Commodity
                  </h3>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
                    Relative spatial distribution across verified farm holdings.
                  </p>
                </div>
                <div style="height: 220px; width: 100%; position: relative;">
                  <canvas id="chartCropDistributionDonut" style="width: 100%; height: 100%;"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Telemetry Data Table -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: var(--primary-dark); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
              Estate-Level Agronomic Observations & Suitability Matrix
            </div>
            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
                    <th style="padding: 10px 12px;">Holding / Estate</th>
                    <th style="padding: 10px 12px;">Target Cultivar</th>
                    <th style="padding: 10px 12px;">Area (ha)</th>
                    <th style="padding: 10px 12px;">Soil pH</th>
                    <th style="padding: 10px 12px;">FAO Suitability</th>
                    <th style="padding: 10px 12px;">Yield Forecast</th>
                    <th style="padding: 10px 12px;">Risk Rating</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.tableData.map(row => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 12px; font-weight: 700; color: var(--text-primary);">${row.estate}</td>
                      <td style="padding: 10px 12px;">${row.crop}</td>
                      <td style="padding: 10px 12px;">${row.areaHa} ha</td>
                      <td style="padding: 10px 12px;">${row.soilPh}</td>
                      <td style="padding: 10px 12px;">
                        <span style="font-weight: 700; color: #166534; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">
                          ${row.suitability}
                        </span>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 700; color: var(--primary);">${row.yieldEstimate}</td>
                      <td style="padding: 10px 12px;">
                        <span style="font-weight: 700; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${row.riskStatus === 'HIGH' ? '#fee2e2' : row.riskStatus === 'MEDIUM' ? '#fef3c7' : '#e0e7ff'}; color: ${row.riskStatus === 'HIGH' ? '#991b1b' : row.riskStatus === 'MEDIUM' ? '#92400e' : '#3730a3'};">
                          ${row.riskStatus}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Report Footer -->
          <div style="border-top: 1px solid var(--border-color); padding-top: 16px; font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
            <span>Report generated by AYIS Reporting & Analytics Engine (Minimal API Architecture)</span>
            <span>Page 1 of 1 · Verified Telemetry</span>
          </div>
        </div>
      </div>
    `;

    // Render Canvas Charts using reusable chartComponents library
    setTimeout(() => {
      // 1. Line Chart
      chartComponents.renderLineChart('chartRainfallTrend', {
        labels: report.rainfallTrend.labels,
        datasets: report.rainfallTrend.datasets,
        yAxisLabel: 'Precipitation (mm)',
        unit: report.rainfallTrend.unit
      });

      // 2. Bar Chart
      chartComponents.renderBarChart('chartCropYieldRanking', {
        labels: report.cropYieldRanking.labels,
        data: report.cropYieldRanking.data,
        yAxisLabel: 'Yield (kg/ha)',
        unit: report.cropYieldRanking.unit,
        color: report.cropYieldRanking.color
      });

      // 3. Comparison Chart
      chartComponents.renderComparisonChart('chartHistoricalComparison', {
        labels: report.historicalComparison.labels,
        seriesA: report.historicalComparison.seriesA,
        seriesB: report.historicalComparison.seriesB,
        unit: report.historicalComparison.unit
      });

      // 4. Donut Chart
      chartComponents.renderDonutChart('chartCropDistributionDonut', {
        segments: report.cropDistributionDonut.segments
      });
    }, 50);

    document.getElementById('btnStep6Prev')?.addEventListener('click', () => {
      this.state.step = 5;
      this.renderCurrentStep();
    });

    document.getElementById('btnStep6Next')?.addEventListener('click', () => {
      this.state.step = 7;
      this.renderCurrentStep();
    });
  },

  /**
   * STEP 7: EXPORT / DOWNLOAD STATE
   */
  renderStep7(container) {
    const report = this.state.reportData || {
      metadata: { id: 'rep-sample', title: 'Seasonal Agricultural Report', generatedAt: '2026-09-15' }
    };

    container.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Step 7: Export & Download Report State
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Download analytical datasets for offline extension work, printing, or GIS ingestion.
            </p>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: #166534; background: #dcfce7; padding: 4px 10px; border-radius: 9999px;">
            Ready to Export
          </span>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 2rem;">📦</span>
            <div>
              <strong style="font-size: 1.05rem; color: var(--text-primary);">${report.metadata.title}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Reference ID: <code>${report.metadata.id}</code> · Size: ~340 KB · Ready for C# serialization
              </div>
            </div>
          </div>
        </div>

        <!-- Export Options Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="export-card" id="btnExportPdf" style="
            border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; cursor: pointer; transition: all 0.2s; background: #ffffff;
          ">
            <div style="font-size: 2rem; margin-bottom: 8px;">📑</div>
            <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">PDF Executive Brief</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 12px 0;">
              High-resolution vector document ready for ministerial briefings and print dispatch.
            </p>
            <button class="btn btn-outline" style="width: 100%; font-size: 0.8rem;">Download PDF</button>
          </div>

          <div class="export-card" id="btnExportCsv" style="
            border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; cursor: pointer; transition: all 0.2s; background: #ffffff;
          ">
            <div style="font-size: 2rem; margin-bottom: 8px;">📊</div>
            <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">CSV Telemetry Dataset</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 12px 0;">
              Raw tabular data rows ready for Excel, R, Python, or external statistical analysis.
            </p>
            <button class="btn btn-outline" style="width: 100%; font-size: 0.8rem;">Download CSV</button>
          </div>

          <div class="export-card" id="btnExportGeoJson" style="
            border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; cursor: pointer; transition: all 0.2s; background: #ffffff;
          ">
            <div style="font-size: 2rem; margin-bottom: 8px;">🌍</div>
            <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">GeoJSON Spatial Boundaries</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 12px 0;">
              WGS84 EPSG:4326 polygon coordinates with embedded suitability attributes for QGIS/ArcGIS.
            </p>
            <button class="btn btn-outline" style="width: 100%; font-size: 0.8rem;">Download GeoJSON</button>
          </div>

          <div class="export-card" id="btnPrintReport" style="
            border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; cursor: pointer; transition: all 0.2s; background: #ffffff;
          ">
            <div style="font-size: 2rem; margin-bottom: 8px;">🖨️</div>
            <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">Direct Browser Print</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 12px 0;">
              Formatted print styling with automatic chart embedding and page-break optimization.
            </p>
            <button class="btn btn-outline" style="width: 100%; font-size: 0.8rem;">Print Report</button>
          </div>
        </div>

        <div id="exportStatusArea" style="margin-bottom: 20px;"></div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-outline" id="btnStep7Prev">← Back to Preview (Step 6)</button>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-outline" id="btnRestartWizard">✨ Create Another Report</button>
            <button class="btn btn-primary" onclick="location.hash='#dashboard'">Return to National Dashboard</button>
          </div>
        </div>
      </div>
    `;

    const statusArea = document.getElementById('exportStatusArea');

    const handleDownload = (formatName, mimeType, filename, content) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (statusArea) {
        statusArea.innerHTML = `
          <div style="padding: 12px 16px; background: #dcfce7; border: 1px solid #86efac; border-radius: var(--radius-sm); color: #166534; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
            <span>✓</span>
            <span>Successfully exported <strong>${filename}</strong> (${formatName} format). Ready for field distribution.</span>
          </div>
        `;
      }
    };

    document.getElementById('btnExportPdf')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnExportCsv')?.addEventListener('click', () => {
      const csvHeader = 'Estate,Crop,AreaHa,SoilPh,Suitability,YieldEstimateKgHa,Risk\n';
      const csvRows = (report.tableData || []).map(r => 
        `"${r.estate}","${r.crop}",${r.areaHa},${r.soilPh},"${r.suitability}","${r.yieldEstimate}","${r.riskStatus}"`
      ).join('\n');
      handleDownload('CSV', 'text/csv', `${report.metadata.id}_telemetry.csv`, csvHeader + csvRows);
    });

    document.getElementById('btnExportGeoJson')?.addEventListener('click', () => {
      const geoJson = {
        type: 'FeatureCollection',
        properties: {
          reportId: report.metadata.id,
          title: report.metadata.title,
          generatedAt: report.metadata.generatedAt
        },
        features: ZIM_FARMS.map(f => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [f.lon, f.lat]
          },
          properties: {
            farmId: f.id,
            name: f.name,
            province: f.province,
            areaHa: f.areaHa,
            primaryCrop: f.primaryCrop,
            riskLevel: f.riskLevel
          }
        }))
      };
      handleDownload('GeoJSON', 'application/geo+json', `${report.metadata.id}_spatial.geojson`, JSON.stringify(geoJson, null, 2));
    });

    document.getElementById('btnStep7Prev')?.addEventListener('click', () => {
      this.state.step = 6;
      this.renderCurrentStep();
    });

    document.getElementById('btnRestartWizard')?.addEventListener('click', () => {
      this.state.step = 1;
      this.renderCurrentStep();
    });
  },

  /**
   * DIRECTORY / CATALOGUE OF READY-MADE REPORTS
   */
  async renderReportsCatalogue() {
    const workspace = document.getElementById('stepWorkspace');
    if (!workspace) return;

    workspace.innerHTML = `
      <div class="panel" style="padding: 24px; animation: fadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              Generated Reports & Historical Intelligence Archive
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              Access previously compiled agricultural briefs, seasonal forecasts, and spatial digests.
            </p>
          </div>
          <button class="btn btn-primary" id="btnBackToBuilder">
            ⚡ Open 7-Step Report Builder
          </button>
        </div>

        <div id="reportsCatalogueList">
          <div style="padding: 20px; text-align: center; color: var(--text-muted);">Loading catalogue...</div>
        </div>
      </div>
    `;

    document.getElementById('btnBackToBuilder')?.addEventListener('click', () => {
      this.renderCurrentStep();
    });

    const reports = await reportService.listReports();
    const listEl = document.getElementById('reportsCatalogueList');
    if (!listEl) return;

    listEl.innerHTML = `
      <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
              <th style="padding: 12px;">Report Title & Ref</th>
              <th style="padding: 12px;">Type / Category</th>
              <th style="padding: 12px;">Target Region</th>
              <th style="padding: 12px;">Crop Focus</th>
              <th style="padding: 12px;">Date</th>
              <th style="padding: 12px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(rep => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px;">
                  <strong style="color: var(--text-primary); display: block;">${rep.title}</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">ID: <code>${rep.id}</code></span>
                </td>
                <td style="padding: 12px;">
                  <span style="font-weight: 700; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: #e0e7ff; color: #3730a3;">
                    ${rep.category}
                  </span>
                </td>
                <td style="padding: 12px; color: var(--text-muted);">${rep.region}</td>
                <td style="padding: 12px; color: var(--text-muted);">${rep.crop}</td>
                <td style="padding: 12px; color: var(--text-muted);">${rep.date}</td>
                <td style="padding: 12px; text-align: right;">
                  <button class="btn btn-outline btn-view-report" data-id="${rep.id}" data-type="${rep.type}" style="padding: 4px 10px; font-size: 0.75rem;">
                    Inspect Preview
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    listEl.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.state.selectedType = type || 'yield_forecast';
        this.state.step = 6;
        this.renderCurrentStep();
      });
    });
  }
};
