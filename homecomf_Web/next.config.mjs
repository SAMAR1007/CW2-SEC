import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const pwaOptions = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'documents',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      urlPattern: ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker',
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/erd\/(accommodations|experiences)(\?.*)?$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'search-results',
        expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/(erd\/bookings|payment|messages|notifications)(\/.+)?(\?.*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'live-booking-data',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 30 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/erd\/bookings(\?.*)?$/,
      method: 'POST',
      handler: 'NetworkOnly',
      options: {
        cacheName: 'booking-sync-queue',
        backgroundSync: {
          name: 'booking-sync-queue',
          options: {
            maxRetentionTime: 24 * 60,
          },
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/payment\/.+$/,
      method: 'POST',
      handler: 'NetworkOnly',
      options: {
        cacheName: 'payment-sync-queue',
        backgroundSync: {
          name: 'payment-sync-queue',
          options: {
            maxRetentionTime: 6 * 60,
          },
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/geocode(\?.*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'geocode-data',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
}

let withPWA = (config) => config

try {
  const withPWAInit = require('next-pwa')
  withPWA = withPWAInit(pwaOptions)
} catch {
  console.warn('next-pwa is not installed. Running without PWA plugin.')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
}

export default withPWA(nextConfig)
