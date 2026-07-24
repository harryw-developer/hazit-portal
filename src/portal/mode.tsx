import { createContext, useContext } from 'react'
import type { PortalMode } from '../lib/types'

// 'easy' = large, simple layout for less-confident users.
// 'standard' = a normal, more compact dashboard.
export const PortalModeContext = createContext<PortalMode>('easy')

// eslint-disable-next-line react-refresh/only-export-components
export function usePortalMode() {
  return useContext(PortalModeContext)
}
