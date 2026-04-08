import request from '@/utils/request'

export default {
  listApis(params) {
    return request.get('/datasource/api/list', { params })
  },
  
  getApi(id) {
    return request.get(`/datasource/api/detail/${id}`)
  },
  
  addApi(data) {
    return request.post('/datasource/api/add', data)
  },
  
  updateApi(data) {
    return request.post('/datasource/api/update', data)
  },
  
  deleteApi(id) {
    return request.post(`/datasource/api/delete/${id}`)
  },
  
  getAppNames() {
    return request.get('/datasource/api/appNames')
  },
  
  getGroups(appName) {
    return request.get('/datasource/api/groups', { params: { appName } })
  },
  
  getMethods() {
    return request.get('/datasource/api/methods')
  },
  
  importFromOpenApi(appName, content) {
    return request.post('/datasource/api/import/openapi', content, {
      params: { appName },
      headers: { 'Content-Type': 'text/plain' }
    })
  },
  
  importFromOpenApiUrl(appName, url) {
    return request.post('/datasource/api/import/openapi-url', null, {
      params: { appName, openApiUrl: url }
    })
  },
  
  importFromPostman(appName, content) {
    return request.post('/datasource/api/import/postman', content, {
      params: { appName },
      headers: { 'Content-Type': 'application/json' }
    })
  },
  
  importByAi(appName, content) {
    return request.post('/datasource/api/import/ai', content, {
      params: { appName },
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
