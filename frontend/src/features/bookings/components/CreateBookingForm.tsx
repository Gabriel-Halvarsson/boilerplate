'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { where } from 'firebase/firestore'
import { createBooking } from '@/features/bookings/actions/bookings.actions'
import { useCollection } from '@/hooks/useFirestore'
import { useAuth } from '@/hooks/useAuth'
import { getBookingsCollection } from '@/lib/firebase/firestore'

const bookingFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  contactEmail: z.string().trim().email('Enter a valid contact email').max(254),
  venueSize: z.enum(['small', 'medium', 'large']),
})
type BookingFormInput = z.infer<typeof bookingFormSchema>

export function CreateBookingForm() {
  const { user } = useAuth()
  const { data: bookings, loading } = useCollection(
    getBookingsCollection(),
    where('uid', '==', user?.uid ?? '')
  )
  const hasRequestedBooking = bookings.some((booking) => booking.status === 'requested')
  const { register, setValue, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { companyName: '', contactEmail: '', venueSize: 'small' },
  })
  const selectedSize = watch('venueSize')

  const onSubmit = async (data: BookingFormInput) => {
    if (hasRequestedBooking) return
    const result = await createBooking(data)
    if (result.success) toast.success('Venue requested')
    else toast.error(result.error ?? 'Failed to request venue')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
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
      <div className="space-y-2">
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Venue Size</label>
        <div className="grid grid-cols-3 gap-3">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setValue('venueSize', size, { shouldValidate: true })}
              aria-pressed={selectedSize === size}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
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
      {hasRequestedBooking && (
        <p className="text-sm text-zinc-500" role="status">
          You already have a requested booking. You can request another venue once it is approved or denied.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting || loading || !user || hasRequestedBooking}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isSubmitting ? 'Requesting…' : 'Request Venue'}
      </button>
    </form>
  )
}
