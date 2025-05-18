import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

type Usuario = {
  id_usuario: string
  nombre: string
  email: string
}

type AuthContextType = {
  session: boolean
  usuario: Usuario | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error: fetchError } = await supabase
          .from('usuario')
          .select('*')
          .eq('id_usuario', user.id)
          .single()

        if (!fetchError && data) {
          setUsuario(data)
          setSession(true)
        }
      }

      setLoading(false)
    }

    fetchUserData()

    // Escuchar cambios en la sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUsuario(null)
        setSession(false)
      } else {
        fetchUserData()
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    setSession(false)
  }

  return (
    <AuthContext.Provider value={{ usuario, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}