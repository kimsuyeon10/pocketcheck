import { useEffect, useState } from 'react'

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#a78bfa', '#34d399']

export function Confetti({ active }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) { setPieces([]); return }
    const newPieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
    setPieces(newPieces)
    const t = setTimeout(() => setPieces([]), 3000)
    return () => clearTimeout(t)
  }, [active])

  if (!pieces.length) return null

  return (
    <div className="effect-overlay">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            background: p.color,
            width: p.size,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      {/* 중앙 폭죽 텍스트 */}
      <div style={{
        position: 'fixed', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 48, animation: 'star-burst 1s ease-out forwards',
        pointerEvents: 'none',
      }}>🎉</div>
    </div>
  )
}

export function ShakeEffect({ active }) {
  useEffect(() => {
    if (!active) return
    const el = document.querySelector('.app')
    if (!el) return
    el.classList.add('shake')
    const t = setTimeout(() => el.classList.remove('shake'), 600)
    return () => clearTimeout(t)
  }, [active])

  if (!active) return null

  return (
    <div className="effect-overlay" style={{ background: 'rgba(239,68,68,0.08)', animation: 'none' }}>
      <div style={{
        position: 'fixed', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 44, pointerEvents: 'none',
      }}>💸</div>
    </div>
  )
}
