import { z } from 'zod';

/**
 * Contract schemas for the Toolshop REST API.
 * They describe the fields the suite relies on; unknown extra fields are tolerated
 * so that additive API changes don't break the contract tests.
 */

// Toolshop uses ULID string ids; accept numeric ids too for older self-hosted builds.
const Id = z.union([z.string().min(1), z.number().int()]);

export const BrandSchema = z.object({
  id: Id,
  name: z.string().min(1),
});

export const CategorySchema = z.object({
  id: Id,
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const ProductSchema = z.object({
  id: Id,
  name: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  in_stock: z.boolean().optional(),
  is_rental: z.boolean(),
  is_location_offer: z.boolean().optional(),
  brand: BrandSchema.optional(),
  category: CategorySchema.optional(),
});

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    current_page: z.number().int().positive(),
    data: z.array(item),
    last_page: z.number().int().nonnegative(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  });

export const ProductPageSchema = paginated(ProductSchema);

export const LoginResponseSchema = z.object({
  access_token: z.string().min(20),
  token_type: z.string().regex(/bearer/i),
  expires_in: z.number().int().positive(),
});

export const UserSchema = z.object({
  id: Id,
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

export const CartSchema = z.object({
  id: Id,
  cart_items: z
    .array(
      z.object({
        product_id: Id,
        quantity: z.number().int().positive(),
      }),
    )
    .default([]),
});

export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Cart = z.infer<typeof CartSchema>;
