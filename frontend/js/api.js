/**
 * AYIS Centralized API Client & Data Provider
 * Connects to C# ASP.NET Core Minimal API with graceful fallback to offline/demo data
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000/api/v1'
  : '/api/v1';

// Live Database Client
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
      console.warn(`[API] Database request to ${endpoint} failed:`, err.message);
      return null;
    }
  },

  // 1. Farms & Spatial Fields (Database: `farms`, `fields`)
  async getFarms() {
    const live = await this.request('/farms');
    return Array.isArray(live) ? live : [];
  },

  async getFarmById(id) {
    const live = await this.request(`/farms/${id}`);
    return live || null;
  },

  async createFarm(farmData) {
    return await this.request('/farms', { method: 'POST', body: JSON.stringify(farmData) });
  },

  async updateFarm(id, farmData) {
    return await this.request(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(farmData) });
  },

  async getFields(farmId) {
    const endpoint = farmId ? `/fields?farmId=${farmId}` : '/fields';
    const live = await this.request(endpoint);
    return Array.isArray(live) ? live : [];
  },

  async createField(fieldData) {
    return await this.request('/fields', { method: 'POST', body: JSON.stringify(fieldData) });
  },

  // 2. Crops & Crop Profiles (Database: `crops`, `crop_varieties`)
  async getCrops() {
    const live = await this.request('/crops');
    return Array.isArray(live) ? live : [];
  },

  async getCropById(id) {
    const live = await this.request(`/crops/${id}`);
    return live || null;
  },

  // 3. Crop Cycles & Production Planning (Database: `crop_cycles`)
  async getCycles(farmId) {
    const endpoint = farmId ? `/cycles?farmId=${farmId}` : '/cycles';
    const live = await this.request(endpoint);
    return Array.isArray(live) ? live : [];
  },

  async createCycle(cycleData) {
    return await this.request('/cycles', { method: 'POST', body: JSON.stringify(cycleData) });
  },

  // 4. Weather Telemetry & Stations (Database: `weather_observations`)
  async getRecentWeather(stationId) {
    const endpoint = stationId ? `/weather/recent?stationId=${stationId}` : '/weather/recent';
    const live = await this.request(endpoint);
    return Array.isArray(live) ? live : [];
  },

  async getWeatherHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/weather/history?${query}`);
  },

  async getWeatherAlerts() {
    return await this.request('/weather/alerts');
  },

  // 5. Agronomic Intelligence & Recommendations (Database: `recommendations`)
  async getRecommendations(fieldId) {
    const endpoint = fieldId ? `/recommendations?fieldId=${fieldId}` : '/recommendations';
    const live = await this.request(endpoint);
    return Array.isArray(live) ? live : [];
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

  async getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/tasks?${query}` : '/tasks';
    const live = await this.request(endpoint);
    return Array.isArray(live) ? live : [];
  },

  async updateTaskStatus(taskId, status) {
    return await this.request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // 7. Reports & Analytics Data Extraction
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/reports?${query}` : '/reports';
    const live = await this.request(endpoint);
    return Array.isArray(live) ? live : [];
  },

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
  },

  // 10. AccuWeather Proxy (GPS-based weather data)
  async getWeatherCurrent(lat, lon) {
    return await this.request(`/weather/current?lat=${lat}&lon=${lon}`);
  },

  async getWeatherForecast(lat, lon) {
    return await this.request(`/weather/forecast?lat=${lat}&lon=${lon}`);
  },

  async getWeatherAlerts(lat, lon) {
    return await this.request(`/weather/alerts?lat=${lat}&lon=${lon}`);
  },

  async getWeatherLocationKey(lat, lon) {
    return await this.request(`/weather/location-key?lat=${lat}&lon=${lon}`);
  }
};
