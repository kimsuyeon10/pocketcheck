import { useEffect, useState } from 'react'

export function PouChar({ size=80, emotion='idle' }) {
  const happy = emotion === 'happy'
  const sad = emotion === 'sad'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <ellipse cx="50" cy="60" rx="30" ry="24" fill="#C8A87A" stroke="#B8955A" strokeWidth="2"/>
      <ellipse cx="50" cy="42" rx="28" ry="26" fill="#D4A86A" stroke="#C49050" strokeWidth="2"/>
      {/* 눈 흰자 */}
      <ellipse cx="37" cy="38" rx="11" ry="13" fill="white" stroke="#333" strokeWidth="1.5"/>
      <ellipse cx="63" cy="38" rx="11" ry="13" fill="white" stroke="#333" strokeWidth="1.5"/>
      {/* 눈동자 */}
      <ellipse cx="37" cy={sad?42:40} rx="6" ry="7" fill="#1a1a1a"/>
      <ellipse cx="63" cy={sad?42:40} rx="6" ry="7" fill="#1a1a1a"/>
      <circle cx="35" cy={sad?40:38} r="2.5" fill="white"/>
      <circle cx="61" cy={sad?40:38} r="2.5" fill="white"/>
      {/* 눈물 (슬플때) */}
      {sad && <>
        <ellipse cx="33" cy="52" rx="2" ry="3" fill="#60a5fa" opacity="0.85"/>
        <ellipse cx="59" cy="52" rx="2" ry="3" fill="#60a5fa" opacity="0.85"/>
      </>}
      {/* 입 */}
      {happy && <path d="M40 57 Q50 65 60 57" fill="none" stroke="#7a5a3a" strokeWidth="2.5" strokeLinecap="round"/>}
      {sad && <path d="M40 61 Q50 55 60 61" fill="none" stroke="#7a5a3a" strokeWidth="2.5" strokeLinecap="round"/>}
      {!happy && !sad && <line x1="42" y1="57" x2="58" y2="57" stroke="#7a5a3a" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* 행복 파티클 */}
      {happy && <>
        <text x="12" y="22" fontSize="13">⭐</text>
        <text x="72" y="18" fontSize="11">✨</text>
      </>}
    </svg>
  )
}

export default function Character({ emotion }) {
  const [current, setCurrent] = useState('idle')
  useEffect(() => {
    if (!emotion) return
    setCurrent(emotion)
    const t = setTimeout(() => setCurrent('idle'), 3000)
    return () => clearTimeout(t)
  }, [emotion])

  return (
    <div className={current==='happy'?'char-bounce':current==='sad'?'char-cry':''}>
      <PouChar size={72} emotion={current} />
    </div>
  )
}
