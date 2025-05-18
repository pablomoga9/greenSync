import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const NodosCentrales = () => {
  const { usuario } = useAuth()
  const [nodos, setNodos] = useState<any[]>([])

  useEffect(() => {
    const fetchNodos = async () => {
      const { data } = await supabase
        .from('nodocentral')
        .select('*')
        .eq('id_usuario', usuario?.id_usuario)
      if (data) setNodos(data)
    }
    fetchNodos()
  }, [usuario])

  return (
    <div className="container">
      <h1>Tus Nodos Centrales</h1>
      <ul>
        {nodos.map(n => (
          <li key={n.id_nodo_central}>
            <Link to={`/nodos/${n.id_nodo_central}`}>{n.descripcion} ({n.ubicacion})</Link>
          </li>
        ))}
      </ul>
      <button disabled>+ Añadir nuevo nodo (proximamente)</button>
    </div>
  )
}

export default NodosCentrales