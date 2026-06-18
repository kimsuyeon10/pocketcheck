import { useState, useRef } from 'react'

const QUICK_Q = [
  '이번 달 내 소비 습관 분석해줘',
  '지금 잔액으로 월말까지 버틸 수 있어?',
  '내가 가장 낭비하는 게 뭐야?',
  '이번 달 잘 하고 있어?',
]

const EMOJI_MAP = { '먹기':'🍔', '카페':'🧋', '게임':'🎮', '쇼핑':'👕', '교통':'🚌', '문화':'🎵', '기타':'📦', '식비':'🍔', '음식':'🍔', '커피':'🧋', '의류':'👕', '패션':'👕', '교통비':'🚌', '문화생활':'🎵' }
function guessEmoji(cat) {
  if (!cat) return '📦'
  for (const [k, v] of Object.entries(EMOJI_MAP)) {
    if (cat.includes(k)) return v
  }
  return '📦'
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function ChatCard({ remaining, monthSpends, budget, answer, setAnswer, loading, setLoading, onPouEmotion, onAddSpends, apiKey }) {
  const [question, setQuestion] = useState('')
  const [preview, setPreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const totalSpent = monthSpends.filter(s => !s.saved).reduce((s, i) => s + i.amount, 0)
  const ratio = budget.amount > 0 ? Math.round((remaining / budget.amount) * 100) : 0
  const savedCount = monthSpends.filter(s => s.saved).length
  const catSummary = Object.entries(
    monthSpends.filter(s => !s.saved).reduce((acc, s) => { acc[s.emoji] = (acc[s.emoji] || 0) + s.amount; return acc }, {})
  ).map(([e, a]) => `${e} ${a.toLocaleString()}원`).join(', ')

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const analyzeReceipt = async () => {
    if (!imageFile) return
    if (!apiKey) { setAnswer('API 키를 먼저 입력해줘! 오른쪽 위 🔑 버튼 클릭'); return }
    setLoading(true)
    setAnswer('📸 영수증 분석 중...')
    try {
      const b64 = await fileToBase64(imageFile)
      const mediaType = imageFile.type || 'image/jpeg'
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
              { type: 'text', text: `이 영수증/구매내역 이미지를 분석해서 아래 JSON 형식으로만 답해줘. 다른 말은 하지 마.
{
  "items": [
    {"name": "상품명", "category": "카테고리(먹기/카페/게임/쇼핑/교통/문화/기타 중 하나)", "amount": 금액숫자},
    ...
  ],
  "total": 총합계숫자,
  "comment": "한마디 코멘트(반말)"
}
이미지에서 읽을 수 없으면 items를 빈 배열로 해줘.` }
            ]
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      let parsed
      try {
        const clean = text.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean)
      } catch { parsed = { items: [], comment: '영수증을 읽지 못했어 😅' } }

      if (parsed.items && parsed.items.length > 0) {
        const newSpends = parsed.items.map(item => ({
          emoji: guessEmoji(item.category),
          amount: parseInt(item.amount) || 0,
          saved: false,
          id: Date.now() + Math.random(),
          date: new Date().toISOString(),
          name: item.name,
        }))
        onAddSpends(newSpends)
        const names = parsed.items.map(i => `${guessEmoji(i.category)} ${i.name} ${i.amount?.toLocaleString()}원`).join('\n')
        setAnswer(`📸 영수증 분석 완료! 지출 ${parsed.items.length}건 자동 기록됐어.\n\n${names}\n\n${parsed.comment || ''}`)
        onPouEmotion('sad')
      } else {
        setAnswer(parsed.comment || '영수증을 읽지 못했어 😅 다시 찍어봐!')
      }
    } catch { setAnswer('분석 중 오류가 났어 😅 다시 시도해봐!') }
    setPreview(null)
    setImageFile(null)
    setLoading(false)
  }

  const ask = async (q) => {
    const finalQ = q || question
    if (!finalQ.trim()) return
    if (!apiKey) { setAnswer('API 키를 먼저 입력해줘! 오른쪽 위 🔑 버튼 클릭'); return }
    setLoading(true)
    const prompt = `너는 고등학생 친구처럼 반말로 솔직하게 말하는 AI야. 이모티콘 포함.
이번 달: 용돈 ${budget.amount.toLocaleString()}원 / 남은 ${remaining.toLocaleString()}원 (${ratio}%) / 지출 ${totalSpent.toLocaleString()}원 / 참은 횟수 ${savedCount}번
카테고리별: ${catSummary || '없음'}
질문: "${finalQ}"
3문장 이내.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 250, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '음... 잘 모르겠어!'
      setAnswer(text)
      onPouEmotion(ratio < 30 || text.includes('많이') || text.includes('위험') ? 'sad' : 'happy')
    } catch { setAnswer('지금 AI가 잠깐 자리 비웠어 😅') }
    setQuestion('')
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-label">🤖 AI 상담</div>

      {/* 이미지 미리보기 */}
      {preview && (
        <div style={{ marginBottom:10, position:'relative' }}>
          <img src={preview} alt="영수증" style={{ width:'100%', maxHeight:160, objectFit:'cover', borderRadius:10, border:'1.5px solid #E0E4FF' }} />
          <div style={{ display:'flex', gap:6, marginTop:7 }}>
            <button onClick={analyzeReceipt} disabled={loading} style={{
              flex:1, padding:'9px', background:'#4F46E5', color:'white', border:'none',
              borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}>📊 분석해서 기록하기</button>
            <button onClick={() => { setPreview(null); setImageFile(null) }} style={{
              padding:'9px 12px', background:'#FFF0F0', border:'1.5px solid #FECDD3',
              borderRadius:10, fontSize:13, color:'#EF4444', cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}>✕</button>
          </div>
        </div>
      )}

      <div className="ai-answer">
        {loading ? '🤔 분석 중...' : (answer || '영수증 찍거나 이미지 올리면 자동으로 지출 기록해줄게! 궁금한 것도 물어봐 😊')}
      </div>

      <div className="quick-q">
        {QUICK_Q.map(q => (
          <button key={q} className="quick-q-btn" onClick={() => ask(q)}>{q}</button>
        ))}
      </div>

      {/* 입력 영역 */}
      <div className="chat-input-row">
        <input className="chat-input" placeholder="뭐든 물어봐..." value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()} />

        {/* 카메라 버튼 */}
        <button
          onClick={() => cameraRef.current?.click()}
          title="카메라로 영수증 찍기"
          style={{ padding:'10px 13px', background:'#EEF2FF', border:'1.5px solid #C7D2FE', borderRadius:10, fontSize:18, cursor:'pointer' }}>
          📷
        </button>

        {/* 이미지 버튼 */}
        <button
          onClick={() => galleryRef.current?.click()}
          title="갤러리에서 이미지 선택"
          style={{ padding:'10px 13px', background:'#EEF2FF', border:'1.5px solid #C7D2FE', borderRadius:10, fontSize:18, cursor:'pointer' }}>
          🖼
        </button>

        <button className="chat-send" disabled={!question.trim() || loading} onClick={() => ask()}>→</button>
      </div>

      {/* 숨긴 파일 입력 - 카메라 */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        onChange={handleImage} style={{ display:'none' }} />

      {/* 숨긴 파일 입력 - 갤러리 */}
      <input ref={galleryRef} type="file" accept="image/*"
        onChange={handleImage} style={{ display:'none' }} />
    </div>
  )
}
