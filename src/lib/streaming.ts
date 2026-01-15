import { Linking, Platform } from 'react-native';
import { StreamingOffer } from './types';

// Provider display info
export const PROVIDER_INFO: Record<string, { name: string; color: string; icon: string }> = {
  netflix: { name: 'Netflix', color: '#E50914', icon: 'N' },
  prime: { name: 'Prime', color: '#00A8E1', icon: 'P' },
  disney: { name: 'Disney+', color: '#113CCF', icon: 'D' },
  hbo: { name: 'Max', color: '#002BE7', icon: 'M' },
  apple: { name: 'Apple TV+', color: '#000000', icon: 'A' },
  viaplay: { name: 'Viaplay', color: '#FF0000', icon: 'V' },
  svtplay: { name: 'SVT', color: '#1B5E20', icon: 'S' },
  hulu: { name: 'Hulu', color: '#1CE783', icon: 'H' },
};

// Open streaming provider for a movie
export async function openStreamingProvider(offer: StreamingOffer): Promise<boolean> {
  try {
    // Prefer universal/deep link (works across platforms)
    if (offer.deepLink) {
      const canOpen = await Linking.canOpenURL(offer.deepLink);
      if (canOpen) {
        await Linking.openURL(offer.deepLink);
        return true;
      }
    }

    // Fallback to web URL
    if (offer.webUrl) {
      await Linking.openURL(offer.webUrl);
      return true;
    }

    return false;
  } catch (error) {
    console.log('Failed to open streaming provider:', error);
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
