import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const predictUrl = (url) => api.post('/predict', { url })
export const getHistory  = ()    => api.get('/history')
export const deleteOne   = (id)  => api.delete(`/history/${id}`)
export const clearAll    = ()    => api.delete('/history')
export const getModelInfo = ()   => api.get('/model-info')

export default api
