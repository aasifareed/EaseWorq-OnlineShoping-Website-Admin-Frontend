import { ReelVoiceLanguage } from '../models/facebook-post.models';

const RTL = '\u200F';
const LTR = '\u200E';
const LRI = '\u2066';
const PDI = '\u2069';
const urduScriptPattern = /[\u0600-\u06FF]/;
const hashtagTokenPattern = /#[\p{L}\p{Nd}_]+/gu;
const bidiMarkPattern = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export function usesUrduCaption(language: ReelVoiceLanguage): boolean {
  return language === 'Urdu' || language === 'RomanUrdu';
}

export function urduLine(text: string): string {
  return `${RTL}${text.trim()}`;
}

export function latin(text: string): string {
  return `${LTR}${text.trim()}${LTR}`;
}

export function ltrIsolate(text: string): string {
  const cleaned = stripBidiMarks(text).trim();
  return cleaned ? `${LRI}${cleaned}${PDI}` : '';
}

export function stripBidiMarks(text: string): string {
  return (text || '').replace(bidiMarkPattern, '');
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

  const plain = stripBidiMarks(trimmed).trim();
  if (!plain) {
    return '';
  }

  if (/^https?:\/\//i.test(plain)) {
    return ltrIsolate(plain);
  }

  if (isHashtagLine(plain)) {
    return ltrIsolate(normalizeHashtagLine(plain));
  }

  if (trimmed.startsWith(RTL)) {
    return urduLine(fixKnownUrduLinePatterns(plain, productName));
  }

  if (urduScriptPattern.test(plain)) {
    return urduLine(fixKnownUrduLinePatterns(plain, productName));
  }

  const titleMatch = /^🔥\s*(.+)$/.exec(plain);
  if (titleMatch && !urduScriptPattern.test(titleMatch[1])) {
    const compactName = titleMatch[1].replace(/\s/g, '');
    return urduLine(`🔥 ${latin(compactName)}`);
  }

  return plain;
}

function isHashtagLine(line: string): boolean {
  const plain = stripBidiMarks(line).trim();
  if (!plain.includes('#')) {
    return false;
  }
  if (urduScriptPattern.test(plain)) {
    return false;
  }
  const withoutTags = plain.replace(hashtagTokenPattern, ' ').replace(/[\s,_-]+/g, '');
  return !withoutTags || plain.startsWith('#');
}

function normalizeHashtagLine(line: string): string {
  const plain = stripBidiMarks(line).trim();
  const tags = plain.match(hashtagTokenPattern) || [];
  const unique: string[] = [];
  for (const tag of tags) {
    if (!unique.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      unique.push(tag);
    }
  }
  return unique.length ? unique.join(' ') : plain;
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
    return usesUrduCaption(language) ? normalizeUrduCaption(base) : base;
  }

  const block = usesUrduCaption(language)
    ? `${urduLine('🔥 کہیں اور سستا مل رہا ہے؟')}\n${urduLine('ہماری قیمت چیلنج کریں 👇')}\n\n${ltrIsolate(url)}`
    : `🔥 Found it cheaper?\nChallenge our price 👇\n\n${url}`;
  const merged = base ? `${base}\n\n${block}` : block;
  return usesUrduCaption(language) ? normalizeUrduCaption(merged) : merged;
}

export function ensureProductLinkInCaption(
  caption: string,
  productUrl: string | null | undefined,
  language: ReelVoiceLanguage,
  includesProductUrl: (captionText: string, url: string) => boolean,
): string {
  const url = (productUrl || '').trim();
  const text = (caption || '').trim();
  if (!url || includesProductUrl(stripBidiMarks(text), url)) {
    return usesUrduCaption(language) ? normalizeUrduCaption(text) : text;
  }

  const block = usesUrduCaption(language)
    ? `${urduLine('🛒 آرڈر کریں:')}\n${ltrIsolate(url)}`
    : `🛒 Order online:\n${url}`;
  const merged = text ? `${text}\n\n${block}` : block;
  return usesUrduCaption(language) ? normalizeUrduCaption(merged) : merged;
}
