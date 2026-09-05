export type HouseCallStatus = 'confirmed' | 'driving' | 'arrived' | 'in-progress' | 'completed';

export const houseCallSteps: { status: HouseCallStatus; label: string; icon: 'check-circle' | 'navigation' | 'map-pin' | 'scissors' | 'award' }[] = [
  { status: 'confirmed', label: 'Confirmed', icon: 'check-circle' },
  { status: 'driving', label: 'Driving', icon: 'navigation' },
  { status: 'arrived', label: 'Arrived', icon: 'map-pin' },
  { status: 'in-progress', label: 'In progress', icon: 'scissors' },
  { status: 'completed', label: 'Completed', icon: 'award' },
];

export function distanceInKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((latitudeB - latitudeA) * Math.PI) / 180;
  const longitudeDelta = ((longitudeB - longitudeA) * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos((latitudeA * Math.PI) / 180) *
      Math.cos((latitudeB * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateTravelFee(distanceKm: number, baseFee: number, perKm: number) {
  return Math.round((baseFee + Math.max(0, distanceKm - 2) * perKm) / 100) * 100;
}

export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function parseNaira(value: string) {
  const amount = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

export function getEtaMinutes(distanceKm: number) {
  return Math.max(15, Math.round(distanceKm * 5 + 10));
}