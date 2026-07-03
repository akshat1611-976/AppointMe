import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const payload = isLogin ? { email, password } : { username, email, password };
      const res = await axios.post(`${endpoint}`, payload);
      
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role); // Save role for Navbar logic
        
        // Redirect based on role
        if (res.data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setMessage('Registration successful. Please proceed to System Login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Authentication failed.');
    }
  };

  return (
    <div style={{ maxWidth: '550px', margin: '80px auto 0', padding: '50px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
      <h2 style={{ margin: '0 0 30px 0', color: '#fff', textAlign: 'center', letterSpacing: '2px', fontSize: '28px' }}>
        {isLogin ? 'SYSTEM LOGIN' : 'INITIALIZE IDENTITY'}
      </h2>
      
      {message && (
        <div style={{ padding: '15px', marginBottom: '25px', borderLeft: '4px solid #ef4444', backgroundColor: '#18181b', color: '#ef4444', fontSize: '16px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {!isLogin && (
          <input 
            type="text" 
            placeholder="Choose Username" 
            required 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            style={{ padding: '18px', fontSize: '18px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s' }}
          />
        )}

        <input 
          type="email" 
          placeholder="Network Email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          style={{ padding: '18px', fontSize: '18px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '8px', outline: 'none' }}
        />
        
        <input 
          type="password" 
          placeholder="Passcode" 
          required 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          style={{ padding: '18px', fontSize: '18px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '8px', outline: 'none' }}
        />
        
        <button type="submit" style={{ padding: '18px', marginTop: '15px', backgroundColor: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
          {isLogin ? 'Access Interface' : 'Register Node'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '30px', color: '#a1a1aa', fontSize: '16px' }}>
        {isLogin ? 'No active node?' : 'Node already registered?'} 
        <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#00e5ff', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold', textDecoration: 'underline' }}>
          {isLogin ? 'Register Here' : 'System Login'}
        </span>
      </p>
    </div>
  );
}