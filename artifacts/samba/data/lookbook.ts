import { ImageSourcePropType } from 'react-native';

export type LookbookCategory = 'Hair' | 'Braids' | 'Makeup' | 'Barber';

export type LookbookLook = {
  id: string;
  providerId: string;
  artist: string;
  serviceName: string;
  category: LookbookCategory;
  tags: string[];
  caption: string;
  likes: number;
  image: ImageSourcePropType;
};

export const lookbookLooks: LookbookLook[] = [
  {
    id: 'amara-knotless',
    providerId: 'amara',
    artist: 'Amara Okafor',
    serviceName: 'Knotless braids',
    category: 'Braids',
    tags: ['Knotless', 'Protective'],
    caption: 'Clean parts, soft finish, and a style that moves with you.',
    likes: 248,
    image: require('@/assets/images/provider-stylist.jpg'),
  },
  {
    id: 'amara-silk-press',
    providerId: 'amara',
    artist: 'Amara Okafor',
    serviceName: 'Silk press',
    category: 'Hair',
    tags: ['Silk press', 'Natural hair'],
    caption: 'A glossy, bouncy press made for your next good hair day.',
    likes: 192,
    image: require('@/assets/images/provider-stylist.jpg'),
  },
  {
    id: 'tunde-signature',
    providerId: 'tunde',
    artist: 'Tunde Fade',
    serviceName: 'Signature fade',
    category: 'Barber',
    tags: ['Fade', 'Sharp lines'],
    caption: 'Crisp around the edges, easy everywhere else.',
    likes: 176,
    image: require('@/assets/images/provider-barber.jpg'),
  },
  {
    id: 'tunde-beard',
    providerId: 'tunde',
    artist: 'Tunde Fade',
    serviceName: 'Fade & beard sculpt',
    category: 'Barber',
    tags: ['Beard', 'Grooming'],
    caption: 'A full reset with a sculpted finish that grows out well.',
    likes: 143,
    image: require('@/assets/images/provider-barber.jpg'),
  },
  {
    id: 'zuri-soft-glam',
    providerId: 'zuri',
    artist: 'Zuri Beauty',
    serviceName: 'Soft glam',
    category: 'Makeup',
    tags: ['Soft glam', 'Glow'],
    caption: 'More rested, still completely you.',
    likes: 321,
    image: require('@/assets/images/provider-makeup.jpg'),
  },
  {
    id: 'zuri-natural-beat',
    providerId: 'zuri',
    artist: 'Zuri Beauty',
    serviceName: 'Natural beat',
    category: 'Makeup',
    tags: ['Natural', 'Everyday'],
    caption: 'Fresh skin and just enough definition for the camera.',
    likes: 214,
    image: require('@/assets/images/provider-makeup.jpg'),
  },
];

export const lookbookFilters: { label: string; value: 'All' | LookbookCategory }[] = [
  { label: 'All looks', value: 'All' },
  { label: 'Hair', value: 'Hair' },
  { label: 'Braids', value: 'Braids' },
  { label: 'Makeup', value: 'Makeup' },
  { label: 'Barber', value: 'Barber' },
];