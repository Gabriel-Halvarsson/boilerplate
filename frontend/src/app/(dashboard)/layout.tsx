import { redirect } from 'next/navigation'
import { getServerSession } from '@/actions/auth.actions'
import { adminDb } from '@/lib/firebase/admin'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/auth/signin')

  const profile = await adminDb.collection('users').doc(session.uid).get()
  const isAdmin = profile.data()?.role === 'admin'

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>
}
