<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            class="form-input"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <p class="auth-link">
          Don't have an account? 
          <router-link to="/register">Register here</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    
    const form = reactive({
      email: '',
      password: ''
    })
    
    const handleLogin = async () => {
      loading.value = true
      
      try {
        const response = await axios.post('/api/auth/login', form)
        
        // Store token and user data
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Redirect to dashboard
        router.push('/dashboard')
      } catch (error) {
        alert(error.response?.data?.error || 'Login failed')
      } finally {
        loading.value = false
      }
    }
    
    return {
      form,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
  margin-top: 1rem;
}

.auth-link a {
  color: #007bff;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>
