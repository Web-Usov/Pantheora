# Current State

Дата фиксации: 2026-04-08

## Резюме

На текущий момент локальный стенд `Paperclip + OpenClaw` в `docker compose` поднят и работает.
Базовая интеграция между системами подтверждена: Paperclip может будить OpenClaw, а OpenClaw может ходить обратно в Paperclip API и выполнять issue от имени конкретного агента.

При этом выяснилось, что `openclaw_gateway` лучше воспринимать как внешний runtime-адаптер, а не как полноценный "локальный" Paperclip-адаптер для управляемых сотрудников внутри цифровой компании.

## Что сейчас поднято

- `postgres`
- `paperclip`
- `openclaw-gateway`
- `openclaw-cli`

Основной compose-файл: [docker-compose.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.yml)

## Что подтверждено рабочим

### 1. Docker-стенд запускается стабильно

- `paperclip` отвечает на `http://localhost:3100`
- `openclaw-gateway` отвечает на `http://localhost:18789`
- контейнеры остаются `healthy`

### 2. OpenClaw подключается к Paperclip

Для связки оказался критичен внутренний адрес Paperclip:

- правильно: `http://paperclip:3100`
- неправильно для контейнеров: `http://localhost:3100`

Именно поэтому у Paperclip-агентов на `openclaw_gateway` нужно явно задавать `adapterConfig.paperclipApiUrl = "http://paperclip:3100"`.

### 3. CEO теперь исполняется под своей identity

Изначально задачи `CEO` выполнялись фактически от имени другого агента (`OpenClaw`), потому что OpenClaw использовал claimed API key из workspace, а не run-scoped токен конкретного Paperclip-агента.

После патча bootstrap-логики Paperclip подтверждено, что:

- `CEO` успешно делает `issue.checked_out`
- комментарии и закрытие задачи идут от `CEO`
- ошибка `Agent can only checkout as itself` устранена

Проверочный issue: `USO-4`

## Какие патчи понадобились

Патч-файл: [boot-patched-paperclip.mjs](/Users/alex/Documents/Develop/web-usov/Pantheora/config/paperclip/boot-patched-paperclip.mjs)

### 1. Отключение structured payload для старого OpenClaw

Текущий OpenClaw `2026.2.26` не принимал поле `paperclip` в `agent params` и падал с ошибкой вида:

- `invalid agent params: unexpected property 'paperclip'`

Поэтому в bootstrap добавлен conditional patch, отключающий этот payload по env-флагу.

### 2. Включение run-scoped JWT для `openclaw_gateway`

Штатный adapter `openclaw_gateway` из коробки не использовал local agent JWT так, как нам было нужно для корректной identity в Paperclip.

Поэтому bootstrap-патч:

- включает `supportsLocalAgentJwt: true`
- патчит и `src`, и `dist`, чтобы правка реально влияла на рантайм
- прокидывает `PAPERCLIP_API_KEY` как run-scoped токен в wake env

### 3. Корректный Paperclip API URL внутри compose

Без `paperclipApiUrl = http://paperclip:3100` OpenClaw внутри контейнера ходил в неверный `localhost`.

## Главные наблюдения по `openclaw_gateway`

### 1. Это больше внешний runtime, чем "родной" локальный агент Paperclip

Симптомы этого уже видны в UI:

- `Instructions bundles are only available for local adapters.`
- `This adapter does not implement skill sync yet. Paperclip cannot manage OpenClaw skills here.`

Это важное ограничение продукта, а не только локального compose-стенда.

### 2. Управление агентом из Paperclip ограничено

С `openclaw_gateway` Paperclip может:

- будить рантайм
- передавать контекст задачи
- ждать результат

Но Paperclip не получает для такого агента полный UX локального адаптера:

- нет instruction bundles
- нет skill sync
- нет ощущения, что агент полноценно "живёт" внутри Paperclip

### 3. Для бизнес-задач OpenClaw склонен отчитываться текстом, а не изменять Paperclip-модель мира

Пример с просьбой "найми CTO" показал, что агент сформировал план и отчитался о выполнении, но не создал нового Paperclip-агента `CTO`.

Это не обязательно ошибка модели. Это следствие сочетания факторов:

- задача сформулирована как бизнес-цель, а не как точная команда на создание сущности в Paperclip
- `openclaw_gateway` живёт в режиме внешнего runtime
- у адаптера нет тесной встроенной интеграции с Paperclip skill/instruction-моделью

Итог: такой адаптер подходит для "выполни работу и верни результат", но хуже подходит для "будь полноценно управляемым сотрудником внутри Paperclip".

### 4. Агентский inbox не подхватывает `backlog`

Выяснилось, что agent heartbeat и agent inbox-lite используют только статусы:

- `todo`
- `in_progress`
- `blocked`

Если задача висит в `backlog`, агент её сам не подхватывает.

Это не баг текущего патча, а текущее поведение Paperclip server routes / heartbeat flow.

## Практический вывод

Для текущей архитектуры лучше считать:

- `OpenClaw` полезным внешним runtime / gateway / менеджером провайдеров
- `openclaw_gateway` полезным мостом Paperclip -> OpenClaw
- но не лучшим кандидатом на роль основного исполняемого и тонко настраиваемого Paperclip-агента

## Следующий шаг

Следующая гипотеза для проверки:

1. Поднять `OpenCode` в контейнере.
2. Попробовать использовать его как локального агента для Paperclip.
3. Отдельно проверить, можно ли при этом использовать `OpenClaw` как инфраструктурный слой:
   - как gateway/рантайм,
   - как менеджер LLM-провайдеров,
   - как дополнительную control plane / observability-точку.

Желаемая цель следующей итерации:

- получить агента, который лучше управляется из Paperclip
- имеет нормальные instructions / skills / local-adapter ergonomics
- при необходимости всё ещё может сосуществовать с OpenClaw

## Что стоит сделать дальше в репозитории

- описать отдельный `docker-compose` или профиль для эксперимента с `OpenCode`
- не ломать текущий рабочий стенд `Paperclip + OpenClaw`, а сохранить его как подтверждённую baseline-интеграцию
- сравнить два режима:
  - `Paperclip -> OpenClaw gateway`
  - `Paperclip -> OpenCode local adapter`, при опциональном сосуществовании с OpenClaw

## Полезные файлы

- compose: [docker-compose.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.yml)
- quickstart по текущему стенду: [paperclip-openclaw.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/paperclip-openclaw.md)
- bootstrap-патч Paperclip: [boot-patched-paperclip.mjs](/Users/alex/Documents/Develop/web-usov/Pantheora/config/paperclip/boot-patched-paperclip.mjs)
- базовый OpenClaw config: [openclaw.json](/Users/alex/Documents/Develop/web-usov/Pantheora/config/openclaw/openclaw.json)
