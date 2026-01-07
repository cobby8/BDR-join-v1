import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BDR 참가신청',
  description: '농구대회 참가신청 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
