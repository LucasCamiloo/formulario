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
            this.showParticipantModal(participant);
        }
    }
    
    showParticipantModal(participant) {
        // Fill modal with participant data
        document.getElementById('modalName').textContent = participant.name;
        document.getElementById('modalEmail').textContent = participant.email;
        document.getElementById('modalPhone').textContent = participant.phone;
        
        const statusBadge = document.getElementById('modalStatus');
        statusBadge.textContent = this.getStatusLabel(participant.status);
        statusBadge.className = `status-badge status-${participant.status}`;
        
        const date = new Date(participant.registrationDate);
        document.getElementById('modalDate').textContent = date.toLocaleDateString('pt-BR');
        document.getElementById('modalTime').textContent = date.toLocaleTimeString('pt-BR');
        
        document.getElementById('modalDevice').textContent = participant.deviceInfo?.device || 'N/A';
        document.getElementById('modalBrowser').textContent = participant.clientInfo?.browser || 'N/A';
        document.getElementById('modalIP').textContent = participant.clientInfo?.ip || 'N/A';
        document.getElementById('modalResolution').textContent = participant.deviceInfo?.screenResolution || 'N/A';
        document.getElementById('modalLanguage').textContent = participant.deviceInfo?.language || 'N/A';
        
        const emailStatus = document.getElementById('modalEmailSent');
        emailStatus.textContent = participant.emailConfirmationSent ? 'Enviado' : 'Pendente';
        emailStatus.className = participant.emailConfirmationSent ? 'email-sent' : 'email-pending';
        
        // Show modal
        document.getElementById('participantModal').style.display = 'block';
        
        // Add small delay before loading geolocation to ensure modal is rendered
        setTimeout(() => {
            this.loadGeolocation(participant.clientInfo?.ip || '127.0.0.1');
        }, 100);
    }
    
    async loadGeolocation(ip) {
        try {
            // Reset location info
            document.getElementById('modalCountry').textContent = 'Carregando...';
            document.getElementById('modalRegion').textContent = 'Carregando...';
            document.getElementById('modalCity').textContent = 'Carregando...';
            document.getElementById('modalISP').textContent = 'Carregando...';
            
            // Initialize map
            const mapContainer = document.getElementById('map');
            mapContainer.innerHTML = '<div class="loading-map"><i class="fas fa-spinner"></i> Carregando mapa...</div>';
            
            let locationData = null;
            
            // Handle localhost and local network IPs
            if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('fc00:') || ip.startsWith('fe80:')) {
                console.log('IP local detectado, usando localização padrão');
                locationData = {
                    country: 'Brasil',
                    region: 'São Paulo',
                    city: 'São Paulo',
                    isp: 'Rede Local/Desenvolvimento',
                    lat: -23.5505,
                    lng: -46.6333
                };
            } else {
                // Try multiple HTTPS APIs in order
                const apis = [
                    {
                        name: 'ipinfo.io',
                        url: `https://ipinfo.io/${ip}/json`,
                        parseData: (data) => {
                            const [lat, lng] = (data.loc || '0,0').split(',').map(Number);
                            return {
                                country: data.country,
                                region: data.region,
                                city: data.city,
                                isp: data.org,
                                lat: lat,
                                lng: lng,
                                error: data.error
                            };
                        }
                    },
                    {
                        name: 'ipapi.co',
                        url: `https://ipapi.co/${ip}/json/`,
                        parseData: (data) => ({
                            country: data.country_name,
                            region: data.region,
                            city: data.city,
                            isp: data.org,
                            lat: data.latitude,
                            lng: data.longitude,
                            error: data.error
                        })
                    },
                    {
                        name: 'ip-api.com (via proxy)',
                        url: `https://api.allorigins.win/get?url=${encodeURIComponent(`http://ip-api.com/json/${ip}`)}`,
                        parseData: (response) => {
                            const data = JSON.parse(response.contents);
                            return {
                                country: data.country,
                                region: data.regionName,
                                city: data.city,
                                isp: data.isp,
                                lat: data.lat,
                                lng: data.lon,
                                error: data.status === 'fail' ? data.message : null
                            };
                        }
                    }
                ];
                
                // Try each API until one works
                for (const api of apis) {
                    try {
                        console.log(`Tentando API: ${api.name}`);
                        
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
                        
                        const response = await fetch(api.url, {
                            signal: controller.signal,
                            mode: 'cors',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const data = await response.json();
                        locationData = api.parseData(data);
                        
                        if (locationData.error) {
                            throw new Error(locationData.error);
                        }
                        
                        if (locationData.lat && locationData.lng && 
                            !isNaN(locationData.lat) && !isNaN(locationData.lng)) {
                            console.log(`Sucesso com API: ${api.name}`, locationData);
                            break;
                        } else {
                            throw new Error('Coordenadas inválidas recebidas');
                        }
                    } catch (error) {
                        console.warn(`API ${api.name} falhou:`, error.message);
                        
                        // Clear timeout if still running
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        continue;
                    }
                }
                
                // If no API worked, use fallback based on IP patterns
                if (!locationData || (!locationData.lat && !locationData.lng)) {
                    console.log('Usando localização fallback baseada no IP');
                    
                    // Simple IP-based country guessing (very basic)
                    let fallbackLocation = {
                        country: 'Brasil',
                        region: 'São Paulo',
                        city: 'São Paulo',
                        isp: 'Provedor Desconhecido',
                        lat: -23.5505,
                        lng: -46.6333
                    };
                    
                    // Check if IP might be from other countries (very basic check)
                    if (ip.startsWith('8.8.') || ip.startsWith('1.1.')) {
                        fallbackLocation = {
                            country: 'Estados Unidos',
                            region: 'California',
                            city: 'Mountain View',
                            isp: 'DNS Público',
                            lat: 37.4419,
                            lng: -122.1430
                        };
                    }
                    
                    locationData = fallbackLocation;
                }
            }
            
            // Update location info
            document.getElementById('modalCountry').textContent = locationData.country || 'N/A';
            document.getElementById('modalRegion').textContent = locationData.region || 'N/A';
            document.getElementById('modalCity').textContent = locationData.city || 'N/A';
            document.getElementById('modalISP').textContent = locationData.isp || 'N/A';
            
            // Initialize Leaflet map
            mapContainer.innerHTML = '';
            
            // Validate coordinates
            const lat = parseFloat(locationData.lat) || 0;
            const lng = parseFloat(locationData.lng) || 0;
            
            if (lat === 0 && lng === 0) {
                throw new Error('Coordenadas inválidas (0,0)');
            }
            
            const map = L.map('map').setView([lat, lng], 10);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Add marker
            const marker = L.marker([lat, lng]).addTo(map);
            const popupContent = `
                <div style="text-align: center;">
                    <b>${locationData.city || 'Localização'}</b><br>
                    ${locationData.region || ''}<br>
                    ${locationData.country || ''}<br>
                    <small style="color: #666;">IP: ${ip}</small><br>
                    <small style="color: #666;">Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
            
            // Add accuracy disclaimer
            const disclaimer = document.createElement('div');
            disclaimer.style.cssText = 'font-size: 12px; color: #666; text-align: center; margin-top: 10px; font-style: italic; background: rgba(255,255,255,0.9); padding: 5px; border-radius: 4px;';
            disclaimer.textContent = '* Localização aproximada baseada no endereço IP. Precisão pode variar.';
            mapContainer.appendChild(disclaimer);
            
        } catch (error) {
            console.error('Erro ao carregar geolocalização:', error);
            
            // Show error state
            document.getElementById('modalCountry').textContent = 'Indisponível';
            document.getElementById('modalRegion').textContent = 'Indisponível';
            document.getElementById('modalCity').textContent = 'Indisponível';
            document.getElementById('modalISP').textContent = 'Indisponível';
            
            const mapContainer = document.getElementById('map');
            mapContainer.innerHTML = `
                <div class="loading-map">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b; font-size: 32px;"></i> 
                    <div style="margin-top: 15px; max-width: 300px;">
                        <strong style="color: #333;">Não foi possível carregar a localização</strong><br><br>
                        <small style="color: #666; display: block; margin-bottom: 5px;"><strong>IP:</strong> ${ip}</small>
                        <small style="color: #666; display: block; margin-bottom: 10px;"><strong>Motivo:</strong> ${error.message}</small>
                        <small style="color: #888; font-style: italic;">
                            Isso pode ocorrer devido a restrições de CORS, APIs indisponíveis ou IPs locais.
                        </small>
                    </div>
                </div>
            `;
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

function closeParticipantModal() {
    document.getElementById('participantModal').style.display = 'none';
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const confirmModal = document.getElementById('confirmModal');
    const participantModal = document.getElementById('participantModal');
    
    if (e.target === confirmModal) {
        closeModal();
    }
    
    if (e.target === participantModal) {
        closeParticipantModal();
    }
});

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
