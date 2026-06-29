'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import { categorizeIssueWithAI } from '@/app/actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [aiData, setAiData] = useState<{ category: string, severity: string, description: string } | null>(null)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocationError(err.message)
      )
    } else {
      setLocationError('Geolocation not supported')
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    
    // Process AI
    setIsProcessingAI(true)
    try {
      const compressed = await imageCompression(selected, { maxSizeMB: 1, maxWidthOrHeight: 1024 })
      const ext = compressed.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      
      const { data: uploadData, error: uploadErr } = await supabase
        .storage
        .from('issue_media')
        .upload(fileName, compressed)
        
      if (uploadErr) throw uploadErr
      
      const { data: publicUrlData } = supabase.storage.from('issue_media').getPublicUrl(uploadData.path)
      const imageUrl = publicUrlData.publicUrl
      
      const aiResult = await categorizeIssueWithAI(imageUrl)
      if (aiResult?.success && aiResult.data) {
        setAiData(aiResult.data)
        setCategory(aiResult.data.category)
        setDescription(aiResult.data.description)
        setTitle(`Reported ${aiResult.data.category.replace('_', ' ')}`)
      } else if (aiResult?.error) {
        throw new Error(aiResult.error)
      }
      
      (window as any).__uploadedImageUrl = imageUrl
      
    } catch (error: any) {
      console.error('Error processing image:', error)
      alert(`Failed to process image with AI: ${error.message || error}`)
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleSubmit = async () => {
    if (!location) {
      alert('We need your location to report the issue.')
      return
    }
    
    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in to report an issue. Your session may have expired.')
      setIsSubmitting(false)
      return
    }
    
    try {
      const { data: issue, error: issueError } = await supabase.from('issues').insert({
        reporter_id: user?.id,
        title,
        description,
        category,
        ai_category: aiData?.category || null,
        severity: aiData?.severity || 'low',
        status: 'reported',
        lat: location.lat,
        lng: location.lng
      }).select().single()
      
      if (issueError) throw issueError
      
      const imageUrl = (window as any).__uploadedImageUrl
      if (imageUrl) {
        await supabase.from('issue_media').insert({
          issue_id: issue.id,
          media_url: imageUrl,
          media_type: 'image'
        })
      }
      
      router.push('/')
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-body-md text-[16px] antialiased bg-asphalt text-paper">
      <header className="bg-paper text-asphalt flex justify-between items-center w-full px-6 py-1 border-b border-asphalt relative z-10 sticky top-0">
        <Link href="/landing" className="font-display-md text-[32px] leading-[1.1] uppercase tracking-tight hover:text-cone-orange transition-colors">
            COMMUNITY HERO
        </Link>
        <Link href="/" className="font-display-md text-[32px] leading-[1.1] uppercase tracking-tight flex items-center gap-2 hover:text-cone-orange transition-colors">
          <span className="material-symbols-outlined">close</span>
          <span className="hidden md:inline">CANCEL</span>
        </Link>
      </header>

      <main className="flex-grow w-full max-w-[1200px] mx-auto flex flex-col md:flex-row relative">
        <section className="w-full md:w-3/5 p-6 flex flex-col gap-6 bg-asphalt">
          <div className="mb-8">
            <h1 className="font-display-lg text-[48px] leading-[1.1] text-paper uppercase mb-2">Report an Issue</h1>
            <p className="font-mono-label text-[14px] text-surface-variant">Step 1 of 4: Documentation</p>
          </div>
          
          <div className="bg-paper p-6 border border-asphalt relative">
            <div className="absolute top-0 left-0 w-full h-2 hazard-stripe"></div>
            <h2 className="font-display-md text-[32px] leading-[1.1] text-asphalt uppercase mb-4 mt-2">1. Photographic Evidence</h2>
            
            <div 
              className="border-2 border-dashed border-asphalt p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container transition-colors relative overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[48px] text-asphalt mb-4 group-hover:-translate-y-1 transition-transform">add_a_photo</span>
                  <span className="font-mono-label text-[14px] text-asphalt text-center">DRAG & DROP IMAGE HERE<br/>OR CLICK TO BROWSE</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
            </div>
          </div>

          <div className={`bg-paper p-6 border border-asphalt relative transition-opacity ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="font-display-md text-[32px] leading-[1.1] text-asphalt uppercase mb-4">2. Categorization</h2>
            <div className="flex flex-col gap-4">
              <label className="font-mono-label text-[14px] text-asphalt flex flex-col gap-1 w-full">
                CLASSIFICATION CODE
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  disabled={isProcessingAI}
                  className="form-input-line font-mono-data text-[13px] text-asphalt bg-transparent mt-1"
                >
                  <option value="pending" disabled>Pending scan...</option>
                  <option value="pothole">Pothole</option>
                  <option value="water_leakage">Water Leakage</option>
                  <option value="streetlight">Streetlight</option>
                  <option value="waste_management">Waste Management</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="font-mono-label text-[14px] text-asphalt flex flex-col gap-1 w-full mt-4">
                TITLE
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="form-input-line font-mono-data text-[13px] text-asphalt bg-transparent mt-1"
                />
              </label>

              <label className="font-mono-label text-[14px] text-asphalt flex flex-col gap-1 w-full mt-4">
                NOTES
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="form-input-line font-mono-data text-[13px] text-asphalt bg-transparent mt-1"
                />
              </label>
            </div>
            <div className="mt-4">
              {isProcessingAI ? (
                <span className="stamp-status font-mono-label text-[14px] !text-asphalt !border-asphalt opacity-50">SCANNING...</span>
              ) : aiData ? (
                <span className="stamp-status font-mono-label text-[14px] !text-verified-green !border-verified-green">AI SCANNED: {aiData.severity}</span>
              ) : (
                <span className="stamp-status font-mono-label text-[14px]">AWAITING IMAGE</span>
              )}
            </div>
          </div>

          <div className="bg-paper p-6 border border-asphalt opacity-50 pointer-events-none flex justify-between items-center">
             <h2 className="font-display-md text-[32px] leading-[1.1] text-asphalt uppercase">3. Location Data</h2>
             <span className="font-mono-data text-asphalt">
               {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : locationError || 'ACQUIRING...'}
             </span>
          </div>

          <div className="mt-8 flex justify-end pb-12 md:pb-0">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || isProcessingAI || !file || !location}
              className="bg-cone-orange text-asphalt font-display-md text-[32px] leading-[1.1] uppercase px-8 py-4 border border-asphalt hover:translate-x-1 hover:translate-y-1 transition-transform disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
                {isSubmitting ? 'FILING...' : 'FILE THE REPORT'}
                <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Live Ticket Preview */}
        <aside className="w-full md:w-2/5 p-6 bg-surface-variant md:sticky top-[60px] h-auto md:h-[calc(100vh-60px)] flex flex-col border-l border-asphalt overflow-y-auto">
          <h3 className="font-mono-label text-[14px] text-asphalt mb-4 uppercase">Live Ticket Preview</h3>
          <div className="bg-paper border border-asphalt shadow-none relative flex flex-col h-full min-h-[500px]">
            <div className="p-4 flex justify-between items-start perforated-bottom bg-surface">
              <div className="font-mono-label text-[14px] text-asphalt">
                  WORK ORDER ID<br/>
                  <span className="font-mono-data text-[13px] text-stone">PENDING_GENERATION</span>
              </div>
              <div className="font-mono-label text-[14px] text-asphalt text-right">
                  DATE<br/>
                  <span className="font-mono-data text-[13px] text-stone">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col gap-6 text-asphalt">
              <div className="w-full aspect-video border border-asphalt bg-surface-container flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-asphalt opacity-30 text-[48px]">image</span>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="font-mono-label text-[14px] text-asphalt border-b border-asphalt pb-1">CLASSIFICATION</span>
                <span className="font-mono-data text-[13px] text-stone uppercase">{category === 'pending' ? '--' : category.replace('_', ' ')}</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="font-mono-label text-[14px] text-asphalt border-b border-asphalt pb-1">LOCATION</span>
                <span className="font-mono-data text-[13px] text-stone">
                  {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : '--'}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 flex-grow relative">
                <span className="font-mono-label text-[14px] text-asphalt border-b border-asphalt pb-1">NOTES</span>
                <div className="absolute inset-0 top-6 repeating-linear-gradient-lines z-0"></div>
                <div className="font-mono-data text-[13px] text-asphalt z-10 leading-[24px] pt-1 whitespace-pre-wrap">{description}</div>
              </div>
            </div>
            
            <div className="p-4 perforated-top bg-surface mt-auto">
              <div className="flex justify-between items-center">
                <span className="font-mono-label text-[14px] text-asphalt">STATUS</span>
                <span className="stamp-status font-mono-label text-[14px] text-stone !border-stone opacity-50" style={{transform: 'rotate(0deg)'}}>DRAFT</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
