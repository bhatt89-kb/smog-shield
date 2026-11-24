import { z } from "zod";

// Disable Zod's eval-based JIT so a strict CSP (no 'unsafe-eval') isn't triggered.
z.config({ jitless: true });

/**
 * Validation schemas for Smog Shield AI application.
 * 
 * This module defines Zod schemas for input validation and type safety.
 * All user inputs are validated against these schemas before processing.
 * 
 * @module schemas
 */

/**
 * Regular expression that blocks potentially dangerous characters in city names.
 * This prevents prompt injection attacks by restricting input to safe characters.
 * Only letters, spaces, commas, periods, and apostrophes are allowed.
 */
const FORBIDDEN_CITY_CHARS = /[<>{}\[\]\\\/"`$;=|@#%^*+~_()!?:&\d]/;

/**
 * Schema for validating city names.
 * Restricts input to 2-80 characters and blocks special characters
 * that could be used in injection attacks.
 * 
 * @example "New Delhi, IN"
 * @example "Mumbai"
 */
export const CitySchema = z
  .string()
  .trim()
  .min(2, "City is too short")
  .max(80, "City is too long")
  .refine((v) => !FORBIDDEN_CITY_CHARS.test(v), "City contains invalid characters");

/**
 * Schema for user's lifestyle and household information.
 * This data is used to generate personalized air quality recommendations.
 * 
 * @property {string} city - City name with optional country code
 * @property {number} householdSize - Number of people in household (1-20)
 * @property {boolean} hasChildrenOrElderly - Presence of vulnerable family members
 * @property {string} commute - Primary mode of transportation
 * @property {string} cooking - Type of cooking fuel used
 * @property {string} heating - Type of winter heating system
 * @property {boolean} hasPurifier - Whether household has an air purifier
 * @property {string} language - Output language preference (en/hi)
 */
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

/**
 * Schema for a single actionable recommendation.
 * Each action includes steps, impact quantification, and effort level.
 * 
 * @property {string} id - Unique identifier for the action
 * @property {string} category - Type of action (routine/indoor/sustainable)
 * @property {string} title - Short descriptive title
 * @property {string[]} steps - Actionable steps to implement
 * @property {string} whyItWorks - Scientific explanation
 * @property {object} impact - Quantified impact with metric and explanation
 * @property {string} effort - Implementation difficulty (low/medium/high)
 */
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

/**
 * Schema for complete AI-generated advice response.
 * Contains health alert, summary, and array of actionable recommendations.
 * 
 * @property {string} healthAlert - Urgent health guidance based on AQI
 * @property {string} summary - Overview of current situation
 * @property {Action[]} actions - List of 3-9 recommended actions
 */
export const AdviceSchema = z.object({
  healthAlert: z.string().max(400),
  summary: z.string().max(500),
  actions: z.array(ActionSchema).min(3).max(9),
});

/**
 * Schema for air quality index data from OpenWeather API.
 * Contains location information and pollutant measurements.
 * 
 * @property {string} city - City name
 * @property {string} state - State/region (optional)
 * @property {string} country - Country code (optional)
 * @property {number} aqiIndex - AQI on OpenWeather scale (1=good, 5=very poor)
 * @property {number} pm25 - PM2.5 concentration (µg/m³)
 * @property {number} pm10 - PM10 concentration (µg/m³)
 */
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