<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_URL

const registerActive = ref(false)
const emptyFields = ref(false)

const emailLogin = ref('')
const passwordLogin = ref('')

const emailReg = ref('')
const passwordReg = ref('')
const confirmReg = ref('')

async function doRegister(e) {
  e.preventDefault()
  if (!emailReg.value || !passwordReg.value || !confirmReg.value) {
    emptyFields.value = true
    return
  }
  if (passwordReg.value !== confirmReg.value) {
    alert('Şifreler eşleşmiyor!')
    return
  }

  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailReg.value, password: passwordReg.value })
  })
  const data = await res.json()

  if (res.ok) {
    alert(data.message)
    registerActive.value = false
  } else {
    alert(data.error)
  }
}

async function doLogin(e) {
  e.preventDefault()
  if (!emailLogin.value || !passwordLogin.value) {
    emptyFields.value = true
    return
  }

  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailLogin.value, password: passwordLogin.value })
  })

  const data = await res.json()

  if (!res.ok) {
    alert(data.error || 'Giriş başarısız')
    return
  }

  localStorage.setItem('userId', data.user.id)
  router.push('/dashboard')
}
</script>

<template>
  <div class="login-page">
    <div class="background"></div>

    <div class="form-container">
      <div v-if="!registerActive" class="card">
        <h1>Sign In</h1>
        <form @submit="doLogin">
          <input v-model="emailLogin" type="email" placeholder="Email" />
          <input v-model="passwordLogin" type="password" placeholder="Password" />
          <input type="submit" value="Login" class="btn" />
          <p>
            Don't have an account?
            <a href="#" @click.prevent="registerActive = true">Sign up here</a>
          </p>
        </form>
      </div>

      <div v-else class="card">
        <h1>Sign Up</h1>
        <form @submit="doRegister">
          <input v-model="emailReg" type="email" placeholder="Email" />
          <input v-model="passwordReg" type="password" placeholder="Password" />
          <input v-model="confirmReg" type="password" placeholder="Confirm Password" />
          <input type="submit" value="Register" class="btn" />
          <p>
            Already have an account?
            <a href="#" @click.prevent="registerActive = false">Sign in here</a>
          </p>
        </form>
      </div>
    </div>

    <!-- Semboller -->
    <div class="floating-symbols">
  <span
    v-for="n in 60"
    :key="n"
    :style="`
      --x: ${(n % 20) * 5}vw;
      --delay: ${-n * 0.4}s;
      --speed: ${10 + (n % 6)}s;
    `"
  >
    {{ ['$', '€', '£', '¥', '₿'][n % 5] }}
  </span>
</div>


  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: #0f172a;
}

/* FORM */
.form-container {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.card {
  background: rgba(255,255,255,0.95);
  padding: 2rem;
  border-radius: 12px;
  width: 320px;
}

/* SEMBOLLER */
.floating-symbols {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
}

.floating-symbols span {
  position: absolute;
  top: -10%;
  left: var(--x);
  font-size: 24px;
  color: rgba(255,255,255,0.15);
  animation: fall linear infinite;
  animation-duration: var(--speed);
}

@keyframes fall {
  from {
    transform: translateY(-10vh);
  }
  to {
    transform: translateY(110vh);
  }
}
</style>
