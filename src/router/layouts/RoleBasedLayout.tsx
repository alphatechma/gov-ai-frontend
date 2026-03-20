import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'
import { AppLayout } from './AppLayout'
import { AttendantLayout } from './AttendantLayout'
import { ReceptionistLayout } from './ReceptionistLayout'

export function RoleBasedLayout() {
  const userRole = useAuthStore((s) => s.user?.role)

  if (userRole === UserRole.ATTENDANT) {
    return <AttendantLayout />
  }

  if (userRole === UserRole.RECEPTIONIST) {
    return <ReceptionistLayout />
  }

  return <AppLayout />
}
