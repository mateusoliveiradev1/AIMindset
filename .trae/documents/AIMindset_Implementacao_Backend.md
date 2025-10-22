# AIMindset - Guia de Implementação Backend

## 1. Configuração Inicial do Supabase

### 1.1 Instalação das Dependências

```bash
npm install @supabase/supabase-js
npm install -D @types/uuid
```

### 1.2 Configuração do Cliente Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          metadata: any
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          metadata?: any
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          metadata?: any
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          featured_image: string | null
          category_id: string | null
          author_id: string | null
          published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
          seo_data: any
        }
        Insert: {
          title: string
          slug: string
          content: string
          excerpt?: string | null
          featured_image?: string | null
          category_id?: string | null
          author_id?: string | null
          published?: boolean
          published_at?: string | null
          seo_data?: any
        }
        Update: {
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          featured_image?: string | null
          category_id?: string | null
          published?: boolean
          published_at?: string | null
          seo_data?: any
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          color?: string
          icon?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          color?: string
          icon?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          name: string | null
          active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
          preferences: any
        }
        Insert: {
          email: string
          name?: string | null
          preferences?: any
        }
        Update: {
          name?: string | null
          active?: boolean
          preferences?: any
        }
      }
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: string
          created_at: string
          responded_at: string | null
        }
        Insert: {
          name: string
          email: string
          subject: string
          message: string
        }
        Update: {
          status?: string
          responded_at?: string | null
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          permissions: any
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          role?: string
          permissions?: any
        }
        Update: {
          role?: string
          permissions?: any
        }
      }
    }
  }
}
```

## 2. Hooks Personalizados

### 2.1 Hook de Autenticação

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}
```

### 2.2 Hook para Artigos

```typescript
// src/hooks/useArticles.ts
import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'

type Article = Database['public']['Tables']['articles']['Row']
type ArticleInsert = Database['public']['Tables']['articles']['Insert']
type ArticleUpdate = Database['public']['Tables']['articles']['Update']

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async (published?: boolean) => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          color
        ),
        users (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (published !== undefined) {
      query = query.eq('published', published)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setArticles(data || [])
    }

    setLoading(false)
  }

  const getArticleBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          color
        ),
        users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .single()

    return { data, error }
  }

  const createArticle = async (article: ArticleInsert) => {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single()

    if (!error) {
      await fetchArticles()
    }

    return { data, error }
  }

  const updateArticle = async (id: string, updates: ArticleUpdate) => {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      await fetchArticles()
    }

    return { data, error }
  }

  const deleteArticle = async (id: string) => {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchArticles()
    }

    return { error }
  }

  const uploadImage = async (file: File, bucket: string = 'articles') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${bucket}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) {
      return { data: null, error }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { data: { path: filePath, url: publicUrl }, error: null }
  }

  return {
    articles,
    loading,
    error,
    fetchArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    uploadImage
  }
}
```

### 2.3 Hook para Categorias

```typescript
// src/hooks/useCategories.ts
import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      setError(error.message)
    } else {
      setCategories(data || [])
    }

    setLoading(false)
  }

  const createCategory = async (category: CategoryInsert) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (!error) {
      await fetchCategories()
    }

    return { data, error }
  }

  const updateCategory = async (id: string, updates: CategoryUpdate) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      await fetchCategories()
    }

    return { data, error }
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchCategories()
    }

    return { error }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
}
```

### 2.4 Hook para Newsletter

```typescript
// src/hooks/useNewsletter.ts
import { useState } from 'react'
import { supabase, Database } from '../lib/supabase'

type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']

export function useNewsletter() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribe = async (email: string, name?: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, name })
      .select()
      .single()

    if (error) {
      setError(error.message)
    }

    setLoading(false)
    return { data, error }
  }

  const unsubscribe = async (email: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ 
        active: false, 
        unsubscribed_at: new Date().toISOString() 
      })
      .eq('email', email)
      .select()
      .single()

    if (error) {
      setError(error.message)
    }

    setLoading(false)
    return { data, error }
  }

  const getSubscribers = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('active', true)
      .order('subscribed_at', { ascending: false })

    if (error) {
      setError(error.message)
    }

    setLoading(false)
    return { data, error }
  }

  return {
    loading,
    error,
    subscribe,
    unsubscribe,
    getSubscribers
  }
}
```

### 2.5 Hook para Contatos

```typescript
// src/hooks/useContacts.ts
import { useState } from 'react'
import { supabase, Database } from '../lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']

export function useContacts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendContact = async (contact: ContactInsert) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()

    if (error) {
      setError(error.message)
    }

    setLoading(false)
    return { data, error }
  }

  const getContacts = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    }

    setLoading(false)
    return { data, error }
  }

  const updateContactStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('contacts')
      .update({ 
        status,
        responded_at: status === 'responded' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  return {
    loading,
    error,
    sendContact,
    getContacts,
    updateContactStatus
  }
}
```

## 3. Contexto de Autenticação Atualizado

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdminStatus(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          checkAdminStatus(session.user.id)
        } else {
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .single()

    setIsAdmin(!!data)
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword
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
```

## 4. Utilitários e Helpers

### 4.1 Gerador de Slugs

```typescript
// src/utils/slug.ts
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
}
```

### 4.2 Validadores

```typescript
// src/utils/validators.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9-]+$/
  return slugRegex.test(slug)
}
```

### 4.3 Formatadores

```typescript
// src/utils/formatters.ts
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('pt-BR')
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
```

## 5. Configuração de Ambiente

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Para Edge Functions (se necessário)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 6. Scripts de Deploy

### 6.1 Deploy das Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy send-newsletter
supabase functions deploy handle-contact
```

### 6.2 Configuração de Secrets

```bash
# Set environment variables for Edge Functions
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set ADMIN_EMAIL=admin@aimindset.com
```

## 7. Testes

### 7.1 Teste de Conexão

```typescript
// src/utils/testConnection.ts
import { supabase } from '../lib/supabase'

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count(*)')
      .single()

    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }

    console.log('Supabase connected successfully')
    return true
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}
```

## 8. Próximos Passos

1. **Executar os scripts SQL** no Supabase Dashboard
2. **Configurar as variáveis de ambiente**
3. **Implementar os hooks nos componentes existentes**
4. **Testar todas as funcionalidades**
5. **Configurar Edge Functions** (opcional)
6. **Implementar sistema de backup**
7. **Configurar monitoramento**

## 9. Troubleshooting

### Problemas Comuns:

1. **RLS Policies**: Verificar se as políticas estão corretas
2. **CORS**: Configurar domínios permitidos no Supabase
3. **Rate Limiting**: Verificar limites de requisições
4. **Storage**: Configurar buckets e políticas de acesso
5. **Edge Functions**: Verificar logs e variáveis de ambiente