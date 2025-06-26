const mongoose = require('mongoose');
const validator = require('validator');

const participantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
        maxlength: [100, 'Nome não pode exceder 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Email inválido']
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(v);
            },
            message: 'Telefone deve estar no formato (11) 99999-9999'
        }
    },
    termsAccepted: {
        type: Boolean,
        required: true,
        validate: {
            validator: function(v) {
                return v === true;
            },
            message: 'É necessário aceitar o regulamento'
        }
    },
    deviceInfo: {
        device: String,
        userAgent: String,
        screenResolution: String,
        language: String
    },
    clientInfo: {
        ip: String,
        browser: String,
        timestamp: Date
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    emailConfirmationSent: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'disqualified'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Índices para performance
participantSchema.index({ email: 1 });
participantSchema.index({ registrationDate: -1 });
participantSchema.index({ status: 1 });

// Método para gerar dados do participante para o PDF
participantSchema.methods.getPDFData = function() {
    return {
        name: this.name,
        email: this.email,
        phone: this.phone,
        timestamp: this.registrationDate.toISOString(),
        device: this.deviceInfo?.device || 'N/A',
        ip: this.clientInfo?.ip || 'N/A'
    };
};

module.exports = mongoose.model('Participant', participantSchema);
