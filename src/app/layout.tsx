import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Eventara',
  description: 'Campus Event Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}

            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#3fb950',
                    secondary: 'var(--surface)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f85149',
                    secondary: 'var(--surface)',
                  },
                },
              }}
            />

          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}