import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionPage from './pages/SessionPage';
import Records from './pages/Records';
import CheckIn from './pages/CheckIn';

// The camera library is big, and a student checking in on their phone data does
// not need it. "lazy" means it is only downloaded when someone opens /scan.
const Scan = lazy(() => import('./pages/Scan'));

// Wraps the teacher pages. If nobody is logged in it sends you to /login.
function Protected({ loggedIn, children }) {
  if (loggedIn === null) {
    return <p className="page muted">Loading...</p>;
  }
  if (loggedIn === false) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  // null means "we have not asked the server yet".
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    // Ask the server whether our cookie is still good, once when the app opens.
    async function checkLogin() {
      const res = await fetch('/api/me');
      const data = await res.json();
      setLoggedIn(data.loggedIn);
    }
    checkLogin();
  }, []);

  return (
    <Routes>
      {/* Anyone can open these two */}
      <Route path="/login" element={<Login onLoggedIn={() => setLoggedIn(true)} />} />
      <Route path="/s/:code" element={<CheckIn />} />

      {/* Teacher only */}
      <Route
        path="/"
        element={
          <Protected loggedIn={loggedIn}>
            <Dashboard onLogout={() => setLoggedIn(false)} />
          </Protected>
        }
      />
      <Route
        path="/session/:id"
        element={
          <Protected loggedIn={loggedIn}>
            <SessionPage onLogout={() => setLoggedIn(false)} />
          </Protected>
        }
      />
      <Route
        path="/records"
        element={
          <Protected loggedIn={loggedIn}>
            <Records onLogout={() => setLoggedIn(false)} />
          </Protected>
        }
      />
      <Route
        path="/scan"
        element={
          <Protected loggedIn={loggedIn}>
            {/* Suspense shows this while the camera library downloads */}
            <Suspense fallback={<p className="page muted">Loading the scanner...</p>}>
              <Scan onLogout={() => setLoggedIn(false)} />
            </Suspense>
          </Protected>
        }
      />

      {/* Anything else goes home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
