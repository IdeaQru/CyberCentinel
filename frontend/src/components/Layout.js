import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Activity, LayoutDashboard, Monitor, History, LogOut } from 'lucide-react';

function Layout({ children, token, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', testId: 'nav-dashboard' },
    { path: '/monitors', icon: Monitor, label: 'Monitors', testId: 'nav-monitors' },
    { path: '/history', icon: History, label: 'History', testId: 'nav-history' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50" data-testid="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3" data-testid="header-logo">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold font-mono tracking-tight">CYBER-SENTINEL</span>
            </div>

            <nav className="hidden md:flex items-center gap-2" data-testid="main-nav">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className="font-mono"
                  data-testid={item.testId}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>

            <Button
              variant="outline"
              onClick={onLogout}
              className="font-mono"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b border-border bg-card/50 backdrop-blur-sm" data-testid="mobile-nav">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.path)}
              className="font-mono flex-1"
              data-testid={`mobile-${item.testId}`}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" data-testid="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12" data-testid="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground font-mono">
          Cyber-Sentinel Monitoring System © 2025
        </div>
      </footer>
    </div>
  );
}

export default Layout;