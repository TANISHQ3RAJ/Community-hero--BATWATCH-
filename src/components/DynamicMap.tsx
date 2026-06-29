'use client'

import dynamic from 'next/dynamic'

const DynamicMap = dynamic(() => import('./Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse">Loading map...</div>
})

export default DynamicMap
