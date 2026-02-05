// ============================================
// FEZINHA DE HOJE - INTERACTIVE FUNCTIONALITY
// ============================================

// Get configuration from config.js
const { API_URL, COMPANY_ID, REFRESH_INTERVAL, MAX_RESULTS, MAX_UPCOMING } = window.CONFIG;

// State management
let resultsData = [];
let secondChanceData = [];
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
      `${API_URL}/public/results/latest?companyId=${COMPANY_ID}&limit=3`
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

async function fetchSecondChanceResults() {
  showLoading('secondChanceGrid');

  try {
    const response = await fetch(
      `${API_URL}/public/results/second-chance?companyId=${COMPANY_ID}&limit=5`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    secondChanceData = data;
    displaySecondChanceResults(data);
  } catch (error) {
    console.error('Erro ao buscar resultados de segunda chance:', error);
    showError('secondChanceGrid', 'Não foi possível carregar os resultados de segunda chance.');
  }
}

function displaySecondChanceResults(results) {
  const container = document.getElementById('secondChanceGrid');
  container.innerHTML = '';

  if (!results || results.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary);">Nenhum sorteio de Chance Extra realizado recentemente.</p>';
    return;
  }

  results.forEach((result, index) => {
    const card = document.createElement('div');
    card.className = 'second-chance-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
            <div class="result-header">
                <span class="result-game">${result.game}</span>
                <span class="result-date">${result.date}</span>
            </div>
            <div class="result-numbers">
                <div class="number-ball">${result.winningNumber}</div>
            </div>
            <div class="result-prize">
                <div class="prize-label">👑 Chance Extra</div>
                <div class="prize-amount">R$ ${formatCurrency(result.prize)}</div>
            </div>
        `;

    container.appendChild(card);
  });
}

function displayResults(results) {
  const track = document.getElementById('resultsTrack');
  const indicatorsContainer = document.getElementById('carouselIndicators');

  // Clear existing content
  track.innerHTML = '';
  indicatorsContainer.innerHTML = '';

  if (!results || results.length === 0) {
    track.innerHTML = '<div class="carousel-slide active"><p style="text-align: center; color: var(--color-text-secondary); width: 100%;">Nenhum resultado disponível no momento.</p></div>';
    return;
  }

  // Create slides and indicators
  results.forEach((result, index) => {
    // Create Slide
    const slide = document.createElement('div');
    slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;

    // Create Card
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

    slide.appendChild(card);
    track.appendChild(slide);

    // Create Indicator
    const indicator = document.createElement('button');
    indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
    indicator.setAttribute('aria-label', `Ir para sorteio ${index + 1}`);
    indicator.onclick = () => goToSlide(index);
    indicatorsContainer.appendChild(indicator);
  });

  // Initialize Carousel Logic
  initCarousel(results.length);
}

// ============================================
// CAROUSEL LOGIC
// ============================================
let currentSlide = 0;
let totalSlides = 0;
let carouselInterval;

function initCarousel(count) {
  totalSlides = count;
  currentSlide = 0;

  // Setup controls
  document.getElementById('prevBtn').onclick = prevSlide;
  document.getElementById('nextBtn').onclick = nextSlide;

  // Reset interval
  startCarouselAutoplay();

  // Add hover pause
  const container = document.querySelector('.carousel-container');
  container.onmouseenter = stopCarouselAutoplay;
  container.onmouseleave = startCarouselAutoplay;

  updateCarousel();
}

function updateCarousel() {
  const track = document.getElementById('resultsTrack');
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');

  // Calculate width for translation
  // We want to center the active slide
  // But a simple translateX is easier: assume slides are same width
  // Getting slide width dynamically or percentage

  // For this design, let's use percentage translation based on currentSlide
  // But we want to show adjacent slides partially on larger screens?
  // The CSS uses flexbox gap.

  // A simpler approach for the CSS I wrote: 
  // Move the track so the active slide is centered or first?
  // Let's rely on transforming the track to show the current index.
  // Since we have responsive visible counts (1, 2, 3), specific translation is tricky.
  // Best approach for responsive carousel without complex JS calc is to scroll into view or translate by percentage.

  // Let's try simple translation: -100% * currentSlide / visibleSlides? No.

  // UPDATED CSS STRATEGY: 
  // I will scroll the card into view or just translate the track.
  // Let's calculate the translation based on slide width + gap.
  // However, simpler is just hiding/showing active class if we don't need smooth scrolling track (but user asked for carousel effect).

  // Let's use a simple transform logic:
  // Move track to show the target slide index at the center or start.
  // Given the CSS 'flex: 0 0 100%' (mobile), simply translateX(-100 * index %).
  // Tablet (50%): translateX(-50 * index %).
  // Desktop (33.33%): translateX(-33.33 * index %).

  let slideWidthPercent = 100;
  if (window.innerWidth >= 1024) slideWidthPercent = 33.333;
  else if (window.innerWidth >= 768) slideWidthPercent = 50;

  // Adjust transform
  // The gap might mess up exact percentage.
  // Better to use offsets.
  /*
     Actually, with gap, percent based translation is hard.
     Let's try to just change the 'order' or scrollLeft?
     
     Let's go with the most robust way: calculate scroll position.
  */

  // Simpler approach for "3 results": 
  // If we only have 3 results, and desktop shows 3... it's static.
  // The user wants CAROUSEL for "last 3 results". 
  // If there are exactly 3 results, on desktop it might not scroll if all 3 fit.
  // But on mobile it must scroll.

  if (slides.length > 0) {
    const slideWidth = slides[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const moveAmount = (slideWidth + gap) * currentSlide;

    track.style.transform = `translateX(-${moveAmount}px)`;
  }

  // Update Active Classes
  slides.forEach((slide, index) => {
    if (index === currentSlide) slide.classList.add('active');
    else slide.classList.remove('active');
  });

  indicators.forEach((ind, index) => {
    if (index === currentSlide) ind.classList.add('active');
    else ind.classList.remove('active');
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % totalSlides;
  updateCarousel();
  restartAutoplay();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateCarousel();
  restartAutoplay();
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
  restartAutoplay();
}

function startCarouselAutoplay() {
  stopCarouselAutoplay();
  carouselInterval = setInterval(nextSlide, 5000);
}

function stopCarouselAutoplay() {
  if (carouselInterval) clearInterval(carouselInterval);
}

function restartAutoplay() {
  stopCarouselAutoplay();
  startCarouselAutoplay();
}

// Update on resize
window.addEventListener('resize', updateCarousel);

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
    fetchSecondChanceResults();
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
  fetchSecondChanceResults();
  fetchUpcomingDraws();

  // Start auto-refresh
  startAutoRefresh();

  // Add animation classes to elements
  const animatedElements = document.querySelectorAll('.result-card, .upcoming-card');
  animatedElements.forEach(el => observer.observe(el));
});
