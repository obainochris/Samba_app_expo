export type ProviderCategory = 'Hair' | 'Barber' | 'Makeup';
export type ServiceMode = 'home' | 'shop';

export interface Provider {
  id: string;
  name: string;
  firstName: string;
  category: ProviderCategory;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  distance: string;
  price: string;
  image: any;
  verified: boolean;
  availableToday: boolean;
  bio: string;
  services: { name: string; duration: string; price: string }[];
}

export const providers: Provider[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    firstName: 'Amara',
    category: 'Hair',
    specialty: 'Natural hair & protective styles',
    rating: 4.9,
    reviews: 128,
    location: 'Lekki Phase 1',
    distance: '1.8 km away',
    price: '₦15,000',
    image: require('@/assets/images/provider-stylist.jpg'),
    verified: true,
    availableToday: true,
    bio: 'I create soft, considered styles that help you feel like your best self. From knotless braids to silk presses, every appointment is unrushed and personal.',
    services: [
      { name: 'Knotless braids', duration: '3 hr 30 min', price: '₦35,000' },
      { name: 'Silk press', duration: '1 hr 30 min', price: '₦18,000' },
      { name: 'Wash & treatment', duration: '1 hr', price: '₦15,000' },
    ],
  },
  {
    id: 'tunde',
    name: 'Tunde Fade',
    firstName: 'Tunde',
    category: 'Barber',
    specialty: 'Sharp fades & beard care',
    rating: 4.8,
    reviews: 96,
    location: 'Yaba',
    distance: '3.2 km away',
    price: '₦8,000',
    image: require('@/assets/images/provider-barber.jpg'),
    verified: true,
    availableToday: true,
    bio: 'Clean lines, calm energy, and a cut that grows out beautifully. I bring the barbershop experience to your door or welcome you at the studio.',
    services: [
      { name: 'Signature fade', duration: '45 min', price: '₦8,000' },
      { name: 'Fade & beard sculpt', duration: '1 hr', price: '₦12,000' },
      { name: 'Kids cut', duration: '30 min', price: '₦5,000' },
    ],
  },
  {
    id: 'zuri',
    name: 'Zuri Beauty',
    firstName: 'Zuri',
    category: 'Makeup',
    specialty: 'Soft glam & bridal beauty',
    rating: 5.0,
    reviews: 74,
    location: 'Victoria Island',
    distance: '4.5 km away',
    price: '₦25,000',
    image: require('@/assets/images/provider-makeup.jpg'),
    verified: true,
    availableToday: false,
    bio: 'Makeup that still looks like you, just more rested. I specialise in soft glam for celebrations, photoshoots, and the moments you want to remember.',
    services: [
      { name: 'Soft glam', duration: '1 hr 15 min', price: '₦25,000' },
      { name: 'Bridal trial', duration: '2 hr', price: '₦40,000' },
      { name: 'Natural beat', duration: '45 min', price: '₦18,000' },
    ],
  },
];

export const categories = [
  { label: 'All', icon: 'sparkles' as const },
  { label: 'Hair', icon: 'cut' as const },
  { label: 'Barber', icon: 'person' as const },
  { label: 'Makeup', icon: 'color-palette' as const },
];