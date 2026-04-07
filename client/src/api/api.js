import axiox from 'axios'
const backendUrl = (import.meta.env.VITE_API_URL);
const api = axiox.create({
    baseURL: backendUrl,
    withCredentials: true
})

export default api;