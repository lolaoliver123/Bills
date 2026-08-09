import { createRoot } from 'react-dom/client'
import 'app/index.css'
import { App } from 'app/app'
import { AppProvider } from 'app/provider'

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>,
)
