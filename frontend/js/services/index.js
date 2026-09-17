/**
 * AYIS Service Abstraction Layer
 * Interfaces with C# ASP.NET Core Minimal APIs / MySQL backend with seed fallbacks.
 * Decouples the UI completely from raw data structures so Django or other backends
 * can replace mock implementations seamlessly.
 */
import { api } from '../api.js';

// 1. Authentication & Session Service
export const authService = {
  getCurrentRole() {
    return localStorage.getItem('ayis_active_role') || 'super_admin';
  },

  setCurrentRole(role) {
    localStorage.setItem('ayis_active_role', role);
  },

  isLoggedIn() {
    return !!localStorage.getItem('ayis_token');
  },

  isFirstLogin() {
    return localStorage.getItem('ayis_profile_completed') !== 'true';
  },

  setProfileCompleted(completed = true) {
    if (completed) {
      localStorage.setItem('ayis_profile_completed', 'true');
    } else {
      localStorage.removeItem('ayis_profile_completed');
    }
  },

  getCurrentUser() {
    const role = this.getCurrentRole();
    const stored = localStorage.getItem('ayis_user_profile_' + role);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }

    const mockUsers = {
      super_admin: { 
        id: 'usr-00', 
        username: 'superadmin', 
        firstName: 'Chief', 
        lastName: 'Agrotechnologist', 
        email: 'chief@ayis.org', 
        phone: '+254 700 000 001',
        role: 'super_admin',
        organization: 'Ministry of Agriculture / National Agritech Council',
        bio: 'Lead agricultural intelligence architect and national governance officer.',
        avatar: '🌱',
        notifications: { email: true, sms: true, weatherAlerts: true, advisoryUpdates: true },
        twoFactorEnabled: true
      },
      system_admin: { 
        id: 'usr-01', 
        username: 'alexk', 
        firstName: 'Alex', 
        lastName: 'Kipruto', 
        email: 'alex.kipruto@ayis.org', 
        phone: '+254 700 000 002',
        role: 'system_admin',
        organization: 'AYIS Infrastructure Team',
        bio: 'Security operations and spatial database systems administrator.',
        avatar: '🔐',
        notifications: { email: true, sms: false, weatherAlerts: false, advisoryUpdates: true },
        twoFactorEnabled: true
      },
      agronomist: { 
        id: 'usr-02', 
        username: 'sarahm', 
        firstName: 'Dr. Sarah', 
        lastName: 'Mwangi', 
        email: 'sarah.mwangi@ayis.org', 
        phone: '+254 700 000 003',
        role: 'agronomist',
        organization: 'Kenya Agricultural & Livestock Research Org (KALRO)',
        bio: 'Senior agronomist focusing on crop phenology and hydrothermal suitability.',
        avatar: '🌾',
        notifications: { email: true, sms: true, weatherAlerts: true, advisoryUpdates: true },
        twoFactorEnabled: false
      },
      extension_officer: { 
        id: 'usr-03', 
        username: 'gracew', 
        firstName: 'Grace', 
        lastName: 'Wanjiku', 
        email: 'grace.wanjiku@ayis.org', 
        phone: '+254 700 000 004',
        role: 'extension_officer',
        organization: 'Nakuru County Agricultural Extension Service',
        bio: 'Field extension specialist supporting 120+ smallholder maize & legume farms.',
        avatar: '👥',
        notifications: { email: true, sms: true, weatherAlerts: true, advisoryUpdates: true },
        twoFactorEnabled: false
      },
      weather_analyst: { 
        id: 'usr-04', 
        username: 'danielk', 
        firstName: 'Daniel', 
        lastName: 'Kiprop', 
        email: 'daniel.kiprop@ayis.org', 
        phone: '+254 700 000 005',
        role: 'weather_analyst',
        organization: 'Kenya Meteorological Department / Agromet Division',
        bio: 'Meteorologist analyzing automated weather station networks and GDD.',
        avatar: '📡',
        notifications: { email: true, sms: false, weatherAlerts: true, advisoryUpdates: false },
        twoFactorEnabled: false
      },
      farm_manager: { 
        id: 'usr-05', 
        username: 'davidm', 
        firstName: 'David', 
        lastName: 'Mwangi', 
        email: 'david.mwangi@estate.ke', 
        phone: '+254 700 000 006',
        role: 'farm_manager',
        organization: 'Green Valley Commercial Holdings',
        bio: 'Managing 2 commercial farms across 20.7 hectares of commercial maize and beans.',
        avatar: '📋',
        notifications: { email: true, sms: true, weatherAlerts: true, advisoryUpdates: true },
        twoFactorEnabled: false
      },
      farmer: { 
        id: 'usr-06', 
        username: 'johnk', 
        firstName: 'John', 
        lastName: 'Kamau', 
        email: 'john.kamau@farms.ke', 
        phone: '+254 712 345 678',
        role: 'farmer',
        organization: 'Green Valley Model Farm',
        bio: 'Smallholder maize and bean farmer in Nakuru High Plains.',
        avatar: '🚜',
        notifications: { email: false, sms: true, weatherAlerts: true, advisoryUpdates: true },
        twoFactorEnabled: false
      },
      field_officer: { 
        id: 'usr-07', 
        username: 'peterk', 
        firstName: 'Peter', 
        lastName: 'Koech', 
        email: 'peter.koech@ayis.org', 
        phone: '+254 700 000 007',
        role: 'field_officer',
        organization: 'Regional Crop Protection Unit',
        bio: 'Inspections officer conducting GAP compliance and pest scouting audits.',
        avatar: '🔍',
        notifications: { email: true, sms: true, weatherAlerts: true, advisoryUpdates: true },
        twoFactorEnabled: false
      }
    };
    return mockUsers[role] || mockUsers.super_admin;
  },

  async updateUserProfile(updatedProfile) {
    await new Promise(r => setTimeout(r, 600)); // Simulate async API call
    const role = updatedProfile.role || this.getCurrentRole();
    localStorage.setItem('ayis_user_profile_' + role, JSON.stringify(updatedProfile));
    localStorage.setItem('ayis_profile_completed', 'true');
    return { success: true, user: updatedProfile };
  },

  async login({ emailOrUsername, password, rememberMe = true }) {
    await new Promise(r => setTimeout(r, 700)); // Simulate network latency

    const trimmed = (emailOrUsername || '').trim().toLowerCase();

    // Check specific error test cases
    if (trimmed === 'disabled@ayis.org' || trimmed === 'disabled') {
      return {
        success: false,
        status: 'DISABLED',
        message: 'Account Disabled: Your agricultural enterprise account has been temporarily deactivated by a system administrator. Please contact your county extension officer or administrator.'
      };
    }

    if (trimmed === 'locked@ayis.org' || trimmed === 'locked') {
      return {
        success: false,
        status: 'LOCKED',
        message: 'Account Locked: Multiple consecutive failed authentication attempts detected. Security cooldown active for 15 minutes.'
      };
    }

    // Role detection map for testing convenience
    const roleMap = {
      'farmer': 'farmer',
      'john.kamau@farms.ke': 'farmer',
      'agronomist': 'agronomist',
      'sarah.mwangi@ayis.org': 'agronomist',
      'extension': 'extension_officer',
      'grace.wanjiku@ayis.org': 'extension_officer',
      'weather': 'weather_analyst',
      'daniel.kiprop@ayis.org': 'weather_analyst',
      'manager': 'farm_manager',
      'david.mwangi@estate.ke': 'farm_manager',
      'admin': 'system_admin',
      'alex.kipruto@ayis.org': 'system_admin',
      'super': 'super_admin',
      'chief@ayis.org': 'super_admin',
      'field': 'field_officer',
      'peter.koech@ayis.org': 'field_officer'
    };

    const targetRole = roleMap[trimmed] || 'agronomist';

    // Mock password verification (reject password 'wrong')
    if (password === 'wrong' || password === 'invalid') {
      return {
        success: false,
        status: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials: The email/username or password provided does not match our records.'
      };
    }

    // Successful login
    const token = 'ayis_jwt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
    localStorage.setItem('ayis_token', token);
    this.setCurrentRole(targetRole);

    return {
      success: true,
      token,
      role: targetRole,
      user: this.getCurrentUser(),
      isFirstLogin: this.isFirstLogin()
    };
  },

  async forgotPassword(email) {
    await new Promise(r => setTimeout(r, 600)); // Simulate async API call
    const trimmed = (email || '').trim().toLowerCase();

    if (!trimmed || !trimmed.includes('@')) {
      return {
        success: false,
        message: 'Please provide a valid registered email address format.'
      };
    }

    if (trimmed === 'notfound@ayis.org') {
      return {
        success: false,
        message: 'No registered agricultural producer or officer found matching that email address.'
      };
    }

    return {
      success: true,
      message: `Password reset instructions and a secure token have been dispatched to ${trimmed}. Please check your inbox and SMS.`
    };
  },

  async resetPassword({ token, newPassword, confirmPassword }) {
    await new Promise(r => setTimeout(r, 700));

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long.'
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: 'New password and confirmation password do not match.'
      };
    }

    return {
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new credentials.'
    };
  },

  async registerFarmerOnboarding(onboardingData) {
    await new Promise(r => setTimeout(r, 800)); // Simulate spatial geometry ingestion
    // Store registered farm into mock farmService state
    const farmId = 'farm-' + Math.floor(100 + Math.random() * 900);
    const newFarm = {
      id: farmId,
      name: onboardingData.farm.name,
      ownerId: 'usr-06',
      region: onboardingData.location.provinceDistrict || onboardingData.location.region || 'Nakuru High Plains',
      sizeHa: parseFloat(onboardingData.farm.size) || 8.5,
      latitude: parseFloat(onboardingData.location.latitude) || -0.3031,
      longitude: parseFloat(onboardingData.location.longitude) || 36.0800,
      primaryCrop: onboardingData.activities.primaryCrop || 'Maize',
      soilType: 'Volcanic Loam (pH 6.4)',
      irrigationType: onboardingData.activities.irrigation || 'Rainfed + Supplemental Drip',
      elevationM: 1850,
      description: onboardingData.farm.description || 'Registered via Farmer Onboarding'
    };

    return {
      success: true,
      farmId,
      farm: newFarm,
      message: 'Farmer and farm parcel registered successfully with spatial SRID 4326.'
    };
  },

  logout() {
    localStorage.removeItem('ayis_token');
    localStorage.removeItem('ayis_active_role');
  }
};

// 2. Farm & Field Service
export const farmService = {
  async listFarms() {
    return await api.getFarms();
  },
  async getFarmById(id) {
    const farms = await api.getFarms();
    return farms.find(f => f.id === id) || farms[0];
  },
  async listFields(farmId) {
    const allFields = [
      { 
        id: 'fld-001', 
        farmId: 'farm-001', 
        farmName: 'Green Valley Model Farm',
        name: 'North Field A (Hybrid Trial)', 
        areaHa: 5.20, 
        soilPh: 6.40, 
        organicMatterPct: 3.80, 
        drainageClass: 'Well drained', 
        slopePct: 2.10,
        currentCrop: 'Maize (Highland Hybrid H614D)',
        cycleId: 'cyc-001',
        status: 'ACTIVE',
        stage: 'Vegetative V6',
        observationsCount: 3,
        boundaryWkt: 'POLYGON((36.0785 -0.3015, 36.0815 -0.3015, 36.0815 -0.3030, 36.0785 -0.3030, 36.0785 -0.3015))'
      },
      { 
        id: 'fld-002', 
        farmId: 'farm-001', 
        farmName: 'Green Valley Model Farm',
        name: 'South Field B (Legume Rotation)', 
        areaHa: 4.80, 
        soilPh: 6.60, 
        organicMatterPct: 4.10, 
        drainageClass: 'Well drained', 
        slopePct: 1.50,
        currentCrop: 'Beans (Rosecoco GLP-2)',
        cycleId: 'cyc-002',
        status: 'ACTIVE',
        stage: 'Flowering R1',
        observationsCount: 2,
        boundaryWkt: 'POLYGON((36.0785 -0.3032, 36.0815 -0.3032, 36.0815 -0.3048, 36.0785 -0.3048, 36.0785 -0.3032))'
      },
      { 
        id: 'fld-003', 
        farmId: 'farm-002', 
        farmName: 'Rongai Sunrise Farm',
        name: 'East Plateau Parcel 1', 
        areaHa: 4.20, 
        soilPh: 5.90, 
        organicMatterPct: 3.20, 
        drainageClass: 'Moderate', 
        slopePct: 3.80,
        currentCrop: 'Wheat (Kenya Tayari)',
        cycleId: 'cyc-003',
        status: 'ACTIVE',
        stage: 'Grain Filling',
        observationsCount: 1,
        boundaryWkt: 'POLYGON((35.8480 -0.1680, 35.8520 -0.1680, 35.8520 -0.1700, 35.8480 -0.1700, 35.8480 -0.1680))'
      },
      { 
        id: 'fld-004', 
        farmId: 'farm-002', 
        farmName: 'Rongai Sunrise Farm',
        name: 'West Terraces Parcel 2', 
        areaHa: 4.00, 
        soilPh: 6.10, 
        organicMatterPct: 3.50, 
        drainageClass: 'Well drained', 
        slopePct: 4.20,
        currentCrop: 'Irish Potato (Shangi)',
        cycleId: 'cyc-004',
        status: 'PREPARING',
        stage: 'Preparing',
        observationsCount: 0,
        boundaryWkt: 'POLYGON((35.8480 -0.1700, 35.8520 -0.1700, 35.8520 -0.1720, 35.8480 -0.1720, 35.8480 -0.1700))'
      }
    ];

    if (farmId) {
      return allFields.filter(f => f.farmId === farmId);
    }
    return allFields;
  }
};

// 3. Crop & Cycle Service
export const cropService = {
  async listCrops() {
    return await api.getCrops();
  },
  async getCropById(id) {
    const crops = await api.getCrops();
    return crops.find(c => c.id === id) || crops[0];
  },
  async listCycles() {
    return [
      {
        id: 'cyc-001',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'North Field A (Hybrid Trial)',
        fieldId: 'fld-001',
        crop: 'Maize (Zea mays)',
        variety: 'H614D (Highland Hybrid)',
        seasonName: '2026 Long Rains Season',
        startDate: '2026-03-15',
        expectedHarvestDate: '2026-07-20',
        stage: 'Growing',
        subStage: 'Vegetative V6',
        targetYield: '5.8 t/ha',
        targetYieldKgHa: 5800,
        areaHa: 5.20,
        status: 'ACTIVE',
        progressPct: 55,
        timeline: [
          { stage: 'Planned', date: '2026-02-10', completed: true },
          { stage: 'Preparing', date: '2026-02-28', completed: true },
          { stage: 'Planted', date: '2026-03-15', completed: true },
          { stage: 'Growing', date: '2026-04-20', completed: true, current: true },
          { stage: 'Flowering', date: '2026-05-30', completed: false },
          { stage: 'Maturing', date: '2026-06-25', completed: false },
          { stage: 'Harvesting', date: '2026-07-15', completed: false },
          { stage: 'Completed', date: '2026-07-25', completed: false }
        ]
      },
      {
        id: 'cyc-002',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'South Field B (Legume Rotation)',
        fieldId: 'fld-002',
        crop: 'Dry Beans (Phaseolus vulgaris)',
        variety: 'Rosecoco (GLP-2)',
        seasonName: '2026 Rotation Legume',
        startDate: '2026-03-20',
        expectedHarvestDate: '2026-06-10',
        stage: 'Flowering',
        subStage: 'Flowering R1',
        targetYield: '2.1 t/ha',
        targetYieldKgHa: 2100,
        areaHa: 4.80,
        status: 'ACTIVE',
        progressPct: 68,
        timeline: [
          { stage: 'Planned', date: '2026-02-15', completed: true },
          { stage: 'Preparing', date: '2026-03-05', completed: true },
          { stage: 'Planted', date: '2026-03-20', completed: true },
          { stage: 'Growing', date: '2026-04-15', completed: true },
          { stage: 'Flowering', date: '2026-05-10', completed: true, current: true },
          { stage: 'Maturing', date: '2026-05-28', completed: false },
          { stage: 'Harvesting', date: '2026-06-05', completed: false },
          { stage: 'Completed', date: '2026-06-15', completed: false }
        ]
      },
      {
        id: 'cyc-003',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'East Plateau Parcel 1',
        fieldId: 'fld-003',
        crop: 'Wheat (Triticum aestivum)',
        variety: 'Kenya Tayari',
        seasonName: '2026 Highland Wheat Cycle',
        startDate: '2026-01-10',
        expectedHarvestDate: '2026-05-25',
        stage: 'Maturing',
        subStage: 'Hard Dough',
        targetYield: '3.8 t/ha',
        targetYieldKgHa: 3800,
        areaHa: 4.20,
        status: 'ACTIVE',
        progressPct: 84,
        timeline: [
          { stage: 'Planned', date: '2025-12-15', completed: true },
          { stage: 'Preparing', date: '2025-12-28', completed: true },
          { stage: 'Planted', date: '2026-01-10', completed: true },
          { stage: 'Growing', date: '2026-02-20', completed: true },
          { stage: 'Flowering', date: '2026-03-25', completed: true },
          { stage: 'Maturing', date: '2026-04-20', completed: true, current: true },
          { stage: 'Harvesting', date: '2026-05-15', completed: false },
          { stage: 'Completed', date: '2026-05-30', completed: false }
        ]
      },
      {
        id: 'cyc-004',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'West Terraces Parcel 2',
        fieldId: 'fld-004',
        crop: 'Irish Potato (Solanum tuberosum)',
        variety: 'Shangi Certified',
        seasonName: '2026 Late Season Tuber',
        startDate: '2026-05-01',
        expectedHarvestDate: '2026-08-20',
        stage: 'Preparing',
        subStage: 'Land Tilth & Ridge Formation',
        targetYield: '17.2 t/ha',
        targetYieldKgHa: 17200,
        areaHa: 4.00,
        status: 'PREPARING',
        progressPct: 15,
        timeline: [
          { stage: 'Planned', date: '2026-03-01', completed: true },
          { stage: 'Preparing', date: '2026-04-15', completed: true, current: true },
          { stage: 'Planted', date: '2026-05-01', completed: false },
          { stage: 'Growing', date: '2026-06-01', completed: false },
          { stage: 'Flowering', date: '2026-06-25', completed: false },
          { stage: 'Maturing', date: '2026-07-20', completed: false },
          { stage: 'Harvesting', date: '2026-08-10', completed: false },
          { stage: 'Completed', date: '2026-08-25', completed: false }
        ]
      }
    ];
  }
};

// 4. Weather & Climate Service
export const weatherService = {
  async getRecentObservations() {
    return await api.getRecentWeather();
  },
  async getForecasts() {
    return [
      { date: '2026-09-15', tempMax: 26, tempMin: 14, rainMm: 12.4, rainProbability: 85, condition: 'Scattered Afternoon Showers' },
      { date: '2026-09-16', tempMax: 24, tempMin: 13, rainMm: 18.0, rainProbability: 90, condition: 'Convective Rain Storms' },
      { date: '2026-09-17', tempMax: 25, tempMin: 14, rainMm: 4.2, rainProbability: 40, condition: 'Partly Cloudy' },
      { date: '2026-09-18', tempMax: 27, tempMin: 15, rainMm: 0.0, rainProbability: 10, condition: 'Sunny / Clear Skies' },
      { date: '2026-09-19', tempMax: 28, tempMin: 15, rainMm: 0.0, rainProbability: 15, condition: 'Clear / Optimal Spraying' }
    ];
  },
  async getAlerts() {
    return [
      { id: 'alt-01', severity: 'HIGH', headline: 'Intense Precipitation Advisory (40-60mm)', region: 'Nakuru High Plains', effectiveUntil: 'Thursday 18:00', trigger: 'Convective cloud top temp < -52°C, Precipitable water > 38mm', date: '2026-09-14 08:30', status: 'ACTIVE', affectedFarms: 'Green Valley Model Farm, Rongai Sunrise Farm', affectedCrops: 'Highland Maize (V6 stage lodging risk), Dry Beans' },
      { id: 'alt-02', severity: 'MEDIUM', headline: 'High Evapotranspiration Rate Expected', region: 'Uasin Gishu Plateau', effectiveUntil: 'Sunday 12:00', trigger: 'Solar radiation > 24 MJ/m²/day, Vapor Pressure Deficit > 2.4 kPa', date: '2026-09-13 14:00', status: 'ACTIVE', affectedFarms: 'Eldoret Seed Maize Block B', affectedCrops: 'Seed Maize, Canola' },
      { id: 'alt-03', severity: 'LOW', headline: 'Optimal Spray Window (Wind < 8 km/h)', region: 'Rongai Valley', effectiveUntil: 'Tomorrow 10:00', trigger: 'Sustained wind speed 4-7 km/h, Inversion height > 150m', date: '2026-09-14 16:00', status: 'ADVISORY', affectedFarms: 'Rongai Terraces', affectedCrops: 'Wheat (Fungicide spray window)' },
      { id: 'alt-04', severity: 'CRITICAL', headline: 'Hail Cell Potential Alert', region: 'Mau Escarpment Western Flank', effectiveUntil: 'Today 21:00', trigger: 'Radar reflectivity > 54 dBZ, CAPE > 2100 J/kg', date: '2026-09-14 17:15', status: 'ACTIVE', affectedFarms: 'Mau Forest Border Farm Parcels', affectedCrops: 'Horticultural Vegetables, Tea' }
    ];
  },
  async getStations() {
    return [
      { id: 'stn-001', code: 'NKU-01', name: 'Nakuru Agromet Primary', region: 'Nakuru High Plains', lat: -0.3031, lon: 36.0800, elevationM: 1860, type: 'WMO Synoptic Class 1', status: 'ONLINE', dataQualityScore: 99.4, lastSync: '1 min ago', temp: 22.4, humidity: 68, rain24h: 18.2, windSpeed: 6.2, windDirection: 'ENE (68°)', pressureHpa: 1014.2, solarRadiationWm2: 680, batteryVolts: 13.8, network: '4G LTE Cellular Telemetry' },
      { id: 'stn-002', code: 'ELD-02', name: 'Eldoret Regional Synoptic', region: 'Uasin Gishu Plateau', lat: 0.5143, lon: 35.2698, elevationM: 2095, type: 'Automated Weather Station (AWS)', status: 'ONLINE', dataQualityScore: 98.1, lastSync: '3 mins ago', temp: 20.8, humidity: 74, rain24h: 8.4, windSpeed: 8.5, windDirection: 'NE (45°)', pressureHpa: 1012.8, solarRadiationWm2: 610, batteryVolts: 13.6, network: '4G LTE Cellular Telemetry' },
      { id: 'stn-003', code: 'KIT-03', name: 'Kitale Agricultural Research Station', region: 'Trans-Nzoia Basin', lat: 1.0167, lon: 35.0069, elevationM: 1900, type: 'Agro-meteorological Hub', status: 'DEGRADED', dataQualityScore: 94.2, lastSync: '6 mins ago', temp: 23.5, humidity: 62, rain24h: 2.0, windSpeed: 5.1, windDirection: 'E (90°)', pressureHpa: 1015.0, solarRadiationWm2: 720, batteryVolts: 12.1, network: 'LoRaWAN Gateway + Satellite Backup' },
      { id: 'stn-004', code: 'NAI-04', name: 'Naivasha Horticultural Telemetry', region: 'Rift Valley Lake Basin', lat: -0.7172, lon: 36.4310, elevationM: 1890, type: 'Micro-climate Sensor Array', status: 'ONLINE', dataQualityScore: 99.8, lastSync: '30 secs ago', temp: 24.1, humidity: 58, rain24h: 0.0, windSpeed: 4.8, windDirection: 'SE (135°)', pressureHpa: 1013.6, solarRadiationWm2: 790, batteryVolts: 14.1, network: 'Fiber / IP Telemetry' },
      { id: 'stn-005', code: 'RON-05', name: 'Rongai Valley Automated Station', region: 'Rongai Sub-County', lat: -0.1720, lon: 35.8640, elevationM: 1740, type: 'Field Agromet Unit', status: 'ONLINE', dataQualityScore: 97.6, lastSync: '2 mins ago', temp: 25.0, humidity: 55, rain24h: 1.2, windSpeed: 7.0, windDirection: 'NE (50°)', pressureHpa: 1016.1, solarRadiationWm2: 745, batteryVolts: 13.5, network: '4G LTE Cellular Telemetry' }
    ];
  },
  async getHistoricalSeries(stationId = 'stn-001', timeframe = 'daily') {
    // Returns analytical time-series records for charts
    return [
      { period: '2026-09-01', tempMean: 20.2, tempMax: 24.8, tempMin: 14.1, rainMm: 4.2, humidity: 65, windSpeed: 5.8, solarMj: 18.4, gdd: 10.2 },
      { period: '2026-09-02', tempMean: 21.0, tempMax: 25.5, tempMin: 14.5, rainMm: 0.0, humidity: 62, windSpeed: 6.2, solarMj: 21.0, gdd: 11.0 },
      { period: '2026-09-03', tempMean: 21.8, tempMax: 26.2, tempMin: 15.0, rainMm: 1.5, humidity: 60, windSpeed: 5.4, solarMj: 22.4, gdd: 11.8 },
      { period: '2026-09-04', tempMean: 19.5, tempMax: 23.0, tempMin: 13.8, rainMm: 14.8, humidity: 78, windSpeed: 8.1, solarMj: 14.2, gdd: 9.5 },
      { period: '2026-09-05', tempMean: 18.9, tempMax: 22.4, tempMin: 13.2, rainMm: 22.0, humidity: 84, windSpeed: 7.6, solarMj: 12.8, gdd: 8.9 },
      { period: '2026-09-06', tempMean: 20.4, tempMax: 24.6, tempMin: 14.0, rainMm: 6.5, humidity: 72, windSpeed: 6.0, solarMj: 17.5, gdd: 10.4 },
      { period: '2026-09-07', tempMean: 21.2, tempMax: 25.8, tempMin: 14.6, rainMm: 0.0, humidity: 64, windSpeed: 5.5, solarMj: 20.8, gdd: 11.2 },
      { period: '2026-09-08', tempMean: 22.0, tempMax: 26.7, tempMin: 15.2, rainMm: 0.0, humidity: 58, windSpeed: 4.9, solarMj: 23.1, gdd: 12.0 },
      { period: '2026-09-09', tempMean: 21.6, tempMax: 26.0, tempMin: 15.0, rainMm: 2.4, humidity: 63, windSpeed: 5.8, solarMj: 19.7, gdd: 11.6 },
      { period: '2026-09-10', tempMean: 20.1, tempMax: 23.8, tempMin: 14.2, rainMm: 16.0, humidity: 80, windSpeed: 7.4, solarMj: 15.0, gdd: 10.1 },
      { period: '2026-09-11', tempMean: 19.8, tempMax: 23.2, tempMin: 13.9, rainMm: 18.5, humidity: 82, windSpeed: 6.8, solarMj: 13.9, gdd: 9.8 },
      { period: '2026-09-12', tempMean: 21.4, tempMax: 25.4, tempMin: 14.4, rainMm: 3.1, humidity: 67, windSpeed: 5.2, solarMj: 18.8, gdd: 11.4 },
      { period: '2026-09-13', tempMean: 22.1, tempMax: 26.5, tempMin: 14.9, rainMm: 0.0, humidity: 61, windSpeed: 6.0, solarMj: 21.6, gdd: 12.1 },
      { period: '2026-09-14', tempMean: 22.4, tempMax: 26.8, tempMin: 15.1, rainMm: 0.2, humidity: 68, windSpeed: 6.2, solarMj: 20.2, gdd: 12.4 }
    ];
  },
  async getClimateTrends() {
    return {
      rainfallAnomalyPct: +14.2, // 14.2% above 30-year climatological normal
      temperatureAnomalyC: +0.65, // 0.65°C above baseline
      seasonProgressionPct: 68,
      cumulativeRainMm: 486.2,
      normalRainMm: 425.8,
      gddAccumulated: 1142,
      gddTarget: 1450,
      anomalies: [
        { parameter: 'Intense 1h Rainfall Surge', date: '2026-09-05', value: '38.4 mm/hr', threshold: '25.0 mm/hr', severity: 'HIGH', description: 'Convective storm cloudburst exceeded 95th percentile intensity.' },
        { parameter: 'Nocturnal Minimum Temperature Dip', date: '2026-09-02', value: '8.4°C', threshold: '10.5°C', severity: 'MEDIUM', description: 'Radiational cooling event near Mau forest canopy.' },
        { parameter: 'Vapor Pressure Deficit Spike', date: '2026-08-28', value: '2.85 kPa', threshold: '2.20 kPa', severity: 'MEDIUM', description: 'Atmospheric dryness induced temporary stomatal closure in maize.' }
      ],
      seasonalPatterns: [
        { month: 'April', rainfallMm: 142.5, climatologyMm: 130.0, tempMean: 20.8, status: 'NORMAL' },
        { month: 'May', rainfallMm: 118.0, climatologyMm: 105.0, tempMean: 20.4, status: 'SLIGHTLY_WET' },
        { month: 'June', rainfallMm: 62.4, climatologyMm: 55.0, tempMean: 19.8, status: 'NORMAL' },
        { month: 'July', rainfallMm: 45.2, climatologyMm: 48.0, tempMean: 19.2, status: 'NORMAL' },
        { month: 'August', rainfallMm: 72.8, climatologyMm: 62.0, tempMean: 19.9, status: 'WET' },
        { month: 'September (MTD)', rainfallMm: 45.3, climatologyMm: 25.8, tempMean: 21.6, status: 'ANOMALOUSLY_WET' }
      ]
    };
  },
  async getDataQualityMetrics() {
    return [
      { station: 'Nakuru Agromet [NKU-01]', code: 'NKU-01', completeness: '99.4%', missingPackets: 4, delayedPackets: 2, invalidReadings: 0, latency: '42ms', status: 'OPERATIONAL', lastPacket: '1 min ago', powerStatus: 'Solar Float 13.8V', sensorIntegrity: '100%' },
      { station: 'Eldoret Synoptic [ELD-02]', code: 'ELD-02', completeness: '98.1%', missingPackets: 18, delayedPackets: 6, invalidReadings: 1, latency: '65ms', status: 'OPERATIONAL', lastPacket: '3 mins ago', powerStatus: 'Mains Buffer 13.6V', sensorIntegrity: '99.2%' },
      { station: 'Kitale Agromet [KIT-03]', code: 'KIT-03', completeness: '94.2%', missingPackets: 54, delayedPackets: 28, invalidReadings: 4, latency: '110ms', status: 'DEGRADED', lastPacket: '6 mins ago', powerStatus: 'Battery Depleting 12.1V', sensorIntegrity: '95.8%' },
      { station: 'Naivasha Lake Station [NAI-04]', code: 'NAI-04', completeness: '99.8%', missingPackets: 2, delayedPackets: 0, invalidReadings: 0, latency: '35ms', status: 'OPERATIONAL', lastPacket: '30 secs ago', powerStatus: 'Solar Float 14.1V', sensorIntegrity: '100%' },
      { station: 'Rongai Valley AWS [RON-05]', code: 'RON-05', completeness: '97.6%', missingPackets: 22, delayedPackets: 8, invalidReadings: 1, latency: '52ms', status: 'OPERATIONAL', lastPacket: '2 mins ago', powerStatus: 'Solar Float 13.5V', sensorIntegrity: '98.9%' }
    ];
  }
};

// 5. Agronomic Recommendation Service
export const recommendationService = {
  async getPreSeasonCrops(params = {}) {
    try {
      const res = await api.getPreSeasonCropRecommendations(params);
      if (res && res.recommendations) return res.recommendations;
    } catch (e) {
      console.warn('Backend unavailable, using client-side pre-season evaluator', e);
    }
    return [
      {
        cropId: 'crop-001',
        cropName: 'Maize (Zea mays)',
        suitabilityScore: 92,
        suitabilityClass: 'HIGHLY_SUITABLE',
        recommendationType: 'Crop Selection',
        rationale: 'Seasonal forecast (680mm rain, 21.5°C) provides excellent conditions for vegetative expansion.',
        recommendedVarieties: 'H614D (Highland Hybrid)',
        riskFactors: ['Potential ear rot if sustained humidity >80% during drying'],
        keyOpportunities: ['Hydrothermal index matches optimal grain filling requirements']
      },
      {
        cropId: 'crop-003',
        cropName: 'Dry Beans (Phaseolus vulgaris)',
        suitabilityScore: 85,
        suitabilityClass: 'HIGHLY_SUITABLE',
        recommendationType: 'Crop Selection',
        rationale: 'Optimal for nitrogen-fixing intercropping or rotation under moderate rainfall.',
        recommendedVarieties: 'Rosecoco GLP-2 / Mwitemania',
        riskFactors: ['Heavy waterlogging if planted in non-ridged clay swales'],
        keyOpportunities: ['Short 75-day maturity window allows early cash turnaround']
      },
      {
        cropId: 'crop-002',
        cropName: 'Wheat (Triticum aestivum)',
        suitabilityScore: 78,
        suitabilityClass: 'MODERATELY_SUITABLE',
        recommendationType: 'Crop Selection',
        rationale: 'Cool highland conditions favor tillering, but monitor moisture during stem extension.',
        recommendedVarieties: 'Kenya Tayari / Robin',
        riskFactors: ['Yellow rust risk under cool damp nights'],
        keyOpportunities: ['High market demand in regional milling hubs']
      }
    ];
  },

  async getDailyDirectives(params = {}) {
    try {
      const res = await api.getDailyOperationalDirectives(params);
      if (res && res.directives) return res.directives;
    } catch (e) {
      console.warn('Backend unavailable, using client-side directives', e);
    }
    return [
      {
        id: 'dir-01',
        category: 'SPRAYING',
        title: 'Optimal Crop Spraying Window Open',
        actionRequired: 'Execute planned fungicide or herbicide spraying before 10:30 AM while wind speed remains low.',
        why: 'Sustained wind speed (6.2 km/h) is well below the 9.0 km/h drift limit, and no rain is forecast for 24h.',
        urgency: 'HIGH',
        dueTimeframe: 'Next 24 Hours',
        crop: 'Highland Hybrid Maize (H614D)',
        field: 'North Field A',
        confidenceScore: 94,
        supportingWeather: { WindSpeed: '6.2 km/h (Calm)', RainForecast: '0.0 mm (Dry)', AirTemp: '22.4°C' }
      },
      {
        id: 'dir-02',
        category: 'FERTILIZER',
        title: 'Top-Dress Nitrogen (CAN) Before Showers',
        actionRequired: 'Apply Calcium Ammonium Nitrate (CAN) at 50 kg/acre 5cm from plant bases within the next 48 hours.',
        why: 'Field is in rapid vegetative growth (V6). Forecasted showers (14mm) will dissolve and incorporate nitrogen into root zones without leaching.',
        urgency: 'HIGH',
        dueTimeframe: 'Within 48 Hours',
        crop: 'Highland Hybrid Maize (H614D)',
        field: 'North Field A',
        confidenceScore: 96,
        supportingWeather: { CropStage: 'Vegetative V6', ForecastRain: '14.0 mm expected', SoilMoisture: '18.2 mm past 24h' }
      },
      {
        id: 'dir-03',
        category: 'PEST_DISEASE',
        title: 'High Fungal Blight / Rust Inoculum Alert',
        actionRequired: 'Inspect lower leaves and canopy for fungal sporulation; prepare preventive broad-spectrum fungicide.',
        why: 'Sustained humidity (68%) with mild temperatures (22.4°C) elevates risk of leaf blight and fungal sporulation.',
        urgency: 'CRITICAL',
        dueTimeframe: 'Today',
        crop: 'Dry Beans (Rosecoco)',
        field: 'South Field B',
        confidenceScore: 91,
        supportingWeather: { Humidity: '68% (Elevated)', Temperature: '22.4°C', PathogenRisk: 'Anthracnose / Rust' }
      }
    ];
  },

  async getRules(cropId = null) {
    try {
      const res = await api.getAgronomicRules(cropId);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (e) {
      console.warn('Backend rules endpoint unreachable, using client rules fallback', e);
    }
    return [
      {
        id: 'rule-001',
        cropId: 'crop-001',
        ruleType: 'FERTILIZER_TIMING',
        title: 'Top-Dress Nitrogen (CAN) Before Upcoming Showers',
        growthStage: 'Vegetative V6',
        triggerCondition: 'Rain forecasted 8-30mm within 48h during V6 vegetative growth',
        actionDirective: 'Apply Calcium Ammonium Nitrate (CAN) at 50 kg/acre 5cm from plant bases within the next 48 hours.',
        rationale: 'Field is in rapid vegetative growth. Forecasted rain will dissolve and incorporate nitrogen into root zones without leaching.',
        urgency: 'HIGH',
        isActive: true,
        authoredBy: 'Dr. Sarah Mwangi (Senior Agronomist - KALRO)'
      },
      {
        id: 'rule-002',
        cropId: 'crop-002',
        ruleType: 'DISEASE_RISK',
        title: 'High Fungal Blight / Yellow Rust Inoculum Alert',
        growthStage: 'Tillering to Stem Extension',
        triggerCondition: 'Relative humidity > 72% for > 24h at mild temps 15-23°C',
        actionDirective: 'Inspect lower leaves and canopy for fungal sporulation; prepare preventive broad-spectrum fungicide.',
        rationale: 'Sustained humidity with mild temperatures creates ideal microclimatic conditions for fungal germination.',
        urgency: 'CRITICAL',
        isActive: true,
        authoredBy: 'Dr. Sarah Mwangi (Senior Agronomist - KALRO)'
      },
      {
        id: 'rule-003',
        cropId: null,
        ruleType: 'SPRAY_WINDOW',
        title: 'Optimal Crop Spraying Window Open',
        growthStage: 'Any Active Stage',
        triggerCondition: 'Wind speed < 9 km/h and rain forecast < 5mm for 24h',
        actionDirective: 'Execute planned fungicide or herbicide spraying before 10:30 AM while wind speed remains low.',
        rationale: 'Sustained wind speed is below the 9.0 km/h drift limit, and no rain is predicted to wash off applications.',
        urgency: 'HIGH',
        isActive: true,
        authoredBy: 'Dr. Sarah Mwangi (Senior Agronomist - KALRO)'
      },
      {
        id: 'rule-004',
        cropId: 'crop-003',
        ruleType: 'IRRIGATION_DEFICIT',
        title: 'Supplemental Irrigation: Flowering Moisture Stress Prevention',
        growthStage: 'Flowering R1',
        triggerCondition: 'Rain last 24h < 2mm and forecast rain 48h < 5mm during flowering',
        actionDirective: 'Schedule 15mm supplemental drip or furrow irrigation to protect flowers from thermal abortion.',
        rationale: 'Crop is at sensitive flowering stage with insufficient soil moisture and negligible rain in the 48h forecast.',
        urgency: 'HIGH',
        isActive: true,
        authoredBy: 'Dr. Sarah Mwangi (Senior Agronomist - KALRO)'
      },
      {
        id: 'rule-005',
        cropId: 'crop-001',
        ruleType: 'PRE_SEASON_CROP_SELECTION',
        title: 'Maize Seasonal Hydrothermal Suitability Matrix',
        growthStage: 'Pre-Season Planning',
        triggerCondition: 'Seasonal forecast precipitation 500-900mm with mean temp 18-28°C and soil pH 5.8-7.0',
        actionDirective: 'Recommend Highland Hybrid H614D for high rain forecast; recommend DK8031 if forecast drops below 450mm.',
        rationale: 'Hydrothermal index matches optimal grain filling requirements for East African highlands.',
        urgency: 'HIGH',
        isActive: true,
        authoredBy: 'Dr. Sarah Mwangi (Senior Agronomist - KALRO)'
      }
    ];
  },

  async addRule(ruleData) {
    try {
      return await api.createAgronomicRule(ruleData);
    } catch (e) {
      console.warn('Failed to post rule to backend, saved locally', e);
      return { success: true, ...ruleData };
    }
  },

  async listRecommendations() {
    return [
      {
        id: 'rec-001',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'North Field A (Hybrid Trial)',
        fieldId: 'fld-001',
        crop: 'Highland Hybrid Maize (H614D)',
        cropId: 'crop-001',
        recommendationType: 'Planting',
        recommendationMessage: 'Maize conditions are currently favourable for nitrogen top-dressing and rapid vegetative expansion.',
        recommendationReason: 'Recent rainfall has restored root-zone field capacity; daytime temperatures are optimal with moderate upcoming showers.',
        confidenceScore: 94,
        suitabilityScore: 82,
        riskScore: 18,
        weatherFactors: {
          recentRainfall: 'favourable (18.2 mm past 48h)',
          temperature: 'favourable (22.4°C mean)',
          forecastRainfall: 'moderate (12.4 mm in next 48h)',
          currentSeason: 'suitable (2026 Long Rains season)'
        },
        suggestedAction: 'Consider applying nitrogen top-dressing (CAN 50 kg/acre) adjacent to plant root zones before Thursday precipitation.',
        riskFactors: [
          'Heavy downpour >30 mm within 4 hours could trigger localized leaching in swales',
          'Avoid surface broadcast without light soil incorporation'
        ],
        historicalComparison: 'In the 2025 Long Rains season, timely V6 top-dressing yielded +17.4% grain mass over untreated checks.',
        createdDate: '2026-09-14 08:30',
        validUntil: '2026-09-17 18:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-002',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'East Plateau Parcel 1',
        fieldId: 'fld-003',
        crop: 'Wheat (Kenya Tayari)',
        cropId: 'crop-002',
        recommendationType: 'Risk warning',
        recommendationMessage: 'Yellow Rust spore proliferation risk is critical under nocturnal dew conditions.',
        recommendationReason: 'Persistent relative humidity >75% for 48h combined with temperatures between 16-20°C maximizes Puccinia striiformis germination.',
        confidenceScore: 88,
        suitabilityScore: 76,
        riskScore: 82,
        weatherFactors: {
          recentRainfall: 'excessive (persistent morning dampness)',
          temperature: 'cool / favourable for fungi (19.8°C)',
          forecastRainfall: 'intermittent showers (8.4 mm)',
          currentSeason: 'high pathogen index period'
        },
        suggestedAction: 'Execute preventive triazole/strobilurin fungicide spray during the morning calm wind window (<8 km/h).',
        riskFactors: [
          'High flag leaf infection rate will reduce 1,000-grain weight by up to 26%',
          'Wind drift risk if sprayed after 11:00 AM'
        ],
        historicalComparison: 'Parcels treated within 36 hours of rust alert in 2024 preserved 96% flag leaf green area.',
        createdDate: '2026-09-13 14:15',
        validUntil: '2026-09-15 12:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-003',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'South Field B (Legume Rotation)',
        fieldId: 'fld-002',
        crop: 'Dry Beans (Rosecoco GLP-2)',
        cropId: 'crop-003',
        recommendationType: 'Irrigation',
        recommendationMessage: 'Supplemental furrow irrigation recommended to avert flower abscission.',
        recommendationReason: 'Root zone matric potential reached 44 kPa during peak flowering, approaching moisture threshold.',
        confidenceScore: 91,
        suitabilityScore: 79,
        riskScore: 42,
        weatherFactors: {
          recentRainfall: 'deficit (0.0 mm past 72h)',
          temperature: 'elevated afternoon peak (25.4°C)',
          forecastRainfall: 'low probability (<4 mm over 48h)',
          currentSeason: 'critical R1 flowering window'
        },
        suggestedAction: 'Apply 15 mm supplemental furrow irrigation in early morning to protect flower set.',
        riskFactors: [
          'Avoid afternoon irrigation to minimize overnight humidity and root collar fungal rots'
        ],
        historicalComparison: 'Maintained moisture at flowering in 2025 achieved 2.1 t/ha vs 1.5 t/ha on moisture-stressed control plots.',
        createdDate: '2026-09-12 11:00',
        validUntil: '2026-09-15 08:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-004',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'West Terraces Parcel 2',
        fieldId: 'fld-004',
        crop: 'Irish Potato (Shangi Certified)',
        cropId: 'crop-004',
        recommendationType: 'Weather preparation',
        recommendationMessage: 'Consolidate ridge mounding ahead of convective storms to prevent tuber exposure.',
        recommendationReason: 'Heavy rainfall forecasted later this week risks furrow washouts and soil crusting over shallow tubers.',
        confidenceScore: 86,
        suitabilityScore: 88,
        riskScore: 35,
        weatherFactors: {
          recentRainfall: 'adequate workable tilth (1.2 mm)',
          temperature: 'moderate (17.5°C)',
          forecastRainfall: 'heavy showers anticipated (22.0 mm)',
          currentSeason: 'tuber initiation stage'
        },
        suggestedAction: 'Hill ridges with 8-10 cm friable soil and clean furrow drains to ensure rapid gravity run-off.',
        riskFactors: [
          'Unmounded tubers risk greening and sunburn, leading to >15% market grade discount'
        ],
        historicalComparison: 'High-ridged potato blocks suffered zero greening losses during September 2024 flash storm.',
        createdDate: '2026-09-11 16:30',
        validUntil: '2026-09-16 17:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-005',
        farm: 'Njoro River Parcel 3',
        farmId: 'farm-003',
        field: 'South Plot Block B',
        fieldId: 'fld-005',
        crop: 'Cabbage (Gloria F1)',
        cropId: 'crop-005',
        recommendationType: 'Monitoring',
        recommendationMessage: 'Scout cabbage heart leaves for Diamondback Moth (DBM) larval entry.',
        recommendationReason: 'Degree-day accumulation indicates second-generation DBM flight activity in Nakuru basin.',
        confidenceScore: 89,
        suitabilityScore: 85,
        riskScore: 48,
        weatherFactors: {
          recentRainfall: 'moderate (2.0 mm)',
          temperature: 'warm afternoons (23.5°C)',
          forecastRainfall: 'scattered light showers',
          currentSeason: 'head formation'
        },
        suggestedAction: 'Sample 20 plants per quadrant. If larval threshold exceeds 2 per plant, prepare biological Bt spray.',
        riskFactors: [
          'Larval tunneling into developing head leads to unmarketable produce'
        ],
        historicalComparison: 'Early scouting in 2025 averted broad-spectrum pesticide reliance and preserved parasitoid wasps.',
        createdDate: '2026-09-10 09:00',
        validUntil: '2026-09-17 12:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-006',
        farm: 'Bahati Green Acres',
        farmId: 'farm-004',
        field: 'Terrace Parcel 1',
        fieldId: 'fld-006',
        crop: 'Soybeans (SC Squire)',
        cropId: 'crop-006',
        recommendationType: 'Crop selection',
        recommendationMessage: 'SC Squire soybean variety confirmed optimal for upcoming short rains rotation.',
        recommendationReason: 'Soil pH of 6.2 and 1,800m elevation perfectly match cultivar maturity group 5 requirements.',
        confidenceScore: 92,
        suitabilityScore: 91,
        riskScore: 12,
        weatherFactors: {
          recentRainfall: 'favourable soil moisture reserve',
          temperature: 'ideal for germination (21.0°C)',
          forecastRainfall: 'bimodal onset expected on schedule',
          currentSeason: 'post-cereal rotation window'
        },
        suggestedAction: 'Procure certified seed and inoculant (Biofix Rhizobium) for mid-October planting.',
        riskFactors: [
          'Ensure inoculant is stored in cool shade away from direct sunlight'
        ],
        historicalComparison: 'Soybean legume rotation contributed +35 kg/ha residual nitrogen to succeeding cereal crop in 2025.',
        createdDate: '2026-09-08 10:00',
        validUntil: '2026-10-01 18:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-007',
        farm: 'Eldoret Seed Block B',
        farmId: 'farm-005',
        field: 'North Field 3',
        fieldId: 'fld-007',
        crop: 'Canola (Brassica napus)',
        cropId: 'crop-007',
        recommendationType: 'Harvest',
        recommendationMessage: 'Crop has reached 85% pod silique color change; initiate swathing window.',
        recommendationReason: 'Seed moisture has dropped to 14%. Impending high wind speed increases pod shattering risk.',
        confidenceScore: 95,
        suitabilityScore: 94,
        riskScore: 28,
        weatherFactors: {
          recentRainfall: 'dry conditions (0.0 mm past 5 days)',
          temperature: 'warm drying weather (26.5°C)',
          forecastRainfall: 'clear skies for next 48h',
          currentSeason: 'physiological maturity reached'
        },
        suggestedAction: 'Swath or direct combine with pod-sealant during morning when pods are less brittle.',
        riskFactors: [
          'Delaying past 3 days increases wind-induced shattering losses up to 18%'
        ],
        historicalComparison: 'Morning swathing preserved an additional 320 kg/ha seed yield in the 2024 harvest.',
        createdDate: '2026-09-14 07:00',
        validUntil: '2026-09-16 18:00',
        status: 'ACTIVE'
      },
      {
        id: 'rec-008',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'North Field A',
        fieldId: 'fld-001',
        crop: 'Highland Hybrid Maize (H614D)',
        cropId: 'crop-001',
        recommendationType: 'Crop suitability',
        recommendationMessage: 'Agro-ecological suitability re-verified at Class S1 (Highly Suitable) for long-duration maize.',
        recommendationReason: 'Cumulative Growing Degree Days (GDD) and soil chemical profile exceed regional benchmark requirements.',
        confidenceScore: 96,
        suitabilityScore: 92,
        riskScore: 10,
        weatherFactors: {
          recentRainfall: 'favourable (88.5% of seasonal optimum)',
          temperature: 'optimal thermal accumulation (GDD 1,142)',
          forecastRainfall: 'normal precipitation distribution',
          currentSeason: '2026 Long Rains'
        },
        suggestedAction: 'Maintain current agronomic calendar. Next suitability recalculation scheduled for flowering onset.',
        riskFactors: [
          'Monitor for potential late-season dry spell during final kernel desiccation'
        ],
        historicalComparison: 'AEZ III/IV suitability class S1 achieved 5.6 t/ha regional average over 5-year baseline.',
        createdDate: '2026-09-14 06:00',
        validUntil: '2026-09-30 23:59',
        status: 'ACTIVE'
      }
    ];
  },
  async getRecommendationById(id) {
    const list = await this.listRecommendations();
    return list.find(r => r.id === id) || list[0];
  },
  async getSuitabilityAnalysis(fieldId = 'fld-001', cropId = 'crop-001') {
    return {
      fieldId,
      cropId,
      cropName: 'Highland Hybrid Maize (H614D)',
      scientificName: 'Zea mays',
      overallScore: 91.5,
      suitabilityRating: 'Excellent',
      suitabilityClass: 'S1 HIGHLY SUITABLE',
      temperatureSuitability: {
        score: 94.0,
        rating: 'Excellent',
        meanTemp: '21.5°C',
        optimalRange: '18.0°C - 30.0°C',
        statusText: 'Growing degree days (GDD) accumulating at ideal rate; no frost risk detected.'
      },
      rainfallSuitability: {
        score: 88.5,
        rating: 'Good',
        seasonalTotal: '720 mm',
        requiredRange: '500 mm - 750 mm',
        statusText: 'Adequate bimodal distribution; 88.5% sufficiency for physiological evapotranspiration demand.'
      },
      recentWeatherSuitability: {
        score: 92.0,
        rating: 'Excellent',
        rainfall24h: '18 mm',
        tempRange: '16.2°C - 25.4°C',
        statusText: 'Recent rains have restored root zone field capacity without runoff.'
      },
      seasonalSuitability: {
        score: 90.0,
        rating: 'Excellent',
        seasonName: '2026 Long Rains',
        statusText: 'Climatic forecast aligns with the 105-120 day maturation window.'
      },
      edaphicSuitability: {
        score: 92.0,
        rating: 'Excellent',
        soilPh: 6.4,
        organicMatter: '3.8%',
        drainage: 'Well drained loam'
      },
      riskIndicators: [
        { risk: 'Thermal Volatility', level: 'LOW', detail: 'Temperature swings stay within safe photosynthetic limits.' },
        { risk: 'Excess Moisture / Waterlogging', level: 'LOW', detail: 'High percolation rate on volcanic loam prevents saturation > 24h.' },
        { risk: 'Late Season Dry Spell', level: 'MODERATE', detail: 'Slight risk of premature rain cessation during grain dough filling.' }
      ],
      limitingFactors: 'Slight seasonal soil drainage lag on southern parcel boundary; fully manageable via standard ridge tillage.'
    };
  }
};

// 6. Yield Intelligence & Prediction Service
export const yieldService = {
  async getEstimates() {
    return [
      { crop: 'Maize (Highland Hybrid H614D)', areaHa: 12.5, benchmarkKgHa: 4500, projectedKgHa: 5620, confidence: '89%', variancePct: 24.8 },
      { crop: 'Wheat (Kenya Tayari)', areaHa: 8.2, benchmarkKgHa: 3500, projectedKgHa: 3850, confidence: '84%', variancePct: 10.0 },
      { crop: 'Dry Beans (Rosecoco GLP-2)', areaHa: 4.8, benchmarkKgHa: 1800, projectedKgHa: 2100, confidence: '91%', variancePct: 16.6 },
      { crop: 'Irish Potatoes (Shangi)', areaHa: 6.0, benchmarkKgHa: 15000, projectedKgHa: 17200, confidence: '87%', variancePct: 14.6 }
    ];
  }
};

// 7. Field Operations, Scouting & Inspection Service
export const fieldOperationService = {
  async listAssignedFarmers() {
    return [
      {
        id: 'fmr-001',
        name: 'John Kamau',
        phone: '+254 712 345 678',
        email: 'john.kamau@farms.ke',
        location: 'Nakuru High Plains, Sub-zone 4',
        farmName: 'Green Valley Model Farm',
        farmId: 'farm-001',
        areaHa: 12.5,
        primaryCrop: 'Maize (H614D)',
        secondaryCrop: 'Dry Beans (Rosecoco)',
        activeCyclesCount: 2,
        riskLevel: 'LOW',
        riskFactors: 'Normal V6 growth trajectory',
        lastVisitDate: '2026-09-08',
        nextVisitDate: '2026-09-15',
        assistanceRequest: null,
        pendingFollowUps: 0
      },
      {
        id: 'fmr-002',
        name: 'Alice Chebet',
        phone: '+254 722 987 654',
        email: 'alice.chebet@farms.ke',
        location: 'Rongai Sunrise Basin',
        farmName: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        areaHa: 8.2,
        primaryCrop: 'Wheat (Kenya Tayari)',
        secondaryCrop: 'Irish Potato (Shangi)',
        activeCyclesCount: 2,
        riskLevel: 'HIGH',
        riskFactors: 'Yellow Rust spore proliferation on East Plateau',
        lastVisitDate: '2026-09-02',
        nextVisitDate: '2026-09-17',
        assistanceRequest: 'Urgent: Suspected rust lesions on flag leaf margins; requesting on-site verification & chemical permit.',
        pendingFollowUps: 2
      },
      {
        id: 'fmr-003',
        name: 'Samuel Ochieng',
        phone: '+254 733 112 233',
        email: 'samuel.o@farms.ke',
        location: 'Njoro Agricultural Holding',
        farmName: 'Njoro River Parcel 3',
        farmId: 'farm-003',
        areaHa: 6.4,
        primaryCrop: 'Irish Potato',
        secondaryCrop: 'Cabbage',
        activeCyclesCount: 1,
        riskLevel: 'MEDIUM',
        riskFactors: 'Furrow irrigation pump valve pressure drop',
        lastVisitDate: '2026-08-28',
        nextVisitDate: '2026-09-19',
        assistanceRequest: 'Needs guidance on tensiometer sensor placement and calibration.',
        pendingFollowUps: 1
      },
      {
        id: 'fmr-004',
        name: 'Mary Wambui',
        phone: '+254 744 556 677',
        email: 'mary.wambui@farms.ke',
        location: 'Bahati Valley Slopes',
        farmName: 'Bahati Green Acres',
        farmId: 'farm-004',
        areaHa: 4.8,
        primaryCrop: 'Maize (DK8031)',
        secondaryCrop: 'Soybeans',
        activeCyclesCount: 1,
        riskLevel: 'LOW',
        riskFactors: 'Soil moisture adequate after recent rains',
        lastVisitDate: '2026-09-05',
        nextVisitDate: '2026-09-24',
        assistanceRequest: null,
        pendingFollowUps: 0
      }
    ];
  },
  async listVisits() {
    return [
      {
        id: 'v-001',
        farmer: 'John Kamau',
        farmerId: 'fmr-001',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'North Field A (Hybrid Trial)',
        fieldId: 'fld-001',
        date: '2026-09-15',
        time: '09:30 AM',
        purpose: 'V6 Nitrogen Top-dressing Soil Moisture Verification',
        status: 'SCHEDULED',
        officer: 'Grace Wanjiku',
        weatherCondition: 'Scattered clouds, 22°C, Wind 6 km/h',
        notes: 'Confirm CAN 50kg/acre top-dress suitability ahead of Thursday precipitation. Check tensiometer readings at 20cm depth.'
      },
      {
        id: 'v-002',
        farmer: 'Alice Chebet',
        farmerId: 'fmr-002',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'East Plateau Parcel 1',
        fieldId: 'fld-003',
        date: '2026-09-17',
        time: '11:00 AM',
        purpose: 'Yellow Rust Diagnostic Scouting & Foliar Spray Permitting',
        status: 'PENDING',
        officer: 'Grace Wanjiku',
        weatherCondition: 'Morning dew, 19°C, Wind 5 km/h',
        notes: 'Inspect lower leaf canopy for Puccinia striiformis pustule spread. Verify chemical safety equipment for triazole fungicide application.'
      },
      {
        id: 'v-003',
        farmer: 'Samuel Ochieng',
        farmerId: 'fmr-003',
        farm: 'Njoro River Parcel 3',
        farmId: 'farm-003',
        field: 'South Plot Block B',
        fieldId: 'fld-005',
        date: '2026-09-19',
        time: '02:00 PM',
        purpose: 'Irrigation Drip Line Pressure & Tensiometer Calibration',
        status: 'SCHEDULED',
        officer: 'Grace Wanjiku',
        weatherCondition: 'Sunny, 25°C, Wind 8 km/h',
        notes: 'Assist farmer in calibrating vacuum tensiometer gauge and clearing emitter calcification in lateral drip hoses.'
      },
      {
        id: 'v-004',
        farmer: 'Mary Wambui',
        farmerId: 'fmr-004',
        farm: 'Bahati Green Acres',
        farmId: 'farm-004',
        field: 'Terrace Parcel 1',
        fieldId: 'fld-006',
        date: '2026-09-05',
        time: '10:00 AM',
        purpose: 'Emergence Stand Count & Cutworm Inspection',
        status: 'COMPLETED',
        officer: 'Grace Wanjiku',
        weatherCondition: 'Overcast, 20°C',
        notes: 'Stand count confirmed at 94% emergence uniformity. No significant cutworm damage detected. Seedling vigor excellent.'
      }
    ];
  },
  async getFollowUps() {
    return [
      {
        id: 'fol-001',
        title: 'Verify Rust Foliar Spray Application on East Plateau Parcel 1',
        farmer: 'Alice Chebet',
        farm: 'Rongai Sunrise Farm',
        field: 'East Plateau Parcel 1',
        crop: 'Wheat (Kenya Tayari)',
        severity: 'CRITICAL',
        status: 'PENDING',
        due: '2026-09-18',
        notes: 'Check that preventive fungicide spray occurred during calm wind window (<8 km/h). Verify flag leaf remains uninfected.'
      },
      {
        id: 'fol-002',
        title: 'Inspect South Field B Moisture Recovery Post-Irrigation',
        farmer: 'John Kamau',
        farm: 'Green Valley Model Farm',
        field: 'South Field B (Legume Rotation)',
        crop: 'Dry Beans (Rosecoco)',
        severity: 'WARNING',
        status: 'PENDING',
        due: '2026-09-16',
        notes: 'Confirm soil tension in bean root zone dropped below 30 kPa following supplemental furrow irrigation.'
      },
      {
        id: 'fol-003',
        title: 'Follow up on Tensiometer Sensor Installation at Njoro Plot',
        farmer: 'Samuel Ochieng',
        farm: 'Njoro River Parcel 3',
        field: 'South Plot Block B',
        crop: 'Irish Potato',
        severity: 'MEDIUM',
        status: 'PENDING',
        due: '2026-09-21',
        notes: 'Ensure ceramic tip maintains hydraulic contact with undisturbed soil core at 25cm depth.'
      },
      {
        id: 'fol-004',
        title: 'Follow up on Certified Seed Inoculant Delivery',
        farmer: 'Mary Wambui',
        farm: 'Bahati Green Acres',
        field: 'Terrace Parcel 1',
        crop: 'Soybeans',
        severity: 'LOW',
        status: 'COMPLETED',
        due: '2026-09-06',
        notes: 'Confirmed delivery of KALRO Biofix Rhizobium inoculant.'
      }
    ];
  },
  async listObservations() {
    return [
      {
        id: 'obs-001',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'North Field A (Hybrid Trial)',
        fieldId: 'fld-001',
        crop: 'Maize (Zea mays - H614D)',
        growthStage: 'Vegetative V6 (6 Collared Leaves)',
        category: 'Crop Vigor & Nutrition',
        severity: 'INFO',
        text: 'Vigor score 92/100, robust root crown anchoring and complete inter-row canopy shading. Uniform green collar development with zero chlorosis.',
        notes: 'Plant population density verified at 53,000 plants/ha. Stem girth averaging 24mm. Recommended CAN application window confirmed.',
        date: '2026-09-14',
        scoutName: 'Peter Koech',
        followUpRequired: false,
        followUpStatus: 'Resolved'
      },
      {
        id: 'obs-002',
        farm: 'Green Valley Model Farm',
        farmId: 'farm-001',
        field: 'South Field B (Legume Rotation)',
        fieldId: 'fld-002',
        crop: 'Dry Beans (Rosecoco GLP-2)',
        growthStage: 'Flowering R1 (Early Bloom)',
        category: 'Moisture Deficit',
        severity: 'WARNING',
        text: 'Top 10cm soil dry to touch, tensiometer reading 44 kPa. Mild midday leaf curling observed on western boundary exposure.',
        notes: 'Flower abscission threshold approaches at 50 kPa. Immediate light furrow irrigation (15mm) advised before high evapotranspiration cycle.',
        date: '2026-09-13',
        scoutName: 'Grace Wanjiku',
        followUpRequired: true,
        followUpStatus: 'Action Pending'
      },
      {
        id: 'obs-003',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'East Plateau Parcel 1',
        fieldId: 'fld-003',
        crop: 'Wheat (Kenya Tayari)',
        growthStage: 'Grain Filling (Hard Dough)',
        category: 'Pathogen Pressure',
        severity: 'CRITICAL',
        text: 'Trace presence of Yellow Rust (Puccinia striiformis) pustules on sub-canopy lower leaves. Flag leaf currently uninfected (95% clean).',
        notes: 'Incidence rate estimated at 4% in damp swales. Weather forecast indicates morning dew persistence. Preventive triazole fungicide recommended within 36 hours.',
        date: '2026-09-12',
        scoutName: 'Dr. Sarah Mwangi',
        followUpRequired: true,
        followUpStatus: 'Under Observation'
      },
      {
        id: 'obs-004',
        farm: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        field: 'West Terraces Parcel 2',
        fieldId: 'fld-004',
        crop: 'Irish Potato (Shangi)',
        growthStage: 'Preparing (Bed Ridging & Tilth)',
        category: 'Soil Structure & Tilth',
        severity: 'INFO',
        text: 'Soil tilth loose and friable across all terraces. Organic matter test confirmed at 3.50%, soil pH 6.10 ideal for tuberization.',
        notes: 'No signs of compaction pans or wireworm activity. Ridge formation depth confirmed at 25cm. Field ready for certified seed delivery.',
        date: '2026-09-11',
        scoutName: 'Peter Koech',
        followUpRequired: false,
        followUpStatus: 'Resolved'
      }
    ];
  },
  async listInspections() {
    return [
      {
        id: 'insp-001',
        farmerName: 'John Kamau',
        farmerId: 'fmr-001',
        farmName: 'Green Valley Model Farm',
        farmId: 'farm-001',
        fieldName: 'North Field A (Hybrid Trial)',
        fieldId: 'fld-001',
        crop: 'Highland Hybrid Maize (H614D)',
        growthStage: 'Vegetative V6 (6 Collared Leaves)',
        fieldCondition: 'EXCELLENT',
        observations: 'Uniform stand density, vigorous root anchoring, dark green foliage, no stem borer signs.',
        severity: 'LOW',
        notes: 'Optimal soil moisture verified at 20cm depth. Top-dressing CAN approved.',
        followUpNeeded: false,
        followUpDetails: null,
        inspector: 'Peter Koech',
        inspectionDate: '2026-09-14 09:30',
        status: 'COMPLETED',
        score: 94
      },
      {
        id: 'insp-002',
        farmerName: 'Alice Chebet',
        farmerId: 'fmr-002',
        farmName: 'Rongai Sunrise Farm',
        farmId: 'farm-002',
        fieldName: 'East Plateau Parcel 1',
        fieldId: 'fld-003',
        crop: 'Wheat (Kenya Tayari)',
        growthStage: 'Grain Filling (Hard Dough)',
        fieldCondition: 'POOR',
        observations: 'Sub-canopy Yellow Rust (Puccinia striiformis) pustules detected. Rapid dew drying required.',
        severity: 'CRITICAL',
        notes: 'Infection spread observed on lower leaf collars. Recommended immediate triazole spray window.',
        followUpNeeded: true,
        followUpDetails: 'Verify fungicide application within 48 hours and check flag leaf margins.',
        inspector: 'Peter Koech',
        inspectionDate: '2026-09-14 11:15',
        status: 'PENDING_ACTION',
        score: 68
      },
      {
        id: 'insp-003',
        farmerName: 'John Kamau',
        farmerId: 'fmr-001',
        farmName: 'Green Valley Model Farm',
        farmId: 'farm-001',
        fieldName: 'South Field B (Legume Rotation)',
        fieldId: 'fld-002',
        crop: 'Dry Beans (Rosecoco GLP-2)',
        growthStage: 'Flowering R1 (Early Bloom)',
        fieldCondition: 'FAIR',
        observations: 'Tensiometer reading 44 kPa, topsoil dry, midday moisture curling on perimeter rows.',
        severity: 'WARNING',
        notes: 'Supplemental irrigation needed to avert flower abscission before Thursday forecast.',
        followUpNeeded: true,
        followUpDetails: 'Confirm irrigation scheduling with farm manager by Tuesday morning.',
        inspector: 'Peter Koech',
        inspectionDate: '2026-09-13 14:20',
        status: 'NEEDS_ACTION',
        score: 78
      },
      {
        id: 'insp-004',
        farmerName: 'Samuel Ochieng',
        farmerId: 'fmr-003',
        farmName: 'Njoro River Parcel 3',
        farmId: 'farm-003',
        fieldName: 'South Plot Block B',
        fieldId: 'fld-005',
        crop: 'Irish Potato (Shangi Certified)',
        growthStage: 'Tuber Initiation',
        fieldCondition: 'GOOD',
        observations: 'Ridge formation uniform, clean furrow lines, no late blight foliar lesions.',
        severity: 'LOW',
        notes: 'Drip line pressure normal. Tensiometer sensor correctly calibrated.',
        followUpNeeded: false,
        followUpDetails: null,
        inspector: 'Peter Koech',
        inspectionDate: '2026-09-12 10:00',
        status: 'COMPLETED',
        score: 91
      },
      {
        id: 'insp-005',
        farmerName: 'Mary Wambui',
        farmerId: 'fmr-004',
        farmName: 'Bahati Green Acres',
        farmId: 'farm-004',
        fieldName: 'Terrace Parcel 1',
        fieldId: 'fld-006',
        crop: 'Soybeans (SC Squire)',
        growthStage: 'Emergence VE',
        fieldCondition: 'EXCELLENT',
        observations: 'Stand emergence count 96% uniformity. Certified inoculant nodulation starting.',
        severity: 'LOW',
        notes: 'Weed pressure negligible. Recommended hand-hoe rogueing in 10 days.',
        followUpNeeded: false,
        followUpDetails: null,
        inspector: 'Peter Koech',
        inspectionDate: '2026-09-10 15:45',
        status: 'COMPLETED',
        score: 98
      }
    ];
  },
  async createInspection(inspectionData) {
    const id = 'insp-' + Math.random().toString(36).substring(2, 7);
    const newInspection = {
      id,
      inspector: 'Peter Koech',
      inspectionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: inspectionData.followUpNeeded ? 'NEEDS_ACTION' : 'COMPLETED',
      score: inspectionData.severity === 'CRITICAL' ? 65 : (inspectionData.severity === 'WARNING' ? 78 : 95),
      ...inspectionData
    };
    return {
      success: true,
      inspection: newInspection,
      message: `Inspection record ${id} recorded successfully.`
    };
  },
  async listTasks() {
    return [
      {
        id: 'tsk-001',
        title: 'Verify Rust Foliar Spray Application on East Plateau Parcel 1',
        category: 'Pathogen Intervention',
        farmName: 'Rongai Sunrise Farm',
        farmerName: 'Alice Chebet',
        field: 'East Plateau Parcel 1',
        crop: 'Wheat (Kenya Tayari)',
        priority: 'HIGH',
        status: 'OVERDUE',
        due: '2026-09-13',
        assignedTo: 'Peter Koech',
        notes: 'Confirm farmer applied triazole fungicide. Flag leaf protection is critical.'
      },
      {
        id: 'tsk-002',
        title: 'Calibrate Soil Moisture Tensiometer Sensor at Njoro Plot Block B',
        category: 'Sensor Calibration',
        farmName: 'Njoro River Parcel 3',
        farmerName: 'Samuel Ochieng',
        field: 'South Plot Block B',
        crop: 'Irish Potato',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        due: '2026-09-15',
        assignedTo: 'Peter Koech',
        notes: 'De-air tensiometer tube, refill with distilled water, and check vacuum seal.'
      },
      {
        id: 'tsk-003',
        title: 'Verify Nitrogen Top-dressing Soil Moisture on North Field A',
        category: 'Agronomic Verification',
        farmName: 'Green Valley Model Farm',
        farmerName: 'John Kamau',
        field: 'North Field A',
        crop: 'Maize (H614D)',
        priority: 'HIGH',
        status: 'PENDING',
        due: '2026-09-16',
        assignedTo: 'Peter Koech',
        notes: 'Confirm CAN application is timed right before the forecasted Thursday showers.'
      },
      {
        id: 'tsk-004',
        title: 'Scout Bahati Terrace Parcel 1 for Early Cutworm Damage',
        category: 'Emergence Scouting',
        farmName: 'Bahati Green Acres',
        farmerName: 'Mary Wambui',
        field: 'Terrace Parcel 1',
        crop: 'Soybeans',
        priority: 'LOW',
        status: 'PENDING',
        due: '2026-09-18',
        assignedTo: 'Peter Koech',
        notes: 'Inspect border rows at dusk for surface seedling cutting.'
      },
      {
        id: 'tsk-005',
        title: 'Audit Chemical Storage Secondary Containment at Rongai',
        category: 'GAP Compliance',
        farmName: 'Rongai Sunrise Farm',
        farmerName: 'Alice Chebet',
        field: 'Headquarters Store',
        crop: 'N/A',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        due: '2026-09-11',
        assignedTo: 'Peter Koech',
        notes: 'Secondary containment bund installed. Material safety data sheets posted.'
      }
    ];
  },
  async updateTaskStatus(taskId, newStatus) {
    return {
      success: true,
      taskId,
      newStatus,
      message: `Task ${taskId} updated to ${newStatus}.`
    };
  }
};

// 8. Reports & Analytics Intelligence Service
export const reportService = {
  // All 10 standard report types
  getReportTypes() {
    return [
      { id: 'farm_performance', name: 'Farm performance', category: 'Operational', icon: '🏡', description: 'Comprehensive harvest, irrigation efficiency, and field utilization across holdings.' },
      { id: 'crop_performance', name: 'Crop performance', category: 'Agronomic', icon: '🌱', description: 'Phenological progression, NDVI canopy vigor, and cultivar comparison.' },
      { id: 'yield_forecast', name: 'Yield forecast', category: 'Predictive', icon: '📈', description: 'Machine learning yield estimations vs historical county benchmarks.' },
      { id: 'weather_history', name: 'Weather history', category: 'Climate', icon: '🌦️', description: 'Diurnal meteorological logs, rainfall accumulation, and extreme anomalies.' },
      { id: 'weather_suitability', name: 'Weather suitability', category: 'Suitability', icon: '🧠', description: 'FAO AEZ suitability scoring, thermal thresholds, and limiting factors.' },
      { id: 'farmer_activity', name: 'Farmer activity', category: 'Extension', icon: '👥', description: 'Smallholder onboarding velocity, active crop cycles, and SMS engagement.' },
      { id: 'field_observations', name: 'Field observations', category: 'Scouting', icon: '🔍', description: 'Pest/disease infestations, scouting severity ratings, and follow-ups.' },
      { id: 'production_planning', name: 'Production planning', category: 'Planning', icon: '📋', description: 'Acreage allocation, rotational schedules, and seasonal harvest timelines.' },
      { id: 'risk_analysis', name: 'Risk analysis', category: 'Risk', icon: '⚠️', description: 'Integrated pathogen, climate, moisture deficit, and soil degradation risk.' },
      { id: 'agricultural_overview', name: 'Agricultural overview', category: 'Executive', icon: '🌍', description: 'National executive synthesis of production, weather, and farm welfare.' }
    ];
  },

  async listReports() {
    return [
      { id: 'rep-01', type: 'yield_forecast', title: '2026 Long Rains Seasonal Yield Forecast', category: 'Yield forecast', region: 'Natural Region II (Highveld)', crop: 'White Maize (SC719)', format: 'PDF / GeoJSON', date: '2026-09-14', status: 'READY' },
      { id: 'rep-02', type: 'weather_history', title: 'Agromet Synoptic Weather Trends & Rainfall Deficits', category: 'Weather history', region: 'Natural Region II & III', crop: 'All Crops', format: 'PDF / CSV', date: '2026-09-12', status: 'READY' },
      { id: 'rep-03', type: 'weather_suitability', title: 'Agro-Ecological Zone (AEZ) Suitability Atlas', category: 'Weather suitability', region: 'Zimbabwe National (NR I-V)', crop: 'Maize & Wheat', format: 'GeoJSON / Spatial', date: '2026-09-08', status: 'READY' },
      { id: 'rep-04', type: 'farm_performance', title: 'Estate Operational Efficiency & Water Balance Audit', category: 'Farm performance', region: 'Mazowe & Chinhoyi', crop: 'Maize & Tobacco', format: 'PDF', date: '2026-09-06', status: 'READY' },
      { id: 'rep-05', type: 'crop_performance', title: 'Cultivar Phenology & Canopy Vigor Assessment', category: 'Crop performance', region: 'Marondera Horticultural Belt', crop: 'Seed Potato (BP1)', format: 'PDF / CSV', date: '2026-09-04', status: 'READY' },
      { id: 'rep-06', type: 'farmer_activity', title: 'Smallholder Extension Reach & Mobile Advisory Engagement', category: 'Farmer activity', region: 'Midlands & Mashonaland', crop: 'Mixed Grains', format: 'PDF', date: '2026-09-02', status: 'READY' },
      { id: 'rep-07', type: 'field_observations', title: 'Pathogen Scouting Digest: Fall Armyworm & Rust Flags', category: 'Field observations', region: 'Makonde District', crop: 'Tobacco & Maize', format: 'PDF', date: '2026-08-30', status: 'READY' },
      { id: 'rep-08', type: 'production_planning', title: '2026/2027 Crop Acreage & Irrigation Planning Matrix', category: 'Production planning', region: 'Chiredzi Canal Basin', crop: 'Sugarcane & Wheat', format: 'Excel / CSV', date: '2026-08-28', status: 'READY' },
      { id: 'rep-09', type: 'risk_analysis', title: 'Longitudinal Agro-Climate & Pest Risk Matrix', category: 'Risk analysis', region: 'Eastern Highlands & Midlands', crop: 'All Crops', format: 'PDF / GeoJSON', date: '2026-08-25', status: 'READY' },
      { id: 'rep-10', type: 'agricultural_overview', title: 'National Agricultural Intelligence Executive Overview', category: 'Agricultural overview', region: 'National Summary', crop: 'Strategic Crops', format: 'PDF / Presentation', date: '2026-08-20', status: 'READY' }
    ];
  },

  async generateReport(params) {
    // Simulates C# backend generating the report model with chartable data
    await new Promise(r => setTimeout(r, 600));

    const {
      reportType = 'farm_performance',
      farm = 'all',
      region = 'Natural Region II (Highveld)',
      crop = 'White Maize (SC719)',
      dateRange = 'Last 30 Days',
      metrics = ['yield', 'rainfall', 'suitability']
    } = params;

    const typeObj = this.getReportTypes().find(t => t.id === reportType) || this.getReportTypes()[0];

    return {
      metadata: {
        id: `rep-${Date.now().toString().slice(-4)}`,
        title: `${typeObj.name.toUpperCase()} REPORT: ${crop} in ${region}`,
        reportType,
        typeName: typeObj.name,
        region,
        farm,
        crop,
        dateRange,
        selectedMetrics: metrics,
        generatedAt: '2026-09-15 08:30:00',
        author: 'Agricultural Yield Intelligence Engine (C# / MySQL 8)',
        confidenceScore: 92.5
      },
      kpis: [
        { label: 'Mean Yield', value: '5,820 kg/ha', change: '+18.4% vs Baseline', positive: true },
        { label: 'Cumulative Rainfall', value: '486.2 mm', change: '+14.2% vs 30yr Normal', positive: true },
        { label: 'Suitability Index', value: '91.5%', change: 'Class S1 Highly Suitable', positive: true },
        { label: 'Pathogen / Climate Risk', value: 'LOW-MOD', change: '1 Alert Flagged', positive: false }
      ],
      practicalQuestions: {
        rainfallQuestion: 'How has rainfall changed over the monitored period?',
        yieldQuestion: 'Which crop has the highest expected yield?',
        suitabilityQuestion: 'Which farms currently have poor weather suitability?',
        comparisonQuestion: 'How does estimated yield compare with historical production?'
      },
      rainfallTrend: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [
          { label: 'Recorded Precipitation (mm)', data: [14.2, 28.5, 8.4, 45.0, 18.2, 32.0], color: '#0284c7' },
          { label: '30-Year Climatological Normal (mm)', data: [18.0, 20.0, 19.5, 22.0, 21.0, 23.0], color: '#94a3b8' }
        ],
        unit: ' mm'
      },
      cropYieldRanking: {
        labels: ['Maize (SC719)', 'Wheat (Winter)', 'Potato (BP1)', 'Soybeans', 'Coffee'],
        data: [5800, 4800, 3600, 2400, 1800],
        unit: ' kg/ha',
        color: '#059669'
      },
      historicalComparison: {
        labels: ['Mazowe Estate', 'Marondera Farm', 'Chinhoyi Hub', 'Kwekwe Farm'],
        seriesA: { label: '5-Year Historic Mean', data: [4600, 3100, 4200, 2400], color: '#94a3b8' },
        seriesB: { label: '2026 Model Forecast', data: [5820, 3650, 4900, 2900], color: '#059669' },
        unit: ' kg/ha'
      },
      waterBalanceArea: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
        data: [45.2, 58.0, 32.4, 68.5, 84.2],
        unit: ' mm',
        color: '#0284c7'
      },
      cropDistributionDonut: {
        segments: [
          { label: 'White Maize (SC719)', value: 48.0, color: '#059669' },
          { label: 'Winter Wheat', value: 35.0, color: '#0284c7' },
          { label: 'Seed Potato (BP1)', value: 30.0, color: '#d97706' },
          { label: 'Blueberries / Hort', value: 18.5, color: '#8b5cf6' },
          { label: 'Coffee (Arabica)', value: 12.0, color: '#be123c' }
        ]
      },
      tableData: [
        { estate: 'Mazowe Citrus & Grain Valley', crop: 'White Maize (SC719)', areaHa: 145.0, soilPh: 6.2, suitability: 'Class S1 (92%)', yieldEstimate: '5,820 kg/ha', riskStatus: 'LOW' },
        { estate: 'Marondera Horticulture', crop: 'Seed Potato (BP1)', areaHa: 82.5, soilPh: 5.6, suitability: 'Class S1 (86%)', yieldEstimate: '3,650 kg/ha', riskStatus: 'MEDIUM' },
        { estate: 'Chinhoyi Grain & Tobacco', crop: 'Virginia Tobacco', areaHa: 110.0, soilPh: 6.4, suitability: 'Class S2 (78%)', yieldEstimate: '2,400 kg/ha', riskStatus: 'HIGH' },
        { estate: 'Kwekwe Mixed Farm', crop: 'Drought Maize (SC513)', areaHa: 160.0, soilPh: 6.0, suitability: 'Class S2 (82%)', yieldEstimate: '2,900 kg/ha', riskStatus: 'MEDIUM' },
        { estate: 'Nyanga Highland Tea', crop: 'Arabica Coffee', areaHa: 95.0, soilPh: 5.2, suitability: 'Class S1 (95%)', yieldEstimate: '1,800 kg/ha', riskStatus: 'OPTIMAL' },
        { estate: 'Chiredzi Triangle Syndicate', crop: 'Commercial Sugarcane', areaHa: 220.0, soilPh: 7.2, suitability: 'Class S1 (94%)', yieldEstimate: '110,000 kg/ha', riskStatus: 'OPTIMAL' }
      ]
    };
  }
};

// 9. Notification & Agricultural Alert Service
export const notificationService = {
  _notifications: [
    {
      id: 'notif-001',
      title: 'Rainfall levels have decreased significantly over the last 14 days.',
      description: 'Precipitation deficit recorded at -38% below the 30-year climatological normal in Mazowe & Makonde districts. Water stress index increasing for vegetative maize.',
      category: 'Weather',
      severity: 'HIGH',
      date: '2026-09-15 08:15',
      relatedFarm: 'Mazowe Citrus & Grain Valley',
      relatedCrop: 'White Maize (SC719)',
      isRead: false,
      isAgriculturalAlert: true,
      action: { label: 'Inspect Weather Telemetry', hash: '#weather-trends', primary: true },
      expiration: '2026-09-22 00:00'
    },
    {
      id: 'notif-002',
      title: 'Current conditions may be unsuitable for maize planting.',
      description: 'Topsoil moisture at 10cm depth has dropped below 14% field capacity following a 9-day dry spell. Soil temperature exceeds 33.5°C, creating high germination mortality risk.',
      category: 'Crop',
      severity: 'CRITICAL',
      date: '2026-09-14 16:30',
      relatedFarm: 'Kwekwe Mixed Farm',
      relatedCrop: 'Drought Maize (SC513)',
      isRead: false,
      isAgriculturalAlert: true,
      action: { label: 'Check Crop Suitability Matrix', hash: '#suitability', primary: true },
      expiration: '2026-09-20 18:00'
    },
    {
      id: 'notif-003',
      title: 'High temperature conditions expected in the next 5 days.',
      description: 'Agromet forecasting indicates a convective heat dome with daily maximums exceeding 34.5°C and Vapor Pressure Deficit (VPD) spiking above 2.8 kPa.',
      category: 'Weather',
      severity: 'MEDIUM',
      date: '2026-09-14 11:20',
      relatedFarm: 'Chiredzi Triangle Syndicate',
      relatedCrop: 'Commercial Sugarcane',
      isRead: false,
      isAgriculturalAlert: true,
      action: { label: 'Adjust Irrigation Schedule', hash: '#recommendations', primary: false },
      expiration: '2026-09-19 23:59'
    },
    {
      id: 'notif-004',
      title: 'Fall Armyworm (Spodoptera frugiperda) L2 Larvae Scouting Alert',
      description: 'Field inspection in South Terraces Parcel 2 identified 18% foliar pinhole damage on V6 vegetative whorls. Immediate bio-rational or pyrethroid intervention advised.',
      category: 'Field operation',
      severity: 'HIGH',
      date: '2026-09-14 09:45',
      relatedFarm: 'Chinhoyi Grain & Tobacco Estate',
      relatedCrop: 'Virginia Tobacco',
      isRead: false,
      isAgriculturalAlert: true,
      action: { label: 'View Scouting Observations', hash: '#field-observations', primary: true },
      expiration: '2026-09-21 12:00'
    },
    {
      id: 'notif-005',
      title: 'Seasonal Yield Forecast Updated (+18.4% vs County Benchmark)',
      description: 'AquaCrop ML engine ingested latest Sentinel-2 NDVI canopy imagery (NDVI 0.82) and updated projected harvest output to 5,820 kg/ha for Highland Hybrid blocks.',
      category: 'Yield',
      severity: 'LOW',
      date: '2026-09-13 17:00',
      relatedFarm: 'Mazowe Citrus & Grain Valley',
      relatedCrop: 'White Maize (SC719)',
      isRead: true,
      isAgriculturalAlert: true,
      action: { label: 'Open Yield Forecast Report', hash: '#reports', primary: false },
      expiration: '2026-10-01 00:00'
    },
    {
      id: 'notif-006',
      title: 'Recommended Nitrogen Top-Dressing Window Closing',
      description: 'Soil moisture is currently optimal for Calcium Ammonium Nitrate (CAN) application (150 kg/ha). Rain predicted in 48 hours will facilitate nutrient incorporation.',
      category: 'Recommendation',
      severity: 'MEDIUM',
      date: '2026-09-13 14:15',
      relatedFarm: 'Marondera Horticultural Belt',
      relatedCrop: 'Seed Potato (BP1)',
      isRead: true,
      isAgriculturalAlert: true,
      action: { label: 'Review Agronomic Advisory', hash: '#recommendations', primary: true },
      expiration: '2026-09-17 18:00'
    },
    {
      id: 'notif-007',
      title: 'Cadastral Farm Centroid Coordinates Updated',
      description: 'Surveyor GPS polygon re-calibrated for East Plateau Parcel (SRID 4326). Total registered arable area reconciled to 145.00 hectares.',
      category: 'Farm',
      severity: 'INFO',
      date: '2026-09-12 10:30',
      relatedFarm: 'Mazowe Citrus & Grain Valley',
      relatedCrop: 'Cross-Commodity',
      isRead: true,
      isAgriculturalAlert: false,
      action: { label: 'View Geographic Map', hash: '#farm-map', primary: false },
      expiration: '2026-12-31 23:59'
    },
    {
      id: 'notif-008',
      title: 'Scheduled MySQL 8 Spatial Engine Maintenance',
      description: 'Routine spatial index vacuuming and GeoJSON read replica optimization scheduled for Saturday 02:00 UTC (15 mins expected read-only window).',
      category: 'System',
      severity: 'INFO',
      date: '2026-09-11 16:00',
      relatedFarm: 'Platform Infrastructure',
      relatedCrop: 'All Crops',
      isRead: true,
      isAgriculturalAlert: false,
      action: { label: 'View Platform Health', hash: '#system-monitoring', primary: false },
      expiration: '2026-09-20 06:00'
    },
    {
      id: 'notif-009',
      title: 'Role Permission Policy Matrix Re-indexed',
      description: 'Super Administrator updated role capabilities for Extension Officers: direct CSV export privileges enabled for field visit records.',
      category: 'Administrative',
      severity: 'LOW',
      date: '2026-09-10 12:00',
      relatedFarm: 'Administrative Governance',
      relatedCrop: 'N/A',
      isRead: true,
      isAgriculturalAlert: false,
      action: { label: 'Inspect Roles & Permissions', hash: '#roles', primary: false },
      expiration: '2026-09-30 00:00'
    }
  ],

  _preferences: {
    channels: {
      inApp: true,
      sms: true,
      email: false,
      pushSound: true
    },
    categories: {
      Weather: true,
      Crop: true,
      Farm: true,
      Yield: true,
      Recommendation: true,
      'Field operation': true,
      System: false,
      Administrative: true
    },
    minSeverity: 'LOW' // 'INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  },

  async listNotifications() {
    return [...this._notifications];
  },

  async getUnreadCount() {
    return this._notifications.filter(n => !n.isRead).length;
  },

  async markAsRead(id) {
    const notif = this._notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
    }
    return notif;
  },

  async markAllAsRead() {
    this._notifications.forEach(n => { n.isRead = true; });
    return true;
  },

  async getPreferences() {
    return { ...this._preferences };
  },

  async savePreferences(prefs) {
    this._preferences = { ...this._preferences, ...prefs };
    return this._preferences;
  }
};

// 10. Admin & Platform Operations Service
export const adminService = {
  async listUsers() {
    return [
      { id: 'u-01', name: 'Dr. Sarah Mwangi', email: 'sarah.mwangi@ayis.org', role: 'agronomist', roleTitle: 'Agronomist', status: 'ACTIVE', department: 'Crop Intelligence / KALRO', phone: '+254 711 223 344', lastLogin: '2026-09-14 21:30', createdAt: '2026-01-10' },
      { id: 'u-02', name: 'John Kamau', email: 'john.kamau@farms.ke', role: 'farmer', roleTitle: 'Farmer', status: 'ACTIVE', department: 'Smallholder Agriculture', phone: '+254 712 345 678', lastLogin: '2026-09-14 18:45', createdAt: '2026-02-15' },
      { id: 'u-03', name: 'David Mwangi', email: 'david.mwangi@estate.ke', role: 'farm_manager', roleTitle: 'Farm Manager', status: 'ACTIVE', department: 'Commercial Estate Operations', phone: '+254 722 998 877', lastLogin: '2026-09-14 20:10', createdAt: '2026-01-20' },
      { id: 'u-04', name: 'Grace Wanjiku', email: 'grace.wanjiku@ayis.org', role: 'extension_officer', roleTitle: 'Agricultural Extension Officer', status: 'ACTIVE', department: 'Field Extension Sub-zone 4', phone: '+254 733 445 566', lastLogin: '2026-09-14 19:20', createdAt: '2026-03-01' },
      { id: 'u-05', name: 'Alex Kipruto', email: 'alex.kipruto@ayis.org', role: 'system_admin', roleTitle: 'System Administrator', status: 'ACTIVE', department: 'Platform Infrastructure & Security', phone: '+254 700 112 233', lastLogin: '2026-09-14 22:05', createdAt: '2025-11-01' },
      { id: 'u-06', name: 'Peter Koech', email: 'peter.koech@ayis.org', role: 'field_officer', roleTitle: 'Field Officer', status: 'ACTIVE', department: 'Field Scouting & Verification', phone: '+254 720 334 455', lastLogin: '2026-09-14 16:15', createdAt: '2026-03-12' },
      { id: 'u-07', name: 'Daniel Kiprop', email: 'daniel.kiprop@ayis.org', role: 'weather_analyst', roleTitle: 'Weather/Data Analyst', status: 'ACTIVE', department: 'Agrometeorological Analysis', phone: '+254 721 889 900', lastLogin: '2026-09-14 17:40', createdAt: '2026-02-01' },
      { id: 'u-08', name: 'Alice Chebet', email: 'alice.chebet@farms.ke', role: 'farmer', roleTitle: 'Farmer', status: 'ACTIVE', department: 'Smallholder Agriculture', phone: '+254 722 334 455', lastLogin: '2026-09-13 11:20', createdAt: '2026-04-05' },
      { id: 'u-09', name: 'James Kariuki', email: 'james.kariuki@ayis.org', role: 'agronomist', roleTitle: 'Agronomist', status: 'INACTIVE', department: 'Agronomy Intern', phone: '+254 799 001 122', lastLogin: '2026-08-20 14:10', createdAt: '2026-05-18' }
    ];
  },
  async listAuditLogs() {
    return [
      { id: 'aud-001', user: 'Dr. Sarah Mwangi', role: 'Agronomist', action: 'RECALCULATE_SUITABILITY', resource: 'fld-001 (Highland Hybrid Maize)', timestamp: '2026-09-14 20:15:00', status: 'SUCCESS', details: 'Updated soil pH & GDD parameters; re-indexed FAO matrix' },
      { id: 'aud-002', user: 'Alex Kipruto', role: 'System Administrator', action: 'DEPLOY_MIGRATION', resource: 'MySQL 8 Spatial Engine', timestamp: '2026-09-14 19:42:10', status: 'SUCCESS', details: 'Applied migration 20260914_AddWeatherReadingSpatialSRID4326.sql' },
      { id: 'aud-003', user: 'John Kamau', role: 'Farmer', action: 'REQUEST_RECOMMENDATION', resource: 'farm-001 (Green Valley Model Farm)', timestamp: '2026-09-14 18:30:22', status: 'SUCCESS', details: 'Generated top-dressing CAN nitrogen advisory for V6 crop cycle' },
      { id: 'aud-004', user: 'Grace Wanjiku', role: 'Extension Officer', action: 'SUBMIT_SCOUTING_OBSERVATION', resource: 'obs-003 (Dry Beans Root Knot)', timestamp: '2026-09-14 16:45:00', status: 'SUCCESS', details: 'Scouting condition logged with severity WARNING; follow-up scheduled' },
      { id: 'aud-005', user: 'Daniel Kiprop', role: 'Weather/Data Analyst', action: 'DISPATCH_WEATHER_ALERT', resource: 'alt-01 (Convective Torrential Rain)', timestamp: '2026-09-14 08:30:15', status: 'SUCCESS', details: 'Dispatched broadcast advisory to 48 registered farmers in Nakuru High Plains' },
      { id: 'aud-006', user: 'Unknown IP', role: 'Guest', action: 'AUTHENTICATION_FAILURE', resource: 'auth/login (alex.kipruto@ayis.org)', timestamp: '2026-09-14 03:12:44', status: 'FAILED', details: 'Invalid credentials attempt rejected by ASP.NET Core rate limiter' },
      { id: 'aud-007', user: 'Alex Kipruto', role: 'System Administrator', action: 'UPDATE_RBAC_PERMISSIONS', resource: 'role/agronomist', timestamp: '2026-09-13 15:20:00', status: 'SUCCESS', details: 'Granted APPROVE permission on Recommendations module' }
    ];
  },
  async getSystemHealth() {
    return [
      { service: 'C# ASP.NET Core Minimal API', status: 'OPERATIONAL', latency: '12ms', uptime: '99.98%', memory: '184 MB / 512 MB', threads: 18 },
      { service: 'MySQL 8 Spatial Database', status: 'OPERATIONAL', latency: '4ms', uptime: '100%', connections: '14 / 150', size: '2.4 GB' },
      { service: 'Weather Telemetry Ingestion Pipeline', status: 'OPERATIONAL', latency: '180ms', uptime: '99.85%', packetLoss: '0.02%', queue: '0 pending' },
      { service: 'Crop Suitability ML Inference Worker', status: 'OPERATIONAL', latency: '85ms', uptime: '99.91%', throughput: '42 ops/min', gpuStatus: 'Idle / CPU Fallback' },
      { service: 'Frontend Application Shell (Tauri / Web)', status: 'OPERATIONAL', latency: '1ms', uptime: '100%', errors: '0 critical', build: 'v2.4.0-prod' }
    ];
  },
  async getPermissionMatrix() {
    return {
      resources: [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'farms', name: 'Farms' },
        { id: 'fields', name: 'Fields' },
        { id: 'crops', name: 'Crops' },
        { id: 'crop_profiles', name: 'Crop Profiles' },
        { id: 'weather', name: 'Weather' },
        { id: 'recommendations', name: 'Recommendations' },
        { id: 'yield', name: 'Yield' },
        { id: 'reports', name: 'Reports' },
        { id: 'users', name: 'Users' },
        { id: 'settings', name: 'Settings' }
      ],
      actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      roles: {
        super_admin: {
          dashboard: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          farms: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          fields: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          crops: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          crop_profiles: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          weather: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          recommendations: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          yield: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          users: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          settings: { view: true, create: true, edit: true, delete: true, approve: true, export: true }
        },
        system_admin: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          farms: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          fields: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          crops: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          crop_profiles: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          weather: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          yield: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          users: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
          settings: { view: true, create: true, edit: true, delete: true, approve: true, export: true }
        },
        agronomist: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          fields: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          crops: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          crop_profiles: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          weather: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          recommendations: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          yield: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          reports: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
        },
        farm_manager: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          farms: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          fields: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          crops: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          weather: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          recommendations: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          yield: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          reports: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
        },
        extension_officer: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          farms: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
          fields: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          crops: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          crop_profiles: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          weather: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          recommendations: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
          yield: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          reports: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
          users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
        },
        field_officer: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          fields: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          crops: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          crop_profiles: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          weather: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          yield: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          reports: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
          users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
        },
        weather_analyst: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          farms: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          fields: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          crops: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          crop_profiles: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          weather: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          recommendations: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          yield: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          reports: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
          users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
        },
        farmer: {
          dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          farms: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          fields: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          crops: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          crop_profiles: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          weather: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          recommendations: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          yield: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          reports: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
          settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
        }
      }
    };
  },
  async getWeatherConfiguration() {
    return {
      sources: [
        { id: 'src-01', name: 'Regional AWS Automated Network', protocol: 'MQTT / HTTPS REST', endpoint: 'https://telemetry.ayis.org/v1/aws', updateFrequency: 'Every 15 minutes', status: 'ACTIVE', monitoredLocationsCount: 5, lastIngest: '30s ago', thresholdChecking: 'ENABLED' },
        { id: 'src-02', name: 'Kenya Meteorological Dept (KMD) Synoptic Feed', protocol: 'WMO BUFR / FTP Push', endpoint: 'ftp://ftp.meteo.go.ke/synop', updateFrequency: 'Every 3 hours', status: 'ACTIVE', monitoredLocationsCount: 12, lastIngest: '45 mins ago', thresholdChecking: 'ENABLED' },
        { id: 'src-03', name: 'NOAA GFS Global Numerical Weather Prediction', protocol: 'GRIB2 NOAA OPeNDAP', endpoint: 'https://nomads.ncep.noaa.gov', updateFrequency: 'Every 6 hours', status: 'ACTIVE', monitoredLocationsCount: 1, lastIngest: '2 hours ago', thresholdChecking: 'ENABLED' }
      ],
      thresholds: [
        { parameter: 'Torrential Rainfall Rate', condition: '> 25.0 mm/hr', severity: 'HIGH', notificationChannel: 'SMS + Push Broadcast' },
        { parameter: 'Hail Cell Reflectivity', condition: '> 52.0 dBZ', severity: 'CRITICAL', notificationChannel: 'Immediate Sirens + SMS' },
        { parameter: 'Frost / Temperature Dip', condition: '< 4.0 °C', severity: 'HIGH', notificationChannel: 'SMS Advisory' },
        { parameter: 'Sustained Spray Wind Speed', condition: '> 15.0 km/h', severity: 'MEDIUM', notificationChannel: 'Dashboard Warning' }
      ]
    };
  },
  async getPlatformSettings() {
    return {
      general: { platformName: 'Agricultural Yield Intelligence System (AYIS)', organization: 'Kenya Agricultural & Livestock Research Organization (KALRO)', timezone: 'Africa/Nairobi (UTC+3)', language: 'English (Kenya)' },
      units: { temperature: 'Celsius (°C)', rainfall: 'Millimeters (mm)', area: 'Hectares (ha)', yield: 'Metric Tonnes / ha (t/ha)', pressure: 'Hectopascals (hPa)', windSpeed: 'Kilometers per hour (km/h)' },
      regional: { primaryCounty: 'Nakuru County', agroEcologicalZone: 'AEZ III / IV (Sub-humid to Semi-arid High Plains)', spatialSRID: 'EPSG:4326 (WGS84 GPS Native)' },
      notifications: { emailNotifications: true, smsAlertBroadcasts: true, criticalAlertCooldownMinutes: 30, pushNotificationSound: true },
      agricultural: { defaultGrowingSeason: 'Long Rains (March - September)', defaultGddBaseTempC: 10.0, soilMoistureFieldCapacityKpa: 33.0 }
    };
  }
};
