import request from '@/utils/request'

export default {
  listApps(params) {
    return request.get('/datasource/app/list', { params })
  },
  
  listAllApps() {
    return request.get('/datasource/app/all')
  },
  
  getApp(id) {
    return request.get(`/datasource/app/detail/${id}`)
  },
  
  addApp(data) {
    return request.post('/datasource/app/add', data)
  },
  
  updateApp(data) {
    return request.post('/datasource/app/update', data)
  },
  
  deleteApp(id) {
    return request.post(`/datasource/app/delete/${id}`)
  },
  
  getTypes() {
    return request.get('/datasource/app/types')
  }
}
