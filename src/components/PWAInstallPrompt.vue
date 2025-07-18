<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const showInstallButton = ref(false);
const isInstalling = ref(false);
const errorMessage = ref<string | null>(null);

const handleBeforeInstallPrompt = (e: Event) => {
  console.log('beforeinstallprompt event fired');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt.value = e as BeforeInstallPromptEvent;
  // Update UI to notify the user they can install the PWA
  showInstallButton.value = true;
};

const handleAppInstalled = () => {
  console.log('App was installed');
  showInstallButton.value = false;
  deferredPrompt.value = null;
  isInstalling.value = false;
};

onMounted(() => {
  console.log('PWAInstallPrompt component mounted');
  
  // Check if the browser supports the beforeinstallprompt event
  if ('BeforeInstallPromptEvent' in window) {
    console.log('Browser supports beforeinstallprompt event');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
} else {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    // console.warn('Browser does not support beforeinstallprompt event');
  }

  // Listen for app installation
  window.addEventListener('appinstalled', handleAppInstalled);
  
  // Check if the app is already installed
  checkIfAppIsInstalled();
});

onUnmounted(() => {
  console.log('PWAInstallPrompt component unmounted');
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
});

const checkIfAppIsInstalled = () => {
  // @ts-ignore - TypeScript doesn't know about getInstalledRelatedApps
  if (navigator.getInstalledRelatedApps) {
    // @ts-ignore
    navigator.getInstalledRelatedApps().then((relatedApps) => {
      console.log('Installed related apps:', relatedApps);
      if (relatedApps.length > 0) {
        showInstallButton.value = false;
      }
    }).catch((error: Error) => {
      console.error('Error checking installed apps:', error);
    });
  }
};

const installApp = async () => {
  console.log('Install button clicked');
  
  if (!deferredPrompt.value) {
    console.error('No deferred prompt available');
    errorMessage.value = 'Installation is not available right now. Please try again later.';
    return;
  }
  
  isInstalling.value = true;
  errorMessage.value = null;
  
  try {
    console.log('Showing install prompt...');
    // Show the install prompt
    deferredPrompt.value.prompt();
    
    // Wait for the user to respond to the prompt
    console.log('Waiting for user choice...');
    const choiceResult = await deferredPrompt.value.userChoice;
    console.log('User choice result:', choiceResult);
    
    // Log the outcome
    const { outcome } = choiceResult;
    console.log(`User response to the install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      // The prompt was accepted, the browser will handle the installation
    } else {
      console.log('User dismissed the install prompt');
    }
    
  } catch (error) {
    console.error('Error during PWA installation:', error);
    if (error instanceof Error) {
      errorMessage.value = `Installation failed: ${error.message}`;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      errorMessage.value = 'An unknown error occurred during installation';
    }
  } finally {
    // We've used the prompt, and can't use it again, throw it away
    console.log('Cleaning up deferredPrompt');
    deferredPrompt.value = null;
    showInstallButton.value = false;
    isInstalling.value = false;
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
      <button 
        @click="installApp" 
        class="install-button"
        :disabled="isInstalling"
      >
        {{ isInstalling ? 'Installing...' : 'Install App' }}
      </button>
      <button 
        @click="showInstallButton = false" 
        class="dismiss-button"
        :disabled="isInstalling"
      >
        Not Now
      </button>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
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

.install-button:hover:not(:disabled) {
  background-color: #3da876;
}

.install-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.dismiss-button {
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dismiss-button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.dismiss-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #ff4444;
  font-size: 0.9em;
  margin-top: 8px;
}
</style>
