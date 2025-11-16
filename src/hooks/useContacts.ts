import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Contact } from '../lib/supabase';

export interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  submitContact: (contactData: Omit<Contact, 'id' | 'created_at' | 'status'>) => Promise<boolean>;
  updateContactStatus: (id: string, status: 'new' | 'read' | 'replied') => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
  getContactById: (id: string) => Promise<Contact | null>;
  getContactsByStatus: (status: 'new' | 'read' | 'replied') => Promise<Contact[]>;
  refreshContacts: () => Promise<void>;
}

export const useContacts = (): UseContactsReturn => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false initially
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching contacts:', fetchError);
        setError('Failed to fetch contacts');
        return;
      }

      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    }
  }, []);

  // Only fetch data when explicitly called, not on mount
  const refreshContacts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await fetchContacts();
    } finally {
      setLoading(false);
    }
  }, [fetchContacts]);

  const submitContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'status'>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: insertError } = await supabase
        .from('contacts')
        .insert([{ 
          ...contactData,
          status: 'new'
        }]);

      if (insertError) {
        throw insertError;
      }

      // Tentar enviar notificação por email (ambiente com função /api)
      try {
        const adminEmail = (import.meta as any).env?.VITE_CONTACT_NOTIFY_EMAIL || 'warface01031999@gmail.com';
        const source = typeof window !== 'undefined' && window.location.pathname.includes('faq')
          ? 'faq_inline_form'
          : 'contact_form';

        await fetch('/api/send-alert-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: [adminEmail],
            alertData: {
              type: 'contact_message',
              source,
              message: `${contactData.subject || 'Contato'} de ${contactData.name} <${contactData.email}>`,
              details: {
                name: contactData.name,
                email: contactData.email,
                subject: (contactData as any).subject || 'Contato',
                message: contactData.message
              },
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (emailErr) {
        console.warn('Email de contato não enviado (ambiente local ou função indisponível):', emailErr);
      }

      // Don't refresh contacts here since this is typically called from the public contact form
      // The admin will see new contacts when they refresh their dashboard
      return true;
    } catch (err) {
      console.error('Error submitting contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit contact');
      return false;
    }
  };

  const updateContactStatus = async (id: string, status: 'new' | 'read' | 'replied'): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ status })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error updating contact status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update contact status');
      return false;
    }
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
      return false;
    }
  };

  const getContactById = async (id: string): Promise<Contact | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      console.error('Error fetching contact by ID:', err);
      return null;
    }
  };

  const getContactsByStatus = async (status: 'new' | 'read' | 'replied'): Promise<Contact[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching contacts by status:', err);
      return [];
    }
  };

  return {
    contacts,
    loading,
    error,
    submitContact,
    updateContactStatus,
    deleteContact,
    getContactById,
    getContactsByStatus,
    refreshContacts
  };
};