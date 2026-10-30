# Velora-2

Лендинг Velora, сверстанный 1:1 по макету Figma
([Concept 1](https://www.figma.com/design/1Ebb2p67jrZHNAmbTDkn0O/Velora?node-id=635-4166)).

Чистые HTML + CSS, без сборки. Макет рассчитан на ширину 1440px.

## Структура

```
index.html          разметка страницы
css/styles.css      стили (все отступы, цвета, размеры шрифтов из Figma)
assets/icons/       логотипы и иконки (SVG)
assets/images/      логотипы партнёров (PNG)
assets/svg/         декоративные фоны: свечения, лучи, линии (SVG)
```

Шрифты (Manrope, Newsreader, Inter, Instrument Sans) подключаются из Google Fonts.

## Запуск

Маски свечений в первом экране грузятся как CSS `mask-image`, поэтому страницу
нужно открывать через локальный сервер, а не двойным кликом по файлу:

```bash
python3 -m http.server 8000
```

и открыть http://localhost:8000.
