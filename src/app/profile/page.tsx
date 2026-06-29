'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      setProfile(profileData)
    }
    fetchUser()
  }, [router, supabase])

  if (!user) return <div className="p-8 text-center bg-asphalt text-paper min-h-screen font-mono-label uppercase flex items-center justify-center">Loading Citizen Data...</div>

  return (
    <div className="bg-surface-container-low text-on-surface antialiased flex flex-col min-h-screen font-body-md text-[16px]">
      {/* TopNavBar */}
      <header className="bg-surface border-b border-on-surface flex justify-between items-center w-full px-6 py-1 h-16 mx-auto relative z-50">
        <Link href="/landing" className="font-display-md text-[32px] text-primary tracking-tight uppercase hover:text-secondary-container transition-colors no-underline">
            COMMUNITY HERO
        </Link>
        <Link href="/" className="font-mono-label text-[14px] text-primary hover:text-secondary-container uppercase flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[18px] mt-[-2px]">arrow_back</span>
            Return to Map
        </Link>
      </header>

      <main className="flex-grow w-full max-w-[800px] mx-auto px-6 py-12 flex flex-col gap-8">
        <header className="w-full border-b border-primary pb-4">
            <h1 className="font-display-lg text-[48px] uppercase text-primary m-0 leading-none">Citizen Profile</h1>
        </header>

        <article className="bg-surface border border-primary shadow-[4px_4px_0px_#757873] relative">
          <div className="px-6 py-4 border-b border-dashed border-primary flex justify-between items-center bg-surface-container-low">
              <div className="font-mono-label text-[14px] text-on-surface-variant uppercase tracking-wider">
                  Identification
              </div>
              <div className="font-mono-label text-[14px] font-bold text-primary">
                  ID-{user.id.substring(0,8).toUpperCase()}
              </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8">
              <div className="flex flex-col gap-1">
                  <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Email Address</span>
                  <span className="font-body-lg text-[18px] text-primary pt-1">{user.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                  <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Clearance Level</span>
                  <span className="font-headline-sm text-[20px] text-primary pt-1 uppercase">{profile?.role || 'Citizen'}</span>
              </div>
              <div className="flex flex-col gap-1">
                  <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Civic Points</span>
                  <span className="font-display-md text-[40px] text-secondary-container pt-2 leading-none">{profile?.points || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                  <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max mb-1">Badge Status</span>
                  <div className="mt-2 inline-flex">
                      <span className="stamp-status !border-verified-green !text-verified-green font-mono-label text-[14px] px-3 py-1 uppercase">{profile?.badge_level || 'Newcomer'}</span>
                  </div>
              </div>
          </div>
          
          <div className="p-6 border-t border-primary bg-surface-container flex justify-end">
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="bg-primary text-surface font-headline-sm text-[20px] uppercase px-6 py-3 border border-transparent hover:bg-secondary-container hover:text-primary transition-colors flex items-center gap-2 rounded-none"
            >
              <span className="material-symbols-outlined">logout</span>
              Revoke Session
            </button>
          </div>
        </article>
      </main>
    </div>
  )
}
