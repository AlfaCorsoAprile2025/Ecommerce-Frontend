# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript single-page application (SPA) for a library/bookstore e-commerce frontend. There is no build step — it's served as static files by Nginx inside a Docker container.

## Running the App

There is no `npm` or build toolchain. To run locally:

```bash
# Build and run the Docker container
docker build -t ecommerce-frontend .
docker run -p 3000:3000 ecommerce-frontend
```

The app is then accessible at `http://localhost:3000`.

To develop without Docker, open `index.html` directly in a browser or serve with any static file server:

```bash
npx serve .          # or python -m http.server 3000
```

## Backend API

The frontend talks to a Spring Boot backend. The base URL is configured in `config.js` (loaded before all other scripts):

```js
window.APP_CONFIG = {
  API_BASE: 'http://localhost:80',
};
```

To point at a different backend, change `API_BASE` in `config.js`. The backend exposes:

- `POST /auth/login` — returns a JWT token
- `POST /auth/register`
- `GET /catalog/products?{params}` — requires Bearer token
- `GET /catalog/products/{id}` — requires Bearer token

Authentication tokens are stored in `localStorage` under the key `authToken`.

## Architecture

### Routing

Hash-based client-side routing is implemented in `script/script.js`. The `ROUTES` table maps hash fragments to view IDs and initializer functions. Navigation is triggered by `hashchange` and `DOMContentLoaded` events.

Dynamic routes (e.g. `#product/<id>`) are handled inline before the table lookup.

Route guards:
- Protected routes (`auth: true`) redirect unauthenticated users to `#login`.
- Already-authenticated users visiting `#login` or `#register` are redirected to `#products`.

### Views

All views are pre-rendered in `index.html` as hidden `<div class="view">` elements. The router toggles the `active` class to show the current view. There is no templating engine or virtual DOM.

| Hash | View ID | Script |
|---|---|---|
| `#login` | `view-login` | `script/auth.js` |
| `#register` | `view-register` | `script/auth.js` |
| `#products` | `view-products` | `script/products.js` |
| `#product/<id>` | `view-product` | `script/product.js` |

### Script Load Order

Scripts are loaded in this order in `index.html` (order matters — no module bundler):

1. `script/api.js` — defines global `Api` object and `escHtml()` utility
2. `script/auth.js` — defines `initLogin()`, `initRegister()`
3. `script/products.js` — defines `initProducts()`, holds `ProductsState`
4. `script/product.js` — defines `initProduct(id)`
5. `script/script.js` — router, references all of the above

### State Management

- **Authentication state:** `localStorage.authToken` (JWT Bearer token)
- **Products list state:** `ProductsState` object in `script/products.js` — holds current page, search query, and sort order; reset on each `initProducts()` call

### XSS Prevention

All user-supplied or API-returned strings rendered into `innerHTML` must be wrapped with `escHtml()` (defined in `api.js`). This is the only XSS protection layer — no framework sanitization exists.

## Deployment

The `Dockerfile` copies static files into an Nginx Alpine image. Nginx listens on port **3000** (configured in `nginx.conf`).
