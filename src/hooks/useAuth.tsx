import { useState, useEffect } from 'react'
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string) => {
    console.log('🔍 Buscando perfil para usuario:', userId)
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching profile:', error)
      console.log('🔍 Intentando consulta sin .single() para ver si hay múltiples registros...')
      
      // Intentar sin .single() para ver si hay datos
      const { data: allData, error: allError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
      
      console.log('📊 Todos los registros para este usuario:', { allData, allError });
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
  }

  useEffect(() => {
    // Obtener sesión actual
    const getSession = async () => {
      console.log('🔄 Obteniendo sesión actual...');
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📱 Sesión obtenida:', session ? { user: session.user.id, email: session.user.email } : 'No hay sesión');
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('👤 Usuario encontrado en sesión, buscando perfil...');
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      }
      
      setLoading(false)
    }

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Cambio de autenticación:', { event, session: session ? { user: session.user.id, email: session.user.email } : 'No session' });
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Usuario en cambio de auth, buscando perfil...');
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
        } else {
          console.log('🚪 Usuario deslogueado, limpiando perfil...');
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: { 
    nombre: string, 
    tipo: 'vendedor' | 'comprador',
    telefono?: string,
    direccion?: string 
  }) => {
    console.log('🚀 Iniciando registro...', { email, userData })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('📧 Resultado auth.signUp:', { data, error })

    // Si el registro es exitoso, crear el perfil
    if (data.user && !error) {
      console.log('✅ Usuario creado en auth, creando perfil...', data.user.id)
      
      const profileData = {
        id: data.user.id,
        email: data.user.email,
        nombre: userData.nombre,
        tipo: userData.tipo,
        telefono: userData.telefono || null,
        direccion: userData.direccion || null,
      }
      
      console.log('📝 Datos del perfil a insertar:', profileData)
      
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert(profileData)

      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
        return { data, error: profileError }
      } else {
        console.log('✅ Perfil creado exitosamente')
      }
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Iniciando signIn...', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('📧 Resultado auth.signInWithPassword:', { data, error });
    
    if (data.user && !error) {
      console.log('✅ Usuario autenticado, buscando perfil...', data.user.id);
      
      // Intentar obtener el perfil inmediatamente después del login
      const userProfile = await fetchUserProfile(data.user.id);
      if (userProfile) {
        console.log('👤 Perfil obtenido en signIn:', userProfile);
        setProfile(userProfile);
      }
    }
    
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setProfile(null)
    }
    return { error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }

    return { data, error }
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchUserProfile,
  }
}