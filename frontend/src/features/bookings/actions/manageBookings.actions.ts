'use server'

import { z } from 'zod'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { requireAuth } from '@/actions/auth.actions'
import type { ActionResult } from '@/types'

export type ManagedBooking = {
  id: string
  uid: string
  venueSize: 'small' | 'medium' | 'large'
  status: 'requested' | 'approved' | 'denied'
  denialReason?: string
}

const decisionSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(['approved', 'denied']),
  denialReason: z.string().trim().max(2000).optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'denied' && !data.denialReason?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['denialReason'], message: 'A reason for denial is required' })
  }
})

export async function getAllBookings(): Promise<ActionResult<ManagedBooking[]>> {
  await requireAuth()
  try {
    const snapshot = await adminDb.collection('bookings').get()
    const bookings: ManagedBooking[] = snapshot.docs.flatMap((doc) => {
      const data = doc.data()
      if (!['small', 'medium', 'large'].includes(data.venueSize) ||
          !['requested', 'approved', 'denied'].includes(data.status) ||
          typeof data.uid !== 'string') return []
      return [{ id: doc.id, uid: data.uid, venueSize: data.venueSize, status: data.status, ...(typeof data.denialReason === 'string' ? { denialReason: data.denialReason } : {}) }]
    })
    return { success: true, data: bookings }
  } catch {
    return { success: false, error: 'Failed to load bookings' }
  }
}

export async function decideBooking(input: unknown): Promise<ActionResult<string>> {
  await requireAuth()
  const parsed = decisionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid booking decision' }

  try {
    const ref = adminDb.collection('bookings').doc(parsed.data.bookingId)
    await adminDb.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref)
      if (!snapshot.exists) throw new Error('NOT_FOUND')
      if (snapshot.data()?.status !== 'requested') throw new Error('NOT_PENDING')
      tx.update(ref, {
        status: parsed.data.status,
        updatedAt: Timestamp.now(),
        ...(parsed.data.status === 'denied' ? { denialReason: parsed.data.denialReason!.trim() } : {}),
      })
    })
    return { success: true, data: parsed.data.bookingId }
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') return { success: false, error: 'Booking not found' }
    if (error instanceof Error && error.message === 'NOT_PENDING') return { success: false, error: 'Only requested bookings can be reviewed' }
    return { success: false, error: 'Failed to update booking status' }
  }
}
