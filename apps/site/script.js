// ============================================
// FEZINHA DE HOJE - INTERACTIVE FUNCTIONALITY
// ============================================

// Get configuration from config.js
const { API_URL, COMPANY_ID, REFRESH_INTERVAL, MAX_RESULTS, MAX_UPCOMING } = window.CONFIG;

// State management
let resultsData = [];
let upcomingData = [];
let countdownIntervals = [];

// ============================================
// HEADER SCROLL EFFECT
// ============================================
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// ============================================
// SMOOTH SCROLL FOR NAVIGATION
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));

    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatCurrency(value) {
  // Remove non-numeric characters and convert to number
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
  return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-xl);">
            <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-md);">${message}</p>
            <button onclick="location.reload()" class="cta-button">Tentar Novamente</button>
        </div>
    `;
}

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  element.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-xl);">
            <p style="color: var(--color-accent-gold); font-size: var(--font-size-lg);">Carregando...</p>
        </div>
    `;
}

// ============================================
// FETCH RESULTS FROM API
// ============================================
async function fetchResults() {
  showLoading('resultsGrid');

  try {
    const response = await fetch(
      `${API_URL}/public/results/latest?companyId=${COMPANY_ID}&limit=${MAX_RESULTS}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    resultsData = data;
    displayResults(data);
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    showError('resultsGrid', 'Não foi possível carregar os resultados. Verifique se a API está rodando.');
  }
}

function displayResults(results) {
  const resultsGrid = document.getElementById('resultsGrid');
  resultsGrid.innerHTML = '';

  if (!results || results.length === 0) {
    resultsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary);">Nenhum resultado disponível no momento.</p>';
    return;
  }

  results.forEach((result, index) => {
    const card = document.createElement('div');
    card.className = 'result-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
            <div class="result-header">
                <span class="result-game">${result.game}</span>
                <span class="result-date">${result.date}</span>
            </div>
            <div class="result-numbers">
                ${result.numbers.map(num => `<div class="number-ball">${num}</div>`).join('')}
            </div>
            <div class="result-prize">
                <div class="prize-label">👑 Prêmio</div>
                <div class="prize-amount">R$ ${formatCurrency(result.prize)}</div>
            </div>
        `;

    resultsGrid.appendChild(card);
  });
}

// ============================================
// FETCH UPCOMING DRAWS FROM API
// ============================================
async function fetchUpcomingDraws() {
  showLoading('upcomingGrid');

  try {
    const response = await fetch(
      `${API_URL}/public/draws/upcoming?companyId=${COMPANY_ID}&limit=${MAX_UPCOMING}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    upcomingData = data;
    displayUpcomingDraws(data);
  } catch (error) {
    console.error('Erro ao buscar próximos sorteios:', error);
    showError('upcomingGrid', 'Não foi possível carregar os próximos sorteios. Verifique se a API está rodando.');
  }
}

function displayUpcomingDraws(draws) {
  const upcomingGrid = document.getElementById('upcomingGrid');
  upcomingGrid.innerHTML = '';

  // Clear existing intervals
  countdownIntervals.forEach(interval => clearInterval(interval));
  countdownIntervals = [];

  if (!draws || draws.length === 0) {
    upcomingGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary);">Nenhum sorteio agendado no momento.</p>';
    return;
  }

  draws.forEach((draw, index) => {
    const card = document.createElement('div');
    card.className = 'upcoming-card slide-up';
    card.style.animationDelay = `${index * 0.1}s`;

    const countdownId = `countdown-${index}`;

    card.innerHTML = `
            <h3 class="upcoming-game">${draw.game}</h3>
            <div class="countdown" id="${countdownId}"></div>
            <p class="upcoming-prize">👑 Prêmio: R$ ${formatCurrency(draw.prize)}</p>
        `;

    upcomingGrid.appendChild(card);

    // Update countdown every second
    const countdownElement = document.getElementById(countdownId);
    const drawDate = new Date(draw.drawDate).getTime();

    updateCountdown(countdownElement, drawDate);

    const interval = setInterval(() => {
      updateCountdown(countdownElement, drawDate);
    }, 1000);

    countdownIntervals.push(interval);
  });
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function updateCountdown(element, targetDate) {
  const now = new Date().getTime();
  const distance = targetDate - now;

  if (distance < 0) {
    element.innerHTML = '<div class="countdown-item"><span class="countdown-value">00</span><span class="countdown-label">Encerrado</span></div>';
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  element.innerHTML = `
        ${days > 0 ? `
            <div class="countdown-item">
                <span class="countdown-value">${String(days).padStart(2, '0')}</span>
                <span class="countdown-label">Dias</span>
            </div>
            <span style="font-size: 2rem; color: var(--color-accent-gold);">:</span>
        ` : ''}
        <div class="countdown-item">
            <span class="countdown-value">${String(hours).padStart(2, '0')}</span>
            <span class="countdown-label">Horas</span>
        </div>
        <span style="font-size: 2rem; color: var(--color-accent-gold);">:</span>
        <div class="countdown-item">
            <span class="countdown-value">${String(minutes).padStart(2, '0')}</span>
            <span class="countdown-label">Min</span>
        </div>
        <span style="font-size: 2rem; color: var(--color-accent-gold);">:</span>
        <div class="countdown-item">
            <span class="countdown-value">${String(seconds).padStart(2, '0')}</span>
            <span class="countdown-label">Seg</span>
        </div>
    `;
}

// ============================================
// AUTO REFRESH
// ============================================
function startAutoRefresh() {
  setInterval(() => {
    console.log('Auto-refreshing data...');
    fetchResults();
    fetchUpcomingDraws();
  }, REFRESH_INTERVAL);
}

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, observerOptions);

// Observe all sections
document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando site...');
  console.log('API URL:', API_URL);
  console.log('Company ID:', COMPANY_ID);

  // Fetch initial data
  fetchResults();
  fetchUpcomingDraws();

  // Start auto-refresh
  startAutoRefresh();

  // Add animation classes to elements
  const animatedElements = document.querySelectorAll('.result-card, .upcoming-card');
  animatedElements.forEach(el => observer.observe(el));
});
