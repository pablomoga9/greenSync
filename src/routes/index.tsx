import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import History from '../pages/SensorHistory'
import Register from '../pages/Register'
import ProtectedRoute from './ProtectedRoutes'
import NodosCentrales from '../pages/NodosCentrales'
import NodosSensores from '../pages/NodosSensores'
import SensorDiscovery from '../pages/SensorDiscovery'
import CentralDiscovery from '../pages/CentralDiscovery'
import Notificaciones from '../pages/Notificaciones'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {path: '/register', element: <Register />},
  { path: '/', element: <ProtectedRoute><NodosCentrales /></ProtectedRoute>},
  { path: '/nodos/:nodoId', element: <ProtectedRoute><NodosSensores /></ProtectedRoute>},
  { path: '/nodos/:nodoId/rastrear', element: <ProtectedRoute><SensorDiscovery /></ProtectedRoute>},
  { path: '/sensor/:sensorId', element: <ProtectedRoute><History /></ProtectedRoute>},
  {path: '/nodos/agregar', element: <ProtectedRoute><CentralDiscovery/></ProtectedRoute>},
  {path: '/notificaciones', element: <ProtectedRoute><Notificaciones/></ProtectedRoute>}
])