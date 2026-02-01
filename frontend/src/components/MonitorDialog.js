import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MonitorDialog({ open, onClose, token, editingMonitor }) {
  const [formData, setFormData] = useState({
    name: '',
    monitor_type: 'https',
    target: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingMonitor) {
      setFormData({
        name: editingMonitor.name,
        monitor_type: editingMonitor.monitor_type,
        target: editingMonitor.target
      });
    } else {
      setFormData({
        name: '',
        monitor_type: 'https',
        target: ''
      });
    }
  }, [editingMonitor, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target) {
      toast.error('Mohon isi semua field');
      return;
    }

    setLoading(true);
    try {
      if (editingMonitor) {
        await axios.put(`${API}/monitors/${editingMonitor.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Monitor berhasil diupdate');
      } else {
        await axios.post(`${API}/monitors`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Monitor berhasil ditambahkan');
      }
      onClose(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="bg-card border-border" data-testid="monitor-dialog">
        <DialogHeader>
          <DialogTitle className="font-mono" data-testid="dialog-title">
            {editingMonitor ? 'Edit Monitor' : 'Add New Monitor'}
          </DialogTitle>
          <DialogDescription>
            {editingMonitor 
              ? 'Update informasi monitor yang sudah ada'
              : 'Tambahkan website HTTPS, Socket Reader (TCP), atau UDP Listener untuk dimonitor'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Monitor</Label>
            <Input
              id="name"
              placeholder="Contoh: Website Production"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="font-mono"
              data-testid="monitor-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe Monitor</Label>
            <Select
              value={formData.monitor_type}
              onValueChange={(value) => setFormData({ ...formData, monitor_type: value })}
              data-testid="monitor-type-select"
            >
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="https" data-testid="type-https">HTTPS Website</SelectItem>
                <SelectItem value="socket" data-testid="type-socket">Socket Reader (TCP)</SelectItem>
                <SelectItem value="udp" data-testid="type-udp">UDP Reader (Listening)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Input
              id="target"
              placeholder={
                formData.monitor_type === 'https' 
                  ? 'https://demo.osi.my.id/' 
                  : formData.monitor_type === 'socket'
                  ? 'rbsuntirta.osi.my.id:8041'
                  : '127.0.0.1:3009'
              }
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="font-mono"
              data-testid="monitor-target-input"
            />
            <p className="text-xs text-muted-foreground font-mono">
              {formData.monitor_type === 'https' 
                ? 'Format: https://domain.com atau http://domain.com'
                : formData.monitor_type === 'socket'
                ? 'Format: host:port untuk TCP Socket (contoh: server.com:8080)'
                : 'Format: host:port untuk UDP Listener (contoh: 127.0.0.1:3009)'
              }
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              className="font-mono"
              data-testid="dialog-cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="font-mono"
              data-testid="dialog-submit-button"
            >
              {loading ? 'Saving...' : editingMonitor ? 'Update' : 'Add Monitor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MonitorDialog;