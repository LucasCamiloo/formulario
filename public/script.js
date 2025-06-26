// Carrossel de imagens
class ImageCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.slideText = document.getElementById('slideText');
        this.currentSlide = 0;
        this.slideInterval = null;
        this.isInitialized = false;
        
        // Textos para cada slide
        this.slideTexts = [
            "CADA VENDA TE COLOCA MAIS PERTO DA DIREÇÃO CERTA.",
            "PRA QUEM ACELERA NAS METAS, A RECOMPENSA VEM COM CHAVE NA MÃO.",
            "CHEGAR LÁ DEPENDE DE VOCÊ.",
            "DEU ESFORÇO TE LEVA LONGE",
            "VOCÊ PODE SER O PRÓXIMO",
            "OPORTUNIDADE ÚNICA",
            "CADASTRE-SE AGORA",
            "NÃO PERCA ESSA CHANCE"
        ];
        
        this.init();
    }
    
    init() {
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
        // Remover classe ativa de todos os slides e indicadores
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Adicionar classe ativa ao slide e indicador atual
        this.slides[slideIndex].classList.add('active');
        this.indicators[slideIndex].classList.add('active');
        
        // Atualizar o texto com animação
        this.updateSlideText(slideIndex);
        
        this.currentSlide = slideIndex;
    }
    
    updateSlideText(slideIndex) {
        if (this.slideText && this.slideTexts[slideIndex]) {
            // Animação de fade out
            this.slideText.style.opacity = '0';
            
            setTimeout(() => {
                // Atualizar texto
                this.slideText.textContent = this.slideTexts[slideIndex];
                
                // Animação de fade in
                this.slideText.style.opacity = '0.8';
            }, 300);
        }
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
            window.location.href = '/form.html';
        });
    }
}

// Inicializar tudo quando o DOM estiver carregado
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


