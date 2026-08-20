import { useState, useEffect } from 'react';

import Header from '../components/Header';
import { getJson, readableDate } from '../api';

export default function Records({ onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [chosen, setChosen] = useState('');   // '' means "all sessions"
  const [records, setRecords] = useState(null);

  // Used by both the records request and the CSV button, so they always match.
  const query = chosen ? '?session=' + chosen : '';

  // Fill the dropdown once, when the page opens.
  useEffect(() => {
    async function loadSessions() {
      const data = await getJson('/api/sessions');
      if (data) {
        setSessions(data);
      }
    }
    loadSessions();
  }, []);

  // Load the records again every time the dropdown changes.
  useEffect(() => {
    async function loadRecords() {
      setRecords(null);
      const data = await getJson('/api/records' + query);
      if (data) {
        setRecords(data);
      }
    }
    loadRecords();
  }, [chosen]);

  return (
    <>
      <Header onLogout={onLogout} />

      <div className="page">
        <div className="card">
          <h2>Attendance records</h2>

          <div className="row">
            <div>
              <label htmlFor="sessionFilter">Show</label>
              <select
                id="sessionFilter"
                value={chosen}
                onChange={(event) => setChosen(event.target.value)}
              >
                <option value="">All sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} ({session.code})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 0 }}>
              <a className="button grey" style={{ marginBottom: 14 }} href={'/export.csv' + query}>
                Download CSV
              </a>
            </div>
          </div>

          {records === null && <p className="muted">Loading...</p>}

          {records !== null && (
            <p className="muted">{records.length} record(s)</p>
          )}

          {records !== null && records.length === 0 && (
            <p className="muted">No attendance has been recorded yet.</p>
          )}

          {records !== null && records.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Date and time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id}>
                    <td>{row.session_title}</td>
                    <td>{row.student_name}</td>
                    <td>{row.student_id}</td>
                    <td>{readableDate(row.checked_in_at)}</td>
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
