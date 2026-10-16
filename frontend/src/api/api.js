
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '')

const api = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const contentType = response.headers.get('content-type')
  const data = contentType?.includes('application/json')
    ? await response.json()
    : {}

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data
}

export const registerUser = userData =>
  api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  })

export const loginUser = credentials =>
  api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })

export const logoutUser = () =>
  api('/api/auth/logout', {
    method: 'POST'
  })

export const getCurrentUser = () =>
  api('/api/auth/me')

export const getDashboard = () =>
  api('/api/account/dashboard')

export const getTransactions = (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  })

  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type)
  }

  if (filters.startDate) {
    params.set('from', filters.startDate)
  }

  if (filters.endDate) {
    params.set('to', filters.endDate)
  }

  return api(`/api/transactions/?${params.toString()}`)
}

export const getTransactionById = transactionId =>
  api(`/api/transactions/${encodeURIComponent(transactionId)}`)

export const creditMoney = transactionData =>
  api('/api/transactions/credit', {
    method: 'POST',
    body: JSON.stringify(transactionData)
  })

export const debitMoney = transactionData =>
  api('/api/transactions/debit', {
    method: 'POST',
    body: JSON.stringify(transactionData)
  })

export const transferMoney = transactionData =>
  api('/api/transactions/transfer', {
    method: 'POST',
    body: JSON.stringify(transactionData)
  })

export default api
