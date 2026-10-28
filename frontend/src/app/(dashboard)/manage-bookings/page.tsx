import type { Metadata } from 'next'
import { requireAdmin } from '@/actions/auth.actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { ManageBookingsList } from '@/features/bookings/components/ManageBookingsList'

export const metadata: Metadata = { title: 'Manage Bookings' }

export default async function ManageBookingsPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <PageHeader title="Manage Bookings" description="Review and manage venue requests" />
      <ManageBookingsList />
    </div>
  )
}
