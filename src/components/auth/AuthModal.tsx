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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 pb-2">
          {/* Header con botón de cerrar */}
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido scrolleable del modal */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
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