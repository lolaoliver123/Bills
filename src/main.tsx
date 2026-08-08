import { createRoot } from 'react-dom/client'
import 'app/index.css'
import App from 'app/app.tsx'
import {AppProvider} from 'app/provider.tsx'

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>,
)
