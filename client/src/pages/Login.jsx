import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postJson } from '../api';

export default function Login({ onLoggedIn }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const data = await postJson('/api/login', { password: password });

    if (data.error) {
      setError(data.error);
      return;
    }

    onLoggedIn();
    navigate('/');
  }

  return (
    <div className="page narrow" style={{ paddingTop: 60 }}>
      <div className="card">
        <h2>QR Attendance</h2>
        <p className="muted">Teacher login</p>

        {error && <div className="message error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
          />
          <button type="submit" className="full">Log in</button>
        </form>
      </div>
      <p className="muted center">Students do not log in. They just scan the QR code.</p>
    </div>
  );
}
