// ==========================================================================
// Agent Deals — Application Logic
// ==========================================================================

(function () {
  'use strict';

  let data = null;
  let activeType = 'all';
  let activeCategory = 'all';
  let searchQuery = '';

  // --- Theme Toggle ---
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateThemeIcon();
    });
  }

  function updateThemeIcon() {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    themeToggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  }

  // --- Load Data ---
  fetch('deals.json')
    .then(r => r.json())
    .then(d => {
      data = d;
      updateStats();
      buildCategoryPills();
      render();
    })
    .catch(err => {
      console.error('Failed to load deals:', err);
      document.getElementById('deals-container').innerHTML =
        '<div class="no-results"><div class="no-results-icon">⚠️</div><h3>Failed to load deals</h3><p>Check that deals.json is available.</p></div>';
    });

  // --- Stats ---
  function updateStats() {
    if (!data) return;
    const all = getAllDeals();
    const types = {};
    all.forEach(d => { types[d.type] = (types[d.type] || 0) + 1; });

    setText('stat-free', types['free-tier'] || 0);
    setText('stat-oss', types['open-source'] || 0);
    setText('stat-startup', types['startup-credits'] || 0);
    setText('stat-cats', data.categories.length);
    setText('deal-count-badge', all.length + ' deals');

    // Update type filter counts
    document.querySelectorAll('.type-pill').forEach(pill => {
      const t = pill.dataset.type;
      const countEl = pill.querySelector('.pill-count');
      if (countEl) {
        countEl.textContent = t === 'all' ? all.length : (types[t] || 0);
      }
    });
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getAllDeals() {
    if (!data) return [];
    return data.categories.flatMap(c => c.deals);
  }

  // --- Category Pills ---
  function buildCategoryPills() {
    const container = document.getElementById('category-pills');
    if (!container || !data) return;

    let html = '<button class="cat-pill active" data-cat="all">All Categories</button>';
    data.categories.forEach(cat => {
      html += `<button class="cat-pill" data-cat="${cat.id}"><span class="cat-emoji">${cat.emoji}</span>${cat.name} <span class="pill-count">${cat.deals.length}</span></button>`;
    });
    container.innerHTML = html;

    container.addEventListener('click', e => {
      const pill = e.target.closest('.cat-pill');
      if (!pill) return;
      activeCategory = pill.dataset.cat;
      container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      render();
    });
  }

  // --- Type Filters ---
  document.getElementById('type-filters')?.addEventListener('click', e => {
    const pill = e.target.closest('.type-pill');
    if (!pill) return;
    activeType = pill.dataset.type;
    document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    render();
  });

  // --- Search ---
  const searchInput = document.getElementById('search-input');
  let searchTimeout;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = searchInput.value.trim().toLowerCase();
        render();
      }, 150);
    });
  }

  // Cmd+K shortcut
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      searchQuery = '';
      searchInput.blur();
      render();
    }
  });

  // --- Render ---
  function render() {
    if (!data) return;
    const container = document.getElementById('deals-container');
    if (!container) return;

    let totalVisible = 0;
    let html = '';

    const categoriesToShow = activeCategory === 'all'
      ? data.categories
      : data.categories.filter(c => c.id === activeCategory);

    categoriesToShow.forEach(cat => {
      let deals = cat.deals;

      // Type filter
      if (activeType !== 'all') {
        deals = deals.filter(d => d.type === activeType);
      }

      // Search filter
      if (searchQuery) {
        deals = deals.filter(d => {
          const searchable = [
            d.name, d.deal, d.limits, d.agent_notes, d.url,
            d.coupon?.code, d.coupon?.discount
          ].filter(Boolean).join(' ').toLowerCase();
          return searchQuery.split(/\s+/).every(term => searchable.includes(term));
        });
      }

      if (deals.length === 0) return;
      totalVisible += deals.length;

      html += `<section class="category-section" id="cat-${cat.id}">`;
      html += `<div class="category-header">
        <span class="category-emoji">${cat.emoji}</span>
        <h2 class="category-name">${cat.name}</h2>
        <span class="category-count">${deals.length} deal${deals.length !== 1 ? 's' : ''}</span>
      </div>`;

      if (!searchQuery && activeCategory !== 'all') {
        html += `<p class="category-desc">${cat.description}</p>`;
      }

      html += '<div class="deals-grid">';
      deals.forEach(deal => {
        html += renderDealCard(deal);
      });
      html += '</div></section>';
    });

    if (totalVisible === 0) {
      html = `<div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No deals found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>`;
    }

    container.innerHTML = html;

    // Re-attach event listeners for agent notes toggles
    container.querySelectorAll('.agent-notes-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const notes = btn.nextElementSibling;
        const isOpen = notes.classList.toggle('open');
        btn.querySelector('.toggle-arrow').textContent = isOpen ? '▾' : '▸';
        btn.querySelector('.toggle-label').textContent = isOpen ? 'Hide agent notes' : 'Agent notes';
      });
    });

    // Coupon copy
    container.querySelectorAll('.coupon-code').forEach(el => {
      el.addEventListener('click', () => {
        const code = el.dataset.code;
        if (!code) return;
        navigator.clipboard?.writeText(code).then(() => {
          el.classList.add('copied');
          const orig = el.textContent;
          el.textContent = 'Copied!';
          setTimeout(() => {
            el.classList.remove('copied');
            el.textContent = orig;
          }, 1500);
        });
      });
    });
  }

  function renderDealCard(deal) {
    const badgeClass = 'badge-' + (deal.type || 'free-tier').replace(/\s/g, '-');
    const typeLabel = {
      'free-tier': 'Free Tier',
      'open-source': 'Open Source',
      'startup-credits': 'Startup',
      'discount': 'Discount'
    }[deal.type] || deal.type;

    let html = '<article class="deal-card">';

    // Header
    html += '<div class="deal-card-header">';
    html += `<h3 class="deal-name"><a href="${escHtml(deal.url)}" target="_blank" rel="noopener">${escHtml(deal.name)}</a></h3>`;
    html += `<span class="deal-type-badge ${badgeClass}">${typeLabel}</span>`;
    html += '</div>';

    // Deal text
    html += `<p class="deal-text">${escHtml(deal.deal)}</p>`;

    // Limits
    if (deal.limits && deal.limits.trim()) {
      html += `<div class="deal-limits">${escHtml(deal.limits)}</div>`;
    }

    // Coupon
    const coupon = deal.coupon;
    if (coupon && (coupon.code || coupon.discount)) {
      html += '<div class="deal-coupon">';
      html += `<div class="coupon-header"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 5H3a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2 2 2 0 0 1-2 2v4a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-4a2 2 0 0 1-2-2 2 2 0 0 1 2-2V7a2 2 0 0 0-2-2Z"/></svg>`;
      html += coupon.code ? 'Coupon Code' : 'Deal';
      html += '</div>';

      if (coupon.code) {
        html += `<span class="coupon-code" data-code="${escHtml(coupon.code)}" title="Click to copy">${escHtml(coupon.code)}</span>`;
      }

      if (coupon.discount) {
        html += `<p class="coupon-discount">${escHtml(coupon.discount)}</p>`;
      }

      if (coupon.eligibility) {
        html += `<p class="coupon-meta">${escHtml(coupon.eligibility)}</p>`;
      }

      if (coupon.url && coupon.url !== deal.url) {
        html += `<p class="coupon-meta"><a href="${escHtml(coupon.url)}" target="_blank" rel="noopener" style="color: var(--color-amber); font-size: var(--text-xs);">Apply here →</a></p>`;
      }

      html += '</div>';
    }

    // Agent Notes
    if (deal.agent_notes && deal.agent_notes.trim()) {
      html += `<button class="agent-notes-toggle"><span class="toggle-arrow">▸</span> <span class="toggle-label">Agent notes</span></button>`;
      html += `<div class="agent-notes">${escHtml(deal.agent_notes)}</div>`;
    }

    // Footer
    html += '<div class="deal-footer">';
    html += `<a href="${escHtml(deal.url)}" target="_blank" rel="noopener" class="deal-link">${extractDomain(deal.url)} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
    html += '</div>';

    html += '</article>';
    return html;
  }

  function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function extractDomain(url) {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
})();
