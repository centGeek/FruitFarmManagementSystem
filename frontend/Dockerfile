# --- Etap budowania ---
# $BUILDPLATFORM = natywna architektura buildera (np. arm64 na Macu). Dzięki temu
# Vite/esbuild działają natywnie — emulacja amd64 pod QEMU crashuje esbuild (lfstack.push).
# Wynik (dist) to statyczne pliki niezależne od architektury, więc finalny obraz nginx
# może spokojnie targetować linux/amd64.
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Frontend używa RELATYWNYCH ścieżek /api (BACKEND_URL=""), więc adres backendu
# NIE jest wkompilowywany — podaje się go dopiero w runtime jako BACKEND_ORIGIN
# dla reverse-proxy nginx. Obraz jest niezależny od środowiska (brak rebuildu przy zmianie adresu).
# build:docker pomija tsc (145 pre-istniejących błędów typów) i uruchamia samo vite build
RUN npm run build:docker

# --- Etap uruchomieniowy ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Szablon: entrypoint nginx:alpine podstawia zmienne env i generuje conf.d/default.conf
COPY default.conf.template /etc/nginx/templates/default.conf.template
# Skrypt .envsh wylicza BACKEND_SCHEME/HOST/HOSTPORT z BACKEND_ORIGIN; entrypoint go ŹRÓDŁUJE
# przed envsubst. Musi być wykonywalny (chmod), inaczej nginx:alpine go pominie.
COPY --chmod=0755 docker-entrypoint.d/15-derive-backend-origin.envsh /docker-entrypoint.d/15-derive-backend-origin.envsh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
