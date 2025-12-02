import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Auth callback page - redirects to appropriate page
 * With Google OAuth, we don't need a callback page since 
 * Google uses popup/redirect and returns directly to the app
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Just redirect to devices or login
    navigate('/machines');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
        <p className="text-coffee-500">Redirecting...</p>
      </div>
    </div>
  );
}
