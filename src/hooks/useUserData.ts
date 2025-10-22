import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  newsletter_preference: boolean;
}

export interface CookiePreferences {
  id?: string;
  user_email: string;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface PrivacyRequest {
  id?: string;
  user_email: string;
  request_type: 'data_download' | 'data_edit' | 'data_deletion' | 'processing_limitation' | 'privacy_contact';
  status?: 'pending' | 'processing' | 'completed' | 'rejected';
  request_data?: any;
  notes?: string;
}

export const useUserData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Salvar ou atualizar perfil do usuário
  const saveUserProfile = async (profile: UserProfile): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          name: profile.name,
          email: profile.email,
          newsletter_preference: profile.newsletter_preference,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (error) {
        console.error('Erro ao salvar perfil:', error);
        setError('Erro ao salvar dados do perfil');
        return false;
      }

      console.log('Perfil salvo com sucesso:', data);
      return true;
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao salvar perfil');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Salvar preferências de cookies
  const saveCookiePreferences = async (preferences: CookiePreferences): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('cookie_preferences')
        .upsert({
          user_email: preferences.user_email,
          essential: preferences.essential,
          analytics: preferences.analytics,
          marketing: preferences.marketing,
          personalization: preferences.personalization,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_email'
        });

      if (error) {
        console.error('Erro ao salvar preferências de cookies:', error);
        setError('Erro ao salvar preferências de cookies');
        return false;
      }

      console.log('Preferências de cookies salvas com sucesso:', data);
      return true;
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao salvar preferências');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Criar solicitação de privacidade
  const createPrivacyRequest = async (request: PrivacyRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('privacy_requests')
        .insert({
          user_email: request.user_email,
          request_type: request.request_type,
          status: request.status || 'pending',
          request_data: request.request_data,
          notes: request.notes
        });

      if (error) {
        console.error('Erro ao criar solicitação de privacidade:', error);
        setError('Erro ao criar solicitação de privacidade');
        return false;
      }

      console.log('Solicitação de privacidade criada com sucesso:', data);
      return true;
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao criar solicitação');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar perfil do usuário por email
  const getUserProfile = async (email: string): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar perfil:', error);
        setError('Erro ao buscar dados do perfil');
        return null;
      }

      return data || null;
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao buscar perfil');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar preferências de cookies por email
  const getCookiePreferences = async (email: string): Promise<CookiePreferences | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('cookie_preferences')
        .select('*')
        .eq('user_email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar preferências:', error);
        setError('Erro ao buscar preferências de cookies');
        return null;
      }

      return data || null;
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao buscar preferências');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    saveUserProfile,
    saveCookiePreferences,
    createPrivacyRequest,
    getUserProfile,
    getCookiePreferences
  };
};