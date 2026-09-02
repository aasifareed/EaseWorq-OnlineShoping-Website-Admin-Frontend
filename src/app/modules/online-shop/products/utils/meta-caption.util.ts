import { ReelVoiceLanguage } from '../models/facebook-post.models';

const RTL = '\u200F';
const LTR = '\u200E';
const urduScriptPattern = /[\u0600-\u06FF]/;

export function usesUrduCaption(language: ReelVoiceLanguage): boolean {
  return language === 'Urdu' || language === 'RomanUrdu';
}

export function urduLine(text: string): string {
  return `${RTL}${text.trim()}`;
}

export function latin(text: string): string {
  return `${LTR}${text.trim()}${LTR}`;
}

export function normalizeUrduCaption(caption: string, productName?: string | null): string {
  if (!caption) {
    return caption;
  }

  return caption
    .split('\n')
    .map((line) => normalizeUrduCaptionLine(line, productName))
    .join('\n');
}

function normalizeUrduCaptionLine(line: string, productName?: string | null): string {
  const trimmed = line.trim();
  if (!trimmed) {
    return line;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return line;
  }

  if (trimmed.startsWith(RTL)) {
    return urduLine(fixKnownUrduLinePatterns(trimmed.slice(1), productName));
  }

  if (urduScriptPattern.test(trimmed)) {
    return urduLine(fixKnownUrduLinePatterns(trimmed, productName));
  }

  const titleMatch = /^🔥\s*(.+)$/.exec(trimmed);
  if (titleMatch && !urduScriptPattern.test(titleMatch[1])) {
    const compactName = titleMatch[1].replace(/\s/g, '');
    return urduLine(`🔥 ${latin(compactName)}`);
  }

  return line;
}

function fixKnownUrduLinePatterns(line: string, productName?: string | null): string {
  let text = line.trim();

  if (/GoPayFast/i.test(text) && text.includes('ادائیگی') && text.indexOf('GoPayFast') < text.indexOf('ادائیگی')) {
    return `💳 آن لائن ادائیگی ${latin('GoPayFast')}`;
  }

  if (text.includes('کی تفصیل')) {
    const name = (productName || '').trim().replace(/\s/g, '');
    if (name) {
      return `${latin(name)}${RTL} کی تفصیل`;
    }
  }

  if (urduScriptPattern.test(text) && text.includes('Rs.')) {
    text = text.replace(/:\s*Rs\.\s*([\d,]+)/g, (_match, amount: string) => `: ${latin(`Rs. ${amount}`)}`);
  }

  return text;
}

export function buildCaptionWithPriceChallenge(
  baseCaption: string,
  includePriceChallenge: boolean,
  priceChallengeUrl: string | null | undefined,
  language: ReelVoiceLanguage,
): string {
  const base = (baseCaption || '').trimEnd();
  const url = (priceChallengeUrl || '').trim();
  if (!includePriceChallenge || !url) {
    return base;
  }

  const block = usesUrduCaption(language)
    ? `${urduLine('🔥 کہیں اور سستا مل رہا ہے؟')}\n${urduLine('ہماری قیمت چیلنج کریں 👇')}\n\n${url}`
    : `🔥 Found it cheaper?\nChallenge our price 👇\n\n${url}`;
  return base ? `${base}\n\n${block}` : block;
}

export function ensureProductLinkInCaption(
  caption: string,
  productUrl: string | null | undefined,
  language: ReelVoiceLanguage,
  includesProductUrl: (captionText: string, url: string) => boolean,
): string {
  const url = (productUrl || '').trim();
  const text = (caption || '').trim();
  if (!url || includesProductUrl(text, url)) {
    return usesUrduCaption(language) ? normalizeUrduCaption(text) : text;
  }

  const block = usesUrduCaption(language)
    ? `${urduLine('🛒 آرڈر کریں:')}\n${url}`
    : `🛒 Order online:\n${url}`;
  const merged = text ? `${text}\n\n${block}` : block;
  return usesUrduCaption(language) ? normalizeUrduCaption(merged) : merged;
}
