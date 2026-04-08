# Paperclip + OpenClaw via Docker Compose

Актуальный статус, выводы и ограничения этой интеграции зафиксированы отдельно в
[docs/current-state.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/current-state.md).

Этот стенд поднимает:

- `paperclip` как UI/API-слой оркестрации
- `openclaw-gateway` как внешний agent runtime
- `openclaw-cli` как вспомогательный CLI в той же сетевой namespace
- `postgres` как внешнюю БД для Paperclip

## Что это даёт

Есть два практических режима связки:

1. Базовый, рекомендованный для первого запуска:
   Paperclip использует штатный adapter `openclaw_gateway` и сам вызывает OpenClaw по WebSocket.

2. Расширенный:
   OpenClaw дополнительно получает `paperclipApiUrl` и может использовать Paperclip skill/API внутри своих сессий.

Для первого запуска достаточно режима 1. Он проще и ближе к реальному production-контракту между системами.

## Быстрый старт

1. Создать `.env`:

   ```bash
   cp .env.example .env
   ```

2. Заполнить как минимум:

   - `BETTER_AUTH_SECRET`
   - `OPENCLAW_GATEWAY_TOKEN`
   - `OPENAI_API_KEY` или другой поддерживаемый ключ модели

3. Поднять стенд:

   ```bash
   docker compose up -d
   ```

4. Проверить здоровье:

   ```bash
   docker compose ps
   curl -fsS http://localhost:3100/api/health
   curl -fsS http://localhost:18789/healthz
   ```

5. Открыть:

   - Paperclip: `http://localhost:3100`
   - OpenClaw Control UI: `http://localhost:18789`

6. Получить dashboard URL для OpenClaw при необходимости:

   ```bash
   docker compose run --rm openclaw-cli dashboard --no-open
   ```

## Как связать их на практике

### Вариант A. Самый быстрый путь

Создайте или отредактируйте агента в Paperclip и задайте:

- `adapterType`: `openclaw_gateway`
- `url`: `ws://openclaw-gateway:18789`
- `headers.x-openclaw-token`: значение `OPENCLAW_GATEWAY_TOKEN` из `.env`
- `sessionKeyStrategy`: `issue`
- `role`: `operator`
- `scopes`: `["operator.admin"]`

Опционально добавьте:

- `paperclipApiUrl`: `http://paperclip:3100`

Это уже достаточно, чтобы Paperclip будил OpenClaw как внешний runtime и отправлял ему задачи.

Пример adapter config:

```json
{
  "url": "ws://openclaw-gateway:18789",
  "paperclipApiUrl": "http://paperclip:3100",
  "headers": {
    "x-openclaw-token": "replace-with-your-token"
  },
  "waitTimeoutMs": 120000,
  "sessionKeyStrategy": "issue",
  "role": "operator",
  "scopes": ["operator.admin"]
}
```

### Вариант B. Через нативный invite flow

Это ближе к тому, как Paperclip сам задумал onboarding OpenClaw:

1. В Paperclip откройте company settings.
2. Сгенерируйте `OpenClaw Invite Prompt`.
3. В prompt или JSON-полях используйте внутренние docker-адреса:

   - `agentDefaultsPayload.url = ws://openclaw-gateway:18789`
   - `agentDefaultsPayload.paperclipApiUrl = http://paperclip:3100`
   - `agentDefaultsPayload.headers["x-openclaw-token"] = <OPENCLAW_GATEWAY_TOKEN>`

4. Подтвердите join request в Paperclip.

Этот сценарий нужен, если хотите проверить полный lifecycle `join -> approve -> claim -> skill bootstrap`.

## Почему здесь используются внутренние адреса Docker

В браузере вы заходите в Paperclip через `http://localhost:3100`, но из контейнера OpenClaw адрес `localhost` указывает уже на сам контейнер OpenClaw.

Поэтому для межсервисной связи внутри compose используем:

- `http://paperclip:3100` для доступа OpenClaw к Paperclip API
- `ws://openclaw-gateway:18789` для доступа Paperclip к OpenClaw gateway

Для этого в `.env.example` уже добавлен `PAPERCLIP_ALLOWED_HOSTNAMES=...,paperclip,...`.

## Полезные команды

Логи:

```bash
docker compose logs -f paperclip openclaw-gateway
```

OpenClaw devices:

```bash
docker compose run --rm openclaw-cli devices list
```

Если первое выполнение упрётся в pairing, можно подтвердить устройство и повторить запуск:

```bash
docker compose run --rm openclaw-cli devices approve --latest
```

Остановить стенд:

```bash
docker compose down
```

Сбросить состояние:

```bash
docker compose down -v
rm -rf data/
```

## Что проверить после первого запуска

- Paperclip UI открывается и отвечает `/api/health`
- OpenClaw Control UI открывается на `18789`
- агент Paperclip с `openclaw_gateway` может получить задачу
- OpenClaw принимает WebSocket-подключение от Paperclip
- при наличии `paperclipApiUrl` OpenClaw может использовать Paperclip skill/API как внутренний инструмент

## Ограничения текущего стенда

- Это локальный интеграционный compose, а не готовый production deployment
- Секреты пока лежат в `.env`
- Набор моделей и auth-профилей OpenClaw минимальный
- В бою стоит добавить reverse proxy, TLS, внешние секреты и наблюдаемость
