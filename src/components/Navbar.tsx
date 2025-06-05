import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import '../styles/components/_navbar.scss'
import logo from '../assets/greenSyncLogo.png'

const Navbar = () => {
  const { usuario, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="" />
        <Link to="/">Nodos Centrales</Link>
        <Link to="/notificaciones">Notificaciones</Link>  {/* <-- Aquí */}
      </div>

      <div className="navbar-right">
        {usuario && (
          <>
            <span>Hola, {usuario.nombre}</span>
            <button onClick={logout}>Salir</button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar