'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, ClipboardCheck, User } from 'lucide-react'
export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
 const pathname=usePathname()
 const links=[{href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},{href:'/bookings',label:'Bookings',icon:CalendarDays},...(isAdmin?[{href:'/manage-bookings',label:'Manage Bookings',icon:ClipboardCheck}]:[]),{href:'/profile',label:'Profile',icon:User}]
 return <aside className="gp-sidebar"><Link href="/dashboard" className="gp-brand"><strong>AU F1 Grand Prix</strong><span>Venue Request Platform</span></Link><nav className="gp-nav">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={pathname===href?'active':''}><Icon size={21}/>{label}</Link>)}</nav></aside>
}
