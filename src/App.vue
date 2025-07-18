<script setup lang="ts">
import { ref } from "vue"
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'

const { global } = useTheme()

// Install Prompt
const deferredPrompt = ref<Event | null>(null)

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()



async function installApp() {
  console.log('deferredPrompt.value', deferredPrompt.value);
  const promptEvent = deferredPrompt.value as any
  if (!promptEvent)
    return

  promptEvent.prompt()

  const result = await promptEvent.userChoice
  if (result.outcome === 'accepted')
    console.log('✅ User accepted the install prompt')
  else
    console.log('❌ User dismissed the install prompt')

  deferredPrompt.value = null
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('eeeee', e);
    e.preventDefault()
    deferredPrompt.value = e
  })
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <!-- <VBtn @click="installApp" color="primary">Install App</VBtn> -->
      <RouterView />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
