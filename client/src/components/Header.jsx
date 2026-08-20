import { Link, useNavigate } from 'react-router-dom';

// The bar with the menu that sits on top of every teacher page.
export default function Header({ onLogout }) {
  const navigate = useNavigate();

  async function handleLogout(event) {
    event.preventDefault(); // stop the link jumping to the top of the page
    await fetch('/api/logout', { method: 'POST' });
    onLogout();
    navigate('/login');
  }

  return (
    <header>
      <div className="page">
        <h1>QR Attendance</h1>
        <nav>
          <Link to="/">Sessions</Link>
          <Link to="/records">Records</Link>
          <Link to="/scan">Scan</Link>
          <a href="#" onClick={handleLogout}>Log out</a>
        </nav>
      </div>
    </header>
  );
}
