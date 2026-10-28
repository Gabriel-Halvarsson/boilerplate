'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
export function Navbar(){
 const router=useRouter(); const {profile,user,signOut}=useAuth()
 async function logout(){await signOut();router.replace('/auth/signin');router.refresh()}
 return <header className="gp-navbar"><Link className="gp-mobile-brand" href="/dashboard">AU F1 Grand Prix</Link><div className="gp-account"><span>{profile?.displayName || user?.displayName || 'Account'}</span><Link href="/profile" className="gp-avatar" aria-label="Profile"><User size={21}/></Link><button onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={23}/></button></div></header>
}
