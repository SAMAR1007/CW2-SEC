import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'homecomf',
    short_name: 'homecomf',
    description: 'Travel booking platform for stays and experiences in Nepal.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#FF6518',
    icons: [
      {
        src: '/images/logo.png',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
