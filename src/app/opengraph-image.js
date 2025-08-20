import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Radio Columbia - Tu Estación de Radio Costarricense'
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
              backgroundColor: '#1E305F',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 40,
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 700,
              }}
            >
              C
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
              }}
            >
              Radio Columbia
            </span>
            <span
              style={{
                color: '#01A299',
                fontSize: 24,
                fontWeight: 400,
                marginTop: 8,
              }}
            >
              Tu Estación de Radio Costarricense
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
              backgroundColor: '#1E305F',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 18,
            }}
          >
            Noticias
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
            Deportes
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
              backgroundColor: '#9A9898',
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