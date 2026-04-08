import axiox from 'axios'
const backendUrl = (import.meta.env.VITE_API_URL);
const api = axiox.create({
    baseURL: backendUrl || "http://localhost:5000",
    withCredentials: true
})

export default api;