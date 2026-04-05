import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listsAPI, friendsAPI, usersAPI } from '../services/api';
import { Avatar, Icon, showToast, Modal } from '../components/ui';
import useAuthStore from '../store/authStore';

// ── List Detail ───────────────────────────────────────────────────────────────
export function ListDetailPage() {
  const { groupId, listId } = useParams();
  const navigate = useNavigate();
  const [list, setList]       = useState(null);
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding]   = useState(false);

  const load = useCallback(async () => {
    try { const r = await listsAPI.get(listId); setList(r.data); } catch {}
  }, [listId]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try { await listsAPI.addItem(listId, newItem.trim()); setNewItem(''); load(); }
    catch { showToast('Failed', 'error'); } finally { setAdding(false); }
  };

  const toggle = async (item) => {
    setList(l => ({ ...l, items: l.items.map(i => i.id===item.id ? {...i,is_done:!i.is_done} : i) }));
    try { await listsAPI.toggleItem(listId, item.id, !item.is_done); }
    catch { load(); }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Remove "${item.content}"?`)) return;
    try { await listsAPI.deleteItem(listId, item.id); load(); }
    catch { showToast('Failed', 'error'); }
  };

  const done  = list?.items?.filter(i=>i.is_done).length ?? 0;
  const total = list?.items?.length ?? 0;
  const pct   = total > 0 ? done/total : 0;

  return (
    <div>
      <div style={{padding:'16px 20px',background:'var(--card)',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--blue)',display:'flex',alignItems:'center',gap:4,fontFamily:'var(--font)',fontWeight:600,fontSize:14}}>
          <Icon name="back" size={16} color="var(--blue)"/> Back
        </button>
        <h1 style={{fontSize:18,fontWeight:700,flex:1}}>{list?.name || 'List'}</h1>
      </div>

      {total > 0 && (
        <div style={{padding:'10px 20px',background:'var(--card)',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
          <div className="progress-bar" style={{flex:1}}>
            <div className="progress-fill" style={{width:`${pct*100}%`}}/>
          </div>
          <span style={{fontSize:12,color:'var(--text-3)',minWidth:40,textAlign:'right'}}>{done}/{total}</span>
        </div>
      )}

      <div className="page-content">
        {/* Add item */}
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          <input className="input" value={newItem} onChange={e=>setNewItem(e.target.value)}
            placeholder="Add an item..." onKeyDown={e=>e.key==='Enter'&&addItem()} style={{flex:1}}/>
          <button className="btn btn-primary" onClick={addItem} disabled={!newItem.trim()||adding}>
            {adding ? '...' : <Icon name="plus" size={16} color="#fff"/>}
          </button>
        </div>

        {!list ? (
          <div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading...</div>
        ) : list.items?.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><p className="empty-title">List is empty</p><p className="empty-sub">Add the first item above</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {list.items.map(item => (
              <div key={item.id} className="card" style={{display:'flex',alignItems:'center',gap:12,opacity:item.is_done?0.7:1,cursor:'pointer'}} onClick={()=>toggle(item)}>
                <div onClick={e=>{e.stopPropagation();toggle(item);}} style={{width:24,height:24,borderRadius:12,border:`1.5px solid ${item.is_done?'var(--blue)':'var(--text-4)'}`,background:item.is_done?'var(--blue)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {item.is_done && <Icon name="check" size={14} color="#fff"/>}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:500,textDecoration:item.is_done?'line-through':'none',color:item.is_done?'var(--text-3)':'var(--text)'}}>{item.content}</p>
                  <p style={{fontSize:11,color:'var(--text-4)',marginTop:1}}>Added by {item.added_by_user?.display_name || 'someone'}</p>
                </div>
                <button onClick={e=>{e.stopPropagation();deleteItem(item);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-4)',padding:4,borderRadius:6}} title="Remove">
                  <Icon name="x" size={16} color="var(--text-4)"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Friends ───────────────────────────────────────────────────────────────────
export function FriendsPage() {
  const user = useAuthStore(s => s.user);
  const [friends, setFriends]         = useState([]);
  const [requests, setRequests]       = useState([]);
  const [searchQ, setSearchQ]         = useState('');
  const [results, setResults]         = useState([]);
  const [tab, setTab]                 = useState('friends');
  const [searching, setSearching]     = useState(false);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    try {
      const [fR, rR] = await Promise.all([friendsAPI.list(), friendsAPI.requests()]);
      setFriends(fR.data.friends || []);
      setRequests(rR.data.requests || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchQ.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const r = await friendsAPI.search(searchQ); setResults(r.data.users||[]); }
      catch {} finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  const accept = async (id) => {
    try { await friendsAPI.accept(id); load(); showToast('Friend added!', 'success'); }
    catch { showToast('Failed', 'error'); }
  };

  const sendRequest = async (uid, name) => {
    try {
      await friendsAPI.sendRequest(uid);
      showToast(`Request sent to ${name}!`, 'success');
      setResults(r => r.filter(u => u.id !== uid));
    } catch(err) { showToast(err.response?.data?.error||'Failed', 'error'); }
  };

  const removeFriend = async (f) => {
    if (!window.confirm(`Remove ${f.display_name}?`)) return;
    try { await friendsAPI.remove(f.friendshipId); load(); showToast('Removed', ''); }
    catch { showToast('Failed', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 className="page-title">Friends</h1>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--blue-light)',padding:'6px 12px',borderRadius:14,border:'1px solid var(--blue-border)'}}>
            <span style={{fontSize:12,color:'var(--blue-dark)'}}>Code: <strong>#{user?.friend_code}</strong></span>
          </div>
        </div>
      </div>

      <div style={{padding:'12px 20px',background:'var(--card)',borderBottom:'0.5px solid var(--border)'}}>
        <div className="tabs">
          <button className={`tab-btn ${tab==='friends'?'active':''}`} onClick={()=>setTab('friends')}>
            Friends{friends.length ? ` (${friends.length})` : ''}
          </button>
          <button className={`tab-btn ${tab==='search'?'active':''}`} onClick={()=>setTab('search')}>Add Friend</button>
        </div>
      </div>

      <div className="page-content">
        {tab === 'friends' && (
          <>
            {requests.length > 0 && (
              <>
                <p className="section-label" style={{marginBottom:8}}>Pending Requests</p>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                  {requests.map(r => (
                    <div key={r.id} className="card" style={{display:'flex',alignItems:'center',gap:12}}>
                      <Avatar name={r.requester?.display_name} color={r.requester?.avatar_color||'#378ADD'} size={42}/>
                      <div style={{flex:1}}>
                        <p style={{fontWeight:600}}>{r.requester?.display_name}</p>
                        <p style={{fontSize:12,color:'var(--text-3)'}}>@{r.requester?.username}</p>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={()=>accept(r.id)}>Accept</button>
                    </div>
                  ))}
                </div>
                <p className="section-label" style={{marginBottom:8}}>Your Friends</p>
              </>
            )}
            {loading ? (
              <div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading...</div>
            ) : friends.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👋</div>
                <p className="empty-title">No friends yet</p>
                <p className="empty-sub">Search by username or friend code</p>
                <button className="btn btn-primary" onClick={()=>setTab('search')}>Add a Friend</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {friends.map(f => (
                  <div key={f.id} className="card" style={{display:'flex',alignItems:'center',gap:12}}>
                    <Avatar name={f.display_name} color={f.avatar_color||'#378ADD'} size={42}/>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:600}}>{f.display_name}</p>
                      <p style={{fontSize:12,color:'var(--text-3)'}}>@{f.username} · #{f.friend_code}</p>
                    </div>
                    <button onClick={()=>removeFriend(f)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-4)',padding:6}} title="Remove">
                      <Icon name="x" size={16} color="var(--text-4)"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'search' && (
          <>
            <div style={{position:'relative',marginBottom:16}}>
              <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
                <Icon name="search" size={16} color="var(--text-3)"/>
              </div>
              <input className="input" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder="Username or friend code" style={{paddingLeft:38}} autoFocus/>
            </div>
            {searching && <p style={{textAlign:'center',color:'var(--text-3)',padding:20}}>Searching...</p>}
            {results.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {results.map(u => (
                  <div key={u.id} className="card" style={{display:'flex',alignItems:'center',gap:12}}>
                    <Avatar name={u.display_name} color={u.avatar_color||'#378ADD'} size={42}/>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:600}}>{u.display_name}</p>
                      <p style={{fontSize:12,color:'var(--text-3)'}}>@{u.username} · #{u.friend_code}</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={()=>sendRequest(u.id, u.display_name)}>Add</button>
                  </div>
                ))}
              </div>
            )}
            {searchQ.length >= 2 && !searching && results.length === 0 && (
              <div className="empty-state" style={{paddingTop:24}}>
                <p className="empty-sub">No results for "{searchQ}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { color:'#378ADD',label:'Blue' },{ color:'#185FA5',label:'Navy' },{ color:'#00C7BE',label:'Teal' },
  { color:'#30D158',label:'Green' },{ color:'#34C759',label:'Mint' },{ color:'#FF9500',label:'Orange' },
  { color:'#FF3B30',label:'Red' },{ color:'#FF2D55',label:'Pink' },{ color:'#FF6B9D',label:'Rose' },
  { color:'#5856D6',label:'Purple' },{ color:'#AF52DE',label:'Violet' },{ color:'#FFCC00',label:'Yellow' },
  { color:'#A2845E',label:'Brown' },{ color:'#636366',label:'Gray' },{ color:'#3A3A3C',label:'Charcoal' },
  { color:'#1C1C1E',label:'Black' },
];

export function ProfilePage() {
  const user      = useAuthStore(s => s.user);
  const logout    = useAuthStore(s => s.logout);
  const updateUser = useAuthStore(s => s.updateUser);
  const [showColors, setShowColors] = useState(false);
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#378ADD');
  const [saving, setSaving]         = useState(false);
  const initials = (user?.display_name||'??').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();

  const pickColor = async (color) => {
    setSaving(true);
    try {
      await usersAPI.updateAvatar(color);
      setAvatarColor(color);
      updateUser({ avatar_color: color });
      showToast('Color updated!', 'success');
      setShowColors(false);
    } catch { showToast('Failed', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Profile</h1></div>
      <div className="page-content">
        {/* Avatar card */}
        <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:28,marginBottom:16}}>
          <div onClick={()=>setShowColors(true)} style={{width:80,height:80,borderRadius:26,background:avatarColor,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:28,cursor:'pointer',position:'relative',marginBottom:12}}>
            {initials}
            <div style={{position:'absolute',bottom:-6,right:-6,width:26,height:26,borderRadius:13,background:'var(--text)',border:'2px solid var(--card)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="palette" size={12} color="#fff"/>
            </div>
          </div>
          <p style={{fontSize:22,fontWeight:700}}>{user?.display_name}</p>
          <p style={{fontSize:14,color:'var(--text-3)',marginTop:2}}>@{user?.username}</p>
          <div style={{display:'inline-flex',gap:6,alignItems:'center',marginTop:10,padding:'6px 14px',borderRadius:14,border:`1px solid ${avatarColor}55`,background:`${avatarColor}18`}}>
            <span style={{fontSize:13,color:avatarColor}}>Friend code: <strong>#{user?.friend_code}</strong></span>
          </div>
          <p style={{fontSize:11,color:'var(--text-4)',marginTop:10}}>Tap avatar to change color</p>
        </div>

        {/* Settings rows */}
        <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
          {[
            { label:'Username', value:`@${user?.username}` },
            { label:'Email',    value:user?.email||'—' },
          ].map((row,i,arr) => (
            <div key={row.label} style={{display:'flex',alignItems:'center',padding:'14px 16px',borderBottom:i<arr.length-1?'0.5px solid var(--border)':'none'}}>
              <span style={{flex:1,color:'var(--text)'}}>{row.label}</span>
              <span style={{fontSize:13,color:'var(--text-3)'}}>{row.value}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-danger btn-full" onClick={()=>{ if(window.confirm('Sign out?')) logout(); }}>
          <Icon name="logout" size={15} color="var(--danger)"/> Sign out
        </button>

        <p style={{textAlign:'center',fontSize:12,color:'var(--text-4)',marginTop:24}}>Knot · Connect. Challenge. Remember.</p>
      </div>

      {/* Color picker modal */}
      <Modal open={showColors} onClose={()=>setShowColors(false)} title="Choose Color">
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0 16px',borderBottom:'0.5px solid var(--border)',marginBottom:16}}>
          <div style={{width:64,height:64,borderRadius:22,background:avatarColor,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:24,marginBottom:8}}>{initials}</div>
          <p style={{fontWeight:600}}>{user?.display_name}</p>
        </div>
        <div className="color-grid">
          {AVATAR_COLORS.map(({color,label}) => (
            <div key={color} className="color-item" onClick={()=>!saving&&pickColor(color)}>
              <div className={`color-circle ${avatarColor===color?'selected':''}`} style={{background:color}}>
                {avatarColor===color && <Icon name="check" size={20} color="#fff"/>}
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
