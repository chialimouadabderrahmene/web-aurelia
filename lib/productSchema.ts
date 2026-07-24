import { z } from "zod";

export const categoryValues = [
  "SHOULDER_BAG",
  "TOTE",
  "TOP_HANDLE",
  "CLUTCH",
  "WEEKENDER",
  "CROSSBODY",
] as const;

export const productSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
  sku: z
    .string()
    .min(2)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers, and dashes only"),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionAr: z.string().min(1),
  materialsEn: z.string().min(1),
  materialsAr: z.string().min(1),
  dimensions: z.string().min(1),
  careEn: z.string().min(1),
  careAr: z.string().min(1),
  category: z.enum(categoryValues),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  materialCost: z.number().int().nonnegative().default(0),
  packagingCost: z.number().int().nonnegative().default(0),
  adsCost: z.number().int().nonnegative().default(0),
  otherCost: z.number().int().nonnegative().default(0),
  originCountry: z.string().min(1),
  stockQty: z.number().int(),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  colors: z
    .array(
      z.object({
        nameEn: z.string().min(1),
        nameAr: z.string().min(1),
        hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      })
    )
    .min(1),
  images: z.array(z.object({ url: z.string().url() })).min(1),
});

export type ProductInput = z.infer<typeof productSchema>;
