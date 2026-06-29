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

const CATEGORY_MAP = [
  { id: 'pothole', label: 'Potholes' },
  { id: 'streetlight', label: 'Streetlights' },
  { id: 'waste_management', label: 'Waste Mgmt' },
  { id: 'water_leakage', label: 'Water Leakage' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'other', label: 'Other' },
]

const STATUS_MAP = [
  { id: 'reported', label: 'REPORTED', style: 'stamp-cone text-brand-cone border-brand-cone' },
  { id: 'under_review', label: 'UNDER REVIEW', style: 'stamp-cone text-brand-cone border-brand-cone' },
  { id: 'verified', label: 'VERIFIED', style: 'stamp-cone text-brand-cone border-brand-cone' },
  { id: 'in_progress', label: 'IN PROGRESS', style: 'hazard-stripe bg-brand-paper border-brand-cone text-brand-cone bg-[repeating-linear-gradient(45deg,#D4622A,#D4622A_10px,#1A1D1A_10px,#1A1D1A_20px)]' },
  { id: 'resolved', label: 'RESOLVED', style: 'stamp-verified border-brand-verified text-brand-verified' },
  { id: 'rejected', label: 'REJECTED', style: 'stamp-cone text-brand-asphalt border-brand-asphalt' },
  { id: 'duplicate', label: 'DUPLICATE', style: 'stamp-cone text-brand-asphalt border-brand-asphalt' }
]

export default function Home() {
  const [issues, setIssues] = useState<any[]>([])
  const [activeIssue, setActiveIssue] = useState<any | null>(null)
  const [isFilterMinimized, setIsFilterMinimized] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORY_MAP.map(c => c.id))
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(STATUS_MAP.map(c => c.id))
  
  const supabase = createClient()

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const toggleStatus = (id: string) => {
    setSelectedStatuses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const filteredIssues = issues.filter(issue => 
    selectedCategories.includes(issue.category) && 
    selectedStatuses.includes(issue.status)
  )

  useEffect(() => {
    const fetchIssues = async () => {
      const { data } = await supabase.from('issues').select('*, issue_media(media_url)')
      if (data) {
        const issuesWithMedia = data.map((issue: any) => ({
          ...issue,
          image_url: issue.issue_media?.[0]?.media_url || issue.image_url
        }))
        setIssues(issuesWithMedia)
      }
    }
    fetchIssues()
    
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
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
              <nav className="flex items-center gap-4">
                  {user ? (
                      <Link href="/profile" className="font-mono-label text-[14px] uppercase border-2 border-brand-asphalt px-4 py-1.5 hover:bg-brand-asphalt hover:text-brand-paper transition-colors">
                          Profile
                      </Link>
                  ) : (
                      <Link href="/login" className="font-mono-label text-[14px] uppercase border-2 border-brand-asphalt px-4 py-1.5 hover:bg-brand-asphalt hover:text-brand-paper transition-colors">
                          Log In
                      </Link>
                  )}

                  <Link href="/report" className="font-mono-label text-[14px] bg-brand-cone text-brand-paper border-2 border-brand-cone uppercase px-4 py-1.5 hover:bg-brand-paper hover:text-brand-cone transition-colors">
                      Report an Issue
                  </Link>
              </nav>
        </div>
      </header>
      
      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
          
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClWybbiVRgP1VY_aDTvuovpVrmL0TNx0ZP_qyFIHSdt4El9YhxzdBu_aNDoprpJuHIR2SAQSJVLegB14b7Fm5ihgpx8jZiKIXYlqe0wwopo9ko2MvYjmI1dE4CRTZfhffVP5olGkKLtzfftynpC3B5pdKsTPkK8FE-oltL42UKCHGPbjBOZw-iwCnphgsjumm17irMC9fpvfXR5neXtow2ci3MZcP804H_R2c5xp_WB9Uur9xUaUrRATgOKstK7UhWWyYAeS7wCrae')" }}>
          </div>
          <div className="absolute inset-0 z-0">
             <Map issues={filteredIssues} onIssueSelect={setActiveIssue} />
          </div>

          {/* Right Sidebar: Filter Controls (Ticket Punch-card style) */}
          <aside 
            className={`panel z-10 flex flex-col bg-brand-paper border border-brand-asphalt shadow-lg transition-all ${isFilterMinimized ? 'h-auto w-auto self-end m-4 ml-auto' : 'w-80 overflow-y-auto m-4 ml-auto'}`} 
            style={!isFilterMinimized ? { height: 'calc(100% - 32px)' } : {}}
          >
              {isFilterMinimized ? (
                <button 
                  onClick={() => setIsFilterMinimized(false)}
                  className="p-3 text-brand-asphalt hover:bg-surface-container flex items-center justify-center font-mono-label text-[14px] uppercase gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined">filter_list</span>
                  Filters
                </button>
              ) : (
                <>
                  <div className="p-4 perforated-border-bottom border-b-2 border-dotted border-brand-stone flex justify-between items-start">
                      <div>
                          <h2 className="font-display-md text-[20px] uppercase tracking-tight text-brand-asphalt">Filters</h2>
                          <div className="font-mono-data text-[13px] text-brand-stone mt-1">CTRL-ID: F-892</div>
                      </div>
                      <button 
                        onClick={() => setIsFilterMinimized(true)}
                        className="text-brand-asphalt hover:bg-surface-container p-1 border border-transparent hover:border-brand-stone -mr-2 -mt-2 transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-6">
                  {/* Category Filter */}
                  <fieldset>
                      <div className="flex justify-between items-center mb-3">
                          <legend className="font-mono-label text-[14px] uppercase text-brand-stone">Category</legend>
                          <button 
                            onClick={() => selectedCategories.length === CATEGORY_MAP.length ? setSelectedCategories([]) : setSelectedCategories(CATEGORY_MAP.map(c => c.id))}
                            className="font-mono-label text-[10px] uppercase text-brand-asphalt hover:text-brand-cone transition-colors px-2 py-0.5 border border-brand-stone/30 hover:border-brand-cone"
                          >
                            {selectedCategories.length === CATEGORY_MAP.length ? 'Deselect All' : 'Select All'}
                          </button>
                      </div>
                      <div className="flex flex-col gap-2">
                          {CATEGORY_MAP.map(cat => {
                            const isSelected = selectedCategories.includes(cat.id)
                            return (
                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group text-brand-asphalt" onClick={() => toggleCategory(cat.id)}>
                                <div className="w-4 h-4 border border-brand-asphalt rounded-sm group-hover:bg-surface-container flex items-center justify-center">
                                    <span className={`material-symbols-outlined text-[12px] ${isSelected ? 'opacity-100' : 'opacity-0'}`}>check</span>
                                </div>
                                <span className="font-mono-label text-[13px]">{cat.label}</span>
                            </label>
                          )})}
                      </div>
                  </fieldset>
                  {/* Status Filter */}
                  <fieldset className="pt-4 border-t border-brand-stone">
                      <legend className="font-mono-label text-[14px] uppercase mb-3 text-brand-stone">Status</legend>
                      <div className="flex flex-col gap-3">
                          {STATUS_MAP.map(status => (
                            <label key={status.id} className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                  checked={selectedStatuses.includes(status.id)} 
                                  onChange={() => toggleStatus(status.id)}
                                  className="form-checkbox h-4 w-4 text-brand-asphalt border-brand-asphalt focus:ring-0 rounded-sm" 
                                  type="checkbox" 
                                />
                                <span className={`stamp font-mono-label text-[10px] border-2 px-2 py-0.5 -rotate-3 mix-blend-multiply opacity-95 ${status.style}`}>{status.label}</span>
                            </label>
                          ))}
                      </div>
                  </fieldset>
              </div>
                  <div className="p-4 border-t border-brand-asphalt bg-surface-container-high">
                      <button 
                        onClick={() => setIsFilterMinimized(true)}
                        className="w-full bg-brand-asphalt text-brand-paper font-display-md text-[20px] uppercase px-4 py-2 hover:translate-x-px hover:translate-y-px transition-transform">
                          Apply Filters
                      </button>
                  </div>
                </>
              )}
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
