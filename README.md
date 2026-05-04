# NestJS Backend API For AI Voice ERP

Production-ready backend API built with **NestJS**, **Prisma**, and **JWT Authentication**.  
Designed for scalability, security, and clean architecture.

🌐 **Live URL: Api Docs** — https://voiceerp.mapleitfirm.com/docs

---

## 🚀 Tech Stack

- **Framework:** NestJS v11
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** Passport (JWT & Local)
- **Security:** JWT, Cookies, Throttler
- **File Upload:** Multer
- **Email:** Nodemailer + NestJS Mailer
- **Logging:** Pino / nestjs-pino
- **Validation:** class-validator, class-transformer, Joi
- **Monitoring:** Sentry
- **Testing:** Jest, Supertest
- **Template Engine:** EJS

---

## 📁 Project Structure

```
src/
├── auth/           # Authentication & authorization
├── users/          # User management
├── files/          # File upload & access
├── prisma/         # Prisma service
├── common/         # Guards, decorators, filters
├── config/         # App configuration
├── app.module.ts
└── main.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

COOKIE_SECRET=your_cookie_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

SENTRY_DSN=your_sentry_dsn
```

---

## 📦 Installation

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
```

---

## 🧱 Prisma Setup

```bash
npx prisma generate
npx prisma db push
npx prisma migrate dev
```

Optional:

```bash
npx prisma studio
```

---

## ▶️ Running the App

**Development**

```bash
npm run start:dev
```

**Production**

```bash
npm run build
npm run start:prod
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🔐 Authentication

- JWT-based authentication
- Cookie-supported authentication
- Passport strategies: Local Strategy, JWT Strategy

Example protected route:

```ts
@UseGuards(AuthGuard('jwt'))
```

---

## 📤 File Uploads

Uses Multer. Supports:

- User profile image
- NID / private documents
- Business logo

Private files are protected using authentication guards.

---

## 📧 Email Service

- SMTP-based email service
- EJS templates
- Use cases: account verification, notifications, password reset

---

## 📝 Logging

- High-performance logging with Pino
- Pretty logs in development
- JSON logs in production

---

## 📈 Monitoring

Integrated with Sentry for error tracking & performance monitoring.

---

## 🛡️ Security Features

- Rate limiting using `@nestjs/throttler`
- Secure cookie handling
- DTO validation
- Password hashing with bcryptjs

---

## 📄 License

This project is **proprietary software**.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without prior written permission from the author.