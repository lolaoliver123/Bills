import { StrictMode, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <StrictMode>
    <BrowserRouter>{children}</BrowserRouter>
  </StrictMode>
)
