import axios from './axios'

export const getWishlist = async (): Promise<string[]> => {
  try {
    const response = await axios.get('/api/wishlist')
    return Array.isArray(response.data?.data) ? response.data.data : []
  } catch {
    // Fallback to localStorage when not authenticated
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('homecomf:wishlist')
      return raw ? JSON.parse(raw) : []
    }
    return []
  }
}

export const toggleWishlistItem = async (itemId: string): Promise<{ data: string[]; added: boolean }> => {
  try {
    const response = await axios.post('/api/wishlist/toggle', { itemId })
    const data: string[] = Array.isArray(response.data?.data) ? response.data.data : []
    // Keep localStorage in sync as cache
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('homecomf:wishlist', JSON.stringify(data))
    }
    return { data, added: !!response.data?.added }
  } catch {
    // Fallback to localStorage when not authenticated
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('homecomf:wishlist')
      const parsed: string[] = raw ? JSON.parse(raw) : []
      const index = parsed.indexOf(itemId)
      let added = false
      if (index === -1) {
        parsed.push(itemId)
        added = true
      } else {
        parsed.splice(index, 1)
      }
      window.localStorage.setItem('homecomf:wishlist', JSON.stringify(parsed))
      return { data: parsed, added }
    }
    return { data: [], added: false }
  }
}
