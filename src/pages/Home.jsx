import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import { Avatar, Icon, Modal, Input, showToast } from '../components/ui';
import useAuthStore from '../store/authStore';

export default function HomePage() {
  const user = useAuthStore(s => s.user);
  const [groups, setGroups]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [form, setForm]           = useState({ name:'', description:'' });
  const [creating, setCreating]   = useState(false);

  const load = async () => {
    try { const r = await groupsAPI.list(); setGroups(r.data.groups || []); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.display_name?.split(' ')[0];

  const createGroup = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await groupsAPI.create({ name: form.name.trim(), description: form.description });
      showToast('Group created!', 'success');
      setShowNew(false); setForm({ name:'', description:'' });
      load();
    } catch(err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setCreating(false); }
  };

  const initials = n => n?.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';

  return (
    <div>
      <div style={{padding:'24px 20px 16px',background:'var(--bg)'}}>
        <p style={{fontSize:13,color:'var(--text-3)'}}>{greeting}</p>
        <h1 style={{fontSize:28,fontWeight:700,marginTop:2}}>{firstName}</h1>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:10,background:'var(--blue-light)',padding:'6px 12px',borderRadius:14,border:'1px solid var(--blue-border)'}}>
          <Icon name="person" size={13} color="var(--blue)"/>
          <span style={{fontSize:12,color:'var(--blue-dark)'}}>Friend code: <strong>#{user?.friend_code}</strong></span>
        </div>
      </div>

      <div className="page-content">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <span className="section-label">My Groups</span>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowNew(true)}>
            <Icon name="plus" size={14} color="#fff"/> New Group
          </button>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>Loading...</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p className="empty-title">No groups yet</p>
            <p className="empty-sub">Create a group and invite your friends</p>
            <button className="btn btn-primary" onClick={()=>setShowNew(true)}>Create Group</button>
          </div>
        ) : (
          <div className="list-rows">
            {groups.map(g => (
              <Link key={g.id} to={`/groups/${g.id}`} className="list-row">
                <div style={{width:46,height:46,borderRadius:12,background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16,flexShrink:0}}>
                  {initials(g.name)}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:600}}>{g.name}</p>
                  <p style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                    {g.members?.[0]?.count ?? 0} members
                    {g.challenges?.some(c=>c.is_active) ? ' · challenge live' : ''}
                  </p>
                </div>
                <Icon name="chevron" size={16} color="var(--text-4)"/>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showNew} onClose={()=>setShowNew(false)} title="New Group">
        <Input label="Group name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Weekend Warriors" />
        <Input label="Description (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What's this group about?" />
        <button className="btn btn-primary btn-full" onClick={createGroup} disabled={creating || !form.name.trim()}>
          {creating ? 'Creating...' : 'Create Group'}
        </button>
      </Modal>
    </div>
  );
}
