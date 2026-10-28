import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { adminDb } from '@/lib/firebase/admin'
import { ProfileEditor } from '@/features/profile/ProfileEditor'
export const metadata:Metadata={title:'Profile'}
export default async function ProfilePage(){const session=await requireAuth();const snap=await adminDb.collection('users').doc(session.uid).get();return <div><div className="gp-page-head"><span className="gp-eyebrow">PROFILE</span><h1>Account Profile</h1><p>View and update your account details.</p></div><ProfileEditor initialName={(snap.data()?.displayName as string)||''} initialEmail={session.email||''}/></div>}
