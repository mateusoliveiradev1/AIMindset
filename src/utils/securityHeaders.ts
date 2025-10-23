// Security Headers and XSS Protection Utilities
export class SecurityHeaders {
  // Content Security Policy configuration for meta tags
  // Note: Some CSP directives like 'frame-ancestors' can only be set via HTTP headers
  static getCSPHeaderForMetaTags(): string {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Note: 'frame-ancestors' removed - only works via HTTP header
      "upgrade-insecure-requests"
    ];
    
    return cspDirectives.join('; ');
  }

  // Set security headers for the application via meta tags
  // Note: Some headers like X-Frame-Options can only be set via HTTP headers
  static setSecurityHeaders(): void {
    if (typeof document !== 'undefined') {
      // Create meta tags for security headers that support meta tag delivery
      const headers = [
        {
          name: 'Content-Security-Policy',
          content: this.getCSPHeaderForMetaTags()
        },
        {
          name: 'X-Content-Type-Options',
          content: 'nosniff'
        },
        // Note: X-Frame-Options removed - only works via HTTP header
        {
          name: 'X-XSS-Protection',
          content: '1; mode=block'
        },
        {
          name: 'Referrer-Policy',
          content: 'strict-origin-when-cross-origin'
        },
        {
          name: 'Permissions-Policy',
          content: 'camera=(), microphone=(), geolocation=(), payment=()'
        }
      ];

      headers.forEach(header => {
        let metaTag = document.querySelector(`meta[http-equiv="${header.name}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('http-equiv', header.name);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', header.content);
      });
    }
  }

  // XSS Protection utilities
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\//g, "&#x2F;");
  }

  // Sanitize URLs to prevent javascript: and data: schemes
  static sanitizeUrl(url: string): string {
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    try {
      const urlObj = new URL(url);
      if (allowedProtocols.includes(urlObj.protocol)) {
        return url;
      }
    } catch {
      // Invalid URL
    }
    return '#';
  }

  // Remove potentially dangerous attributes from HTML
  static sanitizeAttributes(element: HTMLElement): void {
    const dangerousAttributes = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
      'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur',
      'onchange', 'onsubmit', 'onreset', 'onselect', 'onresize',
      'onscroll', 'ondrag', 'ondrop', 'oncut', 'oncopy', 'onpaste'
    ];

    dangerousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });

    // Sanitize href and src attributes
    if (element.hasAttribute('href')) {
      const href = element.getAttribute('href');
      if (href) {
        element.setAttribute('href', this.sanitizeUrl(href));
      }
    }

    if (element.hasAttribute('src')) {
      const src = element.getAttribute('src');
      if (src) {
        element.setAttribute('src', this.sanitizeUrl(src));
      }
    }
  }

  // Validate and sanitize HTML content
  static sanitizeHtmlContent(html: string): string {
    if (typeof DOMParser === 'undefined') {
      return this.escapeHtml(html);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove script tags
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove dangerous elements
    const dangerousElements = ['iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'];
    dangerousElements.forEach(tagName => {
      const elements = doc.querySelectorAll(tagName);
      elements.forEach(element => element.remove());
    });

    // Sanitize attributes on remaining elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(element => {
      if (element instanceof HTMLElement) {
        this.sanitizeAttributes(element);
      }
    });

    return doc.body.innerHTML;
  }

  // Prevent clickjacking
  static preventClickjacking(): void {
    if (typeof window !== 'undefined' && window.top !== window.self) {
      // If the page is in a frame, redirect to break out
      window.top!.location.href = window.self.location.href;
    }
  }

  // Initialize all security measures
  static initialize(): void {
    this.setSecurityHeaders();
    this.preventClickjacking();
    
    // Add security event listeners
    if (typeof document !== 'undefined') {
      // Prevent drag and drop of external content
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      
      document.addEventListener('drop', (e) => {
        e.preventDefault();
      });

      // Monitor for suspicious activity
      let suspiciousActivityCount = 0;
      const maxSuspiciousActivity = 10;

      document.addEventListener('error', (e) => {
        suspiciousActivityCount++;
        if (suspiciousActivityCount > maxSuspiciousActivity) {
          console.warn('Suspicious activity detected. Security measures activated.');
          // Could implement additional security measures here
        }
      });
    }
  }
}

// Rate limiting for client-side operations
export class ClientRateLimit {
  private static instances: Map<string, ClientRateLimit> = new Map();
  private attempts: number[] = [];
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  static getInstance(key: string, maxAttempts?: number, windowMs?: number): ClientRateLimit {
    if (!this.instances.has(key)) {
      this.instances.set(key, new ClientRateLimit(maxAttempts, windowMs));
    }
    return this.instances.get(key)!;
  }

  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old attempts outside the window
    this.attempts = this.attempts.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if we're under the limit
    if (this.attempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record this attempt
    this.attempts.push(now);
    return true;
  }

  getRemainingAttempts(): number {
    const now = Date.now();
    this.attempts = this.attempts.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxAttempts - this.attempts.length);
  }

  getResetTime(): number {
    if (this.attempts.length === 0) return 0;
    const oldestAttempt = Math.min(...this.attempts);
    return oldestAttempt + this.windowMs;
  }
}

// Secure storage utilities
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'aimindset_secure_key';

  // Simple encryption for client-side storage (not cryptographically secure)
  private static simpleEncrypt(text: string): string {
    return btoa(encodeURIComponent(text));
  }

  private static simpleDecrypt(encrypted: string): string {
    try {
      return decodeURIComponent(atob(encrypted));
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: string, encrypt: boolean = true): void {
    try {
      const finalValue = encrypt ? this.simpleEncrypt(value) : value;
      localStorage.setItem(key, finalValue);
    } catch (error) {
      console.warn('Failed to store item securely:', error);
    }
  }

  static getItem(key: string, encrypted: boolean = true): string | null {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      return encrypted ? this.simpleDecrypt(value) : value;
    } catch (error) {
      console.warn('Failed to retrieve item securely:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}

// Input validation and sanitization
export class InputValidator {
  // Validate email format with additional security checks
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Basic format check
    if (!emailRegex.test(email)) return false;
    
    // Length check
    if (email.length < 5 || email.length > 254) return false;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /on\w+=/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }

  // Validate name with security considerations
  static isValidName(name: string): boolean {
    // Length check
    if (name.length < 2 || name.length > 100) return false;
    
    // Check for suspicious characters
    const suspiciousChars = /<>\"'&/;
    if (suspiciousChars.test(name)) return false;
    
    // Check for script injection attempts
    const scriptPatterns = [
      /javascript:/i,
      /<script/i,
      /on\w+=/i,
      /expression\(/i
    ];
    
    return !scriptPatterns.some(pattern => pattern.test(name));
  }

  // Validate URL with security checks
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Sanitize text input
  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
}

// Initialize security measures when the module is loaded
if (typeof window !== 'undefined') {
  // Initialize security headers and protections
  SecurityHeaders.initialize();
  
  // Set up global error handling for security
  window.addEventListener('error', (event) => {
    // Log security-related errors
    if (event.error && event.error.message) {
      const message = event.error.message.toLowerCase();
      if (message.includes('script') || message.includes('eval') || message.includes('injection')) {
        console.warn('Potential security threat detected:', event.error.message);
      }
    }
  });
}