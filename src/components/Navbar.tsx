import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import '../styles/components/_navbar.scss'

const Navbar = () => {
  const { usuario, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">GreenSync</Link>
        <Link to="/">Nodos Centrales</Link>
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
