///<reference types="web-bluetooth" />
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'
const CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!

const CentralDiscovery = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null)
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const buscarDispositivos = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'GreenSyncPi' }],
        optionalServices: [SERVICE_UUID]
      })
      setDevices([device])
      setSelectedDevice(device)
    } catch (error) {
      console.error('No se pudo buscar dispositivos:', error)
    }
  }

  const enviarCredenciales = async () => {
    if (!selectedDevice || !ssid || !password) return

    try {
      setLoading(true)
      const uuid = crypto.randomUUID()
       const { data: { user }, error: authError } = await supabase.auth.getUser();
      const server = await selectedDevice.gatt?.connect()
      const service = await server?.getPrimaryService(SERVICE_UUID)
      const characteristic = await service?.getCharacteristic(CHARACTERISTIC_UUID)
       if (authError || !user) {
        console.error('No hay sesión iniciada o error al obtener usuario:', authError);
        return;
        }
      const payload = `${ssid}|${password}|${SUPABASE_URL}|${SUPABASE_ANON_KEY}|${uuid}`
      const data = new TextEncoder().encode(payload)
      await characteristic?.writeValue(data)
      console.log("here");
      await supabase.from('nodocentral').insert({
        descripcion: '-',
        nombre: '-',
        id_usuario: user.id,
        id_nodo_central: uuid,
      })
     toast.success('Nodo central registrado correctamente')
setTimeout(() => navigate('/'), 2000)
    } catch (error) {
      console.error('Error al enviar credenciales:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Buscar nuevos nodos centrales</h1>
        <button onClick={buscarDispositivos}>Buscar dispositivos BLE</button>

        {devices.length > 0 && (
          <div className="modal">
            <h2>Configurar nodo: {selectedDevice?.name}</h2>
            <label>Red WiFi:</label>
            <input value={ssid} onChange={(e) => setSsid(e.target.value)} />

            <label>Contraseña:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={enviarCredenciales} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar datos'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default CentralDiscovery
