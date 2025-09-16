import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  source: string;
}

interface AlertRequest {
  to: string;
  alert: SecurityAlert;
  discordWebhook?: string;
  slackWebhook?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { to, alert, discordWebhook, slackWebhook }: AlertRequest = await req.json()

    if (!to || !alert) {
      throw new Error('Missing required fields: to and alert')
    }

    // Format alert message
    const emailSubject = `🚨 Security Alert: ${alert.title}`
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${getSeverityColor(alert.type)}; color: white; padding: 20px; text-align: center;">
            <h1>🚨 Security Alert</h1>
            <p style="font-size: 18px; margin: 0;">${alert.title}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Alert Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Severity:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.type.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Message:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.message}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Source:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${alert.source}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(alert.timestamp).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="padding: 20px;">
            <h3>Recommended Actions:</h3>
            <ul>
              ${getRecommendedActions(alert.type).map(action => `<li>${action}</li>`).join('')}
            </ul>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #007cba;">
              <p><strong>What should I do?</strong></p>
              <p>Log into your security dashboard immediately to review this alert and take any necessary actions. If you believe this is a false positive, you can acknowledge the alert to dismiss it.</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f0f0f0; color: #666;">
            <p>This is an automated security notification from your system.</p>
            <p>Alert ID: ${alert.id}</p>
          </div>
        </body>
      </html>
    `

    // Send email notification (using a mock service - replace with actual email service)
    console.log('Sending email alert to:', to)
    console.log('Subject:', emailSubject)

    // Send Discord webhook if provided
    if (discordWebhook) {
      try {
        const discordPayload = {
          embeds: [{
            title: `🚨 Security Alert: ${alert.title}`,
            description: alert.message,
            color: getSeverityColorHex(alert.type),
            fields: [
              { name: 'Severity', value: alert.type.toUpperCase(), inline: true },
              { name: 'Source', value: alert.source, inline: true },
              { name: 'Time', value: new Date(alert.timestamp).toLocaleString(), inline: true }
            ],
            timestamp: alert.timestamp,
            footer: { text: `Alert ID: ${alert.id}` }
          }]
        }

        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        })

        console.log('Discord notification sent successfully')
      } catch (error) {
        console.error('Failed to send Discord notification:', error)
      }
    }

    // Send Slack webhook if provided
    if (slackWebhook) {
      try {
        const slackPayload = {
          text: `🚨 Security Alert: ${alert.title}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `🚨 Security Alert: ${alert.title}`
              }
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Severity:*\n${alert.type.toUpperCase()}` },
                { type: 'mrkdwn', text: `*Source:*\n${alert.source}` },
                { type: 'mrkdwn', text: `*Time:*\n${new Date(alert.timestamp).toLocaleString()}` },
                { type: 'mrkdwn', text: `*Alert ID:*\n${alert.id}` }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:* ${alert.message}`
              }
            }
          ]
        }

        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload)
        })

        console.log('Slack notification sent successfully')
      } catch (error) {
        console.error('Failed to send Slack notification:', error)
      }
    }

    // Log the alert notification
    await supabase.rpc('log_security_event', {
      event_type: 'security_alert_sent',
      details_param: {
        alert_id: alert.id,
        recipient: to,
        channels: [
          'email',
          ...(discordWebhook ? ['discord'] : []),
          ...(slackWebhook ? ['slack'] : [])
        ]
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Security alert sent successfully',
        channels: {
          email: true,
          discord: !!discordWebhook,
          slack: !!slackWebhook
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Security alert error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send security alert',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function getSeverityColor(type: string): string {
  switch (type) {
    case 'critical': return '#dc2626'
    case 'high': return '#ea580c'
    case 'medium': return '#d97706'
    case 'low': return '#65a30d'
    default: return '#6b7280'
  }
}

function getSeverityColorHex(type: string): number {
  switch (type) {
    case 'critical': return 0xdc2626
    case 'high': return 0xea580c
    case 'medium': return 0xd97706
    case 'low': return 0x65a30d
    default: return 0x6b7280
  }
}

function getRecommendedActions(type: string): string[] {
  const baseActions = [
    'Review your security dashboard immediately',
    'Check recent login activity',
    'Verify all trusted devices'
  ]

  switch (type) {
    case 'critical':
      return [
        'Change your password immediately',
        'Enable two-factor authentication if not already enabled',
        'Review and revoke any suspicious sessions',
        ...baseActions,
        'Contact support if you believe your account is compromised'
      ]
    case 'high':
      return [
        'Review recent account activity',
        'Consider changing your password',
        ...baseActions,
        'Monitor for additional suspicious activity'
      ]
    case 'medium':
      return [
        ...baseActions,
        'Review your security settings',
        'Ensure your account information is up to date'
      ]
    case 'low':
      return [
        ...baseActions,
        'This may be normal activity, but please verify'
      ]
    default:
      return baseActions
  }
}