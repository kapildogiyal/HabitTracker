import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const habitsAPI = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  log: (id, data = {}) => api.post(`/habits/${id}/log`, data),
};

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  toggle: (id) => api.patch(`/tasks/${id}/complete`),
  controlTimer: (id, action) => api.patch(`/tasks/${id}/timer`, { action }),
};

export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getHeatmap: (month) => api.get('/analytics/heatmap', { params: { month } }),
};

export const motivationAPI = {
  generate: () => api.get('/motivation/generate'),
};

export const moodAPI = {
  getToday: () => api.get('/mood/today'),
  save: (mood) => api.post('/mood', { mood }),
};

export const suggestionsAPI = {
  generate: () => api.get('/suggestions/generate'),
};

export const onboardingAPI = {
  getStatus: () => api.get('/onboarding/status'),
  submit: (data) => api.post('/onboarding/submit', data),
};

export const notificationAPI = {
  subscribe: (data) => api.post('/notifications/subscribe', data),
  unsubscribe: (data) => api.post('/notifications/unsubscribe', data),
};

export const friendsAPI = {
  search: (query) => api.get('/friends/search', { params: { query } }),
  list: () => api.get('/friends/list'),
  requests: () => api.get('/friends/requests'),
  request: (friendId) => api.post('/friends/request', { friendId }),
  accept: (requestId) => api.post('/friends/accept', { requestId }),
  reject: (requestId) => api.post('/friends/reject', { requestId }),
  remove: (friendId) => api.post('/friends/remove', { friendId }),
};

export const challengesAPI = {
  list: () => api.get('/challenges'),
  create: (data) => api.post('/challenges', data),
  invite: (challengeId, friendId) => api.post('/challenges/invite', { challengeId, friendId }),
  join: (challengeId) => api.post('/challenges/join', { challengeId }),
  updateProgress: (data) => api.post('/challenges/progress', data),
  leaderboard: (challengeId) => api.get(`/challenges/${challengeId}/leaderboard`),
};
