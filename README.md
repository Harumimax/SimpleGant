<div align="center">

# 📐 SimpleGant

### Проекты становятся понятнее, когда их видно во времени

Простой веб-сервис для создания диаграмм Ганта в привычном формате  
**«таблица задач + временная шкала»** — без перегруженности больших систем управления проектами.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

</div>

---

## ✨ Что такое SimpleGant

SimpleGant помогает превратить список работ в наглядный план проекта. Задачи остаются в удобной таблице, а справа сразу видно сроки, пересечения, этапы и ключевые даты.

Создайте проект, разложите работу по задачам, настройте календарь и поделитесь готовой диаграммой по публичной ссылке — зрителю не потребуется регистрация.

> **Не ещё один MS Project.**  
> SimpleGant задуман как лёгкий и понятный инструмент для ручного планирования.

## 🧩 Возможности

| | Возможность | Что это даёт |
|---|---|---|
| 📊 | **Таблица + диаграмма Ганта** | Данные и временная шкала находятся в одном рабочем пространстве |
| 🪆 | **Вложенные задачи** | Можно собрать структуру проекта глубиной до пяти уровней |
| 🗓️ | **Несколько периодов** | Одна задача может состоять из нескольких отдельных этапов |
| 🖱️ | **Интерактивное планирование** | Задачи можно перемещать, менять порядок, сроки и длительность |
| 🧱 | **Настраиваемые колонки** | Таблица адаптируется под конкретный проект |
| 🚩 | **Вехи** | Ключевые даты видны вертикальными отметками на всей шкале |
| 🌴 | **Нерабочие дни** | Выходные и особые даты учитываются при расчёте длительности |
| 📝 | **Стикеры** | Свободные заметки можно размещать прямо на рабочей доске |
| 💾 | **Автосохранение** | Изменения сохраняются последовательно в фоне |
| 🔗 | **Публичный просмотр** | Диаграммой можно поделиться по постоянной read-only ссылке |

## 🎬 Как это работает

```text
Создайте проект
       ↓
Добавьте задачи и периоды
       ↓
Расставьте сроки на временной шкале
       ↓
Добавьте вехи, выходные и заметки
       ↓
Поделитесь публичной ссылкой
```

Владелец редактирует проект, а любой человек с публичной ссылкой открывает актуальную диаграмму в безопасном режиме просмотра.

## 🛠️ Технологии

**Frontend**

- React + TypeScript + Vite
- TanStack Query для серверного состояния
- Zustand для локального черновика редактора
- dnd-kit для drag-and-drop
- Tailwind CSS и Lucide Icons
- Vitest + Testing Library

**Backend**

- NestJS + Fastify
- PostgreSQL + Prisma
- Cookie-based авторизация
- bcrypt для хеширования паролей
- Vitest

## 🚀 Быстрый старт

Понадобятся:

- Node.js `24.11+`
- npm
- PostgreSQL

### 1. Установите зависимости

```bash
git clone https://github.com/Harumimax/SimpleGant.git
cd SimpleGant
npm install
```

### 2. Подготовьте переменные окружения

Создайте файлы на основе примеров:

```text
apps/api/.env.example  →  apps/api/.env
apps/web/.env.example  →  apps/web/.env
```

Минимальная конфигурация API:

```env
PORT=3000
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simplegant?schema=public
```

### 3. Подготовьте базу данных

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Запустите приложение

В двух терминалах:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

После запуска frontend будет доступен по адресу [http://localhost:5173](http://localhost:5173).

## 🧪 Проверки проекта

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## 🗂️ Структура репозитория

```text
SimpleGant/
├── apps/
│   ├── web/      # React-приложение
│   └── api/      # NestJS API и Prisma
├── package.json  # команды workspace
└── README.md
```

## 🎯 Философия

SimpleGant строится вокруг трёх принципов:

1. **Наглядность** — состояние проекта должно считываться за несколько секунд.
2. **Простота** — планирование не должно требовать отдельного обучения.
3. **Контроль** — владелец редактирует, остальные безопасно смотрят актуальный план.

---

<div align="center">

**SimpleGant** — меньше управления инструментом, больше управления проектом. 🚀

</div>
