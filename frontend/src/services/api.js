import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const changeEmail = (newEmail, currentPassword) => api.post('/auth/profile/change-email', { newEmail, currentPassword });
export const requestPasswordOTP = () => api.post('/auth/profile/request-password-otp');
export const changePassword = (otp, newPassword) => api.post('/auth/profile/change-password', { otp, newPassword });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword });

// Projects
export const getProjects = (params) => api.get('/api/projects', { params });
export const getProject = (id) => api.get(`/api/projects/${id}`);
export const createProject = (formData) => api.post('/api/projects/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateProject = (id, formData) => api.put(`/api/projects/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteProject = (id) => api.delete(`/api/projects/admin/${id}`);

// Content CRUD
const contentApi = (entity) => ({
  getAll: () => api.get(`/api/${entity}`),
  getOne: (id) => api.get(`/api/${entity}/${id}`),
  create: (data) => api.post(`/api/admin/${entity}`, data),
  update: (id, data) => api.put(`/api/admin/${entity}/${id}`, data),
  remove: (id) => api.delete(`/api/admin/${entity}/${id}`)
});

export const aboutApi = contentApi('about');
export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append('profileImage', file);
  return api.post('/api/admin/about/upload-profile', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  });
};
export const skillsApi = contentApi('skills');
export const experiencesApi = contentApi('experiences');
export const educationApi = contentApi('education');
export const certificatesApi = contentApi('certificates');
export const testimonialsApi = contentApi('testimonials');
export const achievementsApi = contentApi('achievements');

// Chatbot
export const sendChatMessage = (query, sessionId) => api.post('/api/chatbot', { query, sessionId });

// Analytics
export const trackEvent = (data) => api.post('/api/analytics/track', data);
export const getAnalyticsSummary = () => api.get('/api/analytics/admin/summary');

// Resume
export const generateResume = (data) => api.post('/api/resume/admin/generate', data);
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/api/resume/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getCurrentResume = () => api.get('/api/resume/admin/current');
export const downloadAdminResume = () => api.get('/api/resume/admin/download', { responseType: 'blob' });
export const deleteResume = () => api.delete('/api/resume/admin');
export const getResumeRoles = () => api.get('/api/resume/roles');
export const generateRoleResume = (role, customRole) => api.post('/api/resume/generate', { role, customRole }, { responseType: 'blob' });

// Contact
export const submitContact = (data) => api.post('/api/contact', data);
export const getContacts = () => api.get('/api/contact/admin');

// LinkedIn Integration
export const getLinkedInAuthUrl = () => api.get('/api/linkedin/auth');
export const syncLinkedInProfile = (code) => api.post('/api/linkedin/callback', { code });

export default api;
