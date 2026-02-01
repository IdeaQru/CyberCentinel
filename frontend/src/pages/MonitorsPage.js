import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import MonitorCard from '../components/MonitorCard';
import MonitorDialog from '../components/MonitorDialog';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MonitorsPage({ token, onLogout }) {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await axios.get(`${API}/monitors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonitors(response.data);
    } catch (error) {
      toast.error('Gagal memuat monitors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (monitorId) => {
    try {
      await axios.delete(`${API}/monitors/${monitorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Monitor berhasil dihapus');
      fetchMonitors();
    } catch (error) {
      toast.error('Gagal menghapus monitor');
    }
  };

  const handleCheck = async (monitorId) => {
    try {
      await axios.post(`${API}/monitors/${monitorId}/check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Checking monitor...');
      setTimeout(fetchMonitors, 2000);
    } catch (error) {
      toast.error('Gagal melakukan check');
    }
  };

  const handleEdit = (monitor) => {
    setEditingMonitor(monitor);
    setDialogOpen(true);
  };

  const handleDialogClose = (success) => {
    setDialogOpen(false);
    setEditingMonitor(null);
    if (success) {
      fetchMonitors();
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
      <div className="space-y-8" data-testid="monitors-page">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold font-mono tracking-tight" data-testid="monitors-title">Monitors</h1>
            <p className="text-muted-foreground mt-2">Kelola semua monitor HTTPS, Socket, dan UDP</p>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="font-mono uppercase tracking-wider"
            data-testid="add-monitor-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
        </div>

        {/* Monitors Grid */}
        {monitors.length === 0 ? (
          <div className="text-center py-12" data-testid="no-monitors-message">
            <div className="text-muted-foreground font-mono">Belum ada monitor. Tambahkan monitor pertama Anda!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="monitors-grid">
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onCheck={handleCheck}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <MonitorDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        token={token}
        editingMonitor={editingMonitor}
      />
    </Layout>
  );
}

export default MonitorsPage;