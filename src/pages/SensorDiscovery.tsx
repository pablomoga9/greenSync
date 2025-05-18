import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'

const SensorDiscovery = () => {
  const { nodoId } = useParams()
  const [sensores, setSensores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSensores = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('nodosensor')
      .select('*')
      .eq('id_nodo_central', nodoId)
      .eq('estado', false)

    if (data) setSensores(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSensores()
  }, [nodoId])

  const confirmarSensor = async (id: string) => {
    await supabase.from('nodosensor').update({ estado: true }).eq('id_nodo_sensor', id)
    fetchSensores()
  }

  const radarSize = 300
  const center = radarSize / 2
  const sensorRadius = 120

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Rastreo de sensores para Nodo Central: {nodoId}</h1>
        <button onClick={fetchSensores}>🔄 Volver a rastrear</button>

        {loading ? (
          <p>Cargando...</p>
        ) : sensores.length === 0 ? (
          <p>No se encontraron nuevos sensores disponibles.</p>
        ) : (
          <div
            className="radar"
            style={{
              position: 'relative',
              width: radarSize,
              height: radarSize,
              margin: '40px auto',
              borderRadius: '50%',
              backgroundColor: 'ffff',
              overflow: 'hidden',
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="wave"
                style={{
                  position: 'absolute',
                  top: center,
                  left: center,
                  width: 0,
                  height: 0,
                  borderRadius: '50%',
                  border: '2px solid #0f0',
                  animation: `radarWave 2.5s infinite`,
                  animationDelay: `${i * 0.8}s`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            <div
              style={{
                position: 'absolute',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#0f0',
                top: center - 7,
                left: center - 7,
                boxShadow: '0 0 10px #0f0',
              }}
            />

            {sensores.map((sensor, i) => {
              const angle = (360 / sensores.length) * i
              const angleRad = (angle * Math.PI) / 180
              const x = center + sensorRadius * Math.cos(angleRad)
              const y = center + sensorRadius * Math.sin(angleRad)

              return (
                <div
                  key={sensor.id_nodo_sensor}
                  style={{
                    position: 'absolute',
                    top: y - 30,
                    left: x - 50,
                    width: 100,
                    background: '#0f03',
                    color: '#0f0',
                    border: '1px solid #0f0',
                    borderRadius: 8,
                    padding: 4,
                    textAlign: 'center',
                    fontSize: 12,
                    backdropFilter: 'blur(3px)',
                  }}
                >
                  <strong>{sensor.nombre}</strong>
                  <div style={{ marginTop: 4 }}>
                    <button
                      onClick={() => confirmarSensor(sensor.id_nodo_sensor)}
                      style={{
                        backgroundColor: '#0f0',
                        color: 'black',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}
                    >
                      ✅
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes radarWave {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }

        .container {
          text-align: center;
        }

        button {
          margin-top: 10px;
        }
      `}</style>
    </>
  )
}

export default SensorDiscovery