import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signIn } from '../cognito';
import { useAuth } from '../AuthContext';

const ERRORS = {
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotFoundException: 'Incorrect email or password.',
  PasswordResetRequiredException: 'A password reset is required for this account.',
  TooManyRequestsException: 'Too many attempts. Please wait a moment and try again.',
  NewPasswordRequired: 'A new password is required. Please contact support.',
};

function friendlyError(err) {
  if (err.code === 'NetworkError' || err.message?.toLowerCase().includes('network')) {
    return 'Network error. Check your connection and try again.';
  }
  return ERRORS[err.code] || err.message || 'An unexpected error occurred.';
}

export default function SignIn() {
  const location = useLocation();
  const justVerified = location.state?.verified ?? false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Email is required.');
    if (!email.includes('@')) return setError('Please enter a valid email address.');
    if (!password) return setError('Password is required.');

    setLoading(true);
    try {
      const { session } = await signIn(email.trim().toLowerCase(), password);
      setSession(session);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'UserNotConfirmedException') {
        // Account exists but isn't confirmed — send to verify page
        sessionStorage.setItem('pendingVerificationEmail', email.trim().toLowerCase());
        navigate('/verify', { state: { fromSignIn: true } });
        return;
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign in</h1>

        {justVerified && (
          <p className="success-msg">
            Account confirmed! You can now sign in.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
