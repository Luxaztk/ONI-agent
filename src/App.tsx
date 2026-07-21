import { useState } from 'react';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';

function App() {
  const [isReady, setIsReady] = useState(false);

  return (
    <ThemeProvider>
      {!isReady ? (
        <LoadingScreen onReady={() => setIsReady(true)} />
      ) : (
        <Layout />
      )}
    </ThemeProvider>
  );
}

export default App;
