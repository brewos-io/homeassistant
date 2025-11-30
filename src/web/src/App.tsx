import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Brewing } from '@/pages/Brewing';
import { Scale } from '@/pages/Scale';
import { Settings } from '@/pages/Settings';
import { System } from '@/pages/System';
import { About } from '@/pages/About';
import { initConnection, getConnection } from '@/lib/connection';
import { initializeStore } from '@/lib/store';

function App() {
  useEffect(() => {
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

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="brewing" element={<Brewing />} />
        <Route path="scale" element={<Scale />} />
        <Route path="settings" element={<Settings />} />
        <Route path="system" element={<System />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

