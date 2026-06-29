'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const ReportForm = dynamic(() => import('@/components/ReportForm'), { ssr: false })

export default function ReportPage() {
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?next=/report')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) return <div className="p-8 text-center">Checking authentication...</div>

  return (
    <div className="bg-white min-h-screen">
      <ReportForm />
    </div>
  )
}
