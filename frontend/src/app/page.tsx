import type { Metadata } from 'next'
import Link from 'next/link'
export const metadata:Metadata={title:'Home',description:'Australian F1 Grand Prix Venue Request Platform'}
export default function LandingPage(){return <main className="gp-landing"><section className="gp-landing-card"><h1>Australian F1 Grand Prix<br/>Venue Request Platform</h1><p>Request and manage vendor spaces at the Australian Formula 1 Grand Prix. Register your company, select your preferred venue location, and track your booking status all in one place.</p><div className="gp-landing-actions"><Link href="/auth/signin">Sign in</Link><Link href="/auth/signup">Create account</Link></div></section></main>}
