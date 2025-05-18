import axios from 'axios'

const api = axios.create({
    baseURL: '/api',           // se proxya a localhost:8080/api
    headers: { 'Content-Type': 'multipart/form-data' }
})

export function importarDat(file) {
    const form = new FormData()
    form.append('file', file)
    return api.post('/importar', form)
}

export function getResumen(fecha) {
    return axios.get(`/api/asistencias/resumen?fecha=${fecha}`)
}
