import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { googleHealthService } from './src/services/GoogleHealthService';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function AppInner() {
  const { theme } = useTheme();
  useEffect(() => {
    googleHealthService.init().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
