import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentSession, signOut } from './cognito';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    getCurrentSession()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  function logout() {
    signOut();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
