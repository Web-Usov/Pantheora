# Current State

Дата фиксации: 2026-04-09

## Резюме

Репозиторий сейчас нужно воспринимать как площадку для последовательных экспериментов с execution backend для `Paperclip`, а не как уже зафиксированную финальную архитектуру.

`README` отражает общее целевое видение проекта, а конкретные результаты отдельных попыток должны жить в отдельных документах внутри `docs/`.

## Как читать документацию

- [README.md](/Users/alex/Documents/Develop/web-usov/Pantheora/README.md) — стратегическое направление проекта
- [docs/current-state.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/current-state.md) — общий статус репозитория и структура экспериментов
- [docs/paperclip-openclaw.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/paperclip-openclaw.md) — quickstart и техничка по текущему OpenClaw compose-стенду
- [docs/runs/openclaw-gateway.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/openclaw-gateway.md) — отдельная запись по попытке использовать `openclaw_gateway` как основной backend исполнения
- [docs/runs/opencode.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/opencode.md) — отдельная запись по чистой попытке с `OpenCode`

## Текущий статус по попыткам

### Run 01. `openclaw_gateway`

Статус:

- интеграция технически рабочая
- как основной execution backend для Paperclip не принята

Подробности:

- [docs/runs/openclaw-gateway.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/openclaw-gateway.md)

### Run 02. `OpenCode`

Статус:

- clean compose и отдельный data contour подтверждены
- `Paperclip` onboarding для новой инстанции выполнен
- `OpenCode` подключён через OAuth и виден из `Paperclip`
- `opencode_local` видит `openai/*` модели и проходит environment test
- CEO/CTO сценарий с делегацией и child execution подтверждён
- остаётся workflow gap: parent issues могут зависать в `blocked` после approval и завершения дочерних задач

Подробности:

- [docs/runs/opencode.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/opencode.md)

## Что считается общим baseline репозитория

Сейчас в репозитории сохранён подтверждённый baseline первой попытки:

- [docker-compose.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.yml)
- [docker-compose.openclaw.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.openclaw.yml)
- [config/paperclip/boot-patched-paperclip.mjs](/Users/alex/Documents/Develop/web-usov/Pantheora/config/paperclip/boot-patched-paperclip.mjs)
- [config/openclaw/openclaw.json](/Users/alex/Documents/Develop/web-usov/Pantheora/config/openclaw/openclaw.json)

Этот baseline важен как воспроизводимая запись первой рабочей интеграции, но он не равен окончательному архитектурному выбору проекта.

## Правило для следующих попыток

Каждый новый execution-вариант нужно исследовать отдельно:

- отдельный compose или профиль
- отдельные настройки
- отдельный контур данных
- отдельная документация по итогам

То есть следующий вариант не должен дописываться в запись про `openclaw_gateway`, если он исследует другую execution-модель.

## Следующий фокус

Текущий активный фокус:

- продолжать `Run 02` с `OpenCode`, но уже не на уровне infra bootstrap, а на уровне orchestration behavior

Практически это означает:

- не ломать clean compose run 02
- не откатывать рабочую OAuth/model discovery связку между `Paperclip` и `OpenCode`
- отдельно выяснить, почему parent issues остаются в `blocked` после `approval approved` и `child issue done`
- после этого повторить более чистый smoke на минимальном local агенте без тяжёлой CEO persona

## Практический смысл этого файла

Этот файл не должен превращаться в журнал одной конкретной интеграции.

Он нужен как общий навигатор:

- куда смотреть за общей картиной
- где лежат результаты отдельных run
- какой следующий run планируется
