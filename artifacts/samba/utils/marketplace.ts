import type { MarketplaceProvider } from '@workspace/api-client-react';
import { Provider, providers } from '@/data/providers';

export function mergeMarketplaceProviders(remoteProviders?: MarketplaceProvider[]): Provider[] {
  if (!remoteProviders) return providers;

  return remoteProviders.flatMap((remote) => {
    const local = providers.find((provider) => provider.id === remote.id);
    if (!local) return [];
    return [{
      ...local,
      name: remote.name,
      firstName: remote.firstName,
      category: remote.category as Provider['category'],
      specialty: remote.specialty,
      rating: remote.rating,
      reviews: remote.reviews,
      location: remote.location,
      distance: remote.distance,
      price: remote.price,
      verified: remote.verified,
      availableToday: remote.availableToday,
      bio: remote.bio,
      latitude: remote.latitude,
      longitude: remote.longitude,
      serviceRadiusKm: remote.serviceRadiusKm,
      baseTravelFee: remote.baseTravelFee,
      travelFeePerKm: remote.travelFeePerKm,
      services: remote.services,
    }];
  });
}

export function getMarketplaceProvider(
  providerId: string,
  remoteProviders: MarketplaceProvider[] | undefined,
  hasFetched: boolean,
): Provider | undefined {
  const currentProviders = hasFetched ? mergeMarketplaceProviders(remoteProviders ?? []) : providers;
  return currentProviders.find((provider) => provider.id === providerId);
}
