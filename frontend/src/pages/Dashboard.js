import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ token, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data from recent logs
  const getChartData = () => {
    if (!stats?.recent_logs) return [];
    
    // Group logs by hour and calculate uptime percentage
    const hourlyData = {};
    stats.recent_logs.forEach(log => {
      const hour = format(new Date(log.timestamp), 'HH:mm');
      if (!hourlyData[hour]) {
        hourlyData[hour] = { time: hour, up: 0, down: 0 };
      }
      if (log.status === 'up') {
        hourlyData[hour].up++;
      } else {
        hourlyData[hour].down++;
      }
    });

    return Object.values(hourlyData).map(data => ({
      time: data.time,
      uptime: data.up + data.down > 0 ? (data.up / (data.up + data.down)) * 100 : 0
    })).reverse().slice(0, 20);
  };

  const uptimePercentage = stats ? 
    stats.total_monitors > 0 ? ((stats.up_monitors / stats.total_monitors) * 100).toFixed(1) : 0 
    : 0;

  if (loading) {
    return (
      <Layout token={token} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground font-mono">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout token={token} onLogout={onLogout}>
      <div className="space-y-8" data-testid="dashboard">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold font-mono tracking-tight" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitoring overview dan statistik sistem</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border hover:border-primary/50 transition-smooth" data-testid="total-monitors-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Monitors</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono" data-testid="total-monitors-count">{stats?.total_monitors || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-smooth" data-testid="up-monitors-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status UP</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary" data-testid="up-monitors-count">{stats?.up_monitors || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-destructive/50 transition-smooth" data-testid="down-monitors-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status DOWN</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-destructive" data-testid="down-monitors-count">{stats?.down_monitors || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-smooth" data-testid="uptime-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono" data-testid="uptime-percentage">{uptimePercentage}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-card border-border" data-testid="uptime-chart-card">
          <CardHeader>
            <CardTitle className="font-mono">Uptime History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="time" stroke="#A1A1AA" style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
                <YAxis stroke="#A1A1AA" style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181B', 
                    border: '1px solid #27272A',
                    borderRadius: '0.5rem',
                    fontFamily: 'JetBrains Mono'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  fill="url(#uptimeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border" data-testid="recent-activity-card">
          <CardHeader>
            <CardTitle className="font-mono">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="terminal-window" data-testid="activity-log">
              {stats?.recent_logs?.slice(0, 10).map((log, idx) => (
                <div key={idx} className="terminal-text mb-2">
                  <span className="text-muted-foreground">[{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}]</span>
                  {' '}
                  <span className={log.status === 'up' ? 'text-primary' : 'text-destructive'}>
                    {log.status === 'up' ? '✓' : '✗'} {log.status.toUpperCase()}
                  </span>
                  {' '}
                  <span className="text-foreground">{log.monitor_id}</span>
                  {log.response_time && (
                    <span className="text-muted-foreground"> ({log.response_time.toFixed(0)}ms)</span>
                  )}
                  {log.error_message && (
                    <span className="text-destructive"> - {log.error_message}</span>
                  )}
                </div>
              ))}
              {(!stats?.recent_logs || stats.recent_logs.length === 0) && (
                <div className="terminal-text text-muted-foreground">Belum ada aktivitas</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Dashboard;