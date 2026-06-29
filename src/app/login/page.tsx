'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginType, setLoginType] = useState<'citizen' | 'gov'>('citizen')
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('type=gov')) {
      setLoginType('gov')
    }
  }, [])
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0]
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    else {
      alert('Success! You may need to check your email for a confirmation link.')
      if (data.user && loginType === 'gov') {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
      }
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) setError(error.message)
    else {
      if (loginType === 'gov' && data.user) {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-brand-asphalt text-brand-paper font-body-md relative">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClWybbiVRgP1VY_aDTvuovpVrmL0TNx0ZP_qyFIHSdt4El9YhxzdBu_aNDoprpJuHIR2SAQSJVLegB14b7Fm5ihgpx8jZiKIXYlqe0wwopo9ko2MvYjmI1dE4CRTZfhffVP5olGkKLtzfftynpC3B5pdKsTPkK8FE-oltL42UKCHGPbjBOZw-iwCnphgsjumm17irMC9fpvfXR5neXtow2ci3MZcP804H_R2c5xp_WB9Uur9xUaUrRATgOKstK7UhWWyYAeS7wCrae')" }}>
      </div>
      
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-10">
          <Link href="/" className="inline-flex items-center font-mono-label text-[14px] text-brand-stone hover:text-brand-cone transition-colors uppercase group">
              <span className="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_left_alt</span>
              Return to Map
          </Link>
      </div>

      <div className="w-full max-w-md p-8 bg-brand-paper text-brand-asphalt border-[3px] border-brand-asphalt shadow-[8px_8px_0px_#8B8578] relative z-10">
        <div className="perforated-border-bottom border-b-2 border-dotted border-brand-stone pb-4 mb-6">
            <h1 className="font-display-lg text-[48px] uppercase leading-none tracking-tight">Access Portal</h1>
            <div className="font-mono-data text-[13px] text-brand-stone mt-2 uppercase tracking-widest">CITY WORKS DEPT. // CH-AUTH-V1</div>
        </div>

        <div className="flex w-full mb-6 border-2 border-brand-asphalt">
          <button 
            type="button"
            onClick={() => setLoginType('citizen')}
            className={`flex-1 py-2 font-mono-label text-[14px] uppercase ${loginType === 'citizen' ? 'bg-brand-asphalt text-brand-paper' : 'bg-brand-paper text-brand-asphalt hover:bg-surface-container'}`}
          >
            Citizen
          </button>
          <button 
            type="button"
            onClick={() => setLoginType('gov')}
            className={`flex-1 py-2 font-mono-label text-[14px] uppercase border-l-2 border-brand-asphalt ${loginType === 'gov' ? 'bg-brand-asphalt text-brand-paper' : 'bg-brand-paper text-brand-asphalt hover:bg-surface-container'}`}
          >
            Government
          </button>
        </div>

        <form className="flex flex-col gap-6">
          <div>
            <label className="block font-mono-label text-[14px] uppercase text-brand-asphalt mb-2">
              {loginType === 'gov' ? 'Official Email' : 'Citizen Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-brand-asphalt rounded-none px-0 py-2 font-mono-data text-[16px] text-brand-asphalt placeholder:text-brand-stone focus:ring-0 focus:border-brand-cone transition-colors"
              placeholder="ENTER EMAIL ADDRESS..."
              required
            />
          </div>
          <div>
            <label className="block font-mono-label text-[14px] uppercase text-brand-asphalt mb-2">Access Code</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-brand-asphalt rounded-none px-0 py-2 font-mono-data text-[16px] text-brand-asphalt placeholder:text-brand-stone focus:ring-0 focus:border-brand-cone transition-colors"
              placeholder="ENTER PASSWORD..."
              required
            />
          </div>
          
          {error && (
              <div className="bg-brand-asphalt text-brand-paper font-mono-data text-[13px] p-3 border-l-4 border-brand-cone">
                  ERROR: {error}
              </div>
          )}
          
          <div className="flex flex-col gap-3 mt-4 pt-6 border-t-2 border-brand-asphalt">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-brand-cone text-brand-asphalt font-display-md text-[20px] uppercase px-6 py-3 border-[2px] border-brand-asphalt hover:translate-x-px hover:translate-y-px transition-transform flex items-center justify-center gap-2 rounded-none disabled:opacity-50"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-transparent text-brand-asphalt font-display-md text-[20px] uppercase px-6 py-3 border-[2px] border-brand-asphalt hover:bg-brand-asphalt hover:text-brand-paper transition-colors rounded-none disabled:opacity-50"
            >
              {loginType === 'gov' ? 'Register Gov ID' : 'Register New ID'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
