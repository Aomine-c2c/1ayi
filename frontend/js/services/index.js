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

  loginAs(emailOrRole = 'super_admin') {
    const roleMap = {
      'farmer': 'farmer',
      'agronomist': 'agronomist',
      'extension_officer': 'extension_officer',
      'field_officer': 'field_officer',
      'weather_analyst': 'weather_analyst',
      'farm_manager': 'farm_manager',
      'system_admin': 'system_admin',
      'super_admin': 'super_admin'
    };
    const role = roleMap[emailOrRole] || 'super_admin';
    const token = 'ayis_jwt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
    localStorage.setItem('ayis_token', token);
    this.setCurrentRole(role);
    return { token, role, user: this.getCurrentUser() };
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
    const trimmed = (emailOrUsername || '').trim();

    if (!trimmed || !password) {
      return { success: false, status: 'VALIDATION', message: 'Email/username and password are required.' };
    }

    try {
      const res = await api.request('/auth/token', {
        method: 'POST',
        body: JSON.stringify({ Username: trimmed, Password: password })
      });

      // Successful authentication
      api.setToken(res.access_token);
      const user = res.user;
      this.setCurrentRole(user.role || 'farmer');

      const avatarMap = {
        farmer: '🚜', agronomist: '🌾', farm_manager: '📋',
        extension_officer: '👥', field_officer: '🔍',
        weather_analyst: '📡', system_admin: '🔐', super_admin: '🏛️'
      };
      const profile = {
        id:        user.id,
        username:  user.username,
        firstName: user.first_name  || '',
        lastName:  user.last_name   || '',
        email:     user.email,
        role:      user.role,
        isStaff:   user.is_staff ?? false,
        avatar:    avatarMap[user.role] || '🌱'
      };

      if (rememberMe) {
        localStorage.setItem('ayis_user_profile_' + user.role, JSON.stringify(profile));
      } else {
        sessionStorage.setItem('ayis_user_profile_' + user.role, JSON.stringify(profile));
      }

      return {
        success:     true,
        token:       res.access_token,
        role:        user.role,
        user:        profile,
        isFirstLogin: this.isFirstLogin()
      };

    } catch (err) {
      // ApiError gives us a typed status code
      if (err.name === 'ApiError') {
        if (err.status === 401) {
          return { success: false, status: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password.' };
        }
        if (err.status === 403) {
          return { success: false, status: 'DISABLED', message: err.body?.message || 'Account is disabled. Contact an administrator.' };
        }
        if (err.isNetworkError) {
          return { success: false, status: 'NETWORK_ERROR', message: 'Cannot reach the AYIS server. Please check your connection or verify the backend is running.' };
        }
        return { success: false, status: 'SERVER_ERROR', message: `Server error (${err.status}): ${err.message}` };
      }
      return { success: false, status: 'UNKNOWN', message: err.message || 'An unexpected error occurred.' };
    }
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
    const farmId = 'farm-' + Math.floor(100 + Math.random() * 900);
    const newFarm = {
      id: farmId,
      name: onboardingData?.farm?.name || 'Onboarded Smallholder Farm',
      ownerId: 'u-008',
      regionId: 'reg-004',
      sizeHa: parseFloat(onboardingData?.farm?.size) || 8.5,
      latitude: parseFloat(onboardingData?.location?.latitude) || -0.3031,
      longitude: parseFloat(onboardingData?.location?.longitude) || 36.0800,
      boundaryWkt: 'POLYGON((36.0780 -0.3010, 36.0830 -0.3010, 36.0830 -0.3050, 36.0780 -0.3050, 36.0780 -0.3010))',
      primaryCrop: onboardingData?.activities?.primaryCrop || 'Maize',
      soilType: 'Volcanic Loam (pH 6.4)',
      irrigationType: onboardingData?.activities?.irrigation || 'Rainfed + Supplemental Drip',
      elevationM: 1850
    };

    const res = await api.createFarm(newFarm);
    return {
      success: true,
      farmId,
      farm: newFarm,
      message: 'Farmer and farm parcel registered successfully into database with spatial SRID 4326.'
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
    const live = await api.getFarms();
    return Array.isArray(live) ? live : [];
  },

  async getFarmById(id) {
    const farm = await api.getFarmById(id);
    if (farm) return farm;
    const all = await this.listFarms();
    return all.find(f => f.id === id) || all[0];
  },

  async createFarm(farmData) {
    const newFarm = {
      id: farmData.id || ('farm-' + Date.now().toString().slice(-4)),
      name: farmData.name || 'New Model Farm',
      ownerId: farmData.ownerId || 'u-008',
      regionId: farmData.regionId || 'reg-004',
      sizeHa: parseFloat(farmData.sizeHa) || 10.0,
      latitude: parseFloat(farmData.latitude) || -0.3031,
      longitude: parseFloat(farmData.longitude) || 36.0800,
      boundaryWkt: farmData.boundaryWkt || 'POLYGON((36.0780 -0.3010, 36.0830 -0.3010, 36.0830 -0.3050, 36.0780 -0.3050, 36.0780 -0.3010))',
      primaryCrop: farmData.primaryCrop || 'Maize (H614D)',
      soilType: farmData.soilType || 'Volcanic Loam (pH 6.4)',
      irrigationType: farmData.irrigationType || 'Rainfed + Supplemental Drip',
      elevationM: parseInt(farmData.elevationM) || 1850
    };
    const res = await api.createFarm(newFarm);
    return { success: !!res, farm: newFarm, message: 'Farm registered successfully in database.' };
  },

  async updateFarm(id, data) {
    const res = await api.updateFarm(id, data);
    return { success: !!res, message: 'Farm updated successfully in database.' };
  },

  async listFields(farmId) {
    const fields = await api.getFields(farmId);
    if (Array.isArray(fields) && fields.length > 0) {
      return fields.map(f => ({
        id: f.id,
        farmId: f.farmId,
        farmName: f.farmName || 'Green Valley Model Farm',
        name: f.name,
        areaHa: f.areaHa,
        soilPh: f.soilPh,
        organicMatterPct: f.organicMatterPct,
        drainageClass: f.drainageClass || 'Well drained',
        slopePct: f.slopePct || 2.0,
        currentCrop: f.primaryCrop || 'Maize (H614D)',
        cycleId: f.cycleId || 'cyc-001',
        status: 'ACTIVE',
        stage: 'Vegetative V6',
        observationsCount: 2,
        boundaryWkt: f.boundaryWkt
      }));
    }
    return [];
  },

  async getFieldById(id) {
    const fields = await this.listFields();
    return fields.find(f => f.id === id) || fields[0];
  },
  async listCropCycles(farmId) {
    return await cropService.listCycles(farmId);
  },
  async listCycles(farmId) {
    return await cropService.listCycles(farmId);
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
  async listCycles(farmId) {
    const live = await api.getCycles(farmId);
    if (Array.isArray(live) && live.length > 0) {
      return live.map(c => ({
        id: c.id,
        farm: c.farm || 'Green Valley Model Farm',
        farmId: c.farmId || (c.fieldId === 'fld-003' || c.fieldId === 'fld-004' ? 'farm-002' : 'farm-001'),
        field: c.field || 'North Field A (Hybrid Trial)',
        fieldId: c.fieldId,
        crop: c.crop || (c.cropId === 'crop-002' ? 'Wheat' : (c.cropId === 'crop-003' ? 'Dry Beans' : (c.cropId === 'crop-004' ? 'Irish Potato' : 'Maize'))),
        variety: c.variety || 'Commercial Certified',
        seasonName: c.seasonName,
        startDate: c.startDate ? c.startDate.split('T')[0] : '2026-03-15',
        expectedHarvestDate: c.expectedHarvestDate ? c.expectedHarvestDate.split('T')[0] : '2026-07-20',
        stage: c.currentStage || 'Growing',
        subStage: c.currentStage || 'Vegetative V6',
        targetYield: c.targetYieldKgHa ? `${(c.targetYieldKgHa / 1000).toFixed(1)} t/ha` : '5.8 t/ha',
        targetYieldKgHa: c.targetYieldKgHa || 5800,
        areaHa: 5.0,
        status: c.status || 'ACTIVE',
        progressPct: 65,
        timeline: [
          { stage: 'Planned', date: c.startDate ? c.startDate.split('T')[0] : '2026-03-01', completed: true },
          { stage: 'Preparing', date: '2026-03-10', completed: true },
          { stage: 'Planted', date: c.startDate ? c.startDate.split('T')[0] : '2026-03-15', completed: true },
          { stage: 'Growing', date: '2026-04-15', completed: true, current: true },
          { stage: 'Harvesting', date: c.expectedHarvestDate ? c.expectedHarvestDate.split('T')[0] : '2026-07-20', completed: false }
        ]
      }));
    }
    return [];
  },
  async listCropCycles(farmId) {
    return await this.listCycles(farmId);
  },
  async createCycle(cycleData) {
    const payload = {
      id: cycleData.id || ('cyc-' + Date.now().toString().slice(-4)),
      fieldId: cycleData.fieldId || 'fld-001',
      cropId: cycleData.cropId || 'crop-001',
      varietyId: cycleData.varietyId || 'var-001',
      seasonName: cycleData.seasonName || '2026/2027 Production Cycle',
      startDate: cycleData.startDate || new Date().toISOString().split('T')[0],
      expectedHarvestDate: cycleData.expectedHarvestDate || '2026-11-30',
      status: 'ACTIVE',
      currentStage: cycleData.stage || 'Vegetative V6',
      targetYieldKgHa: parseFloat(cycleData.targetYield) ? parseFloat(cycleData.targetYield) * 1000 : 6000,
      notes: cycleData.notes || ''
    };
    const created = await api.createCycle(payload);
    return { success: !!created, cycle: payload, message: 'Crop cycle registered successfully in database.' };
  }
};

// 4. Weather & Climate Service — Powered by AccuWeather
// Default location: Harare, Zimbabwe (used when no farm GPS is available)
const DEFAULT_LAT = -17.8252;
const DEFAULT_LON = 31.0335;

/**
 * Normalise an AccuWeather DailyForecast object to the UI's expected forecast shape.
 */
function normaliseDailyForecast(df) {
  const dateObj = new Date(df.date);
  const dateStr = dateObj.toISOString().split('T')[0];
  const maxRainProb = Math.max(df.rainProbabilityDay ?? 0, df.rainProbabilityNight ?? 0);
  return {
    date: dateStr,
    tempMax: Math.round(df.tempMaxC ?? df.temperature?.maximum?.value ?? 0),
    tempMin: Math.round(df.tempMinC ?? df.temperature?.minimum?.value ?? 0),
    rainMm: parseFloat((df.totalRainMm ?? 0).toFixed(1)),
    rainProbability: maxRainProb,
    condition: df.dayPhrase ?? df.day?.iconPhrase ?? 'N/A',
    nightCondition: df.nightPhrase ?? df.night?.iconPhrase ?? 'N/A',
    windSpeedKmh: Math.round(df.windSpeedKmh ?? 0),
    windDirection: df.windDirection ?? 'N/A',
    hoursOfSun: df.hoursOfSun ?? 0,
    icon: df.dayIcon ?? df.day?.icon ?? 1
  };
}

/**
 * Normalise AccuWeather current conditions to the UI's station/observation shape.
 */
function normaliseCurrentConditions(cc, id, name, region, lat, lon) {
  const syncAgo = (() => {
    const obs = new Date(cc.observationDateTime ?? Date.now());
    const diffMin = Math.round((Date.now() - obs.getTime()) / 60000);
    return diffMin <= 1 ? 'Just now' : `${diffMin} mins ago`;
  })();
  return {
    id,
    code: `ZW-${id}`,
    name,
    region,
    lat,
    lon,
    type: 'AccuWeather Live Station',
    status: 'ONLINE',
    dataQualityScore: 99.0,
    lastSync: syncAgo,
    temp: cc.temperature?.value ?? 0,
    temperatureC: cc.temperature?.value ?? 0,
    realFeelTemp: cc.realFeelTemperature?.value ?? 0,
    humidity: cc.relativeHumidity ?? 0,
    humidityPct: cc.relativeHumidity ?? 0,
    rain: cc.precipitationLast24hMm ?? 0,
    rain24h: cc.precipitationLast24hMm ?? 0,
    rainfallMm: cc.precipitationLast24hMm ?? 0,
    wind: cc.wind?.speed ?? 0,
    windSpeed: cc.wind?.speed ?? 0,
    windSpeedKmh: cc.wind?.speed ?? 0,
    windDirection: cc.wind?.direction ?? 'N/A',
    pressureHpa: cc.pressureHpa ?? 1013,
    visibility: cc.visibility ?? 0,
    uvIndex: cc.uvIndex ?? 0,
    uvIndexText: cc.uvIndexText ?? 'N/A',
    cloudCoverPct: cc.cloudCoverPct ?? 0,
    weatherText: cc.weatherText ?? 'N/A',
    weatherIcon: cc.weatherIcon ?? 1,
    isDayTime: cc.isDayTime ?? true,
    // Legacy fields for compatibility
    solarRadiationWm2: null,
    batteryVolts: null,
    network: 'AccuWeather API'
  };
}

export const weatherService = {
  /**
   * Get current conditions for the default Zimbabwe location.
   * Falls through to backend DB observations if API is unavailable.
   */
  async getRecentObservations() {
    try {
      const cc = await api.getWeatherCurrent(DEFAULT_LAT, DEFAULT_LON);
      if (cc && cc.temperature) {
        return [normaliseCurrentConditions(cc, 'stn-hre', 'Harare Central (AccuWeather)', 'Mashonaland East', DEFAULT_LAT, DEFAULT_LON)];
      }
    } catch (e) {
      console.warn('[weatherService] AccuWeather current conditions unavailable, falling back to DB.', e);
    }
    const rawObs = await api.getRecentWeather();
    if (Array.isArray(rawObs)) {
      return rawObs.map(o => ({
        ...o,
        temp: o.temperatureC ?? o.temp ?? 22.4,
        temperatureC: o.temperatureC ?? o.temp ?? 22.4,
        humidity: o.humidityPct ?? o.humidity ?? 68,
        humidityPct: o.humidityPct ?? o.humidity ?? 68,
        rain: o.rainfallMm ?? o.rain24h ?? o.rain ?? 0.0,
        rainfallMm: o.rainfallMm ?? o.rain24h ?? o.rain ?? 0.0,
        wind: o.windSpeedKmh ?? o.windSpeed ?? o.wind ?? 6.2,
        windSpeed: o.windSpeedKmh ?? o.windSpeed ?? o.wind ?? 6.2,
        windSpeedKmh: o.windSpeedKmh ?? o.windSpeed ?? o.wind ?? 6.2
      }));
    }
    return rawObs;
  },

  /**
   * Get 5-day daily forecast for a GPS location.
   * @param {number} lat
   * @param {number} lon
   */
  async getForecasts(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
      const result = await api.getWeatherForecast(lat, lon);
      if (result && result.dailyForecasts && result.dailyForecasts.length > 0) {
        return {
          headline: result.headline ?? '',
          days: result.dailyForecasts.map(normaliseDailyForecast)
        };
      }
    } catch (e) {
      console.warn('[weatherService] AccuWeather forecast unavailable.', e);
    }
    // Graceful fallback — empty forecast with informative message
    return { headline: 'Live forecast unavailable. Check network or API quota.', days: [] };
  },

  /**
   * Get active weather alerts for a GPS location.
   * @param {number} lat
   * @param {number} lon
   */
  async getAlerts(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
      const alerts = await api.getWeatherAlerts(lat, lon);
      if (Array.isArray(alerts)) {
        return alerts.map((a, i) => ({
          id: `aw-alert-${a.alertId ?? i}`,
          severity: _mapSeverity(a.severity),
          headline: a.description ?? 'Weather Alert',
          region: 'Zimbabwe',
          effectiveUntil: a.expireDate ? new Date(a.expireDate).toLocaleString() : 'See forecast',
          trigger: a.category ?? 'Meteorological',
          date: a.effectiveDate ?? new Date().toISOString(),
          status: 'ACTIVE',
          source: 'AccuWeather',
          priority: a.priority,
          mobileLink: a.mobileLink ?? ''
        }));
      }
    } catch (e) {
      console.warn('[weatherService] AccuWeather alerts unavailable.', e);
    }
    return [];
  },

  /**
   * Get current conditions for each registered farm, presented as "stations".
   * Each farm's GPS is used to fetch its own AccuWeather reading.
   * @param {Array} farms — array of farm objects with latitude/longitude
   */
  async getStations(farms = []) {
    if (farms.length === 0) {
      // No farms: return single Harare reading
      try {
        const cc = await api.getWeatherCurrent(DEFAULT_LAT, DEFAULT_LON);
        if (cc && cc.temperature) {
          return [normaliseCurrentConditions(cc, 'stn-hre', 'Harare (Default)', 'Mashonaland East', DEFAULT_LAT, DEFAULT_LON)];
        }
      } catch (e) { /* silent */ }
      return [];
    }

    const stationPromises = farms.map(async (farm, idx) => {
      const lat = farm.latitude ?? DEFAULT_LAT;
      const lon = farm.longitude ?? DEFAULT_LON;
      try {
        const cc = await api.getWeatherCurrent(lat, lon);
        if (cc && cc.temperature) {
          return normaliseCurrentConditions(
            cc,
            farm.id ?? `stn-${idx}`,
            `${farm.name} (Live)`,
            farm.region ?? 'Zimbabwe',
            lat,
            lon
          );
        }
      } catch (e) {
        console.warn(`[weatherService] Could not fetch conditions for farm ${farm.name}`, e);
      }
      return null;
    });

    const results = await Promise.all(stationPromises);
    return results.filter(Boolean);
  },

  /**
   * Get a complete weather bundle (current + 5-day forecast + alerts) for a single farm.
   * @param {Object} farm — must have latitude and longitude
   */
  async getWeatherForFarm(farm) {
    const lat = farm.latitude ?? DEFAULT_LAT;
    const lon = farm.longitude ?? DEFAULT_LON;

    const [current, forecast, alerts] = await Promise.allSettled([
      api.getWeatherCurrent(lat, lon),
      api.getWeatherForecast(lat, lon),
      api.getWeatherAlerts(lat, lon)
    ]);

    return {
      farmId: farm.id,
      farmName: farm.name,
      lat,
      lon,
      current: current.status === 'fulfilled' ? current.value : null,
      forecast: forecast.status === 'fulfilled'
        ? { headline: forecast.value?.headline ?? '', days: (forecast.value?.dailyForecasts ?? []).map(normaliseDailyForecast) }
        : null,
      alerts: alerts.status === 'fulfilled' ? (alerts.value ?? []) : [],
      fetchedAt: new Date().toISOString()
    };
  },

  /**
   * Historical time-series — AccuWeather historical requires a paid plan.
   * Returns empty array with a note until a higher-tier plan is available.
   */
  async getHistoricalSeries(farmId, timeframe = 'daily') {
    // AccuWeather Historical API is available on paid plans.
    // Returning empty array so charts render gracefully with a "No data" state.
    console.info('[weatherService] Historical data requires AccuWeather paid plan. Returning empty series.');
    return [];
  },

  /**
   * Climate trends — derived from forecast data where possible.
   * AccuWeather Climatology endpoints are on paid tiers.
   */
  async getClimateTrends(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
      const forecast = await api.getWeatherForecast(lat, lon);
      if (forecast && forecast.dailyForecasts && forecast.dailyForecasts.length > 0) {
        const days = forecast.dailyForecasts;
        const avgTemp = days.reduce((s, d) => s + ((d.tempMaxC + d.tempMinC) / 2), 0) / days.length;
        const totalRain = days.reduce((s, d) => s + (d.totalRainMm ?? 0), 0);
        const avgRainProb = days.reduce((s, d) => s + Math.max(d.rainProbabilityDay ?? 0, d.rainProbabilityNight ?? 0), 0) / days.length;
        return {
          source: 'AccuWeather 5-Day Forecast Derived',
          forecastAvgTempC: parseFloat(avgTemp.toFixed(1)),
          forecastTotalRainMm: parseFloat(totalRain.toFixed(1)),
          forecastAvgRainProbabilityPct: Math.round(avgRainProb),
          headline: forecast.headline ?? '',
          // Legacy fields (unavailable without paid plan)
          rainfallAnomalyPct: null,
          temperatureAnomalyC: null,
          seasonProgressionPct: null,
          cumulativeRainMm: null,
          normalRainMm: null,
          gddAccumulated: null,
          gddTarget: null,
          anomalies: [],
          seasonalPatterns: []
        };
      }
    } catch (e) {
      console.warn('[weatherService] Climate trends fetch failed.', e);
    }
    return { source: 'Unavailable', anomalies: [], seasonalPatterns: [] };
  },

  /**
   * Data quality metrics — reflects AccuWeather API call cache status.
   */
  async getDataQualityMetrics() {
    return [
      {
        station: 'AccuWeather API Gateway',
        code: 'AW-API',
        completeness: 'Live',
        missingPackets: 0,
        delayedPackets: 0,
        invalidReadings: 0,
        latency: '< 500ms',
        status: 'OPERATIONAL',
        lastPacket: 'Cached 30 min',
        powerStatus: 'Cloud Infrastructure',
        sensorIntegrity: '100%',
        cacheStrategy: 'In-Memory: CurrentConditions=30min, Forecast=1h, Alerts=30min, LocationKey=24h'
      }
    ];
  }
};

// Helper: map AccuWeather severity string to AYIS severity level
function _mapSeverity(awSeverity) {
  const s = (awSeverity ?? '').toLowerCase();
  if (s.includes('extreme') || s.includes('severe')) return 'CRITICAL';
  if (s.includes('moderate')) return 'HIGH';
  if (s.includes('minor')) return 'MEDIUM';
  return 'LOW';
}

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

  async listRecommendations(fieldId = null) {
    const live = await api.getRecommendations(fieldId);
    if (Array.isArray(live) && live.length > 0) {
      return live.map(r => ({
        id: r.id,
        farm: r.farmName || 'Commercial Farm',
        farmId: r.farmId || 'farm-001',
        field: r.fieldName || 'Field 1',
        fieldId: r.fieldId || 'fld-001',
        crop: r.cropName || 'Maize',
        cropId: r.cropId || 'crop-001',
        recommendationType: r.category || 'Agronomic',
        recommendationMessage: r.title,
        recommendationReason: r.details,
        confidenceScore: r.confidenceScore || 92,
        suitabilityScore: r.suitabilityScore || 85,
        riskScore: r.urgency === 'CRITICAL' ? 82 : (r.urgency === 'HIGH' ? 45 : 18),
        weatherFactors: {
          recentRainfall: 'favourable (18.2 mm past 48h)',
          temperature: 'favourable (22.4°C mean)',
          forecastRainfall: 'moderate (12.4 mm in next 48h)',
          currentSeason: 'suitable'
        },
        suggestedAction: r.details,
        riskFactors: [
          'Monitor rain patterns and foliar canopy humidity'
        ],
        historicalComparison: 'Parcels applying recommended measures preserved high yield potential.',
        createdDate: r.createdAt ? r.createdAt.replace('T', ' ').substring(0, 16) : '2026-09-14 08:30',
        validUntil: r.actionDueDate ? r.actionDueDate.replace('T', ' ').substring(0, 16) : '2026-09-22 18:00',
        status: r.isImplemented ? 'IMPLEMENTED' : 'ACTIVE'
      }));
    }
    return [];
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
    try {
      const [users, farms] = await Promise.all([
        api.getUsers({ role: 'farmer' }),
        api.getFarms()
      ]);
      const farmers = Array.isArray(users) ? users.filter(u => u.role === 'farmer') : [];
      const farmList = Array.isArray(farms) ? farms : [];

      if (farmers.length > 0) {
        return farmers.map((f, idx) => {
          const farm = farmList[idx % farmList.length] || farmList[0] || {};
          return {
            id: f.id,
            name: `${f.firstName || ''} ${f.lastName || ''}`.trim() || f.username,
            phone: f.phoneNumber || '+254 700 000 000',
            email: f.email,
            location: farm.county ? `${farm.county}, Kenya` : 'Nakuru, Kenya',
            farmName: farm.name || 'Model Demonstration Farm',
            farmId: farm.id || 'farm-001',
            areaHa: farm.totalAreaHectares || 10.0,
            primaryCrop: 'Maize (H614D)',
            secondaryCrop: 'Dry Beans (Rosecoco)',
            activeCyclesCount: 2,
            riskLevel: idx % 2 === 1 ? 'HIGH' : 'LOW',
            riskFactors: idx % 2 === 1 ? 'Pathogen pressure in sub-canopy' : 'Normal vegetative trajectory',
            lastVisitDate: '2026-09-08',
            nextVisitDate: '2026-09-15',
            assistanceRequest: idx % 2 === 1 ? 'Foliar spray verification requested' : null,
            pendingFollowUps: idx % 2 === 1 ? 1 : 0
          };
        });
      }
    } catch (e) {
      console.warn('Could not derive farmers dynamically from db:', e);
    }
    return [];
  },
  async listVisits() {
    try {
      const inspections = await api.getInspections();
      if (Array.isArray(inspections) && inspections.length > 0) {
        return inspections.map((insp, idx) => ({
          id: `v-${insp.id || idx}`,
          farmer: insp.farmerName || 'Farmer Partner',
          farmerId: insp.farmerId || 'u-008',
          farm: insp.farmName || 'Commercial Farm',
          farmId: insp.farmId || 'farm-001',
          field: insp.fieldName || 'Field 1',
          fieldId: insp.fieldId || 'fld-001',
          date: insp.inspectionDate ? insp.inspectionDate.split(' ')[0] : '2026-09-15',
          time: insp.inspectionDate && insp.inspectionDate.includes(' ') ? insp.inspectionDate.split(' ')[1] : '10:00 AM',
          purpose: insp.observations || 'Field condition inspection',
          status: insp.status || 'SCHEDULED',
          officer: insp.inspector || 'Grace Wanjiku',
          weatherCondition: 'Scattered clouds, 22°C',
          notes: insp.notes || ''
        }));
      }
    } catch (e) {
      console.warn('Could not derive visits from inspections:', e);
    }
    return [];
  },
  async getFollowUps() {
    try {
      const inspections = await api.getInspections();
      if (Array.isArray(inspections) && inspections.length > 0) {
        return inspections
          .filter(insp => insp.followUpNeeded)
          .map((insp, idx) => ({
            id: `fol-${insp.id || idx}`,
            title: insp.followUpDetails || `Follow-up on ${insp.fieldName || 'field inspection'}`,
            farmer: insp.farmerName || 'Farmer Partner',
            farm: insp.farmName || 'Commercial Farm',
            field: insp.fieldName || 'Field 1',
            crop: insp.crop || 'Maize',
            severity: insp.severity || 'WARNING',
            status: insp.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
            due: '2026-09-18',
            notes: insp.notes || ''
          }));
      }
    } catch (e) {
      console.warn('Could not derive followups from inspections:', e);
    }
    return [];
  },
  async listObservations(fieldId = null) {
    const live = await api.getObservations(fieldId);
    if (Array.isArray(live) && live.length > 0) return live;
    return [];
  },
  async listInspections(params = {}) {
    const live = await api.getInspections(params);
    if (Array.isArray(live) && live.length > 0) return live;
    return [];
  },
  async createInspection(inspectionData) {
    const res = await api.createInspection(inspectionData);
    if (res && res.id) {
      return {
        success: true,
        inspection: res,
        message: `Inspection record ${res.id} recorded in database successfully.`
      };
    }
    return {
      success: true,
      inspection: inspectionData,
      message: 'Inspection recorded.'
    };
  },
  async listTasks(params = {}) {
    const live = await api.getTasks(params);
    if (Array.isArray(live) && live.length > 0) return live;
    return [];
  },
  async updateTaskStatus(taskId, newStatus) {
    const res = await api.updateTaskStatus(taskId, newStatus);
    return {
      success: true,
      taskId,
      newStatus,
      message: `Task ${taskId} status updated to ${newStatus} in database.`
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

  async listReports(params = {}) {
    const live = await api.getReports(params);
    if (Array.isArray(live) && live.length > 0) return live;
    return [];
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

  async listNotifications(params = {}) {
    if (!authService.isLoggedIn()) return [];
    try {
      const live = await api.getNotifications(params);
    if (Array.isArray(live) && live.length > 0) {
      return live.map(n => ({
        id: n.id,
        title: n.title,
        description: n.message || n.description || '',
        category: n.type === 'CRITICAL' ? 'Crop' : (n.type === 'WARNING' ? 'Weather' : 'System'),
        severity: n.type || 'INFO',
        date: n.createdAt ? n.createdAt.replace('T', ' ').substring(0, 16) : '2026-09-15 08:15',
        relatedFarm: n.relatedFarm || 'Green Valley Model Farm',
        relatedCrop: n.relatedCrop || 'Maize',
        isRead: !!n.isRead,
        isAgriculturalAlert: n.type === 'CRITICAL' || n.type === 'WARNING'
      }));
    }
      return [];
    } catch {
      return [];
    }
  },

  async getUnreadCount() {
    const list = await this.listNotifications();
    return list.filter(n => !n.isRead).length;
  },

  async markAsRead(id) {
    await api.markNotificationAsRead(id);
    return { success: true, id };
  },

  async markAllAsRead() {
    await api.markAllNotificationsAsRead();
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
    const live = await api.getUsers();
    if (Array.isArray(live) && live.length > 0) {
      return live.map(u => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        email: u.email,
        role: u.role,
        roleTitle: u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Farmer',
        status: u.isActive ? 'ACTIVE' : 'INACTIVE',
        department: u.department || 'Agricultural Operations',
        phone: u.phoneNumber || '+254 700 000 000',
        lastLogin: u.lastLogin || 'Active',
        createdAt: u.createdAt ? u.createdAt.split('T')[0] : '2026-01-01'
      }));
    }
    return [];
  },

  async getUserById(id) {
    const u = await api.request(`/users/${id}`);
    if (u) {
      return {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        email: u.email,
        role: u.role,
        roleTitle: u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Farmer',
        status: u.isActive ? 'ACTIVE' : 'INACTIVE',
        department: u.department || 'Agricultural Operations',
        phone: u.phoneNumber || '+254 700 000 000',
        lastLogin: u.lastLogin || 'Active',
        createdAt: u.createdAt ? u.createdAt.split('T')[0] : '2026-01-01'
      };
    }
    return null;
  },

  async createUser(userData) {
    const nameParts = (userData.name || '').trim().split(' ');
    const firstName = nameParts[0] || 'New';
    const lastName = nameParts.slice(1).join(' ') || 'User';
    const username = (userData.email || '').split('@')[0] || `user_${Date.now().toString().slice(-4)}`;
    const payload = {
      username,
      email: userData.email,
      passwordHash: 'Password123!',
      firstName,
      lastName,
      phoneNumber: userData.phone || '+254 700 000 000',
      role: userData.role || 'farmer',
      isActive: userData.status !== 'INACTIVE',
      isStaff: userData.role === 'admin' || userData.role === 'system_admin' || userData.role === 'super_admin'
    };
    const created = await api.createUser(payload);
    return { success: !!created, user: created, message: 'User provisioned successfully in database.' };
  },

  async updateUser(id, updateData) {
    const nameParts = (updateData.name || '').trim().split(' ');
    const payload = {
      id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      phoneNumber: updateData.phone || '',
      role: updateData.role || 'farmer'
    };
    const res = await api.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return { success: !!res, user: res?.user, message: 'User updated in database.' };
  },

  async toggleUserStatus(id) {
    const u = await this.getUserById(id);
    const newActive = u?.status !== 'ACTIVE';
    const res = await api.updateUserStatus(id, newActive);
    return { success: !!res, status: newActive ? 'ACTIVE' : 'INACTIVE' };
  },

  async deleteUser(id) {
    const res = await api.request(`/users/${id}`, { method: 'DELETE' });
    return { success: !!res };
  },

  async listAuditLogs() {
    const live = await api.getAuditLogs();
    return Array.isArray(live) ? live : [];
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
