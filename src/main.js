import './style.css'

// =================================
// State Management
// =================================
const state = {
  workStartYear: 0,
  currentSalary: 0,
  bonusRate: 0,
  salaryIncreaseRate: 0,
  providentFundRate: 0,
  birthYear: 0,    // ปี พ.ศ. เกิด
  birthMonth: 1,   // เดือนเกิด (1-12)
  existingProvidentFund: 0,
  fundReturnRate: 1,
  retirementAge: 60,
  currentYear: new Date().getFullYear()  // ปี ค.ศ. ปัจจุบัน
}

const STORAGE_KEY = 'retirementCalcData_v3'

// =================================
// LocalStorage Functions
// =================================
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      Object.assign(state, parsedData)
      state.currentYear = new Date().getFullYear()
      return true
    }
    return false
  } catch (error) {
    console.error('Error loading data:', error)
    return false
  }
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing data:', error)
  }
}

// =================================
// Calculation Engine
// =================================
function calculateRetirement() {
  // แปลงปี พ.ศ. เป็น ค.ศ. แล้วคำนวณ
  const birthYearAD = state.birthYear - 543
  const workStartYearAD = state.workStartYear - 543
  const currentAge = state.currentYear - birthYearAD
  const yearsWorked = state.currentYear - workStartYearAD
  const yearsUntilRetirement = state.retirementAge - currentAge
  const totalWorkYears = yearsWorked + yearsUntilRetirement
  
  // ปีที่เกษียณ (ค.ศ.) และ เดือนที่เกษียณ (เดือนเกิด)
  const retirementYear = birthYearAD + state.retirementAge
  const retirementMonth = state.birthMonth

  const salaryIncreaseDecimal = state.salaryIncreaseRate / 100
  const providentFundDecimal = state.providentFundRate / 100
  const totalProvidentFundRate = providentFundDecimal * 2
  const fundReturnRateDecimal = state.fundReturnRate / 100

  const salaryAt60 = Math.round(
    state.currentSalary * Math.pow(1 + salaryIncreaseDecimal, yearsUntilRetirement)
  )

  // Calculate bonus by year
  const bonusByYear = []
  let previousYearSalary = state.currentSalary
  let currentYearSalary = state.currentSalary
  
  currentYearSalary *= (1 + salaryIncreaseDecimal)

  for (let year = 1; year <= yearsUntilRetirement; year++) {
    const bonus = Math.round(previousYearSalary * state.bonusRate)
    const isRetirementYear = year === yearsUntilRetirement
    
    bonusByYear.push({
      year: state.currentYear + year,
      salary: Math.round(currentYearSalary),
      baseSalary: Math.round(previousYearSalary),
      bonus: bonus,
      isRetirementYear: isRetirementYear
    })
    
    previousYearSalary = currentYearSalary
    currentYearSalary *= (1 + salaryIncreaseDecimal)
  }

  // Calculate provident fund
  let futureProvidentFund = 0
  let currentSalaryForPF = state.currentSalary

  for (let year = 0; year < yearsUntilRetirement; year++) {
    const isRetirementYear = year === yearsUntilRetirement - 1
    let monthsInYear = 12
    
    // ปีสุดท้ายก่อนเกษียณ คิดเฉพาะเดือนจนถึงเดือนเกษียณ
    if (isRetirementYear) {
      monthsInYear = retirementMonth
    }
    
    const yearlyContribution = currentSalaryForPF * monthsInYear * totalProvidentFundRate
    const yearsRemaining = yearsUntilRetirement - year
    const futureValue = yearlyContribution * Math.pow(1 + fundReturnRateDecimal, yearsRemaining)
    futureProvidentFund += futureValue
    currentSalaryForPF *= (1 + salaryIncreaseDecimal)
  }

  const existingFundAtRetirement = state.existingProvidentFund
  const totalProvidentFund = existingFundAtRetirement + futureProvidentFund

  // Calculate retirement benefit
  const retirement1 = (salaryAt60 * 400) / 30
  const retirement2 = (salaryAt60 * totalWorkYears) / 2
  const retirementBenefit = Math.max(retirement1, retirement2)

  const totalMoney = retirementBenefit + totalProvidentFund

  return {
    yearsWorked,
    yearsUntilRetirement,
    totalWorkYears,
    salaryAt60,
    bonusByYear,
    futureProvidentFund,
    existingFundAtRetirement,
    totalProvidentFund,
    retirement1,
    retirement2,
    retirementBenefit,
    totalMoney,
    currentAge,
    retirementYear,
    retirementMonth
  }
}

// =================================
// UI Rendering Functions
// =================================
function formatNumber(num) {
  return Math.round(num).toLocaleString('th-TH')
}

function renderBasicInfo(data) {
  const container = document.getElementById('basicInfoGrid')
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const infoCards = [
    { label: 'อายุปัจจุบัน', value: data.currentAge, unit: 'ปี', gradient: 'from-cyan-500 to-blue-500' },
    { label: 'ทำงานมาแล้ว', value: data.yearsWorked, unit: 'ปี', gradient: 'from-indigo-500 to-violet-500' },
    { label: 'เหลือถึงเกษียณ', value: data.yearsUntilRetirement, unit: 'ปี', gradient: 'from-violet-500 to-fuchsia-500' },
    { label: 'รวมอายุงาน', value: data.totalWorkYears, unit: 'ปี', gradient: 'from-emerald-500 to-teal-500' },
    { label: 'เงินเดือนตอนเกษียณ', value: formatNumber(data.salaryAt60), unit: 'บาท', gradient: 'from-amber-500 to-orange-500' },
    { label: 'เกษียณเดือน', value: monthNames[data.retirementMonth - 1], unit: data.retirementYear, gradient: 'from-rose-500 to-pink-500' }
  ]

  container.innerHTML = infoCards.map(card => `
    <div class="relative group">
      <div class="absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-xl opacity-0 group-hover:opacity-30 transition duration-500 blur"></div>
      <div class="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 transition-all duration-300">
        <p class="text-xs font-medium text-slate-400 mb-1">${card.label}</p>
        <p class="text-xl md:text-2xl font-bold text-white">${card.value}</p>
        <p class="text-xs text-slate-500 mt-0.5">${card.unit}</p>
      </div>
    </div>
  `).join('')
}

function renderStatsCards(data) {
  const container = document.getElementById('statsGrid')
  const stats = [
    {
      title: 'เงินกองทุนเดิม',
      value: formatNumber(data.existingFundAtRetirement),
      subtitle: 'รวมดอกเบี้ยแล้ว',
      gradient: 'from-indigo-500 to-violet-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>`
    },
    {
      title: 'เงินกองทุนใหม่',
      value: formatNumber(data.futureProvidentFund),
      subtitle: `${state.providentFundRate}% + ${state.providentFundRate}% + ${state.fundReturnRate}%`,
      gradient: 'from-fuchsia-500 to-pink-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
    },
    {
      title: 'เงินเกษียณอายุ',
      value: formatNumber(data.retirementBenefit),
      subtitle: data.retirement2 > data.retirement1 ? 'ใช้สูตรที่ 2' : 'ใช้สูตรที่ 1',
      gradient: 'from-rose-500 to-red-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`
    },
    {
      title: 'รวมเงินทั้งหมด',
      value: formatNumber(data.totalMoney),
      subtitle: 'เกษียณ + กองทุน',
      gradient: 'from-emerald-500 to-green-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
    }
  ]

  container.innerHTML = stats.map(stat => `
    <div class="relative group">
      <div class="absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-xl opacity-50 group-hover:opacity-70 transition duration-500 blur"></div>
      <div class="relative p-5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg">
        <div class="flex justify-between items-start mb-3">
          <div>
            <p class="text-xs font-medium opacity-80 mb-1">${stat.title}</p>
            <p class="text-lg md:text-xl font-bold">${stat.value} ฿</p>
          </div>
          <div class="opacity-60">${stat.icon}</div>
        </div>
        <p class="text-xs opacity-70">${stat.subtitle}</p>
      </div>
    </div>
  `).join('')
}

function renderBonusList(data) {
  const container = document.getElementById('bonusList')
  if (data.bonusByYear.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 py-8">ไม่มีข้อมูลโบนัส</p>'
    return
  }

  container.innerHTML = data.bonusByYear.map(item => `
    <div class="group flex items-center justify-between p-3 rounded-lg ${
      item.isRetirementYear 
        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
        : 'bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30'
    } transition-all duration-300">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-white">ปี พ.ศ. ${item.year + 543} </span>
          ${item.isRetirementYear 
            ? '<span class="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">เกษียณ</span>' 
            : ''}
        </div>
        <p class="text-xs text-slate-400 mt-0.5 truncate">เงินเดือน ${formatNumber(item.salary)} ฿ (ฐาน: ${formatNumber(item.baseSalary)} ฿)</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold ${item.isRetirementYear ? 'text-amber-400' : 'text-emerald-400'}">${formatNumber(item.bonus)} ฿</p>
        <p class="text-xs text-slate-500">${state.bonusRate} เท่า</p>
      </div>
    </div>
  `).join('')
}

function renderRetirementFormulas(data) {
  const container = document.getElementById('formulasList')
  const formula1Selected = data.retirement1 >= data.retirement2
  const formula2Selected = data.retirement2 > data.retirement1

  container.innerHTML = [
    {
      title: 'สูตรที่ 1: เงินเดือน × 400 ÷ 30',
      calculation: `${formatNumber(data.salaryAt60)} × 400 ÷ 30 = ${formatNumber(data.retirement1)} ฿`,
      selected: formula1Selected
    },
    {
      title: 'สูตรที่ 2: เงินเดือน × อายุงาน ÷ 2',
      calculation: `${formatNumber(data.salaryAt60)} × ${data.totalWorkYears} ÷ 2 = ${formatNumber(data.retirement2)} ฿`,
      selected: formula2Selected
    }
  ].map(formula => `
    <div class="p-4 rounded-xl ${
      formula.selected 
        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30' 
        : 'bg-slate-800/30 border border-slate-700/30'
    } transition-all duration-300">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium ${formula.selected ? 'text-emerald-400' : 'text-slate-300'}">${formula.title}</p>
        ${formula.selected ? '<span class="text-emerald-400">✓</span>' : ''}
      </div>
      <p class="text-sm font-mono text-slate-400">${formula.calculation}</p>
      ${formula.selected 
        ? '<p class="text-xs text-emerald-400 mt-2">ใช้สูตรนี้ (ให้ผลมากกว่า)</p>' 
        : ''}
    </div>
  `).join('')
}

function renderSummary(data) {
  document.getElementById('summaryValue').textContent = `${formatNumber(data.totalMoney)} ฿`
  
  const detailsContainer = document.getElementById('summaryDetails')
  detailsContainer.innerHTML = `
    <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
      <p class="text-sm text-slate-400 mb-1">เงินเกษียณอายุ</p>
      <p class="text-xl font-bold text-rose-400">${formatNumber(data.retirementBenefit)} ฿</p>
    </div>
    <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
      <p class="text-sm text-slate-400 mb-1">เงินกองทุนรวม</p>
      <p class="text-xl font-bold text-violet-400">${formatNumber(data.totalProvidentFund)} ฿</p>
    </div>
    <div class="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 md:col-span-2">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-slate-500">กองทุนเดิม:</span>
          <span class="text-slate-300 ml-1">${formatNumber(data.existingFundAtRetirement)} ฿</span>
        </div>
        <div>
          <span class="text-slate-500">กองทุนใหม่:</span>
          <span class="text-slate-300 ml-1">${formatNumber(data.futureProvidentFund)} ฿</span>
        </div>
      </div>
    </div>
  `
}

function updateUI() {
  const data = calculateRetirement()

  document.getElementById('resultsContainer').classList.remove('hidden')
  document.getElementById('emptyState').classList.add('hidden')

  renderBasicInfo(data)
  renderStatsCards(data)
  renderBonusList(data)
  renderRetirementFormulas(data)
  renderSummary(data)
}

// =================================
// Event Handlers
// =================================
function updateStateFromInputs() {
  state.workStartYear = Number(document.getElementById('workStartYear').value) || 0
  state.birthYear = Number(document.getElementById('birthYear').value) || 0
  state.birthMonth = Number(document.getElementById('birthMonth').value) || 1
  state.currentSalary = Number(document.getElementById('currentSalary').value) || 0
  state.bonusRate = Number(document.getElementById('bonusRate').value) || 0
  state.salaryIncreaseRate = Number(document.getElementById('salaryIncreaseRate').value) || 0
  state.providentFundRate = Number(document.getElementById('providentFundRate').value) || 0
  state.fundReturnRate = Number(document.getElementById('fundReturnRate').value) || 1
  state.existingProvidentFund = Number(document.getElementById('existingProvidentFund').value) || 0

  saveToLocalStorage()
}

function loadStateToInputs() {
  document.getElementById('workStartYear').value = state.workStartYear || ''
  document.getElementById('birthYear').value = state.birthYear || ''
  document.getElementById('birthMonth').value = state.birthMonth || 1
  document.getElementById('currentSalary').value = state.currentSalary || ''
  document.getElementById('bonusRate').value = state.bonusRate || ''
  document.getElementById('salaryIncreaseRate').value = state.salaryIncreaseRate || ''
  document.getElementById('providentFundRate').value = state.providentFundRate || ''
  document.getElementById('fundReturnRate').value = state.fundReturnRate || 1
  document.getElementById('existingProvidentFund').value = state.existingProvidentFund || ''
}

function handleCalculate() {
  updateStateFromInputs()

  if (state.workStartYear === 0 || state.birthYear === 0 || state.currentSalary === 0) {
    alert('กรุณากรอกข้อมูลที่จำเป็น: ปีเริ่มงาน, ปี พ.ศ. เกิด, และเงินเดือน')
    return
  }

  // ตรวจสอบปีเริ่มงาน (แปลงพ.ศ. เป็นค.ศ. ก่อนเปรียบเทียบ)
  const workStartYearAD = state.workStartYear - 543
  if (workStartYearAD > state.currentYear) {
    alert('ปีเริ่มงานต้องไม่มากกว่าปีปัจจุบัน')
    return
  }

  // คำนวณอายุปัจจุบันเพื่อตรวจสอบ
  const currentAge = state.currentYear - (state.birthYear - 543)
  if (currentAge >= state.retirementAge) {
    alert('อายุปัจจุบันต้องน้อยกว่าอายุเกษียณ (60 ปี)')
    return
  }

  updateUI()
}

// Modal Functions
function showModal() {
  const modal = document.getElementById('confirmModal')
  const content = document.getElementById('modalContent')
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  
  requestAnimationFrame(() => {
    content.classList.remove('scale-95', 'opacity-0')
    content.classList.add('scale-100', 'opacity-100')
  })
}

function hideModal() {
  const modal = document.getElementById('confirmModal')
  const content = document.getElementById('modalContent')
  
  content.classList.remove('scale-100', 'opacity-100')
  content.classList.add('scale-95', 'opacity-0')
  
  setTimeout(() => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }, 300)
}

function handleClear() {
  showModal()
}

function confirmClear() {
  Object.keys(state).forEach(key => {
    if (key !== 'retirementAge' && key !== 'currentYear') {
      state[key] = key === 'fundReturnRate' ? 1 : 0
    }
  })

  clearLocalStorage()
  loadStateToInputs()

  document.getElementById('resultsContainer').classList.add('hidden')
  document.getElementById('emptyState').classList.remove('hidden')

  hideModal()
}

// Auto-save
function setupAutoSave() {
  const inputs = [
    'workStartYear', 'currentAge', 'currentSalary', 'bonusRate',
    'salaryIncreaseRate', 'providentFundRate', 'fundReturnRate', 'existingProvidentFund'
  ]

  inputs.forEach(id => {
    const input = document.getElementById(id)
    if (input) {
      input.addEventListener('input', updateStateFromInputs)
    }
  })
}

// =================================
// Initialization
// =================================
function init() {
  const hasData = loadFromLocalStorage()

  if (hasData) {
    loadStateToInputs()
    if (state.workStartYear > 0 && state.currentAge > 0 && state.currentSalary > 0) {
      updateUI()
    }
  }

  // Event Listeners
  document.getElementById('calculateBtn').addEventListener('click', handleCalculate)
  document.getElementById('clearBtn').addEventListener('click', handleClear)
  document.getElementById('confirmYes').addEventListener('click', confirmClear)
  document.getElementById('confirmNo').addEventListener('click', hideModal)

  setupAutoSave()

  // Close modal on backdrop click
  document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') {
      hideModal()
    }
  })
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
