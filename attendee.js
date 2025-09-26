// Attendee Dashboard JavaScript
class AttendeeDashboard {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.currentPage = 'events';
    this.events = [];
    this.myEvents = [];
    this.init();
  }

  init() {
    this.checkAuth();
    this.setupEventListeners();
    this.loadEvents();
  }

  checkAuth() {
    if (!this.user || this.user.role !== 'attendee') {
      window.location.href = 'login.html';
      return;
    }
    document.getElementById('userName').textContent = this.user.name || 'Attendee';
    document.getElementById('userInitials').textContent = 
      (this.user.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.showPage(page);
      });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', () => {
      this.applyFilters();
    });
    document.getElementById('dateFilter').addEventListener('change', () => {
      this.applyFilters();
    });
    document.getElementById('locationFilter').addEventListener('change', () => {
      this.applyFilters();
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => {
      this.closeModal();
    });
    document.getElementById('eventModal').addEventListener('click', (e) => {
      if (e.target.id === 'eventModal') {
        this.closeModal();
      }
    });
  }

  showPage(pageId) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
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
      case 'events':
        this.loadEvents();
        break;
      case 'my-events':
        this.loadMyEvents();
        break;
      case 'profile':
        this.loadProfile();
        break;
    }
  }

  async loadEvents() {
    try {
      document.getElementById('eventsGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/events`);
      if (!response.ok) throw new Error('Failed to load events');
      
      this.events = await response.json();
      this.renderEvents(this.events);
    } catch (error) {
      console.error('Error loading events:', error);
      this.showError('Failed to load events');
    }
  }

  renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    
    if (!events || events.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="animation: fadeIn 0.6s ease;">
          <div class="empty-state-icon">🎪</div>
          <div class="empty-state-title">No events found</div>
          <div class="empty-state-description">Check back later for new events!</div>
        </div>
      `;
      return;
    }

    // Add loading animation
    grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    setTimeout(() => {
      grid.innerHTML = events.map((event, index) => {
        const eventIcons = ['🎪', '🎵', '🏆', '💼', '🎨', '🍕'];
        const randomIcon = eventIcons[Math.floor(Math.random() * eventIcons.length)];
        
        return `
          <div class="event-card" onclick="attendee.showEventDetails('${event._id}')" style="animation-delay: ${index * 0.1}s;">
            <div class="event-image">
              ${randomIcon}
            </div>
            <div class="event-content">
              <h3 class="event-title">${event.title}</h3>
              <div class="event-meta">
                <div class="event-meta-item">
                  <span>📅</span>
                  <span>${new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div class="event-meta-item">
                  <span>⏰</span>
                  <span>${event.time || 'TBA'}</span>
                </div>
                <div class="event-meta-item">
                  <span>📍</span>
                  <span>${event.location}</span>
                </div>
              </div>
              <p class="event-description">${(event.description || '').substring(0, 100)}...</p>
              <div class="event-footer">
                <span class="event-organizer">by ${event.organizerId?.name || 'Unknown'}</span>
                <button class="btn btn-primary" onclick="event.stopPropagation(); attendee.attendEvent('${event._id}')">
                  <span>✨</span>
                  <span>Attend</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }, 300);
  }

  async showEventDetails(eventId) {
    try {
      const event = this.events.find(e => e._id === eventId);
      if (!event) return;

      const eventIcons = ['🎪', '🎵', '🏆', '💼', '🎨', '🍕'];
      const randomIcon = eventIcons[Math.floor(Math.random() * eventIcons.length)];

      document.getElementById('modalTitle').textContent = event.title;
      document.getElementById('modalBody').innerHTML = `
        <div class="event-image" style="margin-bottom: 2rem; height: 150px; border-radius: 1rem;">${randomIcon}</div>
        <div class="event-meta" style="margin-bottom: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="event-meta-item" style="padding: 1rem; background: var(--gray-50); border-radius: 0.75rem;">
            <span style="font-size: 1.2rem;">📅</span>
            <span style="margin-left: 0.5rem; font-weight: 500;">${new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div class="event-meta-item" style="padding: 1rem; background: var(--gray-50); border-radius: 0.75rem;">
            <span style="font-size: 1.2rem;">⏰</span>
            <span style="margin-left: 0.5rem; font-weight: 500;">${event.time || 'TBA'}</span>
          </div>
          <div class="event-meta-item" style="padding: 1rem; background: var(--gray-50); border-radius: 0.75rem;">
            <span style="font-size: 1.2rem;">📍</span>
            <span style="margin-left: 0.5rem; font-weight: 500;">${event.location}</span>
          </div>
          <div class="event-meta-item" style="padding: 1rem; background: var(--gray-50); border-radius: 0.75rem;">
            <span style="font-size: 1.2rem;">👤</span>
            <span style="margin-left: 0.5rem; font-weight: 500;">${event.organizerId?.name || 'Unknown'}</span>
          </div>
        </div>
        <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem;">
          <h4 style="margin-bottom: 1rem; color: var(--gray-700);">📝 Description</h4>
          <p style="line-height: 1.7; color: var(--gray-600);">${event.description || 'No description available.'}</p>
        </div>
        <button class="btn btn-primary" onclick="attendee.attendEvent('${event._id}'); attendee.closeModal();" style="width: 100%; justify-content: center; font-size: 1rem; padding: 1rem;">
          <span>✨</span>
          <span>Attend This Event</span>
        </button>
      `;

      document.getElementById('eventModal').classList.add('active');
    } catch (error) {
      console.error('Error showing event details:', error);
    }
  }

  closeModal() {
    document.getElementById('eventModal').classList.remove('active');
  }

  async attendEvent(eventId) {
    try {
      const userId = this.user._id || this.user.id;
      console.log('Attending event:', eventId, 'User:', userId, 'Full user:', this.user);
      
      if (!userId) {
        this.showNotification('User ID not found. Please login again.', 'error');
        return;
      }
      
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/events/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          userId: userId
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Registration successful:', result);
        this.showNotification('Successfully registered for event!', 'success');
        if (this.currentPage === 'my-events') {
          this.loadMyEvents();
        }
      } else {
        const errorText = await response.text();
        console.error('Registration failed:', response.status, errorText);
        let errorMsg = 'Failed to register';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        this.showNotification(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Error attending event:', error);
      this.showNotification('Network error. Please try again.', 'error');
    }
  }

  async loadMyEvents() {
    try {
      const userId = this.user._id || this.user.id;
      console.log('Loading events for user:', userId, 'Full user:', this.user);
      
      if (!userId) {
        this.showNotification('User ID not found. Please login again.', 'error');
        return;
      }
      
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/events/my-registrations/${userId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to load registrations: ${response.status}`);
      }
      
      this.myEvents = await response.json();
      console.log('My events loaded:', this.myEvents);
      this.renderMyEvents();
    } catch (error) {
      console.error('Error loading my events:', error);
      document.getElementById('myEventsGrid').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-title">Failed to load your events</div>
          <div class="empty-state-description">Please try again later</div>
        </div>
      `;
    }
  }

  renderMyEvents() {
    const container = document.getElementById('myEventsGrid');
    
    if (!this.myEvents || this.myEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No events registered</div>
          <div class="empty-state-description">Browse events and register to see them here!</div>
          <button class="btn btn-primary" onclick="attendee.showPage('events')">Browse Events</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.myEvents.map(registration => {
      const event = registration.eventId;
      if (!event) {
        return `
          <div class="my-event-card">
            <div class="my-event-info">
              <h3 class="my-event-title">Event Not Found</h3>
              <p class="my-event-date">❌ Event may have been deleted</p>
              <span class="event-status status-cancelled">unavailable</span>
            </div>
            <div>
              <button class="btn btn-danger" onclick="attendee.cancelRegistration('${registration._id}')">Remove</button>
            </div>
          </div>
        `;
      }
      const eventDate = new Date(event.date);
      const now = new Date();
      const status = eventDate < now ? 'past' : 'upcoming';
      
      return `
        <div class="my-event-card">
          <div class="my-event-info">
            <h3 class="my-event-title">${event.title}</h3>
            <p class="my-event-date">📅 ${eventDate.toLocaleDateString()} at ${event.time || 'TBA'}</p>
            <p class="my-event-date">📍 ${event.location}</p>
            <span class="event-status status-${status}">${status}</span>
          </div>
          <div>
            ${status === 'upcoming' ? 
              `<button class="btn btn-danger" onclick="attendee.cancelRegistration('${registration._id}')">Cancel</button>` :
              ''
            }
          </div>
        </div>
      `;
    }).join('');
  }

  async cancelRegistration(registrationId) {
    if (!confirm('Are you sure you want to cancel this registration?')) return;

    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/events/cancel-registration/${registrationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.showNotification('Registration cancelled successfully', 'success');
        this.loadMyEvents();
      } else {
        this.showNotification('Failed to cancel registration', 'error');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      this.showNotification('Failed to cancel registration', 'error');
    }
  }

  loadProfile() {
    document.getElementById('profileName').value = this.user.name || '';
    document.getElementById('profileEmail').value = this.user.email || '';
    document.getElementById('profilePhone').value = this.user.phone || '';
    document.getElementById('profileOrganization').value = this.user.organization || '';
  }

  async updateProfile() {
    try {
      const userId = this.user._id || this.user.id;
      
      if (!userId) {
        this.showNotification('User ID not found. Please login again.', 'error');
        return;
      }
      
      const formData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        organization: document.getElementById('profileOrganization').value
      };

      const password = document.getElementById('profilePassword').value;
      if (password) {
        formData.password = password;
      }

      const response = await fetch(`${window.CONFIG.API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        this.user = { ...this.user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.showNotification('Profile updated successfully!', 'success');
        document.getElementById('profilePassword').value = '';
      } else {
        this.showNotification('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showNotification('Failed to update profile', 'error');
    }
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.renderEvents(this.events);
      return;
    }

    const filtered = this.events.filter(event => 
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.location.toLowerCase().includes(query.toLowerCase()) ||
      (event.organizerId?.name || '').toLowerCase().includes(query.toLowerCase())
    );

    this.renderEvents(filtered);
  }

  applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const date = document.getElementById('dateFilter').value;
    const location = document.getElementById('locationFilter').value;

    let filtered = [...this.events];

    if (category && category !== 'all') {
      filtered = filtered.filter(event => 
        (event.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    if (date && date !== 'all') {
      const now = new Date();
      const eventDate = new Date();
      
      switch(date) {
        case 'today':
          filtered = filtered.filter(event => {
            const eDate = new Date(event.date);
            return eDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(event => {
            const eDate = new Date(event.date);
            return eDate >= now && eDate <= weekFromNow;
          });
          break;
        case 'month':
          const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          filtered = filtered.filter(event => {
            const eDate = new Date(event.date);
            return eDate >= now && eDate <= monthFromNow;
          });
          break;
      }
    }

    if (location && location !== 'all') {
      filtered = filtered.filter(event => 
        event.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    this.renderEvents(filtered);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Enhanced styling with gradients and icons
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };
    
    const backgrounds = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #6366f1, #4f46e5)'
    };
    
    notification.innerHTML = `
      <span style="margin-right: 0.5rem; font-size: 1.2rem;">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 1rem;
      color: white;
      font-weight: 600;
      z-index: 1000;
      background: ${backgrounds[type] || backgrounds.info};
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      transform: translateX(400px);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 400);
    }, 3000);
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.attendee = new AttendeeDashboard();
});