
import { Product, Machine, MachineStatus } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Daily Multivitamin', 
    price: 24.99, 
    category: 'Daily Care', 
    stock: 12, 
    calories: 5, 
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&h=400&auto=format&fit=crop', 
    description: 'Essential nutrients for overall health and energy.' 
  },
  { 
    id: '2', 
    name: 'Vitamin C + Zinc', 
    price: 18.50, 
    category: 'Immunity', 
    stock: 5, 
    calories: 2, 
    image: 'https://images.unsplash.com/photo-1616671285410-09371752174c?q=80&w=400&h=400&auto=format&fit=crop', 
    description: 'Immune support with high-potency Vitamin C.' 
  },
  { 
    id: '3', 
    name: 'Magnesium Glycinate', 
    price: 22.00, 
    category: 'Recovery', 
    stock: 20, 
    calories: 0, 
    image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9bb0720?q=80&w=400&h=400&auto=format&fit=crop', 
    description: 'High absorption formula for sleep and muscle relaxation.' 
  },
  { 
    id: '4', 
    name: 'Omega-3 Fish Oil', 
    price: 29.99, 
    category: 'Heart Health', 
    stock: 8, 
    calories: 15, 
    image: 'https://images.unsplash.com/photo-1550573105-18968516d203?q=80&w=400&h=400&auto=format&fit=crop', 
    description: 'Purity-certified EPA and DHA for heart and brain.' 
  },
  { 
    id: '5', 
    name: 'Vitamin D3 + K2', 
    price: 19.25, 
    category: 'Bone Health', 
    stock: 15, 
    calories: 0, 
    image: 'https://images.unsplash.com/photo-1628771065518-0d82f1110531?q=80&w=400&h=400&auto=format&fit=crop', 
    description: 'Synergistic pair for bone density and calcium absorption.' 
  },
  { 
    id: '6', 
    name: 'B-Complex Active', 
    price: 16.75, 
    category: 'Daily Care', 
    stock: 3, 
    calories: 2, 
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=400&h=400&auto=format&fit=crop', 
    description: 'Methylated B-vitamins for cognitive function and metabolism.' 
  },
];

export const MOCK_MACHINES: Machine[] = Array.from({ length: 100 }, (_, i) => ({
  id: `VM-${100 + i}`,
  name: `VendMaster ${100 + i}`,
  location: ['Terminal A', 'Main Plaza', 'Station East', 'Tech Hub', 'Campus North'][i % 5],
  status: i % 15 === 0 ? MachineStatus.OFFLINE : i % 8 === 0 ? MachineStatus.LOW_STOCK : MachineStatus.ONLINE,
  revenue24h: Math.floor(Math.random() * 500) + 50,
  inventory: [...MOCK_PRODUCTS],
  lastService: '2023-10-24',
  hardware: {
    board: 'LB-140 Control Board',
    os: 'Raspberry Pi OS (Bullseye)',
    temperature: 42 + Math.random() * 5,
    uptime: '14 days, 2 hours',
    firmwareVersion: 'v1.4.0-LB140'
  }
}));
