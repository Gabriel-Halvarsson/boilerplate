import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to the app',
}

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Australian F1 Grand Prix
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Request and manage vendor spaces at the Australian Formula 1 Grand Prix. Register your company, select your preferred venue location, and track your booking status all in one place.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white shadow transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Create account
        </Link>
      </div>
    </main>
  )
}
