<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'



const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_URL
console.log("API_BASE_URL =", API_BASE_URL)



// durum değişkenleri
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

  try {
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
  } catch (err) {
    console.error(err)
    alert('Sunucuya bağlanılamadı')
  }
}


async function doLogin(e) {
  e.preventDefault()
  if (!emailLogin.value || !passwordLogin.value) {
    emptyFields.value = true
    return
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailLogin.value, password: passwordLogin.value })
    })

    const data = await res.json()
    if (res.ok) {
  localStorage.setItem("userId", data.user.id);
    }


    if (!res.ok) {
      alert(data.error || 'Giriş başarısız')
      return
    }

    alert(data.message || 'Giriş başarılı')

    // önce router push
    router.push('/dashboard')

    // eğer router çalışmazsa kesin fallback
    setTimeout(() => {
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
        window.location.href = '/dashboard'
      }
    }, 300)

  } catch (err) {
    console.error(err)
    alert('Sunucuya bağlanılamadı')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="background"></div>

    <div class="form-container">
      
      <div v-if="!registerActive" class="card login" :class="{ error: emptyFields }">
        <h1>Sign In</h1>
        <form @submit="doLogin">
          <input v-model="emailLogin" type="email" placeholder="Email" required />
          <input v-model="passwordLogin" type="password" placeholder="Password" required />
          <input type="submit" value="Login" class="btn" />
          <p>
            Don't have an account?
            <a href="#" @click.prevent="registerActive = true; emptyFields = false">Sign up here</a>
          </p>
          <p><a href="#">Forgot your password?</a></p>
        </form>
      </div>

      
      <div v-else class="card register" :class="{ error: emptyFields }">
        <h1>Sign Up</h1>
        <form @submit="doRegister">
          <input v-model="emailReg" type="email" placeholder="Email" required />
          <input v-model="passwordReg" type="password" placeholder="Password" required />
          <input v-model="confirmReg" type="password" placeholder="Confirm Password" required />
          <input type="submit" value="Register" class="btn" />
          <p>
            Already have an account?
            <a href="#" @click.prevent="registerActive = false; emptyFields = false">Sign in here</a>
          </p>
        </form>
      </div>
    </div>

    <div class="floating-symbols">
      <span style="--i:1;">$</span>
      <span style="--i:2;">€</span>
      <span style="--i:3;">£</span>
      <span style="--i:4;">¥</span>
      <span style="--i:5;">₿</span>
      <span style="--i:6;">$</span>
      <span style="--i:7;">€</span>
      <span style="--i:8;">£</span>
      <span style="--i:9;">¥</span>
      <span style="--i:10;">₿</span>
      <span style="--i:11;">$</span>
      <span style="--i:12;">€</span>
      <span style="--i:13;">£</span>
      <span style="--i:14;">¥</span>
      <span style="--i:15;">₿</span>
      <span style="--i:16;">$</span>
      <span style="--i:17;">€</span>
      <span style="--i:18;">£</span>
      <span style="--i:19;">¥</span>
    </div>
  </div>
</template>
