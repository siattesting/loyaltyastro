import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Generate QR code for voucher
export async function generateVoucherQR(voucherId: string, points: number, merchantId: string): Promise<string> {
  const qrData = {
    type: 'voucher',
    voucherId,
    points,
    merchantId,
    timestamp: Date.now()
  };

  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generate QR code for redemption
export async function generateRedemptionQR(customerId: string, merchantId: string, pointsToRedeem: number): Promise<string> {
  const qrData = {
    type: 'redemption',
    customerId,
    merchantId,
    points: pointsToRedeem,
    timestamp: Date.now()
  };

  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generate unique voucher code
export function generateVoucherCode(): string {
  const prefix = 'VCH';
  const randomPart = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}${randomPart}`;
}

// Parse QR code data
export function parseQRData(qrString: string): any {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    console.error('Invalid QR code data:', error);
    return null;
  }
}

// Validate QR code data
export function validateQRData(qrData: any): boolean {
  if (!qrData || typeof qrData !== 'object') return false;
  
  const { type, timestamp } = qrData;
  
  // Check if QR code is not too old (24 hours)
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if (Date.now() - timestamp > maxAge) return false;
  
  // Validate based on type
  if (type === 'voucher') {
    return qrData.voucherId && qrData.points && qrData.merchantId;
  } else if (type === 'redemption') {
    return qrData.customerId && qrData.merchantId && qrData.points;
  }
  
  return false;
}