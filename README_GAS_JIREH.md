# Gas Jireh — Manual de instalación paso a paso

> **Objetivo:** instalar y abrir Gas Jireh en **otra computadora Windows**, aunque sea la primera vez que se utiliza el proyecto. Sigue los pasos en orden; no necesitas crear las tablas una por una.

Gas Jireh administra ventas al contado y crédito, clientes, inventario de cilindros llenos y vacíos, cuentas por cobrar, abonos y usuarios. Utiliza **Angular** (pantallas), **NestJS** (API), **PostgreSQL** (datos) y **Prisma** (esquema/acceso a datos).

## Antes de empezar: elige tu caso

| ¿Qué necesitas? | Ruta a seguir |
|---|---|
| **A. Instalar desde cero**, sin ventas ni clientes anteriores | Pasos 1 a 7, usando el **Paso 4A** |
| **B. Mover el sistema conservando datos** de otra computadora | Pasos 1 a 7, usando el **Paso 4B** |

**Diferencia fundamental:** Prisma puede preparar las **tablas, columnas y relaciones** del esquema; **no crea por sí solo el servidor PostgreSQL, la base de datos ni recupera tus ventas anteriores**. Para conservar los datos se usa un respaldo de PostgreSQL.

## Paso 1. Instala los programas necesarios

En la computadora nueva, instala:

1. **Git**: para descargar el proyecto.
2. **Node.js 24.x**: incluye `npm`, que instala las dependencias.
3. **PostgreSQL 18**: durante la instalación anota la contraseña del usuario `postgres` y deja el puerto `5432`, salvo que tengas un motivo para cambiarlo.
4. **Visual Studio Code**: opcional, pero recomendado para editar el proyecto.
5. **Navegador web** (Chrome, Edge o Firefox): para utilizar la interfaz.

**¿Hay que instalar Angular, NestJS, Prisma o TypeScript aparte?** **No**, siempre que los archivos `package.json` y `package-lock.json` de `frontend` y `backend` estén en el repositorio. Cada carpeta declara sus propias dependencias; `npm ci` las descarga e instala automáticamente en `node_modules`. Eso incluye las herramientas de Angular, NestJS, Prisma y TypeScript declaradas por el proyecto. **No hace falta instalar `@angular/cli` ni `@nestjs/cli` globalmente**. Si necesitas ejecutar sus comandos manualmente, utiliza `npx ng ...`, `npx nest ...` o los scripts de `npm`.

**¿Qué sí se instala manualmente?** Node.js (incluye npm), Git y PostgreSQL. `pgAdmin 4` suele ofrecerse junto a PostgreSQL y facilita la administración; no es indispensable si utilizas `psql`.

**Antes de continuar:** confirma que el repositorio incluya `frontend/package.json`, `backend/package.json` y, preferiblemente, sus archivos `package-lock.json`. Sin `package.json`, `npm` no sabe qué instalar.

Abre **PowerShell** y comprueba:

```powershell
node -v
npm -v
git --version
```

**Resultado esperado:** cada comando muestra su versión. Si alguno dice «no se reconoce», termina su instalación y abre una terminal nueva.

Comprueba también PostgreSQL abriendo **SQL Shell (psql)** o **pgAdmin 4**. No es necesario que `psql` funcione directamente desde PowerShell si no se agregó al `PATH`.

## Paso 2. Descarga Gas Jireh

En PowerShell:

```powershell
cd $HOME\Desktop
git clone https://github.com/CristianMendozaH/GasJireh.git
cd GasJireh
```

Si GitHub pide iniciar sesión, utiliza una cuenta autorizada (el repositorio puede ser privado). También puedes copiar la carpeta del proyecto desde una memoria USB.

**Comprueba** que dentro de `GasJireh` existan las carpetas `backend` y `frontend`.

## Paso 3. Crea una base de datos vacía en PostgreSQL

1. Abre **pgAdmin 4** o **SQL Shell (psql)**, instalados con PostgreSQL.
2. Conéctate al servidor local usando la contraseña configurada al instalarlo.
3. Crea una base de datos llamada `gas_jireh`.

Si utilizas **SQL Shell**, ejecuta:

```sql
CREATE DATABASE gas_jireh;
```

**Resultado esperado:** la base `gas_jireh` aparece en PostgreSQL. **Todavía no necesitas crear tablas manualmente.**

> Si la base ya existe, **no la borres ni vuelvas a crearla** sin saber qué información contiene.

## Paso 4. Decide cómo preparar las tablas y los datos

### Paso 4A. Instalación completamente nueva (sin datos anteriores)

Esta ruta crea la estructura a partir del esquema del proyecto.

**A.** En PowerShell, desde la carpeta `GasJireh`, instala las dependencias del backend:

```powershell
cd backend
npm ci
```

Si no existe `package-lock.json`, ejecuta `npm install`. **No ejecutes `npm install -g @angular/cli`, `npm install -g @nestjs/cli` ni `npm install -g prisma`:** no se necesitan para este procedimiento.

**B.** Crea el archivo `backend/.env` (si ya existe uno de ejemplo, úsalo como guía):

```dotenv
DATABASE_URL="postgresql://postgres:TU_CONTRASENA@localhost:5432/gas_jireh"
JWT_SECRET="CAMBIA_ESTO_POR_UN_SECRETO_LARGO_Y_ALEATORIO"
PORT=3000
```

Reemplaza `TU_CONTRASENA`. Si contiene símbolos especiales como `@`, `#` o `:`, deben codificarse para usarlos en una URL. Comprueba en la configuración de autenticación que el proyecto utiliza el nombre `JWT_SECRET` y revisa si requiere otras variables.

**C.** Genera/revisa el contrato y **previsualiza** los cambios del esquema. El proyecto ha utilizado el flujo de **Prisma 8 RC**:

```powershell
npx prisma contract emit
npx prisma db update --dry-run
```

**Resultado esperado:** la vista previa muestra la creación de las tablas y relaciones necesarias. **Si aparece un error o propone borrar información inesperadamente, detente.** Comprueba la versión instalada de Prisma y los archivos de configuración antes de continuar.

**D.** Solo después de revisar la vista previa y confirmar que `gas_jireh` está vacía, aplica el esquema:

```powershell
npx prisma db update
```

**Resultado esperado:** PostgreSQL contiene las tablas del sistema, sin tener que escribir sentencias `CREATE TABLE` a mano.

**E.** **Atención: las tablas recién creadas están vacías.** Necesitarás crear los productos, inventarios iniciales y **un usuario administrador** mediante los mecanismos de inicialización que realmente existan en el repositorio. **No asumas que Prisma crea usuarios o contraseñas automáticamente.** Si no existe un seed o comando de alta inicial, se debe implementar antes de poder iniciar sesión en una instalación nueva. No guardes contraseñas en texto plano.

Continúa en el **Paso 5**.

### Paso 4B. Instalar conservando ventas, usuarios e inventario

Esta ruta **no utiliza Prisma para recrear las tablas**: restaura una copia completa de PostgreSQL.

**En la computadora antigua:**

1. Asegúrate de que nadie esté registrando ventas durante la copia, para evitar cambios posteriores al respaldo.
2. Abre PowerShell y ejecuta (ajusta el nombre de la base y el usuario si son distintos):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -f "$HOME\Desktop\gas_jireh.backup" gas_jireh
```

3. Confirma que se creó el archivo `gas_jireh.backup` en el escritorio y cópialo de forma segura a la computadora nueva.

**En la computadora nueva:**

1. Realiza los pasos 1, 2 y 3; la base `gas_jireh` debe estar **vacía**.
2. Copia `gas_jireh.backup` al escritorio de la nueva computadora.
3. Ejecuta:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -h localhost -p 5432 --no-owner --no-acl -d gas_jireh "$HOME\Desktop\gas_jireh.backup"
```

4. Comprueba en pgAdmin que existan tablas **y registros** (usuarios, productos, ventas, inventario, etc.).
5. Instala dependencias y configura `backend/.env` como en los apartados **A y B del Paso 4A**.

**No ejecutes `prisma db update` a ciegas sobre la base restaurada**: ya contiene el esquema y los datos. Solo considera una actualización después de comparar el esquema con el código, revisar la vista previa y hacer otro respaldo.

> El archivo `.backup` contiene información privada y hashes de contraseñas. Guárdalo en un lugar seguro; **no lo subas a GitHub**. La restauración no instala PostgreSQL ni copia automáticamente el `.env`.

## Paso 5. Enciende el backend (API)

Abre una terminal PowerShell dentro de `GasJireh\backend` y ejecuta:

```powershell
npm run start:dev
```

**Resultado esperado:** NestJS arranca sin errores y utiliza el puerto **3000**. Déjala abierta.

Si al abrir `http://localhost:3000` ves `404`, puede ser normal si el backend no define una ruta raíz. Revisa la terminal y prueba el inicio de sesión desde Angular.

## Paso 6. Enciende el frontend (pantallas)

Abre **una segunda terminal** dentro de `GasJireh\frontend`:

```powershell
npm ci
npm start
```

Si no hay `package-lock.json`, usa `npm install`. **Angular y sus dependencias se instalan en este paso**, a partir de `frontend/package.json`; no necesitas instalar Angular globalmente. Si el script `start` no existe, revisa `frontend/package.json` y utiliza el comando de Angular configurado allí (por ejemplo, `npx ng serve --port 4200`).

Abre en el navegador:

**http://localhost:4200**

**Resultado esperado:** aparece la pantalla de acceso de Gas Jireh.

## Paso 7. Comprueba que todo funciona

Marca cada punto cuando lo hayas comprobado:

- [ ] La pantalla de inicio de sesión abre en `http://localhost:4200`.
- [ ] El backend inicia sin errores en la terminal.
- [ ] PostgreSQL está encendido y `DATABASE_URL` apunta a la base correcta.
- [ ] Puedes iniciar sesión con un usuario que exista en **esa base**.
- [ ] Se muestran los productos y existencias del inventario.
- [ ] Se muestran las ventas y cuentas por cobrar (si restauraste datos).
- [ ] No aparecen errores de conexión en el navegador.

**Si elegiste la instalación nueva:** que las listas estén vacías puede ser normal, pero **no podrás ingresar** hasta que exista un administrador inicial.

## Preguntas frecuentes antes de iniciar

**¿Debo instalar Angular manualmente?** No. Instala Node.js y ejecuta `npm ci` dentro de `frontend`; npm instala la versión de Angular y Angular CLI especificada en el proyecto, si están declaradas en sus dependencias.

**¿Debo instalar NestJS y Prisma manualmente?** No globalmente. `npm ci` dentro de `backend` instala las dependencias que declara ese proyecto. Ejecuta Prisma con `npx prisma ...`, que usa la instalación local.

**¿Debo instalar PostgreSQL?** Sí. PostgreSQL es un servidor de base de datos independiente y `npm ci` no lo instala.

**¿Necesito internet?** Sí, normalmente para clonar el repositorio y descargar dependencias la primera vez. Después, para iniciar el sistema en modo local, no es necesario descargar esas dependencias de nuevo.

**¿Debo ejecutar `npm ci` cada vez que abra Gas Jireh?** No. Solo la primera vez o cuando cambien las dependencias. Tampoco debes volver a crear la base de datos cada día.

**¿Qué hago si `npm ci` falla?** Lee el error; comprueba que estás dentro de la carpeta correcta, que Node.js sea compatible y que exista un `package-lock.json` consistente. Si no hay lockfile, utiliza `npm install`.

## ¿Cómo iniciar Gas Jireh los días siguientes?

**No necesitas repetir la instalación, recrear las tablas ni ejecutar Prisma todos los días.** Solo:

1. Comprueba que PostgreSQL esté encendido.
2. **Terminal 1**, dentro de `backend`: `npm run start:dev`.
3. **Terminal 2**, dentro de `frontend`: `npm start`.
4. Abre `http://localhost:4200`.

## Problemas comunes y soluciones

| Qué ocurre | Qué revisar |
|---|---|
| `node`, `npm` o `git` no se reconoce | Instalar el programa y abrir otra terminal |
| `npm ci` falla por falta de lockfile | Usar `npm install` |
| `ng` o `nest` no se reconoce | No necesitas instalarlo globalmente; usa `npm start` o `npx ng` / `npx nest` desde la carpeta correspondiente, tras instalar dependencias |
| `Cannot find module` / falta Angular o NestJS | Ejecutar `npm ci` en la carpeta correcta y comprobar `package.json` |
| Error de conexión a PostgreSQL | Servicio encendido, puerto `5432`, usuario, contraseña y `DATABASE_URL` |
| Prisma no reconoce `contract emit` o `db update` | Confirmar la versión de Prisma 8 RC y la configuración exacta del proyecto; **no ejecutar comandos alternativos a ciegas** |
| «No existe la tabla» | En instalación nueva, comprobar que el esquema se aplicó; en migración, revisar la restauración |
| Login inválido en base nueva | Falta crear el usuario administrador inicial |
| Los datos no aparecen | Verificar que conectaste a la base restaurada, no a otra vacía |
| `401 Unauthorized` | Token o credenciales inválidos/vencidos |
| `403 Forbidden` | El rol no tiene permiso |
| Error de CORS o conexión desde Angular | Revisar URL de la API y configuración de CORS del backend |
| Puerto 3000 o 4200 ocupado | Cerrar el programa que ya lo está utilizando |

## Seguridad y notas importantes

- **Nunca subas** `backend/.env`, respaldos de PostgreSQL ni contraseñas a GitHub.
- Mantén un respaldo antes de modificar el esquema de una base con datos.
- El código de GitHub **no incluye automáticamente** los datos de PostgreSQL.
- Los comandos indicados son para **desarrollo local en Windows**, no para publicar el sistema en internet.
- Si frontend y backend se ejecutan en equipos distintos, `localhost` deja de servir como dirección remota: tendrás que configurar la IP o el dominio del servidor y sus permisos de red.
- Si cambian las versiones, los comandos de Prisma o las variables del proyecto, actualiza este instructivo.

---

**Resumen en una frase:** instala Node.js, Git y PostgreSQL (Angular/NestJS/Prisma llegan con `npm ci`) → descarga el proyecto → instala dependencias en `backend` y `frontend` → crea la base vacía → **usa Prisma para generar las tablas si empiezas de cero, o restaura un backup si conservas datos** → configura `.env` → enciende backend y frontend → inicia sesión.

**Ruta rápida para una instalación nueva:** Node.js + Git + PostgreSQL → `git clone` → crear `gas_jireh` → `cd backend` + `npm ci` + configurar `.env` + revisar/aplicar esquema → `npm run start:dev` → segunda terminal `cd frontend` + `npm ci` + `npm start` → `http://localhost:4200`.

<!-- Fin del instructivo -->

**Nota de compatibilidad:** las versiones concretas de Angular, NestJS, Prisma y TypeScript deben verificarse en los `package.json` del repositorio; el instructivo no presupone que estén instaladas globalmente.
