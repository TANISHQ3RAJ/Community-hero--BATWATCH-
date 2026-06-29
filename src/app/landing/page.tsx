'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const script = document.createElement('script')
        script.src = "https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"
        script.async = true
        document.body.appendChild(script)

        let reqId: number;

        script.onload = () => {
            const THREE = (window as any).THREE
            if (!THREE || !containerRef.current) return
            
            const container = containerRef.current
            let scene: any, camera: any, renderer: any, ticket: any, ticketBody: any, ticketStub: any
            let currentState = 0
            let lastSwitch = 0
            const STATE_DURATION_MS = 2200
            const states = ['REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED']
            const stateColors = {
                'REPORTED': 0x8B8578,
                'VERIFIED': 0xD4622A,
                'IN_PROGRESS': 0xD4622A,
                'RESOLVED': 0x3D7A5C
            }

            function init() {
                const width = container.clientWidth || window.innerWidth
                const height = container.clientHeight || window.innerHeight

                scene = new THREE.Scene()
                camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
                camera.position.z = 5

                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
                renderer.setSize(width, height)
                renderer.setClearColor(0x000000, 0)
                container.appendChild(renderer.domElement)

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
                scene.add(ambientLight)
                const pointLight = new THREE.PointLight(0xffffff, 1)
                pointLight.position.set(5, 5, 5)
                scene.add(pointLight)

                const ticketGroup = new THREE.Group()

                const bodyGeom = new THREE.BoxGeometry(3, 2, 0.1)
                const paperMat = new THREE.MeshPhongMaterial({ color: 0xF5F1E8 })
                ticketBody = new THREE.Mesh(bodyGeom, paperMat)
                ticketGroup.add(ticketBody)

                const stubGeom = new THREE.BoxGeometry(0.8, 2, 0.1)
                // @ts-ignore
                const stubMat = new THREE.MeshPhongMaterial({ color: stateColors[states[currentState]] })
                ticketStub = new THREE.Mesh(stubGeom, stubMat)
                ticketStub.position.x = 1.95
                ticketGroup.add(ticketStub)

                ticket = ticketGroup
                scene.add(ticket)

                lastSwitch = Date.now()
                window.addEventListener('resize', onWindowResize)
                animate()
            }

            function onWindowResize() {
                if (!containerRef.current) return
                const width = containerRef.current.clientWidth || window.innerWidth
                const height = containerRef.current.clientHeight || window.innerHeight
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            }

            function advanceState() {
                const now = Date.now()
                if (now - lastSwitch > STATE_DURATION_MS) {
                    currentState = (currentState + 1) % states.length
                    // @ts-ignore
                    ticketStub.material.color.setHex(stateColors[states[currentState]])
                    lastSwitch = now
                }
            }

            function animate() {
                reqId = requestAnimationFrame(animate)
                ticket.rotation.y = Math.sin(Date.now() * 0.001) * 0.1
                ticket.position.y = Math.sin(Date.now() * 0.0015) * 0.1
                advanceState()
                renderer.render(scene, camera)
            }

            init()
        }

        return () => {
            if (reqId) cancelAnimationFrame(reqId)
            document.body.removeChild(script)
        }
    }, [])

    return (
        <div className="font-body-md text-body-md municipal-grid min-h-screen flex flex-col bg-brand-paper text-on-surface">
            <style dangerouslySetInnerHTML={{
                __html: `
                .btn-primary {
                    background-color: #D4622A;
                    color: #1A1D1A;
                    font-family: 'Anton', sans-serif;
                    text-transform: uppercase;
                    border-radius: 0;
                    padding: 12px 24px;
                    display: inline-block;
                    border: 2px solid #1A1D1A;
                    transition: transform 0.1s;
                    cursor: pointer;
                }
                .btn-primary:active {
                    transform: translate(2px, 2px);
                    box-shadow: none;
                }
                .btn-primary:hover {
                    background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(26, 29, 26, 0.1) 10px, rgba(26, 29, 26, 0.1) 20px);
                }
                .ticket-card {
                    background-color: #F5F1E8;
                    border: 1px solid #1A1D1A;
                    position: relative;
                }
                .ticket-card::before {
                    content: '';
                    position: absolute;
                    top: 40px;
                    left: 0;
                    right: 0;
                    border-bottom: 2px dotted #8B8578;
                }
                .stamp {
                    font-family: 'IBM Plex Mono', monospace;
                    border: 2px solid;
                    padding: 4px 8px;
                    display: inline-block;
                    text-transform: uppercase;
                    font-weight: bold;
                    transform: rotate(-4deg);
                    opacity: 0.9;
                }
                .stamp-orange {
                    color: #D4622A;
                    border-color: #D4622A;
                }
                .stamp-green {
                    color: #3D7A5C;
                    border-color: #3D7A5C;
                }
                .municipal-grid {
                    background-size: 4px 4px;
                    background-image: linear-gradient(to right, rgba(139, 133, 120, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(139, 133, 120, 0.1) 1px, transparent 1px);
                }
            `}} />

            {/* TopNavBar */}
            <header className="bg-surface dark:bg-surface-container-highest border-b border-brand-asphalt sticky top-0 z-50">
                <div className="flex justify-between items-center w-full px-6 py-1 max-w-[1200px] mx-auto h-16">
                    <Link href="/landing" className="font-display-md text-[32px] text-brand-asphalt tracking-tight uppercase no-underline hover:text-brand-cone transition-colors">
                        COMMUNITY HERO
                    </Link>
                    <nav className="hidden md:flex space-x-6">
                        <Link href="/landing" className="font-mono-label text-[14px] text-brand-asphalt border-b-2 border-brand-asphalt font-bold px-1 py-4">How it works</Link>
                        <Link href="/map" className="font-mono-label text-[14px] text-on-surface-variant hover:text-brand-asphalt px-1 py-4">Map</Link>
                        <Link href="/dashboard" className="font-mono-label text-[14px] text-on-surface-variant hover:text-brand-asphalt px-1 py-4">Dashboard</Link>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <Link href="/login" className="hidden md:inline-block font-mono-label text-[14px] text-on-surface-variant hover:text-brand-asphalt">Sign in</Link>
                        <Link href="/report" className="btn-primary font-headline-sm text-headline-sm tracking-widest text-sm flex items-center justify-center">
                            Report an Issue
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative w-full overflow-hidden border-b border-brand-asphalt bg-brand-paper">
                    <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
                        <div className="space-y-6">
                            <div className="inline-block border border-brand-asphalt px-3 py-1 bg-surface-variant">
                                <span className="font-mono-label text-[14px] text-brand-asphalt">ID: HDR-001</span>
                            </div>
                            <h1 className="font-display-lg text-[48px] text-brand-asphalt uppercase leading-none" style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}>
                                SEE SOMETHING BROKEN?<br />STAMP IT FIXED.
                            </h1>
                            <p className="font-body-lg text-[18px] max-w-md text-on-surface-variant">
                                The municipal utility network for reporting, verifying, and tracking local infrastructure issues. Direct action. No friction.
                            </p>
                            <div className="pt-4">
                                <Link href="/report" className="btn-primary font-headline-sm text-[20px] tracking-wider px-8 py-4">
                                    FILE A REPORT
                                </Link>
                            </div>
                        </div>
                        <div className="relative h-[400px] md:h-[500px] w-full border-2 border-brand-asphalt bg-surface-variant flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 w-full h-full opacity-80" style={{ display: 'block' }}>
                                <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
                            </div>
                            <div className="absolute inset-4 border border-brand-stone pointer-events-none"></div>
                            <div className="absolute top-0 left-0 w-8 h-8 border-b border-r border-brand-asphalt"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-b border-l border-brand-asphalt"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-t border-r border-brand-asphalt"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-t border-l border-brand-asphalt"></div>
                            <div className="absolute bottom-8 right-8 z-20">
                                <div className="stamp stamp-orange" style={{ fontSize: '24px', borderWidth: '4px', transform: 'rotate(-15deg)' }}>
                                    SYSTEM ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: How it works (Ticket Stubs) */}
                <section className="max-w-[1200px] mx-auto px-6 py-16 border-b border-brand-asphalt">
                    <div className="mb-12 border-b-2 border-brand-asphalt inline-block pb-2">
                        <h2 className="font-display-md text-[32px] uppercase text-brand-asphalt">Protocol: 3-Step Flow</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-brand-asphalt">
                        <div className="ticket-card p-6 border-r border-b border-brand-asphalt min-h-[250px] flex flex-col">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <span className="font-mono-label text-[14px] text-brand-asphalt bg-surface-variant px-2">STEP.01</span>
                                <span className="material-symbols-outlined text-brand-asphalt" style={{ fontVariationSettings: "'FILL' 1" }}>camera_alt</span>
                            </div>
                            <div className="mt-auto">
                                <h3 className="font-headline-sm text-[20px] uppercase text-brand-asphalt mb-2">Report</h3>
                                <p className="font-body-md text-[16px] text-on-surface-variant">
                                    Capture the issue. Submit location data and visual evidence to the central grid.
                                </p>
                            </div>
                        </div>
                        <div className="ticket-card p-6 border-r border-b border-brand-asphalt min-h-[250px] flex flex-col bg-surface-container-low">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <span className="font-mono-label text-[14px] text-brand-asphalt bg-surface-variant px-2">STEP.02</span>
                                <span className="material-symbols-outlined text-brand-asphalt" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                            </div>
                            <div className="mt-auto">
                                <h3 className="font-headline-sm text-[20px] uppercase text-brand-asphalt mb-2">Verify</h3>
                                <p className="font-body-md text-[16px] text-on-surface-variant">
                                    Community members or municipal agents confirm the report validity on-site.
                                </p>
                            </div>
                        </div>
                        <div className="ticket-card p-6 border-r border-b border-brand-asphalt min-h-[250px] flex flex-col">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <span className="font-mono-label text-[14px] text-brand-asphalt bg-surface-variant px-2">STEP.03</span>
                                <span className="material-symbols-outlined text-brand-asphalt" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_turned_in</span>
                            </div>
                            <div className="mt-auto relative">
                                <h3 className="font-headline-sm text-[20px] uppercase text-brand-asphalt mb-2">Resolve</h3>
                                <p className="font-body-md text-[16px] text-on-surface-variant pr-16">
                                    City works dispatched. Status updated to fixed.
                                </p>
                                <div className="absolute right-0 top-0">
                                    <div className="stamp stamp-green" style={{ fontSize: '12px' }}>RESOLVED</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Live Impact Stats */}
                <section className="bg-brand-asphalt text-brand-paper border-b border-brand-stone py-16">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="flex justify-between items-end border-b border-brand-stone pb-4 mb-8">
                            <h2 className="font-display-md text-[32px] uppercase text-brand-paper">Live Telemetry</h2>
                            <span className="font-mono-label text-[14px] text-brand-cone flex items-center gap-2">
                                <span className="w-2 h-2 bg-brand-cone rounded-full animate-pulse"></span>
                                SYSTEM ONLINE
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-brand-stone">
                            <div className="py-4 md:px-8 first:px-0">
                                <p className="font-mono-label text-[14px] text-surface-tint uppercase mb-2">Issues Resolved</p>
                                <p className="font-mono-data text-[48px] leading-none text-brand-paper tracking-tighter">14,208</p>
                            </div>
                            <div className="py-4 md:px-8">
                                <p className="font-mono-label text-[14px] text-surface-tint uppercase mb-2">Active Reporters</p>
                                <p className="font-mono-data text-[48px] leading-none text-brand-paper tracking-tighter">3,492</p>
                            </div>
                            <div className="py-4 md:px-8">
                                <p className="font-mono-label text-[14px] text-surface-tint uppercase mb-2">Avg. Resolution Time</p>
                                <p className="font-mono-data text-[48px] leading-none text-brand-cone tracking-tighter">48<span className="text-[24px]">HRS</span></p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Map Teaser */}
                <section className="max-w-[1200px] mx-auto px-6 py-16">
                    <div className="border border-brand-asphalt p-2 bg-surface-variant">
                        <div className="relative h-[400px] w-full border border-brand-asphalt overflow-hidden bg-surface-container flex items-center justify-center"
                            role="img"
                            aria-label="A highly detailed, stylized map interface viewed from top-down, depicting a gridded city layout in a brutalist municipal aesthetic. The map uses a limited palette of deep asphalt greys, stark paper whites, and structural stone lines. Several bright orange cone markers indicate active work zones. The lighting is flat and clinical, resembling a digital dispatch terminal screen."
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZQuxjB5qqqA3aBrjskj6AlGO4pJ4spynCkNNvjWTTYYOPahJk_c7LnKk4-xIxcNzG2EHT2DN-7oiybpC1uhqtuh3p6Udfv_wBx9wMeTjgmJ0qVBXW6IZwdY71S_IL-7MpIpOR89AqhUjTT6__BVSf4Q4GyH_bF3BVyNJP9VonOxsySF-uboTfPP9NpnqQz5p7xAPzklBp7x9Czz3JElC8AclDbPkiaBx7fedynjCD4Tenq3SRgylgUn7dhcGF4giEshm87YreOLdG')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className="absolute top-4 left-4 bg-brand-paper border border-brand-asphalt px-3 py-2 font-mono-data text-[13px]">
                                GRID: SECTOR 7G<br />
                                STATUS: MONITORING
                            </div>
                            <div className="absolute top-1/3 left-1/3 stamp stamp-orange bg-brand-paper" style={{ fontSize: '10px' }}>REPORTED</div>
                            <div className="absolute bottom-1/3 right-1/4 stamp stamp-green bg-brand-paper" style={{ fontSize: '10px' }}>RESOLVED</div>
                            <div className="absolute inset-0 bg-brand-asphalt/10 hover:bg-transparent transition-colors flex items-center justify-center group cursor-pointer">
                                <Link href="/map" className="bg-brand-paper border-2 border-brand-asphalt px-6 py-3 font-headline-sm text-[20px] uppercase text-brand-asphalt group-hover:bg-brand-cone group-hover:text-brand-asphalt transition-colors">
                                    OPEN SECTOR MAP
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-primary dark:bg-primary-container border-t-4 border-brand-cone mt-auto relative overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, #ffffff 20px, #ffffff 21px)", pointerEvents: 'none' }}>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-8 mt-auto max-w-[1200px] mx-auto relative z-10">
                    <div className="font-display-lg text-[48px] text-on-primary mb-6 md:mb-0">
                        COMMUNITY HERO
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-4">
                        <nav className="flex space-x-6">
                            <a className="font-mono-label text-[14px] text-on-primary-variant opacity-80 hover:text-secondary-fixed transition-opacity" href="#">Privacy</a>
                            <a className="font-mono-label text-[14px] text-on-primary-variant opacity-80 hover:text-secondary-fixed transition-opacity" href="#">Terms</a>
                            <a className="font-mono-label text-[14px] text-on-primary-variant opacity-80 hover:text-secondary-fixed transition-opacity" href="#">Support</a>
                        </nav>
                        <div className="font-mono-label text-[14px] text-surface-tint">
                            CITY WORKS DEPT. © 2024
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
