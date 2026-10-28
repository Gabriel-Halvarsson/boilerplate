import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
export function DashboardShell({children,isAdmin}:{children:ReactNode,isAdmin:boolean}){return <div className="gp-shell"><Sidebar isAdmin={isAdmin}/><div className="gp-main"><Navbar/><main className="gp-content">{children}</main></div></div>}
