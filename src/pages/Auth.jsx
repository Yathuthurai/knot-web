import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import { Input, showToast } from '../components/ui';

const Logo = () => (
  <div className="auth-logo">
    <div className="auth-logo-icon">K</div>
    <span className="auth-logo-name">Knot</span>
  </div>
);

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const login    = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch(err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>
        {error && <div style={{color:'var(--danger)',fontSize:13,marginBottom:14,padding:'10px 12px',background:'#FFF0F0',borderRadius:8}}>{error}</div>}
        <form onSubmit={submit}>
          <Input label="Email or mobile" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="email@example.com" autoComplete="username" required />
          <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" required />
          <button className="btn btn-primary btn-full" style={{marginTop:4}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{textAlign:'center',fontSize:13,color:'var(--text-3)',marginTop:20}}>
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        </p>
        <p style={{textAlign:'center',fontSize:13,color:'var(--text-3)',marginTop:12}}>
          No account? <Link to="/register" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ displayName:'', username:'', identifier:'', password:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const isMobile = /^(07|\+94)/.test(form.identifier);
      await register({
        displayName: form.displayName,
        username:    form.username,
        email:       !isMobile ? form.identifier : undefined,
        mobile:      isMobile  ? form.identifier : undefined,
        password:    form.password,
      });
      navigate('/');
    } catch(err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join and start challenging your friends</p>
        {error && <div style={{color:'var(--danger)',fontSize:13,marginBottom:14,padding:'10px 12px',background:'#FFF0F0',borderRadius:8}}>{error}</div>}
        <form onSubmit={submit}>
          <Input label="Display name" value={form.displayName} onChange={e=>set('displayName',e.target.value)} placeholder="Your full name" required />
          <Input label="Username" value={form.username} onChange={e=>set('username',e.target.value.toLowerCase())} placeholder="lowercase_username" required />
          <Input label="Email or mobile" value={form.identifier} onChange={e=>set('identifier',e.target.value)} placeholder="email or 07XXXXXXXX" required />
          <Input label="Password" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 6 characters" required />
          <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} placeholder="Repeat password" required />
          <button className="btn btn-primary btn-full" style={{marginTop:4}} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p style={{textAlign:'center',fontSize:13,color:'var(--text-3)',marginTop:20}}>
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [code, setCode]             = useState('');
  const [newPw, setNewPw]           = useState('');
  const [step, setStep]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const navigate = useNavigate();

  const sendCode = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword(identifier);
      setStep(2);
      showToast('Reset code sent!', 'success');
    } catch(err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const resetPw = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await authAPI.resetPassword(identifier, code, newPw);
      showToast('Password reset!', 'success');
      navigate('/login');
    } catch(err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-title">{step === 1 ? 'Reset password' : 'Enter code'}</h1>
        <p className="auth-sub">{step === 1 ? 'Enter your email to receive a reset code' : 'Check your email for the 6-digit code'}</p>
        {error && <div style={{color:'var(--danger)',fontSize:13,marginBottom:14,padding:'10px 12px',background:'#FFF0F0',borderRadius:8}}>{error}</div>}
        {step === 1 ? (
          <form onSubmit={sendCode}>
            <Input label="Email or mobile" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="email@example.com" required />
            <button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset code'}</button>
          </form>
        ) : (
          <form onSubmit={resetPw}>
            <Input label="6-digit code" value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" maxLength={6} required />
            <Input label="New password" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min 6 characters" required />
            <button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>
          </form>
        )}
        <p style={{textAlign:'center',fontSize:13,color:'var(--text-3)',marginTop:20}}>
          <Link to="/login" className="auth-link">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
