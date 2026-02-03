
export enum MachineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  LOW_STOCK = 'LOW_STOCK'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  calories: number;
  description: string;
}

export interface Machine {
  id: string;
  name: string;
  location: string;
  status: MachineStatus;
  inventory: Product[];
  revenue24h: number;
  lastService: string;
  hardware: {
    board: string;
    os: string;
    temperature: number;
    uptime: string;
    firmwareVersion: string;
  };
}

export interface HardwareLog {
  timestamp: string;
  direction: 'IN' | 'OUT';
  payload: string;
  description: string;
}

export type AppView = 'VENDING' | 'ADMIN' | 'MERCHANDISER';
