import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore collection type definitions.
 *
 * Keep in sync with:
 *   - src/lib/firebase/firestore.ts  (typed collection exports)
 *   - firebase/firestore.rules       (security rules)
 *   - docs/FIRESTORE-SCHEMA.md       (schema documentation)
 */

export interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: 'user' | 'admin'
  createdAt: Timestamp
  updatedAt: Timestamp
  _schemaVersion: 1
}

export type CreateUserProfileInput = Omit<UserProfile, 'createdAt' | 'updatedAt'>

export type VenueSize = 'small' | 'medium' | 'large'
export type VenueType = 'food' | 'merch' | 'other'
export type AlbertParkSection = 'A' | 'B' | 'C' | 'D' | 'E'

export interface Booking {
  id: string
  uid: string
  venueSize: VenueSize
  companyName: string
  contactEmail: string
  venueType: VenueType
  section: AlbertParkSection
  status: 'requested' | 'approved' | 'denied'
  denialReason?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  _schemaVersion: 1
}
