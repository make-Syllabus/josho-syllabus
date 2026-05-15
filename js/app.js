'use strict';

// ===== 定数 =====
const PER_PAGE = 10;
const ALL_COURSES = ['スーパーコース', '一貫コース', '特進コース', '文理コース'];

const SUBJECT_STYLE = {
  '国語': { cls: 'color-kokugo',   fg: 'color-kokugo-fg',   icon: 'ti-book-2' },
  '数学': { cls: 'color-sugaku',   fg: 'color-sugaku-fg',   icon: 'ti-math-function' },
  '英語': { cls: 'color-eigo',     fg: 'color-eigo-fg',     icon: 'ti-language' },
  '理科': { cls: 'color-rika',     fg: 'color-rika-fg',     icon: 'ti-flask' },
  '社会': { cls: 'color-shakai',   fg: 'color-shakai-fg',   icon: 'ti-building-bank' },
  '体育': { cls: 'color-taiiku',   fg: 'color-taiiku-fg',   icon: 'ti-run' },
  '芸術': { cls: 'color-geijutsu', fg: 'color-geijutsu-fg', icon: 'ti-palette' },
  '情報': { cls: 'color-joho',     fg: 'color-joho-fg',     icon: 'ti-device-laptop' },
};

// ===== 状態 =====
let syllabusData = [];
let curriculumData = {};
let filteredData = [];
let currentPage = 1;

// ===== 初期化 =====
async function init() {
  await Promise.all([loadSyllabus(), loadCurriculum()]);
  setupNav();
  setupModal();
  navigateTo(getPageFromHash() || 'home');
}

async function loadSyllabus() {
  try {
    const res = await fetch('data/syllabus.json');
    syllabusData = await res.json();
  } catch (e) {
    console.warn('syllabus.json の読み込み失敗:', e);
    syllabusData = [];
  }
}

async function loadCurriculum() {
  try {
    const res = await fetch('data/curriculum.json');
    curriculumData = await res.json();
  } catch (e) {
    console.warn('curriculum.json の読み込み失敗:', e);
    curriculumData = {};
  }
}

// ===== ナビゲーション =====
function getPageFromHash() {
  return window.location.hash.replace('#', '') || 'home';
}

function setupNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });

  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  window.addEventListener('hashchange', () => navigateTo(getPageFromHash()));
}

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });

  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  window.location.hash = pageId;
  window.scrollTo(0, 0);

  if (pageId === 'curriculum') renderCurriculumPage();
  if (pageId === 'syllabus') {
    renderSyllabusPage();
    applyFilter();
  }

  // モバイルメニューを閉じる
  document.getElementById('nav-links')?.classList.remove('open');
}

// ===== モーダル =====
function setupModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
}

function openModal(contentHtml) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  body.innerHTML = contentHtml;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

window.closeModal = closeModal;

// ===== HOME =====
// nav-card や hero ボタンはHTMLに data-page 属性で設定済み

// ===== 教育課程ページ =====
function renderCurriculumPage() {
  renderDocSection('curriculum-docs', curriculumData.curriculum || []);
  renderDocSection('evaluation-docs', curriculumData.evaluation || []);
  renderSubjectGrid();
}

function renderDocSection(containerId, docs) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = docs.map(doc => `
    <div class="doc-card" onclick="openDocModal('${escHtml(doc.school)}', '${escHtml(doc.type)}', '${escHtml(doc.pdfFile)}')">
      <div class="doc-icon" style="background:var(--color-sugaku);color:var(--color-sugaku-fg);">
        <i class="ti ${doc.type === '教育課程表' ? 'ti-file-spreadsheet' : 'ti-file-check'}" aria-hidden="true"></i>
      </div>
      <div class="doc-body">
        <div class="doc-title">${escHtml(doc.school)}</div>
        <div class="doc-sub">${escHtml(doc.label)}</div>
      </div>
      <i class="ti ti-chevron-right doc-arrow" aria-hidden="true"></i>
    </div>
  `).join('');
}

function renderSubjectGrid() {
  const el = document.getElementById('subject-grid');
  if (!el) return;
  const subjects = curriculumData.subjects || [];
  el.innerHTML = subjects.map(s => {
    return `
      <div class="subj-card" onclick="openSubjectModal('${escHtml(s.id)}')">
        <div class="subj-icon" style="background:var(--color-${s.id === 'kokugo' ? 'kokugo' : s.id === 'sugaku' ? 'sugaku' : s.id === 'eigo' ? 'eigo' : s.id === 'rika' ? 'rika' : s.id === 'shakai' ? 'shakai' : s.id === 'taiiku' ? 'taiiku' : s.id === 'geijutsu' ? 'geijutsu' : 'joho'});color:var(--color-${s.id === 'kokugo' ? 'kokugo' : s.id === 'sugaku' ? 'sugaku' : s.id === 'eigo' ? 'eigo' : s.id === 'rika' ? 'rika' : s.id === 'shakai' ? 'shakai' : s.id === 'taiiku' ? 'taiiku' : s.id === 'geijutsu' ? 'geijutsu' : 'joho'}-fg);">
          <i class="ti ${escHtml(s.icon)}" aria-hidden="true"></i>
        </div>
        <div class="subj-label">${escHtml(s.name)}</div>
        <div class="subj-detail">詳細を見る</div>
      </div>`;
  }).join('');
}

window.openDocModal = function(school, type, pdfFile) {
  const isEval = type === '学習評価';
  const iconColor = isEval ? 'var(--color-rika)' : 'var(--color-sugaku)';
  const iconFg = isEval ? 'var(--color-rika-fg)' : 'var(--color-sugaku-fg)';
  const icon = isEval ? 'ti-file-check' : 'ti-file-spreadsheet';

  openModal(`
    <div class="modal-head">
      <div>
        <h2>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:${iconColor};color:${iconFg};font-size:13px;vertical-align:-6px;margin-right:7px;">
            <i class="ti ${icon}" aria-hidden="true"></i>
          </span>${escHtml(school)}　${escHtml(type)}
        </h2>
      </div>
      <button class="modal-close-btn" onclick="closeModal()" aria-label="閉じる"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>
    <div class="modal-body">
      <div class="m-pdf-area">
        <i class="ti ti-file-type-pdf" aria-hidden="true"></i>
        <p>${escHtml(school)}の${escHtml(type)}PDFがここに表示されます。<br>PDFファイルを <code>pdf/${escHtml(pdfFile)}</code> に配置してください。</p>
        <button class="m-pdf-btn" onclick="window.open('pdf/${escHtml(pdfFile)}','_blank')">
          <i class="ti ti-external-link" aria-hidden="true"></i>PDFを開く
        </button>
      </div>
    </div>
  `);
};

window.openSubjectModal = function(subjectId) {
  const subjects = curriculumData.subjects || [];
  const s = subjects.find(x => x.id === subjectId);
  if (!s) return;

  const colorMap = {
    kokugo:'kokugo', sugaku:'sugaku', eigo:'eigo', rika:'rika',
    shakai:'shakai', taiiku:'taiiku', geijutsu:'geijutsu', joho:'joho',
    gijutsu:'joho'
  };
  const c = colorMap[s.id] || 'joho';

  const optionsHtml = s.options.length === 1
    ? `<button class="m-pdf-btn" onclick="window.open('pdf/${escHtml(s.options[0].pdfFile)}','_blank')">
        <i class="ti ti-file-description" aria-hidden="true"></i>詳細を見る
       </button>`
    : s.options.map(opt => `
        <button class="m-pdf-btn" style="margin-top:0.75rem;" onclick="window.open('pdf/${escHtml(opt.pdfFile)}','_blank')">
          <i class="ti ti-file-description" aria-hidden="true"></i>${escHtml(opt.label)}
        </button>`).join('');

  openModal(`
    <div class="modal-head">
      <div>
        <h2>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:var(--color-${c});color:var(--color-${c}-fg);font-size:13px;vertical-align:-6px;margin-right:7px;">
            <i class="ti ${escHtml(s.icon)}" aria-hidden="true"></i>
          </span>${escHtml(s.name)}　教科の目標
        </h2>
      </div>
      <button class="modal-close-btn" onclick="closeModal()" aria-label="閉じる"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>
    <div class="modal-body">
      <div style="display:flex;flex-direction:column;gap:0;">
        ${optionsHtml}
      </div>
    </div>
  `);
};

// ===== シラバスページ =====
function renderSyllabusPage() {
  // フィルターのイベント設定（初回のみ）
  ['sel-grade', 'sel-course', 'sel-subject'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.bound) {
      el.addEventListener('change', applyFilter);
      el.dataset.bound = '1';
    }
  });
}

function courseMatches(d, selectedCourse) {
  if (!selectedCourse) return true;
  if (d.courses === 'all') return true;
  return Array.isArray(d.courses) && d.courses.includes(selectedCourse);
}

function applyFilter() {
  const grade  = document.getElementById('sel-grade')?.value  || '';
  const course = document.getElementById('sel-course')?.value || '';
  const subj   = document.getElementById('sel-subject')?.value || '';

  filteredData = syllabusData.filter(d =>
    (!grade  || d.grade === grade) &&
    courseMatches(d, course) &&
    (!subj   || d.subject === subj)
  );
  currentPage = 1;
  renderCards();
}

window.applyFilter = applyFilter;

function renderCards() {
  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = filteredData.slice(start, start + PER_PAGE);

  const countEl = document.getElementById('result-count');
  const pageEl  = document.getElementById('page-info');
  if (countEl) countEl.innerHTML = total > 0
    ? `<strong>${total}件</strong>のシラバスが見つかりました`
    : 'シラバスが見つかりませんでした';
  if (pageEl) pageEl.textContent = total > 0 ? `${currentPage} / ${totalPages} ページ` : '';

  const listEl = document.getElementById('card-list');
  if (!listEl) return;

  if (total === 0) {
    listEl.innerHTML = '<div class="empty-state"><i class="ti ti-search" aria-hidden="true"></i>条件に合うシラバスがありません</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  listEl.innerHTML = pageItems.map(d => buildCardHtml(d)).join('');
  renderPagination(totalPages);
}

function buildCardHtml(d) {
  const s = SUBJECT_STYLE[d.subject] || { cls: 'color-joho', fg: 'color-joho-fg', icon: 'ti-file' };
  const courseBadges = buildCourseBadges(d);
  const subBadges = buildSubBadges(d.sub);
  return `
    <div class="s-card" onclick="openSyllabusModal(${d.id})" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')openSyllabusModal(${d.id})">
      <div class="s-card-icon" style="background:var(--${s.cls});color:var(--${s.fg});">
        <i class="ti ${s.icon}" aria-hidden="true"></i>
      </div>
      <div class="s-card-body">
        <div class="s-card-title">${escHtml(d.title)}</div>
        <div class="s-card-meta">
          <span>${escHtml(d.subject)}</span>
          <span><i class="ti ti-clock" style="font-size:12px;vertical-align:-1px;margin-right:2px;" aria-hidden="true"></i>週${d.units}時間</span>
        </div>
      </div>
      <div class="s-card-right">
        <span class="badge badge-grade">${escHtml(d.grade)}</span>
        <div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end;align-items:center;">
          ${courseBadges}${subBadges ? '<span style="font-size:10px;color:var(--color-muted);opacity:0.6;margin:0 1px;">|</span>' + subBadges : ''}
        </div>
      </div>
      <i class="ti ti-chevron-right s-card-arrow" aria-hidden="true"></i>
    </div>`;
}

function buildCourseBadges(d) {
  if (d.courses === 'all') return `<span class="badge badge-all">全コース共通</span>`;
  return d.courses.map(c => `<span class="badge badge-course">${escHtml(c)}</span>`).join('');
}

function buildSubBadges(sub) {
  if (!sub) return '';
  const parts = [];
  if (sub.track === '文系')      parts.push(`<span class="badge badge-bunkei">文系</span>`);
  else if (sub.track === '理系') parts.push(`<span class="badge badge-rikei">理系</span>`);
  else if (sub.track === '文理共通') parts.push(`<span class="badge badge-kyotsuu">文理共通</span>`);
  (sub.classes || []).forEach(c => parts.push(`<span class="badge badge-class">${escHtml(c)}組</span>`));
  return parts.join('');
}

window.openSyllabusModal = function(id) {
  const d = syllabusData.find(x => x.id === id);
  if (!d) return;
  const s = SUBJECT_STYLE[d.subject] || { cls: 'color-joho', fg: 'color-joho-fg', icon: 'ti-file' };
  const subBadges = buildSubBadges(d.sub);
  const courseBadges = buildCourseBadges(d);

  openModal(`
    <div class="modal-head">
      <div>
        <h2>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:var(--${s.cls});color:var(--${s.fg});font-size:13px;vertical-align:-6px;margin-right:7px;">
            <i class="ti ${s.icon}" aria-hidden="true"></i>
          </span>${escHtml(d.title)}
        </h2>
        <div class="meta">
          <span class="badge badge-grade">${escHtml(d.grade)}</span>
          ${courseBadges}${subBadges}
          <span style="font-size:11px;color:var(--color-muted);">週${d.units}時間</span>
        </div>
      </div>
      <button class="modal-close-btn" onclick="closeModal()" aria-label="閉じる"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>
    <div class="modal-body">
      <div class="m-section-label">学習の到達目標</div>
      <ul class="m-goal-list">${(d.goals || []).map(g => `<li>${escHtml(g)}</li>`).join('')}</ul>

      <div class="m-section-label">評価方法</div>
      <div class="m-eval-grid">
        <div class="m-eval-card">
          <div class="m-eval-label">知識・技能</div>
          <div class="m-eval-value">${escHtml(d.eval?.knowledge || '')}</div>
        </div>
        <div class="m-eval-card">
          <div class="m-eval-label">思考・判断・表現</div>
          <div class="m-eval-value">${escHtml(d.eval?.thinking || '')}</div>
        </div>
        <div class="m-eval-card" style="grid-column:1/-1;">
          <div class="m-eval-label">主体的に学習に取り組む態度</div>
          <div class="m-eval-value">${escHtml(d.eval?.attitude || '')}</div>
        </div>
      </div>

      <div class="m-section-label">使用教科書</div>
      <p style="font-size:13px;line-height:1.7;">${escHtml(d.textbook || '')}</p>
      ${d.materials ? `<p style="font-size:12px;color:var(--color-muted);margin-top:4px;">${escHtml(d.materials)}</p>` : ''}

      <div class="m-section-label">年間授業計画</div>
      <table class="m-plan-table">
        <thead><tr><th>学期</th><th>単元・内容</th><th style="text-align:right;">時数</th></tr></thead>
        <tbody>${(d.plan || []).map(p => `
          <tr>
            <td><span class="m-term-badge">${escHtml(p.term)}</span></td>
            <td>${escHtml(p.unit)}</td>
            <td style="text-align:right;color:var(--color-muted);">${p.weeks}h</td>
          </tr>`).join('')}
        </tbody>
      </table>

      ${d.pdfFile ? `
        <button class="m-pdf-btn" onclick="window.open('pdf/${escHtml(d.pdfFile)}','_blank')">
          <i class="ti ti-file-description" aria-hidden="true"></i>詳細を見る
        </button>` : ''}
    </div>
  `);
};

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="pg-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} aria-label="前のページ">
    <i class="ti ti-chevron-left" aria-hidden="true"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<span class="pg-dots">…</span>`;
      continue;
    }
    html += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `<button class="pg-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} aria-label="次のページ">
    <i class="ti ti-chevron-right" aria-hidden="true"></i></button>`;
  el.innerHTML = html;
}

window.goPage = function(n) {
  currentPage = n;
  renderCards();
  document.getElementById('card-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ===== ユーティリティ =====
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== タイトル画面 =====
function initTitleScreen() {
  const screen = document.getElementById('title-screen');
  if (!screen) return;
  setTimeout(() => {
    screen.classList.add('fade-out');
    setTimeout(() => screen.classList.add('hidden'), 800);
  }, 1500);
}

// ===== スクロールフェードイン =====
function initFadeIn() {
  const sections = document.querySelectorAll('.fade-section');
  if (!sections.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });
  sections.forEach(s => observer.observe(s));
}

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', () => {
  initTitleScreen();
  init();
  initFadeIn();
});
