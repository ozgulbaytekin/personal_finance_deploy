<script setup>
import { ref, onMounted } from 'vue'
const API_BASE_URL = import.meta.env.VITE_API_URL


const totalBalance = ref(0)
const assets = ref([])
const expenses = ref([])

const showExpenseForm = ref(false)

// asset inputs
const newAssetName = ref('')
const newAssetAmount = ref('')

// expense inputs
const newCategory = ref('')
const newAmount = ref('')
const newDate = ref('')
const newFrequency = ref('')
const newDescription = ref('')
const newAssetId = ref('')


// --- ASSET EKLE ---
async function addAsset() {
  const amount = parseFloat(newAssetAmount.value)
  if (!newAssetName.value || isNaN(amount)) return

  const userId = localStorage.getItem("userId")
  if (!userId) return alert("Giriş yapmadınız")

const res = await fetch(`${API_BASE_URL}/api/add-asset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: Number(userId), name: newAssetName.value, amount })
  })

  const data = await res.json()
  if (!res.ok) return alert(data.error)

  assets.value.push({ id: data.id, name: newAssetName.value, amount })
  totalBalance.value += amount

  newAssetName.value = ''
  newAssetAmount.value = ''
}

// --- EXPENSE EKLE ---
async function addExpense() {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Giriş yapmadınız");

  const amount = parseFloat(newAmount.value);

  if (
    !newCategory.value ||
    !newAssetId.value ||
    !newDate.value ||
    !newFrequency.value ||
    isNaN(amount)
  ) {
    return alert("Tüm zorunlu alanları doldurun");
  }

const response = await fetch(`${API_BASE_URL}/api/add-expense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: Number(userId),
      asset_id: Number(newAssetId.value),
      category: newCategory.value,
      amount,
      date: newDate.value,
      frequency: newFrequency.value,
      description: newDescription.value || null
    })
  });

  const data = await response.json();
  if (!response.ok) return alert(data.error);

  await loadAssets();
  await loadExpenses();

  // form reset (iyi pratik)
  newCategory.value = "";
  newAmount.value = "";
  newDate.value = "";
  newFrequency.value = "";
  newAssetId.value = "";
  newDescription.value = "";

  showExpenseForm.value = false;
}



// --- VARLIK SİL ---
async function deleteAsset(id) {
  const userId = localStorage.getItem("userId")
  if (!userId) return

  const res = await fetch(
    `${API_BASE_URL}/api/delete-asset/${id}/${userId}`,
    { method: "DELETE" }
  )

  if (!res.ok) {
    const err = await res.json()
    return alert(err.error || "Silme işlemi başarısız")
  }

  assets.value = assets.value.filter(a => a.id !== id)
  totalBalance.value = assets.value.reduce((s, a) => s + a.amount, 0)
}


// --- LOAD ---
async function loadAssets() {
  const userId = localStorage.getItem("userId")
  if (!userId) return

const res = await fetch(`${API_BASE_URL}/api/assets/${userId}`)
  assets.value = await res.json()
  totalBalance.value = assets.value.reduce((s, a) => s + a.amount, 0)
}

async function loadExpenses() {
  const userId = localStorage.getItem("userId")
  if (!userId) return

const res = await fetch(`${API_BASE_URL}/api/expenses/${userId}`)
  const data = await res.json()

  expenses.value = data.map(e => ({
    id: e.id,
    kategori: e.category,
    tutar: e.amount,
    tarih: e.date,
    siklik: e.frequency,
    kaynak: e.asset_name,
    aciklama: e.description
  }))
}

onMounted(() => {
  loadAssets()
  loadExpenses()
})
</script>

<template>
  <div class="dashboard">
    <h1>SANAL CÜZDANIM</h1>

    <div class="balance-card">
      <h2>Toplam Varlık</h2>
      <p class="amount">{{ totalBalance.toLocaleString() }} ₺</p>
    </div>

    <div class="asset-form">
      <h3>Yeni Varlık Ekle</h3>
      <input v-model="newAssetName" placeholder="Varlık Adı" />
      <input v-model="newAssetAmount" type="number" placeholder="Tutar" />
      <button @click="addAsset">Ekle</button>
    </div>

    <table class="styled-table">
      <thead>
        <tr>
          <th>Ad</th>
          <th>Tutar</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in assets" :key="a.id">
          <td>{{ a.name }}</td>
          <td>{{ a.amount.toLocaleString() }} ₺</td>
          <td><button @click="deleteAsset(a.id)">Sil</button></td>
        </tr>
      </tbody>
    </table>

    <button class="expense-toggle-btn" @click="showExpenseForm = !showExpenseForm">
      Yeni Harcama Ekle
    </button>

    <div v-if="showExpenseForm" class="expense-form">
      <select v-model="newCategory">
        <option disabled value="">Kategori</option>
        <option>Gıda</option>
        <option>Temizlik</option>
        <option>Ulaşım</option>
        <option>Sağlık</option>
        <option>Eğlence</option>
        <option>Eğitim</option>
        <option>Genel Market</option>
        <option>Kozmetik</option>
        <option>Giysi</option>
        <option>Diğer</option>
      </select>

      <input type="number" v-model="newAmount" placeholder="Tutar" />
      <input type="date" v-model="newDate" />

      <select v-model="newFrequency">
        <option disabled value="">Sıklık</option>
        <option>Tek seferlik</option>
        <option>Günde bir</option>
        <option>Haftada bir</option>
        <option>Ayda bir</option>
      </select>

    <select v-model="newAssetId">
  <option disabled value="">Kaynak</option>
  <option v-for="a in assets" :key="a.id" :value="a.id">
    {{ a.name }}
  </option>
</select>




      <input v-model="newDescription" placeholder="Açıklama" />
      <button @click="addExpense">Kaydet</button>
    </div>

    <table class="styled-table" style="margin-top:2rem">
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Tutar</th>
          <th>Tarih</th>
          <th>Sıklık</th>
          <th>Kaynak</th>
          <th>Açıklama</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in expenses" :key="e.id">
          <td>{{ e.kategori }}</td>
          <td>{{ e.tutar.toLocaleString() }} ₺</td>
          <td>{{ e.tarih }}</td>
          <td>{{ e.siklik }}</td>
          <td>{{ e.kaynak }}</td>
          <td>{{ e.aciklama }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
