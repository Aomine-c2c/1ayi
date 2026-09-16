import { views } from './views.js';
import { roleViews } from './roles/roleViews.js';
import { farmerViews } from './roles/farmerViews.js';
import { farmManagerViews } from './roles/farmManagerViews.js';
import { agronomistViews } from './roles/agronomistViews.js';
import { extensionOfficerViews } from './roles/extensionOfficerViews.js';
import { fieldOfficerViews } from './roles/fieldOfficerViews.js';
import { weatherAnalystViews } from './roles/weatherAnalystViews.js';
import { systemAdminViews } from './roles/systemAdminViews.js';
import { superAdminViews } from './roles/superAdminViews.js';
import { authService } from './services/index.js';
import { authViews } from './auth/authViews.js';
import { ROLE_CONFIG } from './domain/models.js';

export function initRouter() {
  const contentArea = document.getElementById('contentViewport');
  const roleSelect = document.getElementById('activeRoleSelect');

  // Render role-specific navigation menu
  function updateSidebarNavigation(role) {
    const navMenu = document.getElementById('dynamicNavMenu');
    const userRoleTitle = document.getElementById('userRoleTitle');
    const userRoleSubtitle = document.getElementById('userRoleSubtitle');

    const config = ROLE_CONFIG[role] || ROLE_CONFIG.super_admin;

    if (userRoleTitle) userRoleTitle.textContent = config.title;
    if (userRoleSubtitle) userRoleSubtitle.textContent = config.subtitle;

    if (navMenu) {
      navMenu.innerHTML = `
        <li class="nav-section-title">${config.name} Portal</li>
        ${config.navItems.map(item => `
          <li class="nav-item">
            <a href="${item.hash}" class="nav-link" data-hash="${item.hash}">
              <span class="icon" aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          </li>
        `).join('')}
      `;
    }
  }

  // Handle route switching
  async function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const currentRole = authService.getCurrentRole();

    // Update active state in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    contentArea.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);" aria-busy="true">Loading agricultural intelligence view...</div>';

    try {
      const cleanHash = hash.replace('#', '').split('?')[0];

      // Centralized RBAC Route Permission Check
      // Define restricted route access sets per role (C# backend authorization parity)
      const ROLE_ALLOWED_ROUTES = {
        super_admin: null, // Full platform access to all domains and routes
        system_admin: new Set([
          'dashboard', 'users', 'user-directory', 'farmers', 'farms', 'fields', 'roles', 'roles-permissions',
          'permissions', 'crop-profiles', 'crops', 'weather-config', 'weather-configuration', 'system-monitoring',
          'monitoring', 'notifications', 'notification-center', 'reports', 'report-builder', 'reports-analytics',
          'audit-logs', 'audit', 'settings', 'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password'
        ]),
        agronomist: new Set([
          'dashboard', 'farms', 'my-farms', 'crop-intelligence', 'crop-catalogue', 'crops', 'my-crops',
          'crop-profiles', 'crop-suitability', 'suitability', 'weather-intelligence', 'weather', 'live-weather',
          'weather-trends', 'recommendations', 'intelligence', 'yield-intelligence', 'yield', 'yield-estimates',
          'field-observations', 'observations', 'reports', 'report-builder', 'reports-analytics', 'farm-map',
          'regional-map', 'map', 'gis-map', 'cycles', 'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password'
        ]),
        farm_manager: new Set([
          'dashboard', 'farms', 'my-farms', 'fields', 'cycles', 'crop-cycles', 'weather', 'live-weather',
          'weather-trends', 'recommendations', 'intelligence', 'yield', 'yield-intelligence', 'production-planning',
          'field-operations', 'tasks', 'reports', 'report-builder', 'reports-analytics', 'notifications',
          'notification-center', 'farm-map', 'regional-map', 'farm-registration-map', 'map', 'gis-map',
          'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password'
        ]),
        extension_officer: new Set([
          'dashboard', 'farmers', 'farmer-directory', 'farms', 'monitored-farms', 'field-visits', 'visits',
          'observations', 'field-observations', 'cycles', 'crop-cycles', 'weather', 'live-weather', 'recommendations',
          'intelligence', 'alerts', 'weather-alerts', 'reports', 'report-builder', 'reports-analytics', 'follow-ups',
          'tasks', 'map', 'gis-map', 'farm-map', 'regional-map', 'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password'
        ]),
        field_officer: new Set([
          'dashboard', 'assigned-farms', 'farms', 'fields', 'inspections', 'observations', 'field-observations',
          'cycles', 'crop-cycles', 'weather', 'live-weather', 'alerts', 'tasks', 'reports', 'report-builder',
          'farm-map', 'map', 'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password'
        ]),
        weather_analyst: new Set([
          'dashboard', 'weather-overview', 'overview', 'live-weather', 'live', 'weather', 'historical-weather',
          'historical-data', 'historical', 'weather-trends', 'trends', 'data-quality', 'quality', 'weather-alerts',
          'alerts', 'analytics', 'reports', 'report-builder', 'reports-analytics', 'regional-map', 'gis-map',
          'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password'
        ]),
        farmer: new Set([
          'dashboard', 'my-farms', 'farms', 'crops', 'my-crops', 'weather', 'live-weather', 'weather-trends',
          'recommendations', 'intelligence', 'yield', 'yield-estimates', 'alerts', 'weather-alerts',
          'farm-map', 'map', 'profile', 'search', 'help', 'about', 'login', 'forgot-password', 'reset-password', 'onboarding'
        ])
      };

      // Check if user is attempting to access a route disallowed for their active role
      const allowedRoutes = ROLE_ALLOWED_ROUTES[currentRole];
      const publicExempt = ['login', 'forgot-password', 'reset-password', 'help', 'about', '404', '403', '500', 'offline', 'maintenance'];
      if (allowedRoutes && !allowedRoutes.has(cleanHash) && !publicExempt.includes(cleanHash) && !cleanHash.startsWith('search')) {
        views.renderHttpState(contentArea, '403', `Access Denied: The active role '${currentRole}' is not authorized to access the '#${cleanHash}' domain.`);
        return;
      }

      // 1. If viewing #dashboard, route to role-specific dashboard
      if (hash === '#dashboard' || cleanHash === 'dashboard') {
        if (roleViews[currentRole]) {
          await roleViews[currentRole](contentArea);
          return;
        }
      }
      
      // If active role is farmer, deliver farmer-specialized decision assistant views
      if (currentRole === 'farmer') {
        const farmerRouteMap = {
          'dashboard': farmerViews.dashboard,
          'my-farms': farmerViews.myFarms,
          'farms': farmerViews.myFarms,
          'crops': farmerViews.crops,
          'my-crops': farmerViews.crops,
          'weather': farmerViews.weather,
          'live-weather': farmerViews.weather,
          'weather-trends': farmerViews.weather,
          'recommendations': farmerViews.recommendations,
          'yield': farmerViews.yield,
          'yield-estimates': farmerViews.yield,
          'alerts': farmerViews.alerts,
          'weather-alerts': farmerViews.alerts,
          'profile': () => authViews.showUserProfileModal()
        };

        if (farmerRouteMap[cleanHash]) {
          await farmerRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is farm_manager, deliver farm manager operational command views
      if (currentRole === 'farm_manager') {
        const farmManagerRouteMap = {
          'dashboard': farmManagerViews.dashboard,
          'farms': farmManagerViews.farms,
          'my-farms': farmManagerViews.farms,
          'fields': farmManagerViews.fields,
          'cycles': farmManagerViews.cycles,
          'crop-cycles': farmManagerViews.cycles,
          'weather': views.weather,
          'recommendations': views.intelligence,
          'yield': farmManagerViews.productionPlanning,
          'yield-intelligence': farmManagerViews.productionPlanning,
          'production-planning': farmManagerViews.productionPlanning,
          'field-operations': farmManagerViews.fieldOperations,
          'tasks': farmManagerViews.fieldOperations,
          'reports': views.reports,
          'report-builder': views.reports,
          'notifications': farmManagerViews.notifications,
          'profile': () => authViews.showUserProfileModal()
        };

        if (farmManagerRouteMap[cleanHash]) {
          await farmManagerRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is agronomist, deliver specialized agronomic intelligence views
      if (currentRole === 'agronomist') {
        const agronomistRouteMap = {
          'dashboard': agronomistViews.dashboard,
          'farms': agronomistViews.farms,
          'my-farms': agronomistViews.farms,
          'crop-intelligence': agronomistViews.cropIntelligence,
          'crop-catalogue': agronomistViews.cropIntelligence,
          'crops': agronomistViews.cropIntelligence,
          'crop-profiles': agronomistViews.cropProfiles,
          'crop-suitability': agronomistViews.cropSuitability,
          'suitability': agronomistViews.cropSuitability,
          'weather-intelligence': agronomistViews.weatherIntelligence,
          'weather': agronomistViews.weatherIntelligence,
          'recommendations': agronomistViews.recommendations,
          'yield-intelligence': agronomistViews.yieldIntelligence,
          'yield': agronomistViews.yieldIntelligence,
          'field-observations': agronomistViews.fieldObservations,
          'observations': agronomistViews.fieldObservations,
          'reports': views.reports,
          'report-builder': views.reports,
          'profile': () => authViews.showUserProfileModal()
        };

        if (agronomistRouteMap[cleanHash]) {
          await agronomistRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is extension_officer, deliver specialized agricultural extension views
      if (currentRole === 'extension_officer') {
        const extensionRouteMap = {
          'dashboard': extensionOfficerViews.dashboard,
          'farmers': extensionOfficerViews.farmers,
          'farmer-directory': extensionOfficerViews.farmers,
          'farms': extensionOfficerViews.farms,
          'monitored-farms': extensionOfficerViews.farms,
          'field-visits': extensionOfficerViews.fieldVisits,
          'visits': extensionOfficerViews.fieldVisits,
          'observations': extensionOfficerViews.observations,
          'field-observations': extensionOfficerViews.observations,
          'cycles': views.cycles,
          'crop-cycles': views.cycles,
          'weather': views.weather,
          'recommendations': views.intelligence,
          'alerts': views.weather,
          'reports': views.reports,
          'follow-ups': extensionOfficerViews.followUps,
          'tasks': extensionOfficerViews.followUps,
          'map': extensionOfficerViews.mapView,
          'gis-map': extensionOfficerViews.mapView,
          'profile': () => authViews.showUserProfileModal()
        };

        if (extensionRouteMap[cleanHash]) {
          await extensionRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is field_officer, deliver specialized physical field monitoring & scouting views
      if (currentRole === 'field_officer') {
        const fieldOfficerRouteMap = {
          'dashboard': fieldOfficerViews.dashboard,
          'assigned-farms': fieldOfficerViews.assignedFarms,
          'farms': fieldOfficerViews.assignedFarms,
          'fields': fieldOfficerViews.fields,
          'inspections': fieldOfficerViews.inspections,
          'observations': fieldOfficerViews.observations,
          'field-observations': fieldOfficerViews.observations,
          'cycles': views.cycles,
          'crop-cycles': views.cycles,
          'weather': views.weather,
          'alerts': views.weather,
          'tasks': fieldOfficerViews.tasks,
          'reports': views.reports,
          'profile': () => authViews.showUserProfileModal()
        };

        if (fieldOfficerRouteMap[cleanHash]) {
          await fieldOfficerRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is weather_analyst, deliver specialized meteorological & data integrity views
      if (currentRole === 'weather_analyst') {
        const weatherAnalystRouteMap = {
          'dashboard': weatherAnalystViews.dashboard,
          'weather-overview': weatherAnalystViews.weatherOverview,
          'overview': weatherAnalystViews.weatherOverview,
          'live-weather': weatherAnalystViews.liveWeather,
          'live': weatherAnalystViews.liveWeather,
          'weather': weatherAnalystViews.liveWeather,
          'historical-weather': weatherAnalystViews.historicalWeather,
          'historical-data': weatherAnalystViews.historicalWeather,
          'historical': weatherAnalystViews.historicalWeather,
          'weather-trends': weatherAnalystViews.weatherTrends,
          'trends': weatherAnalystViews.weatherTrends,
          'data-quality': weatherAnalystViews.dataQuality,
          'quality': weatherAnalystViews.dataQuality,
          'weather-alerts': weatherAnalystViews.weatherAlerts,
          'alerts': weatherAnalystViews.weatherAlerts,
          'analytics': weatherAnalystViews.analytics,
          'reports': views.reports,
          'report-builder': views.reports,
          'profile': () => authViews.showUserProfileModal()
        };

        if (weatherAnalystRouteMap[cleanHash]) {
          await weatherAnalystRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is system_admin, deliver specialized administrative governance views
      if (currentRole === 'system_admin') {
        const systemAdminRouteMap = {
          'dashboard': systemAdminViews.dashboard,
          'users': systemAdminViews.users,
          'user-directory': systemAdminViews.users,
          'farmers': views.farmers,
          'farms': views.farms,
          'roles': systemAdminViews.roles,
          'roles-permissions': systemAdminViews.roles,
          'permissions': systemAdminViews.roles,
          'crop-profiles': systemAdminViews.cropProfiles,
          'crops': systemAdminViews.cropProfiles,
          'weather-config': systemAdminViews.weatherConfig,
          'weather-configuration': systemAdminViews.weatherConfig,
          'system-monitoring': systemAdminViews.systemMonitoring,
          'monitoring': systemAdminViews.systemMonitoring,
          'notifications': views.notifications || (() => alert('Notification Center')),
          'reports': views.reports,
          'audit-logs': systemAdminViews.auditLogs,
          'audit': systemAdminViews.auditLogs,
          'settings': systemAdminViews.settings,
          'profile': () => authViews.showUserProfileModal()
        };

        if (systemAdminRouteMap[cleanHash]) {
          await systemAdminRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // If active role is super_admin, deliver complete executive platform & agricultural intelligence experience
      if (currentRole === 'super_admin') {
        const superAdminRouteMap = {
          'dashboard': superAdminViews.dashboard,
          'executive-analytics': superAdminViews.executiveAnalytics,
          'analytics': superAdminViews.executiveAnalytics,
          'geographic-risk': superAdminViews.geographicRisk,
          'risk-map': superAdminViews.geographicRisk,
          'users': systemAdminViews.users,
          'farmers': views.farmers,
          'farms': views.farms,
          'crops': systemAdminViews.cropProfiles,
          'crop-profiles': systemAdminViews.cropProfiles,
          'recommendations': views.intelligence,
          'weather-intelligence': weatherAnalystViews.weatherOverview,
          'weather': weatherAnalystViews.liveWeather,
          'roles': systemAdminViews.roles,
          'system-configuration': systemAdminViews.settings,
          'system-monitoring': systemAdminViews.systemMonitoring,
          'reports': views.reports,
          'audit-logs': systemAdminViews.auditLogs,
          'profile': () => authViews.showUserProfileModal()
        };

        if (superAdminRouteMap[cleanHash]) {
          await superAdminRouteMap[cleanHash](contentArea);
          return;
        }
      }

      // Explicit direct mapping to views methods
      const routeMap = {
        'dashboard': views.dashboard,
        'login': () => authViews.showLoginModal(),
        'forgot-password': () => authViews.showForgotPasswordModal(),
        'reset-password': () => authViews.showResetPasswordModal(),
        'profile': () => authViews.showUserProfileModal(),
        'onboarding': () => authViews.showFarmerOnboardingWizard(),
        'farms': views.farms,
        'my-farms': views.farms,
        'farm-map': views.farmMap,
        'regional-map': views.regionalMap,
        'farm-registration-map': views.farmRegistrationMap,
        'map': views.farmMap,
        'gis-map': views.regionalMap,
        'crops': views.crops,
        'my-crops': views.crops,
        'crop-catalogue': views.crops,
        'cycles': views.cycles,
        'weather': views.weather,
        'live-weather': views.weather,
        'weather-trends': views.weather,
        'weather-alerts': views.weather,
        'suitability': views.intelligence,
        'recommendations': views.intelligence,
        'intelligence': views.intelligence,
        'yield': views.intelligence,
        'yield-intelligence': views.intelligence,
        'yield-estimates': views.intelligence,
        'alerts': views.weather,
        'reports': views.reports,
        'report-builder': views.reports,
        'reports-analytics': views.reports,
        'farmers': views.farmers,
        'field-visits': views.fieldVisits,
        'field-observations': views.fieldObservations,
        'inspections': views.inspections,
        'data-quality': views.dataQuality,
        'users': views.users,
        'roles': views.roles,
        'audit-logs': views.auditLogs,
        'system-monitoring': views.systemMonitoring,
        'tasks': views.tasks,
        'production-planning': views.cycles,
        'fields': views.farms,
        'settings': views.settings,
        'notifications': views.notifications,
        'notification-center': views.notifications,
        'help': views.help,
        'about': views.about,
        'search': views.search,
        '404': (c) => views.renderHttpState(c, '404'),
        '403': (c) => views.renderHttpState(c, '403'),
        '500': (c) => views.renderHttpState(c, '500'),
        'offline': (c) => views.renderHttpState(c, 'offline'),
        'maintenance': (c) => views.renderHttpState(c, 'maintenance')
      };

      // Search prefix handling (e.g. #search?q=...)
      if (cleanHash.startsWith('search')) {
        await views.search(contentArea);
        return;
      }

      if (routeMap[cleanHash]) {
        await routeMap[cleanHash](contentArea);
      } else if (views[cleanHash]) {
        await views[cleanHash](contentArea);
      } else {
        // Fallback for any other custom sub-routes
        contentArea.innerHTML = `
          <div class="panel" style="padding: 40px; text-align: center;">
            <h2>${cleanHash.toUpperCase().replace('-', ' ')}</h2>
            <p style="color: var(--text-muted); margin-top: 8px;">
              Configured under the ${ROLE_CONFIG[currentRole]?.name || 'System'} portal.
            </p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="location.hash='#dashboard'">Return to Dashboard</button>
          </div>
        `;
      }
    } catch (err) {
      contentArea.innerHTML = `<div class="panel" style="padding: 24px; color: var(--accent-rose);">Failed to render view: ${err.message}</div>`;
    }
  }

  // Handle role switcher change
  if (roleSelect) {
    roleSelect.value = authService.getCurrentRole();
    roleSelect.addEventListener('change', (e) => {
      const newRole = e.target.value;
      authService.setCurrentRole(newRole);
      updateSidebarNavigation(newRole);
      handleRoute();
    });
  }

  window.addEventListener('hashchange', handleRoute);

  // Initial render
  updateSidebarNavigation(authService.getCurrentRole());
  handleRoute();
}
