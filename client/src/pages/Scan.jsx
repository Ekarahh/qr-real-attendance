import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

import Header from '../components/Header';

export default function Scan({ onLogout }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [typedCode, setTypedCode] = useState('');

  // useRef holds the scanner between renders without redrawing the page.
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // Already stopped, nothing to do.
      }
      scannerRef.current = null;
    }
    setRunning(false);
  }

  // If the teacher clicks away to another page, turn the camera off.
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  // Pull the code out of whatever the camera read.
  // Our QR codes hold a full link like https://mysite.com/s/K7P2QX9M.
  function goToCheckIn(text) {
    const parts = text.trim().split('/');
    const code = parts[parts.length - 1].toUpperCase();
    navigate('/s/' + code);
  }

  async function startCamera() {
    setError('');
    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },   // use the back camera when there is one
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          stopCamera();
          goToCheckIn(decodedText);
        }
      );
      setRunning(true);
    } catch (err) {
      scannerRef.current = null;
      setError('Could not open the camera. Check that you allowed camera access.');
    }
  }

  function handleTypedCode(event) {
    event.preventDefault();
    navigate('/s/' + typedCode.trim().toUpperCase());
  }

  return (
    <>
      <Header onLogout={onLogout} />

      <div className="page narrow">
        <div className="card">
          <h2>Scan a session QR code</h2>
          <p className="muted">
            Most phones can read the QR code with the normal camera app. This page is here for
            laptops, or for phones where the camera app does not open links.
          </p>

          <div id="reader"></div>

          {error && <div className="message error">{error}</div>}

          <p>
            {running
              ? <button className="red" onClick={stopCamera}>Stop camera</button>
              : <button onClick={startCamera}>Start camera</button>}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

          <h2>No camera? Type the code</h2>
          <form onSubmit={handleTypedCode}>
            <label htmlFor="code">8 letter code printed under the QR</label>
            <input
              type="text"
              id="code"
              placeholder="K7P2QX9M"
              maxLength={8}
              value={typedCode}
              onChange={(event) => setTypedCode(event.target.value)}
              required
            />
            <button type="submit">Go to check in</button>
          </form>
        </div>
      </div>
    </>
  );
}
