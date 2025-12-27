import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';

interface AIStatusContextType {
  isAIEnabled: boolean;
  setIsAIEnabled: (enabled: boolean) => void;
  refreshAIStatus: () => Promise<void>;
}

const AIStatusContext = createContext<AIStatusContextType | undefined>(undefined);

interface AIStatusProviderProps {
  children: ReactNode;
}

export const AIStatusProvider: React.FC<AIStatusProviderProps> = ({ children }) => {
  const [isAIEnabled, setIsAIEnabled] = useState(true);

  // Función para obtener el estado actual de la IA desde la BD
  const refreshAIStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('is_enabled')
        .limit(1)
        .single();

      if (!error && data) {
        setIsAIEnabled(data.is_enabled);
      }
    } catch (error) {
      console.error('Error refreshing AI status:', error);
    }
  };

  // Cargar estado inicial al montar
  useEffect(() => {
    refreshAIStatus();
  }, []);

  // Escuchar cambios en tiempo real usando Supabase Realtime
  useEffect(() => {
    const subscription = supabase
      .channel('ai_settings_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'ai_settings' 
        }, 
        (payload) => {
          if (payload.new && typeof payload.new.is_enabled === 'boolean') {
            setIsAIEnabled(payload.new.is_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AIStatusContextType = {
    isAIEnabled,
    setIsAIEnabled,
    refreshAIStatus
  };

  return (
    <AIStatusContext.Provider value={value}>
      {children}
    </AIStatusContext.Provider>
  );
};

export const useAIStatus = (): AIStatusContextType => {
  const context = useContext(AIStatusContext);
  if (!context) {
    throw new Error('useAIStatus must be used within an AIStatusProvider');
  }
  return context;
};