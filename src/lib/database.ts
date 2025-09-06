import postgres from 'postgres';

// Database connection
const sql = postgres(process.env.DATABASE_URL as string, {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

export { sql };

// Database schema initialization
export async function initializeDatabase() {
  try {
    // Create users table (both customers and merchants)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'merchant')),
        business_name VARCHAR(255), -- For merchants only
        business_address TEXT, -- For merchants only
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create transactions table for loyalty points
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES users(id),
        merchant_id UUID NOT NULL REFERENCES users(id),
        points_amount INTEGER NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed')),
        description TEXT,
        voucher_code VARCHAR(50),
        qr_code_data TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create vouchers table
    await sql`
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES users(id),
        code VARCHAR(50) UNIQUE NOT NULL,
        points_value INTEGER NOT NULL,
        description TEXT,
        qr_code_data TEXT,
        is_redeemed BOOLEAN DEFAULT FALSE,
        redeemed_by UUID REFERENCES users(id),
        redeemed_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create customer_balances table for tracking points
    await sql`
      CREATE TABLE IF NOT EXISTS customer_balances (
        customer_id UUID PRIMARY KEY REFERENCES users(id),
        total_points INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_merchant ON vouchers(merchant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}