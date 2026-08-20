import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import { getJson, postJson, readableDate } from '../api';

export default function Dashboard({ onLogout }) {
  const [sessions, setSessions] = useState(null); // null while loading
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadSessions() {
    const data = await getJson('/api/sessions');
    if (data) {
      setSessions(data);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setError('');

    const data = await postJson('/api/sessions', { title: title });

    if (data.error) {
      setError(data.error);
      return;
    }

    // Go straight to the QR code for the session we just made.
    navigate('/session/' + data.id);
  }

  return (
    <>
      <Header onLogout={onLogout} />

      <div className="page">
        <div className="card">
          <h2>Start a new session</h2>

          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleCreate}>
            <label htmlFor="title">What is this session called?</label>
            <input
              type="text"
              id="title"
              placeholder="e.g. CSC 201 - Friday lecture"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <button type="submit">Create session and show QR</button>
          </form>
        </div>

        <div className="card">
          <h2>Your sessions</h2>

          {sessions === null && <p className="muted">Loading...</p>}

          {sessions !== null && sessions.length === 0 && (
            <p className="muted">No sessions yet. Create one above to get started.</p>
          )}

          {sessions !== null && sessions.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Code</th>
                  <th>Created</th>
                  <th>Present</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.title}</td>
                    <td>{session.code}</td>
                    <td>{readableDate(session.created_at)}</td>
                    <td>{session.total}</td>
                    <td>
                      {session.is_open === 1
                        ? <span className="tag">Open</span>
                        : <span className="tag closed">Closed</span>}
                    </td>
                    <td><Link to={'/session/' + session.id}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
