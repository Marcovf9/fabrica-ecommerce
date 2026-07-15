declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = '1692923315300704';

export function initMetaPixel() {
  if (typeof window === 'undefined' || window.fbq) return;

  (function (f: Window, b: Document, e: string, v: string) {
    const n = (f.fbq = function (...args: unknown[]) {
      // @ts-expect-error fbq internals
      n.callMethod ? n.callMethod(...args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    // @ts-expect-error fbq internals
    n.push = n;
    // @ts-expect-error fbq internals
    n.loaded = true;
    // @ts-expect-error fbq internals
    n.version = '2.0';
    // @ts-expect-error fbq internals
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
}

export function trackPageView() {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

export function trackViewContent(product: {
  id: number;
  name: string;
  salePrice: number;
  categoryName: string;
}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_category: product.categoryName,
    content_type: 'product',
    value: product.salePrice,
    currency: 'ARS',
  });
}

export function trackAddToCart(product: {
  id: number;
  name: string;
  salePrice: number;
}, quantity: number) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'AddToCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: product.salePrice * quantity,
    currency: 'ARS',
    num_items: quantity,
  });
}

export function trackInitiateCheckout(items: { id: number; price: number; quantity: number }[], total: number) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'InitiateCheckout', {
    content_ids: items.map(i => String(i.id)),
    content_type: 'product',
    num_items: items.reduce((s, i) => s + i.quantity, 0),
    value: total,
    currency: 'ARS',
  });
}

export function trackPurchase(eventId: string, total: number, orderCode: string, items: { id: number; quantity: number }[]) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'Purchase', {
    content_ids: items.map(i => String(i.id)),
    content_type: 'product',
    value: total,
    currency: 'ARS',
    order_id: orderCode,
  }, { eventID: eventId });
}
