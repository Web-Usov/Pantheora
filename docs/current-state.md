# Current State

Дата фиксации: 2026-04-08

## Резюме

Репозиторий сейчас нужно воспринимать как площадку для последовательных экспериментов с execution backend для `Paperclip`, а не как уже зафиксированную финальную архитектуру.

`README` отражает общее целевое видение проекта, а конкретные результаты отдельных попыток должны жить в отдельных документах внутри `docs/`.

## Как читать документацию

- [README.md](/Users/alex/Documents/Develop/web-usov/Pantheora/README.md) — стратегическое направление проекта
- [docs/current-state.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/current-state.md) — общий статус репозитория и структура экспериментов
- [docs/paperclip-openclaw.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/paperclip-openclaw.md) — quickstart и техничка по текущему OpenClaw compose-стенду
- [docs/runs/openclaw-gateway.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/openclaw-gateway.md) — отдельная запись по попытке использовать `openclaw_gateway` как основной backend исполнения
- [docs/runs/opencode.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/opencode.md) — planned run для чистой попытки с `OpenCode`

## Текущий статус по попыткам

### Run 01. `openclaw_gateway`

Статус:

- интеграция технически рабочая
- как основной execution backend для Paperclip не принята

Подробности:

- [docs/runs/openclaw-gateway.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/openclaw-gateway.md)

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

## Следующий planned run

Следующая чистая попытка:

- `OpenCode` как основной execution backend для `Paperclip`

Важно:

- запускать его отдельно от первой попытки
- не опираться на артефакты `openclaw_gateway` run
- документировать результаты в новой отдельной run-доке

Черновик этого run:

- [docs/runs/opencode.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/runs/opencode.md)

## Практический смысл этого файла

Этот файл не должен превращаться в журнал одной конкретной интеграции.

Он нужен как общий навигатор:

- куда смотреть за общей картиной
- где лежат результаты отдельных run
- какой следующий run планируется
