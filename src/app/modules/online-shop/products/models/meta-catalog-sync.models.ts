export interface MetaCatalogSyncProgress {
  isRunning: boolean;
  status: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
  percent: number;
  message?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}
