import { supabase } from '@/lib/supabase';

// Configurações de otimização para queries Supabase
export interface QueryOptimizationOptions {
  select?: string[]; // Campos específicos a selecionar
  range?: [number, number]; // [from, to] para paginação
  limit?: number; // Limite de resultados
  orderBy?: { column: string; ascending?: boolean };
  filters?: Array<{ column: string; operator: string; value: any }>;
  usePartitionRoot?: boolean; // publish_via_partition_root = false
}

// Cache para queries frequentes
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Otimizador de queries Supabase com range() e select específicos
 */
export class SupabaseQueryOptimizer {
  private static instance: SupabaseQueryOptimizer;
  
  private constructor() {}
  
  static getInstance(): SupabaseQueryOptimizer {
    if (!SupabaseQueryOptimizer.instance) {
      SupabaseQueryOptimizer.instance = new SupabaseQueryOptimizer();
    }
    return SupabaseQueryOptimizer.instance;
  }

  /**
   * Executar query otimizada com cache e controle de carga
   */
  async optimizedQuery<T = any>(
    table: string,
    options: QueryOptimizationOptions = {}
  ): Promise<{ data: T[] | null; error: any; queryTime: number; fromCache: boolean }> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(table, options);
    
    // Verificar cache
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        data: cached.data,
        error: null,
        queryTime: performance.now() - startTime,
        fromCache: true
      };
    }

    try {
      let query = supabase.from(table);
      
      // Aplicar select específico
      if (options.select && options.select.length > 0) {
        query = query.select(options.select.join(','));
      } else {
        query = query.select('*');
      }

      // Aplicar publish_via_partition_root = false para controle de carga
      if (options.usePartitionRoot !== false) {
        query = query as any; // publish_via_partition_root já é padrão false
      }

      // Aplicar filtros
      if (options.filters) {
        for (const filter of options.filters) {
          switch (filter.operator) {
            case 'eq':
              query = query.eq(filter.column, filter.value);
              break;
            case 'gt':
              query = query.gt(filter.column, filter.value);
              break;
            case 'gte':
              query = query.gte(filter.column, filter.value);
              break;
            case 'lt':
              query = query.lt(filter.column, filter.value);
              break;
            case 'lte':
              query = query.lte(filter.column, filter.value);
              break;
            case 'like':
              query = query.like(filter.column, filter.value);
              break;
            case 'ilike':
              query = query.ilike(filter.column, filter.value);
              break;
            case 'in':
              query = query.in(filter.column, filter.value);
              break;
          }
        }
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }

      // Aplicar range para paginação eficiente
      if (options.range) {
        query = query.range(options.range[0], options.range[1]);
      } else if (options.limit) {
        // Fallback para limit se range não for especificado
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      const queryTime = performance.now() - startTime;

      // Cachear resultado
      if (data && !error) {
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        });
      }

      // Log de performance
      this.logQueryPerformance(table, options, queryTime, !!error);

      return { data, error, queryTime, fromCache: false };
    } catch (error) {
      const queryTime = performance.now() - startTime;
      this.logQueryPerformance(table, options, queryTime, true);
      return { data: null, error, queryTime, fromCache: false };
    }
  }

  /**
   * Query otimizada para artigos com campos específicos
   */
  async getOptimizedArticles(
    limit: number = 10,
    offset: number = 0,
    categoryId?: string,
    orderBy: string = 'created_at'
  ) {
    const options: QueryOptimizationOptions = {
      select: [
        'id',
        'title',
        'slug',
        'excerpt',
        'image_url',
        'created_at',
        'updated_at',
        'published',
        'category_id',
        'author_id',
        'likes_count',
        'total_views'
      ],
      range: [offset, offset + limit - 1],
      orderBy: { column: orderBy, ascending: false },
      filters: [
        { column: 'published', operator: 'eq', value: true }
      ],
      usePartitionRoot: false
    };

    if (categoryId) {
      options.filters!.push({ column: 'category_id', operator: 'eq', value: categoryId });
    }

    return this.optimizedQuery('articles', options);
  }

  /**
   * Query otimizada para artigos em destaque (Hero Section)
   */
  async getFeaturedArticles(limit: number = 6) {
    const options: QueryOptimizationOptions = {
      select: [
        'id',
        'title',
        'slug',
        'excerpt',
        'image_url',
        'created_at',
        'category_id',
        'likes_count',
        'total_views'
      ],
      limit,
      orderBy: { column: 'created_at', ascending: false },
      filters: [
        { column: 'published', operator: 'eq', value: true },
        { column: 'image_url', operator: 'neq', value: null }
      ],
      usePartitionRoot: false
    };

    return this.optimizedQuery('articles', options);
  }

  /**
   * Query otimizada para logs com range temporal
   */
  async getOptimizedLogs(
    table: 'system_logs' | 'app_logs' | 'backend_logs',
    hours: number = 24,
    limit: number = 100
  ) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const options: QueryOptimizationOptions = {
      select: ['id', 'level', 'message', 'created_at', 'metadata'],
      limit,
      orderBy: { column: 'created_at', ascending: false },
      filters: [
        { column: 'created_at', operator: 'gte', value: cutoffDate.toISOString() }
      ],
      usePartitionRoot: false
    };

    return this.optimizedQuery(table, options);
  }

  /**
   * Query otimizada para feedback com paginação
   */
  async getOptimizedFeedback(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ) {
    const options: QueryOptimizationOptions = {
      select: [
        'id',
        'name',
        'email',
        'message',
        'type',
        'status',
        'created_at',
        'updated_at'
      ],
      range: [offset, offset + limit - 1],
      orderBy: { column: 'created_at', ascending: false },
      usePartitionRoot: false
    };

    if (status) {
      options.filters = [{ column: 'status', operator: 'eq', value: status }];
    }

    return this.optimizedQuery('feedback', options);
  }

  /**
   * Query otimizada para contagem rápida (sem dados)
   */
  async getCount(
    table: string,
    filters?: QueryOptimizationOptions['filters']
  ): Promise<{ count: number; error: any }> {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.column, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.column, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.column, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.column, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.column, filter.value);
            break;
        }
      }
    }

    const { count, error } = await query;
    return { count: count || 0, error };
  }

  /**
   * Limpar cache de queries
   */
  clearCache(): void {
    queryCache.clear();
  }

  /**
   * Limpar cache específico por padrão
   */
  clearCacheByPattern(pattern: string): void {
    for (const [key] of queryCache) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  }

  /**
   * Gerar chave de cache única
   */
  private generateCacheKey(table: string, options: QueryOptimizationOptions): string {
    const keyParts = [table];
    
    if (options.select) keyParts.push(`select:${options.select.join(',')}`);
    if (options.range) keyParts.push(`range:${options.range.join('-')}`);
    if (options.limit) keyParts.push(`limit:${options.limit}`);
    if (options.orderBy) keyParts.push(`order:${options.orderBy.column}-${options.orderBy.ascending}`);
    if (options.filters) {
      const filterStr = options.filters.map(f => `${f.column}-${f.operator}-${f.value}`).join('|');
      keyParts.push(`filters:${filterStr}`);
    }

    return keyParts.join('|');
  }

  /**
   * Log de performance das queries
   */
  private logQueryPerformance(
    table: string,
    options: QueryOptimizationOptions,
    queryTime: number,
    hasError: boolean
  ): void {
    const logData = {
      table,
      selectFields: options.select?.length || 0,
      hasRange: !!options.range,
      hasFilters: !!options.filters,
      queryTime: Math.round(queryTime),
      hasError,
      timestamp: new Date().toISOString()
    };

    // Log para system_logs se for lenta ou tiver erro
    if (queryTime > 2000 || hasError) {
      console.warn(`⚠️ [Supabase Slow Query] ${table}: ${queryTime}ms`, logData);
    }

    // Log normal para análise
    console.log(`📊 [Supabase Query] ${table}: ${queryTime}ms`, {
      fields: logData.selectFields,
      cached: false,
      error: hasError
    });
  }
}

// Exportar singleton
export const supabaseOptimizer = SupabaseQueryOptimizer.getInstance();

// Funções helper para uso rápido
export const getOptimizedArticles = (limit = 10, offset = 0, categoryId?: string) =>
  supabaseOptimizer.getOptimizedArticles(limit, offset, categoryId);

export const getFeaturedArticles = (limit = 6) =>
  supabaseOptimizer.getFeaturedArticles(limit);

export const getOptimizedLogs = (table: any, hours = 24, limit = 100) =>
  supabaseOptimizer.getOptimizedLogs(table, hours, limit);

export const getOptimizedFeedback = (limit = 50, offset = 0, status?: string) =>
  supabaseOptimizer.getOptimizedFeedback(limit, offset, status);

export const getCount = (table: string, filters?: any) =>
  supabaseOptimizer.getCount(table, filters);