# Reloj-Control

# Sistema de Control de Asistencia

## Requisitos Previos

### Backend
- Java JDK 17
- Maven 3.8+
- PostgreSQL 15+

### Frontend
- Node.js 18+
- npm 9+

## Instalación

### Backend (Spring Boot)

1. Navega al directorio del backend:
```bash
cd reloj-control-backend
```

2. Instala las dependencias con Maven:
```bash
mvn clean install
```

3. Configura la base de datos PostgreSQL:
- Crea una base de datos llamada `reloj_control`
- Actualiza las credenciales en `src/main/resources/application.properties`

4. Ejecuta la aplicación:
```bash
mvn spring-boot:run
```

El backend estará disponible en `http://localhost:8080`

### Frontend (React + Vite)

1. Navega al directorio del frontend:
```bash
cd reloj-control-frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Estructura del Proyecto

### Backend
- Spring Boot 3.2.3
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT para autenticación

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router DOM
- Axios 
>>>>>>> 1e7db86 (Agregando readme.md)
