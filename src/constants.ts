import { 
  CloudUpload, 
  RefreshCw, 
  LayoutGrid, 
  HelpCircle 
} from 'lucide-react';
import { NavItem, GalleryImage } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'upload', label: 'Upload', icon: CloudUpload },
  { id: 'processing', label: 'Processing', icon: RefreshCw },
  { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1506704906740-c44005160ef5?q=80&w=800&auto=format&fit=crop',
    filename: 'Arch_01_final.jpg',
    type: 'JPG'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1614032688757-0402e6005ae6?q=80&w=800&auto=format&fit=crop',
    filename: 'Macro_Mech_03.raw',
    type: 'RAW'
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    filename: 'Abstract_Vol_09.png',
    type: 'PNG'
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1512403754473-27835f7b3dfd?q=80&w=800&auto=format&fit=crop',
    filename: 'Interior_HQ_v2.jpg',
    type: 'JPG'
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop',
    filename: 'Data_Center_Align.tiff',
    type: 'TIFF'
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=800&auto=format&fit=crop',
    filename: 'Subject_Focus_01.jpg',
    type: 'JPG'
  }
];
