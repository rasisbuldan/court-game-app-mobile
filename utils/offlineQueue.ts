import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabase';

export type QueuedOperation = {
  id: string;
  type: 'UPDATE_SCORE' | 'GENERATE_ROUND' | 'REGENERATE_ROUND' | 'UPDATE_PLAYER_STATUS' | 'REASSIGN_PLAYER';
  sessionId: string;
  data: any;
  timestamp: number;
  retryCount: number;
};

const QUEUE_KEY = 'OFFLINE_QUEUE';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();
  private syncListeners: Set<(status: 'syncing' | 'synced' | 'failed') => void> = new Set();
  private autoSyncUnsubscribe?: () => void;

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }

    // Setup auto-sync on network reconnect
    this.setupAutoSync();
  }

  private setupAutoSync() {
    this.autoSyncUnsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      if (isOnline && this.queue.length > 0 && !this.isProcessing) {
        console.log('Network reconnected, syncing offline queue...');
        this.processQueueWithNotification();
      }
    });
  }

  private async processQueueWithNotification() {
    if (this.queue.length === 0) return;

    this.notifySyncListeners('syncing');

    try {
      const result = await this.processQueue();

      if (result.failed === 0) {
        this.notifySyncListeners('synced');
      } else {
        this.notifySyncListeners('failed');
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
      this.notifySyncListeners('failed');
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
    let successCount = 0;
    let failedCount = 0;

    // Process operations in order
    const operations = [...this.queue];

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        await this.removeOperation(operation.id);
        successCount++;
      } catch (error) {
        console.error('Failed to execute operation:', error);
        operation.retryCount++;

        if (operation.retryCount >= MAX_RETRIES) {
          console.warn('Operation failed after max retries, removing:', operation);
          await this.removeOperation(operation.id);
          failedCount++;
        } else {
          // Update retry count
          const index = this.queue.findIndex((op) => op.id === operation.id);
          if (index !== -1) {
            this.queue[index] = operation;
            await this.saveQueue();
          }
        }
      }
    }

    this.isProcessing = false;
    this.notifyListeners();

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
      console.error('Failed to save offline queue:', error);
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

  onSyncStatusChange(callback: (status: 'syncing' | 'synced' | 'failed') => void) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }

  private notifySyncListeners(status: 'syncing' | 'synced' | 'failed') {
    this.syncListeners.forEach((callback) => callback(status));
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }
}

export const offlineQueue = new OfflineQueueManager();
