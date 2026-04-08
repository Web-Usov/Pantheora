# Run 02: `OpenCode` as Paperclip execution backend

Статус: working baseline established, known workflow gap remains

## Цель попытки

Проверить, подходит ли `OpenCode` лучше, чем `openclaw_gateway`, на роль основного execution backend для `Paperclip`.

## Важное правило этого run

Эта попытка должна идти как чистый отдельный контур.

Нельзя считать её продолжением run 01 на тех же артефактах.

Ожидания:

- отдельный compose или профиль
- отдельная настройка `Paperclip`
- отдельная настройка `OpenClaw`, если он будет участвовать как вспомогательная инфраструктура
- отдельный набор данных или явно изолированный state

## Что хотим проверить

- является ли `OpenCode` более "локальным" Paperclip-агентом по UX и управляемости
- появляются ли нормальные `instruction bundles`
- работает ли skill sync или более близкая к локальному adapter ergonomics модель
- может ли агент не только отчитываться текстом, но и реально менять сущности внутри Paperclip-модели
- как `OpenCode` сосуществует с `OpenClaw`, если `OpenClaw` оставить как runtime / gateway / провайдерный слой

## Что важно сравнить с run 01

- простота поднятия
- воспроизводимость
- identity path
- end-to-end выполнение issue
- глубина управляемости агента из Paperclip UI
- пригодность для сценария "цифровой сотрудник внутри Paperclip"

## Артефакты run

Созданы:

- compose run 02: [docker-compose.opencode.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.opencode.yml)
- Dockerfile для `paperclip + opencode` контейнера: [Dockerfile](/Users/alex/Documents/Develop/web-usov/Pantheora/config/run02/paperclip-opencode/Dockerfile)
- изолированные runtime-paths в compose:
  - `./data/run02/postgres`
  - `./data/run02/paperclip`
  - `./data/run02/opencode-config`
  - `./data/run02/claude-home`
  - рабочий bind mount репозитория в контейнер: `/workspace/pantheora`

## Что уже подтверждено

### 1. Clean reset от run 01 выполнен

Перед запуском run 02 были обнулены:

- контейнеры run 01
- активные runtime data dirs run 01

Run 02 стартует в отдельном compose namespace и с отдельными данными.

### 2. Стенд run 02 поднимается

Подтверждено:

- `postgres` healthy
- `paperclip` healthy
- `Paperclip` API отвечает на `http://localhost:3200/api/health`

### 3. `OpenCode` внутри контейнера реально доступен

Подтверждено внутри `paperclip` контейнера:

- `opencode --version` отрабатывает
- `opencode models` возвращает список моделей

На первом bootstrap это были только встроенные/free модели:

- `opencode/big-pickle`
- `opencode/gpt-5-nano`
- `opencode/minimax-m2.5-free`
- `opencode/nemotron-3-super-free`
- `opencode/qwen3.6-plus-free`

### 4. Clean onboarding нового `Paperclip` instance выполнен

Подтверждено:

- поднята новая инстанция `Paperclip` на `http://localhost:3200`
- создан первый board user через auth API
- bootstrap invite принят
- создана компания run 02
- создан первый агент `CEO` на `adapterType=opencode_local`
- `test-environment` для `opencode_local` вернул `pass`

Практический нюанс:

- `onboard` был выполнен уже после старта контейнера `paperclip`
- из-за этого первый runtime run не видел `PAPERCLIP_AGENT_JWT_SECRET`
- после рестарта `paperclip` startup banner уже показывал `Agent JWT: set`

### 5. OpenAI OAuth внутри `OpenCode` доведён до рабочего состояния

Подтверждено:

- для `OpenCode Web` наружу проброшены порты:
  - `3200` для `Paperclip`
  - `4096` для `OpenCode Web`
  - `1455` для OAuth callback
- авторизация OpenAI прошла через `OpenCode Web`
- после выравнивания runtime-user context `Paperclip` начал видеть те же `openai/*` модели, что и `OpenCode`

Критичный нюанс run 02:

- `OpenCode Web` нужно запускать в том же user-context, который использует `Paperclip` runtime
- для нашего контейнера это не просто "любой node user", а конкретный home/runtime contour `Paperclip`
- без этого OAuth может сохраниться успешно, но `Paperclip` всё равно будет видеть только free-модели

Практически рабочее состояние было получено после синхронизации OpenCode state с home-контуром, из которого `Paperclip` запускает `opencode`

### 6. `Paperclip` реально видит OpenAI модели для `opencode_local`

Подтверждено:

- `Paperclip` adapter endpoint для `opencode_local` начал отдавать `openai/*` модели
- `test-environment` для `openai/gpt-5.4` вернул `pass`
- в agent settings модель можно выбирать напрямую как `provider/model`

Подтверждённые модели включали, например:

- `openai/gpt-5.4`
- `openai/gpt-5.4-mini`
- `openai/gpt-5.3-codex`
- `openai/gpt-5.2`
- `openai/gpt-5.2-codex`

Отдельный нюанс:

- `Detect model` для `opencode_local` не является надёжным сигналом
- в текущем состоянии адаптера он может возвращать `null`, даже когда discovery списка моделей уже работает корректно

## Что уже реализовано в scaffold

- отдельный compose-файл под run 02, не зависящий от `docker-compose.yml` run 01
- отдельный namespace проекта (`pantheora-run02-opencode`)
- отдельные порты (по умолчанию Paperclip UI/API на `http://localhost:3200`)
- отдельная БД и volumes для run 02
- отдельный образ `paperclip`, в который устанавливается `opencode` CLI
- `opencode` config вынесен в отдельный volume, но бинарь не затирается volume mount-ом
- сам репозиторий монтируется в контейнер, чтобы локальный агент мог работать по `cwd=/workspace/pantheora`

## Первые наблюдения

### 1. `opencode_local` действительно соответствует нашей гипотезе лучше, чем `openclaw_gateway`

По upstream `Paperclip` это встроенный local adapter со следующими свойствами:

- `supportsLocalAgentJwt: true`
- skill sync поддерживается
- managed instructions path поддерживается

То есть по архитектурной форме это намного ближе к тому, что мы хотим проверить в run 02.

### 2. Установщик OpenCode дал странный сигнал по версии

Во время сборки официальный installer писал про установку `1.4.0`, но фактический `opencode --version` внутри контейнера вернул:

- `1.3.17`

Это пока не блокер, но это нужно держать в уме как первую аномалию run 02.

### 3. Для контейнерного `opencode_local` важен именно execution-контур `paperclip`

Практический вывод:

- `opencode` должен быть доступен прямо внутри контейнера `paperclip`
- отдельный sidecar сам по себе не решает задачу local adapter execution

Поэтому текущий run 02 строится вокруг кастомного `paperclip` image с установленным `opencode`.

### 4. По форме интеграции локальный adapter выглядит правильно

Подтверждено по API run 02:

- `opencode_local` поддерживает managed instructions
- `opencode_local` поддерживает skill sync
- для созданного агента `CEO` Paperclip показывает установленные skills:
  - `paperclip`
  - `paperclip-create-agent`
  - `paperclip-create-plugin`
  - `para-memory-files`

Также это совпадает с официальной документацией OpenCode:

- OpenCode поддерживает Claude compatibility
- `~/.claude/skills` является официально поддерживаемым fallback location для skills

То есть Paperclip, по крайней мере по конфигурации, складывает runtime skills в корректное место.

## Smoke progression

### Что проверяли

Проверяли минимальный сценарий:

- агент `CEO` на `opencode_local`
- issue, назначенная этому агенту
- ожидание, что агент через Paperclip path:
  - подтянет задачу
  - checkout-нет её
  - оставит комментарий
  - сможет делегировать техническое исполнение подчинённому агенту, если это требуется ролью

### Что произошло на практике

#### Ранний bootstrap-gap

- run стартовал до рестарта `paperclip`
- в логах был warning:
  - `local agent jwt secret missing or invalid; running without injected PAPERCLIP_API_KEY`
- этот run завис и позже был reaped как orphaned

#### После рестарта и настройки OAuth

После рестарта уже было подтверждено:

- `Agent JWT: set`
- в runtime env локального агента появился `PAPERCLIP_API_KEY`
- invocation metadata показывала `cwd=/workspace/pantheora`
- skills для OpenCode числились как installed в `~/.claude/skills`
- `Paperclip` начал видеть `openai/*` модели из `OpenCode`

Ранние попытки всё ещё были шумными:

- агент начал с чтения локальных instruction files
- затем перешёл к локальной памяти и файловым действиям
- создал в репозитории файлы вроде:
  - `memory/2026-04-08.md`
  - `tasks/cto-backlog-triage.md`

Оба smoke run были остановлены вручную, а созданные артефакты удалены из рабочего дерева.

#### Поздний smoke: CEO/CTO цепочка уже сработала

Дальнейший прогон подтвердил, что связка всё же дошла до Paperclip-native orchestration:

- CEO на `opencode_local` создал approval на найм CTO
- approval был одобрен
- агент `CTO` был создан на `opencode_local`
- CEO делегировал технические child issues агенту CTO
- CTO выполнил child issues до статуса `done`
- в логах heartbeat для CTO execution уже были успешные run на `openai/gpt-5.4`

То есть главный вопрос run 02 на уровне "может ли `Paperclip + OpenCode` вообще дойти до агентского исполнения" теперь можно считать закрытым положительно

## Подтверждённые ограничения и наблюдения

### 1. `opencode_local` действительно ближе к целевому local adapter, чем `openclaw_gateway`

По upstream `Paperclip` это встроенный local adapter со следующими свойствами:

- `supportsLocalAgentJwt: true`
- skill sync поддерживается
- managed instructions path поддерживается

То есть по архитектурной форме это намного ближе к тому, что мы хотим проверить в run 02.

### 2. Для контейнерного `opencode_local` критичен правильный user/home contour

Практический вывод:

- `opencode` должен быть доступен прямо внутри контейнера `paperclip`
- web UI, runtime discovery и `Paperclip` backend должны смотреть в один и тот же OpenCode state
- успешный OAuth сам по себе ещё не гарантирует, что `Paperclip` увидит модели

Именно поэтому текущий run 02 строится вокруг кастомного `paperclip` image с установленным `opencode`, а не вокруг отдельного sidecar.

### 3. Установщик OpenCode дал странный сигнал по версии

Во время сборки официальный installer писал про установку `1.4.0`, но фактический `opencode --version` внутри контейнера вернул:

- `1.3.17`

Это пока не блокер, но это нужно держать в уме как первую аномалию run 02.

### 4. Основной текущий gap run 02 не в infra, а в workflow reconciliation

После approval и завершения child issues обнаружен неприятный, но уже узкий дефект orchestration path:

- parent issues могут оставаться в `blocked`
- это воспроизвелось на цепочке `PAN-1`, `PAN-2`, `PAN-3`
- при этом child issues `PAN-4` и `PAN-5` уже были `done`, а approval на CTO был `approved`

Практическая интерпретация:

- это уже не проблема "OpenCode не исполняется"
- это проблема того, что parent issue не получает корректный follow-up transition после делегации и снятия approval blocker

### 5. Ранние CEO run дополнительно страдали от bootstrap-файлов workspace

В одном из ранних heartbeat run для CEO всплывали ошибки вида:

- `HEARTBEAT.md not found`
- `SOUL.md not found`
- `TOOLS.md not found`
- `memory/<date>.md not found`

Это похоже на шум раннего bootstrap и могло мешать follow-up логике именно в момент найма/делегации, но уже не объясняет весь текущий gap со stale `blocked`

## Текущий вывод по run 02

На текущем этапе вывод уже не промежуточный, а существенно сильнее:

- как контейнерный local runtime `opencode_local` связка работает
- `Paperclip` умеет создать такого агента, управлять его instructions/skills и видеть его OpenAI модели
- end-to-end execution с делегацией между агентами подтверждён

Но остаётся конкретный orchestration gap:

- после approval и завершения дочерних задач parent issues могут зависать в `blocked`

Иными словами:

- технический runtime path подтверждён
- сценарий "агент в Paperclip действительно исполняет issue как цифровой сотрудник" подтверждён частично и практическим smoke
- следующий фокус теперь не "оживить OpenCode", а стабилизировать статусную модель и parent/child reconciliation

## Быстрый старт run 02 (черновик)

1. Поднять чистый run 02:

```bash
docker compose -f docker-compose.opencode.yml up -d --build
```

2. Проверить здоровье:

```bash
docker compose -f docker-compose.opencode.yml ps
curl -fsS http://localhost:3200/api/health
```

3. Открыть Paperclip:

```text
http://localhost:3200
```

4. Запустить `OpenCode Web` внутри контейнера в правильном runtime contour и пройти OAuth для OpenAI.
5. Создать агента с `adapterType=opencode_local` и явным `adapterConfig.model` (`provider/model`).
6. Для локальной работы по этому репозиторию использовать `adapterConfig.cwd=/workspace/pantheora`.

## Следующие шаги

Следующие осмысленные проверки для run 02:

- понять, где лучше чинить снятие `blocked` у parent issues после `approval approved` и `child issue done`
- повторить smoke на минимальном general/engineer агенте, чтобы отделить workflow bug от особенностей CEO persona
- отдельно проверить, есть ли upstream-ожидание на ручной parent follow-up или это явный пропуск в automation path
- только после этого решать, фиксировать ли run 02 как preferred baseline по сравнению с run 01
