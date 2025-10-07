<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="user-info">
        <p><strong>Name:</strong> {{ user?.firstName }} {{ user?.lastName }}</p>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>Role:</strong> {{ user?.role }}</p>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="welcome-card">
        <h2>Welcome to your eCommerce Platform!</h2>
        <p v-if="user?.role === 'SELLER'">
          As a seller, you can manage your products and view your sales.
        </p>
        <p v-else>
          As a buyer, you can browse products and make purchases.
        </p>
      </div>

      <!-- Document Search Section -->
      <div class="search-section">
        <DocumentSearch />
      </div>
      
      <div class="features-grid">
        <div class="feature-card" v-if="user?.role === 'SELLER'">
          <h3>Manage Products</h3>
          <p>Add, edit, and manage your product listings</p>
          <button class="feature-btn">Coming Soon</button>
        </div>
        
        <div class="feature-card" v-if="user?.role === 'SELLER'">
          <h3>View Sales</h3>
          <p>Track your sales and revenue</p>
          <button class="feature-btn">Coming Soon</button>
        </div>
        
        <div class="feature-card" v-if="user?.role === 'BUYER'">
          <h3>Browse Products</h3>
          <p>Discover and search for products</p>
          <button class="feature-btn">Coming Soon</button>
        </div>
        
        <div class="feature-card" v-if="user?.role === 'BUYER'">
          <h3>My Orders</h3>
          <p>View your order history</p>
          <button class="feature-btn">Coming Soon</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import DocumentSearch from './DocumentSearch.vue'

export default {
  name: 'Dashboard',
  components: {
    DocumentSearch
  },
  setup() {
    const user = ref(null)
    const loading = ref(true)
    
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        user.value = response.data.user
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Fallback to stored user data
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          user.value = JSON.parse(storedUser)
        }
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      fetchUserProfile()
    })
    
    return {
      user,
      loading
    }
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #333;
  margin-bottom: 1rem;
}

.user-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.user-info p {
  margin: 0.5rem 0;
  color: #666;
}

.welcome-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.welcome-card h2 {
  color: #333;
  margin-bottom: 1rem;
}

.welcome-card p {
  color: #666;
  font-size: 1.1rem;
}

.search-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.feature-card h3 {
  color: #333;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #666;
  margin-bottom: 1.5rem;
}

.feature-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.feature-btn:hover {
  background: #218838;
}
</style>
