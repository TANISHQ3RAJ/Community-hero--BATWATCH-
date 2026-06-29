'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Fix for default Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'reported': return 'red'
    case 'under_review': return 'orange'
    case 'verified': return 'blue'
    case 'in_progress': return 'purple'
    case 'resolved': return 'green'
    default: return 'gray'
  }
}

// A simple custom icon generator using HTML to color code pins
const createCustomIcon = (status: string) => {
  const color = getMarkerColor(status)
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  })
}

interface Issue {
  id: string
  title: string
  status: string
  category: string
  lat: number
  lng: number
}

function MapEffect({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function Map({ issues, onIssueSelect }: { issues: Issue[], onIssueSelect?: (issue: any) => void }) {
  const router = useRouter()
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.warn("Could not get user location, falling back to default.", error.message)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])
  
  // Priority: User location -> First issue location -> Default (New Delhi)
  const center = userLocation || (issues.length > 0 
    ? [issues[0].lat, issues[0].lng] as [number, number]
    : [28.6139, 77.2090] as [number, number]) // New Delhi

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <MapEffect center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {issues.map((issue) => {
        // Create a small deterministic offset based on the ID string
        // so markers at the exact same location don't perfectly overlap
        const hash = issue.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const latOffset = (hash % 10) * 0.00005 - 0.00025
        const lngOffset = ((hash * 3) % 10) * 0.00005 - 0.00025
        
        return (
        <Marker 
          key={issue.id} 
          position={[issue.lat + latOffset, issue.lng + lngOffset]}
          icon={createCustomIcon(issue.status)}
          eventHandlers={{
            click: () => {
              if (onIssueSelect) {
                onIssueSelect(issue)
              } else {
                router.push(`/issue/${issue.id}`)
              }
            },
          }}
        >
          <Popup>
            <div className="font-semibold">{issue.title}</div>
            <div className="text-sm capitalize">{issue.category.replace('_', ' ')}</div>
            <div className="text-sm capitalize text-gray-500">Status: {issue.status.replace('_', ' ')}</div>
            <button 
              className="mt-2 text-blue-600 underline text-sm block"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/issue/${issue.id}`)
              }}
            >
              View Details
            </button>
          </Popup>
        </Marker>
      )})}
    </MapContainer>
  )
}
