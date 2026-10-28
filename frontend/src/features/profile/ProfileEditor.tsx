'use client'
import { useState } from 'react'
import { updateProfile, updateEmail } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2,Mail,Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getClientDb } from '@/lib/firebase/client'
export function ProfileEditor({initialName,initialEmail}:{initialName:string,initialEmail:string}){
 const {user}=useAuth();const router=useRouter();const [name,setName]=useState(initialName);const [email,setEmail]=useState(initialEmail);const [editing,setEditing]=useState<'name'|'email'|null>(null);const [busy,setBusy]=useState(false)
 async function save(field:'name'|'email'){
 if(!user)return toast.error('Sign in to update your profile')
 const value=field==='name'?name.trim():email.trim();if(field==='name'&&(!value||value.length>200))return toast.error('Enter a valid company name');if(field==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return toast.error('Enter a valid email')
 setBusy(true);try{if(field==='name'){await updateProfile(user,{displayName:value});await updateDoc(doc(getClientDb(),'users',user.uid),{displayName:value,updatedAt:serverTimestamp()})}else{await updateEmail(user,value);await updateDoc(doc(getClientDb(),'users',user.uid),{email:value,updatedAt:serverTimestamp()})}toast.success('Profile updated');setEditing(null);router.refresh();if(field==='name')window.location.reload()}catch(e){const code=(e as {code?:string}).code;if(code==='auth/requires-recent-login')toast.error('For security, sign out and sign in again before changing your email');else toast.error(e instanceof Error?e.message:'Unable to update profile')}finally{setBusy(false)}
 }
 return <section className="gp-panel gp-profile-panel"><h2>Account Information</h2>{([{key:'name',label:'COMPANY NAME',icon:Building2,value:name,set:setName},{key:'email',label:'EMAIL',icon:Mail,value:email,set:setEmail}] as const).map(f=><div className="gp-profile-row" key={f.key}><label htmlFor={'profile-'+f.key}>{f.label}</label><div className="gp-profile-control"><div className="gp-profile-field"><f.icon size={23}/><input id={'profile-'+f.key} type={f.key==='email'?'email':'text'} value={f.value} onChange={e=>f.set(e.target.value)} disabled={editing!==f.key} maxLength={f.key==='name'?200:254}/></div>{editing===f.key?<div className="gp-edit-actions"><button disabled={busy} onClick={()=>save(f.key)}>Save</button><button disabled={busy} onClick={()=>{f.set(f.key==='name'?initialName:initialEmail);setEditing(null)}}>Cancel</button></div>:<button className="gp-edit-btn" onClick={()=>setEditing(f.key)}><Pencil size={18}/> Edit</button>}</div></div>)}</section>
}
