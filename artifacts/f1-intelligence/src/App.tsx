import React from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { PredictionProvider } from './context/PredictionContext';
import { NavBar } from './components/NavBar';
import NotFound from '@/pages/not-found';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import DatasetExplorer from './pages/DatasetExplorer';
import HowItWorks from './pages/HowItWorks';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [location] = useLocation();
  const isLanding = location === '/';

  return (
    <div className="min-h-screen w-full bg-background text-primary font-mono flex flex-col overflow-hidden relative selection:bg-primary selection:text-background">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,65,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* CRT Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20" />

      {/* NavBar only shown inside the app (not on landing) */}
      {!isLanding && <NavBar />}

      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden relative z-10 ${
          isLanding
            ? ''
            : 'p-4 md:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_center,rgba(0,255,65,0.05)_0%,rgba(19,19,19,1)_100%)]'
        }`}
      >
        <div className={isLanding ? '' : 'max-w-7xl mx-auto'}>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/insights" component={Insights} />
            <Route path="/dataset" component={DatasetExplorer} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PredictionProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppContent />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </PredictionProvider>
    </QueryClientProvider>
  );
}

export default App;
