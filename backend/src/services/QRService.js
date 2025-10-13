const crypto = require('crypto');

class QRService {
  /**
   * Genera un código QR único para una orden
   * @param {string} orderId - ID de la orden
   * @returns {Object} Objeto con qrCode y qrSecretToken
   */
  static generateQRCode(orderId) {
    // Generar token secreto único
    const secretToken = crypto.randomBytes(32).toString('hex');
    
    // Crear código QR que contiene orderId + secretToken
    const qrData = {
      orderId: orderId,
      token: secretToken,
      timestamp: Date.now()
    };
    
    // Codificar en base64 para el QR
    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');
    
    return {
      qrCode,
      qrSecretToken: secretToken
    };
  }

  /**
   * Valida un código QR escaneado
   * @param {string} scannedQR - Código QR escaneado
   * @returns {Object|null} Datos decodificados o null si es inválido
   */
  static validateQRCode(scannedQR) {
    try {
      // Decodificar base64
      const decodedData = Buffer.from(scannedQR, 'base64').toString('utf-8');
      const qrData = JSON.parse(decodedData);
      
      // Validar que tenga los campos requeridos
      if (!qrData.orderId || !qrData.token || !qrData.timestamp) {
        return null;
      }
      
      // Validar que no sea muy antiguo (24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas en ms
      if (Date.now() - qrData.timestamp > maxAge) {
        return null;
      }
      
      return qrData;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return null;
    }
  }

  /**
   * Genera un código de retiro aleatorio
   * @returns {string} Código de 6 dígitos
   */
  static generatePickupCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Crea la URL del QR para mostrar en la app
   * @param {string} qrCode - Código QR
   * @returns {string} URL completa del QR
   */
  static createQRImageUrl(qrCode) {
    // Usando qr-server.com para generar la imagen del QR
    const encodedQR = encodeURIComponent(qrCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedQR}`;
  }
}

module.exports = QRService;
