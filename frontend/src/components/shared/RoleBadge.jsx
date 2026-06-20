import Badge from '../ui/Badge'
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/roles'

export default function RoleBadge({ role }) {
  return (
    <Badge color={ROLE_COLORS[role] || 'gray'}>
      {ROLE_LABELS[role] || role}
    </Badge>
  )
}
