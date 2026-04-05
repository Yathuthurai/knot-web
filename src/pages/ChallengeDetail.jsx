import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { challengesAPI } from '../services/api';
import { Avatar, Icon, AppIcon, showToast, Modal } from '../components/ui';
import useAuthStore from '../store/authStore';

function getMotivation(rank, total, leaderName) {
  if (total <= 1) return 'Invite friends to compete!';
  if (rank === 1) return "You're in the lead — keep it up!";
  if (rank === 2) return `So close! Just behind ${leaderName}`;
  if (rank === total) return "Time to catch up — you've got this!";
  return `Keep going — #${rank} of ${total}`;
}

function Leaderboard({ scores, user, isTie, topScore, isAdmin, onEdit }) {
  return (
    <div className="lb-card">
      {scores.length === 0 && <div style={{padding:24,textAlign:'center',color:'var(--text-3)'}}>No scores yet</div>}
      {scores.map((s, i) => {
        const isMe  = s.user_id === user?.id;
        const isTop = s.score === topScore && !isTie;
        const rank  = isTie && s.score === topScore ? 'TIE' : i===0?'#1':i===1?'#2':i===2?'#3':`#${i+1}`;
        return (
          <div key={s.user_id} className={`lb-row ${isMe?'me':''}`}
            onDoubleClick={() => isAdmin && onEdit(s)}
            title={isAdmin ? 'Double-click to edit score' : ''}>
            <span className="lb-rank">{rank}</span>
            <Avatar name={s.user?.display_name} color={isMe?'var(--blue)':'#E5E5EA'} size={38}/>
            <div style={{flex:1,marginLeft:10}}>
              <p style={{fontWeight:isMe?700:500,color:isMe?'var(--blue)':'var(--text)'}}>{s.user?.display_name}{isMe?' (you)':''}</p>
              {isTop && <p style={{fontSize:11,color:'var(--blue)'}}>Leading</p>}
              {isTie && s.score===topScore && <p style={{fontSize:11,color:'var(--blue)'}}>Tied at top</p>}
            </div>
            <span style={{fontSize:16,fontWeight:700,color:isTop?'var(--blue)':'var(--text-3)'}}>{s.score} pts</span>
          </div>
        );
      })}
    </div>
  );
}

function SugarCutView({ challenge, user, onRefresh, isCreator, onDelete }) {
  const [grams, setGrams]               = useState('');
  const [logging, setLogging]           = useState(false);
  const [alreadyLogged, setAlreadyLogged] = useState(false);
  const [logResult, setLogResult]       = useState(null);
  const isAdmin = challenge?.my_role === 'admin';
  const threshold = challenge?.threshold_grams ?? 20;
  const sorted  = [...(challenge?.scores||[])].sort((a,b)=>a.score-b.score);
  const topScore = sorted[0]?.score;
  const isTie   = sorted.filter(s=>s.score===topScore).length > 1;
  const leader  = !isTie ? sorted[0] : null;
  const isLeading = leader?.user_id === user?.id;
  const myIdx   = sorted.findIndex(s=>s.user_id===user?.id);
  const myEntry = myIdx >= 0 ? sorted[myIdx] : null;
  const gramsNum = parseFloat(grams)||0;
  const wouldPenalty = gramsNum > threshold;

  const logIntake = async () => {
    if (!grams || isNaN(grams)) return;
    setLogging(true); setLogResult(null);
    try {
      const r = await challengesAPI.log(challenge.id, parseFloat(grams));
      setLogResult(r.data); setGrams(''); onRefresh();
    } catch(e) {
      if (e.response?.data?.alreadyLogged) setAlreadyLogged(true);
      else showToast(e.response?.data?.error || 'Failed', 'error');
    } finally { setLogging(false); }
  };

  const editScore = async (s) => {
    const val = prompt(`Set score for ${s.user?.display_name}:`, s.score);
    if (val === null) return;
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    try { await challengesAPI.editScore(challenge.id, s.user_id, n); onRefresh(); }
    catch { showToast('Failed', 'error'); }
  };

  const resetGame = async () => {
    if (!window.confirm('Reset all scores? Cannot be undone.')) return;
    try { await challengesAPI.reset(challenge.id); onRefresh(); showToast('Game reset', 'success'); }
    catch { showToast('Failed', 'error'); }
  };

  const deleteChallenge = async () => {
    if (!window.confirm('Delete this challenge permanently?')) return;
    try { await challengesAPI.delete(challenge.id); showToast('Challenge deleted', 'success'); window.history.back(); }
    catch { showToast('Failed', 'error'); }
  };

  return (
    <div className="page-content">
      {/* Info */}
      <div className="card" style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
        <AppIcon icon="nutrition" bg="#30D158" size={38}/>
        <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6}}>
          Stay under <strong>{threshold}g</strong> of sugar daily. Exceed it → <strong>+1 point</strong>. Lowest score wins. One log per day.
        </p>
      </div>

      {/* Spotlight */}
      {sorted.length > 1 && (isTie ? (
        <div className="card" style={{background:'var(--blue-light)',marginBottom:12}}>
          <p style={{fontWeight:700,color:'var(--blue-dark)'}}>It's a tie!</p>
          <p style={{fontSize:13,color:'var(--blue)'}}>{sorted.filter(s=>s.score===topScore).map(s=>s.user_id===user?.id?'You':s.user?.display_name?.split(' ')[0]).join(' & ')} · {topScore} pts each</p>
        </div>
      ) : leader && (
        <div className="card" style={{background:'var(--blue-light)',display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
          <Avatar name={leader.user?.display_name} color="var(--blue)" size={48}/>
          <div>
            <p style={{fontSize:11,fontWeight:600,color:'var(--blue)',textTransform:'uppercase',letterSpacing:0.5}}>Leading</p>
            <p style={{fontSize:20,fontWeight:800,color:'var(--blue-darker)'}}>{isLeading?'You!':leader.user?.display_name}</p>
            <p style={{fontSize:13,color:'var(--blue)'}}>{leader.score} pts</p>
          </div>
        </div>
      ))}

      {/* Motivation */}
      {myEntry && !isTie && (
        <div className="card" style={{marginBottom:12}}>
          <p style={{fontSize:14,fontWeight:500,color:'var(--blue-dark)'}}>{getMotivation(myIdx+1, sorted.length, leader?.user?.display_name?.split(' ')[0])}</p>
          <p style={{fontSize:12,color:'var(--text-3)',marginTop:4}}>Your score: {myEntry.score} pts · #{myIdx+1}</p>
        </div>
      )}

      {/* Log */}
      {challenge.is_active && (
        <div className="card" style={{marginBottom:12}}>
          <p style={{fontWeight:600,marginBottom:12}}>Log today's intake</p>
          {alreadyLogged ? (
            <div style={{display:'flex',gap:8,alignItems:'center',background:'var(--blue-light)',padding:'10px 12px',borderRadius:10}}>
              <Icon name="check" size={16} color="var(--blue)"/>
              <p style={{fontSize:13,color:'var(--blue-dark)'}}>Already logged today. Come back tomorrow!</p>
            </div>
          ) : (
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <input className="input" type="number" value={grams} onChange={e=>setGrams(e.target.value)}
                placeholder="0" style={{width:100,textAlign:'center',fontSize:24,fontWeight:700}} disabled={logging}/>
              <span style={{color:'var(--text-3)',fontSize:14}}>grams</span>
              <button className="btn btn-primary" onClick={logIntake} disabled={!grams||logging} style={{marginLeft:'auto'}}>
                {logging ? 'Logging...' : 'Log'}
              </button>
            </div>
          )}
          {grams && wouldPenalty && <p style={{fontSize:12,color:'var(--warning)',marginTop:8}}>⚠ Over {threshold}g — +1 point today</p>}
          {grams && !wouldPenalty && gramsNum>0 && <p style={{fontSize:12,color:'var(--success)',marginTop:8}}>✓ Under the limit — no penalty!</p>}
          {logResult && (
            <div style={{marginTop:10,padding:'10px 12px',borderRadius:10,background:logResult.penaltyApplied?'#FFF3E0':'#E8F8ED'}}>
              <p style={{fontWeight:600,color:logResult.penaltyApplied?'var(--warning)':'var(--success)'}}>
                {logResult.penaltyApplied ? `+1 point. Total: ${logResult.score} pts` : `Logged ${logResult.grams}g — no penalty!`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <p className="section-label" style={{marginBottom:8}}>Leaderboard</p>
      <Leaderboard scores={sorted} user={user} isTie={isTie} topScore={topScore} isAdmin={isAdmin} onEdit={editScore}/>
      {isAdmin && <p style={{fontSize:11,color:'var(--text-4)',textAlign:'center',marginTop:8}}>Double-click a row to edit score</p>}

      {isCreator && (
        <button className="btn btn-danger btn-full" style={{marginTop:16}} onClick={resetGame}>
          <Icon name="refresh" size={15} color="var(--danger)"/> Reset Game
        </button>
      )}
      {onDelete && (
        <button className="btn btn-danger btn-full" style={{marginTop:8}} onClick={deleteChallenge}>
          <Icon name="trash" size={15} color="var(--danger)"/> Delete Challenge
        </button>
      )}
    </div>
  );
}

function WaterView({ challenge, user, onRefresh, isCreator, onDelete }) {
  const [litres, setLitres]             = useState('');
  const [logging, setLogging]           = useState(false);
  const [localTodayMl, setLocalTodayMl] = useState(null);
  const targetL  = challenge?.target_value ?? 2;
  const targetMl = targetL * 1000;
  const sorted   = [...(challenge?.scores||[])].sort((a,b)=>a.score-b.score);
  const topScore = sorted[0]?.score;
  const isTie    = sorted.filter(s=>s.score===topScore).length > 1;
  const leader   = !isTie ? sorted[0] : null;
  const isLeading = leader?.user_id === user?.id;
  const todayMl  = localTodayMl ?? (challenge?.my_today_ml ?? 0);
  const remaining = Math.max(0, targetMl - todayMl);
  const pct      = Math.min(1, todayMl / targetMl);
  const goalReached = todayMl >= targetMl;
  const litresNum = parseFloat(litres)||0;
  const isAdmin  = challenge?.my_role === 'admin';

  const logWater = async () => {
    const ml = Math.round(litresNum * 1000);
    if (!litres || isNaN(litresNum) || litresNum <= 0) return;
    setLogging(true);
    try {
      const r = await challengesAPI.logWater(challenge.id, ml);
      setLocalTodayMl(r.data.todayMl);
      setLitres('');
      const msg = r.data.goalReached ? 'Water goal reached! 💧' : `Logged! ${(r.data.todayMl/1000).toFixed(2)}L today`;
      showToast(msg, r.data.goalReached ? 'success' : '');
    } catch(e) { showToast(e.response?.data?.error||'Failed','error'); }
    finally { setLogging(false); }
  };

  const editScore = async (s) => {
    const val = prompt(`Set score for ${s.user?.display_name}:`, s.score);
    if (val === null) return;
    const n = parseInt(val); if (isNaN(n)||n<0) return;
    try { await challengesAPI.editScore(challenge.id, s.user_id, n); onRefresh(); }
    catch { showToast('Failed','error'); }
  };

  const resetGame = async () => {
    if (!window.confirm('Reset all scores?')) return;
    try { await challengesAPI.reset(challenge.id); onRefresh(); showToast('Reset!','success'); }
    catch { showToast('Failed','error'); }
  };

  const deleteChallenge = async () => {
    if (!window.confirm('Delete this challenge?')) return;
    try { await challengesAPI.delete(challenge.id); showToast('Deleted','success'); window.history.back(); }
    catch { showToast('Failed','error'); }
  };

  return (
    <div className="page-content">
      <div className="card" style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
        <AppIcon icon="water" bg="#378ADD" size={38}/>
        <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6}}>
          Drink at least <strong>{targetL}L</strong> daily. Fall short → <strong>+1 point</strong>. Lowest score wins.
        </p>
      </div>

      {sorted.length > 1 && (isTie ? (
        <div className="card" style={{background:'var(--blue-light)',marginBottom:12}}>
          <p style={{fontWeight:700,color:'var(--blue-dark)'}}>It's a tie!</p>
          <p style={{fontSize:13,color:'var(--blue)'}}>{sorted.filter(s=>s.score===topScore).map(s=>s.user_id===user?.id?'You':s.user?.display_name?.split(' ')[0]).join(' & ')} · {topScore} pts each</p>
        </div>
      ) : leader && (
        <div className="card" style={{background:'var(--blue-light)',display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
          <Avatar name={leader.user?.display_name} color="var(--blue)" size={48}/>
          <div>
            <p style={{fontSize:11,fontWeight:600,color:'var(--blue)',textTransform:'uppercase',letterSpacing:0.5}}>Leading</p>
            <p style={{fontSize:20,fontWeight:800,color:'var(--blue-darker)'}}>{isLeading?'You!':leader.user?.display_name}</p>
            <p style={{fontSize:13,color:'var(--blue)'}}>{leader.score} pts</p>
          </div>
        </div>
      ))}

      {/* Today progress */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
          <p style={{fontWeight:600}}>Today's intake</p>
          <p style={{fontSize:13,color:goalReached?'var(--success)':'var(--blue)',fontWeight:600}}>
            {goalReached ? 'Goal reached!' : `${(remaining/1000).toFixed(2)}L left`}
          </p>
        </div>
        <div className="progress-bar" style={{marginBottom:6}}>
          <div className="progress-fill" style={{width:`${pct*100}%`,background:goalReached?'var(--success)':'var(--blue)'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)'}}>
          <span>{(todayMl/1000).toFixed(2)}L logged</span>
          <span>Goal: {targetL}L</span>
        </div>

        {challenge.is_active && (
          <div style={{marginTop:14}}>
            <p style={{fontWeight:600,fontSize:14,marginBottom:10}}>Log more water</p>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <input className="input" type="number" value={litres} onChange={e=>setLitres(e.target.value)}
                placeholder="0.0" step="0.1" style={{width:100,textAlign:'center',fontSize:22,fontWeight:700}} disabled={logging}/>
              <span style={{color:'var(--text-3)'}}>L</span>
              <button className="btn btn-primary" onClick={logWater} disabled={!litres||logging} style={{marginLeft:'auto'}}>
                {logging ? 'Adding...' : 'Add'}
              </button>
            </div>
            {litres && litresNum > 0 && (
              <p style={{fontSize:12,color:(todayMl+litresNum*1000)>=targetMl?'var(--success)':'var(--blue)',marginTop:8}}>
                After: {((todayMl+litresNum*1000)/1000).toFixed(2)}L / {targetL}L
                {(todayMl+litresNum*1000)>=targetMl?' ✓ Goal reached!':''}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="section-label" style={{marginBottom:8}}>Leaderboard</p>
      <Leaderboard scores={sorted} user={user} isTie={isTie} topScore={topScore} isAdmin={isAdmin} onEdit={editScore}/>
      {isAdmin && <p style={{fontSize:11,color:'var(--text-4)',textAlign:'center',marginTop:8}}>Double-click to edit</p>}

      {isCreator && <button className="btn btn-danger btn-full" style={{marginTop:16}} onClick={resetGame}><Icon name="refresh" size={15} color="var(--danger)"/> Reset Game</button>}
      {onDelete  && <button className="btn btn-danger btn-full" style={{marginTop:8}} onClick={deleteChallenge}><Icon name="trash" size={15} color="var(--danger)"/> Delete Challenge</button>}
    </div>
  );
}

function CustomView({ challenge, user, onRefresh, isCreator, onDelete }) {
  const [showGivePoint, setShowGivePoint] = useState(false);
  const [target, setTarget]       = useState(null);
  const [note, setNote]           = useState('');
  const [adding, setAdding]       = useState(false);
  const lowestWins = challenge?.win_condition === 'low';
  const sorted  = [...(challenge?.scores||[])].sort((a,b)=>lowestWins?a.score-b.score:b.score-a.score);
  const topScore = sorted[0]?.score;
  const isTie   = sorted.filter(s=>s.score===topScore).length > 1;
  const leader  = !isTie ? sorted[0] : null;
  const isLeading = leader?.user_id === user?.id;
  const isAdmin = challenge?.my_role === 'admin';

  const iconInfo = { icon: challenge.icon_name || 'trophy', bg: challenge.icon_bg || '#0C447C' };

  const addPoint = async () => {
    if (!target) return;
    setAdding(true);
    try {
      await challengesAPI.addPoint(challenge.id, target.user_id, note||null);
      showToast(`Point given to ${target.user_id===user?.id?'yourself':target.user?.display_name?.split(' ')[0]}!`, 'success');
      setShowGivePoint(false); setNote(''); setTarget(null); onRefresh();
    } catch(e) { showToast(e.response?.data?.error||'Failed','error'); }
    finally { setAdding(false); }
  };

  const editScore = async (s) => {
    const val = prompt(`Set score for ${s.user?.display_name}:`, s.score);
    if (val === null) return;
    const n = parseInt(val); if (isNaN(n)||n<0) return;
    try { await challengesAPI.editScore(challenge.id, s.user_id, n); onRefresh(); }
    catch { showToast('Failed','error'); }
  };

  const resetGame = async () => {
    if (!window.confirm('Reset all scores?')) return;
    try { await challengesAPI.reset(challenge.id); onRefresh(); showToast('Reset!','success'); }
    catch { showToast('Failed','error'); }
  };

  const deleteChallenge = async () => {
    if (!window.confirm('Delete this challenge?')) return;
    try { await challengesAPI.delete(challenge.id); showToast('Deleted','success'); window.history.back(); }
    catch { showToast('Failed','error'); }
  };

  return (
    <div className="page-content">
      <div className="card" style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
        <AppIcon icon={iconInfo.icon} bg={iconInfo.bg} size={38}/>
        <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6}}>
          Give points to any member. <strong>{lowestWins?'Lowest':'Highest'} score wins</strong>. Everyone can give and receive.
        </p>
      </div>

      {sorted.length > 1 && (isTie ? (
        <div className="card" style={{background:'var(--blue-light)',marginBottom:12}}>
          <p style={{fontWeight:700,color:'var(--blue-dark)'}}>It's a tie!</p>
          <p style={{fontSize:13,color:'var(--blue)'}}>{sorted.filter(s=>s.score===topScore).map(s=>s.user_id===user?.id?'You':s.user?.display_name?.split(' ')[0]).join(' & ')} · {topScore} pts each</p>
        </div>
      ) : leader && (
        <div className="card" style={{background:'var(--blue-light)',display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
          <Avatar name={leader.user?.display_name} color="var(--blue)" size={48}/>
          <div>
            <p style={{fontSize:11,fontWeight:600,color:'var(--blue)',textTransform:'uppercase',letterSpacing:0.5}}>Leading</p>
            <p style={{fontSize:20,fontWeight:800,color:'var(--blue-darker)'}}>{isLeading?'You!':leader.user?.display_name}</p>
            <p style={{fontSize:13,color:'var(--blue)'}}>{leader.score} pts</p>
          </div>
        </div>
      ))}

      {challenge.is_active && (
        <button className="btn btn-secondary btn-full" style={{marginBottom:12}} onClick={()=>setShowGivePoint(true)}>
          <Icon name="star" size={15} color="var(--blue-dark)"/> Give a Point
        </button>
      )}

      <p className="section-label" style={{marginBottom:8}}>Leaderboard</p>
      <Leaderboard scores={sorted} user={user} isTie={isTie} topScore={topScore} isAdmin={isAdmin} onEdit={editScore}/>
      {isAdmin && <p style={{fontSize:11,color:'var(--text-4)',textAlign:'center',marginTop:8}}>Double-click to edit</p>}

      {isCreator && <button className="btn btn-danger btn-full" style={{marginTop:16}} onClick={resetGame}><Icon name="refresh" size={15} color="var(--danger)"/> Reset Game</button>}
      {onDelete  && <button className="btn btn-danger btn-full" style={{marginTop:8}} onClick={deleteChallenge}><Icon name="trash" size={15} color="var(--danger)"/> Delete Challenge</button>}

      <Modal open={showGivePoint} onClose={()=>{setShowGivePoint(false);setTarget(null);setNote('');}} title="Give a Point">
        <p className="section-label" style={{marginBottom:8}}>Who gets the point?</p>
        <div style={{background:'var(--bg)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
          {sorted.map((s,i) => (
            <div key={s.user_id} onClick={()=>setTarget(s)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:target?.user_id===s.user_id?'var(--blue-light)':'transparent',borderBottom:i<sorted.length-1?'0.5px solid var(--border)':'none',cursor:'pointer'}}>
              <Avatar name={s.user?.display_name} color={target?.user_id===s.user_id?'var(--blue)':'#E5E5EA'} size={40}/>
              <div style={{flex:1}}>
                <p style={{fontWeight:600}}>{s.user?.display_name}{s.user_id===user?.id?' (you)':''}</p>
                <p style={{fontSize:12,color:'var(--text-3)'}}>{s.score} pts</p>
              </div>
              {target?.user_id===s.user_id && <Icon name="check" size={18} color="var(--blue)"/>}
            </div>
          ))}
        </div>
        <div className="input-group">
          <label className="input-label">Note (optional)</label>
          <textarea className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Why do they deserve it?" rows={2} style={{resize:'vertical'}}/>
        </div>
        <button className="btn btn-primary btn-full" onClick={addPoint} disabled={!target||adding}>
          {adding ? 'Giving...' : target ? `Give +1 to ${target.user_id===user?.id?'yourself':target.user?.display_name?.split(' ')[0]}` : 'Select someone first'}
        </button>
      </Modal>
    </div>
  );
}

export default function ChallengeDetailPage() {
  const { groupId, challengeId } = useParams();
  const location = useLocation();
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { creatorId, challengeCreatorId } = location.state || {};

  const load = useCallback(async () => {
    try {
      const r = await challengesAPI.forGroup(groupId);
      const found = (r.data.challenges||[]).find(c=>c.id===challengeId);
      if (found) setChallenge(found);
    } catch {} finally { setLoading(false); }
  }, [groupId, challengeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{padding:40,textAlign:'center',color:'var(--text-3)'}}>Loading...</div>;
  if (!challenge) return null;

  const isCreator       = user?.id === creatorId;
  const isChallengeOwner = user?.id === challengeCreatorId;
  const canDelete       = isCreator || isChallengeOwner;

  const props = { challenge, user, onRefresh: load, isCreator, onDelete: canDelete ? ()=>{} : null };

  return (
    <div>
      <div style={{padding:'16px 20px',background:'var(--card)',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--blue)',display:'flex',alignItems:'center',gap:4,fontFamily:'var(--font)',fontWeight:600,fontSize:14}}>
          <Icon name="back" size={16} color="var(--blue)"/> Back
        </button>
        <h1 style={{fontSize:18,fontWeight:700,flex:1}}>{challenge.name}</h1>
        <span className={`badge ${challenge.is_active?'badge-green':'badge-gray'}`}>{challenge.is_active?'Live':'Ended'}</span>
      </div>
      {challenge.type === 'custom'
        ? <CustomView   {...props} />
        : challenge.type === 'water'
        ? <WaterView    {...props} />
        : <SugarCutView {...props} />}
    </div>
  );
}
