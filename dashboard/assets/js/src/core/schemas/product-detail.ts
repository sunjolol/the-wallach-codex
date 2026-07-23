/**
 * core/schemas/product-detail.ts — Zod schemas for the product DISPLAY artifact
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/product-detail-data.json — the full per-product
 * label record + indicative YGY listing price read by the Knowledge Products
 * surface (views/knowledge-products.ts). DISPLAY ONLY (§00.A): composition is what
 * a product contains, price is a volatile YGY listing; neither feeds coverage math.
 *
 * Loose/passthrough at the leaves — the sealed pillar (products.json) is the shape
 * authority and is structurally gated by products_verify; here we type only the
 * fields the panel actually reads, and tolerate the rest.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { z } from 'zod';

/** Label amounts are usually numbers but can be a bounded string ("<1"). */
const AmountLike = z.union([z.number(), z.string()]);

const AmountUnit = z.object({
  amount: AmountLike.nullable().optional(),
  unit: z.string().nullable().optional(),
}).passthrough();

export const ProductPriceSchema = z.object({
  retail: z.number().nullable().optional(),
  wholesale: z.number().nullable().optional(),
}).passthrough();

export const ProductNutrientRowSchema = z.object({
  name: z.string(),
  amount: AmountLike.nullable().optional(),
  unit: z.string().nullable().optional(),
  pct_dv: AmountLike.nullable().optional(),
  form: z.string().optional(),
  unit_detail: z.string().optional(),
  label_iu: z.number().nullable().optional(),
}).passthrough();

/**
 * One line inside a proprietary blend's indented ingredient list (label order = descending
 * amount per FDA). Present in the derived JSON but previously only tolerated via .passthrough();
 * typed now so the product-detail Supplement Facts can render the collapsible blend breakdown
 * (name + italic latin) the way a real label prints it. DISPLAY ONLY (§00.A) — composition.
 */
const ProductBlendIngredientSchema = z.object({
  name: z.string(),
  latin: z.string().optional(),
  part: z.string().optional(),
  form: z.string().optional(),
}).passthrough();

export const ProductBlendSchema = z.object({
  name: z.string().optional(),
  total: AmountUnit.nullable().optional(),
  total_cfu: AmountUnit.nullable().optional(),
  as_labeled: z.string().optional(),
  pct_dv: AmountLike.nullable().optional(),
  ingredients: z.array(ProductBlendIngredientSchema).optional(),
}).passthrough();

export const ProductComponentSchema = z.object({
  role: z.string().optional(),
  form: z.string().optional(),
  serving_size: z.string().optional(),
  servings_per_container: AmountLike.nullable().optional(),
  directions: z.string().optional(),
  macros: z.record(z.string(), z.unknown()).optional(),
  nutrients: z.array(ProductNutrientRowSchema).optional(),
  blends: z.array(ProductBlendSchema).optional(),
  other_ingredients: z.array(z.string()).optional(),
}).passthrough();

export const ProductDetailSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  ygy_id: z.string().optional(),
  price: ProductPriceSchema.nullable().optional(),
  components: z.array(ProductComponentSchema).default([]),
}).passthrough();

export const ProductDetailDataSchema = z.object({
  products: z.record(z.string(), ProductDetailSchema),
}).passthrough();

export type ProductPrice = z.infer<typeof ProductPriceSchema>;
export type ProductNutrientRow = z.infer<typeof ProductNutrientRowSchema>;
export type ProductBlend = z.infer<typeof ProductBlendSchema>;
export type ProductComponent = z.infer<typeof ProductComponentSchema>;
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
