import { toast } from 'sonner';

export interface ExportOptions {
  filename: string;
  data: any[];
  format: 'csv' | 'json';
  headers?: { [key: string]: string };
  maxRecords?: number;
}

export class LogExporter {
  private static readonly MAX_RECORDS = 10000;

  /**
   * Exporta dados para CSV
   */
  private static exportToCSV(data: any[], headers: { [key: string]: string }, filename: string): void {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    // Criar cabeçalhos CSV
    const csvHeaders = Object.keys(headers).map(key => headers[key]).join(',');
    
    // Converter dados para CSV
    const csvRows = data.map(item => {
      return Object.keys(headers).map(key => {
        let value = item[key];
        
        // Tratar valores especiais
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        } else if (typeof value === 'string') {
          // Escapar aspas duplas e quebras de linha
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
        }
        
        return value;
      }).join(',');
    });

    // Combinar cabeçalhos e dados
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Fazer download
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporta dados para JSON
   */
  private static exportToJSON(data: any[], filename: string): void {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const jsonContent = JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      data: data
    }, null, 2);
    
    this.downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Faz o download do arquivo
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  /**
   * Gera nome do arquivo com timestamp
   */
  private static generateFilename(baseFilename: string, format: 'csv' | 'json'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${baseFilename}_${timestamp}.${format}`;
  }

  /**
   * Método principal para exportar logs
   */
  public static async exportLogs(options: ExportOptions): Promise<void> {
    const { data, format, headers, maxRecords = this.MAX_RECORDS } = options;
    
    try {
      // Validar dados
      if (!data || data.length === 0) {
        toast.error('Nenhum dado disponível para exportação');
        return;
      }

      // Limitar número de registros
      const limitedData = data.slice(0, maxRecords);
      
      if (data.length > maxRecords) {
        toast.warning(`Exportação limitada a ${maxRecords} registros mais recentes`);
      }

      // Gerar nome do arquivo
      const filename = this.generateFilename(options.filename, format);

      // Mostrar indicador de progresso
      toast.loading('Preparando exportação...', { id: 'export-progress' });

      // Simular pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));

      // Exportar baseado no formato
      if (format === 'csv' && headers) {
        this.exportToCSV(limitedData, headers, filename);
      } else if (format === 'json') {
        this.exportToJSON(limitedData, filename);
      } else {
        throw new Error('Formato de exportação inválido');
      }

      // Sucesso
      toast.success(`Arquivo ${filename} exportado com sucesso!`, { id: 'export-progress' });
      
    } catch (error) {
      console.error('Erro durante exportação:', error);
      toast.error('Erro ao exportar dados. Tente novamente.', { id: 'export-progress' });
    }
  }

  /**
   * Headers padrão para logs do sistema
   */
  public static readonly SYSTEM_LOG_HEADERS = {
    id: 'ID',
    type: 'Tipo',
    message: 'Mensagem',
    details: 'Detalhes',
    created_at: 'Data/Hora'
  };

  /**
   * Headers padrão para logs da aplicação
   */
  public static readonly APP_LOG_HEADERS = {
    id: 'ID',
    level: 'Nível',
    source: 'Fonte',
    action: 'Ação',
    details: 'Detalhes',
    user_id: 'ID do Usuário',
    created_at: 'Data/Hora'
  };

  /**
   * Headers padrão para logs do backend
   */
  public static readonly BACKEND_LOG_HEADERS = {
    id: 'ID',
    table_name: 'Tabela',
    action: 'Ação',
    record_id: 'ID do Registro',
    old_data: 'Dados Antigos',
    new_data: 'Dados Novos',
    performed_by: 'Executado Por',
    created_at: 'Data/Hora'
  };
}