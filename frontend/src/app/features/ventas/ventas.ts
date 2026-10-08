import {
  Component,
  OnInit,
  signal,
  computed,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import {
  VentasService,
  ProductoApi,
  InventarioApi,
  ClienteApi,
  CrearVentaRequest
} from './ventas.service';


interface Product {
  id: number;
  name: string;
  pesoLb: number;
  price: number;
  stock: number;
}


interface Client {
  id: number;
  name: string;
  telefono: string | null;
  limit: number;
  debt: number;
  estado: string;
}


interface CuentaCobrarApi {
  cliente: { id: number } | null;
  saldoPendiente: string | number;
  estado: string;
}

interface CartItem {
  id: number;
  name: string;
  pesoLb: number;
  price: number;
  qty: number;
  vaciosRecibidos: number;
}


@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class Ventas implements OnInit {

  private readonly ventasService = inject(VentasService);
  private readonly http = inject(HttpClient);


  // =========================================================
  // DATOS PRINCIPALES
  // =========================================================

  products = signal<Product[]>([]);

  clients = signal<Client[]>([]);

  cart = signal<CartItem[]>([]);

  mode = signal<'Contado' | 'Crédito'>('Contado');

  selectedClient = signal<Client | null>(null);

  searchQuery = signal<string>('');

  showSearchResults = signal<boolean>(false);


  // =========================================================
  // ESTADOS DE CARGA
  // =========================================================

  loadingData = signal<boolean>(false);

  processingSale = signal<boolean>(false);

  savingPrices = signal<boolean>(false);


  // =========================================================
  // MODALES Y NOTIFICACIONES
  // =========================================================

  showPriceModal = signal<boolean>(false);

  showOkModal = signal<boolean>(false);

  toastMessage = signal<string | null>(null);

  toastTimeout: any;


  // =========================================================
  // PRECIOS DEL MODAL
  // =========================================================

  p25Price: number = 0;

  p35Price: number = 0;

  p100Price: number = 0;


  // =========================================================
  // RESUMEN DE VENTA COMPLETADA
  // =========================================================

  completedSale = signal<{
    client: string;
    mode: string;
    total: number;
  }>({
    client: '',
    mode: '',
    total: 0
  });


  // =========================================================
  // CÁLCULOS
  // =========================================================

  total = computed(() =>
    this.cart().reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    )
  );


  filteredClients = computed(() => {

    const q = this.searchQuery()
      .toLowerCase()
      .trim();

    const clientes = this.clients();

    if (!q) {
      return clientes;
    }

    return clientes.filter(client =>
      client.name.toLowerCase().includes(q)
    );

  });


  overCreditLimit = computed(() => {

    if (
      this.mode() !== 'Crédito' ||
      !this.selectedClient()
    ) {
      return false;
    }

    const client = this.selectedClient()!;

    const available =
      client.limit - client.debt;

    return this.total() > available;

  });


  excessAmount = computed(() => {

    const client = this.selectedClient();

    if (!client) {
      return 0;
    }

    const available =
      client.limit - client.debt;

    return Math.max(
      0,
      this.total() - available
    );

  });


  // =========================================================
  // INICIO DEL COMPONENTE
  // =========================================================

  ngOnInit(): void {

    this.cargarDatos();

  }


  // =========================================================
  // CARGAR PRODUCTOS + INVENTARIO + CLIENTES
  // =========================================================

  cargarDatos(): void {

    this.loadingData.set(true);

    forkJoin({
      productos: this.ventasService.getProductos(),
      inventario: this.ventasService.getInventario(),
      clientes: this.ventasService.getClientes(),
      cuentas: this.http.get<CuentaCobrarApi[]>('http://localhost:3000/cuentas-cobrar')
    }).subscribe({

      next: ({
        productos,
        inventario,
        clientes,
        cuentas
      }) => {

        this.procesarProductos(
          productos,
          inventario
        );

        this.procesarClientes(
          clientes,
          cuentas
        );

        this.loadingData.set(false);

        console.log(
          'Productos cargados:',
          this.products()
        );

        console.log(
          'Clientes cargados:',
          this.clients()
        );

      },

      error: (error) => {

        console.error(
          'Error cargando datos de ventas:',
          error
        );

        this.loadingData.set(false);

        this.showToast(
          'No se pudieron cargar los datos de ventas'
        );

      }

    });

  }


  // =========================================================
  // CONVERTIR PRODUCTOS DEL BACKEND AL FORMATO DE LA UI
  // =========================================================

  private procesarProductos(
    productos: ProductoApi[],
    inventario: InventarioApi[]
  ): void {

    const productosUi: Product[] =
      productos

        .filter(producto =>
          producto.activo !== false
        )

        .map(producto => {

          const registroStock =
            inventario.find(item =>
              item.productoId === producto.id &&
              item.estado === 'LLENO'
            );

          return {

            id: producto.id,

            name: producto.nombre.toUpperCase(),

            pesoLb: Number(
              producto.pesoLb
            ),

            price: Number(
              producto.precio
            ),

            stock: Number(
              registroStock?.cantidad ?? 0
            )

          };

        })

        .sort(
          (a, b) =>
            a.pesoLb - b.pesoLb
        );


    this.products.set(
      productosUi
    );

  }


  // =========================================================
  // CONVERTIR CLIENTES DEL BACKEND AL FORMATO DE LA UI
  // =========================================================

  private procesarClientes(
    clientes: ClienteApi[],
    cuentas: CuentaCobrarApi[]
  ): void {

    const deudasPorCliente = new Map<number, number>();

    for (const cuenta of cuentas) {
      if (!cuenta.cliente || cuenta.estado === 'PAGADA') continue;
      const saldo = Number(cuenta.saldoPendiente);
      if (!Number.isFinite(saldo) || saldo <= 0) continue;
      const id = cuenta.cliente.id;
      deudasPorCliente.set(id, (deudasPorCliente.get(id) ?? 0) + saldo);
    }

    const clientesUi: Client[] =
      clientes

        .filter(cliente =>
          cliente.estado === 'ACTIVO'
        )

        .map(cliente => ({

          id: cliente.id,

          name: cliente.nombre,

          telefono:
            cliente.telefono ?? null,

          limit: Number(
            cliente.limiteCredito ?? 0
          ),

          debt: deudasPorCliente.get(cliente.id) ?? 0,

          estado:
            cliente.estado

        }))

        .filter(cliente =>
          cliente.limit > 0
        );


    this.clients.set(
      clientesUi
    );

    // Sincronizar también el cliente que permanece seleccionado.
    const seleccionado = this.selectedClient();
    if (seleccionado) {
      this.selectedClient.set(clientesUi.find(c => c.id === seleccionado.id) ?? null);
    }

  }


  // =========================================================
  // FUNCIONES AUXILIARES
  // =========================================================

  inCart(id: number): number {

    return this.cart()

      .filter(item =>
        item.id === id
      )

      .reduce(
        (sum, item) =>
          sum + item.qty,
        0
      );

  }


  getAvailableCredit(
    client: Client
  ): number {

    return Math.max(
      0,
      client.limit - client.debt
    );

  }


  showToast(
    message: string
  ): void {

    this.toastMessage.set(
      message
    );

    clearTimeout(
      this.toastTimeout
    );

    this.toastTimeout =
      setTimeout(
        () =>
          this.toastMessage.set(null),
        3000
      );

  }


  // =========================================================
  // AGREGAR PRODUCTO AL CARRITO
  // =========================================================

  addToCart(
    product: Product
  ): void {

    if (
      this.inCart(product.id) >=
      product.stock
    ) {

      this.showToast(
        `Sin stock disponible de ${product.pesoLb} lb`
      );

      return;

    }


    const currentCart =
      this.cart().map(item => ({
        ...item
      }));


    const existingIndex =
      currentCart.findIndex(
        item =>
          item.id === product.id
      );


    if (
      existingIndex > -1
    ) {

      currentCart[
        existingIndex
      ].qty++;

    } else {

      currentCart.push({

        id: product.id,

        name: product.name,

        pesoLb: product.pesoLb,

        price: product.price,

        qty: 1,

        vaciosRecibidos: 0

      });

    }


    this.cart.set(
      currentCart
    );

  }


  // =========================================================
  // CAMBIAR CANTIDAD
  // =========================================================

  updateQty(
    index: number,
    change: number
  ): void {

    const currentCart =
      this.cart().map(item => ({
        ...item
      }));


    const item =
      currentCart[index];


    if (!item) {
      return;
    }


    const product =
      this.products().find(
        product =>
          product.id === item.id
      );


    if (
      change > 0 &&
      product &&
      this.inCart(item.id) >=
      product.stock
    ) {

      this.showToast(
        `Sin más stock de ${item.pesoLb} lb`
      );

      return;

    }


    item.qty += change;


    if (
      item.qty <= 0
    ) {

      currentCart.splice(
        index,
        1
      );

    } else {

      if (
        item.vaciosRecibidos >
        item.qty
      ) {

        item.vaciosRecibidos =
          item.qty;

      }

    }


    this.cart.set(
      currentCart
    );

  }


  // =========================================================
  // CAMBIAR VACÍOS RECIBIDOS
  // =========================================================

  updateVacios(
    index: number,
    value: number
  ): void {

    const currentCart =
      this.cart().map(item => ({
        ...item
      }));


    const item =
      currentCart[index];


    if (!item) {
      return;
    }


    let cantidad =
      Number(value);


    if (
      !Number.isFinite(cantidad) ||
      cantidad < 0
    ) {

      cantidad = 0;

    }


    cantidad =
      Math.floor(cantidad);


    if (
      cantidad > item.qty
    ) {

      cantidad =
        item.qty;

      this.showToast(
        'Los vacíos recibidos no pueden superar la cantidad vendida'
      );

    }


    item.vaciosRecibidos =
      cantidad;


    this.cart.set(
      currentCart
    );

  }


  // =========================================================
  // ELIMINAR PRODUCTO
  // =========================================================

  removeItem(
    index: number
  ): void {

    const currentCart =
      [...this.cart()];


    currentCart.splice(
      index,
      1
    );


    this.cart.set(
      currentCart
    );

  }


  // =========================================================
  // CONTADO / CRÉDITO
  // =========================================================

  setMode(
    newMode:
      'Contado' |
      'Crédito'
  ): void {

    this.mode.set(
      newMode
    );


    if (
      newMode === 'Contado'
    ) {

      this.selectedClient.set(
        null
      );

      this.searchQuery.set(
        ''
      );

      this.showSearchResults.set(
        false
      );

    }

  }


  // =========================================================
  // CLIENTE
  // =========================================================

  selectClient(
    client: Client
  ): void {

    this.selectedClient.set(
      client
    );

    this.searchQuery.set(
      ''
    );

    this.showSearchResults.set(
      false
    );

  }


  removeSelectedClient(): void {

    this.selectedClient.set(
      null
    );

  }


  onSearchFocus(): void {

    this.showSearchResults.set(
      true
    );

  }


  onSearchBlur(): void {

    setTimeout(
      () =>
        this.showSearchResults.set(false),
      200
    );

  }


  // =========================================================
  // COMPLETAR VENTA
  // =========================================================

  completeSale(): void {

    if (
      this.processingSale()
    ) {
      return;
    }


    if (
      this.cart().length === 0
    ) {

      this.showToast(
        'Agrega al menos un producto'
      );

      return;

    }


    const isCredit =
      this.mode() === 'Crédito';


    if (
      isCredit &&
      !this.selectedClient()
    ) {

      this.showToast(
        'Selecciona un cliente'
      );

      return;

    }


    if (
      this.overCreditLimit()
    ) {

      this.showToast(
        'La venta supera el crédito disponible'
      );

      return;

    }


    const venta:
      CrearVentaRequest = {

      tipo:
        isCredit
          ? 'CREDITO'
          : 'CONTADO',

      detalles:
        this.cart().map(
          item => ({

            productoId:
              item.id,

            cantidad:
              item.qty,

            vaciosRecibidos:
              item.vaciosRecibidos

          })
        )

    };


    if (
      isCredit &&
      this.selectedClient()
    ) {

      venta.clienteId =
        this.selectedClient()!.id;

    }


    const currentTotal =
      this.total();


    const clientName =
      isCredit
        ? this.selectedClient()!.name
        : 'Cliente de mostrador';


    this.processingSale.set(
      true
    );


    this.ventasService
      .crearVenta(venta)
      .subscribe({

        next: (response) => {

          console.log(
            'Venta registrada:',
            response
          );


          this.completedSale.set({

            client:
              clientName,

            mode:
              this.mode(),

            total:
              currentTotal

          });


          this.cart.set(
            []
          );


          this.processingSale.set(
            false
          );


          this.showOkModal.set(
            true
          );


          // Volvemos a consultar PostgreSQL.
          // NO descontamos inventario manualmente.
          this.cargarDatos();

        },


        error: (error) => {

          console.error(
            'Error registrando venta:',
            error
          );


          this.processingSale.set(
            false
          );


          const mensaje =
            error?.error?.message;


          if (
            Array.isArray(mensaje)
          ) {

            this.showToast(
              mensaje.join(', ')
            );

          } else {

            this.showToast(
              mensaje ||
              'No se pudo registrar la venta'
            );

          }

        }

      });

  }


  // =========================================================
  // FINALIZAR
  // =========================================================

  finishSale(): void {

    this.showOkModal.set(
      false
    );

    this.selectedClient.set(
      null
    );

    this.mode.set(
      'Contado'
    );

    this.showToast(
      'Venta finalizada'
    );

  }


  // =========================================================
  // MODAL DE PRECIOS
  // =========================================================

  openPriceModal(): void {

    const prods =
      this.products();


    this.p25Price =
      prods.find(
        p => p.pesoLb === 25
      )?.price ?? 0;


    this.p35Price =
      prods.find(
        p => p.pesoLb === 35
      )?.price ?? 0;


    this.p100Price =
      prods.find(
        p => p.pesoLb === 100
      )?.price ?? 0;


    this.showPriceModal.set(
      true
    );

  }


  closePriceModal(): void {

    if (
      this.savingPrices()
    ) {
      return;
    }

    this.showPriceModal.set(
      false
    );

  }


  // =========================================================
  // GUARDAR PRECIOS EN POSTGRESQL
  // =========================================================

  savePrices(): void {

    if (
      this.savingPrices()
    ) {
      return;
    }


    const producto25 =
      this.products().find(
        producto =>
          producto.pesoLb === 25
      );


    const producto35 =
      this.products().find(
        producto =>
          producto.pesoLb === 35
      );


    const producto100 =
      this.products().find(
        producto =>
          producto.pesoLb === 100
      );


    if (
      !producto25 ||
      !producto35 ||
      !producto100
    ) {

      this.showToast(
        'No se encontraron todos los productos'
      );

      return;

    }


    const precio25 =
      Number(this.p25Price);

    const precio35 =
      Number(this.p35Price);

    const precio100 =
      Number(this.p100Price);


    if (
      !Number.isFinite(precio25) ||
      !Number.isFinite(precio35) ||
      !Number.isFinite(precio100) ||
      precio25 < 0 ||
      precio35 < 0 ||
      precio100 < 0
    ) {

      this.showToast(
        'Ingresa precios válidos'
      );

      return;

    }


    this.savingPrices.set(
      true
    );


    forkJoin({

      producto25:
        this.ventasService.actualizarPrecio(
          producto25.id,
          precio25
        ),

      producto35:
        this.ventasService.actualizarPrecio(
          producto35.id,
          precio35
        ),

      producto100:
        this.ventasService.actualizarPrecio(
          producto100.id,
          precio100
        )

    }).subscribe({

      next: () => {

        this.savingPrices.set(
          false
        );


        this.showPriceModal.set(
          false
        );


        this.showToast(
          'Precios actualizados correctamente'
        );


        // Volvemos a consultar PostgreSQL
        // para mostrar los valores reales.
        this.cargarDatos();

      },


      error: (error) => {

        console.error(
          'Error actualizando precios:',
          error
        );


        this.savingPrices.set(
          false
        );


        const mensaje =
          error?.error?.message;


        if (
          Array.isArray(mensaje)
        ) {

          this.showToast(
            mensaje.join(', ')
          );

        } else {

          this.showToast(
            mensaje ||
            'No se pudieron actualizar los precios'
          );

        }

      }

    });

  }

}
