const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendConfirmationEmail(participant) {
        const emailTemplate = this.getConfirmationTemplate(participant);
        
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: participant.email,
            subject: '✅ Confirmação de Participação - Desafio SWS Julho 2025',
            html: emailTemplate
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email de confirmação enviado para ${participant.email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Erro ao enviar email para ${participant.email}:`, error);
            return { success: false, error: error.message };
        }
    }

    getConfirmationTemplate(participant) {
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmação de Participação</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .highlight { background: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Participação Confirmada!</h1>
                <h2>Desafio SWS - Julho 2025</h2>
            </div>
            
            <div class="content">
                <p>Olá <strong>${participant.name}</strong>,</p>
                
                <p>Sua participação no <strong>Desafio SWS - Julho 2025</strong> foi confirmada com sucesso!</p>
                
                <div class="highlight">
                    <h3>📋 Dados Confirmados:</h3>
                    <p><strong>Nome:</strong> ${participant.name}</p>
                    <p><strong>Email:</strong> ${participant.email}</p>
                    <p><strong>Telefone:</strong> ${participant.phone}</p>
                    <p><strong>Data de Inscrição:</strong> ${new Date(participant.registrationDate).toLocaleString('pt-BR')}</p>
                </div>
                
                <h3>🏆 Prêmios da Campanha:</h3>
                <ul>
                    <li><strong>🚗 Carro Zero BYD Dolphin Mini</strong> - Para o maior volume em projetos estruturados (mín. R$ 6.000.000)</li>
                    <li><strong>✈️ Vale-Viagem R$ 10.000</strong> - Para o maior volume em coletores Compritec (mín. 250 unidades)</li>
                </ul>
                
                <h3>📅 Período da Campanha:</h3>
                <p>De <strong>1º a 31 de julho de 2025</strong></p>
                
                <div class="highlight">
                    <h3>⚠️ Lembrete Importante:</h3>
                    <p>Para que suas vendas sejam contabilizadas, elas devem estar:</p>
                    <ul>
                        <li>Faturadas até 31/07/2025</li>
                        <li>Com pagamento integral recebido</li>
                        <li>Com comissão já repassada ao representante</li>
                    </ul>
                </div>
                
                <p>Acompanhe o ranking semanal e boa sorte!</p>
                
                <p>Atenciosamente,<br><strong>Equipe SWS Group</strong></p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático. Em caso de dúvidas, entre em contato conosco.</p>
                <p>© 2025 SWS Group. Todos os direitos reservados.</p>
            </div>
        </body>
        </html>
        `;
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Conexão com servidor de email verificada com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro na conexão com servidor de email:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
