<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { registerSW } from 'virtual:pwa-register';

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to the user to update the app
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const showInstallButton = ref(false);

onMounted(() => {
  // Check if the browser supports the beforeinstallprompt event
  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt.value = e as BeforeInstallPromptEvent;
    console.log('deferredPrompt', deferredPrompt.value);
    // Update UI to notify the user they can install the PWA
    showInstallButton.value = true;
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  // Listen for app installation
  window.addEventListener('appinstalled', () => {
    // Hide the install button
    showInstallButton.value = false;
    // Clear the deferredPrompt
    deferredPrompt.value = null;
    console.log('PWA was installed');
  });

  // Cleanup event listeners
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
});

const installApp = async () => {
    console.log('deferredPrompt', deferredPrompt.value);
  if (!deferredPrompt.value) return;
  
  try {
    // Show the install prompt
    deferredPrompt.value.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.value.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt.value = null;
    showInstallButton.value = false;
  } catch (error) {
    console.error('Error during PWA installation:', error);
  }
};

// TypeScript interface for the beforeinstallprompt event
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}
</script>

<template>
  <div v-if="showInstallButton" class="pwa-install-prompt">
    <div class="pwa-install-content">
      <p>Install this app for a better experience</p>
      <button @click="installApp" class="install-button">
        Install App
      </button>
      <button @click="showInstallButton = false" class="dismiss-button">
        Not Now
      </button>
    </div>
  </div>
</template>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  max-width: 320px;
}

.pwa-install-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.install-button {
  background-color: #4DBA87;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.install-button:hover {
  background-color: #3da876;
}

.dismiss-button {
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dismiss-button:hover {
  background-color: #f5f5f5;
}
</style>
