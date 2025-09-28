<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h2>eCommerce Platform</h2>
      </div>
      <div class="nav-links" v-if="isAuthenticated">
        <span>Welcome, {{ user?.firstName }}!</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    
    const isAuthenticated = computed(() => {
      return !!localStorage.getItem('token')
    })
    
    const user = computed(() => {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    })
    
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    
    return {
      isAuthenticated,
      user,
      logout
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #fff;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h2 {
  color: #333;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
