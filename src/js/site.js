(function () {
  'use strict';

  const SITE = 'https://malchik.xyz/';
  const PAGES = ['home', 'interests', 'hardware', 'contact'];
  const $id = (id) => document.getElementById(id);
  const isDesktop = () => window.matchMedia('(min-width: 801px)').matches;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // localStorage can throw in private windows; it's only used for a preference.
  const prefs = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* ignore */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  // ---------------------------------------------------------------
  // Background: 88x31 buttons. Only enough cells to cover the screen
  // plus one tile of overscan for the slide animation.
  // ---------------------------------------------------------------
  const BUTTON_COUNT = 3986;  // files are /images/bg_buttons/1..3986.gif (a few numbers missing)
  const POOL_SIZE = 40;      // unique gifs downloaded per visit
  let bgCells = 0;

  function buildBackground() {
    const grid = $id('bg-grid');
    const cols = Math.ceil(window.innerWidth / 88) + 1;
    const rows = Math.ceil(window.innerHeight / 31) + 1;
    const needed = cols * rows;
    grid.style.width = cols * 88 + 'px';
    if (needed <= bgCells) return;

    if (!grid.pool) {
      grid.pool = Array.from({ length: POOL_SIZE }, () => Math.floor(Math.random() * BUTTON_COUNT) + 1);
    }
    const fragment = document.createDocumentFragment();
    for (let i = bgCells; i < needed; i++) {
      const img = document.createElement('img');
      img.src = '/images/bg_buttons/' + pick(grid.pool) + '.gif';
      img.alt = '';
      img.decoding = 'async';
      img.onerror = function () { this.style.visibility = 'hidden'; };
      fragment.appendChild(img);
    }
    grid.appendChild(fragment);
    bgCells = needed;
  }

  // ---------------------------------------------------------------
  // Router: pages are #hash views so Back/Forward and shared links work.
  // ---------------------------------------------------------------
  const addressBar = $id('address-bar');
  const statusText = $id('status-text');
  const content = $id('content');
  let histIndex = 0;
  let histMax = 0;

  function currentPage() {
    return decodeURIComponent(location.hash.slice(1)) || 'home';
  }

  function show(page) {
    const viewId = PAGES.includes(page) ? page : '404';
    document.querySelectorAll('.view').forEach((view) => {
      view.hidden = view.id !== 'view-' + viewId;
    });
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.dataset.nav === page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    addressBar.value = SITE + page;
    content.scrollTop = 0;
    if (!isDesktop()) {
      const top = $id('ie-window').getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) window.scrollTo(0, top);
    }

    $id('btn-back').disabled = histIndex <= 0;
    $id('btn-fwd').disabled = histIndex >= histMax;
    loading(SITE + page);
  }

  function loading(url) {
    statusText.textContent = 'Opening page ' + url + '...';
    content.classList.remove('refresh');
    void content.offsetWidth;  // restart the fade animation
    content.classList.add('refresh');
    clearTimeout(loading.timer);
    loading.timer = setTimeout(() => { statusText.textContent = 'Done'; }, 350);
  }

  function onHashChange() {
    const state = history.state;
    if (state && typeof state.i === 'number') {
      histIndex = state.i;  // moved through history
    } else {
      histIndex += 1;       // a new link was followed
      histMax = histIndex;
      history.replaceState({ i: histIndex }, '');
    }
    restoreWindow();
    show(currentPage());
    agentsReact();
  }

  function initRouter() {
    const state = history.state;
    histIndex = state && typeof state.i === 'number' ? state.i : 0;
    histMax = histIndex;
    history.replaceState({ i: histIndex }, '');
    show(currentPage());

    window.addEventListener('hashchange', onHashChange);
    $id('btn-back').addEventListener('click', () => history.back());
    $id('btn-fwd').addEventListener('click', () => history.forward());

    $id('address-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const slug = addressBar.value.trim().toLowerCase()
        .replace(/^[a-z]+:\/\//, '')
        .replace(/^(www\.)?(malchik|macik)\.xyz/, '')
        .replace(/[#/]|\.html?$/g, '')
        .replace(/[^a-z0-9-]/g, '') || 'home';
      if (slug === currentPage()) show(slug);  // "refresh"
      else location.hash = slug;
      addressBar.blur();
    });
    addressBar.addEventListener('focus', () => addressBar.select());
  }

  // ---------------------------------------------------------------
  // Window chrome: title bar buttons, taskbar, start menu, clock.
  // ---------------------------------------------------------------
  const body = document.body;
  const startMenu = $id('start-menu');
  const startButton = $id('start-button');
  const taskButton = $id('task-ie');

  function restoreWindow() {
    body.classList.remove('ie-minimized', 'ie-closed');
    taskButton.classList.add('active');
  }

  function toggleStartMenu(open) {
    const next = open === undefined ? startMenu.hidden : open;
    startMenu.hidden = !next;
    startButton.setAttribute('aria-expanded', String(next));
    startButton.classList.toggle('pressed', next);
  }

  function initChrome() {
    document.querySelectorAll('[data-win]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.win;
        if (action === 'maximize') {
          body.classList.toggle('maximized');
          btn.setAttribute('aria-label', body.classList.contains('maximized') ? 'Restore' : 'Maximize');
        } else {
          body.classList.add(action === 'close' ? 'ie-closed' : 'ie-minimized');
          taskButton.classList.remove('active');
        }
      });
    });

    taskButton.addEventListener('click', () => {
      if (body.classList.contains('ie-minimized')) restoreWindow();
      else {
        body.classList.add('ie-minimized');
        taskButton.classList.remove('active');
      }
    });

    startButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStartMenu();
    });
    startMenu.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) toggleStartMenu(false);
    });
    document.addEventListener('click', (e) => {
      if (!startMenu.hidden && !startMenu.contains(e.target)) toggleStartMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleStartMenu(false);
    });

    // Clicking a page link always brings the window back, even if it's the current page.
    document.querySelectorAll('[data-nav]').forEach((link) => {
      link.addEventListener('click', restoreWindow);
    });

    const shutdown = $id('shutdown-screen');
    $id('btn-shutdown').addEventListener('click', () => { shutdown.hidden = false; });
    shutdown.addEventListener('click', () => { shutdown.hidden = true; });

    const clock = $id('clock');
    const tick = () => {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      clock.dateTime = now.toISOString();
    };
    tick();
    setInterval(tick, 15000);
  }

  // ---------------------------------------------------------------
  // Office assistants. One shows up on desktop; more can be summoned
  // from the Start menu. Each one is ~1-2 MB, so never load them all.
  // ---------------------------------------------------------------
  const ROSTER = ['Bonzi', 'Clippy', 'F1', 'Genie', 'Genius', 'Links', 'Merlin', 'Peedy', 'Rocky', 'Rover'];
  const MAX_AGENTS = 3;
  const AGENT_SIZE = 150;
  const agents = [];
  let pending = 0;

  function randomSpot() {
    const x = Math.random() * Math.max(0, window.innerWidth - AGENT_SIZE);
    const y = Math.random() * Math.max(0, window.innerHeight - AGENT_SIZE - 40);
    return [x, y];
  }

  function summonAgent() {
    if (!window.clippy || agents.length + pending >= MAX_AGENTS) return;
    const taken = agents.map((a) => a.name);
    const name = pick(ROSTER.filter((n) => !taken.includes(n)));
    pending++;
    window.clippy.load(name, (agent) => {
      pending--;
      agent.name = name;
      agents.push(agent);
      agent.show();
      agent.moveTo(...randomSpot());
      setTimeout(() => agent.play('Greeting'), Math.random() * 3000);
    }, () => { pending--; }, '/agents/');
  }

  function dismissAgents() {
    agents.splice(0).forEach((agent) => {
      agent.stop();
      agent.hide(false, () => agent._el.remove());
    });
  }

  function agentsReact() {
    agents.forEach((agent) => {
      if (Math.random() > 0.7 && agent.hasAnimation('Searching')) {
        agent.stop();
        agent.play('Searching');
      }
    });
  }

  function initAgents() {
    document.querySelectorAll('[data-agent]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.agent === 'summon') {
          prefs.remove('agents-off');
          summonAgent();
        } else {
          prefs.set('agents-off', '1');
          dismissAgents();
        }
      });
    });

    setInterval(() => {
      if (document.hidden || agents.length === 0) return;
      const agent = pick(agents);
      if (Math.random() > 0.65) agent.moveTo(...randomSpot());
      else agent.animate();
    }, 6000);

    // Auto-summon one, on big screens only, after the page has settled.
    if (isDesktop() && !reducedMotion() && !prefs.get('agents-off')) {
      setTimeout(summonAgent, 2000);
    }
  }

  // ---------------------------------------------------------------
  initRouter();
  initChrome();
  window.addEventListener('load', () => {
    buildBackground();
    initAgents();
  });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildBackground, 200);
  });
})();
