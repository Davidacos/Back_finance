# 📘 Guía Técnica para Integración: Backend Finance API

Esta guía proporciona toda la información necesaria para integrar el frontend (Next.js + TypeScript) con el backend de la aplicación financiera. El sistema utiliza una arquitectura basada en **Node.js, Express y PostgreSQL** con una capa de seguridad endurecida para producción.

---

## 1. 🔐 Autenticación y Seguridad

El sistema utiliza **JSON Web Tokens (JWT)** junto con una estrategia de **Refresh Token Rotation** para sesiones seguras y persistentes.

### 🔄 Flujo de Autenticación
1. **Registro**: Crea una cuenta de usuario.
2. **Login**: Retorna un `accessToken` (corto plazo) y un `refreshToken` (largo plazo).
3. **Persistencia**:
   - `accessToken`: Debe guardarse en **memoria** (estado de React/Zustand) para máxima seguridad.
   - `refreshToken`: Debe guardarse en una **Cookie segura (HttpOnly)** o en `localStorage` (si el entorno lo requiere), aunque la recomendación para producción es Cookie para mitigar ataques XSS.
4. **Intercepción**: El frontend debe interceptar respuestas `401` para intentar renovar el `accessToken` usando el endpoint de `refresh`.

### 📍 Endpoints de Auth

#### `POST /api/v1/auth/register`
Crea un nuevo usuario.
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "first_name": "Juan",
  "last_name": "Pérez"
}
```

#### `POST /api/v1/auth/login`
Inicia sesión y genera el juego de tokens.
- **Retorno (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "first_name": "Juan",
      "last_name": "Pérez"
    },
    "accessToken": "ey...",
    "refreshToken": "7f..."
  }
}
```

#### `POST /api/v1/auth/refresh-token`
Genera un nuevo `accessToken` invalidando el `refreshToken` anterior (Rotación).
- **Body**: `{ "refreshToken": "7f..." }`
- **Retorno**: `{ "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }`

#### `POST /api/v1/auth/logout`
Invalida el token en el servidor.
- **Body**: `{ "refreshToken": "7f..." }`

---

## 2. 👤 Perfil de Usuario

#### `GET /api/v1/users/me`
Retorna la información del usuario logueado basándose en el JWT.
- **Header**: `Authorization: Bearer <accessToken>`
- **Retorno**: `{ "data": { "user": { ... } } }`

#### `PUT /api/v1/users/me`
Actualiza datos del perfil (nombre, presupuesto mensual, idioma).
- **Campos editables**: `first_name`, `last_name`, `monthly_budget`, `language`, `currency_code`.

---

## 3. 🏷️ Categorías

Las categorías están divididas en **Globales** (`is_default: true`) y **Personalizadas**.

- **Regla de Visualización**: El frontend debe mostrar la unión de categorías donde `user_id` sea el del usuario logueado O `is_default` sea `true`.
- **Regla de Edición**: **No se pueden modificar ni eliminar** categorías globales. Intentar hacerlo devolverá un error `403 Forbidden`.
- **Soft Delete**: Al "eliminar" una categoría propia, el backend marca `deleted_at`. El frontend no debe mostrar categorías con este campo poblado.

---

## 4. 💳 Transacciones

Este es el núcleo de la aplicación. Maneja ingresos y gastos.

#### `POST /api/v1/transactions`
- **Body**:
```json
{
  "category_id": "uuid",
  "type": "expense", // 'income' o 'expense'
  "amount": 150.75,
  "description": "Cena fin de semana",
  "transaction_date": "2024-04-10",
  "payment_method": "credit_card" // cash, credit_card, bank_transfer, etc.
}
```

#### `GET /api/v1/transactions` (Con Paginación)
- **Query Params**: `page`, `limit`, `type`, `category_id`, `startDate`, `endDate`.
- **Retorno**:
```json
{
  "success": true,
  "data": {
    "data": [...],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

## 5. 🗓️ Gastos Fijos (Suscripciones/Recurrentes)

Diferencia clave entre **Desactivar** y **Eliminar**:
- `is_active = false`: El gasto sigue existiendo pero no se procesa (ej: pausa de suscripción).
- `deleted_at IS NOT NULL`: El gasto ha sido borrado por el usuario (Soft Delete).

---

## 6. 📊 Reportes Financieros

#### `GET /api/v1/reports/monthly`
Calcula el balance del usuario basándose exclusivamente en transacciones **no eliminadas**.
- **Query Params**: `year`, `month` (opcionales, por defecto el mes actual).
- **Retorno**:
```json
{
  "success": true,
  "data": {
    "report": [
      {
        "summary_year": 2024,
        "summary_month": 4,
        "total_income": 5000.00,
        "total_expense": 1200.50,
        "balance": 3799.50
      }
    ]
  }
}
```

---

## 7. ⚠️ Manejo Estándar de Errores

El backend siempre responde con una estructura predecible en caso de fallo:

```json
{
  "success": false,
  "message": "Descripción amigable del error",
  "errors": [], // Detalles técnicos o de validación Zod (opcional)
  "errorCode": "TOKEN_EXPIRED" // Opcional, para lógica de frontend
}
```

### Códigos de Estado Comunes:
- `400 Bad Request`: Error de validación (campos faltantes o tipo incorrecto).
- `401 Unauthorized`: Token faltante o expirado.
- `403 Forbidden`: Intento de modificar datos ajenos o categorías globales.
- `404 Not Found`: Recurso eliminado o inexistente.
- `429 Too Many Requests`: Rate limit excedido (ej: login fallido repetidas veces).

---

## 🔗 Tips para el Frontend (Next.js)

1. **Axios Interceptor**: Implementa un interceptor para que, si recibes un `401`, automáticamente llame a `/auth/refresh-token` y re-intente la petición original.
2. **Tipado**: Define interfaces de TypeScript para `Transaction`, `User` y `Category` basándote en los esquemas de esta guía para evitar Errores en tiempo de ejecución.
3. **Manejo de Fechas**: Envia siempre las fechas en formato `YYYY-MM-DD` para evitar problemas de zona horaria entre el navegador y el servidor.
4. **Optimistic Updates**: Dado que el backend usa UUIDs, puedes generar UUIDs temporales en el cliente para mostrar datos instantáneos mientras se confirma la transacción en el servidor.
