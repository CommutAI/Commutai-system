import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@commutai/supabase'
import type { Database } from '@commutai/types'

type StaffUser = Database['public']['Tables']['staff_users']['Row']

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // Fetch staff user details
  const { data: staffData, error: staffError } = await supabase
    .from('staff_users')
    .select('*')
    .eq('id', data.user.id)
    .single()
  
  if (staffError) throw staffError
  
  const staff = staffData as StaffUser
  
  if (!staff.is_active) {
    throw new Error('Account is inactive')
  }
  
  return { user: data.user, staff }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return null
  
  const { data: staffData, error: staffError } = await supabase
    .from('staff_users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (staffError) throw staffError
  
  return { user, staff: staffData as StaffUser }
}

export function useAuth() {
  const [user, setUser] = React.useState<{ user: any; staff: StaffUser } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true
    
    getCurrentUser().then((result) => {
      if (isMounted) {
        setUser(result)
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Error getting current user:', error)
      if (isMounted) {
        setUser(null)
        setLoading(false)
      }
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (!isMounted) return
        
        if (session?.user) {
          try {
            const result = await getCurrentUser()
            if (isMounted) {
              setUser(result)
              setLoading(false)
            }
          } catch (error) {
            console.error('Error getting user on auth state change:', error)
            // Don't clear user on temporary errors - only on explicit sign out
            if (_event === 'SIGNED_OUT' && isMounted) {
              setUser(null)
              setLoading(false)
            }
          }
        } else {
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, signOut }
}

export function hasRole(user: StaffUser | null, role: StaffUser['role']): boolean {
  return user?.role === role
}

export function hasAnyRole(user: StaffUser | null, roles: StaffUser['role'][]): boolean {
  return user ? roles.includes(user.role) : false
}

export function hasAllRoles(user: StaffUser | null, roles: StaffUser['role'][]): boolean {
  return user ? roles.every(role => user.role === role) : false
}

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: StaffUser['role'][]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !hasAnyRole(user.staff, allowedRoles)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
