import { farmerViews } from './farmerViews.js';
import { farmManagerViews } from './farmManagerViews.js';
import { agronomistViews } from './agronomistViews.js';
import { extensionOfficerViews } from './extensionOfficerViews.js';
import { fieldOfficerViews } from './fieldOfficerViews.js';
import { weatherAnalystViews } from './weatherAnalystViews.js';
import { systemAdminViews } from './systemAdminViews.js';
import { superAdminViews } from './superAdminViews.js';

export const roleViews = {
  // 1. FARMER VIEW: Action-oriented, simple, plain language ("What should I do?")
  async farmer(container) {
    await farmerViews.dashboard(container);
  },

  // 2. FARM MANAGER VIEW: Multi-farm oversight, production planning, cycles
  async farm_manager(container) {
    await farmManagerViews.dashboard(container);
  },

  // 3. AGRONOMIST VIEW: Suitability matrices, physiological models, FAO criteria
  async agronomist(container) {
    await agronomistViews.dashboard(container);
  },

  // 4. EXTENSION OFFICER: Farmer management, field visits, advisory delivery
  async extension_officer(container) {
    await extensionOfficerViews.dashboard(container);
  },

  // 5. FIELD OFFICER: Structured inspections, physical field monitoring & scouting
  async field_officer(container) {
    await fieldOfficerViews.dashboard(container);
  },

  // 6. WEATHER ANALYST: Synoptic data quality, diurnal curves, station telemetry
  async weather_analyst(container) {
    await weatherAnalystViews.dashboard(container);
  },

  // 7. SYSTEM ADMINISTRATOR: RBAC matrix, users, system telemetry
  async system_admin(container) {
    await systemAdminViews.dashboard(container);
  },

  // 8. SUPER ADMINISTRATOR: Executive Command & National Governance
  async super_admin(container) {
    await superAdminViews.dashboard(container);
  }
};
