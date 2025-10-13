const axios = require('axios');

// WhatsApp Business API configuration
const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
};

// Instagram API configuration
const instagramConfig = {
  apiUrl: process.env.INSTAGRAM_API_URL,
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN
};

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await axios.post(
      `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp message error:', error.response?.data || error.message);
    throw new Error('Failed to send WhatsApp message');
  }
};

// Send WhatsApp message with product info
const sendProductWhatsAppMessage = async (to, product, seller) => {
  const message = `🛍️ *${product.title}*\n\n💰 Precio: $${product.price}\n📝 Descripción: ${product.description}\n👤 Vendedor: ${seller.firstName} ${seller.lastName}\n\n¿Te interesa este producto? ¡Contáctame para más información!`;
  
  return await sendWhatsAppMessage(to, message);
};

// Get Instagram user info
const getInstagramUserInfo = async (username) => {
  try {
    const response = await axios.get(
      `${instagramConfig.apiUrl}/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${instagramConfig.accessToken}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Instagram API error:', error.response?.data || error.message);
    throw new Error('Failed to get Instagram user info');
  }
};

// Generate WhatsApp link
const generateWhatsAppLink = (phoneNumber, message = '') => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}${message ? `?text=${encodedMessage}` : ''}`;
};

// Generate Instagram link
const generateInstagramLink = (username) => {
  return `https://instagram.com/${username}`;
};

// Validate phone number format
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

// Validate Instagram username
const validateInstagramUsername = (username) => {
  const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
  return instagramRegex.test(username);
};

module.exports = {
  sendWhatsAppMessage,
  sendProductWhatsAppMessage,
  getInstagramUserInfo,
  generateWhatsAppLink,
  generateInstagramLink,
  validatePhoneNumber,
  validateInstagramUsername
};

