import request from '@/utils/request'

export default {
  listConnections(params) {
    return request.get('/datasource/connection/list', { params })
  },
  
  getConnection(id) {
    return request.get(`/datasource/connection/detail/${id}`)
  },
  
  addConnection(data) {
    return request.post('/datasource/connection/add', data)
  },
  
  updateConnection(data) {
    return request.post('/datasource/connection/update', data)
  },
  
  deleteConnection(id) {
    return request.post(`/datasource/connection/delete/${id}`)
  },
  
  testConnection(id) {
    return request.post(`/datasource/connection/test/${id}`)
  },
  
  syncTableStructure(id) {
    return request.post(`/datasource/connection/sync/${id}`)
  },
  
  getTableList(id) {
    return request.get(`/datasource/connection/tables/${id}`)
  },
  
  getTableColumns(id, tableName) {
    return request.get(`/datasource/connection/columns/${id}/${tableName}`)
  },
  
  getDbTypes() {
    return request.get('/datasource/connection/dbTypes')
  }
}
