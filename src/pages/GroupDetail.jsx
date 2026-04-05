import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupsAPI, challengesAPI, listsAPI } from '../services/api';
import { Avatar, Icon, Modal, Input, AppIcon, timeAgo, showToast } from '../components/ui';
import useAuthStore from '../store/authStore';

const ICON_OPTIONS = [
  { icon:'trophy',bg:'#185FA5',label:'Trophy' },{ icon:'star',bg:'#378ADD',label:'Stars' },
  { icon:'water',bg:'#0C447C',label:'Water' },{ icon:'nutrition',bg:'#1A6DB5',label:'Health' },
  { icon:'activity',bg:'#2E86C1',label:'Activity' },{ icon:'people',bg:'#185FA5',label:'Team' },
  { icon:'list',bg:'#378ADD',label:'Tasks' },{ icon:'bell',bg:'#0C447C',label:'Daily' },
];

const LIST_CATEGORIES = [
  { label:'Places to Visit', symbol:'PL', category:'places', icon:'activity', bg:'#FF3B30' },
  { label:'Movies to Watch', symbol:'MV', category:'movies', icon:'star',     bg:'#5856D6' },
  { label:'Foods to Try',    symbol:'FD', category:'foods',  icon:'nutrition', bg:'#FF9500' },
  { label:'General',         symbol:'GN', category:'general',icon:'list',      bg:'#30D158' },
];

export default function GroupDetailPage() {
  const { id } = useParams();
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [group, setGroup]           = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [lists, setLists]           = useState([]);
  const [activities, setActivities] = useState([]);
  const [tab, setTab]               = useState('challenges');
  const [loading, setLoading]       = useState(true);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [showNewList, setShowNewList]           = useState(false);
  const [showInvite, setShowInvite]             = useState(false);

  const load = useCallback(async () => {
    try {
      const [gR, cR, lR] = await Promise.all([groupsAPI.get(id), challengesAPI.forGroup(id), listsAPI.forGroup(id)]);
      setGroup(gR.data.group);
      setChallenges(cR.data.challenges || []);
      setLists(lR.data.lists || []);
      groupsAPI.activity(id).then(r => setActivities(r.data.activities || [])).catch(()=>{});
    } catch { navigate('/'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const isCreator = group?.created_by === user?.id;
  const initials = n => n?.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';

  if (loading) return <div style={{padding:40,textAlign:'center',color:'var(--text-3)'}}>Loading...</div>;
  if (!group) return null;

  return (
    <div>
      {/* Header */}
      <div style={{background:'var(--card)',borderBottom:'0.5px solid var(--border)',padding:'16px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:48,height:48,borderRadius:13,background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18}}>
            {initials(group.name)}
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:20,fontWeight:700}}>{group.name}</h1>
            {group.description && <p style={{fontSize:13,color:'var(--text-3)'}}>{group.description}</p>}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowInvite(true)}>
            <Icon name="plus" size={13} color="var(--blue-dark)"/> Invite
          </button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:12}}>
          {group.members?.slice(0,6).map((m,i) => (
            <div key={m.user?.id} style={{marginLeft: i>0 ? -8 : 0, zIndex:10-i}}>
              <Avatar name={m.user?.display_name} color={m.user?.avatar_color || '#378ADD'} size={24} />
            </div>
          ))}
          <span style={{fontSize:12,color:'var(--text-3)',marginLeft:8}}>{group.members?.length} members</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{padding:'12px 20px',background:'var(--card)',borderBottom:'0.5px solid var(--border)'}}>
        <div className="tabs">
          {[
            {k:'challenges',l:`Challenges${challenges.length ? ` (${challenges.length})` : ''}`},
            {k:'lists',     l:`Lists${lists.length ? ` (${lists.length})` : ''}`},
            {k:'activity',  l:'Activity'},
          ].map(t => (
            <button key={t.k} className={`tab-btn ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* Challenges */}
        {tab === 'challenges' && (
          <>
            <button className="btn btn-ghost btn-full" style={{marginBottom:12}} onClick={()=>setShowNewChallenge(true)}>
              <Icon name="plus" size={14} color="var(--blue)"/> Start a Challenge
            </button>
            {challenges.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <p className="empty-title">No challenges yet</p>
                <p className="empty-sub">Start one above</p>
              </div>
            ) : challenges.map(c => (
              <ChallengeCard key={c.id} c={c} user={user} groupId={id} creatorId={group.created_by} onRefresh={load} />
            ))}
          </>
        )}

        {/* Lists */}
        {tab === 'lists' && (
          <>
            <button className="btn btn-ghost btn-full" style={{marginBottom:12}} onClick={()=>setShowNewList(true)}>
              <Icon name="plus" size={14} color="var(--blue)"/> New List
            </button>
            {lists.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p className="empty-title">No lists yet</p>
              </div>
            ) : lists.map(l => (
              <Link key={l.id} to={`/groups/${id}/lists/${l.id}`} className="list-row" style={{marginBottom:8,display:'flex'}}>
                <AppIcon icon="list" bg="#378ADD" size={42} />
                <div style={{flex:1,marginLeft:10}}>
                  <p style={{fontWeight:600}}>{l.name}</p>
                  <p style={{fontSize:12,color:'var(--text-3)'}}>{l.items?.[0]?.count ?? 0} items</p>
                </div>
                <Icon name="chevron" size={16} color="var(--text-4)"/>
              </Link>
            ))}
          </>
        )}

        {/* Activity */}
        {tab === 'activity' && (
          <>
            {activities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⚡</div>
                <p className="empty-title">No activity yet</p>
                <p className="empty-sub">Start a challenge to see activity here</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {activities.map(a => {
                  const iconMap = {
                    sugar_log:{ icon:'nutrition', bg:'#30D158' },
                    water_log:{ icon:'water',     bg:'#378ADD' },
                    point_given:{ icon:'star',    bg:'#FF9500' },
                    challenge_created:{ icon:'trophy', bg:'#5856D6' },
                    water_penalty:{ icon:'water', bg:'#FF3B30' },
                  };
                  const ic = iconMap[a.type] || { icon:'bell', bg:'#8E8E93' };
                  return (
                    <div key={a.id} className="activity-item">
                      <div className="activity-icon" style={{background:ic.bg}}>
                        <Icon name={ic.icon} size={16} color="#fff"/>
                      </div>
                      <div style={{flex:1}}>
                        <p className="activity-msg">{a.message}</p>
                        <p className="activity-time">{timeAgo(a.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Challenge Modal */}
      <NewChallengeModal open={showNewChallenge} onClose={()=>setShowNewChallenge(false)} groupId={id} onCreated={load} />

      {/* New List Modal */}
      <NewListModal open={showNewList} onClose={()=>setShowNewList(false)} groupId={id} onCreated={load} />

      {/* Invite Modal */}
      <InviteModal open={showInvite} onClose={()=>setShowInvite(false)} groupId={id} groupName={group.name} />
    </div>
  );
}

function ChallengeCard({ c, user, groupId, creatorId, onRefresh }) {
  const navigate  = useNavigate();
  const isCustom  = c.type === 'custom';
  const isWater   = c.type === 'water';
  const lowestWins = c.win_condition !== 'high';
  const sorted    = [...(c.scores||[])].sort((a,b) => lowestWins ? a.score-b.score : b.score-a.score);
  const hasPlayed = sorted.some(s => s.score > 0);
  const topScore  = sorted[0]?.score;
  const isTie     = hasPlayed && sorted.filter(s=>s.score===topScore).length > 1;
  const leader    = hasPlayed && !isTie ? sorted[0] : null;

  const iconInfo = isCustom
    ? { icon: c.icon_name || 'trophy', bg: c.icon_bg || '#0C447C' }
    : isWater
    ? { icon: 'water', bg: '#378ADD' }
    : { icon: 'nutrition', bg: '#30D158' };

  return (
    <div className="challenge-card" style={{marginBottom:10}} onClick={()=>navigate(`/groups/${groupId}/challenges/${c.id}`, { state:{ creatorId, challengeCreatorId: c.created_by } })}>
      <div className="challenge-card-top">
        <AppIcon icon={iconInfo.icon} bg={iconInfo.bg} size={44}/>
        <div style={{flex:1}}>
          <p style={{fontWeight:600}}>{c.name}</p>
          <p style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
            {isCustom ? `Custom · ${c.win_condition==='high'?'highest':'lowest'} score wins` : isWater ? `Water · ${c.target_value}L/day` : `Sugar Cut · ≤${c.threshold_grams}g/day`}
          </p>
          {hasPlayed && leader && <p style={{fontSize:12,color:'var(--blue)',marginTop:3}}>Leading: {leader.user_id===user?.id?'You':leader.user?.display_name?.split(' ')[0]} · {leader.score} pts</p>}
          {hasPlayed && isTie  && <p style={{fontSize:12,color:'var(--blue)',marginTop:3}}>Tied at {topScore} pts</p>}
        </div>
        <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Live' : 'Ended'}</span>
      </div>
      {hasPlayed && sorted.length > 0 && (
        <div className="score-row">
          {sorted.map(s => (
            <div key={s.user_id} className={`score-col ${s.user_id===user?.id?'me':''}`}>
              <span className="score-name">{s.user_id===user?.id?'You':s.user?.display_name?.split(' ')[0]}</span>
              <span className="score-num">{s.score}</span>
              <span className="score-pts">pts</span>
            </div>
          ))}
        </div>
      )}
      {!hasPlayed && (
        <div className="challenge-footer gray">No scores yet · tap to play</div>
      )}
    </div>
  );
}

function NewChallengeModal({ open, onClose, groupId, onCreated }) {
  const [type, setType]         = useState('sugar_cut');
  const [name, setName]         = useState('');
  const [threshold, setThreshold] = useState('20');
  const [targetL, setTargetL]   = useState('2');
  const [frequency, setFrequency] = useState('daily');
  const [winCond, setWinCond]   = useState('high');
  const [selIcon, setSelIcon]   = useState(ICON_OPTIONS[0]);
  const [loading, setLoading]   = useState(false);

  const switchType = t => { setType(t); setName(''); setWinCond(t==='custom'?'high':'low'); };

  const submit = async () => {
    if (!name.trim()) return showToast('Enter a challenge name', 'error');
    setLoading(true);
    try {
      await challengesAPI.create({
        groupId, name: name.trim(), type,
        thresholdGrams: type==='sugar_cut' ? parseFloat(threshold) : null,
        targetValue:    type==='water'     ? parseFloat(targetL)   : null,
        iconName:       type==='custom'    ? selIcon.icon : null,
        iconBg:         type==='custom'    ? selIcon.bg   : null,
        frequency, winCondition: winCond,
      });
      showToast('Challenge started!', 'success');
      onClose(); onCreated();
    } catch(err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Start a Challenge">
      <p className="section-label" style={{marginBottom:8}}>Type</p>
      {[
        { t:'sugar_cut', l:'Sugar Cut',   d:'Exceed limit → +1 pt. Lowest wins.', icon:'nutrition', bg:'#30D158' },
        { t:'water',     l:'Water',        d:'Miss daily goal → +1 pt. Lowest wins.', icon:'water', bg:'#378ADD' },
        { t:'custom',    l:'Custom',       d:'Manual points. You choose who wins.', icon:'trophy', bg:'#0C447C' },
      ].map(opt => (
        <div key={opt.t} onClick={()=>switchType(opt.t)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:type===opt.t?'var(--blue-light)':'var(--bg)',border:`1px solid ${type===opt.t?'var(--blue-border)':'transparent'}`,cursor:'pointer',marginBottom:8}}>
          <AppIcon icon={opt.icon} bg={opt.bg} size={38}/>
          <div style={{flex:1}}>
            <p style={{fontWeight:600,fontSize:14,color:type===opt.t?'var(--blue-dark)':'var(--text)'}}>{opt.l}</p>
            <p style={{fontSize:12,color:'var(--text-3)'}}>{opt.d}</p>
          </div>
          {type===opt.t && <Icon name="check" size={18} color="var(--blue)"/>}
        </div>
      ))}

      {type==='custom' && (
        <>
          <p className="section-label" style={{marginTop:16,marginBottom:8}}>Icon</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
            {ICON_OPTIONS.map(o => (
              <div key={o.icon} onClick={()=>setSelIcon(o)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',padding:6,borderRadius:10,background:selIcon.icon===o.icon?'var(--blue-light)':'transparent',border:`1.5px solid ${selIcon.icon===o.icon?'var(--blue)':'transparent'}`}}>
                <AppIcon icon={o.icon} bg={o.bg} size={38}/>
                <span style={{fontSize:10,color:'var(--text-3)'}}>{o.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Input label="Challenge name" value={name} onChange={e=>setName(e.target.value)} placeholder={type==='sugar_cut'?'e.g. Cut Sugar Jan':type==='water'?'e.g. 3L Water Challenge':'e.g. Most Steps'} />
      {type==='sugar_cut' && <Input label="Daily sugar limit (g)" value={threshold} onChange={e=>setThreshold(e.target.value)} type="number" placeholder="20" />}
      {type==='water'     && <Input label="Daily water target (L)" value={targetL} onChange={e=>setTargetL(e.target.value)} type="number" placeholder="2" />}

      {type==='custom' && (
        <>
          <p className="section-label" style={{marginTop:4,marginBottom:8}}>Frequency</p>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {[{v:'daily',l:'Daily'},{v:'weekly',l:'Weekly (Sundays)'}].map(o => (
              <button key={o.v} onClick={()=>setFrequency(o.v)} style={{flex:1,padding:'9px',borderRadius:10,border:`1.5px solid ${frequency===o.v?'var(--blue)':'var(--border)'}`,background:frequency===o.v?'var(--blue-light)':'var(--card)',color:frequency===o.v?'var(--blue-dark)':'var(--text-3)',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font)'}}>
                {o.l}
              </button>
            ))}
          </div>
          <p className="section-label" style={{marginBottom:8}}>Win condition</p>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {[{v:'high',l:'High score wins'},{v:'low',l:'Low score wins'}].map(o => (
              <button key={o.v} onClick={()=>setWinCond(o.v)} style={{flex:1,padding:'9px',borderRadius:10,border:`1.5px solid ${winCond===o.v?'var(--blue)':'var(--border)'}`,background:winCond===o.v?'var(--blue-light)':'var(--card)',color:winCond===o.v?'var(--blue-dark)':'var(--text-3)',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font)'}}>
                {o.l}
              </button>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
        {loading ? 'Starting...' : 'Start Challenge'}
      </button>
    </Modal>
  );
}

function NewListModal({ open, onClose, groupId, onCreated }) {
  const [name, setName]         = useState('');
  const [category, setCategory] = useState('places');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const cat = LIST_CATEGORIES.find(c=>c.category===category);
      await listsAPI.create({ groupId, name: name.trim(), category, emoji: cat?.symbol || 'GN' });
      showToast('List created!', 'success');
      onClose(); onCreated(); setName('');
    } catch(err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New List">
      <Input label="List name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Movies to Watch" />
      <p className="section-label" style={{marginBottom:8}}>Category</p>
      <div style={{background:'var(--bg)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
        {LIST_CATEGORIES.map((c,i) => (
          <div key={c.category} onClick={()=>setCategory(c.category)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:category===c.category?'var(--blue-light)':'transparent',borderBottom:i<LIST_CATEGORIES.length-1?'0.5px solid var(--border)':'none',cursor:'pointer'}}>
            <AppIcon icon={c.icon} bg={c.bg} size={34}/>
            <span style={{flex:1,fontSize:14,fontWeight:500,color:category===c.category?'var(--blue-dark)':'var(--text)'}}>{c.label}</span>
            {category===c.category && <Icon name="check" size={16} color="var(--blue)"/>}
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-full" onClick={submit} disabled={loading || !name.trim()}>
        {loading ? 'Creating...' : 'Create List'}
      </button>
    </Modal>
  );
}

function InviteModal({ open, onClose, groupId, groupName }) {
  const [friends, setFriends]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [inviting, setInviting] = useState(null);
  useEffect(() => {
    if (!open) return;
    import('../services/api').then(({ friendsAPI }) => {
      friendsAPI.list().then(r => setFriends(r.data.friends || [])).catch(()=>{});
    });
  }, [open]);

  const invite = async (f) => {
    setInviting(f.id);
    try {
      await groupsAPI.invite(groupId, f.id);
      showToast(`${f.display_name} added!`, 'success');
      setFriends(prev => prev.filter(x => x.id !== f.id));
    } catch(err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setInviting(null); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Invite to ${groupName}`}>
      {friends.length === 0 ? (
        <div className="empty-state" style={{padding:'24px 0'}}>
          <p className="empty-title">No friends to invite</p>
          <p className="empty-sub">Add friends first from the Friends tab</p>
        </div>
      ) : friends.map(f => (
        <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'0.5px solid var(--border)'}}>
          <Avatar name={f.display_name} color={f.avatar_color || '#378ADD'} size={40}/>
          <div style={{flex:1}}>
            <p style={{fontWeight:600}}>{f.display_name}</p>
            <p style={{fontSize:12,color:'var(--text-3)'}}>@{f.username}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={()=>invite(f)} disabled={inviting===f.id}>
            {inviting===f.id ? '...' : 'Invite'}
          </button>
        </div>
      ))}
    </Modal>
  );
}
