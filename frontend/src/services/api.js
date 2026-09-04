/**
 * api.js — one place that talks to the Flask backend.
 *
 * WHAT: An Axios instance with the backend address already filled in.
 * WHY:  If the backend URL ever changes, we edit this single file instead of
 *       every component. It also keeps the URL out of the UI code.
 * HOW:  Components import these functions, e.g. `getServices()`.
 *
 * withCredentials: true is required so the browser sends the session cookie
 * on every request (same as a logged-in user's "identity card").
 */

import axios from 'axios'

// The address comes from the .env file if there is one, otherwise localhost.
// Vite only exposes variables that start with VITE_ to the browser.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  withCredentials: true, // send session cookie with every request
})

// Attach Bearer token as header fallback for browsers/environments blocking session cookies
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('need_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

/** Services grouped into Home / Appliance / Other. */
export async function getServicesByCategory() {
  const response = await api.get('/services/categories')
  return response.data
}

/** A flat list of every service. */
export async function getServices() {
  const response = await api.get('/services')
  return response.data
}

/** Real counts shown on the landing page. */
export async function getStats() {
  const response = await api.get('/stats')
  return response.data
}

/** Search & filter verified cooperative workers. */
export async function getWorkers(params = {}) {
  const response = await api.get('/workers', { params })
  return response.data
}

/** Get verified workers available for a specific service ID. */
export async function getWorkersForService(serviceId) {
  const response = await api.get(`/services/${serviceId}/workers`)
  return response.data
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Register a new account. Returns the created user. */
export async function registerUser(data) {
  const response = await api.post('/auth/register', data)
  if (response.data?.token || response.data?.id) {
    const token = response.data.token || `user-${response.data.id}`
    localStorage.setItem('need_token', token)
    localStorage.setItem('need_user', JSON.stringify(response.data))
  }
  return response.data
}

/** Log in with email + password. Returns the user on success. */
export async function loginUser(email, password) {
  const response = await api.post('/auth/login', { email, password })
  if (response.data?.token || response.data?.id) {
    const token = response.data.token || `user-${response.data.id}`
    localStorage.setItem('need_token', token)
    localStorage.setItem('need_user', JSON.stringify(response.data))
  }
  return response.data
}

/** Return the currently logged-in user, or throw 401 if not logged in. */
export async function getMe() {
  const response = await api.get('/auth/me')
  return response.data
}

/** Clear the server-side session. */
export async function logoutUser() {
  try {
    const response = await api.post('/auth/logout')
    return response.data
  } finally {
    localStorage.removeItem('need_token')
    localStorage.removeItem('need_user')
  }
}

// ---------------------------------------------------------------------------
// Customer (Step 3)
// ---------------------------------------------------------------------------

/** Dashboard data: profile, booking stats, recent bookings, all services. */
export async function getCustomerDashboard() {
  const response = await api.get('/customer/dashboard')
  return response.data
}

// ---------------------------------------------------------------------------
// Bookings (Step 7)
// ---------------------------------------------------------------------------

/** Create a new service booking request. */
export async function createBooking(bookingData) {
  const response = await api.post('/bookings', bookingData)
  return response.data
}

/** Get booking details by ID. */
export async function getBooking(bookingId) {
  const response = await api.get(`/bookings/${bookingId}`)
  return response.data
}

/** Customer cancels a pending or accepted booking. */
export async function cancelBooking(bookingId) {
  const response = await api.post(`/bookings/${bookingId}/cancel`)
  return response.data
}

/** Worker lifecycle action: 'accept' | 'decline' | 'start' | 'complete'. */
export async function handleWorkerBookingAction(bookingId, action, completionNote = '') {
  const response = await api.post(`/bookings/${bookingId}/worker-action`, {
    action,
    completion_note: completionNote,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Payments & Invoices (Step 8)
// ---------------------------------------------------------------------------

/** Process simulated payment for a booking (UPI, Card, Cash). */
export async function checkoutPayment(paymentData) {
  const response = await api.post('/payments/checkout', paymentData)
  return response.data
}

/** Get itemized printable invoice by invoice ID. */
export async function getInvoice(invoiceId) {
  const response = await api.get(`/payments/invoices/${invoiceId}`)
  return response.data
}

/** Check booking payment status and invoice reference. */
export async function getBookingPayment(bookingId) {
  const response = await api.get(`/bookings/${bookingId}/payment`)
  return response.data
}

// ---------------------------------------------------------------------------
// Reviews & Ratings (Step 9)
// ---------------------------------------------------------------------------

/** Submit 1-5 star rating and comment for a completed booking. */
export async function submitReview(reviewData) {
  const response = await api.post('/reviews', reviewData)
  return response.data
}

/** Fetch public reviews for a worker profile. */
export async function getWorkerReviews(workerId) {
  const response = await api.get(`/workers/${workerId}/reviews`)
  return response.data
}

// ---------------------------------------------------------------------------
// Worker (Step 4)
// ---------------------------------------------------------------------------

/** Dashboard data: profile, wallet, stats, assigned bookings. */
export async function getWorkerDashboard() {
  const response = await api.get('/worker/dashboard')
  return response.data
}

/** Update worker availability status (online/offline). */
export async function updateWorkerAvailability(is_available) {
  const response = await api.post('/worker/availability', { is_available })
  return response.data
}

/** Worker: Submit verification document & trade details. */
export async function submitWorkerVerification(verificationData) {
  const response = await api.post('/worker/verification/submit', verificationData)
  return response.data
}

// ---------------------------------------------------------------------------
// Welfare Wallet (Step 10)
// ---------------------------------------------------------------------------

/** Worker: Fetch detailed welfare wallet balance, history, and requests. */
export async function getWorkerWelfare() {
  const response = await api.get('/worker/welfare')
  return response.data
}

/** Worker: Submit emergency welfare withdrawal request. */
export async function requestWelfareWithdrawal(amount, reason) {
  const response = await api.post('/worker/welfare/withdraw', { amount, reason })
  return response.data
}

/** Admin: Fetch all emergency welfare withdrawal requests. */
export async function getAdminWelfareRequests() {
  const response = await api.get('/admin/welfare/requests')
  return response.data
}

/** Admin: Approve or reject an emergency welfare withdrawal request. */
export async function handleWelfareRequestAction(requestId, status, adminNotes = '') {
  const response = await api.post(`/admin/welfare/requests/${requestId}/action`, {
    status,
    admin_notes: adminNotes,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Admin / Cooperative Federation (Step 5)
// ---------------------------------------------------------------------------

/** Complete admin overview: KPIs, worker directory, bookings, tickets. */
export async function getAdminDashboard() {
  const response = await api.get('/admin/dashboard')
  return response.data
}

/** Approve or reject a worker verification request with optional notes. */
export async function verifyWorker(workerId, status, verificationNotes = '') {
  const response = await api.post(`/admin/workers/${workerId}/verify`, {
    status,
    verification_notes: verificationNotes,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Help & Support (Step 12)
// ---------------------------------------------------------------------------

/** Fetch logged in user's support tickets. */
export async function getUserTickets() {
  const response = await api.get('/tickets')
  return response.data
}

/** Create a new support ticket. */
export async function createSupportTicket(ticketData) {
  const response = await api.post('/tickets', ticketData)
  return response.data
}

/** Update status of a support ticket (open, in_progress, resolved) with optional response. */
export async function updateTicketStatus(ticketId, status, adminResponse = '') {
  const response = await api.post(`/admin/tickets/${ticketId}/status`, {
    status,
    admin_response: adminResponse,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// AI Chatbot Assistant (Step 13 — NEED Mitra)
// ---------------------------------------------------------------------------

/** Send message to AI Chatbot Assistant (NEED Mitra). */
export async function sendChatMessage(message) {
  const response = await api.post('/chat', { message })
  return response.data
}

/** AI Demand Forecasting & Predictive Analytics. */
export async function getDemandForecasting() {
  const response = await api.get('/admin/forecasting')
  return response.data
}

// ---------------------------------------------------------------------------
// Labour Cooperatives & Societies Module
// ---------------------------------------------------------------------------

/** List all verified Labour Cooperatives. */
export async function getCooperatives() {
  const response = await api.get('/cooperatives')
  return response.data
}

/** Get detailed Cooperative profile and member workers. */
export async function getCooperativeDetail(coopId) {
  const response = await api.get(`/cooperatives/${coopId}`)
  return response.data
}

/** Register a new Labour Cooperative. */
export async function registerCooperative(data) {
  const response = await api.post('/cooperatives', data)
  return response.data
}

/** Get metrics and workers list for Cooperative Admin Dashboard. */
export async function getCooperativeDashboard() {
  const response = await api.get('/cooperative/dashboard')
  return response.data
}

/** Cooperative admin adds a worker partner. */
export async function cooperativeAddWorker(data) {
  const response = await api.post('/cooperative/workers', data)
  return response.data
}

/** Cooperative admin verifies worker skill/identity. */
export async function cooperativeVerifyWorker(workerId, status, notes = '') {
  const response = await api.post(`/cooperative/workers/${workerId}/verify`, {
    status,
    verification_notes: notes,
  })
  return response.data
}

/** Cooperative admin assigns worker to booking. */
export async function cooperativeAssignWorker(bookingId, workerId) {
  const response = await api.post(`/cooperative/bookings/${bookingId}/assign`, {
    worker_id: workerId,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Booking Lifecycle & Structured Status Progression
// ---------------------------------------------------------------------------

/** Update booking status through 8-stage lifecycle. */
export async function updateBookingStatus(bookingId, status, cancellationReason = '') {
  const response = await api.post(`/bookings/${bookingId}/status`, {
    status,
    cancellation_reason: cancellationReason,
  })
  return response.data
}

// ---------------------------------------------------------------------------
// Disputes Resolution System
// ---------------------------------------------------------------------------

/** Fetch disputes for user/cooperative/admin. */
export async function getDisputes() {
  const response = await api.get('/disputes')
  return response.data
}

/** Create a structured dispute against a booking. */
export async function createDispute(disputeData) {
  const response = await api.post('/disputes', disputeData)
  return response.data
}

/** Resolve a dispute. */
export async function resolveDispute(disputeId, status, notes = '') {
  const response = await api.post(`/disputes/${disputeId}/resolve`, {
    status,
    resolution_notes: notes,
  })
  return response.data
}

/** Submit worker rating for customer. */
export async function reviewCustomer(bookingId, rating, comment = '') {
  const response = await api.post('/reviews/customer', {
    booking_id: bookingId,
    rating,
    comment,
  })
  return response.data
}

export default api


