import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { session, isInitialized } = useAuth();

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <>{fallback || <p>You must be logged in to view this content.</p>}</>;
  }

  return <>{children}</>;
};
