import axios from 'axios'
import { startRequestLoading, endRequestLoading } from '../context/LoadingContext'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const storage = {
  get(key) {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key, value) {
    try { localStorage.setItem(key, value) } catch { /* noop */ }
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch { /* noop */ }
  }
}

let logoutCallback = null

export const setLogoutCallback = (callback) => {
  logoutCallback = callback
}

export const setBaseURL = (url) => {
  apiClient.defaults.baseURL = url
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    startRequestLoading()
    const token = storage.get('authToken')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => {
    endRequestLoading()
    return response
  },
  (error) => {
    endRequestLoading()
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to server.'))
    }

    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      storage.remove('authToken')
      storage.remove('user')

      if (logoutCallback) {
        logoutCallback()
      } else if (window.location.protocol === 'file:') {
        window.location.hash = '#/login'
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

const data = (promise) => promise.then((r) => r.data)

// Auth APIs (return full response for AuthContext compatibility)
export const authAPI = {
  login: (username, password) => apiClient.post('/api/auth/login/', { username, password }),
  logout: () => {
    storage.remove('authToken')
    storage.remove('user')
  },
  getProfile: () => apiClient.get('/api/auth/profile/'),
  updateProfile: (data) => apiClient.patch('/api/auth/update_profile/', data),
  changePassword: (data) => apiClient.post('/api/auth/change-password/', data),
}

// Student APIs
export const studentsAPI = {
  getAll: (params) => data(apiClient.get('/api/students/', { params })),
  getById: (id) => data(apiClient.get(`/api/students/${id}/`)),
  create: (d) => data(apiClient.post('/api/students/', d)),
  update: (id, d) => data(apiClient.put(`/api/students/${id}/`, d)),
  patch: (id, d) => data(apiClient.patch(`/api/students/${id}/`, d)),
  delete: (id) => data(apiClient.delete(`/api/students/${id}/`)),
  getStats: () => data(apiClient.get('/api/students/statistics/')),
  search: (query) => data(apiClient.get('/api/students/search/', { params: { q: query } })),
  promotionPreview: (type = 'all') => data(apiClient.get(`/api/students/promotion_preview/?type=${type}`)),
  promoteStudents: (type = 'all') => data(apiClient.post('/api/students/promote_students/', { type })),
  uploadDocument: (studentId, formData) =>
    data(apiClient.post(`/api/students/${studentId}/upload_document/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })),
  getDocuments: (studentId) => data(apiClient.get(`/api/students/${studentId}/documents/`)),
  bulkUpload: (formData) => data(apiClient.post('/api/students/bulk_upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })),
}

// Dropout API
export const dropoutAPI = {
  create: (d) => data(apiClient.post('/api/dropouts/', d)),
  getAll: () => data(apiClient.get('/api/dropouts/')),
  getById: (id) => data(apiClient.get(`/api/dropouts/${id}/`)),
  reinstate: (id) => data(apiClient.post(`/api/dropouts/${id}/reinstate/`)),
  delete: (id) => data(apiClient.delete(`/api/dropouts/${id}/`)),
}

// Academic APIs
export const academicAPI = {
  getSections: () => data(apiClient.get('/api/sections/')),
  createSection: (d) => data(apiClient.post('/api/sections/', d)),
  updateSection: (id, d) => data(apiClient.put(`/api/sections/${id}/`, d)),
  deleteSection: (id) => data(apiClient.delete(`/api/sections/${id}/`)),

  getTracks: (params) => data(apiClient.get('/api/tracks/', { params })),
  getTrackById: (id) => data(apiClient.get(`/api/tracks/${id}/`)),
  createTrack: (d) => data(apiClient.post('/api/tracks/', d)),
  updateTrack: (id, d) => data(apiClient.put(`/api/tracks/${id}/`, d)),
  deleteTrack: (id) => data(apiClient.delete(`/api/tracks/${id}/`)),
  getActiveTracks: () => data(apiClient.get('/api/tracks/active/')),
  getTracksByLevel: (level) => data(apiClient.get('/api/tracks/by_level/', { params: { level } })),

  getStrands: (params) => data(apiClient.get('/api/strands/', { params })),
  getStrandById: (id) => data(apiClient.get(`/api/strands/${id}/`)),
  createStrand: (d) => data(apiClient.post('/api/strands/', d)),
  updateStrand: (id, d) => data(apiClient.put(`/api/strands/${id}/`, d)),
  deleteStrand: (id) => data(apiClient.delete(`/api/strands/${id}/`)),
  getActiveStrands: () => data(apiClient.get('/api/strands/active/')),
  getStrandsByTrack: (trackId) => data(apiClient.get('/api/strands/by_track/', { params: { track_id: trackId } })),
  getStrandsByLevel: (level) => data(apiClient.get('/api/strands/by_level/', { params: { level } })),
  searchStrands: (query) => data(apiClient.get('/api/strands/search/', { params: { q: query } })),

  getCourses: (params) => data(apiClient.get('/api/courses/', { params })),
  getCourseById: (id) => data(apiClient.get(`/api/courses/${id}/`)),
  createCourse: (d) => data(apiClient.post('/api/courses/', d)),
  updateCourse: (id, d) => data(apiClient.put(`/api/courses/${id}/`, d)),
  deleteCourse: (id) => data(apiClient.delete(`/api/courses/${id}/`)),
  getActiveCourses: () => data(apiClient.get('/api/courses/active/')),
  getCoursesByLevel: (level) => data(apiClient.get('/api/courses/by_level/', { params: { level } })),
  searchCourses: (query) => data(apiClient.get('/api/courses/search/', { params: { q: query } })),

  getAssessmentTypes: () => data(apiClient.get('/api/assessment-types/')),
  getAssessmentTypesByLevel: (level) => data(apiClient.get('/api/assessment-types/by_level/', { params: { level } })),
  createAssessmentType: (d) => data(apiClient.post('/api/assessment-types/', d)),
  updateAssessmentType: (id, d) => data(apiClient.put(`/api/assessment-types/${id}/`, d)),
  deleteAssessmentType: (id) => data(apiClient.delete(`/api/assessment-types/${id}/`)),

  getAssessments: () => data(apiClient.get('/api/assessments/')),
  getAssessment: (id) => data(apiClient.get(`/api/assessments/${id}/`)),
  createTemplateAssessment: (d) => data(apiClient.post('/api/assessments/', d)),
  updateAssessmentTemplate: (id, d) => data(apiClient.patch(`/api/assessments/${id}/`, d)),
  deleteAssessment: (id) => data(apiClient.delete(`/api/assessments/${id}/`)),

  getAssessmentScores: (assessmentId) => data(apiClient.get(`/api/assessments/${assessmentId}/scores/`)),
}

// Student Assessments
export const assessmentAPI = {
  getStudentAssessments: (params) => data(apiClient.get('/api/student-assessments/', { params })),
  getByStudent: (studentId) => data(apiClient.get('/api/student-assessments/by_student/', { params: { student_id: studentId } })),
  getPending: () => data(apiClient.get('/api/student-assessments/pending/')),
  assignAssessment: (d) => data(apiClient.post('/api/student-assessments/', d)),
  updateAssessment: (id, d) => data(apiClient.put(`/api/student-assessments/${id}/`, d)),
  deleteAssessment: (id) => data(apiClient.delete(`/api/student-assessments/${id}/`)),
  bulkEnroll: (d) => data(apiClient.post('/api/student-assessments/bulk_enroll/', d)),
  getPayments: (params) => data(apiClient.get('/api/assessment-payments/', { params })),
  getPaymentsByStudent: (studentId) => data(apiClient.get('/api/assessment-payments/by_student/', { params: { student_id: studentId } })),
  createPayment: (d) => data(apiClient.post('/api/assessment-payments/', d)),
  createAssessmentScore: (d) => data(apiClient.post('/api/student-assessments/', d)),
  getPaymentStatistics: (params) => data(apiClient.get('/api/assessment-payments/statistics/', { params })),
}

// Finance APIs
export const financeAPI = {
  getPayments: (params) => data(apiClient.get('/api/payments/', { params })),
  createPayment: (d) => data(apiClient.post('/api/payments/', d)),
  getPaymentById: (id) => data(apiClient.get(`/api/payments/${id}/`)),
  confirmPayment: (id) => data(apiClient.patch(`/api/payments/${id}/`, { status: 'confirmed' })),
  getPending: () => data(apiClient.get('/api/payments/?status=pending')),

  getTuition: (params) => data(apiClient.get('/api/tuition-payments/', { params })),
  getTuitionRecords: () => data(apiClient.get('/api/tuition-payments/records/')),
  getTuitionByStudent: (studentId) => data(apiClient.get(`/api/tuition-payments/by_student/?student_id=${studentId}`)),
  createTuition: (d) => data(apiClient.post('/api/tuition-payments/', d)),
  updateTuition: (id, d) => data(apiClient.put(`/api/tuition-payments/${id}/`, d)),
  deleteTuition: (id) => data(apiClient.delete(`/api/tuition-payments/${id}/`)),
  getTuitionStatistics: () => data(apiClient.get('/api/tuition-payments/statistics/')),

  getRevenue: (params) => data(apiClient.get('/api/revenue/', { params })),
  getRevenueByRange: (start, end) => data(apiClient.get(`/api/revenue/?start=${start}&end=${end}`)),
  getRevenueReport: (params) => data(apiClient.get('/api/revenue/report/', { params })),

  getSales: (params) => data(apiClient.get('/api/sales/', { params })),
  getSaleById: (id) => data(apiClient.get(`/api/sales/${id}/`)),
  createSale: (d) => data(apiClient.post('/api/sales/', d)),
  getPendingSales: () => data(apiClient.get('/api/sales/pending/')),
  addSalePayment: (id, d) => data(apiClient.post(`/api/sales/${id}/add_payment/`, d)),
  getSalesStatistics: () => data(apiClient.get('/api/sales/statistics/')),

  getProducts: (params) => data(apiClient.get('/api/products/', { params })),
  getProductById: (id) => data(apiClient.get(`/api/products/${id}/`)),
  createProduct: (d) => data(apiClient.post('/api/products/', d)),
  updateProduct: (id, d) => data(apiClient.put(`/api/products/${id}/`, d)),
  deleteProduct: (id) => data(apiClient.delete(`/api/products/${id}/`)),
}

// Tuition API (dedicated)
export const tuitionAPI = {
  getPayments: (params) => data(apiClient.get('/api/tuition-payments/', { params })),
  createPayment: (d) => data(apiClient.post('/api/tuition-payments/', d)),
  getByStudent: (studentId) => data(apiClient.get('/api/tuition-payments/by_student/', { params: { student_id: studentId } })),
  getStatistics: () => data(apiClient.get('/api/tuition-payments/statistics/')),
}

// Facilities APIs
export const facilitiesAPI = {
  getBuildings: () => data(apiClient.get('/api/dorm/buildings/')),
  createBuilding: (d) => data(apiClient.post('/api/dorm/buildings/', d)),
  updateBuilding: (id, d) => data(apiClient.patch(`/api/dorm/buildings/${id}/`, d)),
  deleteBuilding: (id) => data(apiClient.delete(`/api/dorm/buildings/${id}/`)),

  getRooms: (params) => data(apiClient.get('/api/dorm/rooms/', { params })),
  createRoom: (d) => data(apiClient.post('/api/dorm/rooms/', d)),
  updateRoom: (id, d) => data(apiClient.patch(`/api/dorm/rooms/${id}/`, d)),
  deleteRoom: (id) => data(apiClient.delete(`/api/dorm/rooms/${id}/`)),
  getAvailableRooms: () => data(apiClient.get('/api/dorm/rooms/available/')),

  getAssignments: (params) => data(apiClient.get('/api/dorm/assignments/', { params })),
  assignRoom: (d) => data(apiClient.post('/api/dorm/assignments/', d)),
  unassignRoom: (id) => data(apiClient.delete(`/api/dorm/assignments/${id}/`)),
  createAssignment: (d) => data(apiClient.post('/api/dorm/assignments/', d)),

  getPayments: (params) => data(apiClient.get('/api/dorm/payments/', { params })),
  createPayment: (d) => data(apiClient.post('/api/dorm/payments/', d)),
  getPaymentStatistics: () => data(apiClient.get('/api/dorm/payments/statistics/')),
}

// Activities APIs
export const activitiesAPI = {
  getTours: (params) => data(apiClient.get('/api/tours/', { params })),
  getTourById: (id) => data(apiClient.get(`/api/tours/${id}/`)),
  createTour: (d) => data(apiClient.post('/api/tours/', d)),
  updateTour: (id, d) => data(apiClient.patch(`/api/tours/${id}/`, d)),
  deleteTour: (id) => data(apiClient.delete(`/api/tours/${id}/`)),
  getUpcomingTours: () => data(apiClient.get('/api/tours/upcoming/')),
  getTourStatistics: () => data(apiClient.get('/api/tours/statistics/')),

  getTourEnrollments: (tourId) => data(apiClient.get(`/api/tour-enrollments/?tour=${tourId}`)),
  getTourEnrollmentsByStudent: (studentId) => data(apiClient.get('/api/tour-enrollments/by_student/', { params: { student_id: studentId } })),
  getTourEnrollmentsByTour: (tourId) => data(apiClient.get('/api/tour-enrollments/by_tour/', { params: { tour_id: tourId } })),
  getPendingTourEnrollments: () => data(apiClient.get('/api/tour-enrollments/pending/')),
  enrollTourSection: (tourId, sectionId) => data(apiClient.post('/api/tour-enrollments/', { tour: tourId, section: sectionId })),
  enrollStudentInTour: (d) => data(apiClient.post('/api/tour-enrollments/', d)),
  updateTourEnrollment: (id, d) => data(apiClient.put(`/api/tour-enrollments/${id}/`, d)),
  removeTourEnrollment: (enrollmentId) => data(apiClient.delete(`/api/tour-enrollments/${enrollmentId}/`)),
  bulkEnrollTour: (d) => data(apiClient.post('/api/tour-enrollments/bulk_enroll/', d)),

  getTourPayments: (params) => data(apiClient.get('/api/tour-payments/', { params })),
  createTourPayment: (d) => data(apiClient.post('/api/tour-payments/', d)),
  getTourPaymentStatus: (enrollmentId) => data(apiClient.get(`/api/tour-payments/?tour_enrollment=${enrollmentId}`)),
  getTourPaymentStatistics: (params) => data(apiClient.get('/api/tour-payments/statistics/', { params })),

  getGraduationEvents: () => data(apiClient.get('/api/graduation-events/')),
  getGraduationEventById: (id) => data(apiClient.get(`/api/graduation-events/${id}/`)),
  createGraduation: (d) => data(apiClient.post('/api/graduation-events/', d)),
  updateGraduation: (id, d) => data(apiClient.put(`/api/graduation-events/${id}/`, d)),
  deleteGraduation: (id) => data(apiClient.delete(`/api/graduation-events/${id}/`)),

  getGraduationEnrollments: (params) => data(apiClient.get('/api/graduation-enrollments/', { params })),
  getGraduationEnrollmentsByEvent: (eventId) => data(apiClient.get(`/api/graduation-enrollments/?event=${eventId}`)),
  enrollGraduation: (d) => data(apiClient.post('/api/graduation-enrollments/', d)),
  bulkEnrollGraduation: (d) => data(apiClient.post('/api/graduation-enrollments/bulk_enroll/', d)),
  deleteGraduationEnrollment: (id) => data(apiClient.delete(`/api/graduation-enrollments/${id}/`)),

  getGraduationPayments: () => data(apiClient.get('/api/graduation-payments/')),
  createGraduationPayment: (d) => data(apiClient.post('/api/graduation-payments/', d)),
  deleteGraduationPayment: (id) => data(apiClient.delete(`/api/graduation-payments/${id}/`)),
}

// Config APIs
export const configAPI = {
  getConfig: () => data(apiClient.get('/api/school-config/current/')),
  updateConfig: (d) => data(apiClient.patch('/api/school-config/current/', d, {
    headers: d instanceof FormData
      ? { 'Content-Type': undefined }
      : { 'Content-Type': 'application/json' }
  })),
}

// Revenue API (dedicated)
export const revenueAPI = {
  getDashboard: (params) => data(apiClient.get('/api/revenue/', { params })),
  getReport: (params) => data(apiClient.get('/api/revenue/report/', { params })),
}

// Track API (dedicated)
export const trackAPI = {
  getAll: (params) => data(apiClient.get('/api/tracks/', { params })),
  getById: (id) => data(apiClient.get(`/api/tracks/${id}/`)),
  create: (d) => data(apiClient.post('/api/tracks/', d)),
  update: (id, d) => data(apiClient.put(`/api/tracks/${id}/`, d)),
  delete: (id) => data(apiClient.delete(`/api/tracks/${id}/`)),
  getActive: () => data(apiClient.get('/api/tracks/active/')),
  getByLevel: (level) => data(apiClient.get('/api/tracks/by_level/', { params: { level } })),
  getStrands: (trackId) => data(apiClient.get(`/api/tracks/${trackId}/strands/`)),

  getAllStrands: (params) => data(apiClient.get('/api/strands/', { params })),
  getStrandById: (id) => data(apiClient.get(`/api/strands/${id}/`)),
  createStrand: (d) => data(apiClient.post('/api/strands/', d)),
  updateStrand: (id, d) => data(apiClient.put(`/api/strands/${id}/`, d)),
  deleteStrand: (id) => data(apiClient.delete(`/api/strands/${id}/`)),
  getActiveStrands: () => data(apiClient.get('/api/strands/active/')),
  getStrandsByTrack: (trackId) => data(apiClient.get('/api/strands/by_track/', { params: { track_id: trackId } })),
  getStrandsByLevel: (level) => data(apiClient.get('/api/strands/by_level/', { params: { level } })),
  searchStrands: (query) => data(apiClient.get('/api/strands/search/', { params: { q: query } })),
  getStrandOptions: (level) => data(apiClient.get('/api/strands/all_options/', { params: level ? { level } : {} })),
}

// Course API (dedicated)
export const courseAPI = {
  getAll: (params) => data(apiClient.get('/api/courses/', { params })),
  getById: (id) => data(apiClient.get(`/api/courses/${id}/`)),
  create: (d) => data(apiClient.post('/api/courses/', d)),
  update: (id, d) => data(apiClient.put(`/api/courses/${id}/`, d)),
  delete: (id) => data(apiClient.delete(`/api/courses/${id}/`)),
  getActive: () => data(apiClient.get('/api/courses/active/')),
  getByLevel: (level) => data(apiClient.get('/api/courses/by_level/', { params: { level } })),
  search: (query) => data(apiClient.get('/api/courses/search/', { params: { q: query } })),
  getOptions: (level) => data(apiClient.get('/api/courses/all_options/', { params: level ? { level } : {} })),
}

// Tour API (dedicated)
export const tourAPI = {
  getAll: (params) => data(apiClient.get('/api/tours/', { params })),
  getById: (id) => data(apiClient.get(`/api/tours/${id}/`)),
  getUpcoming: () => data(apiClient.get('/api/tours/upcoming/')),
  getStatistics: () => data(apiClient.get('/api/tours/statistics/')),
  create: (d) => data(apiClient.post('/api/tours/', d)),
  update: (id, d) => data(apiClient.put(`/api/tours/${id}/`, d)),
  delete: (id) => data(apiClient.delete(`/api/tours/${id}/`)),
  getEnrollments: (tourId) => data(apiClient.get(`/api/tours/${tourId}/enrollments/`)),

  getEnrollmentsByStudent: (studentId) => data(apiClient.get('/api/tour-enrollments/by_student/', { params: { student_id: studentId } })),
  getEnrollmentsByTour: (tourId) => data(apiClient.get('/api/tour-enrollments/by_tour/', { params: { tour_id: tourId } })),
  getPending: () => data(apiClient.get('/api/tour-enrollments/pending/')),
  enrollStudent: (d) => data(apiClient.post('/api/tour-enrollments/', d)),
  updateEnrollment: (id, d) => data(apiClient.put(`/api/tour-enrollments/${id}/`, d)),
  deleteEnrollment: (id) => data(apiClient.delete(`/api/tour-enrollments/${id}/`)),
  bulkEnroll: (d) => data(apiClient.post('/api/tour-enrollments/bulk_enroll/', d)),

  getPayments: (params) => data(apiClient.get('/api/tour-payments/', { params })),
  getPaymentsByStudent: (studentId) => data(apiClient.get('/api/tour-payments/by_student/', { params: { student_id: studentId } })),
  getPaymentsByTour: (tourId) => data(apiClient.get('/api/tour-payments/by_tour/', { params: { tour_id: tourId } })),
  createPayment: (d) => data(apiClient.post('/api/tour-payments/', d)),
  getPaymentStatistics: (params) => data(apiClient.get('/api/tour-payments/statistics/', { params })),
}

// Product API (dedicated)
export const productAPI = {
  getAll: (params) => data(apiClient.get('/api/products/', { params })),
  getById: (id) => data(apiClient.get(`/api/products/${id}/`)),
  create: (d) => data(apiClient.post('/api/products/', d)),
  update: (id, d) => data(apiClient.put(`/api/products/${id}/`, d)),
  delete: (id) => data(apiClient.delete(`/api/products/${id}/`)),
}

// Sales API (dedicated)
export const salesAPI = {
  getAll: (params) => data(apiClient.get('/api/sales/', { params })),
  getById: (id) => data(apiClient.get(`/api/sales/${id}/`)),
  create: (d) => data(apiClient.post('/api/sales/', d)),
  getPending: () => data(apiClient.get('/api/sales/pending/')),
  addPayment: (id, d) => data(apiClient.post(`/api/sales/${id}/add_payment/`, d)),
  getStatistics: () => data(apiClient.get('/api/sales/statistics/')),
}

// Graduation API (dedicated)
export const graduationAPI = {
  getAll: () => data(apiClient.get('/api/graduation-events/')),
  getById: (id) => data(apiClient.get(`/api/graduation-events/${id}/`)),
  create: (d) => data(apiClient.post('/api/graduation-events/', d)),
  update: (id, d) => data(apiClient.put(`/api/graduation-events/${id}/`, d)),
  delete: (id) => data(apiClient.delete(`/api/graduation-events/${id}/`)),
}

// Dorm API (dedicated)
export const dormAPI = {
  getBuildings: (params) => data(apiClient.get('/api/dorm/buildings/', { params })),
  getRooms: (params) => data(apiClient.get('/api/dorm/rooms/', { params })),
  getAvailableRooms: () => data(apiClient.get('/api/dorm/rooms/available/')),
  getAssignments: (params) => data(apiClient.get('/api/dorm/assignments/', { params })),
  createAssignment: (d) => data(apiClient.post('/api/dorm/assignments/', d)),
  getPayments: (params) => data(apiClient.get('/api/dorm/payments/', { params })),
  createPayment: (d) => data(apiClient.post('/api/dorm/payments/', d)),
  getPaymentStatistics: () => data(apiClient.get('/api/dorm/payments/statistics/')),
}

export default apiClient
