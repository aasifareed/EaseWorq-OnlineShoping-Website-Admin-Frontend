/**
 * Weight is stored, priced and booked in kilograms — that is what both courier APIs take and what the
 * shipping engine quotes on. But this catalogue is mobile accessories: a screen protector is 20 g, a
 * cable 80 g. Nobody wants to type 0.02, and a misplaced decimal point is a tenfold error in a courier
 * charge.
 *
 * So grams are the unit a human enters and reads, kilograms stay canonical, and every conversion lives
 * here rather than as a scattered ×1000. Mirrors `OnlineShopWeight` on the server.
 */

const GRAMS_PER_KILOGRAM = 1000;

/** Sanity bound, mirroring the server's 1000 kg. Catches a gram figure typed into the wrong field. */
export const MAX_PRODUCT_WEIGHT_GRAMS = 1_000_000;

/** Canonical kilograms to whole grams, for display or editing. 0 means no weight was recorded. */
export function kilogramsToGrams(weightKg: number | null | undefined): number {
  const kg = Number(weightKg ?? 0);
  if (!Number.isFinite(kg) || kg <= 0) {
    return 0;
  }
  return Math.round(kg * GRAMS_PER_KILOGRAM);
}

/**
 * Grams as typed, to the kilograms the API expects. Whole grams only, which lands inside the four
 * decimals the column stores, so the value that comes back equals the value that was sent.
 */
export function gramsToKilograms(grams: number): number {
  if (!Number.isFinite(grams) || grams <= 0) {
    return 0;
  }
  return Math.round(grams) / GRAMS_PER_KILOGRAM;
}

/**
 * A weight in the unit someone would actually say it in: grams under a kilogram, kilograms at or
 * above. Empty when the weight is unknown, since "0 g" reads as a weightless parcel rather than an
 * unweighed one.
 */
export function describeWeight(weightKg: number | null | undefined): string {
  const kg = Number(weightKg ?? 0);
  if (!Number.isFinite(kg) || kg <= 0) {
    return '';
  }

  if (kg < 1) {
    return `${kilogramsToGrams(kg)} g`;
  }

  return `${Number(kg.toFixed(2))} kg`;
}
