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
import { initConnection, getConnection } from '@/lib/connection';
import { initializeStore } from '@/lib/store';

function App() {
  const [loading, setLoading] = useState(true);
  const [apMode, setApMode] = useState(false);

  useEffect(() => {
    // Check if in AP mode
    const checkMode = async () => {
      try {
        const response = await fetch('/api/mode');
        const data = await response.json();
        setApMode(data.apMode);
      } catch (err) {
        // If we can't reach the API, assume not in AP mode
        console.log('Could not check AP mode');
      }
      setLoading(false);
    };

    checkMode();

    // Initialize connection on mount
    const connection = initConnection({
      mode: 'local',
      endpoint: '/ws',
    });

    // Bind connection to store
    initializeStore(connection);

    // Connect
    connection.connect().catch((error) => {
      console.error('Initial connection failed:', error);
    });

    // Cleanup
    return () => {
      getConnection()?.disconnect();
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="BrewOS" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-coffee-500">Loading...</p>
        </div>
      </div>
    );
  }

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
        <Route path="about" element={<About />} />
        <Route path="setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

