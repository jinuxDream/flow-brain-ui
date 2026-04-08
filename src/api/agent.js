import request from '@/utils/request'

export default {
  chat(data) {
    return request.post('/agent/chat', data)
  },
  
  chatStream(sessionId, message, onMessage, onDone, onError) {
    const url = `/flow-brain/agent/chat/stream?sessionId=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(message)}`
    const eventSource = new EventSource(url)
    
    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close()
        if (onDone) onDone()
      } else {
        if (onMessage) onMessage(event.data)
      }
    }
    
    eventSource.onerror = (error) => {
      eventSource.close()
      if (onError) onError(error)
    }
    
    return eventSource
  },
  
  shareConversation(sessionId) {
    return request.post(`/agent/conversation/share/${sessionId}`)
  },
  
  getSharedConversation(shareCode) {
    return request.get(`/agent/conversation/share/${shareCode}`)
  }
}
