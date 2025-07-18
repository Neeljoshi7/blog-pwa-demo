<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'
import PWAInstallPrompt from './components/PWAInstallPrompt.vue'

const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()

// Check if the app is launched in standalone mode
onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('Launched as PWA')
  }
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <PWAInstallPrompt />
      <RouterView />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
