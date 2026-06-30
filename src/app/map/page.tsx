'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Use dynamic import for the map to avoid SSR issues
const Map = dynamic(
  () => import('@/components/Map'),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClWybbiVRgP1VY_aDTvuovpVrmL0TNx0ZP_qyFIHSdt4El9YhxzdBu_aNDoprpJuHIR2SAQSJVLegB14b7Fm5ihgpx8jZiKIXYlqe0wwopo9ko2MvYjmI1dE4CRTZfhffVP5olGkKLtzfftynpC3B5pdKsTPkK8FE-oltL42UKCHGPbjBOZw-iwCnphgsjumm17irMC9fpvfXR5neXtow2ci3MZcP804H_R2c5xp_WB9Uur9xUaUrRATgOKstK7UhWWyYAeS7wCrae')" }}>
      </div>
    )
  }
)

export default function Home() {
  const [issues, setIssues] = useState<any[]>([])
  const [activeIssue, setActiveIssue] = useState<any | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }
  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    fetchSession()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  useEffect(() => {
    const fetchIssues = async () => {
      const { data } = await supabase.from('issues').select('*')
      if (data) {
        setIssues(data)
      }
    }
    fetchIssues()
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden font-body-md text-body-md">
      {/* TopNavBar */}
      <header className="bg-surface dark:bg-surface-container-highest text-primary dark:text-primary-fixed border-b border-on-surface dark:border-outline full-width top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin py-unit max-w-container-max mx-auto h-16">
            <div className="flex items-center gap-8 h-full">
                <Link href="/landing" className="font-display-md text-[32px] text-primary dark:text-primary-fixed tracking-tight uppercase no-underline">
                    COMMUNITY HERO
                </Link>
                <nav className="hidden md:flex gap-6 h-full items-center">
                    <span className="text-secondary dark:text-secondary-container font-bold border-b-2 border-secondary font-mono-label text-[14px] hover:bg-surface-container dark:hover:bg-primary-container transition-colors py-2 px-3 translate-x-0.5 translate-y-0.5 duration-75 cursor-pointer">
                        Map
                    </span>
                    <Link href="/dashboard" className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary font-mono-label text-[14px] hover:bg-surface-container dark:hover:bg-primary-container transition-colors py-2 px-3">
                        Dashboard
                    </Link>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                {user ? (
                    <div className="hidden md:flex items-center gap-4">
                        <div className="font-mono-label text-[14px] uppercase text-primary border border-on-surface py-2 px-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            {user.email?.split('@')[0]}
                        </div>
                        <button 
                            onClick={async () => await supabase.auth.signOut()}
                            className="bg-transparent text-on-surface-variant font-mono-label text-[14px] uppercase hover:text-primary transition-colors py-2 px-2"
                        >
                            Sign out
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className="hidden md:block bg-transparent text-primary font-mono-label text-[14px] uppercase hover:bg-surface-container py-2 px-4 border border-on-surface">
                        Sign in
                    </Link>
                )}
                <a href="/report" className="bg-[#D4622A] text-[#1A1D1A] font-display-md text-[20px] uppercase px-6 py-2 rounded-none hover:translate-x-px hover:translate-y-px transition-transform flex items-center gap-2">
                    Report an Issue
                </a>
            </div>
        </div>
      </header>
      
      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
          
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClWybbiVRgP1VY_aDTvuovpVrmL0TNx0ZP_qyFIHSdt4El9YhxzdBu_aNDoprpJuHIR2SAQSJVLegB14b7Fm5ihgpx8jZiKIXYlqe0wwopo9ko2MvYjmI1dE4CRTZfhffVP5olGkKLtzfftynpC3B5pdKsTPkK8FE-oltL42UKCHGPbjBOZw-iwCnphgsjumm17irMC9fpvfXR5neXtow2ci3MZcP804H_R2c5xp_WB9Uur9xUaUrRATgOKstK7UhWWyYAeS7wCrae')" }}>
          </div>
          <div className="absolute inset-0 z-0">
             <Map issues={issues} onIssueSelect={setActiveIssue} />
          </div>

          {/* Right Sidebar Toggle (when closed) */}
          {!isFiltersOpen && (
              <button 
                  onClick={() => setIsFiltersOpen(true)}
                  className="absolute top-4 right-4 z-20 bg-brand-asphalt text-brand-paper p-3 shadow-[4px_4px_0px_#1A1D1A] border-2 border-brand-paper hover:translate-x-px hover:translate-y-px transition-transform flex items-center gap-2"
              >
                  <span className="material-symbols-outlined">filter_list</span>
                  <span className="font-mono-label text-[14px] uppercase hidden sm:block">Filters</span>
              </button>
          )}

          {/* Right Sidebar: Filter Controls (Ticket Punch-card style) */}
          <aside className={`panel z-10 ${isFiltersOpen ? 'w-80 flex' : 'hidden'} flex-col absolute right-0 top-0 m-4 overflow-y-auto bg-brand-paper border border-brand-asphalt transition-all`} style={{ height: 'calc(100% - 32px)' }}>
              <div className="p-4 perforated-border-bottom border-b-2 border-dotted border-brand-stone flex justify-between items-start">
                  <div>
                      <h2 className="font-display-md text-[20px] uppercase tracking-tight text-brand-asphalt">Filters</h2>
                      <div className="font-mono-data text-[13px] text-brand-stone mt-1">CTRL-ID: F-892</div>
                  </div>
                  <button onClick={() => setIsFiltersOpen(false)} className="text-brand-stone hover:text-brand-asphalt hover:bg-surface-container p-1 transition-colors">
                      <span className="material-symbols-outlined">close_fullscreen</span>
                  </button>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-6">
                  {/* Category Filter */}
                  <fieldset>
                      <legend className="font-mono-label text-[14px] uppercase mb-3 text-brand-stone">Category</legend>
                      <div className="flex flex-col gap-2">
                          {['Potholes', 'Streetlights', 'Graffiti', 'Illegal Dumping'].map(cat => (
                            <label key={cat} className="flex items-center gap-3 cursor-pointer group text-brand-asphalt">
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={selectedCategories.includes(cat)} 
                                    onChange={() => toggleCategory(cat)} 
                                />
                                <div className={`w-4 h-4 border border-brand-asphalt rounded-sm flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-brand-asphalt text-brand-paper' : 'group-hover:bg-surface-container'}`}>
                                    <span className={`material-symbols-outlined text-[12px] ${selectedCategories.includes(cat) ? 'opacity-100' : 'opacity-0'}`}>check</span>
                                </div>
                                <span className="font-mono-label text-[13px]">{cat}</span>
                            </label>
                          ))}
                      </div>
                  </fieldset>
                  {/* Status Filter */}
                  <fieldset className="pt-4 border-t border-brand-stone">
                      <legend className="font-mono-label text-[14px] uppercase mb-3 text-brand-stone">Status</legend>
                      <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 cursor-pointer group">
                              <input defaultChecked className="form-checkbox h-4 w-4 text-brand-asphalt border-brand-asphalt focus:ring-0 rounded-sm" type="checkbox" />
                              <span className="stamp stamp-cone font-mono-label text-[10px] border-2 border-brand-cone text-brand-cone px-2 py-0.5 -rotate-3 mix-blend-multiply opacity-95">REPORTED</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer group">
                              <input defaultChecked className="form-checkbox h-4 w-4 text-brand-asphalt border-brand-asphalt focus:ring-0 rounded-sm" type="checkbox" />
                              <span className="stamp font-mono-label text-[10px] hazard-stripe bg-brand-paper border-2 border-brand-cone text-brand-cone px-2 py-0.5 -rotate-3 mix-blend-multiply opacity-95 bg-[repeating-linear-gradient(45deg,#D4622A,#D4622A_10px,#1A1D1A_10px,#1A1D1A_20px)]">IN PROGRESS</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer group">
                              <input className="form-checkbox h-4 w-4 text-brand-asphalt border-brand-asphalt focus:ring-0 rounded-sm" type="checkbox" />
                              <span className="stamp stamp-verified font-mono-label text-[10px] border-2 border-brand-verified text-brand-verified px-2 py-0.5 -rotate-3 mix-blend-multiply opacity-95">RESOLVED</span>
                          </label>
                      </div>
                  </fieldset>
              </div>
              <div className="p-4 border-t border-brand-asphalt bg-surface-container-high">
                  <button className="w-full bg-brand-asphalt text-brand-paper font-display-md text-[20px] uppercase px-4 py-2 hover:translate-x-px hover:translate-y-px transition-transform">
                      Apply Filters
                  </button>
              </div>
          </aside>

          {/* Detail Panel (Work Order Card) */}
          {activeIssue && (
            <aside className="panel z-10 w-96 flex flex-col m-4 ml-auto shadow-lg relative transform transition-transform duration-300 translate-x-0 bg-brand-paper border border-brand-asphalt text-brand-asphalt" style={{ height: 'calc(100% - 32px)' }}>
                {/* Close Button */}
                <button 
                  onClick={() => setActiveIssue(null)}
                  className="absolute top-4 right-4 text-brand-asphalt hover:bg-surface-container p-1 border border-transparent hover:border-brand-stone z-50">
                    <span className="material-symbols-outlined">close</span>
                </button>
                {/* Card Header */}
                <div className="p-6 perforated-border-bottom border-b-2 border-dotted border-brand-stone relative">
                    <div className="font-mono-label text-[12px] text-brand-stone uppercase mb-1">Work Order ID</div>
                    <div className="font-mono-label text-[20px] tracking-widest truncate max-w-[200px]">#{activeIssue.id.substring(0,8)}</div>
                    <div className="mt-4">
                        <span className="stamp stamp-cone font-mono-label text-[14px] border-2 border-brand-cone text-brand-cone px-2 py-0.5 -rotate-3 mix-blend-multiply opacity-95 uppercase inline-block">{activeIssue.status}</span>
                    </div>
                </div>
                {/* Card Body */}
                <div className="p-0 overflow-y-auto flex-1">
                    {/* Photo */}
                    <div className="w-full h-48 border-b border-brand-asphalt relative">
                        {activeIssue.image_url ? (
                            <img className="w-full h-full object-cover grayscale opacity-90 contrast-125" src={activeIssue.image_url} alt="Issue evidence" />
                        ) : (
                            <div className="w-full h-full bg-surface-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-outline">image</span>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-brand-asphalt text-brand-paper font-mono-data text-[10px] px-1">
                            ATTACHMENT A
                        </div>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        {/* Location details */}
                        <div>
                            <div className="font-mono-label text-[10px] text-brand-stone uppercase mb-1">Location</div>
                            <div className="font-mono-label text-[14px]">{activeIssue.location_name || 'Mapped Location'}</div>
                            <div className="font-mono-data text-[11px] text-brand-asphalt mt-1">LAT: {activeIssue.lat.toFixed(4)} N | LON: {activeIssue.lng.toFixed(4)} W</div>
                        </div>
                        {/* Description */}
                        <div className="pt-4 border-t border-brand-stone">
                            <div className="font-mono-label text-[10px] text-brand-stone uppercase mb-1">Description of Issue</div>
                            <p className="font-body-md text-[16px] leading-relaxed">
                                {activeIssue.description}
                            </p>
                        </div>
                        {/* Verification count */}
                        <div className="pt-4 border-t border-brand-stone flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-brand-stone">group</span>
                                <span className="font-mono-label text-[14px] uppercase text-brand-stone">Citizen Verifications</span>
                            </div>
                            <div className="font-mono-data text-[20px]">0{activeIssue.verification_count || 1}</div>
                        </div>
                    </div>
                </div>
                {/* Card Footer / CTA */}
                <div className="p-6 border-t-[2px] border-brand-asphalt bg-surface-container-high">
                    <Link href={`/issue/${activeIssue.id}`} className="w-full bg-brand-cone text-brand-asphalt font-display-md text-[20px] uppercase px-6 py-3 border border-brand-asphalt hover:translate-x-px hover:translate-y-px transition-transform flex items-center justify-center gap-2 mb-3">
                        <span className="material-symbols-outlined">launch</span>
                        View Full Report
                    </Link>
                </div>
            </aside>
          )}
      </main>
    </div>
  )
}
