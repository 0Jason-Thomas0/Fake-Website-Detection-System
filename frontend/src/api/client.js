import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const predictUrl = (url) => api.post('/predict', { url })
export const predictBatch = (urls) => api.post('/predict/batch', { urls })
export const compareModels = (url) => api.post('/compare', { url })
export const whatIfUrl = (url) => api.post('/whatif', { url })
export const getHistory  = (params) => api.get('/history', { params })
export const getScan     = (id) => api.get(`/history/${id}`)
export const getStats    = () => api.get('/stats')
export const deleteOne   = (id)  => api.delete(`/history/${id}`)
export const clearAll    = ()    => api.delete('/history')
export const getModelInfo = ()   => api.get('/model-info')

export default api
