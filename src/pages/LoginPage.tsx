import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { auth } from '../firebase'; // Import Firebase auth instance
import useUserStore, { getIsAuthenticated } from '../stores/userStore'; // Import store and isAuthenticated helper

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Access the isLoading state from the store to see if onAuthStateChanged is still running
  const isAuthLoading = useUserStore((state) => state.isLoading);

  // Redirect if user is already logged in and auth state is resolved
  useEffect(() => {
    // Only redirect if auth is not loading and user is authenticated
    if (!isAuthLoading && getIsAuthenticated()) {
      navigate('/');
    }
  }, [isAuthLoading, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged in App.tsx will handle setting user state
      // and redirecting or updating UI.
      // We can navigate immediately here after successful sign-in.
      navigate('/'); 
    } catch (err: any) { // Use 'any' or firebase.FirebaseError
      // Handle Firebase Auth errors
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No user found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        case 'auth/invalid-credential': // Catch-all for invalid email/password combination
          setError('Invalid credentials. Please check your email and password.');
          break;
        default:
          setError('Login failed. Please check your credentials.');
          break;
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // If auth state is still being determined by onAuthStateChanged, show a loading indicator or nothing.
  // This prevents flashing the login form if the user is already logged in.
  if (isAuthLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div>Loading user session...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-dark-200 p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-medium text-primary-500 hover:text-primary-400"
            >
              create a new account
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-dark-100 bg-dark-100 pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Email address"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-dark-100 bg-dark-100 pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Password"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isAuthLoading} // Also disable if global auth is still loading
              className="group relative flex w-full justify-center rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}