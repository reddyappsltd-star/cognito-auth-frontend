import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../cognito';

const COGNITO_ERRORS = {
  UsernameExistsException: 'An account with that username already exists.',
  InvalidPasswordException: 'Password does not meet requirements (min 8 chars, upper, lower, number, symbol).',
  InvalidParameterException: 'Invalid input. Check your username and password.',
  TooManyRequestsException: 'Too many attempts. Please wait a moment and try again.',
  NotAuthorizedException: 'Not authorized to perform this action.',
};

function friendlyError(err) {
  return COGNITO_ERRORS[err.code] || err.message || 'An unexpected error occurred.';
}

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Email is required.');
    if (!email.includes('@')) return setError('Please enter a valid email address.');
    if (!password) return setError('Password is required.');

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password);
      setSuccess(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="success-msg">
            Account created. A verification code has been sent to your email. Once verified, you
            can sign in.
          </p>
          <Link to="/signin" className="btn btn-primary">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create account</h1>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <small className="hint">Min 8 chars · uppercase · lowercase · number · symbol</small>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
