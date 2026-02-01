import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (isLogin) => {
    if (!email || !password) {
      toast.error('Mohon isi email dan password');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, { email, password });
      onLogin(response.data.access_token);
      toast.success(isLogin ? 'Login berhasil!' : 'Registrasi berhasil!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1607694418429-5cfe3b73bb35?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNlcnZlciUyMGRhdGElMjBmbG93JTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzY5NjYyMjcxfDA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/80"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md z-10 bg-card/95 backdrop-blur-sm border-border" data-testid="login-card">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20" data-testid="logo-container">
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold font-mono tracking-tight" data-testid="app-title">
              CYBER-SENTINEL
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Sistem Monitoring Website & Socket
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="auth-tabs">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4" data-testid="login-form">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-mono"
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                  data-testid="login-password-input"
                />
              </div>
              <Button
                className="w-full font-mono uppercase tracking-wider"
                onClick={() => handleAuth(true)}
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'Loading...' : 'Login'}
              </Button>
            </TabsContent>
            <TabsContent value="register" className="space-y-4" data-testid="register-form">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-mono"
                  data-testid="register-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                  data-testid="register-password-input"
                />
              </div>
              <Button
                className="w-full font-mono uppercase tracking-wider"
                onClick={() => handleAuth(false)}
                disabled={loading}
                data-testid="register-submit-button"
              >
                {loading ? 'Loading...' : 'Register'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;