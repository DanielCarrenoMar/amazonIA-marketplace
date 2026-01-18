import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  nombre: string
  telefono: string | null
  direccion: string | null
  tipo: 'vendedor' | 'comprador'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, userData: { 
    nombre: string, 
    tipo: 'vendedor' | 'comprador',
    telefono?: string,
    direccion?: string 
  }) => Promise<{ data: any, error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any, error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: any, error: any }>
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('🔍 Buscando perfil para usuario:', userId)
    
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout buscando perfil')), 5000)
        )
      ]) as any

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return null
      }
      
      console.log('✅ Perfil encontrado:', {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        tipo: data.tipo
      });
      
      return data
    } catch (err) {
      console.error('❌ Error o timeout obteniendo perfil:', err)
      return null
    }
  }

  useEffect(() => {
    // Obtener sesión actual
    const getSession = async () => {
      console.log('🔄 AuthProvider: Obteniendo sesión actual...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error obteniendo sesión:', error)
          setLoading(false)
          return
        }
        
        console.log('📱 AuthProvider: Sesión obtenida:', session ? { user: session.user.id, email: session.user.email } : 'No hay sesión');
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 AuthProvider: Usuario encontrado en sesión, buscando perfil...');
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('❌ Error en getSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 AuthProvider: Cambio de autenticación:', { event, session: session ? { user: session.user.id, email: session.user.email } : 'No session' });
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 AuthProvider: Usuario en cambio de auth, buscando perfil...');
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
        } else {
          console.log('🚪 AuthProvider: Usuario deslogueado, limpiando perfil...');
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      console.log('🧹 AuthProvider: Limpiando suscripción')
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, userData: { 
    nombre: string, 
    tipo: 'vendedor' | 'comprador',
    telefono?: string,
    direccion?: string 
  }) => {
    console.log('🚀 AuthProvider: Iniciando registro...', { email, userData })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('📧 AuthProvider: Resultado auth.signUp:', { data, error })

    // Si el registro es exitoso, crear el perfil
    if (data.user && !error) {
      console.log('✅ AuthProvider: Usuario creado en auth, creando perfil...', data.user.id)
      
      const profileData = {
        id: data.user.id,
        email: data.user.email,
        nombre: userData.nombre,
        tipo: userData.tipo,
        telefono: userData.telefono || null,
        direccion: userData.direccion || null,
      }
      
      console.log('📝 AuthProvider: Datos del perfil a insertar:', profileData)
      
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert(profileData)

      if (profileError) {
        console.error('❌ AuthProvider: Error creating profile:', profileError)
        return { data, error: profileError }
      } else {
        console.log('✅ AuthProvider: Perfil creado exitosamente')
      }
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Iniciando signIn...', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('📧 AuthProvider: Resultado auth.signInWithPassword:', { data, error });
    
    if (data.user && !error) {
      console.log('✅ AuthProvider: Usuario autenticado, buscando perfil...', data.user.id);
      
      // Intentar obtener el perfil inmediatamente después del login
      const userProfile = await fetchUserProfile(data.user.id);
      if (userProfile) {
        console.log('👤 AuthProvider: Perfil obtenido en signIn:', userProfile);
        setProfile(userProfile);
      }
    }
    
    return { data, error }
  }

  const signOut = async () => {
    console.log('🚪 AuthProvider: Cerrando sesión...')
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setProfile(null)
      console.log('✅ AuthProvider: Sesión cerrada exitosamente')
    }
    return { error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { data: null, error: new Error('No user logged in') }

    console.log('📝 AuthProvider: Actualizando perfil...', updates)

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
      console.log('✅ AuthProvider: Perfil actualizado exitosamente')
    }

    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}