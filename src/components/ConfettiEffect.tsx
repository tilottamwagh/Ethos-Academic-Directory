import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  color: string
  velocityX: number
  velocityY: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = [
  'hsl(172, 80%, 55%)',   // teal
  'hsl(262, 80%, 65%)',   // violet
  'hsl(142, 70%, 50%)',   // emerald
  'hsl(32, 95%, 55%)',    // amber
  'hsl(346, 80%, 55%)',   // rose
  'hsl(185, 85%, 50%)',   // cyan
  'hsl(270, 85%, 60%)',   // purple
]

export function ConfettiEffect({ duration = 4000 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    // Create particles
    const particleCount = 180
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      const isRect = Math.random() > 0.5
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * -1, // start above viewport
        size: isRect ? Math.random() * 8 + 4 : Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: Math.random() * 4 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }

    const startTime = performance.now()
    let animationId: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      if (elapsed > duration) {
        ctx!.clearRect(0, 0, width, height)
        return
      }

      // Fade out in the last 800ms
      const fadeStart = duration - 800
      const globalAlpha = elapsed > fadeStart
        ? 1 - (elapsed - fadeStart) / 800
        : 1

      ctx!.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.velocityX
        p.y += p.velocityY
        p.rotation += p.rotationSpeed
        p.velocityY += 0.1 // gravity

        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate((p.rotation * Math.PI) / 180)
        ctx!.globalAlpha = globalAlpha * p.opacity
        ctx!.fillStyle = p.color

        // Draw rectangles for variety (like confetti pieces)
        if (p.size > 6) {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx!.beginPath()
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx!.fill()
        }

        ctx!.restore()
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Handle resize
    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [duration])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}