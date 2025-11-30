import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth, useDevices } from '@/lib/auth';
import { Coffee, Check, X, Loader2 } from 'lucide-react';

export function Pair() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { claimDevice } = useDevices();
  
  const deviceId = searchParams.get('id') || '';
  const token = searchParams.get('token') || '';
  const defaultName = searchParams.get('name') || '';
  
  const [deviceName, setDeviceName] = useState(defaultName);
  const [status, setStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!deviceId || !token) {
      navigate('/devices');
    }
  }, [deviceId, token, navigate]);

  const handlePair = async () => {
    if (!user) {
      // Save pairing info and redirect to login
      const returnUrl = `/pair?id=${deviceId}&token=${encodeURIComponent(token)}&name=${encodeURIComponent(deviceName)}`;
      localStorage.setItem('brewos_pair_return', returnUrl);
      await signInWithGoogle();
      return;
    }

    setStatus('claiming');
    setErrorMessage('');

    try {
      const success = await claimDevice(deviceId, token, deviceName || undefined);
      
      if (success) {
        setStatus('success');
        setTimeout(() => navigate('/devices'), 2000);
      } else {
        setStatus('error');
        setErrorMessage('Failed to pair device. The code may have expired.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An error occurred while pairing.');
    }
  };

  // Check for saved pairing after OAuth return
  useEffect(() => {
    if (user && status === 'idle') {
      const savedReturn = localStorage.getItem('brewos_pair_return');
      if (savedReturn) {
        localStorage.removeItem('brewos_pair_return');
        // Auto-pair if we just logged in
        handlePair();
      }
    }
  }, [user, status]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-800 to-coffee-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-coffee-900 mb-2">Device Paired!</h2>
            <p className="text-coffee-500">
              Redirecting to your devices...
            </p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-coffee-900 mb-2">Pairing Failed</h2>
            <p className="text-coffee-500 mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => navigate('/devices')}>
                Go to Devices
              </Button>
              <Button onClick={() => setStatus('idle')}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <Coffee className="w-16 h-16 text-accent mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-coffee-900">Pair Device</h1>
              <p className="text-coffee-500 mt-2">
                Add this BrewOS device to your account
              </p>
            </div>

            <div className="bg-cream-100 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-coffee-500">Device ID</span>
                <span className="font-mono text-coffee-900">{deviceId}</span>
              </div>
            </div>

            <Input
              label="Device Name"
              placeholder="Kitchen Espresso"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="mb-6"
            />

            {!user && (
              <p className="text-sm text-coffee-500 mb-4 text-center">
                You'll need to sign in to add this device.
              </p>
            )}

            <Button
              className="w-full"
              onClick={handlePair}
              loading={status === 'claiming'}
            >
              {user ? 'Add to My Devices' : 'Sign in & Add Device'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

