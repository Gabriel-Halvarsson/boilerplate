'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { where } from 'firebase/firestore'
import { createBooking, getSectionCapacity, type SectionCapacity } from '@/features/bookings/actions/bookings.actions'
import { useCollection } from '@/hooks/useFirestore'
import { useAuth } from '@/hooks/useAuth'
import { getBookingsCollection } from '@/lib/firebase/firestore'

const bookingFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  contactEmail: z.string().trim().email('Enter a valid contact email').max(254),
  venueType: z.enum(['food', 'merch', 'other']),
  section: z.enum(['A', 'B', 'C', 'D', 'E']),
  venueSize: z.enum(['small', 'medium', 'large']),
})
type BookingFormInput = z.infer<typeof bookingFormSchema>

export function CreateBookingForm() {
  const { user, profile } = useAuth()
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
  const { data: bookings, loading } = useCollection(
    getBookingsCollection(),
    where('uid', '==', user?.uid ?? '')
  )
  const hasRequestedBooking = bookings.some((booking) => booking.status === 'requested')
  const { register, setValue, watch, handleSubmit, formState: { errors, isSubmitting, dirtyFields } } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { companyName: '', contactEmail: '', venueType: 'food', section: 'A', venueSize: 'small' },
  })
  // Prefill only untouched fields so profile loading never overwrites user edits
  useEffect(() => {
    if (profile?.displayName && !dirtyFields.companyName) {
      setValue('companyName', profile.displayName, { shouldDirty: false })
    }
  }, [profile?.displayName, dirtyFields.companyName, setValue])

  useEffect(() => {
    if (user?.email && !dirtyFields.contactEmail) {
      setValue('contactEmail', user.email, { shouldDirty: false })
    }
  }, [user?.email, dirtyFields.contactEmail, setValue])

  const selectedSize = watch('venueSize')
  const selectedSection = watch('section')
  const sectionFull = capacity !== null && capacity[selectedSection] >= 5

  const onSubmit = async (data: BookingFormInput) => {
    if (hasRequestedBooking || sectionFull || !capacity) return
    const result = await createBooking(data)
    if (result.success) toast.success('Venue requested')
    else toast.error(result.error ?? 'Failed to request venue')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="gp-panel gp-booking-form">
      <div className="gp-form-field">
        <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
        <input
          id="companyName"
          type="text"
          maxLength={200}
          aria-invalid={!!errors.companyName}
          aria-describedby={errors.companyName ? 'companyName-error' : undefined}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Enter your company name"
          {...register('companyName')}
        />
        {errors.companyName && (
          <p id="companyName-error" className="text-xs text-red-500" role="alert">
            {errors.companyName.message}
          </p>
        )}
      </div>
      <div className="gp-form-field">
        <label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</label>
        <input
          id="contactEmail"
          type="email"
          maxLength={254}
          aria-invalid={!!errors.contactEmail}
          aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Enter your contact email"
          {...register('contactEmail')}
        />
        {errors.contactEmail && (
          <p id="contactEmail-error" className="text-xs text-red-500" role="alert">
            {errors.contactEmail.message}
          </p>
        )}
      </div>
      <div className="gp-form-field">
        <label htmlFor="venueType" className="text-sm font-medium">Venue Type</label>
        <select
          id="venueType"
          aria-invalid={!!errors.venueType}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          {...register('venueType')}
        >
          <option value="food">Food</option>
          <option value="merch">Merch</option>
          <option value="other">Other</option>
        </select>
        {errors.venueType && <p className="text-xs text-red-500" role="alert">{errors.venueType.message}</p>}
      </div>
      <div className="gp-form-field">
        <label htmlFor="section" className="text-sm font-medium">Albert Park Section</label>
        <select id="section" {...register('section')} className="w-full rounded-md border px-3 py-2 text-sm">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((section) => (
            <option key={section} value={section}>Albert Park Section {section}</option>
          ))}
        </select>
      </div>
      <div className="gp-form-field">
        <label className="text-sm font-medium">Venue Size</label>
        <div className="gp-size-grid">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              disabled={sectionFull || !capacity}
              onClick={() => setValue('venueSize', size, { shouldValidate: true })}
              aria-pressed={selectedSize === size}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedSize === size
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
        {errors.venueSize && <p className="text-xs text-red-500">{errors.venueSize.message}</p>}
      </div>
      {sectionFull && (
        <p className="text-sm text-zinc-500" role="status">Section {selectedSection} is at capacity.</p>
      )}
      {hasRequestedBooking && (
        <p className="text-sm text-zinc-500" role="status">
          You already have a requested booking. You can request another venue once it is approved or denied.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting || loading || !user || hasRequestedBooking || sectionFull || !capacity}
        className="gp-primary-button"
      >
        {isSubmitting ? 'Requesting…' : 'Request Venue'}
      </button>
    </form>
  )
}
