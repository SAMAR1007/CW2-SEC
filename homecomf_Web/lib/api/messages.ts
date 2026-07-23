import axios from './axios'

export const listConversations = async (mode: 'travelling' | 'host') => {
  const response = await axios.get('/api/messages/conversations', { params: { mode } })
  return response.data?.data || []
}

export const getThreadMessages = async (params: {
  counterpartId: string
  accommodationId?: string
  experienceId?: string
}) => {
  const response = await axios.get('/api/messages/thread', { params })
  return response.data?.data || []
}

export const sendMessage = async (payload: {
  recipientId: string
  text: string
  accommodationId?: string
  experienceId?: string
}) => {
  const response = await axios.post('/api/messages', payload)
  return response.data?.data
}
