// ============================================
// FEZINHA DE HOJE - INTERACTIVE FUNCTIONALITY
// ============================================

// Mock data for demonstration
const mockResults = [
    {
        game: "2x1000",
        date: "12/01/2026",
        numbers: [7, 14, 23, 31, 42],
        prize: "R$ 50.000,00"
    },
    {
        game: "Super Sorte",
        date: "11/01/2026",
        numbers: [3, 18, 27, 35, 49],
        prize: "R$ 100.000,00"
    },
    {
        game: "Mega Chance",
        date: "10/01/2026",
        numbers: [5, 12, 21, 38, 44],
        prize: "R$ 75.000,00"
    }
];

const mockUpcoming = [
    {
        game: "2x1000",
        drawDate: new Date("2026-01-13T20:00:00"),
        prize: "R$ 50.000,00"
    },
    {
        game: "Super Sorte",
        drawDate: new Date("2026-01-14T20:00:00"),
        prize: "R$ 100.000,00"
    },
    {
        game: "Mega Chance",
        drawDate: new Date("2026-01-15T20:00:00"),
        prize: "R$ 75.000,00"
    }
];

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
// LOAD RESULTS
// ============================================
function loadResults() {
    const resultsGrid = document.getElementById('resultsGrid');

    mockResults.forEach((result, index) => {
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
        <div class="prize-label">Prêmio</div>
        <div class="prize-amount">${result.prize}</div>
      </div>
    `;

        resultsGrid.appendChild(card);
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
// LOAD UPCOMING DRAWS
// ============================================
function loadUpcomingDraws() {
    const upcomingGrid = document.getElementById('upcomingGrid');

    mockUpcoming.forEach((draw, index) => {
        const card = document.createElement('div');
        card.className = 'upcoming-card slide-up';
        card.style.animationDelay = `${index * 0.1}s`;

        const countdownId = `countdown-${index}`;

        card.innerHTML = `
      <h3 class="upcoming-game">${draw.game}</h3>
      <div class="countdown" id="${countdownId}"></div>
      <p class="upcoming-prize">Prêmio: ${draw.prize}</p>
    `;

        upcomingGrid.appendChild(card);

        // Update countdown every second
        const countdownElement = document.getElementById(countdownId);
        updateCountdown(countdownElement, draw.drawDate.getTime());

        setInterval(() => {
            updateCountdown(countdownElement, draw.drawDate.getTime());
        }, 1000);
    });
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
    loadResults();
    loadUpcomingDraws();

    // Add animation classes to elements
    const animatedElements = document.querySelectorAll('.result-card, .upcoming-card');
    animatedElements.forEach(el => observer.observe(el));
});

// ============================================
// API INTEGRATION (READY FOR FUTURE USE)
// ============================================
// Uncomment and modify these functions when ready to connect to your API

/*
async function fetchResults() {
  try {
    const response = await fetch('/api/results/latest');
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error('Error fetching results:', error);
    // Fallback to mock data
    loadResults();
  }
}

async function fetchUpcomingDraws() {
  try {
    const response = await fetch('/api/draws/upcoming');
    const data = await response.json();
    displayUpcomingDraws(data);
  } catch (error) {
    console.error('Error fetching upcoming draws:', error);
    // Fallback to mock data
    loadUpcomingDraws();
  }
}

function displayResults(results) {
  const resultsGrid = document.getElementById('resultsGrid');
  resultsGrid.innerHTML = '';
  
  results.forEach((result, index) => {
    // Similar to loadResults() but with real data
  });
}

function displayUpcomingDraws(draws) {
  const upcomingGrid = document.getElementById('upcomingGrid');
  upcomingGrid.innerHTML = '';
  
  draws.forEach((draw, index) => {
    // Similar to loadUpcomingDraws() but with real data
  });
}
*/
