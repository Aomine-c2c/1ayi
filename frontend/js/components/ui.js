/**
 * Reusable Design System Component Library
 * Provides standardized widgets for:
 * Typography, Buttons, Inputs, Selects, Date pickers, Search, Filters, Tables,
 * Cards, Tabs, Badges, Alerts, Notifications, Modals, Drawers, Empty states,
 * Loading states, Skeleton states, Error states, Confirmation dialogs, Pagination,
 * Breadcrumbs, Tooltips, Charts, Map containers, Status indicators.
 */

export const ui = {
  // 1. Breadcrumbs
  breadcrumbs(items = []) {
    return `
      <nav aria-label="Breadcrumb" style="margin-bottom: 16px;">
        <ol style="display: flex; align-items: center; gap: 8px; list-style: none; font-size: 0.8125rem; color: var(--text-muted); padding: 0; margin: 0;">
          ${items.map((item, idx) => `
            <li style="display: flex; align-items: center; gap: 8px;">
              ${idx > 0 ? '<span style="color: var(--border-color); font-weight: bold;" aria-hidden="true">/</span>' : ''}
              ${item.hash 
                ? `<a href="${item.hash}" style="color: var(--primary-dark); font-weight: 700; text-decoration: none;">${item.label}</a>`
                : `<span style="color: var(--text-primary); font-weight: 600;" aria-current="page">${item.label}</span>`
              }
            </li>
          `).join('')}
        </ol>
      </nav>
    `;
  },

  // 2. Search & Filter Bar
  searchAndFilterBar({ id = 'searchBar', placeholder = 'Search records...', filters = [], onSearch }) {
    return `
      <div id="${id}" class="search-filter-container" style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
        <div style="flex-grow: 1; position: relative; min-width: 260px;">
          <span style="position: absolute; left: 12px; top: 11px; font-size: 0.9rem; color: var(--text-muted);" aria-hidden="true">🔍</span>
          <input 
            type="search" 
            class="form-input search-input" 
            placeholder="${placeholder}" 
            style="padding-left: 36px;"
            aria-label="${placeholder}"
          >
        </div>
        ${filters.map(f => `
          <select class="form-input filter-select" data-filter-key="${f.key || f.label.toLowerCase()}" style="width: auto; min-width: 140px;" aria-label="${f.label}">
            <option value="">${f.label}: All</option>
            ${f.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `).join('')}
        <button class="btn btn-outline btn-reset-filters" type="button">Reset</button>
      </div>
    `;
  },

  // 3. Tab Bar Component
  tabs(tabList = [], activeTab = '', id = 'tabsNav') {
    return `
      <div id="${id}" class="tabs-container" style="display: flex; gap: 4px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;" role="tablist">
        ${tabList.map(tab => `
          <button 
            type="button" 
            role="tab" 
            aria-selected="${tab.id === activeTab ? 'true' : 'false'}"
            class="tab-button"
            data-tab="${tab.id}"
            style="padding: 10px 18px; font-size: 0.875rem; font-weight: 700; background: transparent; border: none; border-bottom: 3px solid ${tab.id === activeTab ? 'var(--primary)' : 'transparent'}; color: ${tab.id === activeTab ? 'var(--primary-dark)' : 'var(--text-muted)'}; cursor: pointer;"
          >
            ${tab.icon ? `<span style="margin-right: 6px;">${tab.icon}</span>` : ''}${tab.label}
          </button>
        `).join('')}
      </div>
    `;
  },

  // 4. Alert Banner
  alert({ type = 'info', title = '', message = '', dismissible = false }) {
    const typeStyles = {
      info: { bg: 'var(--accent-blue-light)', border: '#7dd3fc', text: 'var(--accent-blue)', icon: 'ℹ️' },
      warning: { bg: 'var(--accent-amber-light)', border: '#fcd34d', text: 'var(--accent-amber)', icon: '⚠️' },
      critical: { bg: 'var(--accent-rose-light)', border: '#fda4af', text: 'var(--accent-rose)', icon: '🚨' },
      success: { bg: 'var(--primary-light)', border: '#6ee7b7', text: 'var(--primary-dark)', icon: '✅' }
    };
    const s = typeStyles[type] || typeStyles.info;
    return `
      <div role="alert" style="background: ${s.bg}; border: 1px solid ${s.border}; border-radius: var(--radius-sm); padding: 14px 18px; margin-bottom: 18px; display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 1.2rem; line-height: 1;" aria-hidden="true">${s.icon}</span>
        <div style="flex-grow: 1;">
          ${title ? `<strong style="display: block; color: ${s.text}; font-size: 0.9rem; margin-bottom: 2px;">${title}</strong>` : ''}
          <div style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">${message}</div>
        </div>
        ${dismissible ? `<button type="button" onclick="this.closest('[role=alert]').remove()" style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: ${s.text};" aria-label="Dismiss">&times;</button>` : ''}
      </div>
    `;
  },

  // 5. Skeleton Loading State
  skeletonCard(lines = 3) {
    return `
      <div class="panel" style="padding: 24px; margin-bottom: 16px;" aria-busy="true" aria-label="Loading data">
        <div style="width: 35%; height: 20px; background: #e2e8f0; border-radius: 4px; margin-bottom: 16px; animation: pulse 1.5s infinite;"></div>
        ${Array.from({ length: lines }).map(() => `
          <div style="width: 100%; height: 14px; background: #f1f5f9; border-radius: 4px; margin-bottom: 10px; animation: pulse 1.5s infinite;"></div>
        `).join('')}
      </div>
    `;
  },

  // 6. Empty State
  emptyState({ icon = '🌱', title = 'No records found', message = 'There is currently no telemetry or data logged for this criteria.', actionText = '', onAction = '' }) {
    return `
      <div class="panel" style="padding: 48px 24px; text-align: center;">
        <div style="font-size: 2.8rem; margin-bottom: 12px;" aria-hidden="true">${icon}</div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${title}</h3>
        <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 440px; margin: 8px auto 0;">${message}</p>
        ${actionText ? `<button class="btn btn-primary" style="margin-top: 18px;" onclick="${onAction}">${actionText}</button>` : ''}
      </div>
    `;
  },

  // 7. Error State
  errorState({ title = 'Unable to Load Data', message = 'An error occurred while communicating with the service.', retryHash = '' }) {
    return `
      <div class="panel" style="padding: 40px 24px; text-align: center; border-left: 6px solid var(--accent-rose);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;" aria-hidden="true">⚠️</div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--accent-rose);">${title}</h3>
        <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 460px; margin: 8px auto 16px;">${message}</p>
        <button class="btn btn-outline" onclick="window.location.reload()">Reload Interface</button>
      </div>
    `;
  },

  // 8. Pagination Bar
  pagination({ current = 1, totalPages = 5, onPageChange = '' }) {
    return `
      <div class="pagination-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 1px solid var(--border-subtle); margin-top: 16px; font-size: 0.8125rem;">
        <span style="color: var(--text-muted);">Showing page <strong>${current}</strong> of <strong>${totalPages}</strong></span>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-outline" style="padding: 6px 12px;" ${current <= 1 ? 'disabled' : ''}>Previous</button>
          <button class="btn btn-primary" style="padding: 6px 12px;">${current}</button>
          <button class="btn btn-outline" style="padding: 6px 12px;" ${current >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;
  },

  // 9. Status Indicator Pill / Dot
  statusIndicator(status = 'ACTIVE') {
    const normalized = String(status).toUpperCase();
    if (['ACTIVE', 'HIGHLY_SUITABLE', 'OPTIMAL', 'OPERATIONAL', 'COMPLETED'].includes(normalized)) {
      return `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 700; color: var(--primary-dark);"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary);"></span>${status}</span>`;
    }
    if (['PENDING', 'SCHEDULED', 'MODERATELY_SUITABLE', 'MEDIUM', 'WARNING'].includes(normalized)) {
      return `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 700; color: var(--accent-amber);"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-amber);"></span>${status}</span>`;
    }
    if (['CRITICAL', 'HIGH', 'FAILED', 'NOT_SUITABLE', 'OFFLINE'].includes(normalized)) {
      return `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 700; color: var(--accent-rose);"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-rose);"></span>${status}</span>`;
    }
    return `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 700; color: var(--text-muted);"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--border-color);"></span>${status}</span>`;
  },

  // 10. Stat Metric Card
  metricCard({ label, value, subtext, color = 'var(--text-primary)', badge = '' }) {
    return `
      <div class="metric-box">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="metric-box-label">${label}</span>
          ${badge ? `<span class="badge badge-green" style="font-size: 0.65rem;">${badge}</span>` : ''}
        </div>
        <span class="metric-box-val" style="color: ${color};">${value}</span>
        ${subtext ? `<span class="metric-box-sub" style="color: var(--text-muted); font-size: 0.75rem;">${subtext}</span>` : ''}
      </div>
    `;
  },

  // 11. Loading State Container
  loadingState(message = 'Retrieving real-time agricultural telemetry...') {
    return `
      <div class="panel" style="padding: 60px 24px; text-align: center;" aria-busy="true">
        <div style="width: 44px; height: 44px; border: 4px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite;"></div>
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">Loading Platform Data</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">${message}</p>
      </div>
    `;
  },

  // 12. Success State Card
  successState({ title = 'Operation Completed Successfully', message = 'The requested agricultural record has been verified and committed.', actionText = 'Continue', actionHash = '#dashboard' }) {
    return `
      <div class="panel" style="padding: 48px 24px; text-align: center; border-top: 4px solid var(--primary);">
        <div style="font-size: 3rem; margin-bottom: 12px;" aria-hidden="true">✅</div>
        <h3 style="font-size: 1.3rem; font-weight: 900; color: #065f46;">${title}</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary); max-width: 460px; margin: 8px auto 20px;">${message}</p>
        <button class="btn btn-primary" onclick="location.hash='${actionHash}'">${actionText}</button>
      </div>
    `;
  },

  // 13. HTTP & Utility Error States (404, 403, 500, Offline, Maintenance)
  errorHttpState(code = '404', customMessage = '') {
    const errorConfigs = {
      '404': {
        icon: '🔍',
        title: '404 — Record or Route Not Found',
        message: customMessage || 'The requested parcel, crop cultivar, or agronomic record does not exist in the spatial catalog.',
        action: 'Return to Command Dashboard',
        hash: '#dashboard'
      },
      '403': {
        icon: '🔐',
        title: '403 — Insufficient Role Permissions',
        message: customMessage || 'Your current agricultural role does not have administrative authorization to modify this resource.',
        action: 'Review Role Permissions',
        hash: '#roles'
      },
      '500': {
        icon: '⚠️',
        title: '500 — Backend Service Error',
        message: customMessage || 'An internal exception occurred in the ASP.NET Core Minimal API or MySQL 8 spatial connection pool.',
        action: 'Inspect System Monitoring',
        hash: '#system-monitoring'
      },
      'offline': {
        icon: '📡',
        title: 'Offline Field Mode Active',
        message: customMessage || 'No internet connection detected. Field observations are being queued in local storage for sync upon reconnection.',
        action: 'View Queued Field Tasks',
        hash: '#tasks'
      },
      'maintenance': {
        icon: '🛠️',
        title: 'Platform Maintenance Mode',
        message: customMessage || 'AYIS spatial indices and weather synoptic workers are undergoing scheduled calibration. Read-only cached telemetry available.',
        action: 'View System Status',
        hash: '#system-monitoring'
      }
    };

    const cfg = errorConfigs[code] || errorConfigs['404'];
    return `
      <div class="panel" style="padding: 60px 24px; text-align: center; max-width: 620px; margin: 40px auto; border-top: 4px solid var(--accent-rose);">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">${cfg.icon}</div>
        <h1 style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">${cfg.title}</h1>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 12px auto 24px; max-width: 480px; line-height: 1.5;">${cfg.message}</p>
        <button class="btn btn-primary" onclick="location.hash='${cfg.hash}'">${cfg.action}</button>
      </div>
    `;
  },

  // 14. Visual Scoring Bar Component (Consumes C#-generated scores 0-100)
  scoreBar({ label = 'Score', score = 80, color = 'var(--primary)', showPercentage = true }) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    let barColor = color;
    if (color === 'auto') {
      if (clamped >= 80) barColor = 'var(--primary)';
      else if (clamped >= 60) barColor = 'var(--accent-amber)';
      else barColor = 'var(--accent-rose)';
    }

    return `
      <div style="margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 0.8rem;">
          <strong style="color: var(--text-secondary);">${label}</strong>
          ${showPercentage ? `<span style="font-weight: 800; color: ${barColor}; font-family: monospace;">${clamped}%</span>` : ''}
        </div>
        <div style="height: 8px; width: 100%; background: #e2e8f0; border-radius: 4px; overflow: hidden;" role="progressbar" aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="100">
          <div style="height: 100%; width: ${clamped}%; background: ${barColor}; transition: width 0.4s ease; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  },

  // 15. Block-Character ASCII Progress Meter (e.g. ████████░░ 82%)
  asciiScoreBar(score = 82, totalBlocks = 10) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    const filledBlocks = Math.round((clamped / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const filledStr = '█'.repeat(filledBlocks);
    const emptyStr = '░'.repeat(emptyBlocks);
    return `<span style="font-family: monospace; letter-spacing: 1px; color: var(--primary-dark); font-weight: 700;">${filledStr}<span style="color: #cbd5e1;">${emptyStr}</span> ${clamped}%</span>`;
  },

  // 16. Visual Agricultural Recommendation Card
  recommendationCard(r) {
    return `
      <div class="panel recommendation-card" style="padding: 20px; border-top: 4px solid ${r.riskScore > 60 ? 'var(--accent-rose)' : (r.suitabilityScore >= 80 ? 'var(--primary)' : 'var(--accent-amber)')}; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <span class="badge ${r.riskScore > 60 ? 'badge-rose' : (r.suitabilityScore >= 80 ? 'badge-green' : 'badge-blue')}" style="font-size: 0.7rem; font-weight: 800;">
              ${(r.recommendationType || 'RECOMMENDATION').toUpperCase()}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Valid: ${r.validUntil ? r.validUntil.substring(0, 10) : 'Active'}</span>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 900; color: var(--text-primary); line-height: 1.3; margin-bottom: 8px;">
            "${r.recommendationMessage || r.title}"
          </h3>

          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
            Farm: <strong>${r.farm}</strong> · Field: <strong>${r.field}</strong> · Crop: <strong>${r.crop}</strong>
          </div>

          <!-- Suitability Visual Bar (e.g. ████████░░ 82%) -->
          <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-color); margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 0.775rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Suitability</span>
              ${ui.asciiScoreBar(r.suitabilityScore || 80, 10)}
            </div>
            ${ui.scoreBar({ label: 'Confidence Score', score: r.confidenceScore || 90, color: 'var(--accent-blue)' })}
            ${ui.scoreBar({ label: 'Risk Factor', score: r.riskScore || 20, color: r.riskScore > 60 ? 'var(--accent-rose)' : 'var(--accent-amber)' })}
          </div>

          <!-- Why? Section -->
          <div style="margin-bottom: 14px;">
            <strong style="font-size: 0.85rem; color: var(--text-primary); display: block; margin-bottom: 6px;">Why?</strong>
            <ul style="padding-left: 18px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
              <li><strong>Recent rainfall:</strong> ${r.weatherFactors?.recentRainfall || 'favourable'}</li>
              <li><strong>Temperature:</strong> ${r.weatherFactors?.temperature || 'favourable'}</li>
              <li><strong>Forecast rainfall:</strong> ${r.weatherFactors?.forecastRainfall || 'moderate'}</li>
              <li><strong>Current season:</strong> ${r.weatherFactors?.currentSeason || 'suitable'}</li>
            </ul>
          </div>

          <!-- Recommended action -->
          <div style="background: #ecfdf5; border-left: 3px solid var(--primary); padding: 10px 12px; border-radius: var(--radius-xs); font-size: 0.825rem; color: #065f46; margin-bottom: 14px;">
            <strong style="display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Recommended action:</strong>
            "${r.suggestedAction}"
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          <button class="btn btn-outline btn-view-rec-detail" data-id="${r.id}" style="padding: 6px 12px; font-size: 0.775rem;">
            Inspect Full Evidence →
          </button>
        </div>
      </div>
    `;
  }
};
