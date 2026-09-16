/**
 * AYIS API Adapter Layer
 * Bridges the high-level service abstractions (services/index.js) with the
 * low-level API client (api.js) using the Adapter pattern.
 * 
 * This allows services to call actual backend endpoints while gracefully
 * falling back to mock data when the API is unavailable.
 */

import { api } from '../api.js';

/**
 * Generic adapter that wraps an API call with fallback to mock data
 * @param {Function} apiCall - The API function to call
 * @param {*} mockData - Fallback mock data
 * @param {Object} options - Additional options
 * @returns {Promise<*>} - API response or mock data
 */
async function withFallback(apiCall, mockData, options = {}) {
  const { 
    transform = (data) => data,
    onError = null 
  } = options;

  try {
    const result = await apiCall();
    if (result !== null && result !== undefined) {
      return transform(result);
    }
  } catch (error) {
    console.warn(`[Adapter] API call failed: ${error.message}, using fallback data`);
    if (onError) onError(error);
  }
  
  // Return mock data (can be a value or a function that returns a value)
  return typeof mockData === 'function' ? mockData() : mockData;
}

/**
 * Creates a service method that calls an API endpoint with fallback
 * @param {string} endpoint - API endpoint (e.g., '/farms')
 * @param {*} mockData - Fallback mock data
 * @param {Object} options - Options including transform, method, body
 * @returns {Function} - Async function that returns data
 */
function createApiServiceMethod(endpoint, mockData, options = {}) {
  const { 
    method = 'GET',
    transform = (data) => data,
    body = null,
    queryParams = null
  } = options;

  return async (params = {}) => {
    const apiCall = async () => {
      let url = endpoint;
      if (queryParams && params) {
        const query = new URLSearchParams(params).toString();
        if (query) url += `?${query}`;
      }
      
      const fetchOptions = { method };
      if (body || (params && method !== 'GET')) {
        fetchOptions.body = JSON.stringify(body || params);
      }
      
      const response = await api.request(url, fetchOptions);
      return response;
    };

    return withFallback(apiCall, mockData, { transform });
  };
}

/**
 * Creates a service method for POST/PUT/PATCH operations
 * @param {string} endpoint - API endpoint
 * @param {*} mockResponse - Mock response for the mutation
 * @param {Object} options - Options
 * @returns {Function} - Async function that performs the mutation
 */
function createMutationServiceMethod(endpoint, mockResponse, options = {}) {
  const { method = 'POST', transform = (data) => data } = options;

  return async (data) => {
    const apiCall = async () => {
      const response = await api.request(endpoint, {
        method,
        body: JSON.stringify(data)
      });
      return response;
    };

    return withFallback(apiCall, mockResponse, { transform });
  };
}

/**
 * Farm & Field API Adapter
 * Maps service calls to actual API endpoints
 */
export const farmAdapter = {
  // Farms
  listFarms: createApiServiceMethod('/farms', []),
  getFarmById: (id) => createApiServiceMethod(`/farms/${id}`, null)(),
  createFarm: createMutationServiceMethod('/farms', { success: true }, { method: 'POST' }),
  updateFarm: (id, data) => createMutationServiceMethod(`/farms/${id}`, { success: true }, { method: 'PUT' })(data),
  deleteFarm: (id) => createMutationServiceMethod(`/farms/${id}`, { success: true }, { method: 'DELETE' })(),

  // Fields
  listFields: (farmId) => createApiServiceMethod('/fields', [], { queryParams: true })({ farmId }),
  getFieldById: (id) => createApiServiceMethod(`/fields/${id}`, null)(),
  createField: createMutationServiceMethod('/fields', { success: true }, { method: 'POST' }),
  updateField: (id, data) => createMutationServiceMethod(`/fields/${id}`, { success: true }, { method: 'PUT' })(data),
  deleteField: (id) => createMutationServiceMethod(`/fields/${id}`, { success: true }, { method: 'DELETE' })(),

  // Farm-Field relationship
  getFieldsByFarm: (farmId) => createApiServiceMethod(`/farms/${farmId}/fields`, [])(),
};

/**
 * Crop & Cycle API Adapter
 */
export const cropAdapter = {
  // Crops
  listCrops: createApiServiceMethod('/crops', []),
  getCropById: (id) => createApiServiceMethod(`/crops/${id}`, null)(),
  createCrop: createMutationServiceMethod('/crops', { success: true }, { method: 'POST' }),
  updateCrop: (id, data) => createMutationServiceMethod(`/crops/${id}`, { success: true }, { method: 'PUT' })(data),
  deleteCrop: (id) => createMutationServiceMethod(`/crops/${id}`, { success: true }, { method: 'DELETE' })(),

  // Crop Profiles
  listCropProfiles: createApiServiceMethod('/crop-profiles', []),
  getCropProfileById: (id) => createApiServiceMethod(`/crop-profiles/${id}`, null)(),
  saveCropProfile: createMutationServiceMethod('/crop-profiles', { success: true }, { method: 'POST' }),

  // Cycles
  listCycles: (farmId) => createApiServiceMethod('/cycles', [], { queryParams: true })({ farmId }),
  getCycleById: (id) => createApiServiceMethod(`/cycles/${id}`, null)(),
  createCycle: createMutationServiceMethod('/cycles', { success: true }, { method: 'POST' }),
  updateCycle: (id, data) => createMutationServiceMethod(`/cycles/${id}`, { success: true }, { method: 'PUT' })(data),
  deleteCycle: (id) => createMutationServiceMethod(`/cycles/${id}`, { success: true }, { method: 'DELETE' })(),
};

/**
 * Weather API Adapter
 */
export const weatherAdapter = {
  getRecentObservations: (stationId) => createApiServiceMethod('/weather/recent', [], { queryParams: true })({ stationId }),
  getForecasts: (params = {}) => createApiServiceMethod('/weather/forecast', [], { queryParams: true })(params),
  getAlerts: createApiServiceMethod('/weather/alerts', []),
  getStations: createApiServiceMethod('/weather/stations', []),
  getStationById: (id) => createApiServiceMethod(`/weather/stations/${id}`, null)(),
  getHistoricalSeries: (params = {}) => createApiServiceMethod('/weather/history', [], { queryParams: true })(params),
  getClimateTrends: createApiServiceMethod('/weather/climate-trends', {}),
  getDataQualityMetrics: createApiServiceMethod('/weather/data-quality', []),
};

/**
 * Recommendation API Adapter
 */
export const recommendationAdapter = {
  listRecommendations: (farmId) => createApiServiceMethod('/recommendations', [], { queryParams: true })({ farmId }),
  getRecommendationById: (id) => createApiServiceMethod(`/recommendations/${id}`, null)(),
  createRecommendation: createMutationServiceMethod('/recommendations', { success: true }, { method: 'POST' }),
  updateRecommendation: (id, data) => createMutationServiceMethod(`/recommendations/${id}`, { success: true }, { method: 'PUT' })(data),
  updateRecommendationStatus: (id, status, notes) => createMutationServiceMethod(`/recommendations/${id}/status`, { success: true }, { method: 'PATCH' })({ status, notes }),
  getSuitabilityAnalysis: (fieldId, cropId) => createApiServiceMethod('/recommendations/suitability', {}, { queryParams: true })({ fieldId, cropId }),
};

/**
 * Yield Intelligence API Adapter
 */
export const yieldAdapter = {
  getEstimates: (params = {}) => createApiServiceMethod('/yield/estimates', [], { queryParams: true })(params),
  getEstimateById: (id) => createApiServiceMethod(`/yield/estimates/${id}`, null)(),
  generateEstimate: createMutationServiceMethod('/yield/estimates/generate', { success: true }, { method: 'POST' }),
};

/**
 * Field Operations API Adapter
 */
export const fieldOperationAdapter = {
  // Farmers
  listAssignedFarmers: (params = {}) => createApiServiceMethod('/farmers', [], { queryParams: true })(params),
  getFarmerById: (id) => createApiServiceMethod(`/farmers/${id}`, null)(),

  // Visits
  listVisits: (params = {}) => createApiServiceMethod('/visits', [], { queryParams: true })(params),
  getVisitById: (id) => createApiServiceMethod(`/visits/${id}`, null)(),
  createVisit: createMutationServiceMethod('/visits', { success: true }, { method: 'POST' }),
  updateVisit: (id, data) => createMutationServiceMethod(`/visits/${id}`, { success: true }, { method: 'PUT' })(data),

  // Follow-ups
  getFollowUps: (params = {}) => createApiServiceMethod('/follow-ups', [], { queryParams: true })(params),
  createFollowUp: createMutationServiceMethod('/follow-ups', { success: true }, { method: 'POST' }),
  updateFollowUp: (id, data) => createMutationServiceMethod(`/follow-ups/${id}`, { success: true }, { method: 'PUT' })(data),

  // Observations
  listObservations: (params = {}) => createApiServiceMethod('/observations', [], { queryParams: true })(params),
  getObservationById: (id) => createApiServiceMethod(`/observations/${id}`, null)(),
  createObservation: createMutationServiceMethod('/observations', { success: true }, { method: 'POST' }),
  updateObservation: (id, data) => createMutationServiceMethod(`/observations/${id}`, { success: true }, { method: 'PUT' })(data),

  // Inspections
  listInspections: (params = {}) => createApiServiceMethod('/inspections', [], { queryParams: true })(params),
  getInspectionById: (id) => createApiServiceMethod(`/inspections/${id}`, null)(),
  createInspection: createMutationServiceMethod('/inspections', { success: true }, { method: 'POST' }),
  updateInspection: (id, data) => createMutationServiceMethod(`/inspections/${id}`, { success: true }, { method: 'PUT' })(data),

  // Tasks
  listTasks: (params = {}) => createApiServiceMethod('/tasks', [], { queryParams: true })(params),
  getTaskById: (id) => createApiServiceMethod(`/tasks/${id}`, null)(),
  createTask: createMutationServiceMethod('/tasks', { success: true }, { method: 'POST' }),
  updateTask: (id, data) => createMutationServiceMethod(`/tasks/${id}`, { success: true }, { method: 'PUT' })(data),
  updateTaskStatus: (id, status) => createMutationServiceMethod(`/tasks/${id}/status`, { success: true }, { method: 'PATCH' })({ status }),
};

/**
 * Reports API Adapter
 */
export const reportAdapter = {
  getReportTypes: createApiServiceMethod('/reports/types', []),
  listReports: (params = {}) => createApiServiceMethod('/reports', [], { queryParams: true })(params),
  getReportById: (id) => createApiServiceMethod(`/reports/${id}`, null)(),
  generateReport: createMutationServiceMethod('/reports/generate', { success: true }, { method: 'POST' }),
  downloadReport: (id, format = 'pdf') => createApiServiceMethod(`/reports/${id}/download?format=${format}`, null)(),
};

/**
 * Notification API Adapter
 */
export const notificationAdapter = {
  listNotifications: (params = {}) => createApiServiceMethod('/notifications', [], { queryParams: true })(params),
  getUnreadCount: createApiServiceMethod('/notifications/unread-count', 0),
  markAsRead: (id) => createMutationServiceMethod(`/notifications/${id}/read`, { success: true }, { method: 'PATCH' })(),
  markAllAsRead: createMutationServiceMethod('/notifications/read-all', { success: true }, { method: 'POST' }),
  getPreferences: createApiServiceMethod('/notifications/preferences', {}),
  savePreferences: (prefs) => createMutationServiceMethod('/notifications/preferences', { success: true }, { method: 'PUT' })(prefs),
};

/**
 * Auth API Adapter
 */
export const authAdapter = {
  login: (credentials) => createMutationServiceMethod('/auth/login', null, { method: 'POST' })(credentials),
  logout: createMutationServiceMethod('/auth/logout', { success: true }, { method: 'POST' }),
  getCurrentUser: createApiServiceMethod('/auth/me', null),
  updateProfile: (data) => createMutationServiceMethod('/auth/profile', { success: true }, { method: 'PUT' })(data),
  forgotPassword: (email) => createMutationServiceMethod('/auth/forgot-password', { success: true }, { method: 'POST' })({ email }),
  resetPassword: (data) => createMutationServiceMethod('/auth/reset-password', { success: true }, { method: 'POST' })(data),
  registerFarmer: (data) => createMutationServiceMethod('/auth/register/farmer', { success: true }, { method: 'POST' })(data),
};

/**
 * Admin API Adapter
 */
export const adminAdapter = {
  listUsers: (params = {}) => createApiServiceMethod('/users', [], { queryParams: true })(params),
  getUserById: (id) => createApiServiceMethod(`/users/${id}`, null)(),
  createUser: createMutationServiceMethod('/users', { success: true }, { method: 'POST' }),
  updateUser: (id, data) => createMutationServiceMethod(`/users/${id}`, { success: true }, { method: 'PUT' })(data),
  updateUserStatus: (id, isActive) => createMutationServiceMethod(`/users/${id}/status`, { success: true }, { method: 'PATCH' })({ isActive }),
  deleteUser: (id) => createMutationServiceMethod(`/users/${id}`, { success: true }, { method: 'DELETE' })(),

  getRoles: createApiServiceMethod('/roles', []),
  getPermissionMatrix: createApiServiceMethod('/permissions/matrix', {}),

  listAuditLogs: (params = {}) => createApiServiceMethod('/audit-logs', [], { queryParams: true })(params),
  getSystemHealth: createApiServiceMethod('/system/health', []),
  getWeatherConfiguration: createApiServiceMethod('/weather/configuration', {}),
  getPlatformSettings: createApiServiceMethod('/settings/platform', {}),
  updatePlatformSettings: (data) => createMutationServiceMethod('/settings/platform', { success: true }, { method: 'PUT' })(data),
};

/**
 * Combined adapter export for easy importing
 */
export const apiAdapter = {
  farm: farmAdapter,
  crop: cropAdapter,
  weather: weatherAdapter,
  recommendation: recommendationAdapter,
  yield: yieldAdapter,
  fieldOperation: fieldOperationAdapter,
  report: reportAdapter,
  notification: notificationAdapter,
  auth: authAdapter,
  admin: adminAdapter,
};

export default apiAdapter;