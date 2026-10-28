'use client'

import { useEffect, useState } from 'react'
import { where } from 'firebase/firestore'
import { toast } from 'sonner'
import { useCollection } from '@/hooks/useFirestore'
import { useAuth } from '@/hooks/useAuth'
import { getBookingsCollection } from '@/lib/firebase/firestore'
import { updateBooking, getSectionCapacity, type SectionCapacity } from '@/features/bookings/actions/bookings.actions'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'

type VenueSize = 'small' | 'medium' | 'large'
type VenueType = 'food' | 'merch' | 'other'
type Section = 'A' | 'B' | 'C' | 'D' | 'E'

export function BookingsList() {
  const { user } = useAuth()
  const { data: bookings, loading } = useCollection(
    getBookingsCollection(),
    where('uid', '==', user?.uid ?? '')
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedSize, setEditedSize] = useState<VenueSize>('small')
  const [editedCompanyName, setEditedCompanyName] = useState('')
  const [editedContactEmail, setEditedContactEmail] = useState('')
  const [editedVenueType, setEditedVenueType] = useState<VenueType>('food')
  const [editedSection, setEditedSection] = useState<Section>('A')
  const [capacity, setCapacity] = useState<SectionCapacity | null>(null)
  useEffect(() => {
    let active = true
    const refresh = async () => {
      const result = await getSectionCapacity()
      if (active) setCapacity(result.success ? result.data ?? null : null)
    }
    void refresh()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [])
  const sectionFull = capacity !== null && capacity[editedSection] >= 5
  const [saving, setSaving] = useState(false)

  const save = async (bookingId: string) => {
    const companyName = editedCompanyName.trim()
    if (!companyName || companyName.length > 200) {
      toast.error('Company name must be between 1 and 200 characters')
      return
    }
    const contactEmail = editedContactEmail.trim()
    if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error('Enter a valid contact email')
      return
    }
    if (!capacity || sectionFull) { toast.error(`Section ${editedSection} is at capacity or availability is unavailable`); return }
    setSaving(true)
    try {
      const result = await updateBooking({ bookingId, venueSize: editedSize, companyName, contactEmail, venueType: editedVenueType, section: editedSection })
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
    <section className="gp-panel gp-booking-list">
      <h2 className="text-lg font-semibold">Your Bookings</h2><p className="gp-list-subtitle">View and manage your existing venue requests.</p>
      {bookings.length === 0 ? <EmptyState title="No venue requests yet" /> : (
        <ul className="space-y-2">
          {bookings.map((booking) => (
            <li key={booking.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    {booking.venueSize.charAt(0).toUpperCase() + booking.venueSize.slice(1)} Venue
                  </h3>
                  {booking.companyName && (
                    <p className="mt-1 text-sm">{booking.companyName}</p>
                  )}
                  <p className="mt-1 text-sm">{booking.contactEmail}</p>
                  <p className="mt-1 text-sm">Albert Park Section {booking.section}</p>
                  <p className="mt-1 text-sm">Venue Type: {booking.venueType.charAt(0).toUpperCase() + booking.venueType.slice(1)}</p>
                  <p className="mt-1 text-sm text-zinc-500">Australian Grand Prix</p>
                </div>
                <span data-status={booking.status} className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold capitalize">
                  {booking.status === 'requested' ? 'Pending' : booking.status}
                </span>
              </div>
              {booking.status === 'denied' && booking.denialReason && (
                <div className="mt-3 rounded-md border p-3">
                  <p className="text-sm font-medium">
                    Reason for Denial
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {booking.denialReason}
                  </p>
                </div>
              )}
              {booking.status === 'requested' && (
                editingId === booking.id ? (
                  <div className="space-y-3 border-t pt-3">
                    <div className="space-y-1.5">
                      <label htmlFor={`company-name-${booking.id}`} className="text-sm font-medium">Company Name</label>
                      <input
                        id={`company-name-${booking.id}`}
                        type="text"
                        value={editedCompanyName}
                        onChange={(event) => setEditedCompanyName(event.target.value)}
                        maxLength={200}
                        required
                        disabled={saving}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`contact-email-${booking.id}`} className="text-sm font-medium">Contact Email</label>
                      <input
                        id={`contact-email-${booking.id}`}
                        type="email"
                        value={editedContactEmail}
                        onChange={(event) => setEditedContactEmail(event.target.value)}
                        maxLength={254}
                        required
                        disabled={saving}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`venue-type-${booking.id}`} className="text-sm font-medium">Venue Type</label>
                      <select
                        id={`venue-type-${booking.id}`}
                        value={editedVenueType}
                        onChange={(event) => setEditedVenueType(event.target.value as VenueType)}
                        disabled={saving}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="food">Food</option>
                        <option value="merch">Merch</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`section-${booking.id}`} className="text-sm font-medium">Albert Park Section</label>
                      <select id={`section-${booking.id}`} value={editedSection}
                        onChange={(event) => setEditedSection(event.target.value as Section)}
                        disabled={saving} className="w-full rounded-md border px-3 py-2 text-sm">
                        {(['A', 'B', 'C', 'D', 'E'] as const).map((section) => (
                          <option key={section} value={section}>Albert Park Section {section}</option>
                        ))}
                      </select>
                    </div>
                    {sectionFull && <p className="text-sm text-zinc-500" role="status">Section {editedSection} is at capacity.</p>}
                    <p className="text-sm font-medium">Change venue size</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          disabled={saving || sectionFull || !capacity}
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
                      <button type="button" disabled={saving || sectionFull || !capacity} onClick={() => save(booking.id)} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button type="button" disabled={saving} onClick={() => setEditingId(null)} className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setEditingId(booking.id); setEditedSize(booking.venueSize); setEditedCompanyName(booking.companyName); setEditedContactEmail(booking.contactEmail); setEditedVenueType(booking.venueType); setEditedSection(booking.section) }} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
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
