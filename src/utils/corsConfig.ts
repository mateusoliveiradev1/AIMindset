// CORS Configuration and HTTPS Enforcement
export class CORSConfig {
  private static readonly ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://aimindset.vercel.app',
    'https://aimindset.netlify.app'
  ];

  private static readonly ALLOWED_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS'
  ];

  private static readonly ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin'
  ];

  // Check if origin is allowed
  static isOriginAllowed(origin: string): boolean {
    return this.ALLOWED_ORIGINS.includes(origin) || 
           origin === window.location.origin;
  }

  // Get CORS headers for requests
  static getCORSHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': this.ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': this.ALLOWED_HEADERS.join(', '),
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Allow-Credentials': 'true'
    };

    if (origin && this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
  }

  // Validate request origin
  static validateRequest(request: Request): boolean {
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    // Allow same-origin requests
    if (!origin && !referer) {
      return true;
    }

    // Check origin
    if (origin && !this.isOriginAllowed(origin)) {
      console.warn('CORS: Origin not allowed:', origin);
      return false;
    }

    // Check referer
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        if (!this.isOriginAllowed(refererOrigin)) {
          console.warn('CORS: Referer not allowed:', refererOrigin);
          return false;
        }
      } catch (error) {
        console.warn('CORS: Invalid referer:', referer);
        return false;
      }
    }

    return true;
  }
}

// HTTPS Enforcement
export class HTTPSEnforcement {
  // Check if the current connection is secure
  static isSecureConnection(): boolean {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  // Enforce HTTPS in production
  static enforceHTTPS(): void {
    if (!this.isSecureConnection() && window.location.hostname !== 'localhost') {
      const httpsUrl = window.location.href.replace('http://', 'https://');
      console.warn('Redirecting to HTTPS:', httpsUrl);
      window.location.replace(httpsUrl);
    }
  }

  // Set HTTPS-related headers
  static getHTTPSHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  // Check for mixed content
  static checkMixedContent(): void {
    if (this.isSecureConnection()) {
      // Monitor for mixed content warnings
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for insecure resources
              const insecureElements = element.querySelectorAll(
                'img[src^="http:"], script[src^="http:"], link[href^="http:"], iframe[src^="http:"]'
              );
              
              insecureElements.forEach((insecureElement) => {
                console.warn('Mixed content detected:', insecureElement);
                
                // Attempt to upgrade to HTTPS
                const src = insecureElement.getAttribute('src');
                const href = insecureElement.getAttribute('href');
                
                if (src && src.startsWith('http://')) {
                  insecureElement.setAttribute('src', src.replace('http://', 'https://'));
                }
                
                if (href && href.startsWith('http://')) {
                  insecureElement.setAttribute('href', href.replace('http://', 'https://'));
                }
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize HTTPS enforcement
  static initialize(): void {
    this.enforceHTTPS();
    this.checkMixedContent();
    
    // Add security headers to all outgoing requests
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch;
      
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const headers = new Headers(init?.headers);
        
        // Add security headers
        const securityHeaders = HTTPSEnforcement.getHTTPSHeaders();
        Object.entries(securityHeaders).forEach(([key, value]) => {
          if (!headers.has(key)) {
            headers.set(key, value);
          }
        });

        // Add CORS headers if needed
        const origin = window.location.origin;
        const corsHeaders = CORSConfig.getCORSHeaders(origin);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          if (!headers.has(key)) {
            headers.set(key, value);
          }
        });

        return originalFetch(input, {
          ...init,
          headers
        });
      };
    }
  }
}

// Content Security Policy Management
export class CSPManager {
  private static violations: Array<{
    directive: string;
    blockedURI: string;
    timestamp: number;
  }> = [];

  // Initialize CSP violation reporting
  static initializeViolationReporting(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        const violation = {
          directive: event.violatedDirective,
          blockedURI: event.blockedURI,
          timestamp: Date.now()
        };

        this.violations.push(violation);
        
        // Keep only last 100 violations
        if (this.violations.length > 100) {
          this.violations = this.violations.slice(-100);
        }

        console.warn('CSP Violation:', violation);
        
        // Report critical violations
        if (this.isCriticalViolation(violation)) {
          this.reportCriticalViolation(violation);
        }
      });
    }
  }

  // Check if violation is critical
  private static isCriticalViolation(violation: { directive: string; blockedURI: string }): boolean {
    const criticalDirectives = ['script-src', 'object-src', 'base-uri'];
    return criticalDirectives.some(directive => violation.directive.includes(directive));
  }

  // Report critical violations
  private static reportCriticalViolation(violation: { directive: string; blockedURI: string; timestamp: number }): void {
    // In a real application, you would send this to your security monitoring service
    console.error('CRITICAL CSP VIOLATION:', violation);
    
    // Could implement additional security measures here
    // such as temporarily blocking certain functionality
  }

  // Get violation statistics
  static getViolationStats(): {
    total: number;
    recent: number;
    byDirective: Record<string, number>;
  } {
    const now = Date.now();
    const recentThreshold = now - (5 * 60 * 1000); // Last 5 minutes
    
    const recent = this.violations.filter(v => v.timestamp > recentThreshold);
    const byDirective: Record<string, number> = {};
    
    this.violations.forEach(violation => {
      byDirective[violation.directive] = (byDirective[violation.directive] || 0) + 1;
    });

    return {
      total: this.violations.length,
      recent: recent.length,
      byDirective
    };
  }

  // Initialize CSP management
  static initialize(): void {
    this.initializeViolationReporting();
  }
}

// Initialize all security configurations
export function initializeSecurityConfig(): void {
  HTTPSEnforcement.initialize();
  CSPManager.initialize();
}