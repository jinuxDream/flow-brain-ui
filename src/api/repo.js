import request from '@/utils/request'

export default {
  list() {
    return request.get('/repo/list')
  },
  
  getById(id) {
    return request.get(`/repo/${id}`)
  },
  
  add(data) {
    return request.post('/repo/add', data)
  },
  
  update(data) {
    return request.post('/repo/update', data)
  },
  
  delete(id) {
    return request.post(`/repo/delete/${id}`)
  },
  
  updateStatus(id, status) {
    return request.post('/repo/updateStatus', null, { params: { id, status } })
  },
  
  scan(repoId) {
    return request.post('/repo/scan', null, { params: { repoId } })
  }
}
