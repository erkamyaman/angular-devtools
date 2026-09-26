import { createError, defineEventHandler, readBody } from 'h3';
import { ORDERS, findProduct, type Order } from '../../../../data/catalog';

interface OrderRequest {
  name?: string;
  email?: string;
  items?: { productId: number; quantity: number }[];
}

export default defineEventHandler(async (event) => {
  const body = await readBody<OrderRequest>(event);
  const errors: { field: string; message: string }[] = [];
  if (!body?.name?.trim()) errors.push({ field: 'name', message: 'Name is required' });
  if (!body?.email?.includes('@')) errors.push({ field: 'email', message: 'Enter a valid email' });
  if (body?.email?.endsWith('@blocked.test')) {
    errors.push({ field: 'email', message: 'This email is blocked' });
  }
  const items = body?.items ?? [];
  if (!items.length) errors.push({ field: 'items', message: 'The cart is empty' });
  for (const item of items) {
    const product = findProduct(item.productId);
    if (!product || product.stock < item.quantity) {
      errors.push({ field: 'items', message: `${product?.name ?? 'A product'} is out of stock` });
    }
  }
  if (errors.length) throw createError({ statusCode: 422, data: { errors } });
  const order: Order = {
    id: 1000 + ORDERS.length + 1,
    name: body.name!,
    email: body.email!,
    items,
    total: items.reduce(
      (sum, item) => sum + (findProduct(item.productId)?.price ?? 0) * item.quantity,
      0,
    ),
    createdAt: new Date().toISOString(),
  };
  ORDERS.push(order);
  return order;
});
