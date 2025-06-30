// Carrossel de fundo para o formulário
class FormCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.currentSlide = 0;
        this.slideInterval = null;
        this.isPaused = false;
        
        // Validar número de slides
        if (this.slides.length === 0) {
            console.warn('Nenhum slide encontrado no formulário');
            return;
        }
        
        console.log(`FormCarousel inicializado com ${this.slides.length} slides`);
        this.init();
    }
    
    init() {
        setTimeout(() => {
            this.startAutoSlide();
        }, 1000);
    }
    
    goToSlide(slideIndex) {
        // Verificar se o slide existe
        if (slideIndex >= this.slides.length || slideIndex < 0) {
            console.warn(`Slide ${slideIndex} não existe. Máximo: ${this.slides.length - 1}`);
            return;
        }
        
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.slides[slideIndex].classList.add('active');
        this.currentSlide = slideIndex;
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    startAutoSlide() {
        if (this.isPaused) return;
        
        this.stopAutoSlide();
        this.slideInterval = setInterval(() => {
            if (!this.isPaused) {
                this.nextSlide();
            }
        }, 5000);
    }
    
    stopAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    pauseCarousel() {
        this.isPaused = true;
        this.stopAutoSlide();
    }
    
    resumeCarousel() {
        this.isPaused = false;
        this.startAutoSlide();
    }
}

// Instância global do carrossel
let formCarousel = null;

// Efeito de fade in no formulário
function initFormFadeIn() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 1s ease-in-out';
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });
}

// Formatação do telefone
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
}

// Função para detectar dispositivo no cliente
function detectClientDevice() {
    const ua = navigator.userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'Tablet';
    } else {
        return 'Desktop';
    }
}

// Validação do formulário
function validateForm(formData) {
    const errors = [];
    
    if (formData.name.length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        errors.push('E-mail inválido');
    }
    
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
        errors.push('Telefone inválido. Use o formato (11) 99999-9999');
    }
    
    if (!formData.terms) {
        errors.push('É necessário aceitar o regulamento para participar');
    }
    
    return errors;
}

// Função para gerar PDF do comprovante com regulamento
function generateReceiptPDF(userData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações do PDF
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;
    
    // Função para adicionar texto centralizado
    function addCenteredText(text, fontSize = 12, fontStyle = 'normal') {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, yPosition);
        yPosition += lineHeight + 2;
    }
    
    // Função para adicionar texto normal
    function addText(text, fontSize = 10, fontStyle = 'normal') {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.text(text, margin, yPosition);
        yPosition += lineHeight;
    }
    
    // Função para adicionar linha
    function addLine() {
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight;
    }
    
    // Cabeçalho
    addCenteredText('COMPROVANTE DE PARTICIPAÇÃO', 16, 'bold');
    addCenteredText('DESAFIO SWS - JULHO 2025', 14, 'bold');
    yPosition += 5;
    addLine();
    yPosition += 5;
    
    // Dados do participante
    addText('DADOS DO PARTICIPANTE:', 12, 'bold');
    yPosition += 2;
    addText(`Nome: ${userData.name}`);
    addText(`E-mail: ${userData.email}`);
    addText(`Telefone: ${userData.phone}`);
    yPosition += 5;
    
    // Informações do cadastro
    addText('INFORMAÇÕES DO CADASTRO:', 12, 'bold');
    yPosition += 2;
    addText(`Data: ${new Date(userData.timestamp).toLocaleDateString('pt-BR')}`);
    addText(`Hora: ${new Date(userData.timestamp).toLocaleTimeString('pt-BR')}`);
    addText(`IP: ${userData.ip || 'N/A'}`);
    addText(`Dispositivo: ${userData.device || 'N/A'}`);
    addText(`Regulamento aceito: SIM`);
    yPosition += 5;
    addLine();
    yPosition += 10;
    
    // Nova página para o regulamento
    doc.addPage();
    yPosition = 20;
    
    // Título do regulamento
    addCenteredText('REGULAMENTO OFICIAL – DESAFIO SWS | JULHO 2025', 14, 'bold');
    yPosition += 10;
    
    // Conteúdo do regulamento completo
    const regulamentoSections = [
        {
            title: '1. Objetivo da Campanha',
            content: 'Estabelecer as condições de participação, critérios de apuração e premiação da campanha Desafio SWS – Julho 2025, promovida pela SWS Group com o intuito de estimular o desempenho comercial dos representantes.'
        },
        {
            title: '2. Período de Vigência',
            content: 'A campanha é válida exclusivamente para o período de 1º a 31 de julho de 2025.'
        },
        {
            title: '3. Participantes Elegíveis',
            content: 'Poderão participar todos os representantes comerciais da SWS Group com contrato assinado e vigente até o início do período da campanha, desde que permaneçam ativos até o encerramento da mesma. Representantes com contratos suspensos, rescindidos ou inativos durante o mês de julho estarão automaticamente desclassificados.'
        },
        {
            title: '4. Aceite do Regulamento',
            content: 'Para que a participação seja considerada válida, o representante deverá realizar a inscrição oficial e aceitar os termos deste regulamento por meio do link que será enviado pela SWS Group. A ausência de inscrição ou aceite será considerada como não participação, ainda que o representante atinja os volumes exigidos pelas metas.'
        },
        {
            title: '5. Critérios de Apuração',
            content: 'Serão consideradas válidas as vendas que cumprirem integralmente os seguintes requisitos:\n• Terem sido faturadas e com pagamento integral recebido pela SWS Group até 31/07/2025.\n• A comissão correspondente já ter sido efetivamente repassada ao representante.\n• Operações canceladas, inadimplidas ou que gerem qualquer tipo de estorno não serão consideradas para fins de apuração.\nA SWS Group reserva-se o direito de revisar o ranking e até cancelar a premiação, mesmo após o encerramento da campanha, caso uma operação considerada na apuração venha a ser posteriormente cancelada.'
        },
        {
            title: '6. Metas e Mecânica de Premiação',
            content: 'a) Meta Carro Zero – BYD Dolphin Mini\nSerá premiado o representante que alcançar o maior volume de vendas em projetos estruturados no período da campanha, desde que o montante faturado seja igual ou superior a R$ 6.000.000,00 (seis milhões de reais).\n\nb) Meta VOE – Vale-Viagem de R$ 10.000,00\nSerá premiado o representante que atingir o maior volume de vendas ou locações de coletores de dados Compritec, a partir de um mínimo de 250 unidades faturadas no período.\n\nEm ambas as metas, o prêmio será concedido exclusivamente ao primeiro colocado, desde que o volume mínimo seja atingido. O ranking poderá sofrer alterações caso haja cancelamentos de pedidos considerados no cálculo.'
        },
        {
            title: '7. Critérios de Desempate',
            content: 'Em caso de empate técnico entre dois ou mais representantes que atingirem o mesmo volume de vendas (em valor ou quantidade), serão aplicados, na seguinte ordem, os seguintes critérios de desempate:\n1. Data de fechamento da venda (anterior prevalece);\n2. Quantidade total de pedidos fechados dentro do período da campanha;\n3. Valor líquido total dos pedidos empatados (ou seja, valor bruto após eventuais descontos comerciais aplicados nas negociações);\n4. Deliberação final da diretoria da SWS Group, com base na análise técnica do histórico das operações.'
        },
        {
            title: '8. Premiação',
            content: 'a) Carro Zero – BYD Dolphin Mini\n• O veículo será adquirido pela SWS Group e entregue ao ganhador, com todos os custos de aquisição, documentação, IPVA e emplacamento pagos pela empresa.\n• O modelo premiado será o BYD Dolphin Mini, com 5 lugares, na cor Apricity White (branco), com interior Dark Blue e rodas de liga leve de 16 polegadas.\n• O prêmio será entregue com os itens de série definidos pela montadora para o modelo em questão, não sendo contemplados opcionais adicionais.\n• A entrega será realizada de acordo com a disponibilidade da concessionária, podendo haver prazo variável conforme cronograma da montadora.\n• A SWS Group não se responsabiliza por qualquer tipo de manutenção, problemas técnicos, avarias, acidentes, sinistros ou danos físicos e materiais ocorridos após a entrega do veículo ao ganhador, inclusive danos causados a terceiros.\n• Não será fornecido seguro do automóvel, sendo esta responsabilidade integral do ganhador.\n• O prêmio é pessoal e intransferível, não podendo ser convertido em dinheiro.\n• A SWS Group não se responsabiliza por eventuais impactos fiscais na declaração de Imposto de Renda do ganhador, que deverá avaliar individualmente a inclusão do bem em seu patrimônio e as obrigações decorrentes.\n\nb) Meta VOE – Vale-Viagem de R$ 10.000,00\n• O valor será creditado em cartão de benefícios da agência World 360 Tur, até o dia 31 de agosto de 2025.\n• O crédito poderá ser utilizado:\no Integralmente em uma única viagem;\no De forma parcelada em mais de um serviço/oferta;\no Como parte de pagamento/abatimento de pacotes superiores ao valor de R$ 10.000,00.\n• O valor será válido por 18 meses a partir da data de entrega do cartão.\n• A SWS Group não se responsabiliza por:\no Custos com documentação pessoal (passaporte, vistos etc.);\no Alimentação, transfers, taxas de embarque e serviços extras;\no Cancelamentos, remarcações, atrasos de voo, problemas de hospedagem ou qualquer contratempo relacionado à viagem escolhida pelo ganhador.\n• Após a entrega do cartão, todas as decisões, contratações e responsabilidades relativas à utilização do benefício passam a ser exclusivas do ganhador.'
        },
        {
            title: '9. Divulgação dos Resultados',
            content: '• Rankings parciais serão divulgados semanalmente por canais internos da SWS Group.\n• O resultado final será divulgado até o dia 1º de agosto de 2025.\n• A SWS Group se reserva o direito de prorrogar o prazo de divulgação oficial até 7 de agosto de 2025, em caso de necessidade de revisão de pedidos, ajustes de faturamento ou outros fatores que impactem a apuração final.\n• Caso o ganhador não responda ao comunicado oficial e/ou não forneça as informações solicitadas para formalização da premiação no prazo de 5 (cinco) dias corridos, a contar da data do comunicado, perderá automaticamente o direito ao prêmio, sem direito a contestação ou substituição.'
        },
        {
            title: '10. Disposições Finais',
            content: '• A SWS Group se reserva o direito de suspender, alterar ou cancelar esta campanha, a qualquer tempo, por motivo de força maior ou por decisão estratégica, sem que haja qualquer obrigação de indenização aos participantes.\n• A participação nesta campanha implica ciência, compreensão e aceitação total e irrestrita deste regulamento.\n• Dúvidas, omissões ou situações não previstas neste documento serão resolvidas pela diretoria da SWS Group, de forma soberana e irrecorrível.'
        }
    ];
    
    regulamentoSections.forEach((section) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        addText(section.title, 11, 'bold');
        yPosition += 2;
        
        // Quebrar texto longo em múltiplas linhas
        const lines = doc.splitTextToSize(section.content, pageWidth - (margin * 2));
        lines.forEach(line => {
            if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
            }
            addText(line, 9);
        });
        yPosition += 5;
    });
    
    // Rodapé
    doc.addPage();
    yPosition = 20;
    addLine();
    yPosition += 10;
    addCenteredText('Este comprovante confirma a participação na promoção.', 10);
    addCenteredText('Guarde este documento para seus registros.', 10);
    yPosition += 10;
    addCenteredText('SWS Group', 9);
    addCenteredText('Desafio SWS - Julho 2025', 9);
    addCenteredText(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, 8);
    yPosition += 10;
    addLine();
    
    // Salvar o PDF
    const fileName = `comprovante_participacao_${userData.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
}

// Função para mostrar o modal
function showTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Pausar o carrossel quando o modal abrir
    if (formCarousel) {
        formCarousel.pauseCarousel();
    }
}

// Função para fechar o modal
function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Retomar o carrossel quando o modal fechar
    if (formCarousel) {
        formCarousel.resumeCarousel();
    }
}

// Inicializar formulário
function initForm() {
    const form = document.getElementById('participationForm');
    const phoneInput = document.getElementById('phone');
    const termsLink = document.getElementById('termsLink');
    const modal = document.getElementById('termsModal');
    const closeBtn = modal.querySelector('.close');
    const modalAcceptBtn = document.getElementById('modalAcceptBtn');
    const termsCheckbox = document.getElementById('terms');
    const downloadButton = document.getElementById('downloadButton');
    
    let lastSubmissionData = null;
    
    // Formatação automática do telefone
    phoneInput.addEventListener('input', () => formatPhone(phoneInput));
    
    // Evento para o link do regulamento
    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showTermsModal();
    });
    
    // Fechar modal ao clicar no X
    closeBtn.addEventListener('click', closeTermsModal);
    
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTermsModal();
        }
    });
    
    // Aceitar termos pelo modal
    modalAcceptBtn.addEventListener('click', () => {
        termsCheckbox.checked = true;
        closeTermsModal();
    });
    
    // Prevenir que tecla ESC interfira no carrossel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            e.preventDefault();
            closeTermsModal();
        }
    });
    
    // Evento para download do comprovante
    downloadButton.addEventListener('click', () => {
        if (lastSubmissionData) {
            generateReceiptPDF(lastSubmissionData);
        }
    });
    
    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            terms: document.getElementById('terms').checked
        };
        
        const errors = validateForm(formData);
        
        if (errors.length > 0) {
            alert('Erros encontrados:\n' + errors.join('\n'));
            return;
        }
        
        // Adicionar informações do dispositivo
        const deviceInfo = {
            device: detectClientDevice(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language
        };
        
        console.log('📱 Informações do dispositivo:', deviceInfo);
        
        // Enviar dados para o servidor
        const submitButton = form.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = 'ENVIANDO...';
        submitButton.disabled = true;
        
        try {
            const response = await fetch('/participar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    deviceInfo
                })
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status}`);
            }
            
            if (result.success) {
                alert(result.message);
                
                // Salvar dados para download
                lastSubmissionData = {
                    ...formData,
                    timestamp: result.data.timestamp,
                    device: result.data.device,
                    ip: result.data.ip
                };
                
                // Mostrar botão de download
                downloadButton.style.display = 'block';
                
                // Resetar formulário após um tempo
                setTimeout(() => {
                    form.reset();
                    downloadButton.style.display = 'none';
                    window.location.href = '/';
                }, 5000);
            } else {
                throw new Error(result.message || 'Erro ao enviar formulário');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao enviar formulário. Tente novamente.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    initFormFadeIn();
    initForm();
    
    // Iniciar carrossel de fundo
    setTimeout(() => {
        formCarousel = new FormCarousel();
    }, 500);
});
