import request from '@/utils/request'

export default {
  listDomains() {
    return request.get('/knowledge/domain/list')
  },
  
  getDomain(domainCode) {
    return request.get(`/knowledge/domain/${domainCode}`)
  },
  
  listFlows(domainCode) {
    return request.get('/knowledge/flow/list', { params: { domainCode } })
  },
  
  getFlow(flowId) {
    return request.get(`/knowledge/flow/${flowId}`)
  },
  
  listNodes(flowId) {
    return request.get('/knowledge/node/list', { params: { flowId } })
  },
  
  getNode(nodeId) {
    return request.get(`/knowledge/node/${nodeId}`)
  },
  
  search(keyword, type) {
    return request.get('/knowledge/search', { params: { keyword, type } })
  }
}
