// Service Worker for AfriLoyalty PWA
const CACHE_NAME = 'afriloyalty-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache
const urlsToCache = [
  '/',
  '/auth/login',
  '/auth/register',
  '/dashboard/customer',
  '/dashboard/merchant',
  '/transactions',
  '/offline.html',
  'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Strategy: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a response, clone it and update the cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If nothing in cache, return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // Return a simple offline response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background Sync for form submissions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'voucher-redemption') {
    event.waitUntil(doVoucherRedemption());
  }
  
  if (event.tag === 'voucher-creation') {
    event.waitUntil(doVoucherCreation());
  }
});

// Handle voucher redemption when back online
async function doVoucherRedemption() {
  try {
    const redemptions = await getStoredRedemptions();
    for (const redemption of redemptions) {
      try {
        const response = await fetch('/api/redeem-voucher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(redemption)
        });
        
        if (response.ok) {
          await removeStoredRedemption(redemption.id);
          console.log('Successfully synced voucher redemption');
        }
      } catch (error) {
        console.error('Failed to sync voucher redemption:', error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Handle voucher creation when back online
async function doVoucherCreation() {
  try {
    const vouchers = await getStoredVouchers();
    for (const voucher of vouchers) {
      try {
        const response = await fetch('/api/create-voucher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voucher)
        });
        
        if (response.ok) {
          await removeStoredVoucher(voucher.id);
          console.log('Successfully synced voucher creation');
        }
      } catch (error) {
        console.error('Failed to sync voucher creation:', error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Helper functions for IndexedDB storage (simplified)
async function getStoredRedemptions() {
  // In a real implementation, you would use IndexedDB
  const stored = localStorage.getItem('pending-redemptions');
  return stored ? JSON.parse(stored) : [];
}

async function removeStoredRedemption(id) {
  const redemptions = await getStoredRedemptions();
  const filtered = redemptions.filter(r => r.id !== id);
  localStorage.setItem('pending-redemptions', JSON.stringify(filtered));
}

async function getStoredVouchers() {
  const stored = localStorage.getItem('pending-vouchers');
  return stored ? JSON.parse(stored) : [];
}

async function removeStoredVoucher(id) {
  const vouchers = await getStoredVouchers();
  const filtered = vouchers.filter(v => v.id !== id);
  localStorage.setItem('pending-vouchers', JSON.stringify(filtered));
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});