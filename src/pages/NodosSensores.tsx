import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import nodoSensorImg from '../assets/nSensor.png'

const NodosSensores = () => {
  const { nodoId } = useParams()
  const [sensores, setSensores] = useState<any[]>([])
  const [nodoCentral, setNodoCentral] = useState<any>(null)
  const [editando, setEditando] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')
  const [descripcionEditada, setDescripcionEditada] = useState('')

  useEffect(() => {
    const fetchNodoCentral = async () => {
      const { data } = await supabase
        .from('nodocentral')
        .select('*')
        .eq('id_nodo_central', nodoId)
        .single()

      if (data) {
        setNodoCentral(data)
        setNombreEditado(data.nombre)
        setDescripcionEditada(data.descripcion)
      }
    }

    const fetchSensores = async () => {
      const { data: sensoresData } = await supabase
        .from('nodosensor')
        .select(`*, planta(*, especie(*)), medicion(*)`)
        .eq('id_nodo_central', nodoId)

      if (sensoresData) setSensores(sensoresData)
    }

    fetchNodoCentral()
    fetchSensores()
  }, [nodoId])

  const handleGuardar = async () => {
    const { error } = await supabase
      .from('nodocentral')
      .update({
        nombre: nombreEditado,
        descripcion: descripcionEditada,
      })
      .eq('id_nodo_central', nodoId)

    if (!error) {
      setNodoCentral((prev: any) => ({
        ...prev,
        nombre: nombreEditado,
        descripcion: descripcionEditada,
      }))
      setEditando(false)
    }
  }

  const handleCancelar = () => {
    setNombreEditado(nodoCentral.nombre)
    setDescripcionEditada(nodoCentral.descripcion)
    setEditando(false)
  }

  return (
    <>
      <Navbar />
      <div className="container-sensores">
        <div id='sensoresTop'>
          <h1>
          {editando ? (
            <input
              type="text"
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
            />
          ) : (
            nodoCentral && (nodoCentral.nombre === '-' ? 'Nombre por asignar' : nodoCentral.nombre)
          )}
        </h1>

        {editando ? (
          <input id='inputDescripcion'
            type= "text"
            value={descripcionEditada}
            onChange={(e) => setDescripcionEditada(e.target.value)}
          />
        ) : (
          <p>{nodoCentral?.descripcion}</p>
        )}

        {editando ? (
          <>
            <div id='botonesSensores'>
              <button onClick={handleGuardar}>Guardar</button>
              <button onClick={handleCancelar}>Cancelar</button>
            </div>
          </>
        ) : (
          <button id='botonEditar' onClick={() => setEditando(true)}>Editar</button>
        )}
        </div>

        <h2>Sensores asociados</h2>

        {sensores.filter((s) => s.estado).length === 0 ? (
          <div style={{ position: 'relative', textAlign: 'center', padding: '50px 0' }}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/4974/4974482.png"
              alt="Sin sensores"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '150px',
                height: '150px',
                transform: 'translate(-50%, -50%)',
                opacity: 0.1,
                zIndex: 0,
              }}
            />
            <p style={{ opacity: 0.5, position: 'relative', zIndex: 1 }}>
              Aún no hay nodos sensores registrados
            </p>
          </div>
        ) : (
          <ul>
            {sensores.map((sensor) => {
              if (sensor.asociado) {
                const ultimaMed = sensor.medicion.sort(
                  (a: { fecha: string }, b: { fecha: string }) =>
                    b.fecha.localeCompare(a.fecha)
                )[0]

                const especie = sensor.planta?.[0]?.especie
                let esCritico = false

                if (especie && ultimaMed) {
                  const {
                    humedad_min,
                    humedad_max,
                    temperatura_min,
                    temperatura_max,
                    luz_min,
                    luz_max,
                    humedad_suelo_min,
                    humedad_suelo_max,
                  } = especie

                  if (
                    (humedad_min !== null && ultimaMed.humedad < humedad_min) ||
                    (humedad_max !== null && ultimaMed.humedad > humedad_max) ||
                    (temperatura_min !== null && ultimaMed.temperatura < temperatura_min) ||
                    (temperatura_max !== null && ultimaMed.temperatura > temperatura_max) ||
                    (luz_min !== null && ultimaMed.luz < luz_min) ||
                    (luz_max !== null && ultimaMed.luz > luz_max) ||
                    (humedad_suelo_min !== null && ultimaMed.humedad_suelo < humedad_suelo_min) ||
                    (humedad_suelo_max !== null && ultimaMed.humedad_suelo > humedad_suelo_max)
                  ) {
                    esCritico = true
                  }
                }

                const colorClase = esCritico ? 'tarjeta-roja' : 'tarjeta-verde'

                return (
                  <li key={sensor.id_nodo_sensor} className={`tarjeta ${colorClase}`}>
                    <div id='sensorCard'>
                      <Link to={`/sensor/${sensor.id_nodo_sensor}`}>
                      <strong>
                        {sensor.planta[0]
                          ? `${sensor.planta[0].nombre_personalizado} (${sensor.planta[0].especie?.nombre_cientifico})`
                          : 'Sin planta asociada'}
                      </strong>
                      <br />
                      Última medición: H:{ultimaMed?.humedad}% T:{ultimaMed?.temperatura}° L:{ultimaMed?.luz} HS:{ultimaMed?.humedad_suelo}%
                    </Link>
                    </div>
                    <img src={nodoSensorImg} alt="" />
                  </li>
                )
              }
              return null
            })}
          </ul>
        )}

        <Link to={`/nodos/${nodoId}/rastrear`}>
          <button>Rastrear nuevos sensores</button>
        </Link>
      </div>
    </>
  )
}

export default NodosSensores
