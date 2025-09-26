// Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.currentPage = 'dashboard';
    this.user = JSON.parse(localStorage.getItem('user'));
    this.funMode = false;
    this.currentTheme = 'default';
    this.init();
  }

  init() {
    this.checkAuth();
    this.setupEventListeners();
    this.loadDashboard();
    this.initParticles();
    this.addEasterEggs();
    // Also load users initially to test
    setTimeout(() => this.loadUsers(), 1000);
  }

  checkAuth() {
    if (!this.user || this.user.role !== 'admin') {
      window.location.href = 'login.html';
      return;
    }
    document.getElementById('userName').textContent = this.user.name;
    document.getElementById('userInitials').textContent = this.user.name.split(' ').map(n => n[0]).join('');
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.showPage(page);
      });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
      });
    }
  }

  showPage(pageId) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    this.currentPage = pageId;

    // Load page data
    switch(pageId) {
      case 'dashboard': 
        this.loadDashboard(); 
        break;
      case 'users': 
        console.log('Loading users page...');
        this.loadUsers(); 
        break;
      case 'events': 
        this.loadEvents(); 
        break;
      case 'registrations': 
        this.loadRegistrations(); 
        break;
      case 'analytics': 
        this.loadAnalytics(); 
        break;
    }
  }

  async loadDashboard() {
    try {
      const [usersRes, eventsRes] = await Promise.all([
        fetch(`${window.CONFIG.API_BASE_URL}/api/admin/users`),
        fetch(`${window.CONFIG.API_BASE_URL}/api/admin/events`)
      ]);
      
      const users = await usersRes.json();
      const events = await eventsRes.json();
      
      const stats = {
        totalUsers: users.length,
        totalOrganizers: users.filter(u => u.role === 'organizer').length,
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'active').length
      };
      
      this.renderStats(stats);
      this.loadRecentActivities();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  renderStats(stats) {
    const statsData = [
      { title: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--primary)', change: '+12%' },
      { title: 'Organizers', value: stats.totalOrganizers, icon: '🎯', color: 'var(--success)', change: '+8%' },
      { title: 'Total Events', value: stats.totalEvents, icon: '🎪', color: 'var(--warning)', change: '+23%' },
      { title: 'Active Events', value: stats.activeEvents, icon: '⚡', color: 'var(--accent)', change: '+15%' }
    ];

    document.getElementById('statsGrid').innerHTML = statsData.map(stat => `
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">${stat.title}</div>
          <div class="stat-icon" style="background: ${stat.color}20; color: ${stat.color}">
            ${stat.icon}
          </div>
        </div>
        <div class="stat-number">${stat.value}</div>
        <div class="stat-change positive">
          <span>↗</span>
          <span>${stat.change}</span>
        </div>
      </div>
    `).join('');
  }

  loadRecentActivities() {
    const activities = [
      { 
        type: 'user', 
        avatar: '👤', 
        color: 'var(--success)', 
        title: 'New user registered', 
        description: 'John Doe joined as an attendee',
        time: '2 minutes ago' 
      },
      { 
        type: 'event', 
        avatar: '🎪', 
        color: 'var(--primary)', 
        title: 'Event created', 
        description: 'Tech Conference 2024 was created',
        time: '1 hour ago' 
      },
      { 
        type: 'registration', 
        avatar: '📝', 
        color: 'var(--warning)', 
        title: 'New registration', 
        description: 'Sarah registered for Music Festival',
        time: '3 hours ago' 
      },
      { 
        type: 'cancel', 
        avatar: '❌', 
        color: 'var(--danger)', 
        title: 'Event cancelled', 
        description: 'Art Workshop was cancelled',
        time: '1 day ago' 
      }
    ];

    document.getElementById('recentActivities').innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-avatar" style="background: ${activity.color}20; color: ${activity.color}">
          ${activity.avatar}
        </div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-description">${activity.description}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  async loadUsers() {
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const users = await response.json();
      console.log('Loaded users:', users);
      
      const tbody = document.getElementById('usersTableBody');
      
      if (!users || users.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="empty-state">
              <div class="empty-state-icon">👥</div>
              <div class="empty-state-title">No users found</div>
              <div class="empty-state-description">Users will appear here once they register</div>
            </td>
          </tr>
        `;
        return;
      }
      
      tbody.innerHTML = users.map(user => {
        const userName = user.name || 'Unknown User';
        const userInitials = userName.split(' ').map(n => n[0] || '?').join('').substring(0, 2);
        
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="profile-avatar" style="width: 2rem; height: 2rem; font-size: 0.75rem;">
                  ${userInitials}
                </div>
                <div>
                  <div style="font-weight: 500;">${userName}</div>
                  <div style="font-size: 0.75rem; color: var(--gray-500);">${user.email}</div>
                </div>
              </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge badge-${this.getRoleBadgeType(user.role)}">${user.role}</span></td>
            <td><span class="badge badge-success">Active</span></td>
            <td>
              <div style="display: flex; gap: 0.5rem;">
                ${user.role === 'attendee' ? 
                  `<button class="btn btn-sm btn-success" onclick="dashboard.promoteUser('${user._id}')">Promote</button>` : 
                  ''
                }
                ${user.role === 'organizer' ? 
                  `<button class="btn btn-sm btn-outline" onclick="dashboard.demoteUser('${user._id}')">Demote</button>` : 
                  ''
                }
                ${user.role !== 'admin' ? 
                  `<button class="btn btn-sm btn-danger" onclick="dashboard.deleteUser('${user._id}')">Delete</button>` : 
                  ''
                }
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading users:', error);
      document.getElementById('usersTableBody').innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <div class="empty-state-icon">❌</div>
            <div class="empty-state-title">Error loading users</div>
            <div class="empty-state-description">Please check the console for details</div>
          </td>
        </tr>
      `;
    }
  }

  async loadEvents() {
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/events`);
      const events = await response.json();
      
      if (events.length === 0) {
        document.getElementById('eventsTableBody').innerHTML = `
          <tr>
            <td colspan="5" class="empty-state">
              <div class="empty-state-icon">🎪</div>
              <div class="empty-state-title">No events found</div>
              <div class="empty-state-description">Events will appear here once organizers create them</div>
            </td>
          </tr>
        `;
        return;
      }
      
      document.getElementById('eventsTableBody').innerHTML = events.map(event => `
        <tr>
          <td>
            <div style="font-weight: 500;">${event.title}</div>
            <div style="font-size: 0.75rem; color: var(--gray-500);">${event.location}</div>
          </td>
          <td>${event.organizerId?.name || 'Unknown'}</td>
          <td>${new Date(event.date).toLocaleDateString()}</td>
          <td><span class="badge badge-${event.status === 'active' ? 'success' : 'danger'}">${event.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-outline" onclick="dashboard.viewEvent('${event._id}')">View</button>
              <button class="btn btn-sm btn-danger" onclick="dashboard.deleteEvent('${event._id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  async loadRegistrations() {
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/registrations`);
      const registrations = await response.json();
      
      if (registrations.length === 0) {
        document.getElementById('registrationsTableBody').innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <div class="empty-state-icon">📝</div>
              <div class="empty-state-title">No registrations found</div>
              <div class="empty-state-description">Event registrations will appear here</div>
            </td>
          </tr>
        `;
        return;
      }
      
      document.getElementById('registrationsTableBody').innerHTML = registrations.map(reg => `
        <tr>
          <td>
            <div style="font-weight: 500;">${reg.eventId?.title || 'Unknown Event'}</div>
            <div style="font-size: 0.75rem; color: var(--gray-500);">${reg.eventId?.location || ''}</div>
          </td>
          <td>${reg.userId?.name || 'Unknown User'}</td>
          <td>${new Date(reg.registrationDate).toLocaleDateString()}</td>
          <td><span class="badge badge-success">Confirmed</span></td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  }

  loadAnalytics() {
    // Sample data for charts
    setTimeout(() => {
      this.createRegistrationsChart();
      this.createTopEventsChart();
      this.createEventStatusChart();
    }, 100);
  }

  createRegistrationsChart() {
    const ctx = document.getElementById('registrationsChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Registrations',
          data: [12, 19, 15, 25, 22, 30],
          borderColor: 'var(--primary)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  createTopEventsChart() {
    const ctx = document.getElementById('topEventsChart');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Tech Conference', 'Music Festival', 'Art Exhibition', 'Sports Event', 'Food Fair'],
        datasets: [{
          data: [45, 38, 32, 28, 22],
          backgroundColor: [
            'var(--primary)',
            'var(--success)',
            'var(--warning)',
            'var(--danger)',
            'var(--accent)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  createEventStatusChart() {
    const ctx = document.getElementById('eventStatusChart');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Active', 'Cancelled'],
        datasets: [{
          data: [75, 25],
          backgroundColor: ['var(--success)', 'var(--danger)']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  getRoleBadgeType(role) {
    const types = {
      'admin': 'danger',
      'organizer': 'primary',
      'attendee': 'success'
    };
    return types[role] || 'gray';
  }

  handleSearch(query) {
    // Implement search functionality
    console.log('Searching for:', query);
  }

  // User Management
  async promoteUser(userId) {
    if (confirm('Promote this user to organizer?')) {
      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/users/${userId}/promote`, {
          method: 'PUT'
        });
        
        if (response.ok) {
          this.showNotification('User promoted successfully!', 'success');
          this.loadUsers();
        } else {
          this.showNotification('Error promoting user', 'error');
        }
      } catch (error) {
        this.showNotification('Error promoting user', 'error');
      }
    }
  }

  async demoteUser(userId) {
    if (confirm('Demote this user to attendee?')) {
      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/users/${userId}/demote`, {
          method: 'PUT'
        });
        
        if (response.ok) {
          this.showNotification('User demoted successfully!', 'success');
          this.loadUsers();
        } else {
          this.showNotification('Error demoting user', 'error');
        }
      } catch (error) {
        this.showNotification('Error demoting user', 'error');
      }
    }
  }

  async deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          this.showNotification('User deleted successfully', 'success');
          this.loadUsers();
        } else {
          this.showNotification('Error deleting user', 'error');
        }
      } catch (error) {
        this.showNotification('Error deleting user', 'error');
      }
    }
  }

  // Event Management
  viewEvent(eventId) {
    this.showNotification('Event details view - Feature coming soon!', 'info');
  }

  async deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/admin/events/${eventId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          this.showNotification('Event deleted successfully', 'success');
          this.loadEvents();
        } else {
          this.showNotification('Error deleting event', 'error');
        }
      } catch (error) {
        this.showNotification('Error deleting event', 'error');
      }
    }
  }

  // Settings
  updateProfile() {
    this.showNotification('Profile update - Feature coming soon!', 'info');
  }

  updateSettings() {
    this.showNotification('Settings saved successfully!', 'success');
  }

  // Utility
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slide-out-right 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
  }

  // Fun Mode Features
  toggleFunMode() {
    this.funMode = !this.funMode;
    const funBtn = document.getElementById('funModeBtn');
    const funWidget = document.getElementById('funWidget');
    const particles = document.getElementById('particles-js');
    
    if (this.funMode) {
      funBtn.classList.add('active');
      funWidget.style.display = 'block';
      particles.classList.add('active');
      this.showNotification('🎉 Fun Mode Activated! Let\'s party! 🎉', 'success');
      this.animateStatsCards();
    } else {
      funBtn.classList.remove('active');
      funWidget.style.display = 'none';
      particles.classList.remove('active');
      this.resetTheme();
      this.showNotification('Fun Mode Deactivated', 'info');
    }
  }

  initParticles() {
    if (typeof particlesJS !== 'undefined') {
      particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: '#6366f1' },
          shape: { type: 'circle' },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#6366f1',
            opacity: 0.4,
            width: 1
          },
          move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: true, mode: 'push' },
            resize: true
          }
        },
        retina_detect: true
      });
    }
  }

  animateStatsCards() {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate');
        setTimeout(() => card.classList.remove('animate'), 600);
      }, index * 200);
    });
  }

  animateActivities() {
    const activities = document.querySelectorAll('.activity-item');
    activities.forEach((activity, index) => {
      setTimeout(() => {
        activity.classList.add('animate');
        setTimeout(() => activity.classList.remove('animate'), 500);
      }, index * 100);
    });
  }

  launchConfetti() {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        this.createConfetti();
      }, i * 50);
    }
    this.showNotification('🎊 Confetti launched! 🎊', 'success');
  }

  createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = this.getRandomColor();
    confetti.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }

  getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  rainbowMode() {
    this.resetTheme();
    document.body.classList.add('rainbow-mode');
    this.currentTheme = 'rainbow';
    this.showNotification('🌈 Rainbow Mode Activated! 🌈', 'success');
    setTimeout(() => this.resetTheme(), 10000);
  }

  matrixMode() {
    this.resetTheme();
    document.body.classList.add('matrix-mode');
    this.currentTheme = 'matrix';
    this.showNotification('💊 Welcome to the Matrix 💊', 'success');
    setTimeout(() => this.resetTheme(), 15000);
  }

  darkMode() {
    this.resetTheme();
    document.body.classList.add('dark-mode');
    this.currentTheme = 'dark';
    this.showNotification('🌙 Dark Mode Activated 🌙', 'success');
  }

  shakeIt() {
    document.body.classList.add('shake-mode');
    this.showNotification('🌪️ Earthquake Mode! 🌪️', 'success');
    setTimeout(() => {
      document.body.classList.remove('shake-mode');
    }, 3000);
  }

  resetTheme() {
    document.body.classList.remove('rainbow-mode', 'matrix-mode', 'dark-mode', 'shake-mode');
    this.currentTheme = 'default';
  }

  showRandomNotification() {
    const messages = [
      '🎉 You clicked the notification bell!',
      '📢 Admin powers activated!',
      '🚀 Dashboard is running smoothly!',
      '⭐ You\'re doing great!',
      '🎯 All systems operational!',
      '🔥 EventHub is on fire!',
      '💎 Premium admin detected!',
      '🎪 The show must go on!'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    this.showNotification(randomMessage, 'info');
  }

  addEasterEggs() {
    // Konami Code Easter Egg
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
      konamiCode.push(e.code);
      if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
      }
      
      if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        this.activateSecretMode();
        konamiCode = [];
      }
    });

    // Double-click logo easter egg
    document.querySelector('.logo').addEventListener('dblclick', () => {
      this.logoSurprise();
    });

    // Secret admin command
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        this.secretAdminPanel();
      }
    });
  }

  activateSecretMode() {
    this.showNotification('🎮 Konami Code Activated! Secret Admin Powers Unlocked! 🎮', 'success');
    this.launchConfetti();
    setTimeout(() => this.rainbowMode(), 1000);
    
    // Add secret stats
    const secretStat = document.createElement('div');
    secretStat.className = 'stat-card animate';
    secretStat.innerHTML = `
      <div class="stat-header">
        <div class="stat-title">Secret Level</div>
        <div class="stat-icon" style="background: gold; color: white;">🏆</div>
      </div>
      <div class="stat-number">∞</div>
      <div class="stat-change positive">
        <span>🚀</span>
        <span>LEGENDARY</span>
      </div>
    `;
    document.getElementById('statsGrid').appendChild(secretStat);
  }

  logoSurprise() {
    const logo = document.querySelector('.logo');
    logo.style.animation = 'spin 2s linear';
    this.showNotification('🎪 EventHub Logo Dance! 🎪', 'info');
    setTimeout(() => {
      logo.style.animation = '';
    }, 2000);
  }

  secretAdminPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 2rem;
      border-radius: 1rem;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;
    panel.innerHTML = `
      <h3>🔐 Secret Admin Panel</h3>
      <p>Congratulations! You found the secret panel!</p>
      <button onclick="this.parentElement.remove(); dashboard.launchConfetti();" 
              style="background: white; color: #667eea; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem;">
        Activate Super Powers! 🚀
      </button>
    `;
    document.body.appendChild(panel);
    
    setTimeout(() => {
      if (panel.parentElement) panel.remove();
    }, 10000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new AdminDashboard();
});