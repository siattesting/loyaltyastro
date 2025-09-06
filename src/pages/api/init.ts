import type { APIRoute } from 'astro';
import { initializeDatabase } from '../../lib/database';

export const GET: APIRoute = async () => {
  try {
    await initializeDatabase();
    return new Response(JSON.stringify({ success: true, message: 'Database initialized successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Database initialization failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};