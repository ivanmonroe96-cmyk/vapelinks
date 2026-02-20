import { defineMiddleware } from 'astro:middleware';

/**
 * Middleware to handle old Shopify URL patterns and redirect to correct Astro routes.
 * 
 * Patterns handled:
 * - /collections/xxx/products/yyy → /products/yyy (Shopify nested URLs)
 * - /collections/vendors?q=... → /collections
 * - Strip Shopify query params (?variant=..., ?_pos=..., ?_sid=..., ?_ss=...)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 1. Redirect Shopify nested collection/product URLs: /collections/xxx/products/yyy → /products/yyy
  const nestedMatch = path.match(/^\/collections\/[^/]+\/products\/([^/?]+)/);
  if (nestedMatch) {
    const productHandle = nestedMatch[1];
    return context.redirect(`/products/${productHandle}`, 301);
  }

  // 2. Redirect /collections/vendors to /collections
  if (path === '/collections/vendors') {
    return context.redirect('/collections', 301);
  }

  // 3. Redirect old Shopify /pages/contact-us to /contact
  if (path === '/pages/contact-us') {
    return context.redirect('/contact', 301);
  }

  // 4. Redirect old /pages/brands to /collections
  if (path === '/pages/brands') {
    return context.redirect('/collections', 301);
  }

  // 5. Strip Shopify-specific query params from clean URLs
  const shopifyParams = ['variant', '_pos', '_sid', '_ss'];
  const hasShopifyParams = shopifyParams.some(p => url.searchParams.has(p));
  if (hasShopifyParams) {
    shopifyParams.forEach(p => url.searchParams.delete(p));
    const cleanUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
    return context.redirect(cleanUrl, 301);
  }

  return next();
});
