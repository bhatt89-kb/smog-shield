import { z } from "zod";

// Only enums and a restricted city string reach the prompt, which blocks prompt injection.
const FORBIDDEN_CITY_CHARS = /[<>{}\[\]\\\/"`$;=|@#%^*+~_()!?:&\d]/;

export const CitySchema = z
  .string()
  .trim()
  .min(2, "City is too short")
  .max(80, "City is too long")
  .refine((v) => !FORBIDDEN_CITY_CHARS.test(v), "City contains invalid characters");

export const LifestyleInputSchema = z.object({
  city: CitySchema,
  householdSize: z.number().int().min(1).max(20),
  hasChildrenOrElderly: z.boolean(),
  commute: z.enum(["walk_cycle", "public_transport", "two_wheeler", "car"]),
  cooking: z.enum(["lpg", "induction", "biomass", "piped_gas"]),
  heating: z.enum(["none", "electric", "biomass_or_coal", "gas"]),
  hasPurifier: z.boolean(),
  language: z.enum(["en", "hi"]).default("en"),
});
export type LifestyleInput = z.infer<typeof LifestyleInputSchema>;

export const ActionSchema = z.object({
  id: z.string().max(40),
  category: z.enum(["routine", "indoor", "sustainable"]),
  title: z.string().max(120),
  steps: z.array(z.string().max(300)).min(1).max(5),
  whyItWorks: z.string().max(400),
  impact: z.object({
    metric: z.string().max(80),
    estimatedReductionPercent: z.number().min(0).max(100),
    explanation: z.string().max(300),
  }),
  effort: z.enum(["low", "medium", "high"]),
});

export const AdviceSchema = z.object({
  healthAlert: z.string().max(400),
  summary: z.string().max(500),
  actions: z.array(ActionSchema).min(3).max(9),
});

export const AqiSchema = z.object({
  city: z.string(),
  state: z.string().optional(),
  country: z.string().optional(),
  aqiIndex: z.number().int().min(1).max(5), // OpenWeather scale: 1 good ... 5 very poor
  pm25: z.number().nonnegative(),
  pm10: z.number().nonnegative(),
});

export type Advice = z.infer<typeof AdviceSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Aqi = z.infer<typeof AqiSchema>;