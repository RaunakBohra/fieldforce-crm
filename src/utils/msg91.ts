/**
 * MSG91 Service - SMS and WhatsApp Integration
 * Documentation: https://docs.msg91.com/
 */

import axios from 'axios';

export interface MSG91Config {
  apiKey: string;
  senderId: string;
  whatsappNumber: string;
}

export interface MSG91Response {
  success: boolean;
  message: string;
  messageId?: string;
  response?: any;
}

/**
 * Send SMS via MSG91
 * @param to - Recipient phone number (with country code, e.g., 919876543210)
 * @param message - Message content
 * @param config - MSG91 configuration
 */
export async function sendSMS(
  to: string,
  message: string,
  config: MSG91Config
): Promise<MSG91Response> {
  try {
    // Remove any non-numeric characters from phone number
    const cleanPhone = to.replace(/\D/g, '');

    // MSG91 SMS API endpoint
    const url = 'https://api.msg91.com/api/v5/flow/';

    const payload = {
      sender: config.senderId,
      route: '4', // Transactional route
      country: '91', // India country code
      sms: [
        {
          message: message,
          to: [cleanPhone],
        },
      ],
    };

    const response = await axios.post(url, payload, {
      headers: {
        'authkey': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.type === 'success') {
      return {
        success: true,
        message: 'SMS sent successfully',
        messageId: response.data.message,
        response: response.data,
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to send SMS',
        response: response.data,
      };
    }
  } catch (error: any) {
    console.error('MSG91 SMS Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to send SMS',
      response: error.response?.data,
    };
  }
}

/**
 * Send WhatsApp message via MSG91
 * @param to - Recipient phone number (with country code)
 * @param message - Message content
 * @param config - MSG91 configuration
 */
export async function sendWhatsApp(
  to: string,
  message: string,
  config: MSG91Config
): Promise<MSG91Response> {
  try {
    // Remove any non-numeric characters from phone number
    const cleanPhone = to.replace(/\D/g, '');

    // MSG91 WhatsApp API endpoint
    const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

    const payload = {
      integrated_number: config.whatsappNumber,
      content_type: 'template',
      payload: {
        to: cleanPhone,
        type: 'template',
        template: {
          name: 'payment_reminder', // Template name (needs to be pre-approved)
          language: {
            code: 'en',
            policy: 'deterministic',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: message,
                },
              ],
            },
          ],
        },
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'authkey': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.type === 'success') {
      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: response.data.message_id,
        response: response.data,
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to send WhatsApp message',
        response: response.data,
      };
    }
  } catch (error: any) {
    console.error('MSG91 WhatsApp Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to send WhatsApp message',
      response: error.response?.data,
    };
  }
}

/**
 * Get MSG91 config from environment
 */
export function getMSG91Config(env: any): MSG91Config {
  return {
    apiKey: env.MSG91_API_KEY || '',
    senderId: env.MSG91_SENDER_ID || 'MSGIND',
    whatsappNumber: env.MSG91_WHATSAPP_NUMBER || '',
  };
}
