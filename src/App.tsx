import { useState } from 'react';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';

function App() {
  const [isReady, setIsReady] = useState(false);

  return (
    <ThemeProvider>
      <ChatProvider>
        {!isReady ? (
          <LoadingScreen onReady={() => setIsReady(true)} />
        ) : (
          <Layout />
        )}
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
