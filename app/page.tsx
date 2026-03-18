"use client"

import { useEffect, useRef } from "react"
import { SignIn } from "@clerk/nextjs"
import { motion } from "framer-motion"

interface GridDot {
  x: number
  y: number
  direction: "horizontal" | "vertical"
  speed: number
  size: number
  opacity: number
  color: string
  targetX: number
  targetY: number
  phase: number
  trail: { x: number; y: number }[]
}

interface GridBurst {
  x: number
  y: number
  life: number
  maxLife: number
  size: number
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(ratio, ratio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const colors = [
      "rgba(255, 255, 255, 0.88)",
      "rgba(249, 115, 22, 0.95)",
      "rgba(251, 146, 60, 0.92)",
    ]
    const gridSize = 64
    const dotCount = 46
    const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize
    const seeded = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453
      return x - Math.floor(x)
    }

    const gridDots: GridDot[] = []
    const bursts: GridBurst[] = []

    const spawnBurst = (x: number, y: number) => {
      const burstSeed = x * 0.073 + y * 0.041 + bursts.length * 0.19
      bursts.push({
        x,
        y,
        life: 0,
        maxLife: 18 + Math.floor(seeded(burstSeed) * 10),
        size: 10 + seeded(burstSeed + 1.3) * 14,
      })
      if (bursts.length > 42) bursts.shift()
    }

    for (let i = 0; i < dotCount; i++) {
      const base = i + 1
      const isHorizontal = base % 2 === 0
      const x = snapToGrid(seeded(base * 1.17) * canvas.offsetWidth)
      const y = snapToGrid(seeded(base * 2.31) * canvas.offsetHeight)

      gridDots.push({
        x,
        y,
        direction: isHorizontal ? "horizontal" : "vertical",
        speed: seeded(base * 0.97) * 9 + 7.5,
        size: seeded(base * 1.83) * 2.2 + 2.3,
        opacity: seeded(base * 2.57) * 0.45 + 0.45,
        color: colors[Math.floor(seeded(base * 3.13) * colors.length)],
        targetX: x,
        targetY: y,
        phase: seeded(base * 4.21) * Math.PI * 2,
        trail: [],
      })
    }

    let animationId = 0
    let lastTime = 0
    const frameInterval = 1000 / 30

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate)

      const deltaTime = currentTime - lastTime
      if (deltaTime < frameInterval) return
      lastTime = currentTime - (deltaTime % frameInterval)

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      for (const dot of gridDots) {
        const movement = currentTime * 0.001 + dot.phase
        dot.trail.unshift({ x: dot.x, y: dot.y })
        if (dot.trail.length > 16) dot.trail.pop()

        if (dot.direction === "horizontal") {
          if (Math.abs(dot.x - dot.targetX) < dot.speed) {
            dot.x = dot.targetX
            if (Math.sin(movement * 1.9) > -0.25) {
              dot.direction = "vertical"
              const steps = Math.floor(((Math.sin(movement * 2.7) + 1) / 2) * 6) + 1
              const sign = Math.cos(movement * 3.2) > 0 ? 1 : -1
              dot.targetY = dot.y + sign * steps * gridSize
              if (Math.sin(movement * 4.3) > 0.1) spawnBurst(dot.x, dot.y)
            } else {
              const steps = Math.floor(((Math.cos(movement * 2.1) + 1) / 2) * 7) + 2
              const sign = Math.sin(movement * 2.9) > 0 ? 1 : -1
              dot.targetX = dot.x + sign * steps * gridSize
            }
          } else {
            dot.x += dot.x < dot.targetX ? dot.speed : -dot.speed
          }
        } else {
          if (Math.abs(dot.y - dot.targetY) < dot.speed) {
            dot.y = dot.targetY
            if (Math.cos(movement * 1.8) > -0.25) {
              dot.direction = "horizontal"
              const steps = Math.floor(((Math.sin(movement * 2.4) + 1) / 2) * 7) + 2
              const sign = Math.cos(movement * 2.8) > 0 ? 1 : -1
              dot.targetX = dot.x + sign * steps * gridSize
              if (Math.sin(movement * 4.1) > 0.1) spawnBurst(dot.x, dot.y)
            } else {
              const steps = Math.floor(((Math.cos(movement * 2.2) + 1) / 2) * 6) + 1
              const sign = Math.sin(movement * 3.1) > 0 ? 1 : -1
              dot.targetY = dot.y + sign * steps * gridSize
            }
          } else {
            dot.y += dot.y < dot.targetY ? dot.speed : -dot.speed
          }
        }

        if (dot.x < -gridSize) {
          dot.x = canvas.offsetWidth + gridSize
          dot.targetX = dot.x
          dot.trail = []
        }
        if (dot.x > canvas.offsetWidth + gridSize) {
          dot.x = -gridSize
          dot.targetX = dot.x
          dot.trail = []
        }
        if (dot.y < -gridSize) {
          dot.y = canvas.offsetHeight + gridSize
          dot.targetY = dot.y
          dot.trail = []
        }
        if (dot.y > canvas.offsetHeight + gridSize) {
          dot.y = -gridSize
          dot.targetY = dot.y
          dot.trail = []
        }

        if (dot.trail.length > 1) {
          ctx.beginPath()
          ctx.moveTo(dot.x, dot.y)
          for (let i = 0; i < dot.trail.length; i++) {
            ctx.lineTo(dot.trail[i].x, dot.trail[i].y)
          }
          ctx.strokeStyle = dot.color
          ctx.globalAlpha = dot.opacity * 0.62
          ctx.lineWidth = dot.size
          ctx.lineCap = "round"
          ctx.stroke()
        }

        const pulse = Math.sin(currentTime * 0.004 + dot.phase)
        const ringRadius = dot.size * 2.2 + (pulse + 1) * 2.1

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = dot.color
        ctx.globalAlpha = dot.opacity * 0.28
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = dot.color
        ctx.globalAlpha = dot.opacity * 0.22
        ctx.fill()

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = dot.color
        ctx.globalAlpha = dot.opacity
        ctx.fill()
      }

      for (let i = 0; i < gridDots.length; i++) {
        for (let j = i + 1; j < gridDots.length; j++) {
          const a = gridDots[i]
          const b = gridDots[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 160) {
            const intensity = 1 - distance / 160
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = "rgba(249,115,22,1)"
            ctx.globalAlpha = 0.22 * intensity
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const burst = bursts[i]
        burst.life += 1
        const progress = burst.life / burst.maxLife
        const alpha = Math.max(0, 1 - progress)
        const radius = burst.size + progress * 28

        ctx.beginPath()
        ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(249,115,22,1)"
        ctx.globalAlpha = alpha * 0.4
        ctx.lineWidth = 1.4
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(burst.x, burst.y, radius * 0.45, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255,255,255,1)"
        ctx.globalAlpha = alpha * 0.22
        ctx.fill()

        for (let spark = 0; spark < 4; spark++) {
          const angle = burst.life * 0.32 + spark * (Math.PI / 2)
          const sparkLength = 8 + progress * 18
          ctx.beginPath()
          ctx.moveTo(burst.x, burst.y)
          ctx.lineTo(
            burst.x + Math.cos(angle) * sparkLength,
            burst.y + Math.sin(angle) * sparkLength,
          )
          ctx.strokeStyle = "rgba(255,180,120,1)"
          ctx.globalAlpha = alpha * 0.35
          ctx.lineWidth = 1
          ctx.stroke()
        }

        if (burst.life >= burst.maxLife) {
          bursts.splice(i, 1)
        }
      }

      ctx.globalAlpha = 1
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 px-3 py-6 sm:px-4 sm:py-10">
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(to_right,#242424_1px,transparent_1px),linear-gradient(to_bottom,#242424_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-80"
        animate={{ backgroundPosition: ["0px 0px", "64px 64px"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.14),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_45%)]" />
      <canvas
        ref={canvasRef}
        className="background-canvas pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute h-2.5 w-2.5 rounded-sm border border-orange-500/50 bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            initial={{
              x: `${(index * 13) % 90 + 5}%`,
              y: `${(index * 17) % 90 + 5}%`,
              opacity: 0.2,
              scale: 0.8,
            }}
            animate={{
              x: [
                `${(index * 13) % 90 + 5}%`,
                `${(index * 19) % 90 + 3}%`,
                `${(index * 23) % 90 + 4}%`,
              ],
              y: [
                `${(index * 17) % 90 + 5}%`,
                `${(index * 11) % 90 + 6}%`,
                `${(index * 7) % 90 + 8}%`,
              ],
              opacity: [0.15, 0.45, 0.2],
              scale: [0.8, 1.15, 0.9],
            }}
            transition={{
              duration: 8 + (index % 6),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          <SignIn
            path="/"
            routing="path"
            signUpUrl="/register"
            fallbackRedirectUrl="/dialer"
          />
        </motion.div>
      </div>
    </main>
  )
}
