import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import SessionHistory from './components/pages/SessionHistory';
import PricingPage from './components/pricing/PricingPage';
import SessionDetails from './components/SessionDetails';
import SettingsPage from './components/pages/SettingsPage/SettingsPage';
import StudyPage from './components/pages/StudyPage/StudyPage';
import { processApiKeyFromUrl, useApiKeyFromUrl, useVersionControl } from './hooks';
import { cleanupCorruptedEntries } from './core/services/storage/localStorage';
import { applyLanguageFromUrl } from './core/services/i18n/languageDetector';
import LoadingScreen from './components/LoadingScreen';

// Clean up any corrupted localStorage entries first
cleanupCorruptedEntries();

// Apply ?lang=<Language> before anything reads the language setting
applyLanguageFromUrl();

// Store an API key passed in the URL before the first render
processApiKeyFromUrl();

function App() {
  // Initialize version control first
  const { isReady } = useVersionControl();
  
  // Initialize API key from URL if present (after version control)
  useApiKeyFromUrl();

  // Show loading screen while version control is initializing
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/history" element={<SessionHistory />} />
          <Route path="/session/:id" element={<SessionDetails />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          {/* Unknown paths render the dashboard; the URL is left unchanged */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
