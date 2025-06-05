import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import { toast } from 'react-toastify'

const SensorDiscovery = () => {
  const { nodoId } = useParams()
  const [sensores, setSensores] = useState<any[]>([])
  const [nombreNodo, setNombreNodo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSensores = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('nodosensor')
      .select('*')
      .eq('id_nodo_central', nodoId)
      .eq('asociado', false)

    if (data) setSensores(data)
    setLoading(false)
  }

  const fetchNombreNodo = async () => {
    const { data } = await supabase
      .from('nodocentral')
      .select('nombre')
      .eq('id_nodo_central', nodoId)
      .single()

    if (data) setNombreNodo(data.nombre)
  }

  useEffect(() => {
    fetchSensores()
    fetchNombreNodo()
  }, [nodoId])

  const confirmarSensor = async (id: string) => {
    await supabase.from('nodosensor').update({ asociado: true }).eq('id_nodo_sensor', id)
    toast.success('Nodo sensor registrado correctamente')
    fetchSensores()
  }

  return (
    <>
      <Navbar />
      <div className="container-sensor-discovery">
        <h1>Rastreo de sensores para: {nombreNodo || '...'}</h1>
        <button onClick={fetchSensores}>Volver a rastrear</button>

        {loading ? (
          <p>Cargando...</p>
        ) : sensores.length === 0 ? (
          <p>No se encontraron nuevos sensores disponibles.</p>
        ) : (
          <div className="sensor-list">
            {sensores.map((sensor) => {
              const macFragment = sensor.mac ? sensor.mac.slice(0, sensor.mac.length / 2) + '...' : 'MAC...'

              return (
                <div key={sensor.id_nodo_sensor} className="sensor-card">
                  <strong>NS {macFragment}</strong>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/781/781318.png"
                    alt="Sensor"
                    className="sensor-image"
                  />
                  <button
                    onClick={() => confirmarSensor(sensor.id_nodo_sensor)}
                    className="confirm-button"
                  >
                    ✅
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .container {
          text-align: center;
          padding: 20px;
        }

        .sensor-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
        }

        .sensor-card {
          background-color: #e0ffe0;
          border: 1px solid #00aa00;
          border-radius: 10px;
          padding: 15px;
          width: 160px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          text-align: center;
          position: relative;
        }

        .sensor-image {
          width: 80px;
          height: 80px;
          opacity: 0.4;
          margin: 10px 0;
        }

        .confirm-button {
          background-color: #0f0;
          color: black;
          border: none;
          border-radius: 5px;
          padding: 5px 10px;
          cursor: pointer;
        }

        button {
          margin-top: 10px;
        }
      `}</style>
    </>
  )
}

export default SensorDiscovery
