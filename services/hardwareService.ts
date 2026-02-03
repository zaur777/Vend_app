
import { HardwareLog, Product } from '../types';
import { MOCK_PRODUCTS } from '../constants';

/**
 * LB-140 Protocol Simulator
 * Handles communication logic for the Raspberry Pi 4 to LB-140 Board.
 * Standard frame format: [STX: 0x02] [CMD] [DATA_LEN] [DATA...] [ETX: 0x03] [CSUM]
 */

export const LB140_COMMANDS = {
  VEND: 0x56,      // 'V'
  STATUS: 0x53,    // 'S'
  RESET: 0x52,     // 'R'
  TEMP: 0x54,      // 'T'
  MOTOR_TEST: 0x4D // 'M'
};

class HardwareService {
  private logs: HardwareLog[] = [];
  // Initialize with 60 slots (6 trays of 10)
  private inventory: Product[] = Array.from({ length: 60 }, (_, i) => ({
    ...MOCK_PRODUCTS[i % MOCK_PRODUCTS.length],
    id: `slot-${i + 1}`, // Unique ID per slot/motor
  }));
  private listeners: (() => void)[] = [];

  private addLog(direction: 'IN' | 'OUT', payload: string, description: string) {
    const newLog = {
      timestamp: new Date().toISOString(),
      direction,
      payload,
      description
    };
    this.logs = [newLog, ...this.logs].slice(0, 50);
    console.log(`[LB-140 ${direction}] ${payload}: ${description}`);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getInventory(): Product[] {
    return this.inventory;
  }

  updateStock(productId: string, newStock: number) {
    const idx = this.inventory.findIndex(p => p.id === productId);
    if (idx !== -1) {
      this.inventory[idx] = { ...this.inventory[idx], stock: newStock };
      this.notify();
    }
  }

  decrementStock(productId: string, amount: number) {
    const idx = this.inventory.findIndex(p => p.id === productId);
    if (idx !== -1) {
      const current = this.inventory[idx].stock;
      this.inventory[idx] = { ...this.inventory[idx], stock: Math.max(0, current - amount) };
      this.notify();
    }
  }

  async sendCommand(cmd: number, data: number[] = []): Promise<string> {
    const payload = `02 ${cmd.toString(16).padStart(2, '0')} ${data.length.toString(16).padStart(2, '0')} ${data.map(d => d.toString(16).padStart(2, '0')).join(' ')} 03`;
    this.addLog('OUT', payload, `Sending command 0x${cmd.toString(16).toUpperCase()}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = `02 06 00 03`; 
    this.addLog('IN', response, 'Received ACK from LB-140');
    return response;
  }

  async dispenseItem(motorId: number): Promise<boolean> {
    try {
      await this.sendCommand(LB140_COMMANDS.VEND, [motorId]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.addLog('IN', '02 44 01 00 03', `Item dispensed successfully from motor ${motorId}`);
      return true;
    } catch (e) {
      this.addLog('IN', '02 45 01 01 03', 'Dispense failed: Motor Jam');
      return false;
    }
  }

  getLogs() {
    return this.logs;
  }
}

export const hardwareService = new HardwareService();
