import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2, Edit, RefreshCw, Globe, Network, Radio } from 'lucide-react';
import { format } from 'date-fns';

function MonitorCard({ monitor, onDelete, onEdit, onCheck }) {
  const statusColor = {
    up: 'text-primary',
    down: 'text-destructive',
    pending: 'text-muted-foreground'
  }[monitor.status];

  const statusBg = {
    up: 'bg-primary/10 border-primary/20',
    down: 'bg-destructive/10 border-destructive/20',
    pending: 'bg-muted/10 border-muted/20'
  }[monitor.status];

  return (
    <Card 
      className={`bg-card border-border hover:border-primary/50 transition-smooth relative group ${monitor.status === 'up' ? 'glow-green' : monitor.status === 'down' ? 'glow-red' : ''}`}
      data-testid="monitor-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {monitor.monitor_type === 'https' ? (
              <Globe className="h-5 w-5 text-primary" />
            ) : monitor.monitor_type === 'socket' ? (
              <Network className="h-5 w-5 text-primary" />
            ) : (
              <Radio className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="font-mono text-lg" data-testid="monitor-name">{monitor.name}</CardTitle>
          </div>
          <Badge 
            className={`${statusBg} ${statusColor} font-mono uppercase tracking-wider`}
            data-testid="monitor-status"
          >
            {monitor.status === 'up' && (
              <span className="inline-flex h-2 w-2 rounded-full bg-primary mr-2 status-pulse"></span>
            )}
            {monitor.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-mono">Type:</span>
            <Badge variant="outline" className="font-mono" data-testid="monitor-type">{monitor.monitor_type.toUpperCase()}</Badge>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground font-mono">Target:</span>
            <p className="font-mono text-xs mt-1 break-all" data-testid="monitor-target">{monitor.target}</p>
          </div>
          {monitor.last_checked && (
            <div className="text-xs text-muted-foreground font-mono" data-testid="monitor-last-checked">
              Last checked: {format(new Date(monitor.last_checked), 'yyyy-MM-dd HH:mm:ss')}
            </div>
          )}
          {monitor.response_time && (
            <div className="text-xs text-muted-foreground font-mono" data-testid="monitor-response-time">
              Response: {monitor.response_time.toFixed(0)}ms
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCheck(monitor.id)}
            className="flex-1 font-mono"
            data-testid="monitor-check-button"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(monitor)}
            className="font-mono"
            data-testid="monitor-edit-button"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(monitor.id)}
            className="font-mono text-destructive hover:text-destructive"
            data-testid="monitor-delete-button"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default MonitorCard;