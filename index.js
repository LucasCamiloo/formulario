require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Import models and services
const Participant = require('./models/Participant');
const emailService = require('./utils/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsing de dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conectar ao MongoDB com configuração para Vercel
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return;
    }
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('✅ Conectado ao MongoDB com sucesso');
        
        // Testar conexão de email apenas em desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            emailService.testConnection();
        }
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        throw error;
    }
};

// Função para detectar dispositivo
function detectDevice(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'Tablet';
    } else {
        return 'Desktop';
    }
}

// Função para obter informações do navegador
function getBrowserInfo(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Desconhecido';
}

// Função para obter IP real do cliente
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

// Middleware para conectar ao DB em cada request (necessário para Vercel)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Erro de conexão:', error);
        res.status(500).json({ error: 'Erro de conexão com banco de dados' });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para o formulário de participação
app.get('/participar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Rota para processar o formulário
app.post('/participar', async (req, res) => {
    try {
        const { name, email, phone, terms, deviceInfo } = req.body;
        
        // Obter informações do cliente
        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'Desconhecido';
        const device = detectDevice(userAgent);
        const browser = getBrowserInfo(userAgent);
        const timestamp = new Date();
        
        // Verificar se já existe participante com este email
        const existingParticipant = await Participant.findOne({ email: email.toLowerCase() });
        if (existingParticipant) {
            return res.status(400).json({
                success: false,
                message: 'Este email já está cadastrado na promoção.'
            });
        }
        
        // Criar novo participante
        const participantData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            termsAccepted: terms,
            deviceInfo: {
                device: deviceInfo?.device || device,
                userAgent: deviceInfo?.userAgent || userAgent,
                screenResolution: deviceInfo?.screenResolution,
                language: deviceInfo?.language
            },
            clientInfo: {
                ip: clientIP,
                browser: browser,
                timestamp: timestamp
            }
        };
        
        const participant = new Participant(participantData);
        await participant.save();
        
        // Log detalhado no console
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎯 NOVA PARTICIPAÇÃO REGISTRADA NO MONGODB');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📝 Nome: ${participant.name}`);
        console.log(`📧 Email: ${participant.email}`);
        console.log(`📱 Telefone: ${participant.phone}`);
        console.log(`✅ Aceitou regulamento: ${participant.termsAccepted ? 'Sim' : 'Não'}`);
        console.log(`🆔 ID MongoDB: ${participant._id}`);
        console.log('───────────────────────────────────────────────────────────');
        console.log(`🌐 IP: ${clientIP}`);
        console.log(`💻 Dispositivo: ${device}`);
        console.log(`🌏 Navegador: ${browser}`);
        console.log(`📅 Data: ${timestamp.toLocaleDateString('pt-BR')}`);
        console.log(`⏰ Hora: ${timestamp.toLocaleTimeString('pt-BR')}`);
        console.log(`🕒 Timestamp: ${timestamp.toISOString()}`);
        console.log('───────────────────────────────────────────────────────────');
        console.log(`🔍 User Agent: ${userAgent}`);
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Enviar email de confirmação
        const emailResult = await emailService.sendConfirmationEmail(participant);
        
        if (emailResult.success) {
            // Atualizar status do email
            participant.emailConfirmationSent = true;
            await participant.save();
            console.log(`✅ Email de confirmação enviado com sucesso para ${participant.email}`);
        } else {
            console.error(`❌ Falha ao enviar email de confirmação para ${participant.email}:`, emailResult.error);
        }
        
        // Responder com sucesso
        res.json({ 
            success: true, 
            message: `Obrigado, ${participant.name}! Seu cadastro foi realizado com sucesso. Verifique seu email para a confirmação.`,
            data: {
                id: participant._id,
                timestamp: participant.registrationDate.toISOString(),
                device: device,
                ip: clientIP,
                emailSent: emailResult.success
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar participação:', error);
        
        // Verificar se é erro de validação
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos: ' + errors.join(', ')
            });
        }
        
        // Erro genérico
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor. Tente novamente mais tarde.'
        });
    }
});

// Rota para listar participantes (admin)
app.get('/api/participants', async (req, res) => {
    try {
        const participants = await Participant.find()
            .select('-__v')
            .sort({ registrationDate: -1 });
            
        res.json({
            success: true,
            count: participants.length,
            data: participants
        });
    } catch (error) {
        console.error('❌ Erro ao buscar participantes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar participantes'
        });
    }
});

// Rota para estatísticas
app.get('/api/stats', async (req, res) => {
    try {
        const totalParticipants = await Participant.countDocuments();
        const todayParticipants = await Participant.countDocuments({
            registrationDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });
        const emailsSent = await Participant.countDocuments({ emailConfirmationSent: true });
        
        res.json({
            success: true,
            data: {
                totalParticipants,
                todayParticipants,
                emailsSent,
                conversionRate: totalParticipants > 0 ? ((emailsSent / totalParticipants) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
});

// Rota para API de status
app.get('/api/status', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        const emailStatus = await emailService.testConnection();
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            database: dbStatus,
            email: emailStatus ? 'OK' : 'Error'
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
});

// Rota para o painel administrativo
app.get('/linksupersecretodaswsgroup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rota para excluir participantes
app.post('/api/participants/delete', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'IDs inválidos fornecidos'
            });
        }
        
        const result = await Participant.deleteMany({ _id: { $in: ids } });
        
        console.log(`🗑️  ${result.deletedCount} participante(s) excluído(s) pelo admin`);
        
        res.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `${result.deletedCount} participante(s) excluído(s) com sucesso`
        });
    } catch (error) {
        console.error('❌ Erro ao excluir participantes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para exportar participantes em CSV
app.get('/api/participants/export', async (req, res) => {
    try {
        const participants = await Participant.find()
            .select('-__v')
            .sort({ registrationDate: -1 });
        
        // Criar CSV
        const csvHeader = 'Nome,Email,Telefone,Data de Registro,Status,Dispositivo,Navegador,IP,Email Enviado\n';
        const csvData = participants.map(p => {
            return [
                p.name,
                p.email,
                p.phone,
                new Date(p.registrationDate).toLocaleString('pt-BR'),
                p.status,
                p.deviceInfo?.device || 'N/A',
                p.clientInfo?.browser || 'N/A',
                p.clientInfo?.ip || 'N/A',
                p.emailConfirmationSent ? 'Sim' : 'Não'
            ].map(field => `"${field}"`).join(',');
        }).join('\n');
        
        const csv = csvHeader + csvData;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="participantes_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
        
        console.log(`📊 Dados exportados: ${participants.length} participantes`);
    } catch (error) {
        console.error('❌ Erro ao exportar dados:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao exportar dados'
        });
    }
});

// Middleware para redirecionar URLs com .html para URLs limpas
app.use((req, res, next) => {
    if (req.path.includes('.html')) {
        const cleanPath = req.path.replace('.html', '');
        return res.redirect(301, cleanPath);
    }
    next();
});

// Middleware para lidar com rotas não encontradas
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log('📍 Rotas disponíveis:');
        console.log('  - / (página principal)');
        console.log('  - /participar (formulário)');
        console.log('  - /linksupersecretodaswsgroup (painel administrativo)');
        console.log('  - /api/participants (listar participantes)');
        console.log('  - /api/stats (estatísticas)');
        console.log('  - /api/status (status da API)');
        console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}`);
        console.log(`📧 Email: ${process.env.SMTP_USER}`);
    });
}

// Exportar app para Vercel
module.exports = app;