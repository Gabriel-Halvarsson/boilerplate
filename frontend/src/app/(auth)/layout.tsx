import type { Metadata } from 'next'
export const metadata:Metadata={title:'Authentication'}
export default function AuthLayout({children}:{children:React.ReactNode}){return <div className="gp-auth"><div className="gp-auth-card">{children}</div></div>}
