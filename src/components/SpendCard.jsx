import { useState } from 'react'

const CATS = [
  { emoji:'🍔', label:'먹기' },
  { emoji:'🧋', label:'카페' },
  { emoji:'🎮', label:'게임' },
  { emoji:'👕', label:'쇼핑' },
  { emoji:'🚌', label:'교통' },
  { emoji:'🎵', label:'문화' },
  { emoji:'📦', label:'기타' },
]

const KEYS = ['1','2','3','4','5','6','7','8','9','C','0','⌫']

async function getAIQuestion(emoji, label, amount, remaining, budget, monthSpends, apiKey) {
  const catCount = monthSpends.filter(s => s.emoji === emoji).length
  const ratio = budget.amount > 0 ? remaining / budget.amount : 0
  const prompt = `너는 고등학생 친구처럼 반말로 짧게 말하는 AI야. 이모티콘 1개.
상황: ${label}에 ${amount.toLocaleString()}원 쓰려고 함. 이번 달 ${label} ${catCount}번째. 남은 용돈: ${remaining.toLocaleString()}원 (${Math.round(ratio*100)}%)
잔액 50%이상→가볍게, 30~50%→주의, 30%이하→강하게. "진짜 필요해?" 또는 "참을 수 있어?"로 끝. 2문장 이내.`
  try {
    if (!apiKey) return null
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:150, messages:[{role:'user',content:prompt}] })
    })
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch { return null }
}

function getRuleFallback(emoji, label, amount, remaining, budget, monthSpends) {
  const ratio = budget.amount > 0 ? remaining / budget.amount : 0
  const cnt = monthSpends.filter(s => s.emoji === emoji).length
  if (ratio < 0.1) return `🚨 잔액 ${remaining.toLocaleString()}원밖에 없어. 진짜 필요해?`
  if (ratio < 0.3) return `⚠️ 얼마 안 남았는데... 참을 수 있어?`
  if (cnt >= 2) return `👀 ${label} 이번 달 벌써 ${cnt+1}번째야. 진짜 필요해?`
  return `잠깐, ${amount.toLocaleString()}원 쓰기 전에 한 번만 더 생각해봐. 진짜 필요해? 🤔`
}

async function getAIReaction(saved, label, amount, apiKey) {
  const prompt = saved
    ? `고등학생 친구처럼 반말로. ${label}에 ${amount.toLocaleString()}원 참았어. 칭찬. 1문장 이모티콘.`
    : `고등학생 친구처럼 반말로. ${label}에 ${amount.toLocaleString()}원 결국 샀어. 한마디. 1문장 이모티콘.`
  try {
    if (!apiKey) return saved ? '잘했어! 💪' : '기록됐어!'
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:100, messages:[{role:'user',content:prompt}] })
    })
    const data = await res.json()
    return data.content?.[0]?.text || (saved ? '잘했어! 💪' : '기록됐어!')
  } catch { return saved ? '잘했어! 💪' : '기록됐어!' }
}

export default function SpendCard({ remaining, monthSpends, budget, onAdd, onReaction, apiKey }) {
  const [sel, setSel] = useState(null)
  const [amountStr, setAmountStr] = useState('')
  const [step, setStep] = useState('input')
  const [aiQ, setAiQ] = useState(null)
  const [loading, setLoading] = useState(false)

  const amount = parseInt(amountStr) || 0

  const handleKey = (key) => {
    if (key === 'C') { setAmountStr(''); return }
    if (key === '⌫') { setAmountStr(prev => prev.slice(0, -1)); return }
    setAmountStr(prev => {
      const next = prev + key
      if (next.length > 8) return prev
      return next.replace(/^0+(?=\d)/, '')
    })
  }

  const handleNext = async () => {
    if (!sel || amount <= 0) return
    setLoading(true)
    const q = await getAIQuestion(sel.emoji, sel.label, amount, remaining, budget, monthSpends, apiKey)
    setAiQ(q || getRuleFallback(sel.emoji, sel.label, amount, remaining, budget, monthSpends))
    setStep('confirm')
    setLoading(false)
  }

  const handleDecision = async (save) => {
    setLoading(true)
    onAdd({ emoji: sel.emoji, amount, saved: save })
    const msg = await getAIReaction(save, sel.label, amount, apiKey)
    onReaction(msg)
    setSel(null); setAmountStr(''); setStep('input'); setAiQ(null)
    setLoading(false)
  }

  // 잔액 없으면 지출 불가
  if (remaining <= 0) {
    return (
      <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🚨</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#EF4444', marginBottom:8 }}>지출 불가</div>
        <div style={{ fontSize:14, color:'#1e293b', fontWeight:600, marginBottom:6, lineHeight:1.6 }}>
          잔액이 없어!<br/>정신 차려 💢
        </div>
        <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>
          용돈을 먼저 채워넣어야<br/>지출할 수 있어
        </div>
        <div style={{ marginTop:16, padding:'10px 16px', background:'#FFF0F0', border:'1.5px solid #FECDD3', borderRadius:12, fontSize:13, fontWeight:700, color:'#EF4444' }}>
          잔액: {remaining.toLocaleString()}원
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="card">
        <div className="card-label">지출 확인</div>
        <div style={{ textAlign:'center', marginBottom:12 }}>
          <div style={{ fontSize:40, marginBottom:4 }}>{sel?.emoji}</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#1e293b' }}>{amount.toLocaleString()}원</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>{sel?.label}에 지출</div>
        </div>
        {aiQ && (
          <div className="ai-answer" style={{ flex:'none', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#4F46E5', marginBottom:5 }}>🤖 AI 한마디</div>
            {aiQ}
          </div>
        )}
        <div className="decision-row">
          <button className="decision-save" disabled={loading} onClick={() => handleDecision(true)}>
            ✋ 참을게<br/><span style={{ fontSize:11 }}>🎉 폭죽!</span>
          </button>
          <button className="decision-spend" disabled={loading} onClick={() => handleDecision(false)}>
            그래도 살래<br/><span style={{ fontSize:11 }}>기록됨</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-label">지출 기록</div>
      <div className="cat-grid">
        {CATS.map(cat => (
          <button key={cat.emoji} className="cat-btn"
            style={sel?.emoji === cat.emoji ? { background:'#EEF2FF', borderColor:'#4F46E5' } : {}}
            onClick={() => setSel(cat)}>
            <span className="emoji">{cat.emoji}</span>
            <span className="name" style={sel?.emoji === cat.emoji ? { color:'#4F46E5' } : {}}>{cat.label}</span>
          </button>
        ))}
      </div>
      <div className="calc-display" style={{ color: amount > 0 ? '#1e293b' : '#C7D0FF' }}>
        {amount > 0 ? amount.toLocaleString() : '0'}<span style={{ fontSize:14, color:'#94a3b8', fontWeight:600, marginLeft:4 }}>원</span>
      </div>
      <div className="calc-grid">
        {KEYS.map(key => (
          <button key={key} className={`calc-key ${key === 'C' ? 'clear' : key === '⌫' ? 'back' : ''}`} onClick={() => handleKey(key)}>
            {key}
          </button>
        ))}
      </div>
      <button className="btn-primary" disabled={!sel || amount <= 0 || amount > remaining || loading} onClick={handleNext}>
        {loading ? 'AI가 보고 있어...' : amount > remaining ? `잔액 부족 (${remaining.toLocaleString()}원 남음)` : '기록하기 →'}
      </button>
    </div>
  )
}
