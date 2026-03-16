# Salaf — Smart Personal Lending

A mobile app for managing personal lends and borrows between trusted contacts.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Mobile   | React Native + Expo Router (TypeScript) |
| Backend  | Spring Boot 3.2, Java 21, Maven     |
| Database | SQLite                              |
| Auth     | JWT (jjwt 0.12.5) + Spring Security |

---

## Project Structure

```
Salaf/
├── backend/       # Spring Boot REST API
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
└── mobile/        # React Native Expo app
    ├── app/
    ├── screens/
    ├── services/
    └── package.json
```

---

## Running Locally

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

### 1. Start the Backend

```bash
cd backend
mvn clean spring-boot:run
```

The API will be available at `http://localhost:8080`.

> **Environment variables (optional — defaults work for local dev):**
> | Variable | Default | Description |
> |---|---|---|
> | `SERVER_PORT` | `8080` | API port |
> | `DB_URL` | `jdbc:sqlite:./salaf.db` | SQLite file path |
> | `JWT_SECRET` | *(dev default)* | Change this in production |
> | `ENCRYPTION_KEY` | *(empty)* | AES key for card encryption |

---

### 2. Start the Mobile App

```bash
cd mobile
npm install
npx expo start
```

- Press **`a`** to open on Android emulator
- Press **`i`** to open on iOS simulator
- **Scan the QR code** with Expo Go to run on your physical device

> **Live demo on your phone:**
> Make sure your phone and computer are on the **same Wi-Fi network**, then scan the QR code that appears in the terminal with the Expo Go app.

---

### API Base URL

The mobile app connects to:
- `http://10.0.2.2:8080` — Android emulator
- `http://localhost:8080` — Web / iOS simulator

To use a real device on the same network, update `API_BASE_URL` in `mobile/services/api.ts` to your machine's local IP (e.g. `http://192.168.1.x:8080`).

---

## Deploying with Docker (Dokploy)

### Build & Run locally with Docker

```bash
cd backend
docker build -t salaf-backend .
docker run -p 8080:8080 \
  -v salaf-data:/app/data \
  -e JWT_SECRET=your-secure-secret-here \
  -e ENCRYPTION_KEY=your-32-char-key \
  salaf-backend
```

The SQLite database is stored in the `salaf-data` Docker volume so data persists across restarts.

### Dokploy Deployment

1. Push this repo to Bitbucket (or GitHub)
2. In Dokploy, create a new **Application**
3. Set the source to your repository
4. Set **Build path** to `/backend`
5. Set **Dockerfile path** to `backend/Dockerfile`
6. Add environment variables:
   ```
   JWT_SECRET=<generate a long random string>
   ENCRYPTION_KEY=<32-character AES key>
   DB_URL=jdbc:sqlite:/app/data/salaf.db
   ```
7. Add a **volume**: `/app/data` → persistent storage
8. Expose port `8080`
9. Deploy

---

## Sharing a Live Demo via QR Code

1. Start the backend (locally or deployed)
2. Update `API_BASE_URL` in `mobile/services/api.ts` to the backend URL
3. Run `npx expo start --tunnel` in the `mobile/` folder
4. Share the QR code — anyone with **Expo Go** installed can scan it and use the app live, no build needed

---

## Features

- Register & login with JWT authentication
- Add contacts (must be registered users)
- Create lend/borrow requests with due dates
- Mutual contact enforcement — both sides must add each other before transacting
- Accept / reject / cancel lend requests
- Wallet system with card management
- Repayment suggestions
- Dashboard with stats, badges, and due-soon alerts
- Delete account

---

## Security Notes

- JWT tokens expire after 24 hours
- Rate limiting on auth endpoints
- Input sanitization on all user-facing fields
- Wallet card data is AES-encrypted at rest
- Mutual contact check enforced on both backend and frontend
