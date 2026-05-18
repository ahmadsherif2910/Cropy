import { LucideIcon } from 'lucide-react';

export type Screen = 'upload' | 'processing' | 'gallery';

export interface NavItem {
  id: Screen | 'help';
  label: string;
  icon: LucideIcon;
}

export interface GalleryImage {
  id: string;
  url: string;
  filename: string;
  type: string;
}
