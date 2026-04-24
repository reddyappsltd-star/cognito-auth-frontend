import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../cognito';
import { useAuth } from '../AuthContext';

const COGNITO_ERRORS = {
  NotAuthorizedException: 'Incorrect username or password.',
  UserNotFoundException: 'Incorrect username or password.',
  UserNotConfirmedException: 'Your account has not been confirmed. Check your email for a verification code.',
  PasswordResetRequiredException: 'A password reset is required for this account.',
  TooManyRequestsException: 'Too many attempts. Please wait a moment and try again.',
  NewPasswordRequired: 'A new password is required. Please contact support.',
  NetworkError: 'Network error. Check your connection and try again.',
};

function friendlyError(err) {
  if (err.code === 'NetworkError' || err.message?.toLowerCase().includes('network')) {
    return COGNITO_ERRORS.NetworkError;
  }
  return COGNITO_ERRORS[err.code] || err.message || 'An unexpected error occurred.';
}

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim()) return setError('Username is required.');
    if (!password) return setError('Password is required.');

    setLoading(true);
    try {
      const { session } = await signIn(username.trim(), password);
      setSession(session);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign in</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-link">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
