# TutorHub API - Generated Endpoints

## 📋 Обзор

Полнофункциональный REST API для платформы подбора репетиторов, построенный на Symfony 7 с API Platform 3.3.

**Автогенерированные endpoints:** 25 основных маршрутов + служебные endpoint'ы
**База данных:** SQLite (var/app.db)
**Аутентификация:** JWT (config/jwt/)

---

## 🔐 Аутентификация

### JWT Ключи
- **Приватный ключ:** `config/jwt/private.pem`
- **Публичный ключ:** `config/jwt/public.pem`
- **Пароль:** сохранён в `.env` как `JWT_PASSPHRASE`

### Конфигурация
- **Security config:** `config/packages/security.yaml` (настроена JWT аутентификация)
- **Firewall:** API маршруты требуют `IS_AUTHENTICATED_FULLY`
- **Провайдер:** User entity (email как уникальный идентификатор)

### 🔑 Получить JWT Токен

#### Регистрация нового пользователя
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123"
  }'
```

**Ответ:**
```json
{
  "code": 201,
  "message": "User registered successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "roles": ["ROLE_USER"]
  }
}
```

#### Логин (получить токен)
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Ответ:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "roles": ["ROLE_USER"]
  }
}
```

### 📨 Использование Токена в Запросах

Все API запросы (кроме `/api/login` и `/api/register`) требуют **Authorization** заголовок с JWT токеном:

```bash
curl http://localhost:8000/api/users.json \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Формат заголовка:**
```
Authorization: Bearer <JWT_TOKEN>
```

### ✅ Тестовый пользователь

Для быстрого тестирования создана учётная запись:
- **Email:** `test@example.com`
- **Password:** `password123`

Или создайте своего:
```bash
php bin/console app:create-user your@email.com your-password
```

---

## 📚 REST API Endpoints

### **Users** (`/api/users`)
```
GET    /api/users.json              # Получить всех пользователей
POST   /api/users.json              # Создать нового пользователя
GET    /api/users/{id}.json         # Получить пользователя по ID
PUT    /api/users/{id}.json         # Обновить пользователя
DELETE /api/users/{id}.json         # Удалить пользователя
```

**Поля User:**
- `id` (int)
- `email` (string, unique)
- `password` (string, хеширован)
- `roles` (array JSON)
- `createdAt` (datetime)
- `tutorProfile` (OneToOne → TutorProfile)

---

### **TutorProfiles** (`/api/tutor_profiles`)
```
GET    /api/tutor_profiles.json              # Получить всех репетиторов
POST   /api/tutor_profiles.json              # Создать профиль репетитора
GET    /api/tutor_profiles/{id}.json         # Получить репетитора по ID
PUT    /api/tutor_profiles/{id}.json         # Обновить профиль
DELETE /api/tutor_profiles/{id}.json         # Удалить профиль
```

**Поля TutorProfile:**
- `id` (int)
- `user` (OneToOne → User)
- `bio` (text)
- `city` (string)
- `pricePerHour` (decimal 8,2)
- `photo` (string, nullable)
- `rating` (decimal 3,2, nullable)
- `isApproved` (boolean, default false)
- `subjects` (ManyToMany ↔ Subject)
- `availabilities` (OneToMany → Availability)

---

### **Subjects** (`/api/subjects`)
```
GET    /api/subjects.json              # Получить все предметы
POST   /api/subjects.json              # Создать предмет
GET    /api/subjects/{id}.json         # Получить предмет по ID
PUT    /api/subjects/{id}.json         # Обновить предмет
DELETE /api/subjects/{id}.json         # Удалить предмет
```

**Поля Subject:**
- `id` (int)
- `name` (string)
- `slug` (string, unique)

---

### **Availabilities** (`/api/availabilities`)
```
GET    /api/availabilities.json              # Получить расписание
POST   /api/availabilities.json              # Добавить временной слот
GET    /api/availabilities/{id}.json         # Получить слот по ID
PUT    /api/availabilities/{id}.json         # Обновить слот
DELETE /api/availabilities/{id}.json         # Удалить слот
```

**Поля Availability:**
- `id` (int)
- `tutorProfile` (ManyToOne → TutorProfile)
- `dayOfWeek` (int 0-6, 0=пн, 6=вс)
- `startTime` (time)
- `endTime` (time)

---

### **Bookings** (`/api/bookings`)
```
GET    /api/bookings.json              # Получить все бронирования
POST   /api/bookings.json              # Создать бронирование
GET    /api/bookings/{id}.json         # Получить бронирование по ID
PUT    /api/bookings/{id}.json         # Обновить бронирование
DELETE /api/bookings/{id}.json         # Отменить бронирование
```

**Поля Booking:**
- `id` (int)
- `student` (ManyToOne → User)
- `tutorProfile` (ManyToOne → TutorProfile)
- `subject` (ManyToOne → Subject)
- `startAt` (datetime)
- `durationMinutes` (int)
- `status` (enum: pending, confirmed, completed, cancelled)
- `createdAt` (datetime)

---

### **Reviews** (`/api/reviews`)
```
GET    /api/reviews.json              # Получить все отзывы
POST   /api/reviews.json              # Оставить отзыв
GET    /api/reviews/{id}.json         # Получить отзыв по ID
PUT    /api/reviews/{id}.json         # Обновить отзыв
DELETE /api/reviews/{id}.json         # Удалить отзыв
```

**Поля Review:**
- `id` (int)
- `booking` (OneToOne → Booking)
- `rating` (int 1-5)
- `comment` (text, nullable)
- `createdAt` (datetime)

---

## 🔗 Связи между entities

```
User (1) ──→ (1) TutorProfile
            ├─ (1) ──→ (∞) Availability
            └─ (∞) ──→ (∞) Subject (ManyToMany)

User (1) ──→ (∞) Booking (как student)
TutorProfile (1) ──→ (∞) Booking (как tutorProfile)
Subject (1) ──→ (∞) Booking
Booking (1) ──→ (1) Review
```

---

## 📁 Структура проекта

```
backend/
├── bin/
│   └── console                 # Symfony CLI
├── config/
│   ├── jwt/
│   │   ├── private.pem        # JWT приватный ключ
│   │   └── public.pem         # JWT публичный ключ
│   ├── packages/
│   │   ├── security.yaml      # JWT конфигурация
│   │   └── doctrine.yaml      # БД конфигурация
│   └── routes.yaml
├── migrations/
│   └── Version20260709000001.php  # Инициальная миграция
├── src/
│   └── Entity/
│       ├── User.php
│       ├── TutorProfile.php
│       ├── Subject.php
│       ├── Availability.php
│       ├── Booking.php
│       ├── BookingStatus.php (enum)
│       └── Review.php
├── var/
│   └── app.db                 # SQLite база данных
├── .env                       # Конфиг (DATABASE_URL, JWT_*)
├── composer.json
└── composer.lock
```

---

## 🚀 Быстрый старт

### 1. Установка зависимостей (уже сделано)
```bash
composer install --ignore-platform-req=ext-sodium
```

### 2. Запуск миграций (уже сделано)
```bash
php bin/console doctrine:migrations:migrate
```

### 3. Запуск сервера разработки
```bash
symfony server:start
# или
php bin/console server:run
```

Сервер доступен на: **http://localhost:8000**
API документация: **http://localhost:8000/api/docs**

---

## 📝 Примеры запросов

### 1️⃣ Получить JWT токен
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.token')

echo "Токен: $TOKEN"
```

### 2️⃣ Получение всех репетиторов (с токеном)
```bash
curl http://localhost:8000/api/tutor_profiles.json \
  -H "Authorization: Bearer $TOKEN"
```

**Ответ:**
```json
{
  "@context": "/api/contexts/TutorProfile",
  "@id": "/api/tutor_profiles",
  "@type": "hydra:Collection",
  "hydra:member": [],
  "hydra:totalItems": 0
}
```

### 3️⃣ Создание нового предмета
```bash
curl -X POST http://localhost:8000/api/subjects.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Математика",
    "slug": "mathematics"
  }'
```

### 4️⃣ Создание профиля репетитора
```bash
curl -X POST http://localhost:8000/api/tutor_profiles.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user": "/api/users/1",
    "bio": "Опытный преподаватель математики",
    "city": "Москва",
    "pricePerHour": "500.00",
    "isApproved": false
  }'
```

### 5️⃣ Создание бронирования
```bash
curl -X POST http://localhost:8000/api/bookings.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "student": "/api/users/1",
    "tutorProfile": "/api/tutor_profiles/1",
    "subject": "/api/subjects/1",
    "startAt": "2026-07-15T14:00:00Z",
    "durationMinutes": 60,
    "status": "pending"
  }'
```

### 6️⃣ Оставить отзыв
```bash
curl -X POST http://localhost:8000/api/reviews.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "booking": "/api/bookings/1",
    "rating": 5,
    "comment": "Отличный репетитор, очень доволен!"
  }'
```

---

## 🔄 Связь между запросами

API Platform автоматически использует IRI (Internationalized Resource Identifier) для связей.

Пример: при создании Booking используйте:
```json
{
  "student": "/api/users/1",
  "tutorProfile": "/api/tutor_profiles/1",
  "subject": "/api/subjects/1"
}
```

Вместо:
```json
{
  "studentId": 1,
  "tutorProfileId": 1,
  "subjectId": 1
}
```

---

## 🔒 Безопасность

- JWT токены хранятся в `config/jwt/`
- Пароли хешируются автоматически через `PasswordHasher`
- API маршруты защищены через firewall в `security.yaml`
- SQLite база данных в `var/app.db`

---

## 📊 Статистика

- **Entities:** 6 (User, TutorProfile, Subject, Availability, Booking, Review)
- **Relations:** 8 (OneToOne, OneToMany, ManyToOne, ManyToMany)
- **API Endpoints:** 25 (5 CRUD операций × 5 ресурсов)
- **Дополнительно:** OpenAPI документация, валидация, JSON-LD контекст

---

## 🛠️ Управление БД

### Создать новую миграцию
```bash
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

### Создать entity вручную
```bash
php bin/console make:entity
```

### Просмотреть SQL
```bash
php bin/console doctrine:schema:update --dump-sql
```

---

## 📚 Полезные ресурсы

- [API Platform документация](https://api-platform.com/docs/)
- [Symfony 7 документация](https://symfony.com/doc/7.0/)
- [Doctrine ORM](https://www.doctrine-project.org/projects/orm.html)
- [Lexik JWT Authentication](https://github.com/lexik/LexikJWTAuthenticationBundle)

---

**Создано:** 09.07.2026
**Версия Symfony:** 7.0.10
**Версия API Platform:** 3.3.15
