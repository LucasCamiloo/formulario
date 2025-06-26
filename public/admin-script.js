class AdminPanel {
    constructor() {
        this.participants = [];
        this.filteredParticipants = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortField = 'registrationDate';
        this.sortDirection = 'desc';
        this.selectedIds = new Set();
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.hideLoading();
    }
    
    setupEventListeners() {
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterData();
        });
        
        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => this.filterData());
        document.getElementById('deviceFilter').addEventListener('change', () => this.filterData());
        document.getElementById('dateFilter').addEventListener('change', () => this.filterData());
        
        // Select all checkbox
        document.getElementById('selectAll').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });
    }
    
    async loadData() {
        this.showLoading();
        try {
            const [participantsResponse, statsResponse] = await Promise.all([
                fetch('/api/participants'),
                fetch('/api/stats')
            ]);
            
            if (!participantsResponse.ok || !statsResponse.ok) {
                throw new Error('Erro ao carregar dados');
            }
            
            const participantsData = await participantsResponse.json();
            const statsData = await statsResponse.json();
            
            this.participants = participantsData.data || [];
            this.updateStats(statsData.data);
            this.filterData();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados. Tente novamente.');
        } finally {
            this.hideLoading();
        }
    }
    
    updateStats(stats) {
        document.getElementById('totalParticipants').textContent = stats.totalParticipants || 0;
        document.getElementById('todayParticipants').textContent = stats.todayParticipants || 0;
        document.getElementById('emailsSent').textContent = stats.emailsSent || 0;
        document.getElementById('conversionRate').textContent = stats.conversionRate + '%' || '0%';
    }
    
    filterData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const deviceFilter = document.getElementById('deviceFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        this.filteredParticipants = this.participants.filter(participant => {
            const matchesSearch = !searchTerm || 
                participant.name.toLowerCase().includes(searchTerm) ||
                participant.email.toLowerCase().includes(searchTerm) ||
                participant.phone.includes(searchTerm);
            
            const matchesStatus = !statusFilter || participant.status === statusFilter;
            
            const matchesDevice = !deviceFilter || 
                participant.deviceInfo?.device === deviceFilter;
            
            const matchesDate = !dateFilter || 
                new Date(participant.registrationDate).toDateString() === new Date(dateFilter).toDateString();
            
            return matchesSearch && matchesStatus && matchesDevice && matchesDate;
        });
        
        this.currentPage = 1;
        this.selectedIds.clear();
        this.updateSelectAllCheckbox();
        this.renderTable();
        this.renderPagination();
    }
    
    sortData(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.filteredParticipants.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];
            
            if (field === 'registrationDate') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.renderTable();
    }
    
    renderTable() {
        const tbody = document.getElementById('participantsTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredParticipants.slice(startIndex, endIndex);
        
        tbody.innerHTML = '';
        
        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum participante encontrado</td></tr>';
            return;
        }
        
        pageData.forEach(participant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="participant-checkbox" 
                           data-id="${participant._id}" 
                           ${this.selectedIds.has(participant._id) ? 'checked' : ''}>
                </td>
                <td>${participant.name}</td>
                <td>${participant.email}</td>
                <td>${participant.phone}</td>
                <td>${new Date(participant.registrationDate).toLocaleString('pt-BR')}</td>
                <td>
                    <i class="fas fa-${this.getDeviceIcon(participant.deviceInfo?.device)}"></i>
                    ${participant.deviceInfo?.device || 'N/A'}
                </td>
                <td>
                    <span class="status-badge status-${participant.status}">
                        ${this.getStatusLabel(participant.status)}
                    </span>
                </td>
                <td>
                    <span class="email-status ${participant.emailConfirmationSent ? 'email-sent' : 'email-pending'}">
                        ${participant.emailConfirmationSent ? 'Enviado' : 'Pendente'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="adminPanel.viewParticipant('${participant._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteParticipant('${participant._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Add checkbox event listener
            const checkbox = row.querySelector('.participant-checkbox');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedIds.add(participant._id);
                } else {
                    this.selectedIds.delete(participant._id);
                }
                this.updateSelectButtons();
                this.updateSelectAllCheckbox();
            });
            
            tbody.appendChild(row);
        });
        
        this.updateSelectButtons();
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredParticipants.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="adminPanel.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="${i === this.currentPage ? 'active' : ''}"
                            onclick="adminPanel.changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        // Next button
        paginationHTML += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="adminPanel.changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        pagination.innerHTML = paginationHTML;
    }
    
    changePage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }
    
    toggleSelectAll(checked) {
        this.selectedIds.clear();
        
        if (checked) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const pageData = this.filteredParticipants.slice(startIndex, endIndex);
            
            pageData.forEach(participant => {
                this.selectedIds.add(participant._id);
            });
        }
        
        document.querySelectorAll('.participant-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        this.updateSelectButtons();
    }
    
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const pageCheckboxes = document.querySelectorAll('.participant-checkbox');
        const checkedBoxes = document.querySelectorAll('.participant-checkbox:checked');
        
        selectAllCheckbox.checked = pageCheckboxes.length > 0 && pageCheckboxes.length === checkedBoxes.length;
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && pageCheckboxes.length !== checkedBoxes.length;
    }
    
    updateSelectButtons() {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        deleteBtn.disabled = this.selectedIds.size === 0;
    }
    
    async deleteParticipant(id) {
        if (confirm('Tem certeza que deseja excluir este participante?')) {
            await this.deleteParticipants([id]);
        }
    }
    
    async deleteSelected() {
        if (this.selectedIds.size === 0) return;
        
        const message = `Tem certeza que deseja excluir ${this.selectedIds.size} participante(s) selecionado(s)?`;
        if (confirm(message)) {
            await this.deleteParticipants(Array.from(this.selectedIds));
        }
    }
    
    async deleteParticipants(ids) {
        this.showLoading();
        
        try {
            const response = await fetch('/api/participants/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao excluir participantes');
            }
            
            const result = await response.json();
            alert(`${result.deletedCount} participante(s) excluído(s) com sucesso!`);
            
            this.selectedIds.clear();
            await this.loadData();
        } catch (error) {
            console.error('Erro ao excluir participantes:', error);
            alert('Erro ao excluir participantes. Tente novamente.');
        } finally {
            this.hideLoading();
        }
    }
    
    viewParticipant(id) {
        const participant = this.participants.find(p => p._id === id);
        if (participant) {
            const details = `
Nome: ${participant.name}
Email: ${participant.email}
Telefone: ${participant.phone}
Data de Registro: ${new Date(participant.registrationDate).toLocaleString('pt-BR')}
Status: ${this.getStatusLabel(participant.status)}
Dispositivo: ${participant.deviceInfo?.device || 'N/A'}
Navegador: ${participant.clientInfo?.browser || 'N/A'}
IP: ${participant.clientInfo?.ip || 'N/A'}
Email Enviado: ${participant.emailConfirmationSent ? 'Sim' : 'Não'}
            `;
            alert(details);
        }
    }
    
    async exportData() {
        try {
            const response = await fetch('/api/participants/export');
            if (!response.ok) {
                throw new Error('Erro ao exportar dados');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `participantes_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            alert('Erro ao exportar dados. Tente novamente.');
        }
    }
    
    getDeviceIcon(device) {
        switch (device) {
            case 'Mobile': return 'mobile-alt';
            case 'Tablet': return 'tablet-alt';
            case 'Desktop': return 'desktop';
            default: return 'question-circle';
        }
    }
    
    getStatusLabel(status) {
        switch (status) {
            case 'active': return 'Ativo';
            case 'inactive': return 'Inativo';
            case 'disqualified': return 'Desqualificado';
            default: return 'Desconhecido';
        }
    }
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
}

// Global functions
function sortTable(field) {
    adminPanel.sortData(field);
}

function loadData() {
    adminPanel.loadData();
}

function exportData() {
    adminPanel.exportData();
}

function deleteSelected() {
    adminPanel.deleteSelected();
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
