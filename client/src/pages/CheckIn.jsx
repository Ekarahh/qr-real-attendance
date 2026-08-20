import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { postJson } from '../api';

// This is the page the QR code opens on the student's phone.
export default function CheckIn() {
  const { code } = useParams();
  const sessionCode = code.toUpperCase();

  const [session, setSession] = useState(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  // First check that the QR code belongs to a real session that is still open.
  useEffect(() => {
    async function loadSession() {
      const res = await fetch('/api/public/sessions/' + sessionCode);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }
      setSession(data);

      if (data.is_open === 0) {
        setError('Attendance for this session is closed.');
      }
    }
    loadSession();
  }, [sessionCode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSending(true);

    const data = await postJson('/api/checkin', {
      code: sessionCode,
      studentName: name,
      studentId: studentId
    });

    setSending(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    setSuccess('Done! ' + data.name + ', you are marked present for ' + data.title + '.');
  }

  // Only show the form for a real session that is open and not filled in yet.
  const showForm = session && session.is_open === 1 && !success;

  return (
    <div className="page narrow" style={{ paddingTop: 40 }}>
      <div className="card">
        <h2>{session ? session.title : (error ? 'Sorry' : 'Loading...')}</h2>

        {showForm && <p className="muted">Fill this in to be marked present.</p>}

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="studentName">Full name</label>
            <input
              type="text"
              id="studentName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <label htmlFor="studentId">Student ID / matric number</label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
            />

            <button type="submit" className="full" disabled={sending}>
              {sending ? 'Sending...' : 'Check me in'}
            </button>
          </form>
        )}
      </div>
      <p className="muted center">QR Attendance</p>
    </div>
  );
}
