import { db } from '../prisma/db.js';

db.orm.public.Venta.create({
    usuarioId: 1,
    clienteId: 1,
    tipo: 'CONTADO',
    total: '250',
});

db.orm.public.DetalleVenta.create({
    ventaId: 1,
    productoId: 1,
    cantidad: 1,
    precioUnitario: '250',
    subtotal: '250',
    vaciosRecibidos: 0,
});