import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Brewing } from '@/pages/Brewing';
import { Scale } from '@/pages/Scale';
import { Settings } from '@/pages/Settings';
import { System } from '@/pages/System';
import { About } from '@/pages/About';
import { Setup } from '@/pages/Setup';
import { Login } from '@/pages/Login';
import { Devices } from '@/pages/Devices';
import { AuthCallback } from '@/pages/AuthCallback';
import { Pair } from '@/pages/Pair';
import { Onboarding } from '@/pages/Onboarding';
import { Cloud } from '@/pages/Cloud';
import { initConnection, getConnection } from '@/lib/connection';
import { initializeStore } from '@/lib/store';
import { useAppStore } from '@/lib/mode';
import { Loader2 } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [apMode, setApMode] = useState(false);
  
  const { 
    mode, 
    initialized, 
    user, 
    devices, 
    initialize,
    getSelectedDevice,
  } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await initialize();

      if (mode === 'local') {
        // Local mode: check AP mode and init WebSocket
        try {
          const response = await fetch('/api/mode');
          const data = await response.json();
          setApMode(data.apMode);
        } catch {
          console.log('Could not check AP mode');
        }

        // Initialize WebSocket connection
        const connection = initConnection({
          mode: 'local',
          endpoint: '/ws',
        });

        initializeStore(connection);

        connection.connect().catch((error) => {
          console.error('Initial connection failed:', error);
        });
      }

      setLoading(false);
    };

    init();

    return () => {
      getConnection()?.disconnect();
    };
  }, [initialize, mode]);

  // Show loading state
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-coffee-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ===== LOCAL MODE (ESP32) =====
  if (mode === 'local') {
    // Show setup page in AP mode
    if (apMode) {
      return <Setup />;
    }

    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="brewing" element={<Brewing />} />
          <Route path="scale" element={<Scale />} />
          <Route path="settings" element={<Settings />} />
          <Route path="system" element={<System />} />
          <Route path="cloud" element={<Cloud />} />
          <Route path="about" element={<About />} />
          <Route path="setup" element={<Setup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  // ===== CLOUD MODE =====
  
  // Not logged in -> Login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pair" element={<Pair />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but no devices -> Onboarding
  if (devices.length === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pair" element={<Pair />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Logged in with devices -> Full app
  const selectedDevice = getSelectedDevice();
  
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/pair" element={<Pair />} />
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Device management */}
      <Route path="/devices" element={<Devices />} />
      <Route path="/login" element={<Navigate to="/devices" replace />} />
      
      {/* Device control (when connected via cloud) */}
      <Route path="/device/:deviceId" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="brewing" element={<Brewing />} />
        <Route path="scale" element={<Scale />} />
        <Route path="settings" element={<Settings />} />
        <Route path="system" element={<System />} />
        <Route path="about" element={<About />} />
      </Route>
      
      {/* Root: redirect to selected device or first device */}
      <Route 
        path="/" 
        element={
          <Navigate 
            to={selectedDevice ? `/device/${selectedDevice.id}` : '/devices'} 
            replace 
          />
        } 
      />
      
      {/* Default: redirect to devices */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

