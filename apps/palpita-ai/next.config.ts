import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
    MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY,
  },
}

export default nextConfig
