import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import GuestView from './pages/GuestView';
import HostView from './pages/HostView';
import AuthView from './pages/AuthView';
import ProfileView from './pages/ProfileView';

// Security Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" />;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#ededed', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: '0 40px 0 0', color: '#ffffff', letterSpacing: '-1px', fontWeight: '800' }}>
            <span style={{ color: '#00e5ff' }}>/</span>AppointMe
          </h2>
          
          {token && (
            <>
              {/* Only show "Book Slot" if they are NOT an admin */}
              {localStorage.getItem('role') !== 'admin' && (
                <Link to="/" style={{ marginRight: '30px', textDecoration: 'none', color: location.pathname === '/' ? '#00e5ff' : '#a1a1aa', fontWeight: '600' }}>Book Slot</Link>
              )}
              
              {/* Rename the profile link dynamically */}
              <Link to="/profile" style={{ marginRight: '30px', textDecoration: 'none', color: location.pathname === '/profile' ? '#00e5ff' : '#a1a1aa', fontWeight: '600' }}>
                {localStorage.getItem('role') === 'admin' ? 'Business Profile' : 'My Profile'}
              </Link>
              
              {/* Admin Dashboard Link */}
              {localStorage.getItem('role') === 'admin' && (
                <Link to="/admin" style={{ textDecoration: 'none', color: location.pathname === '/admin' ? '#00e5ff' : '#a1a1aa', fontWeight: '600' }}>Command Center</Link>
              )}
            </>
          )}
        </div>

        {token && (
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Disconnect
          </button>
        )}
      </nav>
      
      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <Routes>
          <Route path="/auth" element={<AuthView />} />
          <Route path="/" element={<ProtectedRoute><GuestView /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><HostView /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;