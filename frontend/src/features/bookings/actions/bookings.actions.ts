'use server'

import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import { requireAuth } from '@/actions/auth.actions'
import { Timestamp } from 'firebase-admin/firestore'
import type { ActionResult } from '@/types'

const contactEmailSchema = z.string().trim().email('Enter a valid contact email').max(254)
const venueSizeSchema = z.enum(['small', 'medium', 'large'])
const venueTypeSchema = z.enum(['food', 'merch', 'other'])
const createBookingSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  contactEmail: contactEmailSchema,
  venueType: venueTypeSchema,
  venueSize: venueSizeSchema,
})
const updateBookingSchema = z.object({
  bookingId: z.string().min(1),
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  contactEmail: contactEmailSchema,
  venueType: venueTypeSchema,
  venueSize: venueSizeSchema,
})

export async function createBooking(input: unknown): Promise<ActionResult<string>> {
  const session = await requireAuth()
  const parsed = createBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid venue size' }
  }

  try {
    const bookings = adminDb.collection('bookings')
    // Also checks bookings created before this one-request limit was introduced.
    const existing = await bookings.where('uid', '==', session.uid).get()
    if (existing.docs.some((doc) => doc.data().status === 'requested')) {
      return { success: false, error: 'You already have a requested booking' }
    }

    // One lock document per user ensures simultaneous submissions cannot both succeed.
    const lockRef = adminDb.collection('bookingRequestLocks').doc(session.uid)
    const newBookingRef = bookings.doc()
    const created = await adminDb.runTransaction(async (transaction) => {
      const lock = await transaction.get(lockRef)
      if (lock.exists) {
        const activeId = lock.data()?.bookingId
        if (typeof activeId !== 'string') throw new Error('REQUEST_EXISTS')
        const previous = await transaction.get(bookings.doc(activeId))
        if (previous.exists && previous.data()?.status === 'requested') {
          throw new Error('REQUEST_EXISTS')
        }
      }

      const now = Timestamp.now()
      transaction.create(newBookingRef, {
        venueSize: parsed.data.venueSize,
        companyName: parsed.data.companyName,
        contactEmail: parsed.data.contactEmail,
        venueType: parsed.data.venueType,
        status: 'requested',
        uid: session.uid,
        createdAt: now,
        updatedAt: now,
        _schemaVersion: 1,
      })
      transaction.set(lockRef, { bookingId: newBookingRef.id })
      return newBookingRef.id
    })
    return { success: true, data: created }
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_EXISTS') {
      return { success: false, error: 'You already have a requested booking' }
    }
    return { success: false, error: 'Failed to request venue' }
  }
}

export async function updateBooking(input: unknown): Promise<ActionResult<string>> {
  const session = await requireAuth()
  const parsed = updateBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid booking details' }
  }

  try {
    const ref = adminDb.collection('bookings').doc(parsed.data.bookingId)
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists || snapshot.data()?.uid !== session.uid) {
        throw new Error('NOT_FOUND')
      }
      if (snapshot.data()?.status !== 'requested') {
        throw new Error('NOT_EDITABLE')
      }
      transaction.update(ref, {
        companyName: parsed.data.companyName,
        contactEmail: parsed.data.contactEmail,
        venueType: parsed.data.venueType,
        venueSize: parsed.data.venueSize,
        updatedAt: Timestamp.now(),
      })
    })
    return { success: true, data: parsed.data.bookingId }
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return { success: false, error: 'Booking not found' }
    }
    if (error instanceof Error && error.message === 'NOT_EDITABLE') {
      return { success: false, error: 'Only requested bookings can be edited' }
    }
    return { success: false, error: 'Failed to update booking' }
  }
}
