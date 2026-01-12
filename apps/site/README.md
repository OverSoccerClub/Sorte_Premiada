# Fezinha de Hoje - Site de Marketing

Site institucional para divulgação dos resultados dos sorteios da Fezinha de Hoje.

## 🎨 Design

O site utiliza a paleta de cores da marca:
- **Verde Escuro**: #1a4d2e, #2d5a3d (cor principal)
- **Dourado**: #d4af37, #f4e4b7 (destaques e CTAs)
- **Tipografia**: Outfit (títulos) e Inter (corpo)

## ✨ Características

- **Design Moderno**: Gradientes, glassmorphism e animações suaves
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Animações**: Micro-animações e efeitos de hover para melhor UX
- **SEO Otimizado**: Meta tags e estrutura semântica
- **Countdown Timer**: Contagem regressiva para próximos sorteios
- **Performance**: CSS e JavaScript otimizados

## 📁 Estrutura

```
site/
├── index.html          # Página principal
├── styles.css          # Sistema de design completo
├── script.js           # Funcionalidades interativas
├── assets/
│   └── logo.png        # Logo da Fezinha de Hoje
└── README.md           # Esta documentação
```

## 🚀 Como Usar

### Desenvolvimento Local

1. Abra o arquivo `index.html` diretamente no navegador, ou
2. Use um servidor local:

```bash
# Com Python
python -m http.server 8000

# Com Node.js (http-server)
npx http-server -p 8000

# Com PHP
php -S localhost:8000
```

3. Acesse `http://localhost:8000`

### Integração com API

O arquivo `script.js` está preparado para integração com sua API. Descomente e modifique as funções:

```javascript
// Buscar resultados da API
async function fetchResults() {
  const response = await fetch('/api/results/latest');
  const data = await response.json();
  displayResults(data);
}

// Buscar próximos sorteios
async function fetchUpcomingDraws() {
  const response = await fetch('/api/draws/upcoming');
  const data = await response.json();
  displayUpcomingDraws(data);
}
```

## 📱 Seções do Site

### 1. Hero Section
- Logo animado
- Título principal com gradiente dourado
- Call-to-action para ver resultados

### 2. Últimos Resultados
- Cards com resultados dos sorteios
- Números em bolas animadas
- Valor do prêmio destacado

### 3. Próximos Sorteios
- Countdown timer em tempo real
- Informações sobre o prêmio
- Design atrativo com hover effects

### 4. Footer
- Informações de contato
- Links rápidos
- Redes sociais

## 🎯 Próximos Passos

1. **Conectar à API**: Substituir dados mock por dados reais da sua API
2. **Deploy**: Hospedar em servidor web (Vercel, Netlify, etc.)
3. **Analytics**: Adicionar Google Analytics ou similar
4. **Formulários**: Adicionar formulário de contato se necessário
5. **Blog**: Considerar adicionar seção de notícias/blog

## 🔧 Customização

### Cores
Edite as variáveis CSS em `styles.css`:

```css
:root {
  --color-primary-dark: #1a4d2e;
  --color-accent-gold: #d4af37;
  /* ... */
}
```

### Conteúdo
Edite os dados mock em `script.js`:

```javascript
const mockResults = [
  {
    game: "2x1000",
    date: "12/01/2026",
    numbers: [7, 14, 23, 31, 42],
    prize: "R$ 50.000,00"
  }
];
```

## 📄 Licença

© 2026 Fezinha de Hoje. Todos os direitos reservados.
