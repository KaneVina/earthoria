import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './assets/css/main.css'
import './assets/css/navbar.css'
import './assets/js/main.js'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontSize: '13px',
            background: '#0d3330',
            color: '#faf8f3',
            border: '0.5px solid rgba(74,158,63,0.3)'
          }
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)