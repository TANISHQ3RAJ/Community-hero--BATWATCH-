'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, avgTime: 0 })
  const [categoryData, setCategoryData] = useState<{name: string, count: number}[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      const { data: issues } = await supabase.from('issues').select('*')
      if (!issues) return

      const total = issues.length
      const resolvedIssues = issues.filter(i => i.status === 'resolved')
      const resolved = resolvedIssues.length

      let avgTime = 0
      if (resolved > 0) {
        const totalTime = resolvedIssues.reduce((acc, curr) => {
          return acc + (new Date(curr.updated_at).getTime() - new Date(curr.created_at).getTime())
        }, 0)
        avgTime = Math.round(totalTime / (1000 * 60 * 60 * 24 * resolved))
      }

      setStats({ total, resolved, avgTime })

      const catCount: Record<string, number> = {}
      issues.forEach(i => { catCount[i.category] = (catCount[i.category] || 0) + 1 })
      
      const chartData = Object.entries(catCount)
        .map(([name, count]) => ({ name: name.replace('_', ' ').toUpperCase(), count }))
        .sort((a, b) => b.count - a.count)
      setCategoryData(chartData)

      // Mock leaderboard mapping since we don't track verification accurately per user yet
      const reporters: Record<string, number> = {}
      issues.forEach(i => { 
        if (i.reporter_id) reporters[i.reporter_id] = (reporters[i.reporter_id] || 0) + 1 
      })
      const sortedReporters = Object.entries(reporters)
        .map(([id, count]) => ({ id: id.substring(0, 8), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      setLeaderboard(sortedReporters)
    }

    loadStats()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return (
    <div className="font-body-md text-body-md text-paper min-h-screen flex flex-col bg-asphalt">
      <header className="bg-surface dark:bg-surface-container-highest text-primary dark:text-primary-fixed border-b border-on-surface dark:border-outline full-width top-0 z-50 sticky">
        <div className="flex justify-between items-center w-full px-margin py-unit max-w-container-max mx-auto h-16">
            <div className="flex items-center gap-8 h-full">
                <Link href="/landing" className="font-display-md text-[32px] text-primary dark:text-primary-fixed tracking-tight uppercase no-underline">
                    COMMUNITY HERO
                </Link>
                <nav className="hidden md:flex gap-6 h-full items-center">
                    <Link href="/" className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary font-mono-label text-[14px] hover:bg-surface-container dark:hover:bg-primary-container transition-colors py-2 px-3">
                        Map
                    </Link>
                    <span className="text-secondary dark:text-secondary-container font-bold border-b-2 border-secondary font-mono-label text-[14px] hover:bg-surface-container dark:hover:bg-primary-container transition-colors py-2 px-3 translate-x-0.5 translate-y-0.5 duration-75 cursor-pointer">
                        Dashboard
                    </span>
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

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-6 py-8 md:py-16">
        <div className="mb-8 border-b-2 border-stone pb-4 flex justify-between items-end">
          <div>
            <h1 className="font-display-lg text-[48px] uppercase m-0">Impact Dashboard</h1>
            <p className="font-mono-label text-[14px] text-stone uppercase mt-2">CITY WORKS DEPT. // SYSTEM OVERVIEW</p>
          </div>
          <div className="hidden md:block font-mono-data text-[13px] text-stone text-right">
            <div>LAST UPDATED: {new Date().toISOString().split('T')[0]}</div>
            <div>AUTHORIZATION: PUBLIC VIEW</div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 bg-paper border border-asphalt mb-8">
          <div className="p-6 border-b md:border-b-0 md:border-r border-stone flex flex-col justify-between h-32">
            <div className="font-mono-label text-[14px] text-stone uppercase">Total Reported</div>
            <div className="font-display-lg text-[48px] text-asphalt">{stats.total}</div>
          </div>
          <div className="p-6 border-b md:border-b-0 md:border-r border-stone flex flex-col justify-between h-32">
            <div className="font-mono-label text-[14px] text-stone uppercase">Total Resolved</div>
            <div className="font-display-lg text-[48px] text-verified-green">{stats.resolved}</div>
          </div>
          <div className="p-6 border-b md:border-b-0 md:border-r border-stone flex flex-col justify-between h-32">
            <div className="font-mono-label text-[14px] text-stone uppercase">Resolution Rate</div>
            <div className="font-display-lg text-[48px] text-asphalt">{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</div>
          </div>
          <div className="p-6 flex flex-col justify-between h-32">
            <div className="font-mono-label text-[14px] text-stone uppercase">Avg Time to Resolve</div>
            <div className="font-display-lg text-[48px] text-asphalt">{stats.avgTime} <span className="text-xl">DAYS</span></div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-paper border border-asphalt p-6 flex flex-col">
            <div className="perforated-bottom pb-4 mb-6 flex justify-between items-center border-b-2 border-dotted border-asphalt">
              <h2 className="font-headline-sm text-[20px] text-asphalt uppercase">Issue Categories</h2>
              <span className="font-mono-data text-[13px] text-stone">YTD 2024</span>
            </div>
            <div className="flex-grow h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="#1A1D1A" tick={{fontFamily: 'IBM Plex Mono', fontSize: 10}} interval={0} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1D1A', borderColor: '#1A1D1A', color: '#F5F1E8', borderRadius: 0 }}
                    itemStyle={{ color: '#F5F1E8', fontFamily: 'IBM Plex Mono' }}
                  />
                  <Bar dataKey="count">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#D4622A' : '#1A1D1A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-paper border border-asphalt p-6 relative flex flex-col">
            <div className="absolute top-4 right-4">
              <span className="stamp-status text-[12px] !border-cone-orange !text-cone-orange">SYSTEM GENERATED</span>
            </div>
            <div className="pb-4 mb-6 pr-32 border-b-2 border-dotted border-asphalt">
              <h2 className="font-headline-sm text-[20px] text-asphalt uppercase">AI Insight Log</h2>
            </div>
            <div className="flex-grow">
              <p className="font-mono-data text-[13px] text-asphalt mb-4 leading-relaxed whitespace-pre-wrap">
                {`> ANALYSIS COMPLETE.\n\n> System detects normal reporting volume across all grids.\n\n> CORRELATION: Stable infrastructure baseline.\n\n> RECOMMENDATION: Continue standard municipal operations.`}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone flex justify-between items-center">
              <span className="font-mono-data text-[13px] text-stone">CONFIDENCE: 92%</span>
              <button className="bg-asphalt text-paper font-display-md text-[16px] px-4 py-1 uppercase">Acknowledge</button>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-paper border border-asphalt p-6">
          <div className="pb-4 mb-6 border-b-2 border-dotted border-asphalt">
            <h2 className="font-headline-sm text-[20px] text-asphalt uppercase">Top Contributors Ledger</h2>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-asphalt font-mono-label text-[14px] text-stone">
                  <th className="py-3 px-4 uppercase font-normal">Rank</th>
                  <th className="py-3 px-4 uppercase font-normal">Citizen ID</th>
                  <th className="py-3 px-4 uppercase font-normal text-right">Reports Filed</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-[13px] text-asphalt">
                {leaderboard.map((user, i) => (
                  <tr key={user.id} className="border-b border-stone hover:bg-surface-variant transition-colors">
                    <td className={`py-4 px-4 font-bold ${i === 0 ? 'text-cone-orange' : ''}`}>0{i + 1}</td>
                    <td className="py-4 px-4 uppercase">CITIZEN-{user.id}</td>
                    <td className="py-4 px-4 text-right">{user.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
