import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth()

  if (loading) return <p>Cargando sesión...</p>

  return session ? children : <Navigate to="/login" />
}

export default ProtectedRoute
