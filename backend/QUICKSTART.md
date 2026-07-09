# 🚀 TutorHub API - Быстрый Старт

## ⚡ За 5 минут до первого запроса

### Шаг 1: Запустить сервер
```bash
cd backend
php bin/console server:run
```

Сервер запущен на **http://localhost:8000**

### Шаг 2: Получить JWT токен

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Скопируйте `token` из ответа!**

### Шаг 3: Тестировать API

Замените `YOUR_TOKEN` на полученный токен:

```bash
curl http://localhost:8000/api/users.json \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Основные Операции

### Получить всех пользователей
```bash
curl http://localhost:8000/api/users.json \
  -H "Authorization: Bearer $TOKEN"
```

### Создать новый предмет
```bash
curl -X POST http://localhost:8000/api/subjects.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Английский язык",
    "slug": "english"
  }'
```

### Создать профиль репетитора
```bash
curl -X POST http://localhost:8000/api/tutor_profiles.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user": "/api/users/1",
    "bio": "Native English speaker",
    "city": "Moscow",
    "pricePerHour": "1000.00",
    "isApproved": true
  }'
```

### Получить репетиторов по предмету

Сначала создайте связь Subject ↔ TutorProfile через PUT:

```bash
curl -X PUT http://localhost:8000/api/tutor_profiles/1.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user": "/api/users/1",
    "bio": "Native English speaker",
    "city": "Moscow",
    "pricePerHour": "1000.00",
    "isApproved": true,
    "subjects": ["/api/subjects/1"]
  }'
```

### Добавить расписание репетитора
```bash
curl -X POST http://localhost:8000/api/availabilities.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tutorProfile": "/api/tutor_profiles/1",
    "dayOfWeek": 1,
    "startTime": "10:00:00",
    "endTime": "18:00:00"
  }'
```

*dayOfWeek: 0=пн, 1=вт, 2=ср, 3=чт, 4=пт, 5=сб, 6=вс*

### Создать бронирование
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

### Оставить отзыв о занятии
```bash
curl -X POST http://localhost:8000/api/reviews.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "booking": "/api/bookings/1",
    "rating": 5,
    "comment": "Отличное занятие!"
  }'
```

---

## 🛠️ Управление Пользователями

### Регистрация нового пользователя
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "secure123"
  }'
```

### Создать пользователя через консоль
```bash
php bin/console app:create-user john@example.com mypassword
```

### Обновить пользователя
```bash
curl -X PUT http://localhost:8000/api/users/1.json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "newemail@example.com",
    "password": "newpassword"
  }'
```

### Удалить пользователя
```bash
curl -X DELETE http://localhost:8000/api/users/1.json \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Статусы Бронирований

| Статус | Описание |
|--------|---------|
| `pending` | Ожидание подтверждения |
| `confirmed` | Подтверждено |
| `completed` | Завершено |
| `cancelled` | Отменено |

---

## 🔍 Фильтрация и Поиск

API Platform поддерживает фильтрацию через query параметры:

```bash
# Получить пользователя по email
curl "http://localhost:8000/api/users.json?email=test@example.com" \
  -H "Authorization: Bearer $TOKEN"

# Получить бронирования со статусом "pending"
curl "http://localhost:8000/api/bookings.json?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Возможные Ошибки

### `401 JWT Token not found`
Забыли добавить заголовок `Authorization`? Добавьте:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### `401 Invalid credentials`
Неверный email или пароль при логине. Проверьте учётные данные.

### `409 User with this email already exists`
Пользователь с таким email уже зарегистрирован. Используйте другой email.

### `400 Missing email or password`
При регистрации нужны оба поля: `email` и `password`.

---

## 📖 Полная Документация

Откройте интерактивную документацию OpenAPI:
```
http://localhost:8000/api/docs
```

или

```
http://localhost:8000/api/docs.json
```

---

## 💡 Советы

1. **Используйте Postman или Insomnia** для удобного тестирования:
   - Сохраняйте токен в переменные окружения
   - Используйте Collections для организации запросов
   - Автоматически обновляйте токены

2. **Формат ответов:**
   - JSON-LD (по умолчанию)
   - JSON API (добавьте в URL: `.jsonapi`)
   - Hydra (стандартный для API Platform)

3. **Пагинация:**
   ```bash
   # Первые 10 элементов
   curl "http://localhost:8000/api/users.json?page=1&itemsPerPage=10"
   
   # Вторая страница
   curl "http://localhost:8000/api/users.json?page=2&itemsPerPage=10"
   ```

4. **Сортировка:**
   ```bash
   # По дате создания (убывание)
   curl "http://localhost:8000/api/bookings.json?order[createdAt]=desc"
   ```

---

## 🔗 Полезные Ссылки

- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Полная документация
- [API Platform Docs](https://api-platform.com/docs/)
- [Symfony Docs](https://symfony.com/doc/7.0/)
- [JWT Authentication](https://github.com/lexik/LexikJWTAuthenticationBundle)

---

**Готово? Запускайте сервер и начинайте разработку! 🎉**
