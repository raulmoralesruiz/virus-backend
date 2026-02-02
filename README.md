# Virus Backend

API y Servidor WebSocket para el juego de cartas Virus.

Este repositorio maneja la lógica central del juego, la comunicación en tiempo real con los clientes a través de Socket.IO, y endpoints REST auxiliares.

## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express
-   **WebSocket**: Socket.IO
-   **Lenguaje**: TypeScript
-   **Testing**: Jest

## 📁 Rol en el Sistema

El backend actúa como la autoridad central del juego (Game Master). Sus responsabilidades incluyen:
-   Gestión de salas y conexiones de jugadores.
-   Validación de movimientos y reglas del juego.
-   Sincronización de estado entre todos los clientes conectados.
-   Manejo de eventos de juego (jugar carta, robar, descartar).

## 🚀 Instalación Rápida

Requisitos: Node.js (v18+) y pnpm.

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd virus-backend

# Instalar dependencias
pnpm install
```

## 📜 Scripts Disponibles

| Script | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor en modo desarrollo con recarga automática (watch). |
| `pnpm build` | Compila el código TypeScript a JavaScript en `dist/`. |
| `pnpm start` | Inicia el servidor de producción desde `dist/`. |
| `pnpm test` | Ejecuta la suite de pruebas con Jest. |

## ⚙️ Variables de Entorno

El servidor utiliza las siguientes configuraciones (actualmente hardcoded o por defecto):

-   `PORT`: Puerto del servidor (Por defecto: `3000`).

## 📚 Documentación

La documentación completa del proyecto, incluyendo arquitectura detallada y eventos de socket, se encuentra centralizada en el repositorio de documentación principal:

👉 [**Virus Documentation**](../virus-docs) (Enlace relativo o URL al repo de docs)

## 🤝 Guía para Contribuir

1.  Haz un Fork del repositorio.
2.  Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3.  Commit a tus cambios.
4.  Push a la rama.
5.  Abre un Pull Request.

## 📄 Licencia

Este proyecto está bajo la licencia **GNU AGPLv3**. Consulta el archivo `LICENSE` para más detalles.

> **Disclaimer**: Este es un proyecto open source desarrollado por fans y para fans. No tiene afiliación con Tranjis Games. El arte y diseño original pertenecen a sus respectivos creadores.
