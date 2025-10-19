import React, { useState, useEffect, useRef } from 'react';
import { aiAssistant } from '../services/aiAssistant';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
}

interface AIFloatingChatProps {
  className?: string;
}

const AIFloatingChat: React.FC<AIFloatingChatProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [remainingQuestions, setRemainingQuestions] = useState(5);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Obtener IP del usuario (para rate limiting)
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  // Obtener preguntas restantes del usuario
  const updateRemainingQuestions = async () => {
    try {
      const userIP = await getUserIP();
      const userIdentifier = user?.id || userIP;
      
      // Obtener configuración actual
      const config = await aiAssistant.getAISettings();
      const dailyLimit = config.rate_limit_per_day;
      
      // Obtener uso actual del día
      const { data } = await supabase
        .from('ai_usage_tracking')
        .select('id')
        .eq(user?.id ? 'user_id' : 'user_ip', userIdentifier)
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
      
      const usedToday = data?.length || 0;
      const remaining = Math.max(0, dailyLimit - usedToday);
      setRemainingQuestions(remaining);
    } catch (error) {
      console.error('Error getting remaining questions:', error);
      // Valor por defecto conservador
      setRemainingQuestions(5);
    }
  };

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensaje de bienvenida al abrir y actualizar contador
  useEffect(() => {
    if (isOpen) {
      updateRemainingQuestions();
      
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          content: aiAssistant.getWelcomeMessage(),
          isUser: false,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen, messages.length]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addMessage = (content: string, isUser: boolean, isError: boolean = false): Message => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      isUser,
      timestamp: new Date(),
      isError
    };
    
    setMessages(prev => [...prev, message]);
    return message;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isEnabled) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setRateLimitMessage(null);

    // Agregar mensaje del usuario
    addMessage(userMessage, true);

    try {
      const userIP = await getUserIP();
      const { response } = await aiAssistant.askQuestion(userMessage, userIP);
      
      // Agregar respuesta de la IA
      addMessage(response, false);
      
      // Actualizar contador real desde la base de datos
      await updateRemainingQuestions();
      
    } catch (error: any) {
      console.error('Error en chat AI:', error);
      
      let errorMessage = 'Lo siento, hubo un problema al procesar tu pregunta. Inténtalo nuevamente.';
      
      if (error.message.includes('límite')) {
        errorMessage = error.message;
        setRateLimitMessage(error.message);
      } else if (error.message.includes('no disponible')) {
        errorMessage = '🚧 El asistente virtual está temporalmente deshabilitado. Intenta más tarde.';
        setIsEnabled(false);
      }
      
      addMessage(errorMessage, false, true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Convertir enlaces en texto clickeable
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(linkRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Botón flotante */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center gap-2"
            aria-label="Abrir asistente virtual"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="hidden group-hover:block absolute right-full mr-3 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
              💬 ¿Necesitas ayuda?
            </span>
            
            {/* Indicador de notificación */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </button>
        )}

        {/* Ventana de chat */}
        {isOpen && (
          <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Asistente Virtual</h3>
                  <p className="text-xs text-purple-100">
                    {isEnabled ? `${remainingQuestions} preguntas restantes` : 'No disponible'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.isUser
                        ? 'bg-purple-600 text-white'
                        : message.isError
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    <div className={`text-xs mt-1 ${
                      message.isUser ? 'text-purple-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Indicador de escritura */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-[80%]">
                    <div className="flex items-center gap-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Rate limit warning */}
            {rateLimitMessage && (
              <div className="p-2 bg-yellow-50 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="text-xs">{rateLimitMessage}</span>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {isEnabled ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isLoading || !isEnabled}
                    maxLength={500}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || !isEnabled}
                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Asistente virtual no disponible</p>
                </div>
              )}
              
              {/* Contador de caracteres */}
              {inputMessage && (
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {inputMessage.length}/500
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🤖 Asistente virtual de Charlitron Eventos 360
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AIFloatingChat;