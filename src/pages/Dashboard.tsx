import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/index.scss'
import Navbar from '../components/Navbar'

type Planta = {
  id_planta: string
  nombre_personalizado: string
}

const Dashboard = () => {
  const [plantas, setPlantas] = useState<Planta[]>([])

  useEffect(() => {
    const fetchPlantas = async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return

      const { data } = await supabase
        .from('planta')
        .select('*')
        .limit(10)

      if (data) setPlantas(data)
    }

    fetchPlantas()
  }, [])

  return (
    <>
    <Navbar/>
    <div className="dashboard-container">
      <h1>Panel de plantas</h1>
      <div className="plantas-grid">
        {plantas.map((planta) => (
          <div key={planta.id_planta} className="planta-card">
            <h3>{planta.nombre_personalizado}</h3>
            <p>Últimos datos: [pendiente]</p>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}

export default Dashboard
