import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Header from '../components/Header';
import { getJson, postJson, readableTime } from '../api';

export default function SessionPage({ onLogout }) {
  const { id } = useParams(); // the number from the address, e.g. /session/3

  const [info, setInfo] = useState(null);      // session details plus the QR image
  const [attendees, setAttendees] = useState([]);
  const [error, setError] = useState('');

  async function loadSession() {
    const data = await getJson('/api/sessions/' + id);
    if (!data) return;

    if (data.error) {
      setError(data.error);
      return;
    }
    setInfo(data);
  }

  async function loadAttendees() {
    const data = await getJson('/api/records?session=' + id);
    if (data) {
      setAttendees(data);
    }
  }

  useEffect(() => {
    loadSession();
    loadAttendees();

    // Keep the list fresh while the teacher has the QR up on the screen.
    const timer = setInterval(loadAttendees, 5000);

    // React runs this when we leave the page, so the timer does not keep going.
    return () => clearInterval(timer);
  }, [id]);

  async function handleToggle() {
    await postJson('/api/sessions/' + id + '/toggle');
    loadSession();
  }

  if (error) {
    return (
      <>
        <Header onLogout={onLogout} />
        <div className="page"><div className="message error">{error}</div></div>
      </>
    );
  }

  if (!info) {
    return (
      <>
        <Header onLogout={onLogout} />
        <div className="page"><p className="muted">Loading...</p></div>
      </>
    );
  }

  const isOpen = info.session.is_open === 1;

  return (
    <>
      <Header onLogout={onLogout} />

      <div className="page">
        <div className="card center">
          <h2>{info.session.title}</h2>
          <p className="muted">Students scan this with their phone camera to check in.</p>

          <img className="qr" src={info.qrImage} alt="QR code for this session" />
          <p className="code">{info.session.code}</p>
          <p className="muted">{info.checkinUrl}</p>

          <p>
            <button className={isOpen ? 'red' : ''} onClick={handleToggle}>
              {isOpen ? 'Close attendance' : 'Re-open attendance'}
            </button>
            {' '}
            <a className="button grey" href={'/export.csv?session=' + id}>Download CSV</a>
          </p>
        </div>

        <div className="card">
          <h2>Checked in <span className="muted">({attendees.length})</span></h2>
          <p className="muted">This list refreshes on its own every 5 seconds.</p>

          {attendees.length === 0 ? (
            <p className="muted">Nobody has scanned the code yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((row, index) => (
                  <tr key={row.id}>
                    <td>{attendees.length - index}</td>
                    <td>{row.student_name}</td>
                    <td>{row.student_id}</td>
                    <td>{readableTime(row.checked_in_at)}</td>
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
