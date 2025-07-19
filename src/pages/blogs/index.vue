<script setup lang="ts">
import { getHTTPGetResponse, getHTTPDeleteResponse, getHTTPPatchResponse } from "@/composables/useHTTPMethods";
import { onMounted, ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import { db, getCachedBlogs, cacheBlogs, addPendingOperation, syncPendingOperations } from "@/services/offlineDatabase";
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const router = useRouter();
const headers = [
  { title: "Created At", key: "date" },
  { title: "Title", key: "title" },
  { title: "Description", key: "description" },
  { title: "Status", key: "is_active" },
  { title: "Sync Status", key: "isSynced" },
  { title: "Actions", key: "actions" },
];

const blogs = ref<Array<any>>([]);
const isOnline = ref(navigator.onLine);
const isLoading = ref(false);

// Check network status and sync if online
const handleNetworkChange = async () => {
  const wasOffline = !isOnline.value;
  isOnline.value = navigator.onLine;
  
  if (isOnline.value && wasOffline) {
    // Only sync if we just came back online
    try {
      await syncPendingOperations();
      await getBlogs(); // Refresh the list after sync
    } catch (error) {
      console.error('Error during sync after coming online:', error);
    }
  }
};

// Fetch blogs from server or cache
const getBlogs = async () => {
  isLoading.value = true;
  try {
    if (isOnline.value) {
      const response = await getHTTPGetResponse("/blogs");
      if (response?.results) {
        blogs.value = response.results.map(blog => ({
          ...blog,
          isSynced: true
        }));
        // Cache the blogs for offline use
        await cacheBlogs(blogs.value);
      }
    } else {
      // Load from cache when offline
      const cachedBlogs = await getCachedBlogs();
      blogs.value = cachedBlogs;
      
      toast.warning('You are currently offline. Showing cached data.', {
        theme: 'colored',
        autoClose: 5000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
      });
    }
  } catch (error) {
    console.error('Error fetching blogs:', error);
    
    // Try to load from cache if online fetch fails
    const cachedBlogs = await getCachedBlogs();
    if (cachedBlogs.length > 0) {
      blogs.value = cachedBlogs;
      toast.warning('Showing cached data due to network error.', {
        theme: 'colored',
        autoClose: 5000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
      });
    }
  } finally {
    isLoading.value = false;
  }
};

// Sync local changes with server
const syncBlogs = async (force = false) => {
  if (!isOnline.value) return;
  
  try {
    // Only sync if we have pending operations or if forced
    const pendingOps = await getPendingOperations();
    if (pendingOps.length > 0 || force) {
      await syncPendingOperations();
      await getBlogs(); // Refresh the list after sync
    }
  } catch (error) {
    console.error('Error syncing blogs:', error);
    throw error; // Re-throw to allow handling by the caller
  }
};

const viewBlog = (id: number) => {
  router.push(`/blogs/view/${id}`);
};

const editBlog = (id: number) => {
  router.push(`/blogs/edit/${id}`);
};

const deleteBlog = async (id: number) => {
  if (isOnline.value) {
    const response = await getHTTPDeleteResponse(`/blogs/${id}/`);
    if (response) {
      await getBlogs();
    }
  } else {
    // Add to pending operations when offline
    const blogToDelete = blogs.value.find(blog => blog.id === id);
    if (blogToDelete) {
      await addPendingOperation('DELETE', { id }, '/blogs/');
      blogs.value = blogs.value.filter(blog => blog.id !== id);
      
      toast.info('Blog deletion queued. Will sync when online.', {
        theme: 'colored',
        autoClose: 3000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
      });
    }
  }
};

const toggleStatus = async (id: number, currentStatus: boolean) => {
  const newStatus = !currentStatus;
  
  // Update UI immediately for better UX
  const blogIndex = blogs.value.findIndex(blog => blog.id === id);
  if (blogIndex !== -1) {
    blogs.value[blogIndex].is_active = newStatus;
    blogs.value[blogIndex].isSynced = false;
  }

  try {
    if (isOnline.value) {
      const response = await getHTTPPatchResponse(`/blogs/${id}/toggle-status/`, {
        is_active: newStatus
      });
      
      if (response) {
        blogs.value[blogIndex].isSynced = true;
      }
    } else {
      // Add to pending operations when offline
      await addPendingOperation(
        'UPDATE', 
        { 
          id, 
          is_active: newStatus 
        }, 
        '/blogs/'
      );
      
      toast.info('Status change queued. Will sync when online.', {
        theme: 'colored',
        autoClose: 3000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
      });
    }
  } catch (error) {
    console.error('Error toggling blog status:', error);
    
    // Revert the UI change on error
    if (blogIndex !== -1) {
      blogs.value[blogIndex].is_active = currentStatus;
      blogs.value[blogIndex].isSynced = true;
    }
    
    toast.error('Failed to update status. Please try again.', {
      theme: 'colored',
      autoClose: 3000,
      hideProgressBar: false,
      position: 'top-right',
      pauseOnHover: true,
    });
  }
};

// Set up event listeners
onMounted(async () => {
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
  await getBlogs();
});

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('online', handleNetworkChange);
  window.removeEventListener('offline', handleNetworkChange);
});

</script>

<template>
  <div>
    <VCard title="Blogs">
      <VCardTitle class="d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <h2 class="text-h5">Blog Posts</h2>
          <VChip
            v-if="!isOnline"
            color="warning"
            size="small"
            class="ml-4"
          >
            <VIcon icon="tabler-wifi-off" size="16" class="mr-1" />
            Offline Mode
          </VChip>
        </div>
        <VBtn to="/blogs/add-blog" color="primary" size="small" :disabled="!isOnline">
          <VIcon icon="tabler-plus" start class="mr-2" />
          Add Blog
        </VBtn>
      </VCardTitle>
      
      <VCardText>
        <VAlert
          v-if="!isOnline"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          You are currently offline. Some features may be limited. Changes will be synced when you're back online.
        </VAlert>
        
        <VDataTable 
          :headers="headers" 
          :items="blogs" 
          :items-per-page="5"
          :loading="isLoading"
          loading-text="Loading blogs..."
        >
          <template #item.date="{ item }">
            {{ moment(item.created_at).format("DD-MM-YYYY") }}
          </template>
          
          <template #item.is_active="{ item }">
            <VSwitch
              v-model="item.is_active"
              :disabled="!isOnline && item.isSynced === false"
              color="success"
              hide-details
              @change="toggleStatus(item.id, !item.is_active)"
            />
          </template>
          
          <template #item.isSynced="{ item }">
            <VChip
              v-if="item.isSynced === false"
              size="small"
              color="warning"
              class="text-uppercase"
            >
              <VIcon icon="tabler-clock" size="16" class="mr-1" />
              Pending
            </VChip>
            <VChip
              v-else
              size="small"
              color="success"
              class="text-uppercase"
            >
              <VIcon icon="tabler-check" size="16" class="mr-1" />
              Synced
            </VChip>
          </template>
          
          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <VTooltip text="View">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    variant="text"
                    color="success"
                    size="small"
                    @click="viewBlog(item.id)"
                  >
                    <VIcon icon="tabler-eye" />
                  </VBtn>
                </template>
              </VTooltip>
              
              <VTooltip text="Edit">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    variant="text"
                    color="warning"
                    size="small"
                    :disabled="!isOnline && item.isSynced === false"
                    @click="editBlog(item.id)"
                  >
                    <VIcon icon="tabler-edit" />
                  </VBtn>
                </template>
              </VTooltip>
              
              <VTooltip text="Delete">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    :disabled="!isOnline && item.isSynced === false"
                    @click="deleteBlog(item.id)"
                  >
                    <VIcon icon="tabler-trash" />
                  </VBtn>
                </template>
              </VTooltip>
            </div>
          </template>
          
          <template #no-data>
            <div class="pa-4 text-center">
              <p class="text-body-1">No blog posts found</p>
              <VBtn
                v-if="!isOnline"
                color="primary"
                variant="text"
                @click="getBlogs"
                class="mt-2"
              >
                <VIcon icon="tabler-refresh" class="mr-2" />
                Retry
              </VBtn>
            </div>
          </template>
        </VDataTable>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped></style>
