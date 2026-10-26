import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ClipboardCheck, User } from 'lucide-react'
import { getServerSession } from '@/actions/auth.actions'
import { adminDb } from '@/lib/firebase/admin'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await getServerSession()
  const profileSnap = session ? await adminDb.collection('users').doc(session.uid).get() : null
  const profile = profileSnap?.data()
  const displayName = profileSnap?.exists ? (profile?.displayName as string | null) : null
  const greetingName = displayName ?? session?.email ?? null
  const isAdmin = profile?.role === 'admin'

  const links = [
    {
      href: '/bookings',
      title: 'Bookings',
      description: 'Request a venue at the Australian F1 Grand Prix and view your existing bookings.',
      icon: CalendarDays,
    },
    {
      href: '/profile',
      title: 'Profile',
      description: 'View your company profile and account information.',
      icon: User,
    },
    ...(isAdmin ? [{
      href: '/manage-bookings',
      title: 'Manage Bookings',
      description: 'Review venue requests from all vendors and approve or deny pending bookings.',
      icon: ClipboardCheck,
    }] : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back{greetingName ? `, ${greetingName}` : ''}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <p className="mt-3 text-sm text-zinc-500">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
