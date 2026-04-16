import { useState, useEffect } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  defaultUserType?: 'vendedor' | 'comprador'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login', defaultUserType }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Sincronizar el modo interno con el initialMode cuando cambie
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '800px', maxWidth: '95vw', minHeight: '300px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Contenido scrolleable del modal */}
        <div className="flex-1 overflow-y-auto p-8">
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setMode('register')}
              onClose={onClose}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode('login')}
              onClose={onClose}
              defaultUserType={defaultUserType}
            />
          )}
        </div>
      </div>
    </div>
  )
}