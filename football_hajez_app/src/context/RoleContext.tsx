/* eslint-disable react-refresh/only-export-components -- co-located hook + provider */
import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppRole } from '../types/domain'
import { getRole, setRole as persistRole } from '../utils/localStorage'

type RoleContextValue = {
  role: AppRole | null
  setRole: (role: AppRole) => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AppRole | null>(() => getRole())

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      setRole: (nextRole) => {
        persistRole(nextRole)
        setRoleState(nextRole)
      },
    }),
    [role],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useRole must be used inside RoleProvider')
  return context
}
