import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      if (!isSupabaseConfigured) {
        navigate('/');
        return;
      }

      // Check URL for OAuth errors (e.g., user cancelled)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      
      const errorCode = hashParams.get('error') || urlParams.get('error');
      const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');
      
      if (errorCode) {
        console.error('OAuth error:', errorCode, errorDescription);
        navigate('/login', { 
          state: { error: errorDescription || 'Authentication was cancelled' }
        });
        return;
      }
      
      const { data, error } = await getSupabase().auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { state: { error: error.message } });
        return;
      }

      // No session means auth failed or was cancelled
      if (!data.session) {
        console.log('No session after auth callback');
        navigate('/login');
        return;
      }

      // Check for pairing redirect
      const deviceId = urlParams.get('device');
      const token = urlParams.get('token');

      if (deviceId && token) {
        // Redirect to pair page with device info
        navigate(`/pair?id=${deviceId}&token=${token}`);
      } else {
        // Normal login - go to devices
        navigate('/devices');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
        <p className="text-coffee-500">Signing in...</p>
      </div>
    </div>
  );
}

