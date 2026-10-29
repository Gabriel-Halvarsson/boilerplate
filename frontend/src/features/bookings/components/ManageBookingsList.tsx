'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { decideBooking, getAllBookings, type ManagedBooking } from '@/features/bookings/actions/manageBookings.actions'

type Filter = 'all' | ManagedBooking['status']
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
]

export function ManageBookingsList() {
  const [bookings, setBookings] = useState<ManagedBooking[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [denyingId, setDenyingId] = useState<string | null>(null)
  const [denialReason, setDenialReason] = useState('')

  async function refresh() {
    const result = await getAllBookings()
    if (result.success && result.data) setBookings(result.data)
    else toast.error(result.error ?? 'Failed to load bookings')
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  async function decide(bookingId: string, status: 'approved' | 'denied', reason?: string) {
    setBusyId(bookingId)
    try {
      const result = await decideBooking({ bookingId, status, ...(status === 'denied' ? { denialReason: reason } : {}) })
      if (result.success) {
        toast.success(status === 'approved' ? 'Booking approved' : 'Booking denied')
        setDenyingId(null)
        setDenialReason('')
      } else {
        toast.error(result.error ?? 'Failed to update booking')
      }
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading bookings…</p>

  const visible = bookings.filter((booking) => filter === 'all' || booking.status === filter)
  return (
    <section className="gp-panel gp-manage-list">
      <div className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${filter === value
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
              : 'border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'}`}>
            {label} ({value === 'all' ? bookings.length : bookings.filter(b => b.status === value).length})
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="text-sm text-zinc-500">No bookings match this filter.</p> : (
        <ul className="space-y-3">
          {visible.map((booking) => (
            <li key={booking.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{booking.venueSize.charAt(0).toUpperCase() + booking.venueSize.slice(1)} Venue</h3>
                  {booking.companyName && <p className="text-sm">{booking.companyName}</p>}
                  <p className="text-sm">{booking.contactEmail}</p>
                  <p className="text-sm">Albert Park Section {booking.section}</p>
                  <p className="text-sm">Venue Type: {booking.venueType.charAt(0).toUpperCase() + booking.venueType.slice(1)}</p>
                  <p className="text-sm text-zinc-500">Australian Grand Prix</p>
                </div>
                <span data-status={booking.status} className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold capitalize">
                  {booking.status === 'requested' ? 'Pending' : booking.status}
                </span>
              </div>
              {booking.status === 'requested' && (
                <div className="flex gap-2">
                  <button type="button" disabled={busyId !== null} onClick={() => void decide(booking.id, 'approved')}
                    className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">Approve</button>
                  <button type="button" disabled={busyId !== null} onClick={() => { setDenyingId(booking.id); setDenialReason('') }}
                    className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50">Deny</button>
                </div>
              )}
              {booking.status === 'requested' && denyingId === booking.id && (
                <div className="space-y-2 rounded-md border p-3">
                  <label htmlFor={`denial-${booking.id}`} className="block text-sm font-medium">Reason for denial</label>
                  <textarea
                    id={`denial-${booking.id}`}
                    value={denialReason}
                    onChange={(event) => setDenialReason(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Explain why this venue request was denied..."
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <div className="flex gap-2">
                    <button type="button" disabled={busyId !== null || !denialReason.trim()}
                      onClick={() => void decide(booking.id, 'denied', denialReason)}
                      className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Confirm Denial</button>
                    <button type="button" disabled={busyId !== null}
                      onClick={() => { setDenyingId(null); setDenialReason('') }}
                      className="rounded-md border px-3 py-2 text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}
              {booking.status === 'denied' && booking.denialReason && (
                <div className="rounded-md border border-white/40 bg-white/5 p-3 text-sm">
                  <p className="font-medium text-white">Reason for Denial</p>
                  <p className="mt-1 whitespace-pre-wrap text-purple-100">
                    {booking.denialReason}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
