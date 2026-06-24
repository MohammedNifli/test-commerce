import { Request, Response } from 'express';
import prisma from '../prisma';
import type { Product } from '@prisma/client';

/**
 * Speako integration controller.
 *
 * Speako's CustomApiClient (integrations/custom_api/client.py) calls a fixed set
 * of convention-based endpoints and normalizes the JSON with these field names:
 *   id, name, price, regular_price, sale_price, on_sale, in_stock,
 *   stock_quantity, image_url, permalink, description, category_slug, tags
 *
 * ElectroTech's Product model uses different names (stock, imageUrl, category),
 * so every product is reshaped here before it leaves the API.
 */

// Read at call time, not module load: TypeScript hoists imports above index.ts's
// dotenv.config(), so a module-level read would capture the value before .env loads.
const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

// `category` is a free-text string on ElectroTech; Speako expects a slug.
const slugify = (s: string | null | undefined): string =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Build an absolute image URL from the stored relative `/uploads/...` path.
const absoluteImage = (req: Request, imageUrl: string | null): string => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${req.protocol}://${req.get('host')}${imageUrl}`;
};

// Reshape an ElectroTech product into Speako's canonical product shape.
const toSpeakoProduct = (req: Request, p: Product) => ({
  id: p.id,
  name: p.name,
  description: p.description || '',
  short_description: p.description || '',
  price: p.price,
  regular_price: p.price,
  sale_price: '',
  on_sale: false,
  in_stock: p.stock > 0,
  stock_quantity: p.stock,
  image_url: absoluteImage(req, p.imageUrl),
  permalink: `${frontendUrl()}/product/${p.id}`,
  category_slug: slugify(p.category),
  tags: '',
});

// ── Products ────────────────────────────────────────────────────────────────

/**
 * GET /api/speako/products
 * Used by speako-loader.js (`?all=true`) and Speako's sync task (`?page&per_page`).
 * Returns a bare array so the loader, which wraps non-arrays, posts it correctly.
 */
export const listProducts = async (req: Request, res: Response) => {
  try {
    if (req.query.all === 'true') {
      const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(products.map((p) => toSpeakoProduct(req, p)));
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 100, 200);
    const products = await prisma.product.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map((p) => toSpeakoProduct(req, p)));
  } catch (error) {
    console.error('[speako] listProducts error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

/**
 * GET /api/speako/products/search
 * Params from Speako: q, limit, in_stock_only, category, min_price, max_price, on_sale
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 6, 1), 40);
    const inStockOnly = req.query.in_stock_only === 'true';
    const category = (req.query.category as string) || '';
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (inStockOnly) where.stock = { gt: 0 };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    let products = await prisma.product.findMany({
      where,
      take: category ? undefined : limit,
      orderBy: { createdAt: 'desc' },
    });

    // `category` arrives as a slug; ElectroTech stores free text, so filter in-app.
    if (category) {
      const wanted = slugify(category);
      products = products.filter((p) => slugify(p.category) === wanted).slice(0, limit);
    }

    res.json(products.map((p) => toSpeakoProduct(req, p)));
  } catch (error) {
    console.error('[speako] searchProducts error:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
};

/** GET /api/speako/products/:id */
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ ...toSpeakoProduct(req, product), variations: [], attributes: {} });
  } catch (error) {
    console.error('[speako] getProduct error:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

/** GET /api/speako/categories — distinct categories with product counts. */
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const grouped = await prisma.product.groupBy({
      by: ['category'],
      _count: { _all: true },
    });
    const categories = grouped
      .filter((g) => g.category)
      .map((g) => ({
        id: slugify(g.category),
        name: g.category as string,
        slug: slugify(g.category),
        count: g._count._all,
      }));
    res.json(categories);
  } catch (error) {
    console.error('[speako] getCategories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// ── Cart ──────────────────────────────────────────────────────────────────────
//
// Speako carts are keyed by its own conversational `session_id`. ElectroTech's
// own cart lives in the browser (zustand) and is separate. We keep Speako's cart
// server-side in memory — adequate for short-lived assistant sessions. To persist
// across restarts, swap `carts` for a Prisma CartSession/CartItem model.

const carts = new Map<string, Map<string, number>>(); // session_id -> (productId -> qty)

const buildCart = async (req: Request, sessionId: string) => {
  const session = carts.get(sessionId) || new Map<string, number>();
  const ids = [...session.keys()];
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } } })
    : [];

  let total = 0;
  let itemCount = 0;
  const items = products.map((p) => {
    const quantity = session.get(p.id) || 0;
    const lineTotal = p.price * quantity;
    total += lineTotal;
    itemCount += quantity;
    return {
      cart_item_key: p.id,
      product_id: p.id,
      name: p.name,
      price: String(p.price),
      quantity,
      line_total: String(lineTotal),
      image_url: absoluteImage(req, p.imageUrl),
    };
  });

  return {
    items,
    item_count: itemCount,
    total: String(total),
    subtotal: String(total),
    is_empty: itemCount === 0,
  };
};

/** GET /api/speako/cart?session_id= */
export const getCart = async (req: Request, res: Response) => {
  try {
    const sessionId = (req.query.session_id as string) || '';
    res.json(await buildCart(req, sessionId));
  } catch (error) {
    console.error('[speako] getCart error:', error);
    res.status(500).json({ items: [], item_count: 0, total: '0', is_empty: true });
  }
};

/** POST /api/speako/cart/add { session_id, product_id, quantity } */
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { session_id, product_id } = req.body;
    const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    if (!session_id || !product_id) {
      return res.status(400).json({ success: false, error: 'session_id and product_id are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: String(product_id) } });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, error: `Only ${product.stock} in stock` });
    }

    const session = carts.get(session_id) || new Map<string, number>();
    session.set(String(product_id), (session.get(String(product_id)) || 0) + quantity);
    carts.set(session_id, session);

    res.json({ success: true, cart: await buildCart(req, session_id) });
  } catch (error) {
    console.error('[speako] addToCart error:', error);
    res.status(500).json({ success: false, error: 'Error adding to cart' });
  }
};

/** POST /api/speako/cart/remove { session_id, product_id } (or cart_item_key) */
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body;
    const productId = String(req.body.product_id || req.body.cart_item_key || '');
    if (!session_id) return res.status(400).json({ success: false, error: 'session_id is required' });

    const session = carts.get(session_id);
    if (session) session.delete(productId);

    res.json({ success: true, cart: await buildCart(req, session_id) });
  } catch (error) {
    console.error('[speako] removeFromCart error:', error);
    res.status(500).json({ success: false, error: 'Error removing from cart' });
  }
};

/** PUT /api/speako/cart/update { session_id, product_id, quantity } */
export const updateCart = async (req: Request, res: Response) => {
  try {
    const { session_id, product_id } = req.body;
    const quantity = parseInt(req.body.quantity, 10);
    if (!session_id || !product_id) {
      return res.status(400).json({ success: false, error: 'session_id and product_id are required' });
    }

    const session = carts.get(session_id) || new Map<string, number>();
    if (quantity <= 0) {
      session.delete(String(product_id));
    } else {
      const product = await prisma.product.findUnique({ where: { id: String(product_id) } });
      if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, error: `Only ${product.stock} in stock` });
      }
      session.set(String(product_id), quantity);
    }
    carts.set(session_id, session);

    res.json({ success: true, cart: await buildCart(req, session_id) });
  } catch (error) {
    console.error('[speako] updateCart error:', error);
    res.status(500).json({ success: false, error: 'Error updating cart' });
  }
};

// ── Orders ──────────────────────────────────────────────────────────────────

/** GET /api/speako/orders?customer_email=&limit= */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const customerEmail = (req.query.customer_email as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 50);
    if (!customerEmail) return res.json([]);

    const orders = await prisma.order.findMany({
      where: { customerEmail },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: String(o.totalAmount),
        currency: 'USD',
        date_created: o.createdAt.toISOString(),
        tracking: '',
        line_items: o.items.map((it) => ({
          product_id: it.productId,
          name: it.product.name,
          quantity: it.quantity,
          price: String(it.price),
        })),
      }))
    );
  } catch (error) {
    console.error('[speako] getOrders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// ── Store ─────────────────────────────────────────────────────────────────────

/** GET /api/speako/store/info */
export const getStoreInfo = (_req: Request, res: Response) => {
  res.json({
    name: 'ElectroTech',
    description: 'Your one-stop shop for electronics and gadgets.',
    currency: 'USD',
    url: frontendUrl(),
    email: 'admin@electrotech.com',
    phone: '',
    address: {},
  });
};

/** GET /api/speako/store/policies */
export const getStorePolicies = (_req: Request, res: Response) => {
  res.json({
    shipping: 'Standard shipping on all orders. Delivery in 3–5 business days.',
    returns: '30-day return policy on unused items in original packaging.',
    payment: 'Cash on Delivery (COD).',
    privacy: '',
    terms: '',
  });
};
