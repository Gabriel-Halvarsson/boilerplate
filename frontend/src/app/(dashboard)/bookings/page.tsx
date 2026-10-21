import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreateBookingForm } from '@/features/bookings/components/CreateBookingForm'
import { BookingsList } from '@/features/bookings/components/BookingsList'

export const metadata: Metadata = { title: 'Venue Bookings' }

export default async function BookingsPage() {
  await requireAuth()
  return (
    <div className="space-y-6">
      <PageHeader title="Request a Venue" description="Select your preferred venue size at the Australian Grand Prix" />
      <CreateBookingForm />
      <BookingsList />
    </div>
  )
}
