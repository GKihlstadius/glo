import { Linking, Platform, Alert } from 'react-native';
import { StreamingOffer } from './types';

// Provider display info with real branding
export const PROVIDER_INFO: Record<string, { name: string; color: string; icon: string; scheme?: string }> = {
  netflix: { name: 'Netflix', color: '#E50914', icon: 'N', scheme: 'nflx' },
  prime: { name: 'Prime', color: '#00A8E1', icon: 'P', scheme: 'aiv' },
  disney: { name: 'Disney+', color: '#113CCF', icon: 'D', scheme: 'disneyplus' },
  hbo: { name: 'Max', color: '#002BE7', icon: 'M', scheme: 'hbomax' },
  apple: { name: 'Apple TV+', color: '#000000', icon: 'A', scheme: 'videos' },
  viaplay: { name: 'Viaplay', color: '#FF0000', icon: 'V', scheme: 'viaplay' },
  svtplay: { name: 'SVT', color: '#1B5E20', icon: 'S', scheme: 'svtplay' },
  hulu: { name: 'Hulu', color: '#1CE783', icon: 'H', scheme: 'hulu' },
  paramount: { name: 'Paramount+', color: '#0064FF', icon: 'P+', scheme: 'paramountplus' },
  peacock: { name: 'Peacock', color: '#000000', icon: 'P', scheme: 'peacock' },
  mubi: { name: 'MUBI', color: '#000000', icon: 'M', scheme: 'mubi' },
  criterion: { name: 'Criterion', color: '#000000', icon: 'C' },
};

// Open streaming provider for a movie with fallback chain
export async function openStreamingProvider(offer: StreamingOffer): Promise<boolean> {
  const providerInfo = PROVIDER_INFO[offer.providerId];

  try {
    // Step 1: Try universal link / deep link first (best UX - opens app if installed)
    if (offer.deepLink) {
      const canOpen = await Linking.canOpenURL(offer.deepLink);
      if (canOpen) {
        await Linking.openURL(offer.deepLink);
        return true;
      }
    }

    // Step 2: Try URL scheme if available (iOS specific)
    if (Platform.OS === 'ios' && providerInfo?.scheme) {
      const schemeUrl = `${providerInfo.scheme}://`;
      const canOpen = await Linking.canOpenURL(schemeUrl);
      if (canOpen && offer.webUrl) {
        // Open the web URL which will redirect to app
        await Linking.openURL(offer.webUrl);
        return true;
      }
    }

    // Step 3: Fallback to web URL
    if (offer.webUrl) {
      await Linking.openURL(offer.webUrl);
      return true;
    }

    // No valid URL available
    console.log('No valid URL for provider:', offer.providerId);
    return false;
  } catch (error) {
    console.log('Failed to open streaming provider:', error);
    return false;
  }
}

// Check if a streaming app is installed
export async function isAppInstalled(providerId: string): Promise<boolean> {
  const providerInfo = PROVIDER_INFO[providerId];
  if (!providerInfo?.scheme) return false;

  try {
    const schemeUrl = `${providerInfo.scheme}://`;
    return await Linking.canOpenURL(schemeUrl);
  } catch {
    return false;
  }
}

// Sort offers by type (stream first, then rent, then buy)
export function sortOffersByType(offers: StreamingOffer[]): StreamingOffer[] {
  const typeOrder = { stream: 0, rent: 1, buy: 2 };
  return [...offers].sort(
    (a, b) => (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3)
  );
}

// Get primary streaming offer (first available stream)
export function getPrimaryOffer(offers: StreamingOffer[]): StreamingOffer | null {
  const sorted = sortOffersByType(offers);
  return sorted.find((o) => o.type === 'stream') || sorted[0] || null;
}

// Get provider display name
export function getProviderName(providerId: string): string {
  return PROVIDER_INFO[providerId]?.name || providerId;
}

// Get provider brand color
export function getProviderColor(providerId: string): string {
  return PROVIDER_INFO[providerId]?.color || '#666666';
}

// Format price for display
export function formatPrice(price: number | undefined, currency: string | undefined): string {
  if (!price) return '';
  const curr = currency || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// Get offer type label
export function getOfferTypeLabel(type: 'stream' | 'rent' | 'buy', lang: 'en' | 'sv' = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    stream: { en: 'Stream', sv: 'Streama' },
    rent: { en: 'Rent', sv: 'Hyr' },
    buy: { en: 'Buy', sv: 'Köp' },
  };
  return labels[type]?.[lang] || type;
}
