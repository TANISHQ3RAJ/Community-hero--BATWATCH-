'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .neq('status', 'resolved')
      .neq('status', 'rejected')
      .order('created_at', { ascending: false })
    
    if (data) setIssues(data)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?type=gov')
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        
      if (!profile || !['moderator', 'admin'].includes(profile.role)) {
        alert('Access denied. You must be a moderator.')
        router.push('/')
        return
      }
      
      setUser(session.user)
      await fetchIssues()
      setLoading(false)
    }
    
    init()
  }, [router, supabase])

  if (loading) return (
    <div className="min-h-screen bg-brand-asphalt flex items-center justify-center">
      <div className="font-display-lg text-brand-paper text-[48px] animate-pulse">LOADING...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-asphalt text-brand-paper font-body-md relative selection:bg-brand-cone selection:text-brand-asphalt">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClWybbiVRgP1VY_aDTvuovpVrmL0TNx0ZP_qyFIHSdt4El9YhxzdBu_aNDoprpJuHIR2SAQSJVLegB14b7Fm5ihgpx8jZiKIXYlqe0wwopo9ko2MvYjmI1dE4CRTZfhffVP5olGkKLtzfftynpC3B5pdKsTPkK8FE-oltL42UKCHGPbjBOZw-iwCnphgsjumm17irMC9fpvfXR5neXtow2ci3MZcP804H_R2c5xp_WB9Uur9xUaUrRATgOKstK7UhWWyYAeS7wCrae')" }}>
      </div>
      
      <div className="max-w-[1200px] mx-auto p-6 md:p-12 relative z-10">
        <header className="flex flex-wrap justify-between items-end gap-6 border-b-2 border-brand-paper pb-6 mb-12">
          <div>
            <h1 className="font-display-lg text-[64px] uppercase leading-none tracking-tight">Triage Queue</h1>
            <div className="font-mono-data text-[14px] text-brand-stone mt-2 uppercase tracking-widest">CITY WORKS DEPT. // ACTIVE ISSUES</div>
          </div>
          <Link href="/" className="inline-flex items-center font-mono-label text-[14px] text-brand-stone hover:text-brand-cone transition-colors uppercase group pb-2">
            <span className="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_left_alt</span>
            Return to Map
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map(issue => (
            <Link href={`/issue/${issue.id}`} key={issue.id} className="block group">
              <article className="bg-brand-paper border-[3px] border-brand-asphalt shadow-[8px_8px_0px_#8B8578] h-full flex flex-col group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:shadow-[4px_4px_0px_#8B8578] transition-all">
                <div className="p-4 border-b-[3px] border-brand-asphalt flex justify-between items-center bg-brand-stone/10">
                  <span className="font-mono-data text-[12px] text-brand-asphalt uppercase font-bold px-2 py-1 bg-brand-cone border border-brand-asphalt">
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className="font-mono-data text-[10px] text-brand-asphalt/50">
                    #{issue.id.substring(0,8).toUpperCase()}
                  </span>
                </div>
                
                <div className="p-6 flex-grow flex flex-col gap-4">
                  <h3 className="font-display-md text-[24px] uppercase text-brand-asphalt leading-tight line-clamp-2">
                    {issue.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t-2 border-dotted border-brand-stone flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono-data text-[10px] text-brand-stone uppercase">Category</span>
                      <span className="font-mono-label text-[12px] text-brand-asphalt uppercase">{issue.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
          
          {issues.length === 0 && (
            <div className="col-span-full py-24 text-center border-4 border-dashed border-brand-stone/30">
              <span className="material-symbols-outlined text-[64px] text-brand-stone mb-4">task_alt</span>
              <h3 className="font-display-md text-[24px] text-brand-paper uppercase">Queue is empty</h3>
              <p className="font-mono-data text-[14px] text-brand-stone uppercase mt-2">All active issues have been processed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
