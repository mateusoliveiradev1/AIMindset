// Supressor de Erros COMPLETAMENTE DESABILITADO
// Para eliminar qualquer possível fonte de spam no console

class ErrorSuppressor {
  private suppressedCount = 0;

  constructor() {
    // DESABILITADO: Não intercepta mais nenhum erro
    console.log('[ErrorSuppressor] Sistema de supressão DESABILITADO temporariamente');
  }

  // Método público para verificar status (mantido para compatibilidade)
  public getStats() {
    return {
      suppressedCount: this.suppressedCount,
      isActive: false
    };
  }

  // Método para reativar (se necessário no futuro)
  public enable() {
    console.log('[ErrorSuppressor] Sistema permanece DESABILITADO');
  }

  // Método para desativar (já desabilitado)
  public disable() {
    console.log('[ErrorSuppressor] Sistema já está DESABILITADO');
  }
}

// Instância global DESABILITADA
const errorSuppressor = new ErrorSuppressor();

export default errorSuppressor;