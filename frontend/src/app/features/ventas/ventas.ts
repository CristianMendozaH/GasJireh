import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface Client {
  name: string;
  limit: number;
  debt: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class Ventas {
  // Productos en existencia
  products = signal<Product[]>([
    { id: 25, name: 'CILINDRO 25 lb', price: 28.5, stock: 42 },
    { id: 35, name: 'CILINDRO 35 lb', price: 38.0, stock: 27 },
    { id: 100, name: 'CILINDRO 100 lb', price: 98.0, stock: 15 }
  ]);

  // Lista de clientes autorizados para crédito
  clients: Client[] = [
    { name: 'Restaurante El Fogón', limit: 5000, debt: 1550 },
    { name: 'Soda Doña Carmen', limit: 1500, debt: 0 },
    { name: 'Comedor San José', limit: 3000, debt: 1200 },
    { name: 'Pollería Los Arcos', limit: 2000, debt: 1900 }
  ];

  // Estado de la venta
  cart = signal<CartItem[]>([]);
  mode = signal<'Contado' | 'Crédito'>('Contado');
  selectedClient = signal<Client | null>(null);
  searchQuery = signal<string>('');
  showSearchResults = signal<boolean>(false);

  // Modales y Toasts
  showPriceModal = signal<boolean>(false);
  showOkModal = signal<boolean>(false);
  toastMessage = signal<string | null>(null);
  toastTimeout: any;

  // Precios temporales para el modal de edición
  p25Price: number = 28.5;
  p35Price: number = 38.0;
  p100Price: number = 98.0;

  // Resumen de la venta completada
  completedSale = signal<{ client: string; mode: string; total: number }>({
    client: '',
    mode: '',
    total: 0
  });

  // Cálculos computados
  total = computed(() =>
    this.cart().reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.clients;
    return this.clients.filter(c => c.name.toLowerCase().includes(q));
  });

  overCreditLimit = computed(() => {
    if (this.mode() !== 'Crédito' || !this.selectedClient()) return false;
    const client = this.selectedClient()!;
    const available = client.limit - client.debt;
    return this.total() > available;
  });

  excessAmount = computed(() => {
    if (!this.selectedClient()) return 0;
    const available = this.selectedClient()!.limit - this.selectedClient()!.debt;
    return Math.max(0, this.total() - available);
  });

  // Métodos auxiliares
  inCart(id: number): number {
    return this.cart()
      .filter(item => item.id === id)
      .reduce((sum, item) => sum + item.qty, 0);
  }

  getAvailableCredit(client: Client): number {
    return client.limit - client.debt;
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 2600);
  }

  // Acciones del Carrito
  addToCart(product: Product) {
    if (this.inCart(product.id) >= product.stock) {
      this.showToast(`Sin stock disponible de ${product.id} lb`);
      return;
    }

    const currentCart = [...this.cart()];
    const existingIndex = currentCart.findIndex(item => item.id === product.id && item.price === product.price);

    if (existingIndex > -1) {
      currentCart[existingIndex].qty++;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      });
    }

    this.cart.set(currentCart);
  }

  updateQty(index: number, change: number) {
    const currentCart = [...this.cart()];
    const item = currentCart[index];
    const product = this.products().find(p => p.id === item.id);

    if (change > 0 && product && this.inCart(item.id) >= product.stock) {
      this.showToast(`Sin más stock de ${item.id} lb`);
      return;
    }

    item.qty += change;
    if (item.qty <= 0) {
      currentCart.splice(index, 1);
    }

    this.cart.set(currentCart);
  }

  removeItem(index: number) {
    const currentCart = [...this.cart()];
    currentCart.splice(index, 1);
    this.cart.set(currentCart);
  }

  setMode(newMode: 'Contado' | 'Crédito') {
    this.mode.set(newMode);
  }

  // Selección de cliente
  selectClient(client: Client) {
    this.selectedClient.set(client);
    this.searchQuery.set('');
    this.showSearchResults.set(false);
  }

  removeSelectedClient() {
    this.selectedClient.set(null);
  }

  onSearchFocus() {
    this.showSearchResults.set(true);
  }

  onSearchBlur() {
    // Retardo leve para permitir hacer click en los resultados
    setTimeout(() => this.showSearchResults.set(false), 200);
  }

  // Proceso de completar la venta
  completeSale() {
    const currentTotal = this.total();
    const isCredit = this.mode() === 'Crédito';
    const clientName = isCredit ? this.selectedClient()!.name : 'Cliente de mostrador';

    // Descuenta stock
    this.products.update(prods =>
      prods.map(p => {
        const item = this.cart().find(c => c.id === p.id);
        return item ? { ...p, stock: p.stock - item.qty } : p;
      })
    );

    // Suma deuda si es crédito
    if (isCredit && this.selectedClient()) {
      this.selectedClient()!.debt += currentTotal;
    }

    this.completedSale.set({
      client: clientName,
      mode: this.mode(),
      total: currentTotal
    });

    this.cart.set([]);
    this.showOkModal.set(true);
  }

  finishSale() {
    this.showOkModal.set(false);
    this.selectedClient.set(null);
    this.showToast('Venta finalizada');
  }

  // Gestión de Precios
  openPriceModal() {
    const prods = this.products();
    this.p25Price = prods.find(p => p.id === 25)?.price || 0;
    this.p35Price = prods.find(p => p.id === 35)?.price || 0;
    this.p100Price = prods.find(p => p.id === 100)?.price || 0;
    this.showPriceModal.set(true);
  }

  closePriceModal() {
    this.showPriceModal.set(false);
  }

  savePrices() {
    if (this.p25Price <= 0 || this.p35Price <= 0 || this.p100Price <= 0) {
      this.showToast('Ingresa un precio válido en todos los campos');
      return;
    }

    this.products.update(prods =>
      prods.map(p => {
        if (p.id === 25) return { ...p, price: this.p25Price };
        if (p.id === 35) return { ...p, price: this.p35Price };
        if (p.id === 100) return { ...p, price: this.p100Price };
        return p;
      })
    );

    this.closePriceModal();
    this.showToast('Precios actualizados');
  }
}
