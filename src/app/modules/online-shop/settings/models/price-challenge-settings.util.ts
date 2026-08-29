export type PriceChallengeBeatStrategy = 'amount' | 'percent' | 'both';

export type PriceChallengeCannotBeatSafelyAction = 'ManualReview' | 'Decline';

export const PRICE_CHALLENGE_BEAT_STRATEGIES: ReadonlyArray<{
  value: PriceChallengeBeatStrategy;
  label: string;
  help: string;
}> = [
  {
    value: 'amount',
    label: 'Fixed amount below competitor',
    help: 'Customer offer = competitor price minus the fixed amount (e.g. Rs. 20).',
  },
  {
    value: 'percent',
    label: 'Percentage below competitor',
    help: 'Customer offer = competitor price minus the percentage you set.',
  },
  {
    value: 'both',
    label: 'Fixed amount and percentage',
    help: 'We calculate both options and use whichever gives the customer the lower price (bigger beat).',
  },
];

export const PRICE_CHALLENGE_UNSAFE_BEAT_ACTIONS: ReadonlyArray<{
  value: PriceChallengeCannotBeatSafelyAction;
  label: string;
}> = [
  { value: 'ManualReview', label: 'Send for manual review' },
  { value: 'Decline', label: 'Decline automatically' },
];

export const DEFAULT_PRICE_CHALLENGE_MAXIMUM_DISCOUNT_PERCENT = 15;

/** Mirrors server-side beat-price calculation for the admin summary box. */
export function computePriceChallengeDesiredBeatPrice(
  competitorPrice: number,
  beatByAmount?: number | null,
  beatByPercent?: number | null,
): number {
  let byAmount: number | null = null;
  let byPercent: number | null = null;

  if (beatByAmount != null && beatByAmount > 0) {
    byAmount = roundMoney(competitorPrice - beatByAmount);
  }

  if (beatByPercent != null && beatByPercent > 0) {
    const factor = 1 - Math.min(beatByPercent, 100) / 100;
    byPercent = roundMoney(competitorPrice * factor);
  }

  if (byAmount != null && byPercent != null) {
    return Math.min(byAmount, byPercent);
  }
  if (byAmount != null) {
    return byAmount;
  }
  if (byPercent != null) {
    return byPercent;
  }
  return competitorPrice;
}

export function inferPriceChallengeBeatStrategy(
  beatByAmount?: number | null,
  beatByPercent?: number | null,
): PriceChallengeBeatStrategy {
  const hasAmount = beatByAmount != null && beatByAmount > 0;
  const hasPercent = beatByPercent != null && beatByPercent > 0;
  if (hasAmount && hasPercent) {
    return 'both';
  }
  if (hasPercent) {
    return 'percent';
  }
  return 'amount';
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
