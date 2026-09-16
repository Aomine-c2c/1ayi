import { notificationService } from '../services/index.js';
import { showModal } from './modal.js';
import { ui } from './ui.js';

export const notificationComponents = {
  // Category icon map
  categoryIcons: {
    'Weather': '🌦️',
    'Crop': '🌱',
    'Farm': '🏡',
    'Yield': '📈',
    'Recommendation': '💡',
    'Field operation': '🚜',
    'System': '🖥️',
    'Administrative': '🔐'
  },

  // Severity style configuration
  severityStyles: {
    'CRITICAL': {
      border: '#ef4444',
      bg: '#fef2f2',
      badgeBg: '#fee2e2',
      badgeColor: '#991b1b',
      icon: '🚨',
      label: 'CRITICAL ALERT'
    },
    'HIGH': {
      border: '#f97316',
      bg: '#fff7ed',
      badgeBg: '#ffedd5',
      badgeColor: '#9a3412',
      icon: '⚠️',
      label: 'HIGH RISK'
    },
    'MEDIUM': {
      border: '#f59e0b',
      bg: '#fffbeb',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      icon: '⚡',
      label: 'ADVISORY'
    },
    'LOW': {
      border: '#3b82f6',
      bg: '#eff6ff',
      badgeBg: '#dbeafe',
      badgeColor: '#1e40af',
      icon: 'ℹ️',
      label: 'NOTICE'
    },
    'INFO': {
      border: '#64748b',
      bg: '#f8fafc',
      badgeBg: '#f1f5f9',
      badgeColor: '#334155',
      icon: '🔔',
      label: 'INFO'
    }
  },

  /**
   * Initialize Top Navbar Bell Dropdown & Realtime Unread Counter
   */
  initTopNavbarDropdown() {
    const btnBell = document.getElementById('btnTopNotifications');
    if (!btnBell) return;

    // Update unread count badge
    this.updateTopBadge();

    // Attach click handler for toggle dropdown
    btnBell.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(btnBell);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notificationTopDropdown');
      if (dropdown && !dropdown.contains(e.target) && e.target !== btnBell && !btnBell.contains(e.target)) {
        dropdown.remove();
      }
    });
  },

  async updateTopBadge() {
    const badge = document.getElementById('topNotifBadge');
    if (!badge) return;
    const unread = await notificationService.getUnreadCount();
    if (unread > 0) {
      badge.style.display = 'inline-block';
      badge.textContent = unread.toString();
    } else {
      badge.style.display = 'none';
    }
  },

  async toggleDropdown(anchorBtn) {
    const existing = document.getElementById('notificationTopDropdown');
    if (existing) {
      existing.remove();
      return;
    }

    const notifs = await notificationService.listNotifications();
    const unreadCount = notifs.filter(n => !n.isRead).length;

    const dropdown = document.createElement('div');
    dropdown.id = 'notificationTopDropdown';
    dropdown.className = 'panel';
    dropdown.style.cssText = `
      position: absolute;
      top: 54px;
      right: 180px;
      width: 380px;
      max-width: 90vw;
      max-height: 520px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 12px 28px rgba(0,0,0,0.15);
      z-index: 2500;
      animation: fadeIn 0.15s ease-out;
      overflow: hidden;
    `;

    dropdown.innerHTML = `
      <div style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 0.95rem; color: var(--text-primary);">Notifications & Alerts</strong>
          ${unreadCount > 0 ? `
            <span style="font-size: 0.7rem; font-weight: 800; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 9999px;">
              ${unreadCount} unread
            </span>
          ` : ''}
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="ddMarkAllRead" style="background: none; border: none; font-size: 0.75rem; color: var(--primary); font-weight: 700; cursor: pointer;">
            Mark all read
          </button>
        </div>
      </div>

      <div style="overflow-y: auto; max-height: 400px; padding: 8px;">
        ${notifs.length === 0 ? `
          <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            No active notifications or alerts.
          </div>
        ` : notifs.slice(0, 5).map(n => {
          const sev = this.severityStyles[n.severity] || this.severityStyles.INFO;
          const isAgri = n.isAgriculturalAlert;
          return `
            <div class="dd-notif-item" data-id="${n.id}" style="
              padding: 12px;
              margin-bottom: 6px;
              border-radius: var(--radius-sm);
              border-left: 4px solid ${sev.border};
              background: ${!n.isRead ? (isAgri ? sev.bg : '#f0fdf4') : '#ffffff'};
              border-top: 1px solid ${!n.isRead ? 'transparent' : '#f1f5f9'};
              border-right: 1px solid ${!n.isRead ? 'transparent' : '#f1f5f9'};
              border-bottom: 1px solid ${!n.isRead ? 'transparent' : '#f1f5f9'};
              cursor: pointer;
              transition: background 0.15s;
            ">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 1rem;">${this.categoryIcons[n.category] || '🔔'}</span>
                  <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 1px 5px; border-radius: 4px; background: ${sev.badgeBg}; color: ${sev.badgeColor};">
                    ${n.severity}
                  </span>
                  ${isAgri ? `
                    <span style="font-size: 0.65rem; font-weight: 800; background: #ecfdf5; color: #047857; padding: 1px 4px; border-radius: 3px; border: 1px solid #a7f3d0;">
                      AGRI ALERT
                    </span>
                  ` : ''}
                </div>
                <span style="font-size: 0.7rem; color: var(--text-muted); white-space: nowrap;">
                  ${n.date.split(' ')[1] || n.date}
                </span>
              </div>

              <div style="font-size: 0.825rem; font-weight: ${!n.isRead ? '800' : '600'}; color: var(--text-primary); margin: 4px 0 2px 0; line-height: 1.3;">
                ${n.title}
              </div>

              <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                ${n.description}
              </p>
            </div>
          `;
        }).join('')}
      </div>

      <div style="padding: 10px 16px; border-top: 1px solid var(--border-color); background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
        <button id="ddOpenCenter" class="btn btn-primary" style="width: 100%; font-size: 0.8rem; padding: 6px 12px; text-align: center;">
          Open Notification Center (${notifs.length}) →
        </button>
      </div>
    `;

    document.body.appendChild(dropdown);

    // Event handlers within dropdown
    dropdown.querySelector('#ddMarkAllRead')?.addEventListener('click', async () => {
      await notificationService.markAllAsRead();
      this.updateTopBadge();
      dropdown.remove();
      this.toggleDropdown(anchorBtn);
    });

    dropdown.querySelector('#ddOpenCenter')?.addEventListener('click', () => {
      dropdown.remove();
      location.hash = '#notifications';
    });

    dropdown.querySelectorAll('.dd-notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        dropdown.remove();
        this.openNotificationDetailModal(id);
      });
    });
  },

  /**
   * Detail Modal with actionable buttons, related farm/crop badges, and expiration
   */
  async openNotificationDetailModal(id) {
    const notifs = await notificationService.listNotifications();
    const n = notifs.find(item => item.id === id);
    if (!n) return;

    // Mark as read immediately on inspection
    await notificationService.markAsRead(id);
    this.updateTopBadge();

    const sev = this.severityStyles[n.severity] || this.severityStyles.INFO;
    const isAgri = n.isAgriculturalAlert;

    showModal({
      title: `${sev.icon} ${n.category.toUpperCase()} ${isAgri ? 'AGRICULTURAL ALERT' : 'NOTIFICATION'}`,
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 16px; font-size: 0.875rem;">
          <!-- Severity & Category Header Banner -->
          <div style="
            padding: 14px;
            border-radius: var(--radius-sm);
            background: ${sev.bg};
            border-left: 5px solid ${sev.border};
            border-top: 1px solid var(--border-color);
            border-right: 1px solid var(--border-color);
            border-bottom: 1px solid var(--border-color);
          ">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">${this.categoryIcons[n.category] || '🔔'}</span>
                <span style="font-weight: 800; font-size: 0.75rem; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: ${sev.badgeBg}; color: ${sev.badgeColor};">
                  ${n.severity} SEVERITY
                </span>
                ${isAgri ? `
                  <span style="font-weight: 800; font-size: 0.75rem; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; border: 1px solid #86efac;">
                    🌾 AGRICULTURAL ALERT
                  </span>
                ` : `
                  <span style="font-weight: 700; font-size: 0.75rem; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px;">
                    SYSTEM / ADMIN
                  </span>
                `}
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${n.date}</span>
            </div>

            <h3 style="font-size: 1.05rem; font-weight: 900; color: var(--text-primary); margin: 6px 0 0 0; line-height: 1.4;">
              ${n.title}
            </h3>
          </div>

          <!-- Description Body -->
          <div style="background: #ffffff; padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); line-height: 1.6; color: var(--text-secondary);">
            <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">
              Agronomic & Operational Details
            </strong>
            ${n.description}
          </div>

          <!-- Associated Entity Metadata Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="padding: 10px 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block;">Related Farm Holding</span>
              <strong style="font-size: 0.85rem; color: var(--text-primary);">${n.relatedFarm || 'National / General'}</strong>
            </div>
            <div style="padding: 10px 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block;">Related Crop Cultivar</span>
              <strong style="font-size: 0.85rem; color: var(--primary);">${n.relatedCrop || 'Cross-Commodity'}</strong>
            </div>
          </div>

          <!-- Validity & Expiration Footnote -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); padding: 4px 6px;">
            <span>ID: <code>${n.id}</code></span>
            <span>Valid Until: <strong>${n.expiration || 'Seasonal Close'}</strong></span>
          </div>
        </div>
      `,
      confirmText: n.action ? n.action.label : 'Acknowledged',
      onConfirm: () => {
        if (n.action && n.action.hash) {
          location.hash = n.action.hash;
        }
      }
    });
  }
};
