import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import { v4 as uuidv4 } from 'uuid'

const SensorHistory = () => {
  const { sensorId } = useParams()
  const [sensorData, setSensorData] = useState<any>(null)
  const [mediciones, setMediciones] = useState<any[]>([])
  const [nombrePersonalizado, setNombrePersonalizado] = useState('')
  const [especieNombre, setEspecieNombre] = useState('')
  const [editando, setEditando] = useState(false)
  const [originalNombre, setOriginalNombre] = useState('')
  const [originalEspecie, setOriginalEspecie] = useState('')
  const [especieValida, setEspecieValida] = useState<boolean | null>(null)
  const [plantbookTimeout, setPlantbookTimeout] = useState<NodeJS.Timeout | null>(null)
  const [plants, setPlants] = useState<any[]>([])

  // Cargar sensor y mediciones
  useEffect(() => {
    const fetchData = async () => {
      const { data: sensor } = await supabase
        .from('nodosensor')
        .select(`*, planta(*, especie(*))`)
        .eq('id_nodo_sensor', sensorId)
        .single()

      const { data: med } = await supabase
        .from('medicion')
        .select('*')
        .eq('id_nodo_sensor', sensorId)
        .order('fecha', { ascending: false })
        .limit(10)


      const {data: plant} = await supabase
      .from('planta')
      .select('*')
      .eq('id_nodo_sensor', sensorId)


      if (sensor) {
        setSensorData(sensor)
        setNombrePersonalizado(sensor.planta[0]?.nombre_personalizado || '')
        setEspecieNombre(sensor.planta[0]?.especie?.nombre_cientifico || '')
        setOriginalNombre(sensor.planta?.nombre_personalizado || '')
        setOriginalEspecie(sensor.planta?.especie?.nombre_cientifico || '')
      }

      if (med) setMediciones(med)
      if (plant && plant.length > 0) {
        setPlants(plant)
      }
    }
    fetchData()
  }, [sensorId])

  // Validación del nombre científico
  useEffect(() => {
    if (plantbookTimeout) clearTimeout(plantbookTimeout)

    if (!editando || !especieNombre.trim()) {
      setEspecieValida(null)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://open.plantbook.io/api/v1/plant/search?alias=${encodeURIComponent(especieNombre)}`,
          {
            headers: {
              Authorization: `Token 7f45971d841472d86e9e505544f2208163765918`,
            },
          }
        )

        const data = await response.json()
        const match = data.results.find((p: any) => p.alias.toLowerCase() === especieNombre.toLowerCase())
        setEspecieValida(!!match)
      } catch (error) {
        console.error('Error al validar nombre científico:', error)
        setEspecieValida(false)
      }
    }, 500)

    setPlantbookTimeout(timeout)
  }, [especieNombre])

  const handleSave = async () => {
    try {
      // Obtener detalles completos de la planta
      const detalleResp = await fetch(
        `https://open.plantbook.io/api/v1/plant/detail/${encodeURIComponent(especieNombre.toLowerCase())}`,
        {
          headers: {
            Authorization: `Token 7f45971d841472d86e9e505544f2208163765918`,
          },
        }
      )
      if (!detalleResp.ok) throw new Error('No se pudo obtener detalle')

      const detalle = await detalleResp.json()

      const {data: especie} = await supabase
            .from('especie')
            .select('*')
            .eq('nombre_cientifico', especieNombre)

      var especieId;
      if(especie && especie.length > 0){
        especieId = especie[0].id_especie
      } else {
        especieId = uuidv4();
        await supabase.from('especie').insert({
        id_especie: especieId,
        nombre_cientifico: especieNombre,
        temp_min: detalle.min_temp.toString(),
        temp_max: detalle.max_temp.toString(),
        luz_min: detalle.min_light_lux.toString(),
        luz_max: detalle.max_light_lux.toString(),
        humedad_min: detalle.min_env_humid.toString(),
        humedad_max: detalle.max_env_humid.toString(),
        humedad_suelo_min: detalle.min_soil_moist.toString(),
        humedad_suelo_max: detalle.max_soil_moist.toString(),
      })
      }

      if(plants.length > 0 && especie && especie.length == 0){
        await supabase.from('planta').update({
          id_especie: especieId, nombre_personalizado: nombrePersonalizado
        })
        .eq('id_planta',plants[0].id_planta)
      } else if (plants.length > 0 && especie && especie.length > 0){
        await supabase.from('planta').update({
          id_especie: especieId, nombre_personalizado: nombrePersonalizado
        })
        .eq('id_planta',plants[0].id_planta)
      } else{
            const nuevaPlantaId = uuidv4()
            await supabase.from('planta').insert({
              id_planta: nuevaPlantaId,
              id_especie: especieId,
              id_nodo_sensor: sensorId,
              nombre_personalizado: nombrePersonalizado,
            })
      }

      setOriginalNombre(nombrePersonalizado)
      setOriginalEspecie(especieNombre)
      setEditando(false)
    } catch (error) {
      console.error('Error al guardar:', error)
    }
  }

  const handleCancel = () => {
    setNombrePersonalizado(originalNombre)
    setEspecieNombre(originalEspecie)
    setEditando(false)
    setEspecieValida(null)
  }

  return (
    <>
      <Navbar />
      <div className="container-history">
        <h1>Historial del sensor</h1>

        {sensorData && (
          <div id='edicion-history'>
            <p><strong>Estado:</strong> {sensorData.estado ? 'Operativo' : 'No operativo'}</p>

            <p><strong>Nombre personalizado:</strong>{' '}
              <br />
              {editando ? (
                <input
                  value={nombrePersonalizado}
                  onChange={(e) => setNombrePersonalizado(e.target.value)}
                />
              ) : (
                nombrePersonalizado || plants[0]?.nombre_personalizado || 'Sin nombre asignado'
              )}
            </p>

            <p><strong>Nombre científico:</strong>{' '}
              <br />
              {editando ? (
                <>
                  <input
                    value={especieNombre}
                    onChange={(e) => setEspecieNombre(e.target.value)}
                  />
                  {especieValida === true && <span style={{ color: 'green' }}>✔</span>}
                  {especieValida === false && <span style={{ color: 'red' }}>Nombre científio no válido</span>}
                </>
              ) : (
                especieNombre || 'Sin especie asignada'
              )}
            </p>

            {editando ? (
              <>
                <div id='botones-edicion'>
                  <button
                  onClick={handleSave}
                  disabled={!nombrePersonalizado || !especieValida}
                >
                  Guardar
                </button>
                <button onClick={handleCancel}>Cancelar</button>
                </div>
              </>
            ) : (
              <button id='editarButton' onClick={() => setEditando(true)}>Editar</button>
            )}
          </div>
        )}

        <h2>Mediciones</h2>
        <ul>
          {mediciones.map((m, i) => (
            <li key={i}>
              {new Date(m.fecha).toLocaleString()} - H: {m.humedad}% T: {m.temperatura}° L: {m.luz} HS: {m.humedad_suelo}%
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default SensorHistory
