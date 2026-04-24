import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { confirmSignUp, resendConfirmationCode } from '../cognito';

const CODE_ERRORS = {
  CodeMismatchException: 'Incorrect code. Please check and try again.',
  ExpiredCodeException: 'That code has expired. Request a new one below.',
  TooManyFailedAttemptsException: 'Too many failed attempts. Please request a new code.',
  TooManyRequestsException: 'Too many attempts. Please wait a moment and try again.',
  LimitExceededException: 'Attempt limit exceeded. Please wait before trying again.',
  // Already confirmed — treat as success, send to sign in
  NotAuthorizedException: null,
};

function friendlyError(err) {
  if (err.code in CODE_ERRORS) return CODE_ERRORS[err.code];
  return err.message || 'An unexpected error occurred.';
}

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const alreadyExists = location.state?.alreadyExists ?? false;
  const fromSignIn = location.state?.fromSignIn ?? false;

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingVerificationEmail');
    if (stored) {
      setEmail(stored);
    } else {
      // No email in storage — user navigated here directly; ask for email
      setNeedsEmail(true);
    }
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setResendMsg('');

    if (!code.trim()) return setError('Please enter the verification code.');

    setLoading(true);
    try {
      await confirmSignUp(email, code.trim());
      sessionStorage.removeItem('pendingVerificationEmail');
      navigate('/signin', { state: { verified: true } });
    } catch (err) {
      if (err.code === 'NotAuthorizedException') {
        // Account is already confirmed
        sessionStorage.removeItem('pendingVerificationEmail');
        navigate('/signin', { state: { verified: true } });
        return;
      }
      if (err.code === 'ExpiredCodeException') {
        setCodeExpired(true);
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setResendMsg('');
    setCodeExpired(false);
    setResending(true);
    try {
      await resendConfirmationCode(email);
      setResendMsg('A new code has been sent to your email.');
      setCode('');
    } catch (err) {
      setError(err.message || 'Failed to resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  // If we don't know the email yet, ask for it
  if (needsEmail) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Verify your account</h1>
          <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enter the email you registered with to continue.
          </p>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!email.includes('@')) return setError('Please enter a valid email address.');
              setNeedsEmail(false);
              handleResend();
            }}
          >
            Send verification code
          </button>
          {error && <p className="error-msg" style={{ marginTop: '0.75rem' }}>{error}</p>}
          <p className="auth-link"><Link to="/signin">Back to sign in</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Verify your account</h1>

        {alreadyExists && (
          <p className="info-msg">
            An account with this email already exists but hasn't been confirmed yet. Enter the code from your email below.
          </p>
        )}
        {fromSignIn && (
          <p className="info-msg">
            Your account isn't confirmed yet. Enter the verification code we sent to <strong>{email}</strong>.
          </p>
        )}
        {!alreadyExists && !fromSignIn && (
          <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 24 hours.
          </p>
        )}

        <form onSubmit={handleVerify} noValidate>
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {resendMsg && <p className="success-msg">{resendMsg}</p>}

          {codeExpired ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Send a new code'}
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying…' : 'Confirm account'}
            </button>
          )}
        </form>

        <p className="auth-link">
          Didn't receive a code?{' '}
          <button
            type="button"
            className="link-btn"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
        <p className="auth-link">
          <Link to="/signin">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
