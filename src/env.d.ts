/// <reference types="vite/client" />
import { ComponentCustomProperties } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $formatMoney: (amount: number | null | undefined) => string
  }
}
