const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

// Generar QR para una orden
router.get('/orders/:orderId/qr', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Datos que contendrá el QR
    const qrData = JSON.stringify({
      orderId: orderId,
      type: 'ORDER_PICKUP',
      timestamp: new Date().toISOString(),
    });

    // Opciones del QR
    const options = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,
    };

    // Generar QR como Data URL (base64)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, options);

    // Devolver el QR como imagen base64
    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      orderId: orderId,
      data: qrData,
    });

  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar código QR',
    });
  }
});

// Verificar código QR (para cuando el admin escanee)
router.post('/orders/verify-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    
    // Parsear datos del QR
    const data = JSON.parse(qrData);
    
    // Aquí verificarías la orden en la DB
    // y actualizarías el estado si es válida
    
    res.json({
      success: true,
      orderId: data.orderId,
      message: 'Código QR válido',
    });

  } catch (error) {
    console.error('Error verifying QR:', error);
    res.status(400).json({
      success: false,
      error: 'Código QR inválido',
    });
  }
});

module.exports = router;













