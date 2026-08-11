import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthContainer: React.FC = () => {
  const { session, user, profile, signUp, signIn, signOut, isLoading, error, setError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await signIn({ email, password });
    } else {
      await signUp({ 
        email, 
        password, 
        options: {
          data: {
            full_name: fullName
          }
        }
      });
    }
  };

  if (isLoading && !session) {
    return <div className="flex items-center justify-center p-8"><p className="text-gray-500">Loading auth state...</p></div>;
  }

  if (session) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Current Session</h2>
        <div className="space-y-2 mb-6">
          <p><span className="font-medium text-gray-700">Email:</span> {user?.email}</p>
          <p><span className="font-medium text-gray-700">User ID:</span> {user?.id}</p>
          {profile && (
            <>
              <p><span className="font-medium text-gray-700">Full Name:</span> {profile.full_name}</p>
              <p><span className="font-medium text-gray-700">Role:</span> {profile.role}</p>
              <p><span className="font-medium text-gray-700">Onboarding Completed:</span> {profile.has_completed_onboarding ? 'Yes' : 'No'}</p>
            </>
          )}
        </div>
        <button 
          onClick={signOut}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6">{isLogin ? 'Sign In' : 'Create Account'}</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};
