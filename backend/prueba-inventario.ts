import { db } from './prisma/db.js';

// Solo verifica compatibilidad de TypeScript.
// No ejecuta ninguna consulta.
async function comprobarTransaccion(): Promise<void> {
    await db.transaction(async (tx) => {
        const inventarios = await tx.orm.public.Inventario.all();

        console.log(inventarios.length);
    });
}

// No llamar a comprobarTransaccion().