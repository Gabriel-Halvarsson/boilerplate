'use client'

import { useState } from 'react'
import { where } from 'firebase/firestore'
import { toast } from 'sonner'
import { useCollection } from '@/hooks/useFirestore'
import { useAuth } from '@/hooks/useAuth'
import { getBookingsCollection } from '@/lib/firebase/firestore'
import { updateBooking } from '@/features/notes/actions/notes.actions'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'

type VenueSize = 'small' | 'medium' | 'large'

export function NotesList() {
  const { user } = useAuth()
  const { data: bookings, loading } = useCollection(
    getBookingsCollection(),
    where('uid', '==', user?.uid ?? '')
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedSize, setEditedSize] = useState<VenueSize>('small')
  const [saving, setSaving] = useState(false)

  const save = async (bookingId: string) => {
    setSaving(true)
    try {
      const result = await updateBooking({ bookingId, venueSize: editedSize })
      if (result.success) {
        toast.success('Booking updated')
        setEditingId(null)
      } else {
        toast.error(result.error ?? 'Failed to update booking')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Your Bookings</h2>
      {bookings.length === 0 ? <EmptyState title="No venue requests yet" /> : (
        <ul className="space-y-2">
          {bookings.map((booking) => (
            <li key={booking.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    {booking.venueSize.charAt(0).toUpperCase() + booking.venueSize.slice(1)} Venue
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">Australian Grand Prix</p>
                </div>
                <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              {booking.status === 'requested' && (
                editingId === booking.id ? (
                  <div className="space-y-3 border-t pt-3">
                    <p className="text-sm font-medium">Change venue size</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          disabled={saving}
                          onClick={() => setEditedSize(size)}
                          aria-pressed={editedSize === size}
                          className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                            editedSize === size
                              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={saving} onClick={() => save(booking.id)} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button type="button" disabled={saving} onClick={() => setEditingId(null)} className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setEditingId(booking.id); setEditedSize(booking.venueSize) }} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      Edit Booking
                    </button>
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
