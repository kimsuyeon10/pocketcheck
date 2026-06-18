import { useState } from 'react'

const CATS = {'🍔':'먹기','🧋':'카페','🎮':'게임','👕':'쇼핑','🚌':'교통','🎵':'문화','📦':'기타'}
const CAT_COLOR = {'🍔':'#EF4444','🧋':'#F59E0B','🎮':'#7C3AED','👕':'#3B82F6','🚌':'#10B981','🎵':'#EC4899','📦':'#64748B'}

export default function RecentCard({ monthSpends, totalSpent }) {
  const [view, setView] = useState('recent') // recent | report

  const catData = Object.entries(
    monthSpends.filter(s => !s.saved).reduce((acc, s) => {
      acc[s.emoji] = (acc[s.emoji] || 0) + s.amount; return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="card">
      {/* 탭 */}
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {[['recent','최근 내역'],['report','월별 리포트']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer',
            fontSize:11, fontWeight:700, fontFamily:'Inter,sans-serif',
            background: view === v ? '#4F46E5' : '#F4F6FF',
            color: view === v ? 'white' : '#94a3b8',
          }}>{label}</button>
        ))}
      </div>

      {view === 'recent' && (
        <div className="recent-list">
          {monthSpends.length > 0 ? monthSpends.slice(0, 8).map(s => (
            <div key={s.id} className="recent-item">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className="recent-icon">{s.emoji}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#1e293b' }}>
                    {s.saved ? `${CATS[s.emoji]} — 참음` : (s.name || CATS[s.emoji] || '기타')}
                  </div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>
                    {new Date(s.date).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:s.saved?'#4F46E5':'#EF4444' }}>
                {s.saved ? '절약! 🎉' : `-${s.amount.toLocaleString()}원`}
              </div>
            </div>
          )) : (
            <div style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>🌟</div>
              <div style={{ fontSize:12, fontWeight:600 }}>아직 내역이 없어요</div>
            </div>
          )}
        </div>
      )}

      {view === 'report' && (
        <div>
          {catData.length > 0 ? (
            <>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>
                이번 달 총 <span style={{ color:'#EF4444', fontWeight:700 }}>{totalSpent.toLocaleString()}원</span> 지출
              </div>
              {catData.map(([emoji, amount], i) => {
                const pct = totalSpent > 0 ? Math.round(amount / totalSpent * 100) : 0
                return (
                  <div key={emoji} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:14 }}>{emoji}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:'#1e293b' }}>{CATS[emoji]}</span>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color: CAT_COLOR[emoji] || '#64748B' }}>
                        {amount.toLocaleString()}원 <span style={{ color:'#94a3b8', fontWeight:500 }}>({pct}%)</span>
                      </div>
                    </div>
                    <div style={{ background:'#F4F6FF', borderRadius:4, height:5, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: CAT_COLOR[emoji] || '#64748B', borderRadius:4 }} />
                    </div>
                  </div>
                )
              })}
              {/* 절약 통계 */}
              {monthSpends.filter(s=>s.saved).length > 0 && (
                <div style={{ marginTop:12, padding:'10px 12px', background:'#EEF2FF', borderRadius:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#4F46E5', marginBottom:2 }}>절약 현황 💪</div>
                  <div style={{ fontSize:12, color:'#4F46E5' }}>
                    {monthSpends.filter(s=>s.saved).length}번 참아서 {monthSpends.filter(s=>s.saved).reduce((a,s)=>a+s.amount,0).toLocaleString()}원 아꼈어!
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>📊</div>
              <div style={{ fontSize:12, fontWeight:600 }}>아직 지출 내역이 없어요</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
