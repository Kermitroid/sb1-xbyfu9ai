import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../stores/userStore';

export const useErrorHandler = () => {
  const navigate = useNavigate();
  const logout = useUserStore(state => state.logout);

  const handleError = useCallback((error: any) => {
    console.error('Error occurred:', error);

    if (error?.response?.status === 401) {
      // Unauthorized - redirect to login
      logout();
      navigate('/login');
      return;
    }

    if (error?.response?.status === 403) {
      // Forbidden - show error message
      return 'You do not have permission to perform this action';
    }

    if (error?.response?.status === 404) {
      // Not found
      return 'The requested resource was not found';
    }

    if (error?.response?.status >= 500) {
      // Server error
      return 'Server error occurred. Please try again later.';
    }

    // Network or other errors
    if (!error?.response) {
      return 'Network error. Please check your connection and try again.';
    }

    // Return the error message from the server
    return error?.response?.data?.error || 'An unexpected error occurred';
  }, [logout, navigate]);

  return handleError;
};
