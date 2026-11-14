import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GettingStartedGuide() {
  const { user } = useAuth()
  const destination = user?.role === 'student' ? '/dashboard' : '/admin'

  return (
    <Navigate
      to={destination}
      replace
      state={{ guidedTourStep: 0 }}
    />
  )
}
