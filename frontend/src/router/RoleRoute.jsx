import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { ROLES } from '../constants/roles'

export default function RoleRoute({ children }) {
  const { token, role: userRole } = useAuthStore()
  const isAdmin = token && (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN)
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return children
}
