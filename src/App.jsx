import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { Icon, Avatar } from './components/ui';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/Auth';
import HomePage from './pages/Home';
import GroupDetailPage from './pages/GroupDetail';
import ChallengeDetailPage from './pages/ChallengeDetail';
import { ListDetailPage, FriendsPage, ProfilePage } from './pages/Other';

function Sidebar({ user, onClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const initials = (user?.display_name||'??').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const avatarColor = user?.avatar_color || '#378ADD';

  const navItems = [
    { to:'/',        icon:'home',    label:'Home' },
    { to:'/friends', icon:'people',  label:'Friends' },
    { to:'/profile', icon:'person',  label:'Profile' },
  ];

  return (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">K</div>
        <span className="sidebar-logo-name">Knot</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to==='/'} className={({isActive})=>`nav-item ${isActive?'active':''}`} onClick={onClose}>
            <Icon name={item.icon} size={18} color="currentColor"/>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div style={{width:34,height:34,borderRadius:10,background:avatarColor,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>
          {initials}
        </div>
        <div style={{flex:1,overflow:'hidden'}}>
          <p style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.display_name}</p>
          <p style={{fontSize:11,color:'var(--text-3)'}}>#{user?.friend_code}</p>
        </div>
        <button onClick={()=>{if(window.confirm('Sign out?')) logout();}} title="Sign out" style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:4,borderRadius:6}}>
          <Icon name="logout" size={16} color="var(--text-3)"/>
        </button>
      </div>
    </>
  );
}

function MobileNav() {
  const navItems = [
    { to:'/',        icon:'home',    label:'Home' },
    { to:'/friends', icon:'people',  label:'Friends' },
    { to:'/profile', icon:'person',  label:'Profile' },
  ];
  return (
    <nav className="mobile-nav">
      {navItems.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to==='/'} className={({isActive})=>`mobile-nav-item ${isActive?'active':''}`}>
          <Icon name={item.icon} size={22} color="currentColor"/>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function AppLayout({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <aside className={`sidebar ${mobileOpen?'mobile-open':''}`}>
        <Sidebar user={user} onClose={()=>setMobileOpen(false)}/>
      </aside>
      {mobileOpen && <div onClick={()=>setMobileOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:99}}/>}

      {/* Main */}
      <main className="main-content">
        <Routes>
          <Route path="/"                                          element={<HomePage/>}/>
          <Route path="/groups/:id"                                element={<GroupDetailPage/>}/>
          <Route path="/groups/:groupId/challenges/:challengeId"   element={<ChallengeDetailPage/>}/>
          <Route path="/groups/:groupId/lists/:listId"             element={<ListDetailPage/>}/>
          <Route path="/friends"                                   element={<FriendsPage/>}/>
          <Route path="/profile"                                   element={<ProfilePage/>}/>
          <Route path="*"                                          element={<Navigate to="/"/>}/>
        </Routes>
      </main>

      <MobileNav/>
    </div>
  );
}

export default function App() {
  const { user, loading, init } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  if (loading) return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{width:52,height:52,borderRadius:16,background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:24}}>K</div>
      <p style={{color:'var(--text-3)',fontSize:14}}>Loading...</p>
    </div>
  );

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login"          element={<LoginPage/>}/>
          <Route path="/register"       element={<RegisterPage/>}/>
          <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
          <Route path="*"               element={<Navigate to="/login"/>}/>
        </>
      ) : (
        <Route path="/*" element={<AppLayout user={user}/>}/>
      )}
    </Routes>
  );
}
