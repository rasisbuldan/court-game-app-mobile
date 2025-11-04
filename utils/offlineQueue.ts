import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { supabase } from '../config/supabase';
import { Logger } from './logger';

export type QueuedOperation = {
  id: string;
  type: 'UPDATE_SCORE' | 'GENERATE_ROUND' | 'REGENERATE_ROUND' | 'UPDATE_PLAYER_STATUS' | 'REASSIGN_PLAYER';
  sessionId: string;
  data: any;
  timestamp: number;
  retryCount: number;
};

type SyncStatus = 'syncing' | 'synced' | 'failed';
type SyncStatusCallback = (status: SyncStatus, current: number, total: number) => void;

const QUEUE_KEY = 'OFFLINE_QUEUE';
const MAX_RETRIES = 5;

// Exponential backoff delays (in milliseconds)
const RETRY_DELAYS = [0, 2000, 4000, 8000, 16000]; // 0s, 2s, 4s, 8s, 16s

class OfflineQueueManager {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();
  private syncListeners: Set<SyncStatusCallback> = new Set();
  private autoSyncUnsubscribe?: () => void;
  private currentProgress = { current: 0, total: 0 };

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      // Non-critical error - queue will start empty
      if (__DEV__) {
        Logger.error('Failed to load offline queue', error as Error, { action: 'loadQueue' });
      }
    }

    // Setup auto-sync on network reconnect
    this.setupAutoSync();
  }

  private setupAutoSync() {
    this.autoSyncUnsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      if (isOnline && this.queue.length > 0 && !this.isProcessing) {
        if (__DEV__) {
          Logger.info('Network reconnected, syncing offline queue', { queueLength: this.queue.length });
        }
        this.processQueueWithNotification();
      }
    });
  }

  private async processQueueWithNotification() {
    if (this.queue.length === 0) return;

    this.notifySyncListeners('syncing', 0, this.queue.length);

    try {
      const result = await this.processQueue();

      if (result.failed === 0) {
        this.notifySyncListeners('synced', result.success, result.success);
      } else {
        this.notifySyncListeners('failed', result.success, result.success + result.failed);
      }
    } catch (error) {
      if (__DEV__) {
        Logger.error('Offline queue auto-sync failed', error as Error, { action: 'autoSync' });
      }
      this.notifySyncListeners('failed', 0, this.queue.length);
    }
  }

  cleanup() {
    if (this.autoSyncUnsubscribe) {
      this.autoSyncUnsubscribe();
    }
  }

  async addOperation(
    type: QueuedOperation['type'],
    sessionId: string,
    data: any
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      sessionId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(operation);
    await this.saveQueue();
    this.notifyListeners();

    // Show toast notification that operation was queued
    const netState = await NetInfo.fetch();
    const isOffline = !netState.isConnected || !netState.isInternetReachable;

    if (isOffline) {
      Toast.show({
        type: 'info',
        text1: 'Saved offline',
        text2: 'Changes will sync when you\'re back online',
        visibilityTime: 3000,
      });
    }

    return operation.id;
  }

  async removeOperation(id: string) {
    this.queue = this.queue.filter((op) => op.id !== id);
    await this.saveQueue();
    this.notifyListeners();
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let successCount = 0;
    let failedCount = 0;

    // Process operations in order
    const operations = [...this.queue];
    this.currentProgress.total = operations.length;

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      this.currentProgress.current = i;

      try {
        // Apply exponential backoff based on retry count
        const delay = RETRY_DELAYS[Math.min(operation.retryCount, RETRY_DELAYS.length - 1)];
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        await this.executeOperation(operation);
        await this.removeOperation(operation.id);
        successCount++;

        // Notify progress
        this.notifySyncListeners('syncing', i + 1, operations.length);
      } catch (error) {
        if (__DEV__) {
          Logger.error('Offline queue operation failed', error as Error, {
            action: 'processOperation',
            metadata: { operationType: operation.type, sessionId: operation.sessionId }
          });
        }

        operation.retryCount++;

        if (operation.retryCount >= MAX_RETRIES) {
          if (__DEV__) {
            Logger.warn('Offline queue: Max retries reached, removing operation', {
              action: 'maxRetriesReached',
              metadata: { operationType: operation.type, sessionId: operation.sessionId, retryCount: operation.retryCount }
            });
          }
          await this.removeOperation(operation.id);
          failedCount++;
        } else {
          // Update retry count and save
          const index = this.queue.findIndex((op) => op.id === operation.id);
          if (index !== -1) {
            this.queue[index] = operation;
            await this.saveQueue();
          }
        }
      }
    }

    this.isProcessing = false;
    this.currentProgress = { current: 0, total: 0 };
    this.notifyListeners();

    const duration = Date.now() - startTime;

    Logger.info('Offline queue processing completed', {
      action: 'processQueue',
      metadata: {
        totalOperations: operations.length,
        successCount,
        failedCount,
        durationMs: duration,
      }
    });

    // Log performance warning if processing was slow
    if (duration > 10000 && operations.length > 0) {
      Logger.warn('Offline queue processing was slow', {
        action: 'processQueue',
        metadata: {
          durationMs: duration,
          operationCount: operations.length,
          avgTimePerOperation: Math.round(duration / operations.length),
        },
      });
    }

    return { success: successCount, failed: failedCount };
  }

  private async executeOperation(operation: QueuedOperation) {
    switch (operation.type) {
      case 'UPDATE_SCORE':
        return this.executeUpdateScore(operation);
      case 'GENERATE_ROUND':
        return this.executeGenerateRound(operation);
      case 'REGENERATE_ROUND':
        return this.executeRegenerateRound(operation);
      case 'UPDATE_PLAYER_STATUS':
        return this.executeUpdatePlayerStatus(operation);
      case 'REASSIGN_PLAYER':
        return this.executeReassignPlayer(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeUpdateScore(operation: QueuedOperation) {
    const { sessionId, roundIndex, matchIndex, team1Score, team2Score, updatedRounds } =
      operation.data;

    // Update session
    // NOTE: Pass JavaScript object directly - Supabase converts to JSONB automatically
    const { error } = await supabase
      .from('game_sessions')
      .update({ round_data: updatedRounds })
      .eq('id', sessionId);

    if (error) throw error;

    // Log event
    await supabase.from('event_history').insert({
      session_id: sessionId,
      event_type: 'score_updated',
      description: operation.data.description,
    });
  }

  private async executeGenerateRound(operation: QueuedOperation) {
    const { sessionId, updatedRounds, currentRound } = operation.data;

    // NOTE: Pass JavaScript object directly - Supabase converts to JSONB automatically
    const { error } = await supabase
      .from('game_sessions')
      .update({
        round_data: updatedRounds,
        current_round: currentRound,
      })
      .eq('id', sessionId);

    if (error) throw error;

    await supabase.from('event_history').insert({
      session_id: sessionId,
      event_type: 'round_generated',
      description: operation.data.description,
    });
  }

  private async executeRegenerateRound(operation: QueuedOperation) {
    const { sessionId, updatedRounds } = operation.data;

    // NOTE: Pass JavaScript object directly - Supabase converts to JSONB automatically
    const { error } = await supabase
      .from('game_sessions')
      .update({
        round_data: updatedRounds,
      })
      .eq('id', sessionId);

    if (error) throw error;

    await supabase.from('event_history').insert({
      session_id: sessionId,
      event_type: 'round_generated',
      description: operation.data.description,
    });
  }

  private async executeUpdatePlayerStatus(operation: QueuedOperation) {
    const { playerId, newStatus, sessionId, description } = operation.data;

    const { error } = await supabase
      .from('players')
      .update({ status: newStatus })
      .eq('id', playerId);

    if (error) throw error;

    await supabase.from('event_history').insert({
      session_id: sessionId,
      event_type: 'player_status_changed',
      description,
      player_id: playerId,
    });
  }

  private async executeReassignPlayer(operation: QueuedOperation) {
    const { oldPlayerId, newPlayerId, sessionId, description, updatedRounds } = operation.data;

    // Update round data
    // NOTE: Pass JavaScript object directly - Supabase converts to JSONB automatically
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .update({ round_data: updatedRounds })
      .eq('id', sessionId);

    if (sessionError) throw sessionError;

    await supabase.from('event_history').insert({
      session_id: sessionId,
      event_type: 'player_reassigned',
      description,
    });
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      // Critical error - queue won't persist
      if (__DEV__) {
        Logger.error('Failed to save offline queue', error as Error, { action: 'saveQueue' });
      }
      // In production, consider reporting to error tracking service
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  hasUnsynced(): boolean {
    return this.queue.length > 0;
  }

  onQueueChange(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onSyncStatusChange(callback: SyncStatusCallback) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        if (__DEV__) {
          Logger.error('Offline queue listener error', error as Error, { action: 'notifyListeners' });
        }
      }
    });
  }

  private notifySyncListeners(status: SyncStatus, current: number, total: number) {
    this.syncListeners.forEach((callback) => {
      try {
        callback(status, current, total);
      } catch (error) {
        if (__DEV__) {
          Logger.error('Offline queue sync listener error', error as Error, { action: 'notifySyncListeners' });
        }
      }
    });
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }
}

export const offlineQueue = new OfflineQueueManager();
