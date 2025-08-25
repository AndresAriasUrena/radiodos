import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Radio2 - La Nueva Era de la Radio Digital'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FBFF',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: 'linear-gradient(135deg, #1E305F 0%, #2A4484 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 40,
              boxShadow: '0 10px 30px rgba(30, 48, 95, 0.2)',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 700,
              }}
            >
              R2
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                color: '#1E305F',
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #1E305F 0%, #2A4484 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Radio2
            </span>
            <span
              style={{
                color: '#01A299',
                fontSize: 24,
                fontWeight: 400,
                marginTop: 8,
              }}
            >
              La Nueva Era de la Radio Digital
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
            marginTop: 20,
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #1E305F 0%, #2A4484 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 18,
            }}
          >
            Música Digital
          </span>
          <span
            style={{
              backgroundColor: '#D51F2F',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 18,
            }}
          >
            Noticias 24/7
          </span>
          <span
            style={{
              backgroundColor: '#01A299',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 18,
            }}
          >
            Música
          </span>
          <span
            style={{
              background: 'linear-gradient(135deg, #666 0%, #888 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 18,
            }}
          >
            En Vivo 24/7
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 