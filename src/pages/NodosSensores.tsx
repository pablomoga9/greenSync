import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const NodosSensores = () => {
  const { nodoId } = useParams()
  const [sensores, setSensores] = useState<any[]>([])

  useEffect(() => {
    const fetchSensores = async () => {
      const { data: sensoresData } = await supabase
        .from('nodosensor')
        .select(`*, planta(*, especie(*)), medicion(*)`)
        .eq('id_nodo_central', nodoId)
      if (sensoresData) setSensores(sensoresData)
    }
    fetchSensores()
  }, [nodoId])

  return (
    <div className="container">
      <h1>Nodo Central: {nodoId}</h1>
      <ul>
        {sensores.map(sensor => {
          if (sensor.estado){
            const ultimaMed = sensor.medicion.sort((a: any, b: any) => b.fecha.localeCompare(a.fecha))[0]
          return (
            <li key={sensor.id_nodo_sensor}>
              <Link to={`/sensor/${sensor.id_nodo_sensor}`}>
                <strong>{sensor.nombre}</strong> - {sensor.estado ? 'Operativo' : 'No operativo'}<br/>
                Planta: {sensor.planta[0]
                  ? `${sensor.planta[0].nombre_personalizado} (${sensor.planta[0].especie?.nombre_cientifico})`
                  : 'Sin planta asociada'}<br />
                Última medición: H:{ultimaMed?.humedad}% T:{ultimaMed?.temperatura}° L:{ultimaMed?.luz}
              </Link>
            </li>
          )
          }
        })}
      </ul>
      <Link to={`/nodos/${nodoId}/rastrear`}>
          <button>Rastrear nuevos sensores</button>
      </Link>
    </div>
  )
}

export default NodosSensores