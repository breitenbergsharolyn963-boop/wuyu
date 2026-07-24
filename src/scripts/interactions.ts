/**
 * interactions.ts —— 交互与动画增强（增强层，非串联层）
 *
 * 设计原则：
 *  - 纯原生 TS，无框架、无动画库。
 *  - 仅操作真实已存在的 DOM（通过 class / id 选择器），不新增 DOM、不改动 HTML 结构。
 *  - 元素不存在时静默跳过，绝不抛错。
 *  - 全程尊重 prefers-reduced-motion：降级时跳过所有新增动效。
 *
 * 说明：滚动揭示（[data-reveal]）与进度条 / 返回顶部由 BaseLayout 自身负责。
 * 本文件在其之上叠加四类增强：光标光晕、视差、统计计数、卡片悬停光晕跟随。
 */

/** 是否处于「减少动态效果」偏好。 */
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** requestAnimationFrame 节流：合并高频事件，每帧最多执行一次。 */
function rafThrottle<T extends (...args: any[]) => void>(fn: T): T {
  let ticking = false;
  let lastArgs: any[] = [];
  return ((...args: any[]) => {
    lastArgs = args;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      fn(...lastArgs);
    });
  }) as T;
}

/* ----------------------------------------------------------------
 * 1) Hero 光标光晕（cursor glow）
 *    复用现有 .aurora 容器作为光晕承载体（不新增 DOM），
 *    通过 CSS 变量 --glow-x / --glow-y 跟随鼠标，仅在 .hero 区域内生效。
 * ---------------------------------------------------------------- */
function initCursorGlow(): void {
  if (prefersReducedMotion()) return;
  const hero = document.querySelector<HTMLElement>('.hero');
  const aurora = hero?.querySelector<HTMLElement>('.aurora');
  if (!hero || !aurora) return;

  // 初始置于偏上方，光晕柔和铺底（置于 blob 之后，不遮挡内容）。
  aurora.style.setProperty('--glow-x', '50%');
  aurora.style.setProperty('--glow-y', '32%');
  aurora.style.background =
    'radial-gradient(640px circle at var(--glow-x) var(--glow-y), rgba(99,102,241,0.20), rgba(139,92,246,0.10) 36%, transparent 62%)';

  const onMove = rafThrottle((e: MouseEvent) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    aurora.style.setProperty('--glow-x', `${x.toFixed(2)}%`);
    aurora.style.setProperty('--glow-y', `${y.toFixed(2)}%`);
  });

  const onLeave = () => {
    aurora.style.setProperty('--glow-x', '50%');
    aurora.style.setProperty('--glow-y', '32%');
  };

  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', onLeave);
}

/* ----------------------------------------------------------------
 * 2) 轻微视差（parallax）
 *    - .aurora 背景随滚动缓慢反向位移（被 .hero overflow:hidden 裁切）。
 *    - .hero-inner 整体随滚动轻微下移，与背景形成层次差。
 *    二者均非 [data-reveal]，不会与揭示的 transform 冲突。
 * ---------------------------------------------------------------- */
function initParallax(): void {
  if (prefersReducedMotion()) return;
  const aurora = document.querySelector<HTMLElement>('.hero .aurora');
  const inner = document.querySelector<HTMLElement>('.hero .hero-inner');
  if (!aurora && !inner) return;

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;
    if (aurora) {
      aurora.style.transform = `translate3d(0, ${(y * -0.06).toFixed(2)}px, 0)`;
    }
    if (inner) {
      inner.style.transform = `translate3d(0, ${(y * 0.12).toFixed(2)}px, 0)`;
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ----------------------------------------------------------------
 * 3) 统计区数字计数动画
 *    解析 .stat-value 文本中的数字部分，进入视口时从 0 缓动到目标值，
 *    保留前缀（如空）与后缀（μm / ⁺ / ⁿ 等）。
 *    例：30μm → 0→30 + μm；10⁹ → 0→10 + ⁿ；3+ → 0→3 + +。
 * ---------------------------------------------------------------- */
function parseStat(text: string): { prefix: string; num: number; suffix: string } | null {
  const m = text.trim().match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!m) return null;
  const num = parseInt(m[2].replace(/,/g, ''), 10);
  if (!Number.isFinite(num)) return null;
  return { prefix: m[1], num, suffix: m[3] };
}

function animateCount(el: HTMLElement, info: { prefix: string; num: number; suffix: string }): void {
  // 减少动态效果：直接呈现终值（文本本就是终值，这里仅确保不被重置覆盖）。
  if (prefersReducedMotion()) {
    el.textContent = info.prefix + info.num + info.suffix;
    return;
  }
  const duration = 1400;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const cur = Math.round(info.num * eased);
    el.textContent = info.prefix + cur + info.suffix;
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = info.prefix + info.num + info.suffix;
    }
  };
  requestAnimationFrame(tick);
}

function initStatCountUp(): void {
  const values = document.querySelectorAll<HTMLElement>('.stat-value');
  if (!values.length) return;

  const run = (el: HTMLElement) => {
    const info = parseStat(el.textContent || '');
    if (info) animateCount(el, info);
  };

  if (!('IntersectionObserver' in window)) {
    values.forEach(run);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  values.forEach((el) => io.observe(el));
}

/* ----------------------------------------------------------------
 * 4) 卡片悬停光晕跟随（hover glow follow）
 *    复用现有 .card（含 .project / .car-slide / .skill-group /
 *    .resume-hero / .contact-form 等）的 background-image 叠加一层
 *    跟随鼠标的径向渐变，不影响原有 background-color。移出时清除。
 * ---------------------------------------------------------------- */
function initCardGlow(): void {
  if (prefersReducedMotion()) return;
  const cards = document.querySelectorAll<HTMLElement>('.card');
  cards.forEach((card) => {
    const onEnter = () => {
      card.style.backgroundImage =
        'radial-gradient(240px circle at var(--card-x, 50%) var(--card-y, 50%), rgba(99,102,241,0.14), transparent 72%)';
    };
    const onMove = rafThrottle((e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--card-x', `${x.toFixed(2)}%`);
      card.style.setProperty('--card-y', `${y.toFixed(2)}%`);
    });
    const onLeave = () => {
      card.style.backgroundImage = '';
    };
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

/* ----------------------------------------------------------------
 * 5) 标题解码（scramble / decode）
 *    对 .hero-greeting 与 .hero-title .gradient-text 做字符翻滚解锁，
 *    加载时从乱码逐位收敛为目标文字，营造赛博式入场。
 * ---------------------------------------------------------------- */
function initScramble(): void {
  if (prefersReducedMotion()) return;
  const targets = document.querySelectorAll<HTMLElement>(
    '.hero-greeting, .hero-title .gradient-text'
  );
  if (!targets.length) return;

  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}=+*^?#';
  const cjk = '吴宇颗粒流仿真真空天地玄黄宇宙洪荒赵钱孙李周郑王';
  const glyph = (): string =>
    Math.random() < 0.5
      ? latin[Math.floor(Math.random() * latin.length)]
      : cjk[Math.floor(Math.random() * cjk.length)];

  targets.forEach((el) => {
    const finalText = el.textContent || '';
    const total = finalText.length;
    if (!total) return;
    const speed = 2; // 每多少帧解锁一个字符
    let frame = 0;
    const tick = () => {
      const revealed = Math.floor(frame / speed);
      let out = '';
      for (let i = 0; i < total; i++) {
        const ch = finalText[i];
        if (i < revealed || ch === ' ' || ch === '，' || ch === '·') {
          out += ch;
        } else {
          out += glyph();
        }
      }
      el.textContent = out;
      frame++;
      if (revealed < total) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
      }
    };
    // 稍延迟，待滚动揭示动画已起步后再解码
    window.setTimeout(() => requestAnimationFrame(tick), 280);
  });
}

/* ----------------------------------------------------------------
 * 6) 3D 倾斜（tilt）
 *    鼠标悬停卡片时，依光标位置做透视旋转，松手回正。
 *    仅覆盖 transform，box-shadow / border 等既有悬浮效果不受影响。
 * ---------------------------------------------------------------- */
function initTilt(): void {
  if (prefersReducedMotion()) return;
  const cards = document.querySelectorAll<HTMLElement>(
    '.card, .stat-card, .car-slide, .project'
  );
  const maxTilt = 7;
  cards.forEach((card) => {
    const onEnter = () => {
      card.style.transition = 'transform 0.12s ease-out';
    };
    const onMove = rafThrottle((e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = (-py * maxTilt).toFixed(2);
      const ry = (px * maxTilt).toFixed(2);
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    });
    const onLeave = () => {
      card.style.transition = 'transform 0.5s ease-out';
      card.style.transform = '';
    };
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}

/* ----------------------------------------------------------------
 * 7) 磁吸按钮（magnetic）
 *    光标靠近 .btn 时，按钮轻微向光标方向位移，离开回正。
 * ---------------------------------------------------------------- */
function initMagnetic(): void {
  if (prefersReducedMotion()) return;
  const btns = document.querySelectorAll<HTMLElement>('.btn');
  const strength = 0.28;
  btns.forEach((btn) => {
    const onEnter = () => {
      btn.style.transition = 'transform 0.15s ease-out';
    };
    const onMove = rafThrottle((e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${(mx * strength).toFixed(1)}px, ${(my * strength).toFixed(1)}px)`;
    });
    const onLeave = () => {
      btn.style.transition = 'transform 0.4s ease-out';
      btn.style.transform = '';
    };
    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
  });
}

/* ----------------------------------------------------------------
 * 初始化入口
 *    Astro 的 <script> 为 module（defer），DOM 已解析后运行；
 *    此处兼顾 readyState，确保稳健。
 * ---------------------------------------------------------------- */
function init(): void {
  initCursorGlow();
  initParallax();
  initStatCountUp();
  initCardGlow();
  initScramble();
  initTilt();
  initMagnetic();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
