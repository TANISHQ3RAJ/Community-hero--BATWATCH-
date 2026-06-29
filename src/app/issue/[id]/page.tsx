'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

export default function IssueDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [issue, setIssue] = useState<any>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [resolutionFile, setResolutionFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const supabase = createClient()

  const handleDispute = async () => {
    if (isDisputing) return
    setIsDisputing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to dispute an issue.')
        return
      }
      
      const { error } = await supabase.from('issue_verifications').insert({
        issue_id: id,
        user_id: user.id,
        vote: 'dispute'
      })
      
      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          throw new Error('You have already verified or disputed this issue.')
        }
        throw error
      }
      
      const newCount = (issue.dispute_count || 0) + 1
      setIssue({ ...issue, dispute_count: newCount })
    } catch (err: any) {
      alert('Failed to dispute issue: ' + err.message)
    } finally {
      setIsDisputing(false)
    }
  }

  const handleConfirm = async () => {
    if (isConfirming) return
    setIsConfirming(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to confirm an issue.')
        return
      }
      
      const { error } = await supabase.from('issue_verifications').insert({
        issue_id: id,
        user_id: user.id,
        vote: 'confirm'
      })
      
      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          throw new Error('You have already verified this issue.')
        }
        throw error
      }
      
      const newCount = (issue.verification_count || 1) + 1
      setIssue({ ...issue, verification_count: newCount })
    } catch (err: any) {
      alert('Failed to confirm issue: ' + err.message)
    } finally {
      setIsConfirming(false)
    }
  }

  useEffect(() => {
    const fetchIssue = async () => {
      const { data } = await supabase.from('issues').select('*, issue_media(media_url, media_type)').eq('id', id).single()
      if (data) {
        setIssue({
          ...data,
          image_url: data.issue_media?.find((m: any) => m.media_type === 'image' || !m.media_type)?.media_url || data.issue_media?.[0]?.media_url || data.image_url,
          resolution_image_url: data.issue_media?.find((m: any) => m.media_type === 'resolution')?.media_url
        })
      }
    }
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile) setUserRole(profile.role)
      }
    }
    fetchIssue()
    fetchRole()
  }, [id])

  const updateStatus = async (newStatus: string) => {
    if (newStatus === 'resolved') {
      setIsResolving(true)
      return
    }
    
    try {
      const { error } = await supabase.from('issues').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setIssue({ ...issue, status: newStatus })
    } catch (err: any) {
      console.error(err)
      alert('Failed to update status: ' + err.message)
    }
  }

  const submitResolution = async () => {
    setIsUploading(true)
    try {
      let imageUrl = null
      
      if (resolutionFile) {
        const compressed = await imageCompression(resolutionFile, { maxSizeMB: 1, maxWidthOrHeight: 1024 })
        const ext = compressed.name.split('.').pop() || 'jpg'
        const fileName = `resolution-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        
        const { data: uploadData, error: uploadErr } = await supabase
          .storage
          .from('issue_media')
          .upload(fileName, compressed)
          
        if (uploadErr) throw uploadErr
        
        const { data: publicUrlData } = supabase.storage.from('issue_media').getPublicUrl(uploadData.path)
        imageUrl = publicUrlData.publicUrl
        
        await supabase.from('issue_media').insert({
          issue_id: id,
          media_url: imageUrl,
          media_type: 'resolution'
        })
      }
      
      const { error: updateErr } = await supabase.from('issues').update({ status: 'resolved' }).eq('id', id)
      if (updateErr) throw updateErr
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('issue_status_history').insert({
          issue_id: id,
          old_status: issue.status,
          new_status: 'resolved',
          changed_by: user.id,
          note: `Resolved by admin/moderator${imageUrl ? ' with photo proof' : ''}`
        })
      }
      
      setIssue({ ...issue, status: 'resolved', resolution_image_url: imageUrl })
      setIsResolving(false)
      setResolutionFile(null)
    } catch (err: any) {
      console.error(err)
      alert('Failed to resolve issue: ' + (err.message || err))
    } finally {
      setIsUploading(false)
    }
  }

  if (!issue) return null

  return (
    <div className="bg-surface-container-low text-on-surface antialiased flex flex-col min-h-screen font-body-md text-[16px] selection:bg-secondary-container selection:text-primary">
      {/* TopNavBar */}
      <header className="bg-surface dark:bg-surface-container-highest flex justify-between items-center w-full px-6 py-1 max-w-[1200px] mx-auto border-b border-on-surface dark:border-outline docked full-width top-0 z-50 h-16">
          <div className="flex items-center gap-8 h-full">
              <Link href="/landing" className="font-display-md text-[32px] text-primary dark:text-primary-fixed tracking-tight uppercase hover:text-secondary-container transition-colors no-underline">
                  COMMUNITY HERO
              </Link>
              <nav className="hidden md:flex gap-6 h-full items-center">
                  <Link href="/" className="font-mono-label text-[14px] text-on-surface-variant dark:text-on-surface-variant hover:text-primary hover:bg-surface-container dark:hover:bg-primary-container transition-colors px-2 py-1">Map</Link>
                  <Link href="/dashboard" className="font-mono-label text-[14px] text-on-surface-variant dark:text-on-surface-variant hover:text-primary hover:bg-surface-container dark:hover:bg-primary-container transition-colors px-2 py-1">Dashboard</Link>
              </nav>
          </div>
          <div className="flex items-center gap-4">
              <Link href="/report" className="bg-primary text-on-primary font-headline-sm text-[20px] uppercase px-4 py-1.5 border border-primary hover:bg-secondary-container hover:text-primary transition-colors rounded-none btn-municipal">
                  Report an Issue
              </Link>
          </div>
      </header>
      
      {/* Main Canvas */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-8 md:py-12 flex flex-col gap-8">
          {/* Navigation Breadcrumb / Back */}
          <div className="w-full">
              <Link href="/" className="inline-flex items-center font-mono-label text-[14px] text-on-surface-variant hover:text-primary transition-colors uppercase group">
                  <span className="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_left_alt</span>
                  Back to Map
              </Link>
          </div>
          
          {/* Hero Title */}
          <header className="w-full border-b border-primary pb-4 flex justify-between items-end gap-4 flex-wrap">
              <h1 className="font-display-lg text-[48px] uppercase text-primary m-0 leading-none">{issue.category.replace('_', ' ')}</h1>
              {userRole === 'admin' || userRole === 'moderator' ? (
                  <div className="flex items-center gap-2 mb-2 md:mb-0">
                      <select 
                          className="font-mono-label text-[14px] uppercase px-3 py-1 bg-surface-container border border-primary text-primary focus:ring-0 focus:outline-none cursor-pointer"
                          value={issue.status}
                          onChange={(e) => updateStatus(e.target.value)}
                      >
                          <option value="reported">Reported</option>
                          <option value="under_review">Under Review</option>
                          <option value="verified">Verified</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                          <option value="duplicate">Duplicate</option>
                      </select>
                  </div>
              ) : (
                  <div className="stamp-verified font-mono-label text-[14px] uppercase px-3 py-1 font-bold whitespace-nowrap mb-2 md:mb-0">
                      {issue.status}
                  </div>
              )}
          </header>
          
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (Content & Meta) */}
              <div className="md:col-span-8 flex flex-col gap-8">
                  {/* Photo Gallery */}
                  <section className="w-full flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      <div className="min-w-[70%] md:min-w-0 md:w-2/3 flex-shrink-0 border border-primary bg-surface-container aspect-[4/3] relative">
                          {issue.image_url ? (
                              <img className="w-full h-full object-cover" src={issue.image_url} alt="Primary" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-4xl text-outline">image</span>
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2 min-w-[30%] md:min-w-0 md:w-1/3 flex-shrink-0">
                          {issue.resolution_image_url ? (
                              <div className="border border-primary bg-surface-container h-full relative flex items-center justify-center">
                                  <img className="w-full h-full object-cover" src={issue.resolution_image_url} alt="Resolution" />
                                  <div className="absolute bottom-0 right-0 bg-brand-verified text-brand-paper px-2 py-1 text-[10px] font-mono-data font-bold uppercase mix-blend-multiply border-l border-t border-brand-verified">RESOLVED PROOF</div>
                              </div>
                          ) : (
                              <div className="border border-primary bg-surface-container h-full relative flex items-center justify-center">
                                  <span className="material-symbols-outlined text-outline">add_a_photo</span>
                              </div>
                          )}
                          <div className="border border-primary bg-surface-container h-full relative flex items-center justify-center">
                              <span className="material-symbols-outlined text-outline">add_a_photo</span>
                          </div>
                      </div>
                  </section>
                  
                  {/* Ticket-Styled Metadata Block */}
                  <article className="bg-surface border border-primary relative">
                      <div className="px-6 py-4 border-b border-dashed border-primary flex justify-between items-center bg-surface-container-low">
                          <div className="font-mono-label text-[14px] text-on-surface-variant uppercase tracking-wider">
                              Work Order
                          </div>
                          <div className="font-mono-label text-[14px] font-bold text-primary">
                              #CH-{issue.id.substring(0,8).toUpperCase()}
                          </div>
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                          <div className="flex flex-col gap-1">
                              <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Category</span>
                              <span className="font-body-lg text-[18px] text-primary pt-1">{issue.category.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Location</span>
                              <span className="font-body-lg text-[18px] text-primary pt-1 flex items-start gap-1">
                                  <span className="material-symbols-outlined text-[18px] mt-0.5">location_on</span>
                                  LAT: {issue.lat.toFixed(4)} N | LON: {issue.lng.toFixed(4)} W
                              </span>
                          </div>
                          <div className="flex flex-col gap-1 sm:col-span-2">
                              <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Summary</span>
                              <p className="font-body-lg text-[18px] text-primary pt-1 max-w-prose">
                                  {issue.description}
                              </p>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Severity</span>
                              <span className="font-headline-sm text-[20px] text-secondary-container uppercase pt-1 flex items-center gap-2">
                                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                  {issue.severity || 'Medium'} Priority
                              </span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="font-mono-data text-[13px] text-outline uppercase border-b-2 border-primary pb-1 w-max">Date Reported</span>
                              <span className="font-mono-data text-[13px] text-primary pt-1 text-base">
                                  {new Date(issue.created_at).toLocaleString()}
                              </span>
                          </div>
                      </div>
                  </article>
                  
                  {/* Comments Section */}
                  <section className="mt-4 border-t-2 border-primary pt-6">
                      <h3 className="font-display-md text-[32px] uppercase text-primary mb-6">Field Notes</h3>
                      
                      {/* Comment Input */}
                      <div className="flex gap-4 mb-8">
                          <div className="w-10 h-10 rounded-none border border-primary bg-surface-container flex-shrink-0 flex items-center justify-center">
                              <span className="material-symbols-outlined text-outline">person</span>
                          </div>
                          <div className="flex-grow flex flex-col">
                              <input className="w-full bg-transparent border-0 border-b-2 border-primary rounded-none px-0 py-2 font-mono-data text-[13px] text-primary placeholder:text-outline focus:ring-0 focus:border-secondary-container transition-colors" placeholder="ENTER NEW OBSERVATION..." type="text" />
                              <div className="flex justify-end mt-2">
                                  <button className="font-mono-label text-[14px] uppercase text-primary hover:text-secondary-container transition-colors">Submit</button>
                              </div>
                          </div>
                      </div>
                      
                      {/* Comment List (Dense) */}
                      <ul className="flex flex-col border-t border-outline">
                          <li className="py-4 border-b border-outline flex gap-4 items-start">
                              <div className="w-8 h-8 rounded-none border border-primary overflow-hidden flex-shrink-0 bg-surface-container">
                              </div>
                              <div className="flex flex-col">
                                  <div className="flex items-baseline gap-2 mb-1">
                                      <span className="font-mono-label text-[14px] text-primary">CITIZEN-{issue.reporter_id?.substring(0,8) || 'ANON'}</span>
                                      <span className="font-mono-data text-[13px] text-outline text-xs">{new Date(issue.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="font-body-md text-[16px] text-on-surface-variant">Issue initially logged in the system.</p>
                              </div>
                          </li>
                          {issue.status === 'verified' && (
                              <li className="py-4 border-b border-outline flex gap-4 items-start">
                                  <div className="w-8 h-8 rounded-none border border-primary bg-primary flex items-center justify-center flex-shrink-0 text-surface font-mono-label">
                                      CW
                                  </div>
                                  <div className="flex flex-col">
                                      <div className="flex items-baseline gap-2 mb-1">
                                          <span className="font-mono-label text-[14px] text-secondary-container">CITY_WORKS_BOT</span>
                                          <span className="font-mono-data text-[13px] text-outline text-xs">{new Date(issue.updated_at).toLocaleString()}</span>
                                      </div>
                                      <p className="font-body-md text-[16px] text-primary font-medium">STATUS UPDATED TO VERIFIED BASED ON COMMUNITY CONSENSUS THRESHOLD.</p>
                                  </div>
                              </li>
                          )}
                      </ul>
                  </section>
              </div>
              
              {/* Right Column (Status & Actions) */}
              <div className="md:col-span-4 flex flex-col gap-8">
                  {/* Community Verification Action Box */}
                  <section className="bg-primary text-surface p-6 border border-primary shadow-[4px_4px_0px_#757873]">
                      <h2 className="font-headline-sm text-[20px] uppercase text-secondary-container mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_vote</span>
                          Community Verification
                      </h2>
                      <div className="flex items-end gap-6 mb-6 pb-6 border-b border-surface-tint border-dashed">
                          <div className="flex flex-col">
                              <span className="font-display-lg text-[48px] leading-none text-surface">{issue.verification_count || 1}</span>
                              <span className="font-mono-data text-[13px] uppercase text-outline mt-1">Confirmed</span>
                          </div>
                          <div className="flex flex-col">
                              <span className="font-display-md text-[32px] leading-none text-surface-tint">{issue.dispute_count || 0}</span>
                              <span className="font-mono-data text-[13px] uppercase text-surface-tint mt-1">Disputed</span>
                          </div>
                      </div>
                      <div className="flex flex-col gap-3">
                          <button 
                              onClick={handleConfirm}
                              disabled={isConfirming || isDisputing}
                              className="w-full bg-secondary-container text-primary font-headline-sm text-[20px] uppercase py-3 border border-transparent hover:bg-surface hover:text-primary transition-colors btn-municipal flex justify-center items-center gap-2 rounded-none disabled:opacity-50">
                              <span className="material-symbols-outlined">check_circle</span>
                              {isConfirming ? 'Confirming...' : 'Confirm Issue'}
                          </button>
                          <button 
                              onClick={handleDispute}
                              disabled={isConfirming || isDisputing}
                              className="w-full bg-transparent text-surface font-headline-sm text-[20px] uppercase py-3 border border-surface hover:bg-surface hover:text-primary transition-colors btn-municipal rounded-none disabled:opacity-50">
                              {isDisputing ? 'Disputing...' : 'Dispute'}
                          </button>
                      </div>
                  </section>
                  
                  {/* Punch-Card Status Timeline */}
                  <section className="bg-surface border border-primary">
                      <div className="px-4 py-3 bg-primary border-b border-primary">
                          <h3 className="font-mono-label text-[14px] text-surface uppercase tracking-wider m-0">Processing Route</h3>
                      </div>
                      <div className="flex flex-col p-4 relative">
                          <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-outline-variant z-0"></div>
                          
                          {/* 1. Reported */}
                          <div className="relative z-10 flex gap-4 items-start mb-6">
                              <div className={`w-8 h-8 rounded-full bg-surface border-2 ${['reported', 'under_review', 'verified', 'in_progress', 'resolved', 'rejected', 'duplicate'].includes(issue.status) ? 'border-secondary-container' : 'border-outline'} flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_0_4px_#fdf9f0]`}>
                                  {issue.status !== 'reported' && <span className="material-symbols-outlined text-secondary-container text-[18px]">check</span>}
                                  {issue.status === 'reported' && <div className="w-3 h-3 rounded-full bg-secondary-container"></div>}
                              </div>
                              <div className={`flex flex-col bg-surface border-2 ${issue.status === 'reported' ? 'border-secondary-container shadow-[2px_2px_0px_#fc8046]' : 'border-outline'} w-full p-3 border-l-4`}>
                                  <span className="font-headline-sm text-[20px] text-on-surface uppercase leading-none">Reported</span>
                              </div>
                          </div>
                          
                          {/* 2. Under Review */}
                          <div className="relative z-10 flex gap-4 items-start mb-6">
                              <div className={`w-8 h-8 rounded-full bg-surface border-2 ${['under_review', 'verified', 'in_progress', 'resolved', 'rejected', 'duplicate'].includes(issue.status) ? 'border-secondary-container' : 'border-outline'} flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_0_4px_#fdf9f0]`}>
                                  {['verified', 'in_progress', 'resolved', 'rejected', 'duplicate'].includes(issue.status) && <span className="material-symbols-outlined text-secondary-container text-[18px]">check</span>}
                                  {issue.status === 'under_review' && <div className="w-3 h-3 rounded-full bg-secondary-container"></div>}
                              </div>
                              <div className={`flex flex-col bg-surface border-2 ${issue.status === 'under_review' ? 'border-secondary-container shadow-[2px_2px_0px_#fc8046]' : 'border-outline'} w-full p-3 border-l-4 ${!['under_review', 'verified', 'in_progress', 'resolved', 'rejected', 'duplicate'].includes(issue.status) ? 'opacity-50' : ''}`}>
                                  <span className="font-headline-sm text-[20px] text-on-surface uppercase leading-none">Under Review</span>
                              </div>
                          </div>

                          {/* 3. Verified */}
                          <div className="relative z-10 flex gap-4 items-start mb-6">
                              <div className={`w-8 h-8 rounded-full bg-surface border-2 ${['verified', 'in_progress', 'resolved'].includes(issue.status) ? 'border-secondary-container' : 'border-outline'} flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_0_4px_#fdf9f0]`}>
                                  {['in_progress', 'resolved'].includes(issue.status) && <span className="material-symbols-outlined text-secondary-container text-[18px]">check</span>}
                                  {issue.status === 'verified' && <div className="w-3 h-3 rounded-full bg-secondary-container"></div>}
                              </div>
                              <div className={`flex flex-col bg-surface border-2 ${issue.status === 'verified' ? 'border-secondary-container shadow-[2px_2px_0px_#fc8046]' : 'border-outline'} w-full p-3 border-l-4 ${!['verified', 'in_progress', 'resolved'].includes(issue.status) ? 'opacity-50' : ''}`}>
                                  <span className="font-headline-sm text-[20px] text-primary uppercase leading-none">Verified</span>
                              </div>
                          </div>
                          
                          {/* 4. In Progress */}
                          <div className="relative z-10 flex gap-4 items-start mb-6">
                              <div className={`w-8 h-8 rounded-full bg-surface border-2 ${['in_progress', 'resolved'].includes(issue.status) ? 'border-secondary-container' : 'border-outline'} flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_0_4px_#fdf9f0]`}>
                                  {issue.status === 'resolved' && <span className="material-symbols-outlined text-secondary-container text-[18px]">check</span>}
                                  {issue.status === 'in_progress' && <div className="w-3 h-3 rounded-full bg-secondary-container"></div>}
                              </div>
                              <div className={`flex flex-col bg-surface border-2 ${issue.status === 'in_progress' ? 'border-secondary-container shadow-[2px_2px_0px_#fc8046]' : 'border-outline'} w-full p-3 border-l-4 ${!['in_progress', 'resolved'].includes(issue.status) ? 'opacity-50' : ''}`}>
                                  <span className="font-headline-sm text-[20px] text-on-surface uppercase leading-none">In Progress</span>
                              </div>
                          </div>
                          
                          {/* 5. Terminal State (Resolved / Rejected / Duplicate) */}
                          <div className="relative z-10 flex gap-4 items-start">
                              <div className={`w-8 h-8 rounded-full bg-surface border-2 ${['resolved', 'rejected', 'duplicate'].includes(issue.status) ? 'border-secondary-container' : 'border-outline'} flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_0_4px_#fdf9f0]`}>
                                  {['resolved', 'rejected', 'duplicate'].includes(issue.status) && <div className="w-3 h-3 rounded-full bg-secondary-container"></div>}
                              </div>
                              <div className={`flex flex-col bg-surface border-2 ${['resolved', 'rejected', 'duplicate'].includes(issue.status) ? 'border-secondary-container shadow-[2px_2px_0px_#fc8046]' : 'border-outline'} w-full p-3 border-l-4 ${!['resolved', 'rejected', 'duplicate'].includes(issue.status) ? 'opacity-50' : ''}`}>
                                  <span className="font-headline-sm text-[20px] text-on-surface uppercase leading-none">
                                    {['rejected', 'duplicate'].includes(issue.status) ? issue.status : 'Resolved'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </section>
              </div>
          </div>
      </main>

      {/* Resolution Modal */}
      {isResolving && (
        <div className="fixed inset-0 bg-brand-asphalt/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-paper border-[3px] border-brand-asphalt shadow-[8px_8px_0px_#8B8578] max-w-md w-full p-8 relative">
            <h2 className="font-display-md text-[32px] uppercase mb-4 text-brand-asphalt leading-none">Resolve Issue</h2>
            <p className="font-mono-data text-[14px] text-brand-stone mb-6">
              You are marking this issue as resolved. You can optionally upload a photo as proof of the repair.
            </p>
            
            <div className="mb-6">
              <label className="block font-mono-label text-[14px] uppercase text-brand-asphalt mb-2">Proof of Resolution (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => e.target.files && setResolutionFile(e.target.files[0])}
                className="block w-full font-mono-data text-[14px] text-brand-asphalt
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-none file:border-2 file:border-brand-asphalt
                  file:font-mono-label file:uppercase file:text-[12px]
                  file:bg-brand-paper file:text-brand-asphalt
                  hover:file:bg-brand-asphalt hover:file:text-brand-paper
                  transition-colors cursor-pointer
                "
              />
              {resolutionFile && (
                <div className="mt-3 font-mono-data text-[12px] text-brand-cone uppercase border-l-2 border-brand-cone pl-2">
                  SELECTED: {resolutionFile.name}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t-2 border-dashed border-brand-stone">
              <button 
                onClick={() => {
                  setIsResolving(false)
                  setResolutionFile(null)
                }}
                disabled={isUploading}
                className="px-6 py-2 font-mono-label text-[14px] uppercase border-2 border-brand-asphalt text-brand-asphalt hover:bg-brand-asphalt hover:text-brand-paper transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitResolution}
                disabled={isUploading}
                className="px-6 py-2 font-mono-label text-[14px] uppercase bg-brand-cone text-brand-paper border-2 border-brand-cone hover:bg-brand-paper hover:text-brand-cone transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
