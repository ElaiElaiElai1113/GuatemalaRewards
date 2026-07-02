import { QueryClientProvider } from '@tanstack/react-query'

import { AppInstallPrompt } from '@/components/app-install-prompt'
import { ErrorBoundary } from '@/components/error-boundary'
import { OfflineNotice } from '@/components/offline-notice'
import { ThemeInitializer } from '@/components/theme-toggle'
import { AuthProvider } from '@/features/auth/auth-provider'
import { LanguageProvider } from '@/lib/language'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/routes/router'
import { Toaster } from 'sonner'

function App() {
  return (
    <LanguageProvider>
      <ThemeInitializer />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OfflineNotice />
            <AppRouter />
            <AppInstallPrompt />
            <Toaster position="bottom-right" closeButton richColors />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </LanguageProvider>
  )
}

export default App
