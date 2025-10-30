/**
 * Edge Function: Alert Processor
 * 
 * Processa alertas automáticos para erros críticos do sistema
 * Envia e-mails para administradores quando erros críticos são detectados
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertRequest {
  type: 'error' | 'critical' | 'warning'
  source: string
  message: string
  details?: Record<string, any>
  timestamp?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const alertData: AlertRequest = await req.json()

    // Validate alert data
    if (!alertData.type || !alertData.source || !alertData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, source, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Only process critical errors and errors
    if (!['error', 'critical'].includes(alertData.type)) {
      return new Response(
        JSON.stringify({ message: 'Alert type not configured for email notifications' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get alert subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('alert_subscriptions')
      .select('email')

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch alert subscribers' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No alert subscribers found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate email template
    const emailTemplate = generateEmailTemplate(alertData)

    // Send emails to all subscribers
    const emailPromises = subscribers.map(subscriber => 
      sendEmail(subscriber.email, emailTemplate)
    )

    const emailResults = await Promise.allSettled(emailPromises)
    
    // Count successful and failed emails
    const successful = emailResults.filter(result => result.status === 'fulfilled').length
    const failed = emailResults.filter(result => result.status === 'rejected').length

    // Log the alert processing
    await supabase.rpc('insert_system_log', {
      p_type: 'email',
      p_message: `Alert processed: ${successful} emails sent, ${failed} failed`,
      p_context: {
        alert_type: alertData.type,
        alert_source: alertData.source,
        subscribers_count: subscribers.length,
        successful_emails: successful,
        failed_emails: failed,
        original_alert: alertData
      }
    })

    return new Response(
      JSON.stringify({ 
        message: 'Alert processed successfully',
        emails_sent: successful,
        emails_failed: failed,
        total_subscribers: subscribers.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing alert:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Generates email template based on alert data
 */
function generateEmailTemplate(alertData: AlertRequest): EmailTemplate {
  const timestamp = alertData.timestamp || new Date().toISOString()
  const formattedTime = new Date(timestamp).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const alertIcon = alertData.type === 'critical' ? '🚨' : '⚠️'
  const alertLevel = alertData.type === 'critical' ? 'CRÍTICO' : 'ERRO'
  
  const subject = `${alertIcon} [AIMindset] Alerta ${alertLevel} - ${alertData.source}`

  const detailsHtml = alertData.details 
    ? `
      <h3>📋 Detalhes Técnicos:</h3>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(alertData.details, null, 2)}</pre>
    `
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alerta AIMindset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${alertData.type === 'critical' ? '#dc3545' : '#fd7e14'}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">${alertIcon} Alerta ${alertLevel}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Sistema: AIMindset</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #495057;">📍 Informações do Alerta</h2>
        <p><strong>🕒 Data/Hora:</strong> ${formattedTime}</p>
        <p><strong>📦 Origem:</strong> ${alertData.source}</p>
        <p><strong>⚡ Tipo:</strong> ${alertData.type.toUpperCase()}</p>
      </div>

      <div style="background: white; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #495057;">💬 Mensagem:</h3>
        <p style="font-size: 16px; background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid ${alertData.type === 'critical' ? '#dc3545' : '#fd7e14'};">
          ${alertData.message}
        </p>
      </div>

      ${detailsHtml}

      <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 30px; font-size: 14px; color: #6c757d;">
        <p style="margin: 0;"><strong>🤖 AIMindset - Sistema de Alertas Automáticos</strong></p>
        <p style="margin: 5px 0 0 0;">Este é um alerta automático gerado pelo sistema de monitoramento.</p>
      </div>
    </body>
    </html>
  `

  const text = `
🚨 ALERTA ${alertLevel} - AIMindset

📍 Informações:
- Data/Hora: ${formattedTime}
- Origem: ${alertData.source}
- Tipo: ${alertData.type.toUpperCase()}

💬 Mensagem:
${alertData.message}

${alertData.details ? `📋 Detalhes Técnicos:\n${JSON.stringify(alertData.details, null, 2)}` : ''}

---
🤖 AIMindset - Sistema de Alertas Automáticos
Este é um alerta automático gerado pelo sistema de monitoramento.
  `

  return { subject, html, text }
}

/**
 * Sends email using Resend service
 * Falls back to console logging in development mode
 */
async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || !resendApiKey
  
  // In development or if no API key, just log the email
  if (isDevelopment) {
    console.log(`📧 [DEV MODE] Email would be sent to: ${to}`)
    console.log(`📧 [DEV MODE] Subject: ${template.subject}`)
    console.log(`📧 [DEV MODE] Content: ${template.text.substring(0, 200)}...`)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return
  }

  try {
    // Send real email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AIMindset Alerts <alerts@resend.dev>', // Use Resend's domain for testing
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`❌ Email service error (${response.status}):`, errorData)
      throw new Error(`Email service error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log(`✅ Email sent successfully to ${to}:`, result.id)
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error)
    
    // Log the email that failed to send for debugging
    console.log(`📧 [FAILED EMAIL] To: ${to}`)
    console.log(`📧 [FAILED EMAIL] Subject: ${template.subject}`)
    console.log(`📧 [FAILED EMAIL] Content: ${template.text.substring(0, 200)}...`)
    
    throw error
  }
}