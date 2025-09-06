import { initializeDatabase } from './database';

// Initialize the application
export async function initApp() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}