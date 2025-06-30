// Carrossel de imagens
class ImageCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.currentSlide = 0;
        this.slideInterval = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        // Validar se temos o número correto de slides e indicadores
        if (this.slides.length !== this.indicators.length) {
            console.warn(`Slides (${this.slides.length}) e indicadores (${this.indicators.length}) não coincidem`);
        }
        
        // Aguardar um pouco antes de iniciar para garantir que tudo está carregado
        setTimeout(() => {
            this.startAutoSlide();
            this.isInitialized = true;
        }, 1000);
        
        // Adicionar eventos aos indicadores
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
                // Reiniciar o timer quando clicado manualmente
                this.restartAutoSlide();
            });
        });
        
        // Pausar ao passar o mouse e retomar ao sair
        const container = document.querySelector('.carousel-container');
        container.addEventListener('mouseenter', () => this.stopAutoSlide());
        container.addEventListener('mouseleave', () => {
            if (this.isInitialized) {
                this.startAutoSlide();
            }
        });
    }
    
    goToSlide(slideIndex) {
        // Verificar se o slide existe
        if (!this.slides[slideIndex] || !this.indicators[slideIndex]) {
            console.warn(`Slide ${slideIndex} não existe`);
            return;
        }
        
        // Remover classe ativa de todos os slides e indicadores
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Adicionar classe ativa ao slide e indicador atual
        this.slides[slideIndex].classList.add('active');
        this.indicators[slideIndex].classList.add('active');
        
        this.currentSlide = slideIndex;
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    startAutoSlide() {
        // Sempre limpar o interval anterior antes de criar um novo
        this.stopAutoSlide();
        
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Trocar slide a cada 5 segundos
    }
    
    stopAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    restartAutoSlide() {
        this.stopAutoSlide();
        this.startAutoSlide();
    }
}

// Efeito de fade in no site
function initFadeIn() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 1s ease-in-out';
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });
}

// Ação do botão CTA
function initCTAButton() {
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            // Redirecionar para a rota limpa do formulário
            window.location.href = '/participar';
        });
    }
}

// Inicializar tudo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando carrossel principal...');
    
    // Iniciar fade in
    initFadeIn();
    
    // Iniciar botão CTA
    initCTAButton();
    
    // Aguardar um pouco mais antes de iniciar o carrossel para evitar conflitos
    setTimeout(() => {
        new ImageCarousel();
    }, 500);
});

// Prevenir que a página seja carregada sem o fade in
document.addEventListener('readystatechange', () => {
    if (document.readyState === 'loading') {
        document.body.style.opacity = '0';
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar fade in
    initFadeIn();
    
    // Iniciar botão CTA
    initCTAButton();
    
    // Aguardar um pouco mais antes de iniciar o carrossel para evitar conflitos
    setTimeout(() => {
        new ImageCarousel();
    }, 500);
});

// Prevenir que a página seja carregada sem o fade in
document.addEventListener('readystatechange', () => {
    if (document.readyState === 'loading') {
        document.body.style.opacity = '0';
    }
});


