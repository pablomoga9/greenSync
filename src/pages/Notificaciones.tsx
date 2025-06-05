import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

interface Notificacion {
  id_notificacion: string  
  fecha: string            
  id_usuario: string       
  descripcion: string 
}

const Notificaciones = () => {
  const { usuario } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)

  const [paginaActual, setPaginaActual] = useState(1)
  const elementosPorPagina = 10

  useEffect(() => {
    if (!usuario) return

    const fetchNotificaciones = async () => {
      setCargando(true)

      const desde = (paginaActual - 1) * elementosPorPagina
      const hasta = desde + elementosPorPagina - 1

      const { data, error } = await supabase
        .from('notificacion')
        .select('*')
        .eq('id_usuario', usuario.id_usuario)
        .order('fecha', { ascending: false })
        .range(desde, hasta)

      if (!error && data) {
        setNotificaciones(data)
      }

      setCargando(false)
    }

    fetchNotificaciones()
  }, [usuario, paginaActual])

  const eliminarNotificacion = async (id: string) => {
    const { error } = await supabase
      .from('notificacion')
      .delete()
      .eq('id_notificacion', id)

    if (!error) {
      setNotificaciones(prev => prev.filter(n => n.id_notificacion !== id))
    }
  }

  const eliminarTodas = async () => {
    if (!usuario) return
    const { error } = await supabase
      .from('notificacion')
      .delete()
      .eq('id_usuario', usuario.id_usuario)

    if (!error) {
      setNotificaciones([])
    }
  }

  if (cargando) return <p>Cargando notificaciones...</p>
  if (!usuario) return <p>Debes iniciar sesión para ver las notificaciones.</p>

  return (
    <>
      <Navbar />
      <div className="container-notificaciones">
        <h1>Notificaciones</h1>

        {notificaciones.length === 0 ? (
          <p>No tienes notificaciones.</p>
        ) : (
          <>
            <button onClick={eliminarTodas}>Eliminar todas</button>
            <ul>
              {notificaciones.map(n => (
                <li key={n.id_notificacion} className="notificacion-item">
                  <p>{n.descripcion}</p>
                  <small>{new Date(n.fecha).toLocaleString()}</small>
                  <button onClick={() => eliminarNotificacion(n.id_notificacion)}><img src='https://images.vexels.com/media/users/3/223479/isolated/preview/8ecc75c9d0cf6d942cce96e196d4953f-trash-bin-icon-flat.png'></img></button>
                </li>
              ))}
            </ul>

            <div className="paginacion">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
              <span>Página {paginaActual}</span>
              <button
                onClick={() => setPaginaActual(prev => prev + 1)}
                disabled={notificaciones.length < elementosPorPagina}
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Notificaciones
