
import { ImageResponse } from 'next/og'

// Route segment config
export const dynamic = 'force-static'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A', // Matches the app's dark background
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#CCCCCC" strokeWidth="2.5" />
          <path d="M50 10 V 90" stroke="#CCCCCC" strokeWidth="1.5" />
          <path d="M10 50 H 90" stroke="#CCCCCC" strokeWidth="1.5" />
          <path d="M22.5 22.5 L 77.5 77.5" stroke="#CCCCCC" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M22.5 77.5 L 77.5 22.5" stroke="#CCCCCC" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M15 70 C 35 95, 65 95, 85 70" stroke="#CCCCCC" strokeWidth="2.5" fill="none" />
          <path d="M 75 20 L 78 15 L 81 20 L 86 23 L 81 26 L 78 31 L 75 26 L 70 23 Z" fill="#CCCCCC" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
