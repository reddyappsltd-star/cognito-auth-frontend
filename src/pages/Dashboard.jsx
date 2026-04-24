import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [showRaw, setShowRaw] = useState(false);

  if (!session) {
    navigate('/signin');
    return null;
  }

  const idToken = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const decoded = decodeJwt(idToken);

  function handleLogout() {
    logout();
    navigate('/signin');
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <div className="dashboard-content">
        {decoded && (
          <section className="card">
            <h2>Signed in as</h2>
            <table className="info-table">
              <tbody>
                <tr>
                  <th>Username</th>
                  <td>{decoded['cognito:username'] || decoded.sub}</td>
                </tr>
                <tr>
                  <th>User ID (sub)</th>
                  <td>{decoded.sub}</td>
                </tr>
                <tr>
                  <th>Token expires</th>
                  <td>{new Date(decoded.exp * 1000).toLocaleString()}</td>
                </tr>
                <tr>
                  <th>Issued at</th>
                  <td>{new Date(decoded.iat * 1000).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        <section className="card">
          <div className="token-header">
            <h2>ID Token (JWT)</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? 'Hide raw' : 'Show raw'}
            </button>
          </div>
          {showRaw && (
            <pre className="token-raw">{idToken}</pre>
          )}
          {decoded && (
            <>
              <h3>Decoded payload</h3>
              <pre className="token-payload">{JSON.stringify(decoded, null, 2)}</pre>
            </>
          )}
        </section>

        <section className="card">
          <h2>Access Token</h2>
          <pre className="token-raw token-truncated">{accessToken}</pre>
          {decodeJwt(accessToken) && (
            <>
              <h3>Decoded payload</h3>
              <pre className="token-payload">{JSON.stringify(decodeJwt(accessToken), null, 2)}</pre>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
