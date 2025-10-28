import './globals.css'

export const metadata = {
  title: 'AI Content Analyzer Demo',
  description: 'Real-time AI content analysis with Claude + Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
