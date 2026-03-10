/// <reference types="@lynx-js/rspeedy/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'screen': { children?: React.ReactNode; style?: Record<string, unknown> }
      'safe-area': { children?: React.ReactNode; style?: Record<string, unknown> }
      'avoid-keyboard': { children?: React.ReactNode; style?: Record<string, unknown>; behavior?: 'padding' | 'position' }
      'app-bar': { title?: string; leading?: 'back' | 'close' | React.ReactNode; onBack?: () => void; trailing?: React.ReactNode; mode?: 'small' | 'medium' | 'large'; elevated?: boolean; style?: Record<string, unknown> }
    }
  }
}
