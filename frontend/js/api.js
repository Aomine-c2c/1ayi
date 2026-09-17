/**
 * AYIS Centralized API Client & Data Provider
 * Connects to C# ASP.NET Core Minimal API with graceful fallback to offline/demo data
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000/api/v1'
  : '/api/v1';

// Seed demo data for robust offline & preview capabilities
const DEMO_STATE = {
  farms: [
    {
      id: 'farm-001',
      name: 'Green Valley Model Farm',
      region: 'Nakuru High Plains',
      sizeHa: 12.5,
      latitude: -0.3031,
      longitude: 36.0800,
      primaryCrop: 'Maize (H614D)',
      soilType: 'Volcanic Loam',
      irrigationType: 'Drip Irrigation',
      elevationM: 1850
    },
    {
      id: 'farm-002',
      name: 'Rongai Sunrise Farm',
      region: 'Nakuru High Plains',
      sizeHa: 8.2,
      latitude: -0.1700,
      longitude: 35.8500,
      primaryCrop: 'Wheat',
      soilType: 'Clay Loam',
      irrigationType: 'Rainfed',
      elevationM: 1920
    }
  ],
  crops: [
    {
      id: 'crop-001',
      name: 'Maize',
      scientificName: 'Zea mays',
      category: 'Cereal',
      description: 'Primary staple grain across East Africa. Demands high solar radiation and balanced nitrogen nutrition during vegetative surge.',
      typicalYield: '4,500 kg/ha',
      expectedYieldMin: '3,000 kg/ha',
      expectedYieldMax: '6,000 kg/ha',
      days: 105,
      growingDaysMin: 90,
      growingDaysMax: 120,
      temp: '18°C - 30°C',
      optimalTempMin: 18.0,
      optimalTempMax: 30.0,
      rainfallMinMm: 500,
      rainfallOptimumMm: 750,
      rainfallMaxMm: 1200,
      waterReqMm: '500 - 800 mm per cycle',
      suitableConditions: 'Well-drained deep volcanic loam (pH 5.8 - 7.0), full sunlight (>6 hrs/day), minimum frost exposure.',
      growthStages: [
        { stage: 'Emergence (VE)', duration: '7-10 days', waterNeed: 'Low (15mm/wk)', keyRisks: 'Damping off, cutworms' },
        { stage: 'Vegetative (V1-V6)', duration: '20-25 days', waterNeed: 'Moderate (25mm/wk)', keyRisks: 'Stem borer, nutrient lockup' },
        { stage: 'Tasseling & Silking (VT-R1)', duration: '14-18 days', waterNeed: 'Critical Peak (45mm/wk)', keyRisks: 'Moisture stress, pollen desiccation' },
        { stage: 'Grain Filling & Dough (R2-R5)', duration: '30-35 days', waterNeed: 'High (35mm/wk)', keyRisks: 'Leaf blight, armyworm' },
        { stage: 'Physiological Maturity (R6)', duration: '15-20 days', waterNeed: 'Declining (10mm/wk)', keyRisks: 'Ear rot, post-maturity lodging' }
      ],
      suitabilityFactors: {
        soilPh: '5.8 - 7.0 (Optimal: 6.4)',
        drainage: 'Well-drained (Susceptible to waterlogging > 48 hrs)',
        elevation: '1,200m - 2,200m ASL',
        sunlight: 'Minimum 6.0 hours direct irradiance daily'
      },
      riskFactors: [
        'Fall Armyworm (Spodoptera frugiperda) infestation in whorl',
        'Mid-season terminal moisture deficit during tasseling',
        'Grey Leaf Spot (Cercospora zeae-maydis) under sustained high relative humidity (>85%)'
      ]
    },
    {
      id: 'crop-002',
      name: 'Wheat',
      scientificName: 'Triticum aestivum',
      category: 'Cereal',
      description: 'Cool-season cereal grain produced in highland plateaus with high tillering capacity.',
      typicalYield: '3,500 kg/ha',
      expectedYieldMin: '2,500 kg/ha',
      expectedYieldMax: '5,000 kg/ha',
      days: 120,
      growingDaysMin: 100,
      growingDaysMax: 140,
      temp: '10°C - 25°C',
      optimalTempMin: 10.0,
      optimalTempMax: 25.0,
      rainfallMinMm: 350,
      rainfallOptimumMm: 550,
      rainfallMaxMm: 900,
      waterReqMm: '350 - 600 mm per cycle',
      suitableConditions: 'Cool highlands, fertile clay-loam, pH 6.0 - 7.5, moderate moisture.',
      growthStages: [
        { stage: 'Germination & Tillering', duration: '25-30 days', waterNeed: 'Moderate (20mm/wk)', keyRisks: 'Crown rot, aphid vector' },
        { stage: 'Stem Elongation / Jointing', duration: '20-25 days', waterNeed: 'High (30mm/wk)', keyRisks: 'Yellow rust (Puccinia striiformis)' },
        { stage: 'Booting & Heading', duration: '14-18 days', waterNeed: 'Critical Peak (40mm/wk)', keyRisks: 'Frost at anthesis, heat blunting' },
        { stage: 'Milky to Hard Dough', duration: '25-30 days', waterNeed: 'Moderate (25mm/wk)', keyRisks: 'Fusarium head blight' },
        { stage: 'Ripening & Harvest', duration: '12-15 days', waterNeed: 'Dry conditions', keyRisks: 'Pre-harvest sprouting if rain occurs' }
      ],
      suitabilityFactors: {
        soilPh: '6.0 - 7.5 (Optimal: 6.5)',
        drainage: 'Moderate to well-drained',
        elevation: '1,800m - 2,600m ASL',
        sunlight: 'Cool temperate photoperiod'
      },
      riskFactors: [
        'Wheat Stem Rust (Ug99 strain vulnerability in susceptible varieties)',
        'Thermal spikes > 28°C during anthesis reducing grain set',
        'Excess rain at harvest causing pre-harvest sprout damage'
      ]
    },
    {
      id: 'crop-003',
      name: 'Dry Beans',
      scientificName: 'Phaseolus vulgaris',
      category: 'Legume',
      description: 'Nitrogen-fixing grain legume essential for soil health replenishment and dietary protein.',
      typicalYield: '1,800 kg/ha',
      expectedYieldMin: '1,200 kg/ha',
      expectedYieldMax: '2,500 kg/ha',
      days: 75,
      growingDaysMin: 60,
      growingDaysMax: 90,
      temp: '15°C - 25°C',
      optimalTempMin: 15.0,
      optimalTempMax: 25.0,
      rainfallMinMm: 400,
      rainfallOptimumMm: 600,
      rainfallMaxMm: 800,
      waterReqMm: '300 - 500 mm per cycle',
      suitableConditions: 'Light friable loams, pH 6.0 - 6.8, well-aerated soil without crusting.',
      growthStages: [
        { stage: 'Emergence & Unifoliate (V1-V2)', duration: '10-12 days', waterNeed: 'Low (15mm/wk)', keyRisks: 'Bean fly (Ophiomyia phaseoli)' },
        { stage: 'Trifoliate & Branching (V3-V4)', duration: '15-20 days', waterNeed: 'Moderate (25mm/wk)', keyRisks: 'Angular leaf spot' },
        { stage: 'Flowering & Pod Set (R1-R3)', duration: '12-16 days', waterNeed: 'Critical Peak (35mm/wk)', keyRisks: 'Flower drop from thermal stress > 30°C' },
        { stage: 'Pod Filling (R4-R7)', duration: '18-22 days', waterNeed: 'Moderate (25mm/wk)', keyRisks: 'Anthracnose under cool wet spells' },
        { stage: 'Physiological Maturity (R8)', duration: '10-14 days', waterNeed: 'Dry conditions', keyRisks: 'Pod shattering, seed discolouration' }
      ],
      suitabilityFactors: {
        soilPh: '6.0 - 6.8 (Rhizobia symbiotic efficiency threshold)',
        drainage: 'High aeration required; intolerant of waterlogging',
        elevation: '1,400m - 2,200m ASL',
        sunlight: 'Moderate to high insolation'
      },
      riskFactors: [
        'Severe flower abortion if daytime temperatures exceed 30°C',
        'Root rot pathogens in compacted waterlogged soils',
        'Bean common mosaic virus transmission via aphids'
      ]
    },
    {
      id: 'crop-004',
      name: 'Irish Potato',
      scientificName: 'Solanum tuberosum',
      category: 'Tuber',
      description: 'Cool highland root and tuber staple providing substantial caloric yield per unit area.',
      typicalYield: '22,000 kg/ha',
      expectedYieldMin: '15,000 kg/ha',
      expectedYieldMax: '30,000 kg/ha',
      days: 105,
      growingDaysMin: 90,
      growingDaysMax: 120,
      temp: '15°C - 22°C',
      optimalTempMin: 15.0,
      optimalTempMax: 22.0,
      rainfallMinMm: 500,
      rainfallOptimumMm: 700,
      rainfallMaxMm: 1000,
      waterReqMm: '500 - 700 mm per cycle',
      suitableConditions: 'Loose friable volcanic soils, pH 5.2 - 6.5, high soil organic matter.',
      growthStages: [
        { stage: 'Sprout Development', duration: '14-20 days', waterNeed: 'Low (15mm/wk)', keyRisks: 'Rhizoctonia stem canker' },
        { stage: 'Vegetative Canopy Growth', duration: '20-25 days', waterNeed: 'Moderate (30mm/wk)', keyRisks: 'Late Blight (Phytophthora infestans)' },
        { stage: 'Tuber Initiation (Hooking)', duration: '12-15 days', waterNeed: 'High (35mm/wk)', keyRisks: 'Nitrogen excess causing delayed bulking' },
        { stage: 'Tuber Bulking', duration: '35-45 days', waterNeed: 'Critical Peak (45mm/wk)', keyRisks: 'Bacterial wilt, drought stress' },
        { stage: 'Skin Set & Maturation', duration: '15-20 days', waterNeed: 'Low / Drying', keyRisks: 'Tuber moth entry into cracking soil' }
      ],
      suitabilityFactors: {
        soilPh: '5.2 - 6.5 (Optimal: 5.8)',
        drainage: 'Excellent friability and ridge tillage required',
        elevation: '1,800m - 2,800m ASL',
        sunlight: 'High daylight with cool nighttime temperatures (<15°C)'
      },
      riskFactors: [
        'Late Blight epidemic under persistent cloud and RH > 90%',
        'Bacterial wilt persistence in infested seed tubers',
        'Night temperatures > 20°C drastically impeding tuber induction'
      ]
    },
    {
      id: 'crop-005',
      name: 'Coffee (Arabica)',
      scientificName: 'Coffea arabica',
      category: 'Cash Crop',
      description: 'High-altitude perennial cash crop renowned for acidity and specialty cup quality.',
      typicalYield: '1,800 kg/ha',
      expectedYieldMin: '1,000 kg/ha',
      expectedYieldMax: '3,000 kg/ha',
      days: 270,
      growingDaysMin: 240,
      growingDaysMax: 300,
      temp: '15°C - 24°C',
      optimalTempMin: 15.0,
      optimalTempMax: 24.0,
      rainfallMinMm: 1200,
      rainfallOptimumMm: 1600,
      rainfallMaxMm: 2200,
      waterReqMm: '1200 - 1600 mm annual',
      suitableConditions: 'Deep red volcanic soils, pH 5.0 - 6.0, mist belts, shaded microclimate.',
      growthStages: [
        { stage: 'Pinhead & Flower Bud Induction', duration: '40-60 days', waterNeed: 'Dry trigger followed by rain', keyRisks: 'Thrips, leaf miner' },
        { stage: 'Anthesis & Flowering', duration: '7-10 days', waterNeed: 'Good moisture', keyRisks: 'Heavy rain washing out pollen' },
        { stage: 'Berry Expansion & Hardening', duration: '90-120 days', waterNeed: 'High (40mm/wk)', keyRisks: 'Coffee Berry Disease (Colletotrichum kahawae)' },
        { stage: 'Ripening (Cherry Reddening)', duration: '60-80 days', waterNeed: 'Moderate (25mm/wk)', keyRisks: 'Berry borer, premature cherry drop' }
      ],
      suitabilityFactors: {
        soilPh: '5.0 - 6.0',
        drainage: 'Deep well-drained volcanic ash profile (>1.5m)',
        elevation: '1,600m - 2,200m ASL',
        sunlight: 'Filtered sunlight / agroforestry shade'
      },
      riskFactors: [
        'Coffee Berry Disease (CBD) triggered by continuous mist and cool rains',
        'Coffee Leaf Rust (Hemileia vastatrix) spreading in warmer lowland fringes',
        'Soil acidification below pH 4.8 restricting phosphorus uptake'
      ]
    }
  ],
  cycles: [
    { id: 'cyc-001', farm: 'Green Valley Model Farm', field: 'North Field A', crop: 'Maize (H614D)', stage: 'Vegetative V6', targetYield: '5,800 kg/ha', status: 'ACTIVE' },
    { id: 'cyc-002', farm: 'Green Valley Model Farm', field: 'South Field B', crop: 'Beans (Rosecoco)', stage: 'Flowering R1', targetYield: '2,100 kg/ha', status: 'ACTIVE' }
  ],
  weather: [
    { time: '06:00', temp: 16.2, humidity: 88, rain: 0.0, wind: 6.5 },
    { time: '09:00', temp: 21.0, humidity: 70, rain: 0.0, wind: 9.2 },
    { time: '12:00', temp: 25.4, humidity: 54, rain: 1.2, wind: 12.0 },
    { time: '15:00', temp: 24.1, humidity: 62, rain: 2.8, wind: 10.4 },
    { time: '18:00', temp: 20.8, humidity: 72, rain: 4.8, wind: 8.1 }
  ],
  recommendations: [
    { id: 'rec-001', urgency: 'HIGH', category: 'FERTILIZER', title: 'Top-dressing CAN Application (V6 Stage)', due: 'In 3 days', field: 'North Field A' },
    { id: 'rec-002', urgency: 'MEDIUM', category: 'IRRIGATION', title: 'Schedule 15mm Supplemental Drip Irrigation', due: 'Tomorrow', field: 'North Field A' }
  ]
};

export const api = {
  token: localStorage.getItem('ayis_token') || null,

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('ayis_token', token);
    else localStorage.removeItem('ayis_token');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'omit', ...options, headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[API] Live C# Minimal API backend call to ${endpoint} failed (${err.message}), serving repository fallback dataset.`);
      return null;
    }
  },

  // 1. Farms & Spatial Fields (MySQL: `farms`, `fields` with POINT & POLYGON SRID 4326)
  async getFarms() {
    const live = await this.request('/farms');
    return live || DEMO_STATE.farms;
  },

  async getFarmById(id) {
    const live = await this.request(`/farms/${id}`);
    return live || DEMO_STATE.farms.find(f => f.id === id);
  },

  async createFarm(farmData) {
    return await this.request('/farms', { method: 'POST', body: JSON.stringify(farmData) });
  },

  async getFields(farmId) {
    const endpoint = farmId ? `/fields?farmId=${farmId}` : '/fields';
    return await this.request(endpoint);
  },

  async createField(fieldData) {
    return await this.request('/fields', { method: 'POST', body: JSON.stringify(fieldData) });
  },

  // 2. Crops & Crop Profiles (MySQL: `crops`, `crop_profiles`)
  async getCrops() {
    const live = await this.request('/crops');
    return live || DEMO_STATE.crops;
  },

  async getCropById(id) {
    const live = await this.request(`/crops/${id}`);
    return live || DEMO_STATE.crops.find(c => c.id === id);
  },

  async getCropProfiles() {
    return await this.request('/crop-profiles');
  },

  async saveCropProfile(profileData) {
    return await this.request('/crop-profiles', { method: 'POST', body: JSON.stringify(profileData) });
  },

  // 3. Crop Cycles & Production Planning (MySQL: `crop_cycles`)
  async getCycles(farmId) {
    const endpoint = farmId ? `/cycles?farmId=${farmId}` : '/cycles';
    const live = await this.request(endpoint);
    return live || DEMO_STATE.cycles;
  },

  async createCycle(cycleData) {
    return await this.request('/cycles', { method: 'POST', body: JSON.stringify(cycleData) });
  },

  // 4. Weather Telemetry & Stations (MySQL: `weather_stations`, `weather_observations`)
  async getRecentWeather(stationId) {
    const endpoint = stationId ? `/weather/recent?stationId=${stationId}` : '/weather/recent';
    const live = await this.request(endpoint);
    return live || DEMO_STATE.weather;
  },

  async getWeatherHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/weather/history?${query}`);
  },

  async getWeatherAlerts() {
    return await this.request('/weather/alerts');
  },

  // 5. Agronomic Intelligence & Recommendations (MySQL: `recommendations`)
  async getRecommendations(farmId) {
    const endpoint = farmId ? `/recommendations?farmId=${farmId}` : '/recommendations';
    const live = await this.request(endpoint);
    return live || DEMO_STATE.recommendations;
  },

  async updateRecommendationStatus(id, status, notes = '') {
    return await this.request(`/recommendations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  },

  // 6. Field Operations & Inspections (MySQL: `field_inspections`, `field_observations`)
  // 5. Intelligence & Agronomic Recommendations (MySQL: `suitability_assessments`, `recommendations`)
  async getFieldSuitability(fieldId) {
    return await this.request(`/intelligence/suitability?fieldId=${encodeURIComponent(fieldId)}`);
  },

  async getYieldPredictions(cycleId) {
    return await this.request(`/intelligence/yield-predictions?cycleId=${encodeURIComponent(cycleId)}`);
  },

  async getRecommendations(fieldId = null) {
    const endpoint = fieldId 
      ? `/recommendations?fieldId=${encodeURIComponent(fieldId)}`
      : '/recommendations';
    return await this.request(endpoint);
  },

  // Scenario 1: Pre-Season Crop Selection
  async getPreSeasonCropRecommendations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/recommendations/pre-season-crops?${query}`);
  },

  // Scenario 2: In-Season Daily Operational Directives
  async getDailyOperationalDirectives(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/recommendations/daily-directives?${query}`);
  },

  // Agronomic Rules & Thresholds (Authored by Agronomist)
  async getAgronomicRules(cropId = null) {
    const endpoint = cropId 
      ? `/agronomic-rules?cropId=${encodeURIComponent(cropId)}`
      : '/agronomic-rules';
    return await this.request(endpoint);
  },

  async createAgronomicRule(ruleData) {
    return await this.request('/agronomic-rules', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
  },

  async getInspections(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/inspections?${query}`);
  },

  async createInspection(inspectionData) {
    return await this.request('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData)
    });
  },

  async getObservations(fieldId) {
    const endpoint = fieldId ? `/observations?fieldId=${fieldId}` : '/observations';
    return await this.request(endpoint);
  },

  async createObservation(observationData) {
    return await this.request('/observations', {
      method: 'POST',
      body: JSON.stringify(observationData)
    });
  },

  // 7. Reports & Analytics Data Extraction
  async getReportData(reportType, filterCriteria) {
    return await this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, ...filterCriteria })
    });
  },

  // 8. Notifications & Alerts (MySQL: `notifications`)
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/notifications?${query}`);
  },

  async markNotificationAsRead(id) {
    return await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsAsRead() {
    return await this.request('/notifications/read-all', { method: 'POST' });
  },

  // 9. Identity & User Governance (MySQL: `users`, `roles`, `audit_logs`)
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/users?${query}`);
  },

  async createUser(userData) {
    return await this.request('/users', { method: 'POST', body: JSON.stringify(userData) });
  },

  async updateUserStatus(userId, isActive) {
    return await this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  },

  async getRoles() {
    return await this.request('/roles');
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/audit-logs?${query}`);
  }
};
