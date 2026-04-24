import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

export const userPool = new CognitoUserPool(poolData);

export function signUp(email, password) {
  return new Promise((resolve, reject) => {
    // When username_attributes = ["email"], the email IS the username.
    // We also pass it as a standard attribute so Cognito stores it properly.
    const emailAttr = new CognitoUserAttribute({ Name: 'email', Value: email });
    userPool.signUp(email, password, [emailAttr], null, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

export function signIn(username, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: username, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: username, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve({ user, session }),
      onFailure: (err) => reject(err),
      newPasswordRequired: () =>
        reject({ code: 'NewPasswordRequired', message: 'A new password is required.' }),
    });
  });
}

export function signOut() {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

export function getCurrentSession() {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error('No user session'));
    user.getSession((err, session) => {
      if (err || !session.isValid()) return reject(err || new Error('Session invalid'));
      resolve(session);
    });
  });
}
