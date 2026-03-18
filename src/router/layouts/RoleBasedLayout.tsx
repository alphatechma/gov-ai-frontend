import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'
import { AppLayout } from './AppLayout'
import { AttendantLayout } from './AttendantLayout'

export function RoleBasedLayout() {
  const userRole = useAuthStore((s) => s.user?.role)

  if (userRole === UserRole.ATTENDANT) {
    return <AttendantLayout />
  }

  return <AppLayout />
}
