import { useState, useEffect } from 'react'
import Character from './components/Character'
import SpendCard from './components/SpendCard'
import ChatCard from './components/ChatCard'
import RecentCard from './components/RecentCard'
import { Confetti, ShakeEffect } from './components/Effects'
import './App.css'

const DEFAULT_BUDGET = { amount: 0, month: new Date().toISOString().slice(0, 7) }

export default function App() {
  const [budget, setBudget] = useState(() => { const s = localStorage.getItem('pc_budget'); return s ? JSON.parse(s) : DEFAULT_BUDGET })
  const [spends, setSpends] = useState(() => { const s = localStorage.getItem('pc_spends'); return s ? JSON.parse(s) : [] })
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('pc_api_key') || '')
  const [showApiInput, setShowApiInput] = useState(false)
  const [apiInputVal, setApiInputVal] = useState('')
  const [budgetInput, setBudgetInput] = useState('')
  const [charEmotion, setCharEmotion] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showShake, setShowShake] = useState(false)
  const [chatAnswer, setChatAnswer] = useState(null)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => { localStorage.setItem('pc_budget', JSON.stringify(budget)) }, [budget])
  useEffect(() => { localStorage.setItem('pc_spends', JSON.stringify(spends)) }, [spends])

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthSpends = spends.filter(s => s.date.startsWith(thisMonth))
  const totalSpent = monthSpends.filter(s => !s.saved).reduce((s, i) => s + i.amount, 0)
  const remaining = budget.amount - totalSpent
  const ratio = budget.amount > 0 ? remaining / budget.amount : 1
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)))
  const savedCount = monthSpends.filter(s => s.saved).length
  const savedAmount = monthSpends.filter(s => s.saved).reduce((a, s) => a + s.amount, 0)
  const spendCount = monthSpends.filter(s => !s.saved).length

  const triggerHappy = () => {
    setCharEmotion('happy'); setShowConfetti(true)
    setTimeout(() => { setCharEmotion('idle'); setShowConfetti(false) }, 3000)
  }
  const triggerSad = () => {
    setCharEmotion('sad'); setShowShake(true)
    setTimeout(() => { setCharEmotion('idle'); setShowShake(false) }, 3000)
  }

  const saveApiKey = () => {
    if (!apiInputVal.trim()) return
    localStorage.setItem('pc_api_key', apiInputVal.trim())
    setApiKey(apiInputVal.trim())
    setApiInputVal('')
    setShowApiInput(false)
  }

  const clearApiKey = () => {
    localStorage.removeItem('pc_api_key')
    setApiKey('')
  }

  const handleAddBudget = () => {
    const val = parseInt(budgetInput)
    if (!val || val <= 0) return
    setBudget(prev => ({ ...prev, amount: prev.amount + val }))
    setBudgetInput('')
  }

  const handleAddSpend = (spend) => {
    setSpends(prev => [{ ...spend, id: Date.now(), date: new Date().toISOString() }, ...prev])
    if (spend.saved) triggerHappy()
    else triggerSad()
  }

  // 영수증 분석 결과 여러 건 한번에 추가
  const handleAddSpends = (newSpends) => {
    setSpends(prev => [...newSpends, ...prev])
    triggerSad()
  }

  const handleReaction = (msg) => {
    setChatAnswer(msg)
  }

  const handlePouEmotion = (emotion) => {
    setCharEmotion(emotion)
    setTimeout(() => setCharEmotion('idle'), 3000)
  }

  return (
    <div className="app">
      <Confetti active={showConfetti} />
      <ShakeEffect active={showShake} />

      <div className="header">
        <div>
          <div className="header-sub">{new Date().getMonth() + 1}월 용돈 현황</div>
          <div className="header-title">💸 PocketCheck</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* API 키 버튼 */}
          <button
            onClick={() => setShowApiInput(v => !v)}
            style={{
              padding:'7px 12px',
              background: apiKey ? '#F0FDF4' : '#FFF0F0',
              border: apiKey ? '1.5px solid #86EFAC' : '1.5px solid #FECDD3',
              borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer',
              color: apiKey ? '#15803D' : '#EF4444', fontFamily:'Inter,sans-serif',
            }}>
            {apiKey ? '🔑 AI 연결됨' : '🔑 API 키 입력'}
          </button>
          <div className="char-box">
            <Character emotion={charEmotion} />
          </div>
        </div>
      </div>

      {/* API 키 입력창 */}
      {showApiInput && (
        <div style={{ background:'white', borderRadius:14, padding:'14px 16px', border:'1.5px solid #E0E4FF' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>
            🔑 Anthropic API 키 — 본인 브라우저에만 저장돼요
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={apiInputVal}
              onChange={e => setApiInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
              style={{ flex:1, padding:'10px 14px', background:'#F4F6FF', border:'1.5px solid #E0E4FF', borderRadius:10, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }}
            />
            <button onClick={saveApiKey} style={{ padding:'10px 16px', background:'#4F46E5', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>저장</button>
            {apiKey && <button onClick={clearApiKey} style={{ padding:'10px 14px', background:'#FFF0F0', border:'1.5px solid #FECDD3', borderRadius:10, fontSize:13, color:'#EF4444', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>삭제</button>}
          </div>
          {apiKey && <div style={{ marginTop:8, fontSize:11, color:'#15803D', fontWeight:600 }}>✓ API 키가 저장되어 있어요</div>}
        </div>
      )}

      <div className="top-row">
        <div className="balance-card">
          <div className="balance-label">남은 용돈</div>
          <div className="balance-amount">
            {Math.abs(remaining).toLocaleString()}<span className="balance-unit">원</span>
          </div>
          <div className="balance-sub">이번 달 {totalSpent.toLocaleString()}원 사용</div>
          <div className="balance-bar-bg">
            <div className="balance-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6366F1', fontWeight:600, marginBottom:14 }}>
            <span>0원</span>
            <span>{pct}% 남음</span>
            <span>{budget.amount.toLocaleString()}원</span>
          </div>
          <div className="balance-add">
            <input className="balance-input" type="number" placeholder="용돈 추가"
              value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddBudget()} />
            <button className="balance-add-btn" onClick={handleAddBudget}>추가</button>
          </div>
        </div>

        <div className="card">
          <div className="card-label">참은 횟수</div>
          <div className="stat-value" style={{ color:'#4F46E5' }}>{savedCount}번 🎉</div>
          <div className="stat-sub">{savedAmount.toLocaleString()}원 절약</div>
        </div>

        <div className="card">
          <div className="card-label">사용률</div>
          <div className="stat-value" style={{ color: pct < 30 ? '#EF4444' : '#1e293b' }}>{100 - pct}%</div>
          <div className="stat-sub">지출 {spendCount}번</div>
        </div>
      </div>

      <div className="bottom-row">
        <SpendCard remaining={remaining} monthSpends={monthSpends} budget={budget} onAdd={handleAddSpend} onReaction={handleReaction} apiKey={apiKey} />
        <ChatCard remaining={remaining} monthSpends={monthSpends} budget={budget} answer={chatAnswer} setAnswer={setChatAnswer} loading={chatLoading} setLoading={setChatLoading} onPouEmotion={handlePouEmotion} onAddSpends={handleAddSpends} apiKey={apiKey} />
        <RecentCard monthSpends={monthSpends} totalSpent={totalSpent} />
      </div>
    </div>
  )
}
