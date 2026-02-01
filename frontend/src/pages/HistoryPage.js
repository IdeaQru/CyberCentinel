import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { History } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function HistoryPage({ token, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [monitors, setMonitors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, monitorsRes] = await Promise.all([
        axios.get(`${API}/logs?limit=200`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/monitors`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setLogs(logsRes.data);
      
      // Create monitor lookup map
      const monitorMap = {};
      monitorsRes.data.forEach(m => {
        monitorMap[m.id] = m;
      });
      setMonitors(monitorMap);
    } catch (error) {
      toast.error('Gagal memuat history');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="space-y-8" data-testid="history-page">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold font-mono tracking-tight" data-testid="history-title">History</h1>
          <p className="text-muted-foreground mt-2">Riwayat monitoring dan log sistem</p>
        </div>

        {/* Logs */}
        <Card className="bg-card border-border" data-testid="history-logs-card">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <History className="h-5 w-5" />
              Monitor Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="logs-list">
              {logs.map((log, idx) => {
                const monitor = monitors[log.monitor_id];
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-secondary/50 border border-border rounded-lg hover:border-primary/30 transition-smooth"
                    data-testid="log-entry"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge 
                          variant={log.status === 'up' ? 'default' : 'destructive'}
                          className="font-mono"
                          data-testid="log-status-badge"
                        >
                          {log.status.toUpperCase()}
                        </Badge>
                        <span className="font-mono font-medium" data-testid="log-monitor-name">
                          {monitor?.name || log.monitor_id}
                        </span>
                        {monitor && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {monitor.monitor_type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {monitor?.target || 'N/A'}
                        {log.response_time && (
                          <span className="ml-3">Response: {log.response_time.toFixed(0)}ms</span>
                        )}
                        {log.error_message && (
                          <span className="ml-3 text-destructive">Error: {log.error_message}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono" data-testid="log-timestamp">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-mono" data-testid="no-logs-message">
                  Belum ada log history
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default HistoryPage;