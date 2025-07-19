import Dexie, { type Table } from 'dexie';
import type { Blog } from '@/types/blog';

export interface PendingOperation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  url: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
  retryCount?: number;
  lastRetry?: string;
}

class OfflineDatabase extends Dexie {
  blogs!: Table<Blog, number>;
  pendingOperations!: Table<PendingOperation, number>;

  constructor() {
    super('BlogPwaDatabase');
    
    this.version(1).stores({
      blogs: '++id, title, description, is_active, created_at, updated_at',
      pendingOperations: '++id, type, status, timestamp',
    });
  }
}

export const db = new OfflineDatabase();

// Helper functions for blog operations
export const getCachedBlogs = async (): Promise<Blog[]> => {
  return await db.blogs.toArray();
};

export const cacheBlogs = async (blogs: Blog[]): Promise<void> => {
  await db.blogs.clear();
  await db.blogs.bulkAdd(blogs);
};

export const getCachedBlog = async (id: number): Promise<Blog | undefined> => {
  return await db.blogs.get(id);
};

export const addPendingOperation = async (
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any,
  url: string
): Promise<number> => {
  return await db.pendingOperations.add({
    type,
    data,
    url,
    timestamp: Date.now(),
    status: 'pending',
  });
};

export const getPendingOperations = async (): Promise<PendingOperation[]> => {
  return await db.pendingOperations
    .where('status')
    .equals('pending')
    .toArray();
};

export const updateOperationStatus = async (
  id: number,
  status: 'pending' | 'syncing' | 'completed' | 'failed',
  error?: string
): Promise<void> => {
  await db.pendingOperations.update(id, { status });
};

export const removeOperation = async (id: number): Promise<void> => {
  await db.pendingOperations.delete(id);
};

// Track in-progress sync to prevent duplicates
let isSyncing = false;

// Sync function to be called when online
export const syncPendingOperations = async (): Promise<void> => {
  // Prevent multiple concurrent syncs
  if (isSyncing) return;
  
  isSyncing = true;
  
  try {
    // Get all pending operations, ordered by timestamp
    const operations = await db.pendingOperations
      .where('status')
      .equals('pending')
      .sortBy('timestamp');
    
    if (operations.length === 0) return;
    
    console.log(`Syncing ${operations.length} pending operations...`);
    
    for (const op of operations) {
      try {
        // Mark as syncing
        await db.pendingOperations.update(op.id!, { status: 'syncing' });
        
        // Execute the operation
        switch (op.type) {
          case 'CREATE': {
            const response = await getHTTPPostResponse(op.url, op.data);
            if (response && response.data) {
              // Update the local cache with the server-generated ID
              const responseData = response.data;
              if (responseData.id) {
                await db.blogs.put({
                  ...op.data,
                  id: responseData.id,
                  isSynced: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              }
            }
            break;
          }
          case 'UPDATE': {
            await getHTTPPatchResponse(`${op.url}${op.data.id}/`, op.data);
            // Update local cache
            await db.blogs.update(op.data.id, {
              ...op.data,
              isSynced: true,
              updated_at: new Date().toISOString()
            });
            break;
          }
          case 'DELETE': {
            await getHTTPDeleteResponse(`${op.url}${op.data.id}/`);
            // Remove from local cache
            await db.blogs.delete(op.data.id);
            break;
          }
        }
        
        // Only remove if the operation was successful
        await db.pendingOperations.delete(op.id!);
      } catch (error) {
        console.error('Sync failed for operation:', op, error);
        await db.pendingOperations.update(op.id!, { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: (op.retryCount || 0) + 1,
          lastRetry: new Date().toISOString()
        });
      }
    }
    
    console.log('Sync completed');
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    isSyncing = false;
  }
};

// Check network status and sync if online
const handleNetworkChange = () => {
  if (navigator.onLine) {
    syncPendingOperations();
  }
};

// Listen for network status changes
window.addEventListener('online', handleNetworkChange);
window.addEventListener('offline', handleNetworkChange);

// Import HTTP methods
import { 
  getHTTPPostResponse, 
  getHTTPPatchResponse, 
  getHTTPDeleteResponse 
} from '@/composables/useHTTPMethods';
