import type { VercelRequest, VercelResponse } from '@vercel/node';

// Utilitário simples para validar número
function asNumber(value: any, fallback = 0): number {
  return typeof value === 'number' && isFinite(value) ? value : fallback;
}

// Sanitização básica de URL
function sanitizeUrl(url: any): string {
  try {
    const u = new URL(String(url));
    return u.toString();
  } catch {
    return '';
  }
}

// Obter variáveis de ambiente do GA4
function getGA4Config() {
  const measurementId = process.env.GA4_MEASUREMENT_ID || process.env.VITE_GA4_MEASUREMENT_ID || '';
  const apiSecret = process.env.GA4_API_SECRET || process.env.VITE_GA4_API_SECRET || '';
  return { measurementId, apiSecret };
}

// Gerar client_id simples (UUID)
function getClientId(req: VercelRequest): string {
  const headerCid = (req.headers['x-client-id'] || req.headers['x-cid'] || '') as string;
  if (headerCid && typeof headerCid === 'string') return headerCid;
  // Node 18 tem crypto.randomUUID
  try {
    // @ts-ignore
    return (globalThis.crypto?.randomUUID?.() as string) || `cid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  } catch {
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

async function sendToGA4(payload: any) {
  const { measurementId, apiSecret } = getGA4Config();
  if (!measurementId || !apiSecret) {
    console.warn('[WebVitals] GA4 não configurado (measurement_id/api_secret ausentes). Pulando envio.');
    return { ok: true, skipped: true };
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  // Não bloquear fluxo por falha no GA4
  return { ok: res.ok, status: res.status };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // HEAD usado pelo cliente para detectar existência do endpoint
  if (req.method === 'HEAD') {
    res.setHeader('X-Analytics-Endpoint', 'web_vitals');
    res.setHeader('Cache-Control', 'no-store');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});

    const cls = asNumber(body.cls);
    const inp = asNumber(body.inp);
    const fcp = asNumber(body.fcp);
    const lcp = asNumber(body.lcp);
    const ttfb = asNumber(body.ttfb);
    const timestamp = asNumber(body.timestamp, Date.now());
    const url = sanitizeUrl(body.url);
    const userAgent = typeof body.userAgent === 'string' ? body.userAgent : '';

    // Montar evento GA4 (Measurement Protocol)
    const client_id = getClientId(req);
    const payload = {
      client_id,
      timestamp_micros: Math.round(timestamp * 1000),
      user_properties: {
        app_env: { value: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown' }
      },
      events: [
        {
          name: 'web_vitals',
          params: {
            page_location: url,
            ua: userAgent,
            cls,
            inp,
            fcp,
            lcp,
            ttfb
          }
        }
      ]
    };

    await sendToGA4(payload).catch(err => {
      console.warn('[WebVitals] Falha ao enviar para GA4:', err?.message || err);
    });

    // Retornar 200 sempre para não interromper beacon/fetch do cliente
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[WebVitals] Erro no endpoint:', error?.message || error);
    // Não propagamos erro para evitar aborts no cliente
    res.status(200).json({ success: false, error: 'processing_error' });
  }
}