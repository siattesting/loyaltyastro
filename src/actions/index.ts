import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { sql } from '../lib/database';
import { registerUser, loginUser } from '../lib/auth';
import { generateVoucherQR, generateVoucherCode, parseQRData, validateQRData } from '../lib/qr';

// User Registration Action
export const register = defineAction({
  accept: 'form',
  input: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
    user_type: z.enum(['customer', 'merchant']),
    business_name: z.string().optional(),
    business_address: z.string().optional(),
  }),
  handler: async (input) => {
    const result = await registerUser(input);
    return result;
  },
});

// User Login Action
export const login = defineAction({
  accept: 'form',
  input: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  handler: async (input) => {
    const result = await loginUser(input.email, input.password);
    return result;
  },
});

// Issue Voucher Action
export const issueVoucher = defineAction({
  accept: 'form',
  input: z.object({
    merchant_id: z.string().uuid(),
    points_value: z.number().positive(),
    description: z.string().optional(),
    expires_in_days: z.number().positive().optional(),
  }),
  handler: async (input) => {
    try {
      const code = generateVoucherCode();
      const expiresAt = input.expires_in_days 
        ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000)
        : null;

      // Create voucher in database
      const [voucher] = await sql`
        INSERT INTO vouchers (merchant_id, code, points_value, description, expires_at)
        VALUES (${input.merchant_id}, ${code}, ${input.points_value}, ${input.description}, ${expiresAt})
        RETURNING *
      `;

      // Generate QR code
      const qrCode = await generateVoucherQR(voucher.id, input.points_value, input.merchant_id);

      // Update voucher with QR code data
      await sql`
        UPDATE vouchers 
        SET qr_code_data = ${qrCode}
        WHERE id = ${voucher.id}
      `;

      return { 
        success: true, 
        voucher: { ...voucher, qr_code_data: qrCode } 
      };
    } catch (error) {
      console.error('Voucher creation error:', error);
      return { success: false, error: 'Failed to create voucher' };
    }
  },
});

// Redeem Voucher Action
export const redeemVoucher = defineAction({
  accept: 'form',
  input: z.object({
    customer_id: z.string().uuid(),
    voucher_code: z.string().optional(),
    qr_data: z.string().optional(),
  }),
  handler: async (input) => {
    try {
      let voucherCode = input.voucher_code;

      // If QR data is provided, parse it
      if (input.qr_data && !voucherCode) {
        const qrData = parseQRData(input.qr_data);
        if (!validateQRData(qrData) || qrData.type !== 'voucher') {
          return { success: false, error: 'Invalid QR code' };
        }

        // Get voucher by ID from QR data
        const [voucher] = await sql`
          SELECT code FROM vouchers WHERE id = ${qrData.voucherId}
        `;
        if (!voucher) {
          return { success: false, error: 'Voucher not found' };
        }
        voucherCode = voucher.code;
      }

      if (!voucherCode) {
        return { success: false, error: 'Voucher code is required' };
      }

      // Get voucher details
      const [voucher] = await sql`
        SELECT * FROM vouchers 
        WHERE code = ${voucherCode} 
        AND is_redeemed = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
      `;

      if (!voucher) {
        return { success: false, error: 'Invalid or expired voucher' };
      }

      // Mark voucher as redeemed
      await sql`
        UPDATE vouchers 
        SET is_redeemed = TRUE, redeemed_by = ${input.customer_id}, redeemed_at = NOW()
        WHERE id = ${voucher.id}
      `;

      // Add transaction record
      await sql`
        INSERT INTO transactions (customer_id, merchant_id, points_amount, transaction_type, description, voucher_code)
        VALUES (${input.customer_id}, ${voucher.merchant_id}, ${voucher.points_value}, 'earned', ${voucher.description}, ${voucherCode})
      `;

      // Update customer balance
      await sql`
        INSERT INTO customer_balances (customer_id, total_points)
        VALUES (${input.customer_id}, ${voucher.points_value})
        ON CONFLICT (customer_id)
        DO UPDATE SET 
          total_points = customer_balances.total_points + ${voucher.points_value},
          updated_at = NOW()
      `;

      return { 
        success: true, 
        points_earned: voucher.points_value,
        description: voucher.description 
      };
    } catch (error) {
      console.error('Voucher redemption error:', error);
      return { success: false, error: 'Failed to redeem voucher' };
    }
  },
});

// Get Customer Balance Action
export const getCustomerBalance = defineAction({
  accept: 'json',
  input: z.object({
    customer_id: z.string().uuid(),
  }),
  handler: async (input) => {
    try {
      const [balance] = await sql`
        SELECT total_points FROM customer_balances 
        WHERE customer_id = ${input.customer_id}
      `;

      return { 
        success: true, 
        balance: balance?.total_points || 0 
      };
    } catch (error) {
      return { success: false, error: 'Failed to get balance' };
    }
  },
});

// Get Transactions Action
export const getTransactions = defineAction({
  accept: 'json',
  input: z.object({
    user_id: z.string().uuid(),
    user_type: z.enum(['customer', 'merchant']),
    transaction_type: z.enum(['earned', 'redeemed', 'all']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.number().positive().default(50),
    offset: z.number().nonnegative().default(0),
  }),
  handler: async (input) => {
    try {
      let whereClause = input.user_type === 'customer' 
        ? sql`customer_id = ${input.user_id}`
        : sql`merchant_id = ${input.user_id}`;

      if (input.transaction_type && input.transaction_type !== 'all') {
        whereClause = sql`${whereClause} AND transaction_type = ${input.transaction_type}`;
      }

      if (input.date_from) {
        whereClause = sql`${whereClause} AND created_at >= ${input.date_from}`;
      }

      if (input.date_to) {
        whereClause = sql`${whereClause} AND created_at <= ${input.date_to}`;
      }

      const transactions = await sql`
        SELECT 
          t.*,
          c.name as customer_name,
          c.email as customer_email,
          m.name as merchant_name,
          m.business_name
        FROM transactions t
        JOIN users c ON t.customer_id = c.id
        JOIN users m ON t.merchant_id = m.id
        WHERE ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `;

      return { success: true, transactions };
    } catch (error) {
      console.error('Get transactions error:', error);
      return { success: false, error: 'Failed to get transactions' };
    }
  },
});