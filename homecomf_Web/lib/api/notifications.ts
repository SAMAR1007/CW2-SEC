import axios from './axios'
import { API } from './endpoints'

export const listNotifications = async (limit = 20, mode?: 'travelling' | 'host') => {
  const response = await axios.get(API.NOTIFICATIONS.LIST, {
    params: mode ? { limit, mode } : { limit },
  })
  return response.data?.data || { notifications: [], unreadCount: 0 }
}

export const markNotificationRead = async (id: string) => {
  const response = await axios.patch(API.NOTIFICATIONS.MARK_READ(id))
  return response.data?.data
}

export const markAllNotificationsRead = async () => {
  const response = await axios.patch(API.NOTIFICATIONS.MARK_ALL_READ)
  return response.data?.data
}
