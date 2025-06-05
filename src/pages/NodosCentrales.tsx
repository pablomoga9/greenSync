import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import nodoCentral from '../assets/penlace.png'

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
    <>
      <Navbar />
      <div className="container-centrales">
        <h1>Tus Nodos Centrales</h1>
        <ul>
          {nodos.map((n) => (
            <li key={n.id_nodo_central} style={{ marginBottom: '1rem' }}>
              <div id='nodoCentralContainer'>
                <Link to={`/nodos/${n.id_nodo_central}`}>
                <strong>
                  {n.nombre === '-' ? 'Nombre por asignar' : n.nombre}
                </strong>{' '}
                <span style={{ color: '#777', fontSize: '0.9em' }}>
                  ({n.id_nodo_central.slice(0, 8)}...)
                </span>
              </Link>
              <div>{n.descripcion}</div>
              </div>
              <img src={nodoCentral} alt="" />
            </li>
          ))}
        </ul>
        <Link to="/nodos/agregar">
          <button>Añadir nuevo Nodo Central</button>
        </Link>
      </div>
    </>
  )
}

export default NodosCentrales
