import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from './database';
import type { APIContext } from 'astro';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  user_type: 'customer' | 'merchant';
  business_name?: string;
  business_address?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      user_type: user.user_type 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Register new user
export async function registerUser(userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  user_type: 'customer' | 'merchant';
  business_name?: string;
  business_address?: string;
}): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${userData.email}
    `;

    if (existingUser.length > 0) {
      return { success: false, error: 'User already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Insert new user
    const [user] = await sql`
      INSERT INTO users (email, password_hash, name, phone, user_type, business_name, business_address)
      VALUES (${userData.email}, ${passwordHash}, ${userData.name}, ${userData.phone}, ${userData.user_type}, ${userData.business_name}, ${userData.business_address})
      RETURNING id, email, name, phone, user_type, business_name, business_address
    `;

    // Initialize customer balance if it's a customer
    if (userData.user_type === 'customer') {
      await sql`
        INSERT INTO customer_balances (customer_id, total_points)
        VALUES (${user.id}, 0)
      `;
    }

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const [user] = await sql`
      SELECT id, email, password_hash, name, phone, user_type, business_name, business_address
      FROM users 
      WHERE email = ${email}
    `;

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    const { password_hash, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Get current user from request
export function getCurrentUser(context: APIContext): User | null {
  try {
    const token = context.cookies.get('auth-token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    return decoded;
  } catch (error) {
    return null;
  }
}

// Middleware to protect routes
export function requireAuth(context: APIContext, requiredType?: 'customer' | 'merchant'): User | null {
  const user = getCurrentUser(context);
  
  if (!user) return null;
  if (requiredType && user.user_type !== requiredType) return null;
  
  return user;
}