import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 1. Define global type augmentation for the config
declare global {
  interface Window {
    SMART_WIDGET_CONFIG?: {
      companyId: string;
      containerId?: string;
    }
    initSmartWidget?: (config: { companyId: string; containerId?: string }) => void
  }
}

// 2. Widget initialization function
function initSmartWidget(config: { companyId: string; containerId?: string }): void {
  window.SMART_WIDGET_CONFIG = config

  const containerId = config.containerId || 'smart-chat-widget-container'
  let container = document.getElementById(containerId)

  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
  }

  createRoot(container).render(<App />)
}

// 3. Safe global function assignment
if (typeof window !== 'undefined') {
  window.initSmartWidget = initSmartWidget
}

// 4. Auto-init with proper type checking
const currentScript = document.currentScript as HTMLScriptElement | null

if (currentScript?.dataset.companyId) {
  initSmartWidget({
    companyId: currentScript.dataset.companyId,
    containerId: currentScript.dataset.containerId || undefined
  })
}