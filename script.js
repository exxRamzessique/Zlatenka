/* =========================================================
   Любовь к Златеньке — логика сайта
   ========================================================= */

/* ---------- 1. Плавающие сердечки-пузыри на фоне всего сайта ---------- */
let heartIdCounter = 0;

/* Несколько розовых оттенков — от самого бледного до слегка насыщенного —
   плюс отдельная тёплая золотая палитра для редких сердечек-акцентов. */
const HEART_PALETTES = [
  { mid: '#fff0f5', edge: '#ffc2d6', deep: '#e39ab3' }, // самый бледный
  { mid: '#ffe4ec', edge: '#ff9dc0', deep: '#d9668f' }, // средний
  { mid: '#ffd6e2', edge: '#e94f86', deep: '#b52e63' }  // чуть насыщеннее
];
const GOLD_PALETTE = { mid: '#fff3d6', edge: '#f4c95d', deep: '#c99a35' };

function heartBubbleSVG(palette) {
  heartIdCounter += 1;
  const gid = 'heartGrad' + heartIdCounter;
  return `<svg viewBox="0 0 32 29" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${gid}" cx="34%" cy="26%" r="85%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96"/>
        <stop offset="18%" stop-color="${palette.mid}" stop-opacity="0.85"/>
        <stop offset="45%" stop-color="${palette.edge}" stop-opacity="0.65"/>
        <stop offset="75%" stop-color="${palette.edge}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${palette.deep}" stop-opacity="0.4"/>
      </radialGradient>
      <radialGradient id="${gid}shadow" cx="72%" cy="74%" r="55%">
        <stop offset="0%" stop-color="${palette.deep}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${palette.deep}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${gid}blur" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6"/>
      </filter>
    </defs>
    <path d="M16 28.5C16 28.5 1 19 1 9.5C1 4.8 4.8 1 9.5 1C12.3 1 14.8 2.4 16 4.6C17.2 2.4 19.7 1 22.5 1C27.2 1 31 4.8 31 9.5C31 19 16 28.5 16 28.5Z" fill="url(#${gid})"/>
    <path d="M16 28.5C16 28.5 1 19 1 9.5C1 4.8 4.8 1 9.5 1C12.3 1 14.8 2.4 16 4.6C17.2 2.4 19.7 1 22.5 1C27.2 1 31 4.8 31 9.5C31 19 16 28.5 16 28.5Z" fill="url(#${gid}shadow)"/>
    <ellipse cx="10.5" cy="7" rx="4.6" ry="3" fill="#ffffff" opacity="0.9" filter="url(#${gid}blur)"/>
    <path d="M16 28.5C16 28.5 1 19 1 9.5C1 4.8 4.8 1 9.5 1C12.3 1 14.8 2.4 16 4.6C17.2 2.4 19.7 1 22.5 1C27.2 1 31 4.8 31 9.5C31 19 16 28.5 16 28.5Z" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="0.4"/>
  </svg>`;
}

function makeHeartBubble(size, opts) {
  const el = document.createElement('div');
  el.className = 'heart-particle floating' + (opts.isGold ? ' gold' : '');
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = opts.leftPercent + '%';
  el.style.opacity = opts.opacity;
  el.style.animationDuration = opts.duration;
  el.style.animationDelay = opts.delay;
  el.innerHTML = heartBubbleSVG(opts.palette);
  return el;
}

function createFloatingHearts() {
  const container = document.getElementById('heartsBg');
  if (!container) return;

  // На узких экранах частиц чуть меньше — легче для производительности
  const isMobile = window.innerWidth < 640;
  const count = isMobile ? 9 : 15;

  for (let i = 0; i < count; i++) {
    // Редкие золотые сердечки-акценты (примерно каждое 8-е)
    const isGold = Math.random() < 0.12;
    const palette = isGold
      ? GOLD_PALETTE
      : HEART_PALETTES[Math.floor(Math.random() * HEART_PALETTES.length)];

    // Основная масса — заметные сердечки среднего размера, часть —
    // покрупнее, для живой, не однородной картины
    const isFeature = Math.random() < 0.25;
    const size = isFeature ? 62 + Math.random() * 46 : 26 + Math.random() * 34;

    // Разная прозрачность и скорость всплытия — без резких скачков,
    // просто широкий случайный диапазон для естественности
    const opacity = isGold ? 0.65 : 0.4 + Math.random() * 0.4;
    const duration = (10 + Math.random() * 16) + 's';
    const delay = (Math.random() * 16) + 's';

    const heart = makeHeartBubble(size, {
      leftPercent: Math.random() * 100,
      opacity: opacity.toFixed(2),
      duration,
      delay,
      palette,
      isGold
    });
    container.appendChild(heart);
  }
}

/* ---------- 1.1 Параллакс фона от мыши/пальца и скролла ----------
   Слой #heartsBg целиком (все сердечки внутри уже анимированы своими
   CSS-keyframes) дополнительно плавно сдвигается/слегка поворачивается
   вслед за курсором и скроллом — transform родителя складывается с
   transform каждого сердечка, ничего не переcоздаётся на каждое событие,
   события мыши/скролла только обновляют "целевые" значения, а бегущий
   requestAnimationFrame плавно (лерпом) подтягивает к ним текущие. */
function initBackgroundParallax() {
  const layer = document.getElementById('heartsBg');
  if (!layer) return;

  const isMobile = window.innerWidth < 640;
  // На мобильных мышь недоступна — используем только touchmove,
  // и делаем смещение чуть мягче (палец обычно ближе к экрану)
  const moveIntensity = isMobile ? 10 : 18; // макс. смещение слоя, px
  const rotateIntensity = isMobile ? 0.6 : 1.4; // макс. поворот слоя, deg
  const scrollIntensity = 0.05; // доля от прокрутки, идущая в параллакс
  const maxScrollOffset = 70; // ограничиваем, чтобы на длинных страницах не улетало далеко

  let targetX = 0, targetY = 0; // нормализованные координаты курсора/пальца, -1..1
  let currentX = 0, currentY = 0;
  let targetScrollY = window.scrollY;
  let currentScrollY = targetScrollY;

  function lerp(from, to, factor) {
    return from + (to - from) * factor;
  }

  function handlePointer(clientX, clientY) {
    targetX = (clientX / window.innerWidth - 0.5) * 2;
    targetY = (clientY / window.innerHeight - 0.5) * 2;
  }

  function onMouseMove(e) {
    if (isMobile) return; // на мобильных реагируем только на touchmove
    handlePointer(e.clientX, e.clientY);
  }

  function onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  // Скролл слушаем "лениво": просто запоминаем последнее значение,
  // а сглаживание и применение к transform происходит внутри tick()
  // на каждый кадр — так не нужен отдельный throttle/debounce таймер.
  function onScroll() {
    targetScrollY = window.scrollY;
  }

  function tick() {
    currentX = lerp(currentX, targetX, 0.06);
    currentY = lerp(currentY, targetY, 0.06);
    currentScrollY = lerp(currentScrollY, targetScrollY, 0.08);

    const offsetX = currentX * moveIntensity;
    const offsetY = currentY * moveIntensity;
    const rotate = currentX * rotateIntensity;
    const scrollOffset = Math.max(
      -maxScrollOffset,
      Math.min(maxScrollOffset, -currentScrollY * scrollIntensity)
    );

    layer.style.transform =
      `translate3d(${offsetX.toFixed(2)}px, ${(offsetY + scrollOffset).toFixed(2)}px, 0) ` +
      `rotate(${rotate.toFixed(2)}deg)`;

    requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  tick();
}

/* ---------- 2. Плавное появление секций при скролле ---------- */
/* Переиспользуемая функция: подписывает переданные элементы на появление
   при скролле. Вынесена отдельно, чтобы элементы, создаваемые динамически
   (например, остановки дороги в initRoadStops), могли сами себя подписать
   сразу после создания — и не зависели от порядка init-вызовов в конце файла. */
function observeFadeIn(elements) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  elements.forEach((el) => observer.observe(el));
}

function initScrollReveal() {
  observeFadeIn(document.querySelectorAll('.fade-in'));
}

/* ---------- 3. 100 причин (текст) ---------- */
/* Можно редактировать, удалять или добавлять свои причины.
   Тексты используются и в сердце из плиток, и в модальном окне. */
const reasons = [
  'Потому что ты делаешь мою жизнь ярче.',
  'Потому что рядом с тобой мне не нужно притворяться.',
  'Потому что ты умеешь дарить чувство спокойствия.',
  'Потому что ты честно говоришь, что чувствуешь, а не играешь.',
  'Потому что ты вдохновляешь меня становиться тем человеком, которого ты заслуживаешь.',
  'Потому что даже самый обычный звонок с тобой становится лучшей частью дня.',
  'Потому что ты умеешь быть нежной и сильной одновременно.',
  'Потому что твоя любовь чувствуется даже через экран телефона.',
  'Потому что ты стараешься ради меня.',
  'Потому что ты не боишься быть уязвимой рядом со мной.',
  'Потому что ты веришь в нас, даже когда трудно.',
  'Потому что твой смех — самый настоящий на свете.',
  'Потому что ты не боишься любить по-настоящему.',
  'Потому что ты обнимаешь так, что все тревоги исчезают.',
  'Потому что ты умеешь говорить «я люблю тебя» не только словами.',
  'Потому что твой стакан всегда наполовину полон.',
  'Потому что ты честна, даже когда это непросто.',
  'Потому что твоя улыбка делает даже пасмурный день солнечным.',
  'Потому что твоя доброта не показная, а настоящая.',
  'Потому что твои глаза говорят даже тогда, когда ты молчишь.',
  'Потому что ты искренне радуешься моим успехам.',
  'Потому что твоё «доброе утро» — первое, что делает мой день светлее.',
  'Потому что ты не боишься говорить о своих чувствах.',
  'Потому что ты храбрая, даже когда боишься.',
  'Потому что ты заботишься обо мне, даже когда сама устала.',
  'Потому что рядом с тобой я становлюсь спокойнее.',
  'Потому что ты не отпускаешь меня с плохим настроением.',
  'Потому что ты умеешь быть рядом, не спрашивая ничего взамен.',
  'Потому что ты — лучший человек, которого я знаю.',
  'Потому что с тобой будущее не пугает, а вдохновляет.',
  'Потому что ты вдохновляешь меня становиться лучше.',
  'Потому что твоя забота лечит лучше любых лекарств.',
  'Потому что ты выбираешь меня каждый день.',
  'Потому что ты искренне благодарна за простые вещи.',
  'Потому что ты умеешь быть сильной, не теряя нежности.',
  'Потому что ты веришь в меня, даже когда я сам сомневаюсь.',
  'Потому что ты веришь в наше будущее так же крепко, как и я.',
  'Потому что рядом с тобой мне спокойно.',
  'Потому что ты радуешься моим победам, как своим.',
  'Потому что твоя забота чувствуется в каждой мелочи.',
  'Потому что ты — Златенька, и этим всё сказано. 💛'
];

/* ========================================================================
   4. СЕРДЦЕ ИЗ ПЛИТОК — написано с нуля
   ------------------------------------------------------------------------
   Идея в три шага:
   1) По формуле сердца строим силуэт (300 точек контура) и его bounding box —
      это единая система координат для контура И для плиток, чтобы всё
      совпадало пиксель в пиксель.
   2) Заполняем внутреннюю область сердца плотной сеткой точек (проверка
      «точка внутри полигона»), пока их не наберётся с запасом больше, чем
      причин в массиве reasons — это нужно, чтобы сердце было сплошным,
      без дыр.
   3) Из этой плотной сетки часть точек становится крупными кликабельными
      плитками (по одной на каждую причину), а точки, которые остались
      «между» ними — маленькими декоративными заполнителями без текста.
   ======================================================================== */

/* Формула сердца: x = 16·sin³t, y = 13·cos t − 5·cos 2t − 2·cos 3t − cos 4t.
   Знак y меняем на противоположный, потому что на экране ось Y растёт вниз. */
function heartCurvePoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: x, y: -y };
}

/* Проверка «точка внутри многоугольника» методом трассировки луча */
function isInsideHeart(px, py, boundary) {
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const xi = boundary[i].x, yi = boundary[i].y;
    const xj = boundary[j].x, yj = boundary[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/* Проверяет, что весь «отпечаток» квадратной плитки (центр + 4 угла)
   помещается внутри контура — без этого угловые плитки вылезают за край. */
function isFootprintInside(cx, cy, half, boundary) {
  if (!half) return isInsideHeart(cx, cy, boundary);
  const corners = [
    [cx, cy],
    [cx - half, cy - half], [cx + half, cy - half],
    [cx - half, cy + half], [cx + half, cy + half]
  ];
  return corners.every(([x, y]) => isInsideHeart(x, y, boundary));
}

/* Строит контур сердца (300 точек) и его bounding box —
   единая система координат для всего блока. */
function buildHeartBoundary() {
  const boundary = [];
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    boundary.push(heartCurvePoint((i / steps) * Math.PI * 2));
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  boundary.forEach((p) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });
  return { boundary, bbox: { minX, maxX, minY, maxY } };
}

/* Плотно заполняет внутреннюю область сердца точками: подбирает шаг сетки
   так, чтобы точек внутри контура было не меньше targetCount.
   Сетка строится СИММЕТРИЧНО относительно вертикальной оси сердца (x = 0):
   x-координаты берутся строго парами (+gx, −gx), и точка попадает в набор,
   только если ОБЕ стороны пары проходят проверку — иначе итоговое сердце
   выходит перекошенным. Если передан footprintHalf — точка также обязана
   вписываться в контур целиком со своими краями (см. isFootprintInside),
   это не даёт плиткам вылезать за силуэт сердца. */
function fillHeartDensely(boundary, bbox, targetCount, footprintHalf) {
  const half = footprintHalf || 0;
  const halfSpanX = Math.max(Math.abs(bbox.minX), Math.abs(bbox.maxX));

  let points = [];
  for (let spacing = 3.5; spacing > 0.3; spacing -= 0.02) {
    const candidates = [];
    for (let gy = bbox.minY; gy <= bbox.maxY; gy += spacing) {
      if (isFootprintInside(0, gy, half, boundary)) candidates.push({ x: 0, y: gy });
      for (let gx = spacing; gx <= halfSpanX; gx += spacing) {
        const leftOk = isFootprintInside(-gx, gy, half, boundary);
        const rightOk = isFootprintInside(gx, gy, half, boundary);
        if (leftOk && rightOk) {
          candidates.push({ x: -gx, y: gy });
          candidates.push({ x: gx, y: gy });
        }
      }
    }
    if (candidates.length >= targetCount) { points = candidates; break; }
  }
  // сортируем сверху вниз, слева направо — удобно и для номеров, и для задержек
  points.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  return points;
}

/* Переводит точку из координат сердца (x,y) в проценты 0..100 внутри bbox */
function toPercent(point, bbox) {
  return {
    xPct: ((point.x - bbox.minX) / (bbox.maxX - bbox.minX)) * 100,
    yPct: ((point.y - bbox.minY) / (bbox.maxY - bbox.minY)) * 100
  };
}

/* Плавный переход цвета от нежно-розового к бордовому */
function lerpTileColor(t) {
  const start = [255, 214, 224]; // нежно-розовый
  const end = [122, 20, 58];     // бордовый
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function renderHeart() {
  const container = document.getElementById('heartContainer');
  const outlineSvg = document.getElementById('heartOutline');
  const tilesLayer = document.getElementById('heartTiles');
  const modal = document.getElementById('heartModal');
  const modalText = document.getElementById('heartModalText');
  const modalClose = document.getElementById('heartModalClose');
  if (!container || !tilesLayer) return;

  // Сколько плиток-причин показываем: от 30 до 41, ориентируясь на реальное
  // количество причин в массиве (сейчас их 41 — попадает в диапазон).
  const MAIN_COUNT = Math.max(30, Math.min(41, reasons.length));

  // Размеры в процентах контейнера — должны совпадать с шириной в CSS
  // (.heart-tile и .heart-filler), иначе расчёт зазоров потеряет смысл.
  const MAIN_TILE_PCT = 9;
  const DECOR_PCT = 3.6;
  // Минимально допустимое расстояние между центрами, чтобы элементы
  // не наезжали друг на друга (половина одного + половина другого + запас).
  const MIN_DIST_MAIN_DECOR = MAIN_TILE_PCT / 2 + DECOR_PCT / 2 + 1;
  const MIN_DIST_DECOR_DECOR = DECOR_PCT * 0.9;

  const { boundary, bbox } = buildHeartBoundary();

  // Половина размера плитки в тех же "сердечных" единицах, что и контур —
  // нужна, чтобы проверять, вписывается ли весь квадрат плитки в силуэт.
  const mainHalf = (MAIN_TILE_PCT / 100 / 2) * (bbox.maxX - bbox.minX);
  const decorHalf = (DECOR_PCT / 100 / 2) * (bbox.maxX - bbox.minX);

  // Контейнер получает пропорции реального силуэта сердца
  container.style.aspectRatio = ((bbox.maxX - bbox.minX) / (bbox.maxY - bbox.minY)).toFixed(3);

  // --- Контур: рисуем силуэт сердца тонкой линией на подложке ---
  if (outlineSvg) {
    const d = boundary
      .map((p, i) => {
        const { xPct, yPct } = toPercent(p, bbox);
        return (i === 0 ? 'M' : 'L') + xPct.toFixed(2) + ',' + yPct.toFixed(2);
      })
      .join(' ') + ' Z';
    outlineSvg.innerHTML = `<path d="${d}"></path>`;
  }

  /* --- Шаг 1: крупные плитки. Заливаем сетку СРАЗУ под нужное количество,
     с учётом полного размера плитки (mainHalf) — так соседние плитки не
     наезжают друг на друга, а крайние не вылезают за контур сердца. */
  let mainRaw = fillHeartDensely(boundary, bbox, MAIN_COUNT, mainHalf);
  let mainPoints = mainRaw;
  if (mainRaw.length > MAIN_COUNT) {
    // если сетка чуть перебрала количество — равномерно прореживаем
    const step = mainRaw.length / MAIN_COUNT;
    mainPoints = [];
    for (let i = 0; i < MAIN_COUNT; i++) mainPoints.push(mainRaw[Math.floor(i * step)]);
  }
  const mainPct = mainPoints.map((p) => toPercent(p, bbox));

  /* --- Шаг 2: декоративные элементы. Берём намного более плотную сетку-
     кандидатов (тоже с проверкой отпечатка — decorHalf), слегка "дрожим"
     координаты для естественности и оставляем только те точки, которые не
     задевают ни крупные плитки, ни друг друга. */
  const decorRaw = fillHeartDensely(boundary, bbox, MAIN_COUNT * 10, decorHalf);
  const decorCandidates = decorRaw.map((p) => {
    const pct = toPercent(p, bbox);
    return {
      xPct: pct.xPct + (Math.random() - 0.5) * 0.6,
      yPct: pct.yPct + (Math.random() - 0.5) * 0.6
    };
  });

  function distance(a, b) {
    return Math.hypot(a.xPct - b.xPct, a.yPct - b.yPct);
  }

  const decorAccepted = [];
  decorCandidates.forEach((candidate) => {
    const farFromMain = mainPct.every((m) => distance(candidate, m) >= MIN_DIST_MAIN_DECOR);
    const farFromDecor = decorAccepted.every((d) => distance(candidate, d) >= MIN_DIST_DECOR_DECOR);
    if (farFromMain && farFromDecor) decorAccepted.push(candidate);
  });

  const DECOR_SYMBOLS = ['🌸', '💗', '✨', '🌷', '💕', '🌼', '⭐'];
  const frag = document.createDocumentFragment();
  let maxDelaySeconds = 0; // понадобится, чтобы понять, когда сборка закончится

  function randomScatter() {
    return {
      sx: (Math.random() - 0.5) * 700,
      sy: (Math.random() < 0.5 ? -1 : 1) * (280 + Math.random() * 320),
      srot: (Math.random() - 0.5) * 140
    };
  }

  /* --- Рендер крупных плиток --- */
  mainPct.forEach((pos, index) => {
    const t = MAIN_COUNT > 1 ? index / (MAIN_COUNT - 1) : 0;
    // Задержка растёт сверху вниз по сердцу — сборка выглядит единым
    // плавным потоком, а не хаотичными отдельными скачками.
    const delaySeconds = Math.min((pos.yPct / 100) * 1.1, 1.1);
    maxDelaySeconds = Math.max(maxDelaySeconds, delaySeconds);
    const scatter = randomScatter();

    const tile = document.createElement('div');
    tile.className = 'heart-tile';
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.textContent = index + 1;

    tile.style.left = pos.xPct.toFixed(2) + '%';
    tile.style.top = pos.yPct.toFixed(2) + '%';
    tile.style.background = lerpTileColor(t);
    tile.style.color = t < 0.45 ? 'var(--color-heading-deep)' : '#ffffff';
    tile.style.setProperty('--sx', scatter.sx.toFixed(0) + 'px');
    tile.style.setProperty('--sy', scatter.sy.toFixed(0) + 'px');
    tile.style.setProperty('--srot', scatter.srot.toFixed(0) + 'deg');
    tile.style.setProperty('--delay', delaySeconds.toFixed(3) + 's');

    const openModal = () => {
      if (!modal || !modalText) return;
      modalText.textContent = reasons[index] || '';
      modal.classList.remove('hidden');
      requestAnimationFrame(() => modal.classList.add('visible'));
    };
    tile.addEventListener('click', openModal);
    tile.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });

    frag.appendChild(tile);
  });

  /* --- Рендер декоративных элементов (без текста, без клика) --- */
  decorAccepted.forEach((pos) => {
    const delaySeconds = Math.min((pos.yPct / 100) * 1.1, 1.1);
    maxDelaySeconds = Math.max(maxDelaySeconds, delaySeconds);
    const scatter = randomScatter();

    const filler = document.createElement('div');
    filler.className = 'heart-filler';
    filler.setAttribute('aria-hidden', 'true');
    filler.textContent = DECOR_SYMBOLS[Math.floor(Math.random() * DECOR_SYMBOLS.length)];
    filler.style.left = pos.xPct.toFixed(2) + '%';
    filler.style.top = pos.yPct.toFixed(2) + '%';
    filler.style.opacity = (0.5 + Math.random() * 0.3).toFixed(2);
    filler.style.setProperty('--sx', scatter.sx.toFixed(0) + 'px');
    filler.style.setProperty('--sy', scatter.sy.toFixed(0) + 'px');
    filler.style.setProperty('--srot', scatter.srot.toFixed(0) + 'deg');
    filler.style.setProperty('--delay', delaySeconds.toFixed(3) + 's');

    frag.appendChild(filler);
  });

  tilesLayer.appendChild(frag);

  if (modalClose) modalClose.addEventListener('click', closeHeartModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeHeartModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('visible')) closeHeartModal();
  });

  // После того как секция появится на экране и все плитки соберутся —
  // один раз мягко "пульсируем" всем сердцем.
  initHeartAssemblyPulse(tilesLayer, maxDelaySeconds);
}

function closeHeartModal() {
  const modal = document.getElementById('heartModal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => modal.classList.add('hidden'), 250);
}

/* Следит за появлением сердца в области просмотра и, когда сборка плиток
   успевает завершиться (задержка самой последней плитки + время её
   анимации), один раз включает лёгкую пульсацию всего сердца. */
function initHeartAssemblyPulse(tilesLayer, maxDelaySeconds) {
  const section = document.querySelector('.heart-section');
  if (!section || !tilesLayer) return;

  const TILE_TRANSITION_MS = 900; // должно совпадать с transition в CSS
  const BUFFER_MS = 150;
  const totalMs = maxDelaySeconds * 1000 + TILE_TRANSITION_MS + BUFFER_MS;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          tilesLayer.classList.add('pulse-once');
          setTimeout(() => tilesLayer.classList.remove('pulse-once'), 800);
        }, totalMs);
        observer.unobserve(section);
      }
    });
  }, { threshold: 0.15 });

  observer.observe(section);
}

/* Плавающие лепестки на фоне сердца */
function createHeartPetals() {
  const container = document.getElementById('heartPetals');
  if (!container) return;
  const colors = ['#ffd6e0', '#ffe6c2', '#f3d9ff', '#ffd0e6', '#d9ecff'];
  const count = 10;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + '%';
    petal.style.top = Math.random() * 100 + '%';
    petal.style.background = colors[Math.floor(Math.random() * colors.length)];
    petal.style.animationDuration = (7 + Math.random() * 7) + 's';
    petal.style.animationDelay = (Math.random() * 5) + 's';
    petal.style.setProperty('--rot', Math.floor(Math.random() * 360) + 'deg');
    container.appendChild(petal);
  }
}

/* ========================================================================
   5. ДОРОГА НАШЕЙ ЛЮБВИ — шесть остановок с личными воспоминаниями
   ======================================================================== */

/* --- Данные всех остановок: единственное место, где лежит текст.
   Карточки на дороге и модальные окна генерируются из этого массива. --- */
const ROAD_STOPS = [
  {
    id: 'chat',
    left: 21.88, top: 5.36,
    icon: '💬',
    title: 'Первый разговор',
    caption: '«Всё началось спонтанно. Простое «Привет, пообщаемся?» изменило всё.»',
    buttonText: '📖 Вспомнить тот вечер',
    theme: ['#ffd6e0', '#ffb6c1'],
    type: 'chat',
    chat: [
      { time: '17:01', sender: 'Даниил', side: 'left', text: 'Привет, пообщаемся?' },
      { time: '17:57', sender: 'Златенька 🤍', side: 'right', text: 'привет, давай' },
      { time: '18:48', sender: 'Даниил', side: 'left', text: 'Аниме я тоже смотрел' },
      { time: '18:48', sender: 'Даниил', side: 'left', text: 'В твои годы много прям' },
      { time: '18:48', sender: 'Златенька 🤍', side: 'right', text: 'хаха, в мои годы' },
      { time: '19:52', sender: 'Даниил', side: 'left', text: 'Как тебя зовут, если не секрет' },
      { time: '20:07', sender: 'Златенька 🤍', side: 'right', text: 'злата' },
      { time: '20:08', sender: 'Златенька 🤍', side: 'right', text: 'а ты я так понимаю, даня' },
      { time: '20:08', sender: 'Даниил', side: 'left', text: 'Фига, угадала' },
      { time: '20:08', sender: 'Златенька 🤍', side: 'right', text: 'я эксрасекс' },
      { time: '21:33', sender: 'Златенька 🤍', side: 'right', text: 'у тебя внешность такая крутаааая, не удивилась бы если тгк вёл, хаха' },
      { time: '21:40', sender: 'Даниил', side: 'left', text: 'Ой, да ну' },
      { time: '21:41', sender: 'Даниил', side: 'left', text: 'Вот твоя это прям вау' },
      { time: '21:41', sender: 'Даниил', side: 'left', text: 'Ты оч красивая' },
      { time: '21:52', sender: 'Златенька 🤍', side: 'right', text: 'спасибочки)' }
    ]
  },
  {
    id: 'confession',
    left: 78.13, top: 23.21,
    icon: '💌',
    title: 'Признание',
    caption: '«Ровно месяц — и я понял, что хочу быть с тобой навсегда.»',
    buttonText: '💌 Прочитать признание',
    theme: ['#ffd0e6', '#ff9fc7'],
    type: 'letter',
    date: '19 мая 2026',
    time: '5:19 утра',
    paragraphs: [
      'Доброе утро, мой котёнок😊',
      'Сегодня, 19 мая, ровно месяц прошел с момента, как мы начали общаться. За такое короткое время ты успела подарить мне столько позитивных эмоций и чувств, сколько можно не получить за годы жизни.',
      'Мы постепенно узнаем друг друга все лучше. И с каждым днем я люблю тебя все сильнее.',
      'Признаюсь, хотел предложить тебе в июне, но понял, что твои чувства не требуют отсрочки. Я всегда буду ставить их на первое место, ведь мне важно, чтобы ты чувствовала себя хорошо.',
      'Я сам уже не хочу, чтобы все это оставалось простым общением. Котёнок, я тебя люблю, для меня ты стала очень важным человеком в моей жизни.',
      'Хочешь стать моей девушкой? Теперь уже по-настоящему.'
    ],
    bonus: {
      img: 'images/angel-nebula.jpg',
      caption: 'P.S. В этот же день, 19.05.2026, NASA показала всему миру снимок туманности Angel — совпадение, но красивое.'
    }
  },
  {
    id: 'firstmeet',
    left: 21.88, top: 41.07,
    icon: '📷',
    title: 'Первая встреча',
    caption: '«Сначала было просто любопытство. А потом — ты.»',
    buttonText: '☀️ Вспомнить тот день',
    theme: ['#ffe0c2', '#ffc98a'],
    type: 'photo-text',
    photoIcon: '📸',
    photo: 'images/firstmeet.png',
    date: '26 мая 2026',
    paragraphs: [
      'Я ждал этот день больше всего на свете. Наша встреча стала началом чего-то большего.',
      'Было приятно смотреть на тебя весь день, такую красивую, улыбчивую, счастливую. Все вокруг перестало существовать. Именно тогда я понял — это мой человек, тот самый, которого я искал.'
    ]
  },
  {
    id: 'gift',
    left: 78.13, top: 58.93,
    icon: '🧸',
    title: 'Пополнение',
    caption: 'Теперь у тебя есть частичка меня, которая всегда рядом.',
    theme: ['#d4f0e0', '#a8e0bf'],
    type: 'photo-only',
    photoIcon: '🧸',
    photo: 'images/bunny.png',
    wholeCard: true
  },
  {
    id: 'cinema',
    left: 21.88, top: 76.79,
    icon: '🎬',
    title: 'Приключение',
    caption: 'Даже обычный поход в кино с тобой становится приключением.',
    theme: ['#ffe9b0', '#ffd166'],
    type: 'photo-only',
    photoIcon: '🎬',
    photo: 'images/cinema.png',
    wholeCard: true
  },
  {
    id: 'future',
    left: 78.13, top: 94.64,
    icon: '🌅',
    title: 'Далее',
    caption: '',
    theme: ['#ffd0e6', '#ff9fc7'],
    type: 'photo-heading',
    photoIcon: '🌅',
    photo: 'images/couple.png',
    heading: 'Продолжение следует',
    wholeCard: true
  }
];

let roadModalOverlay = null;
let roadModalContentEl = null;
let roadOpenStopId = null;

/* Безопасно вставляет текст (на случай спецсимволов в личных сообщениях) */
function escapeForHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* Плейсхолдер фото внутри модалки.
   ЗАМЕНА НА РЕАЛЬНОЕ ФОТО: замените этот div на
   <img class="road-photo-placeholder" src="images/ваше-фото.jpg" alt="..."> —
   стиль (размер, скругление, тень) уже настроен и подходит для <img>. */
/* Если у остановки задано реальное фото (stop.photo) — показываем его сразу,
   без плейсхолдера. Если нет — как раньше, градиентная заглушка с иконкой.
   ЗАМЕНА ПЛЕЙСХОЛДЕРА НА ФОТО: у нужной остановки в ROAD_STOPS добавьте
   photo: 'images/ваше-фото.jpg' — переключение произойдёт само. */
function buildPhotoPlaceholder(stop) {
  if (stop.photo) {
    const img = document.createElement('img');
    img.className = 'road-photo-placeholder road-photo-real';
    img.src = stop.photo;
    img.alt = stop.title;
    return img;
  }
  const photo = document.createElement('div');
  photo.className = 'road-photo-placeholder';
  photo.style.setProperty('--tile-a', stop.theme[0]);
  photo.style.setProperty('--tile-b', stop.theme[1]);
  photo.textContent = stop.photoIcon;
  return photo;
}

function buildParagraphs(container, paragraphs) {
  paragraphs.forEach((text) => {
    const p = document.createElement('p');
    p.textContent = text;
    container.appendChild(p);
  });
}

/* --- Мини-лайтбокс: разворот маленького бонус-фото на весь экран ---
   Создаётся один раз (buildBonusLightboxShell) и переиспользуется для
   любой такой картинки. Круглый крестик — справа сверху от фото. */
let bonusLightboxOverlay = null;
let bonusLightboxImgEl = null;

function buildBonusLightboxShell() {
  const overlay = document.createElement('div');
  overlay.className = 'bonus-lightbox-overlay hidden';

  const frame = document.createElement('div');
  frame.className = 'bonus-lightbox-frame';

  const img = document.createElement('img');
  img.className = 'bonus-lightbox-img';
  img.alt = '';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'bonus-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closeBonusLightbox);

  frame.appendChild(img);
  frame.appendChild(closeBtn);
  overlay.appendChild(frame);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBonusLightbox(); });

  document.body.appendChild(overlay);
  bonusLightboxOverlay = overlay;
  bonusLightboxImgEl = img;
}

function openBonusLightbox(src) {
  if (!bonusLightboxOverlay) return;
  bonusLightboxImgEl.src = src;
  bonusLightboxOverlay.classList.remove('hidden');
  requestAnimationFrame(() => bonusLightboxOverlay.classList.add('visible'));
}

function closeBonusLightbox() {
  if (!bonusLightboxOverlay) return;
  bonusLightboxOverlay.classList.remove('visible');
  setTimeout(() => bonusLightboxOverlay.classList.add('hidden'), 250);
}

/* Рисует содержимое модалки под конкретную остановку — единая точка входа,
   дальше расходится по типу контента (chat / letter / photo-text / ...). */
function renderStopModal(stop) {
  roadModalContentEl.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'road-modal-title';
  title.textContent = stop.title;
  roadModalContentEl.appendChild(title);

  if (stop.type === 'chat') {
    const chatBox = document.createElement('div');
    chatBox.className = 'road-chat';
    stop.chat.forEach((msg, i) => {
      const bubble = document.createElement('div');
      bubble.className = 'road-chat-msg road-chat-' + msg.side;
      bubble.style.animationDelay = (i * 0.12).toFixed(2) + 's';
      const meta = document.createElement('span');
      meta.className = 'road-chat-meta';
      meta.textContent = msg.sender + ' · ' + msg.time;
      const bubbleText = document.createElement('span');
      bubbleText.className = 'road-chat-bubble';
      bubbleText.innerHTML = escapeForHtml(msg.text);
      bubble.appendChild(meta);
      bubble.appendChild(bubbleText);
      chatBox.appendChild(bubble);
    });
    roadModalContentEl.appendChild(chatBox);
  } else if (stop.type === 'letter') {
    const meta = document.createElement('p');
    meta.className = 'road-modal-meta';
    meta.textContent = stop.date + ' · ' + stop.time;
    roadModalContentEl.appendChild(meta);

    const letterBox = document.createElement('div');
    letterBox.className = 'road-letter';
    buildParagraphs(letterBox, stop.paragraphs);
    roadModalContentEl.appendChild(letterBox);

    // Небольшой необязательный бонус в самом низу — не бросается в глаза
    if (stop.bonus) {
      const bonusBox = document.createElement('div');
      bonusBox.className = 'road-letter-bonus';

      const bonusImg = document.createElement('img');
      bonusImg.className = 'road-letter-bonus-img';
      bonusImg.src = stop.bonus.img;
      bonusImg.alt = '';
      bonusImg.loading = 'lazy';
      bonusImg.setAttribute('role', 'button');
      bonusImg.setAttribute('tabindex', '0');
      bonusImg.setAttribute('aria-label', 'Развернуть фото');
      bonusImg.addEventListener('click', () => openBonusLightbox(stop.bonus.img));
      bonusImg.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBonusLightbox(stop.bonus.img); }
      });

      const bonusCaption = document.createElement('p');
      bonusCaption.className = 'road-letter-bonus-caption';
      bonusCaption.textContent = stop.bonus.caption;

      bonusBox.appendChild(bonusImg);
      bonusBox.appendChild(bonusCaption);
      roadModalContentEl.appendChild(bonusBox);
    }
  } else if (stop.type === 'photo-text') {
    roadModalContentEl.appendChild(buildPhotoPlaceholder(stop));

    const meta = document.createElement('p');
    meta.className = 'road-modal-meta';
    meta.textContent = stop.date;
    roadModalContentEl.appendChild(meta);

    const textBox = document.createElement('div');
    textBox.className = 'road-memory-text';
    buildParagraphs(textBox, stop.paragraphs);
    roadModalContentEl.appendChild(textBox);
  } else if (stop.type === 'photo-only') {
    if (stop.caption) {
      const caption = document.createElement('p');
      caption.className = 'road-modal-meta road-modal-caption';
      caption.textContent = stop.caption;
      roadModalContentEl.appendChild(caption);
    }
    roadModalContentEl.appendChild(buildPhotoPlaceholder(stop));
  } else if (stop.type === 'photo-heading') {
    const heading = document.createElement('p');
    heading.className = 'road-modal-heading';
    heading.textContent = stop.heading;
    roadModalContentEl.appendChild(heading);
    if (stop.caption) {
      const caption = document.createElement('p');
      caption.className = 'road-modal-meta road-modal-caption';
      caption.textContent = stop.caption;
      roadModalContentEl.appendChild(caption);
    }
    roadModalContentEl.appendChild(buildPhotoPlaceholder(stop));
  }
}

/* Вспышка, связывающая клик по остановке с дорогой: маркер "мигает" и
   остаётся отмеченным золотым кольцом как "уже открытый". */
function flashStop(stop) {
  const marker = document.getElementById('marker-' + stop.id);
  if (marker) {
    marker.classList.remove('marker-flash');
    void marker.offsetWidth; // форсируем перезапуск CSS-анимации
    marker.classList.add('marker-flash', 'visited');
  }
}

let roadPreviewOverlay = null;
let roadPreviewTitleEl = null;
let roadPreviewCaptionEl = null;
let roadPreviewBtnEl = null;

/* Создаёт (один раз) DOM небольшого окна-превью: заголовок, текст, который
   раньше был под названием на дороге, и кнопка — по клику на неё уже
   открывается полноценное окно с вложением (перепиской/письмом/фото). */
function buildRoadPreviewShell() {
  const overlay = document.createElement('div');
  overlay.className = 'road-preview-overlay hidden';

  const preview = document.createElement('div');
  preview.className = 'road-preview';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'road-preview-close';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closePreview);

  const title = document.createElement('p');
  title.className = 'road-preview-title';

  const caption = document.createElement('p');
  caption.className = 'road-preview-caption';

  const btn = document.createElement('button');
  btn.className = 'road-preview-btn';

  preview.appendChild(closeBtn);
  preview.appendChild(title);
  preview.appendChild(caption);
  preview.appendChild(btn);
  overlay.appendChild(preview);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePreview(); });

  document.body.appendChild(overlay);
  roadPreviewOverlay = overlay;
  roadPreviewTitleEl = title;
  roadPreviewCaptionEl = caption;
  roadPreviewBtnEl = btn;
}

let roadPreviewStop = null;

function openPreview(stop) {
  roadPreviewStop = stop;
  roadPreviewTitleEl.textContent = stop.title;
  roadPreviewCaptionEl.textContent = stop.caption || '';
  roadPreviewCaptionEl.classList.toggle('hidden', !stop.caption);
  // если у остановки не задан текст кнопки — используем нейтральную подпись
  roadPreviewBtnEl.textContent = stop.buttonText || (stop.icon + ' Смотреть');
  roadPreviewBtnEl.style.setProperty('--tile-a', stop.theme[0]);
  roadPreviewBtnEl.style.setProperty('--tile-b', stop.theme[1]);
  roadPreviewBtnEl.onclick = () => {
    closePreview();
    setTimeout(() => openStop(stop), 260);
  };

  roadPreviewOverlay.classList.remove('hidden');
  requestAnimationFrame(() => roadPreviewOverlay.classList.add('visible'));
}

function closePreview() {
  if (!roadPreviewOverlay) return;
  roadPreviewOverlay.classList.remove('visible');
  setTimeout(() => roadPreviewOverlay.classList.add('hidden'), 300);
}

function reallyOpenStop(stop) {
  renderStopModal(stop);
  roadOpenStopId = stop.id;
  roadModalOverlay.classList.remove('hidden');
  requestAnimationFrame(() => roadModalOverlay.classList.add('visible'));
  flashStop(stop);
}

/* Если уже открыта другая остановка — сперва аккуратно закрываем её,
   и только потом открываем новую (без резкого "перескока" контента). */
function openStop(stop) {
  if (roadOpenStopId && roadOpenStopId !== stop.id) {
    closeRoadModal();
    setTimeout(() => reallyOpenStop(stop), 260);
  } else {
    reallyOpenStop(stop);
  }
}

function closeRoadModal() {
  if (!roadModalOverlay) return;
  roadModalOverlay.classList.remove('visible');
  setTimeout(() => roadModalOverlay.classList.add('hidden'), 300);
  roadOpenStopId = null;
}

/* Создаёт (один раз) DOM модального окна остановки и добавляет в конец body —
   по требованию модалки должны собираться динамически, а не лежать в HTML. */
function buildRoadModalShell() {
  const overlay = document.createElement('div');
  overlay.className = 'road-modal-overlay hidden';
  overlay.id = 'roadModalOverlay';

  const modal = document.createElement('div');
  modal.className = 'road-modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'road-modal-close';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closeRoadModal);

  const content = document.createElement('div');
  content.className = 'road-modal-content';

  modal.appendChild(closeBtn);
  modal.appendChild(content);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeRoadModal(); });

  document.body.appendChild(overlay);
  roadModalOverlay = overlay;
  roadModalContentEl = content;
}

/* Строит маркер + плашку-название одной остановки (без карточки с текстом —
   она теперь показывается в превью-окне при клике). */
function buildStopElement(stop) {
  const wrap = document.createElement('div');
  wrap.className = 'roadmap-stop fade-in';
  wrap.style.left = stop.left + '%';
  wrap.style.top = stop.top + '%';

  const marker = document.createElement('div');
  marker.className = 'roadmap-marker';
  marker.id = 'marker-' + stop.id;
  marker.textContent = stop.icon;
  marker.setAttribute('role', 'button');
  marker.setAttribute('tabindex', '0');
  marker.setAttribute('aria-label', stop.title);

  // Плашка с названием всегда направлена к центру дороги, чтобы не
  // обрезаться краем контейнера: остановки слева (left < 50) — плашка
  // вправо, остановки справа — плашка влево. Клик по плашке всплывает
  // до маркера (она его DOM-потомок), поэтому отдельный обработчик не нужен.
  const flag = document.createElement('span');
  flag.className = 'roadmap-flag ' + (stop.left < 50 ? 'flag-right' : 'flag-left');
  flag.style.setProperty('--tile-a', stop.theme[0]);
  flag.style.setProperty('--tile-b', stop.theme[1]);
  flag.textContent = stop.title;
  marker.appendChild(flag);

  // Остановки с собственной кнопкой в превью (например, "📖 Вспомнить тот
  // вечер") сначала показывают превью с текстом и кнопкой. Остальные
  // (wholeCard: фото/фото+заголовок без отдельной кнопки) открывают
  // вложение сразу по клику — без промежуточного окна.
  const openDirect = () => (stop.wholeCard ? openStop(stop) : openPreview(stop));
  marker.addEventListener('click', openDirect);
  marker.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDirect(); }
  });

  wrap.appendChild(marker);
  return wrap;
}

/* Главная точка входа: строит все остановки, создаёт превью-окно и модалку
   с вложением, вешает общий Escape-обработчик закрытия для обоих окон. */
function initRoadStops() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  buildRoadPreviewShell();
  buildRoadModalShell();
  buildBonusLightboxShell();

  const stopFrag = document.createDocumentFragment();
  const stopElements = [];
  ROAD_STOPS.forEach((stop) => {
    const el = buildStopElement(stop);
    stopElements.push(el);
    stopFrag.appendChild(el);
  });
  grid.appendChild(stopFrag);
  observeFadeIn(stopElements);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (bonusLightboxOverlay && bonusLightboxOverlay.classList.contains('visible')) {
      closeBonusLightbox();
    } else if (roadModalOverlay && roadModalOverlay.classList.contains('visible')) {
      closeRoadModal();
    } else if (roadPreviewOverlay && roadPreviewOverlay.classList.contains('visible')) {
      closePreview();
    }
  });
}

/* --- Прорисовка дороги в такт скроллу ---
   Длина видимого отрезка пути растёт по мере того, как секция проезжает
   через область просмотра: от 0 (секция ещё внизу экрана) до 1 (секция
   целиком уже выше экрана) — то есть дорога "дорисовывается" плавно, а не
   одним прыжком при первом появлении. */
function initRoadmapScrollDraw() {
  const path = document.querySelector('.roadmap-road');
  const wrapper = document.querySelector('.roadmap');
  if (!path || !wrapper) return;

  const length = path.getTotalLength();
  path.style.strokeDasharray = String(length);

  let ticking = false;

  function updateProgress() {
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height + vh;
    const traveled = vh - rect.top;
    const progress = Math.max(0, Math.min(1, traveled / total));
    path.style.strokeDashoffset = String(length * (1 - progress));
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateProgress();
}

/* --- Лёгкий параллакс дороги и искорок от мыши/пальца ---
   Дорога и искорки смещаются в СТОРОНУ, ПРОТИВОПОЛОЖНУЮ движению курсора —
   создаёт ощущение, что путь чуть глубже основного контента. Отключено на
   узких экранах (там же обычно нет мыши, а touch — ещё и просаживает FPS). */
function initRoadmapParallax() {
  const svg = document.querySelector('.roadmap-svg');
  const sparkles = document.getElementById('roadmapSparkles');
  if (!svg && !sparkles) return;
  if (window.innerWidth < 640) return; // на мобильных параллакс отключаем полностью

  let targetX = 0, targetY = 0;
  let curX = 0, curY = 0;

  function setTarget(clientX, clientY) {
    targetX = (clientX / window.innerWidth - 0.5) * 2;
    targetY = (clientY / window.innerHeight - 0.5) * 2;
  }

  function onMouseMove(e) { setTarget(e.clientX, e.clientY); }
  function onTouchMove(e) {
    if (e.touches && e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
  }

  function tick() {
    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;
    // минус — чтобы смещение шло в сторону, обратную курсору
    const offsetX = (-curX * 14).toFixed(1);
    const offsetY = (-curY * 10).toFixed(1);
    const t = `translate(${offsetX}px, ${offsetY}px)`;
    if (svg) svg.style.transform = t;
    if (sparkles) sparkles.style.transform = t;
    requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  tick();
}

/* Разбрасывает несколько мерцающих интерактивных искорок рядом с линией
   дороги: у каждой своя скорость/амплитуда мерцания, при наведении она
   светится золотом, а по клику — плавно "отлетает" и возвращается обратно. */
function initRoadmapSparkles() {
  const container = document.getElementById('roadmapSparkles');
  if (!container) return;
  const symbols = ['✨', '💫', '⭐'];
  // точки рядом с изгибами дороги (в процентах контейнера)
  const spots = [
    { left: 46, top: 12 }, { left: 8, top: 29 }, { left: 60, top: 34 },
    { left: 40, top: 48 }, { left: 88, top: 62 }, { left: 12, top: 68 },
    { left: 55, top: 84 }, { left: 82, top: 90 }
  ];
  spots.forEach((spot) => {
    const el = document.createElement('span');
    el.className = 'roadmap-sparkle';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = spot.left + '%';
    el.style.top = spot.top + '%';
    el.style.animationDuration = (2.2 + Math.random() * 2.6) + 's';
    el.style.animationDelay = (Math.random() * 3) + 's';
    // разная амплитуда мерцания у каждой искорки
    el.style.setProperty('--amp-min', (0.75 + Math.random() * 0.15).toFixed(2));
    el.style.setProperty('--amp-max', (1.05 + Math.random() * 0.25).toFixed(2));

    el.addEventListener('click', () => {
      if (el.classList.contains('fleeing')) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 30;
      el.style.setProperty('--flee-x', (Math.cos(angle) * dist).toFixed(1) + 'px');
      el.style.setProperty('--flee-y', (Math.sin(angle) * dist).toFixed(1) + 'px');
      el.classList.add('fleeing');
      setTimeout(() => el.classList.remove('fleeing'), 2200 + Math.random() * 800);
    });

    container.appendChild(el);
  });
}

/* ---------- 6. Письмо любви ---------- */
function initLetter() {
  const envelope = document.getElementById('envelope');
  const paper = document.getElementById('letterPaper');
  const closeBtn = document.getElementById('letterClose');
  if (!envelope || !paper) return;

  function openLetter() {
    envelope.classList.add('hidden');
    paper.classList.remove('hidden');
    requestAnimationFrame(() => paper.classList.add('visible'));
  }
  function closeLetter() {
    paper.classList.remove('visible');
    setTimeout(() => {
      paper.classList.add('hidden');
      envelope.classList.remove('hidden');
    }, 300);
  }

  envelope.addEventListener('click', openLetter);
  envelope.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLetter(); }
  });
  if (closeBtn) closeBtn.addEventListener('click', closeLetter);
}

/* ---------- 7. Счётчик дней вместе ---------- */
/* ЗАМЕНИТЕ на настоящую дату начала отношений, если она изменится */
const startDate = new Date('2026-05-19T05:39:00');

function updateCounter() {
  const daysEl = document.getElementById('countDays');
  if (!daysEl) return;
  const now = new Date();
  let diff = now - startDate;
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = days;
  document.getElementById('countHours').textContent = String(hours).padStart(2, '0');
  document.getElementById('countMinutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('countSeconds').textContent = String(seconds).padStart(2, '0');
}

/* ---------- 8. Плеер «Наша песня» (SEREBRO — «Мало тебя») ----------
   Аудио — локальный файл audio/our-song.mp3 (см. README, если понадобится
   заменить трек). Плавное появление громкости (fade in) и затухание
   (fade out) реализованы через requestAnimationFrame, который на каждом
   кадре подкручивает audio.volume — так плавность не зависит от частоты
   кадров устройства. */
function initSongPlayer() {
  const triggerBtn = document.getElementById('songTriggerBtn');
  const panel = document.getElementById('songPanel');
  const closeBtn = document.getElementById('songPanelClose');
  const playPauseBtn = document.getElementById('songPlayPause');
  const volumeSlider = document.getElementById('songVolume');
  const msg = document.getElementById('songMsg');
  const audio = document.getElementById('songAudio');
  if (!triggerBtn || !panel || !audio) return;

  const FADE_IN_MS = 1800;   // 1.5–2 секунды на плавное начало
  const FADE_OUT_MS = 2000;  // ~2 секунды на плавное затухание

  let isPanelOpen = false;
  let isPlaying = false;
  let targetVolume = (volumeSlider ? Number(volumeSlider.value) : 70) / 100; // 0..1
  let fadeFrame = null;

  /* --- Плавное изменение audio.volume от текущего значения к целевому --- */
  function fadeVolume(toVolume, duration, onComplete) {
    cancelAnimationFrame(fadeFrame);
    const fromVolume = audio.volume;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      audio.volume = fromVolume + (toVolume - fromVolume) * progress;
      if (progress < 1) {
        fadeFrame = requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    }
    fadeFrame = requestAnimationFrame(step);
  }

  function updateButtons() {
    if (playPauseBtn) {
      playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
      playPauseBtn.setAttribute('aria-label', isPlaying ? 'Пауза' : 'Играть');
    }
    triggerBtn.classList.toggle('is-playing', isPlaying);
    panel.classList.toggle('is-playing', isPlaying);
  }

  /* --- Запуск: громкость с нуля плавно поднимается до targetVolume --- */
  function startPlayback() {
    audio.volume = 0;
    audio.play().then(() => {
      if (msg) msg.textContent = '';
      isPlaying = true;
      updateButtons();
      fadeVolume(targetVolume, FADE_IN_MS);
    }).catch(() => {
      if (msg) msg.textContent = 'Не удалось включить трек.';
    });
  }

  /* --- Остановка: громкость плавно уходит в 0, затем пауза и перемотка на начало --- */
  function stopPlayback() {
    isPlaying = false;
    updateButtons();
    fadeVolume(0, FADE_OUT_MS, () => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function openPanel() {
    isPanelOpen = true;
    panel.classList.add('open');
  }
  function closePanel() {
    isPanelOpen = false;
    panel.classList.remove('open');
  }

  /* --- Кнопка-триггер: открывает/закрывает панель и включает/выключает трек --- */
  triggerBtn.addEventListener('click', () => {
    if (!isPanelOpen) {
      openPanel();
      startPlayback();
    } else {
      closePanel();
      stopPlayback();
    }
  });

  /* --- Крестик: закрывает панель и останавливает музыку --- */
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closePanel();
      stopPlayback();
    });
  }

  /* --- Play/Pause внутри панели: пауза/возобновление без закрытия панели --- */
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (isPlaying) {
        stopPlayback();
      } else {
        startPlayback();
      }
    });
  }

  /* --- Ползунок громкости: сразу применяется, если играет --- */
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      targetVolume = Number(e.target.value) / 100;
      if (isPlaying) {
        cancelAnimationFrame(fadeFrame);
        audio.volume = targetVolume;
      }
    });
  }

  /* --- Если трек доиграл сам до конца --- */
  audio.addEventListener('ended', () => {
    isPlaying = false;
    updateButtons();
    audio.currentTime = 0;
  });
}

/* ---------- 9. Генератор комплиментов ---------- */
const compliments = [
  'Твоя улыбка освещает мой день, как самое яркое солнце ☀️',
  'Твоя доброта делает этот мир прекраснее 🌸',
  'Ты самая тёплая часть моего дня 🤍',
  'Рядом с тобой любые трудности кажутся мелочью 💪',
  'Твой смех — моя любимая мелодия 🎶',
  'Ты умнее, добрее и красивее, чем сама думаешь ✨',
  'Ты — лучшее, что случилось со мной 💛',
  'Твои глаза хранят целую вселенную 🌌',
  'Спасибо, что ты просто есть 🌷',
  'С тобой даже дождливый день кажется солнечным 🌦️',
  'Твоя забота согревает лучше любого пледа 🧣',
  'Ты вдохновляешь меня быть лучше каждый день 🌟',
  'Твоя нежность — моё самое любимое место в мире 🕊️',
  'Ты делаешь обычные моменты волшебными ✨',
  'Я благодарен судьбе за каждый день с тобой 🍀',
  'Ты — моё самое красивое совпадение 💫',
  'Твоё сердце — самое доброе, что я знаю 💗',
  'Рядом с тобой я чувствую себя дома 🏡',
  'Ты делаешь меня счастливее одним своим присутствием 🌼',
  'Я люблю тебя сегодня ещё больше, чем вчера 💕'
];

function initCompliments() {
  const btn = document.getElementById('complimentBtn');
  const bubble = document.getElementById('complimentBubble');
  if (!btn || !bubble) return;
  let hideTimeout;

  btn.addEventListener('click', () => {
    clearTimeout(hideTimeout);
    const text = compliments[Math.floor(Math.random() * compliments.length)];
    bubble.textContent = text;
    bubble.classList.remove('hidden');
    requestAnimationFrame(() => bubble.classList.add('visible'));

    hideTimeout = setTimeout(() => {
      bubble.classList.remove('visible');
      setTimeout(() => bubble.classList.add('hidden'), 400);
    }, 3000);
  });
}

/* ---------- 10. Секретный раздел ---------- */
function initSecret() {
  const heart = document.getElementById('secretHeart');
  const message = document.getElementById('secretMessage');
  const closeBtn = document.getElementById('secretClose');
  if (!heart || !message) return;

  function openSecret() {
    message.classList.remove('hidden');
    requestAnimationFrame(() => message.classList.add('visible'));
  }
  function closeSecret() {
    message.classList.remove('visible');
    setTimeout(() => message.classList.add('hidden'), 300);
  }

  heart.addEventListener('click', openSecret);
  heart.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSecret(); }
  });
  if (closeBtn) closeBtn.addEventListener('click', closeSecret);
  message.addEventListener('click', (e) => { if (e.target === message) closeSecret(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && message.classList.contains('visible')) closeSecret();
  });
}

/* ---------- Запуск всего при загрузке DOM ---------- */
document.addEventListener('DOMContentLoaded', () => {
  createFloatingHearts();
  initBackgroundParallax();
  renderHeart();
  createHeartPetals();
  initRoadStops();
  initScrollReveal();
  initRoadmapScrollDraw();
  initRoadmapParallax();
  initRoadmapSparkles();
  initLetter();
  initSongPlayer();
  initCompliments();
  initSecret();
  updateCounter();
  setInterval(updateCounter, 1000);
});
