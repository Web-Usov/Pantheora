# Run 01: `openclaw_gateway` as Paperclip execution backend

Дата фиксации: 2026-04-08

## Цель попытки

Проверить, можно ли использовать `OpenClaw` через штатный Paperclip adapter `openclaw_gateway` как основной источник исполнения задач внутри Paperclip-команды.

Идея была такой:

- `Paperclip` управляет компанией, ролями и issue
- `OpenClaw` выступает основным execution runtime
- роли вроде `CEO` живут в Paperclip, но реально исполняются через `openclaw_gateway`

## Что входило в эту попытку

Артефакты этого run:

- compose стенд: [docker-compose.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.yml)
- plain OpenClaw стенд: [docker-compose.openclaw.yml](/Users/alex/Documents/Develop/web-usov/Pantheora/docker-compose.openclaw.yml)
- bootstrap-патч Paperclip: [config/paperclip/boot-patched-paperclip.mjs](/Users/alex/Documents/Develop/web-usov/Pantheora/config/paperclip/boot-patched-paperclip.mjs)
- базовый OpenClaw config: [config/openclaw/openclaw.json](/Users/alex/Documents/Develop/web-usov/Pantheora/config/openclaw/openclaw.json)
- quickstart этой связки: [docs/paperclip-openclaw.md](/Users/alex/Documents/Develop/web-usov/Pantheora/docs/paperclip-openclaw.md)

## Что удалось

### 1. Связка `Paperclip <-> OpenClaw` реально заработала

Подтверждено, что:

- `paperclip`
- `openclaw-gateway`
- `postgres`

могут жить в одном compose-стенде и работать между собой.

### 2. OpenClaw может исполнять задачи Paperclip

После отладки получилось добиться корректного end-to-end сценария:

- Paperclip будит OpenClaw
- OpenClaw ходит в Paperclip API
- агент читает issue
- агент checkout-ит задачу
- агент пишет комментарий
- агент закрывает issue

### 3. Исполнение удалось привязать к identity конкретного агента

После патча на run-scoped JWT `CEO` перестал исполняться как другой агент и начал действовать от собственного имени.

Проверочный кейс:

- `USO-4`

В activity было подтверждено:

- `issue.checked_out` от `CEO`
- комментарии от `CEO`
- `done` от `CEO`

## Что пришлось чинить руками

### 1. Structured payload ломал старый OpenClaw

OpenClaw `2026.2.26` не принимал поле `paperclip` в agent params.

Ошибка:

- `invalid agent params: unexpected property 'paperclip'`

Решение:

- bootstrap-патч в [boot-patched-paperclip.mjs](/Users/alex/Documents/Develop/web-usov/Pantheora/config/paperclip/boot-patched-paperclip.mjs)

### 2. `localhost` внутри контейнера вёл не туда

Для связи внутри compose нельзя использовать браузерное `http://localhost:3100`.

Нужен внутренний адрес:

- `http://paperclip:3100`

Именно поэтому для Paperclip-агентов на `openclaw_gateway` оказался нужен:

- `adapterConfig.paperclipApiUrl = "http://paperclip:3100"`

### 3. По умолчанию ломалась identity агента

Без патча OpenClaw использовал claimed API key из workspace, а не run-scoped токен конкретного агента Paperclip.

Симптомы:

- `Agent can only checkout as itself`
- активность писалась не от нужного агента

Решение:

- включить `supportsLocalAgentJwt`
- прокинуть `PAPERCLIP_API_KEY` как run-scoped токен в wake env
- патчить и `src`, и `dist`, чтобы это влияло на живой рантайм

## Наблюдения именно про `openclaw_gateway`

### 1. Это внешний runtime bridge, а не полноценный локальный Paperclip adapter

Это видно не только по ощущениям, но и по UI-сигналам:

- `Instructions bundles are only available for local adapters.`
- `This adapter does not implement skill sync yet. Paperclip cannot manage OpenClaw skills here.`

Практический смысл:

- агент можно будить
- агент может выполнять задачу
- но Paperclip не управляет им так глубоко, как локальным адаптером

### 2. Он подходит для "сделай работу и верни результат"

`openclaw_gateway` хорошо подходит там, где нужен внешний исполнитель:

- прочитай задачу
- выполни шаги
- отпишись
- закрой issue

### 3. Он хуже подходит для "будь нативным сотрудником внутри Paperclip"

Когда пользовательская цель требует не только текста, но и реального изменения модели Paperclip-команды, возникают ограничения.

Кейс:

- просьба к `CEO` "найми CTO"

Результат:

- агент составил план
- отчитался о выполнении
- но нового агента `CTO` в Paperclip не появилось

Это важное наблюдение именно про пригодность `openclaw_gateway` как главного execution backend.

### 4. Поведение задач зависит от Paperclip heartbeat-модели

Агент сам подхватывает только:

- `todo`
- `in_progress`
- `blocked`

`backlog` сам не исполняется.

Это уже ограничение не самого OpenClaw, а общей схемы работы связки, но для этого run оно важно.

## Итог этой попытки

Попытка считается частично успешной.

Успех:

- техническая интеграция рабочая
- execution path подтверждён
- identity path подтверждён после патчей

Неуспех:

- `openclaw_gateway` не дал ощущения полноценного основного управляемого Paperclip-агента
- у него нет нужной ergonomics локального адаптера
- для сценариев "цифровой сотрудник внутри Paperclip" эта модель выглядит слабее, чем хотелось

## Решение по итогам run

`openclaw_gateway` не выбран как основной execution backend проекта.

Его полезно сохранять как:

- рабочий bridge `Paperclip -> OpenClaw`
- внешний runtime path
- подтверждённый интеграционный baseline

Но следующий основной эксперимент нужно делать в чистом контуре и отдельно.

## Что дальше

Следующий run должен быть отдельным:

- отдельный compose
- отдельная настройка Paperclip
- отдельная настройка OpenClaw
- без артефактов предыдущей попытки
- с отдельной документацией по результатам

Следующая целевая гипотеза:

- `OpenCode` как основной execution backend для Paperclip

Этот следующий run нужно документировать в отдельном файле, а не дописывать в эту запись.
