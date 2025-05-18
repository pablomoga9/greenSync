import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const SensorHistory = () => {
  const { sensorId } = useParams()
  const [sensorData, setSensorData] = useState<any>(null)
  const [mediciones, setMediciones] = useState<any[]>([])
  const [nombrePersonalizado, setNombrePersonalizado] = useState('')
  const [especieId, setEspecieId] = useState('')

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

      if (sensor) {
        setSensorData(sensor)
        setNombrePersonalizado(sensor.planta?.nombre_personalizado || '')
        setEspecieId(sensor.planta?.id_especie || '')
      }

      if (med) setMediciones(med)
    }
    fetchData()
  }, [sensorId])

  const handleSave = async () => {
    if (!sensorData?.planta?.id_planta) return
    await supabase.from('planta').update({
      nombre_personalizado: nombrePersonalizado,
      id_especie: especieId,
    }).eq('id_planta', sensorData.planta.id_planta)
  }

  return (
    <div className="container">
      <h1>Historial del sensor</h1>
      {sensorData && (
        <div>
          <p><strong>Sensor:</strong> {sensorData.nombre}</p>
          <p><strong>Estado:</strong> {sensorData.estado ? 'Operativo' : 'No operativo'}</p>
          <label>Nombre personalizado:</label>
          <input value={nombrePersonalizado} onChange={(e) => setNombrePersonalizado(e.target.value)} />
          <label>ID especie:</label>
          <input value={especieId} onChange={(e) => setEspecieId(e.target.value)} />
          <button onClick={handleSave}>Guardar cambios</button>
        </div>
      )}

      <h2>Mediciones</h2>
      <ul>
        {mediciones.map((m, i) => (
          <li key={i}>
            {new Date(m.fecha).toLocaleString()} - H: {m.humedad}% T: {m.temperatura}° L: {m.luz}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SensorHistory