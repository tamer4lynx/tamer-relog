/// <reference types="@lynx-js/rspeedy/client" />
import type React from 'react'
import type { ViewProps } from '@lynx-js/types'

declare module '@lynx-js/react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'app-bar': { title?: string; leading?: 'back' | 'close' | React.ReactNode; onBack?: () => void; trailing?: React.ReactNode; mode?: 'small' | 'medium' | 'large'; elevated?: boolean; style?: Record<string, unknown> }
      icon: { icon: string; set?: 'material' | 'fontawesome' | 'fa'; iconColor?: string; size?: number; style?: Record<string, unknown> };
    }
  }
}
