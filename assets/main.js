(() => {
  'use strict';

  const byId = id => document.getElementById(id);

  function initAnchors() {
    const panel = document.querySelector('.time-glass');
    const syncClearance = () => {
      const clearance = Math.ceil(panel.getBoundingClientRect().bottom + 20);
      document.documentElement.style.setProperty('--anchor-clearance', `${clearance}px`);
    };
    syncClearance();
    if ('ResizeObserver' in window) new ResizeObserver(syncClearance).observe(panel);
    window.addEventListener('resize', syncClearance, { passive: true });
    window.addEventListener('load', () => {
      syncClearance();
      byId(location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, { once: true });
  }

  function initClocks() {
    const anniversary = Date.parse('2026-11-20T00:00:00+08:00');
    const beginning = Date.parse('2021-11-20T00:00:00+08:00');
    const label = byId('birthday-clock-label');
    const birthday = byId('birthday-clock');
    const memory = byId('memory-clock');
    const duration = ms => {
      const seconds = Math.floor(Math.abs(ms) / 1000);
      const pad = value => String(value).padStart(2, '0');
      return `${Math.floor(seconds / 86400)}天 ${pad(Math.floor(seconds / 3600) % 24)}时 ${pad(Math.floor(seconds / 60) % 60)}分 ${pad(seconds % 60)}秒`;
    };
    const update = () => {
      const now = Date.now();
      label.textContent = now < anniversary ? '距离纪念日' : '纪念日已到，快乐延续';
      birthday.textContent = duration(anniversary - now);
      memory.textContent = duration(now - beginning);
    };
    update();
    window.setInterval(update, 1000);
  }

  function initLetter() {
    const letter = document.querySelector('.paper-scroll');
    let frame = 0;
    let lastProgress = -1;
    const unfold = () => {
      frame = 0;
      const rect = letter.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)));
      // Avoid repeated style writes while the letter is outside its folding range.
      if (progress === lastProgress) return;
      lastProgress = progress;
      const top = Math.min(1, progress / 0.48);
      const bottom = Math.max(0, Math.min(1, (progress - 0.4) / 0.45));
      letter.style.setProperty('--top-angle', `${-180 * (1 - top)}deg`);
      letter.style.setProperty('--bottom-angle', `${180 * (1 - bottom)}deg`);
      letter.style.setProperty('--hint-opacity', Math.max(0, 1 - progress * 4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(unfold);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    unfold();
  }

  function initWish() {
    const colors = ['#f4cc55', '#ee8cb8', '#fff5dc', '#55754a'];
    byId('celebrate').addEventListener('click', () => {
      byId('wish-text').textContent = '愿望已悄悄收藏。新的一岁，愿你快乐，也愿你自由。';
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const pieces = document.createDocumentFragment();
      for (let i = 0; i < 65; i++) {
        const piece = document.createElement('i');
        piece.className = 'confetti';
        piece.setAttribute('aria-hidden', 'true');
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 350}px`);
        piece.style.animationDelay = `${Math.random() * 0.5}s`;
        pieces.append(piece);
        window.setTimeout(() => piece.remove(), 3600);
      }
      document.body.append(pieces);
    });
  }

  function initMessages() {
    // Keep the existing key so previously saved wishes survive this update.
    const storageKey = 'zxyyyy-birthday-messages-v1';
    const form = byId('message-form');
    const list = byId('message-list');
    const status = byId('message-status');
    const nameInput = byId('message-name');
    const bodyInput = byId('message-body');
    const count = byId('message-count');
    const total = byId('message-total');
    const timeFormat = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });

    function read() {
      const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(messages)) throw new Error('留言格式异常');
      return messages.filter(item => item && typeof item.name === 'string' &&
        typeof item.body === 'string' && typeof item.createdAt === 'string' &&
        Number.isFinite(Date.parse(item.createdAt))).slice(0, 500);
    }

    function render(messages) {
      const cards = document.createDocumentFragment();
      total.textContent = `${messages.length} 条留言`;
      if (!messages.length) {
        const empty = document.createElement('p');
        empty.className = 'message-empty';
        empty.textContent = '这里还空着，来留下第一句祝福吧。';
        cards.append(empty);
      }
      for (const item of [...messages].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))) {
        const card = document.createElement('article');
        const meta = document.createElement('div');
        const name = document.createElement('strong');
        const time = document.createElement('time');
        const body = document.createElement('p');
        card.className = 'message-card';
        meta.className = 'message-meta';
        body.className = 'message-content';
        // Visitor text must never be interpreted as HTML.
        name.textContent = item.name;
        time.dateTime = item.createdAt;
        time.textContent = `${timeFormat.format(new Date(item.createdAt))} · 北京时间`;
        body.textContent = item.body;
        meta.append(name, time);
        card.append(meta, body);
        cards.append(card);
      }
      list.replaceChildren(cards);
    }

    function load() {
      try { render(read()); }
      catch { status.textContent = '暂时无法读取本地留言，请检查浏览器的存储设置。'; }
    }

    bodyInput.addEventListener('input', () => { count.textContent = `${bodyInput.value.length} / 1000`; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const body = bodyInput.value.trim();
      if (!name || !body) { status.textContent = '请填写名字和祝福内容。'; return; }
      if (name.length > 30 || body.length > 1000) { status.textContent = '名字最多30字，留言最多1000字。'; return; }
      try {
        const messages = read();
        if (messages.length >= 500) { status.textContent = '当前浏览器已保存500条留言，暂时无法继续添加。'; return; }
        messages.push({ name, body, createdAt: new Date().toISOString() });
        localStorage.setItem(storageKey, JSON.stringify(messages));
        render(messages);
        bodyInput.value = '';
        count.textContent = '0 / 1000';
        status.textContent = '祝福已保存，时间也一起留下了。';
      } catch {
        status.textContent = '留言没有保存成功，请检查浏览器存储设置后重试。你的文字仍在输入框中。';
      }
    });
    window.addEventListener('storage', event => {
      if (event.key === storageKey || event.key === null) load();
    });
    load();
  }

  function initMusic() {
    const audio = byId('birthday-audio');
    const toggle = byId('music-toggle');
    const status = byId('audio-status');
    let requested = false;
    let starting = false;
    let requestId = 0;
    audio.volume = 0.45;

    function render() {
      const playing = !audio.paused && !audio.ended;
      const loading = requested && starting;
      const label = loading ? '取消播放' : playing ? '暂停背景音乐' : '播放背景音乐';
      toggle.dataset.state = loading ? 'loading' : playing ? 'playing' : 'idle';
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-busy', String(loading));
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }

    toggle.addEventListener('click', async () => {
      // A second click cancels even when a slow network has not started playback.
      if (requested || !audio.paused) {
        requestId++;
        requested = false;
        starting = false;
        audio.pause();
        status.textContent = '音乐已暂停，想听时再点一下圆形按钮。';
        render();
        return;
      }
      const currentRequest = ++requestId;
      requested = true;
      starting = true;
      if (audio.error) audio.load();
      status.textContent = '音乐加载中，再点一下圆形按钮可取消。';
      render();
      try {
        await audio.play();
      } catch {
        if (currentRequest !== requestId) return;
        requested = false;
        starting = false;
        status.textContent = '暂时无法播放，请再点一次圆形按钮重试。';
      } finally {
        if (currentRequest === requestId) render();
      }
    });
    audio.addEventListener('playing', () => {
      if (audio.paused) return;
      requested = true;
      starting = false;
      render();
      status.textContent = '正在播放《Celebrate》，整首循环。';
    });
    audio.addEventListener('waiting', () => {
      if (!requested) return;
      starting = true;
      render();
      status.textContent = '音乐缓冲中，点击圆形按钮可暂停。';
    });
    audio.addEventListener('pause', () => {
      // A queued pause may belong to an earlier request that has already resumed.
      if (!audio.paused || audio.error) return;
      if (requested || starting) requestId++;
      requested = false;
      starting = false;
      render();
      status.textContent = '音乐已暂停，想听时再点一下圆形按钮。';
    });
    audio.addEventListener('error', () => {
      requestId++;
      requested = false;
      starting = false;
      render();
      status.textContent = '音频未能加载，请再点一次圆形按钮重试。';
    });
    render();
  }

  initAnchors();
  initClocks();
  initLetter();
  initWish();
  initMessages();
  initMusic();
})();
