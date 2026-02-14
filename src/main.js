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
  currentAge: 0,
  existingProvidentFund: 0,
  fundReturnRate: 1,
  retirementAge: 60,
  currentYear: new Date().getFullYear()
}

const STORAGE_KEY = 'retirementCalcData_v2'

// =================================
// LocalStorage Functions
// =================================
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('✅ บันทึกข้อมูลสำเร็จ')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error)
  }
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      Object.assign(state, parsedData)
      state.currentYear = new Date().getFullYear()
      console.log('✅ โหลดข้อมูลสำเร็จ')
      return true
    }
    return false
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อมูล:', error)
    return false
  }
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ เคลียร์ข้อมูลสำเร็จ')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเคลียร์ข้อมูล:', error)
  }
}

// =================================
// Calculation Engine
// =================================
function calculateRetirement() {
  const yearsWorked = state.currentYear - state.workStartYear
  const yearsUntilRetirement = state.retirementAge - state.currentAge
  const totalWorkYears = yearsWorked + yearsUntilRetirement

  const salaryIncreaseDecimal = state.salaryIncreaseRate / 100
  const providentFundDecimal = state.providentFundRate / 100
  const totalProvidentFundRate = providentFundDecimal * 2
  const fundReturnRateDecimal = state.fundReturnRate / 100

  const salaryAt60 = Math.round(
    state.currentSalary * Math.pow(1 + salaryIncreaseDecimal, yearsUntilRetirement)
  )

  // คำนวณโบนัสแต่ละปี
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

  // คำนวณกองทุนสำรองเลี้ยงชีพ
  let futureProvidentFund = 0
  let currentSalaryForPF = state.currentSalary

  for (let year = 0; year < yearsUntilRetirement; year++) {
    const yearlyContribution = currentSalaryForPF * 12 * totalProvidentFundRate
    const yearsRemaining = yearsUntilRetirement - year
    const futureValue = yearlyContribution * Math.pow(1 + fundReturnRateDecimal, yearsRemaining)
    futureProvidentFund += futureValue
    currentSalaryForPF *= (1 + salaryIncreaseDecimal)
  }

  const existingFundAtRetirement = state.existingProvidentFund
  const totalProvidentFund = existingFundAtRetirement + futureProvidentFund

  // คำนวณเงินเกษียณอายุ
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
    totalMoney
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
  const infoCards = [
    { label: 'ทำงานมาแล้ว', value: data.yearsWorked, unit: 'ปี', color: 'blue' },
    { label: 'เหลือจนเกษียณ', value: data.yearsUntilRetirement, unit: 'ปี', color: 'orange' },
    { label: 'รวมอายุงาน', value: data.totalWorkYears, unit: 'ปี', color: 'emerald' },
    { label: 'เงินเดือนตอนเกษียณ', value: formatNumber(data.salaryAt60), unit: 'บาท', color: 'purple' }
  ]

  container.innerHTML = infoCards.map(card => `
    <div class="group p-5 rounded-2xl bg-gradient-to-br ${
      card.color === 'blue' ? 'from-blue-50 to-indigo-50 border-blue-100' :
      card.color === 'orange' ? 'from-orange-50 to-amber-50 border-orange-100' :
      card.color === 'emerald' ? 'from-emerald-50 to-teal-50 border-emerald-100' :
      'from-purple-50 to-pink-50 border-purple-100'
    } border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <p class="text-xs font-semibold uppercase tracking-wider ${
        card.color === 'blue' ? 'text-blue-600' :
        card.color === 'orange' ? 'text-orange-600' :
        card.color === 'emerald' ? 'text-emerald-600' :
        'text-purple-600'
      } mb-2">${card.label}</p>
      <p class="text-2xl md:text-3xl font-extrabold text-slate-800">${card.value}</p>
      <p class="text-sm text-slate-500 mt-1">${card.unit}</p>
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
      gradient: 'from-indigo-500 to-primary-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>`
    },
    {
      title: 'เงินกองทุนใหม่',
      value: formatNumber(data.futureProvidentFund),
      subtitle: `${state.providentFundRate}% + ${state.providentFundRate}% + ผลตอบแทน ${state.fundReturnRate}%`,
      gradient: 'from-violet-500 to-purple-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
    },
    {
      title: 'เงินเกษียณอายุ',
      value: formatNumber(data.retirementBenefit),
      subtitle: data.retirement2 > data.retirement1 ? 'ใช้สูตรที่ 2' : 'ใช้สูตรที่ 1',
      gradient: 'from-rose-500 to-red-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`
    },
    {
      title: 'รวมเงินทั้งหมด',
      value: formatNumber(data.totalMoney),
      subtitle: 'เกษียณอายุ + กองทุนรวม',
      gradient: 'from-emerald-500 to-green-600',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
    }
  ]

  container.innerHTML = stats.map(stat => `
    <div class="group p-5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-${stat.gradient.split('-')[1]}-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div class="flex justify-between items-start mb-3">
        <div>
          <p class="text-sm font-medium opacity-90">${stat.title}</p>
          <p class="text-xl md:text-2xl font-bold mt-1">${stat.value} ฿</p>
        </div>
        <div class="opacity-80">${stat.icon}</div>
      </div>
      <p class="text-xs opacity-70">${stat.subtitle}</p>
    </div>
  `).join('')
}

function renderBonusList(data) {
  const container = document.getElementById('bonusList')
  if (data.bonusByYear.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-400 py-8">ไม่มีข้อมูลโบนัส</p>'
    return
  }

  container.innerHTML = data.bonusByYear.map(item => `
    <div class="group flex items-center justify-between p-4 rounded-xl ${
      item.isRetirementYear 
        ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 shadow-md' 
        : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
    } transition-all duration-200 hover:translate-x-1">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-slate-800">ปี ${item.year}</span>
          ${item.isRetirementYear 
            ? '<span class="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">🎉 ปีเกษียณ</span>' 
            : ''}
        </div>
        <p class="text-sm text-slate-500 mt-1">เงินเดือน ${formatNumber(item.salary)} ฿ (ฐาน: ${formatNumber(item.baseSalary)} ฿)</p>
      </div>
      <div class="text-right">
        <p class="font-bold ${item.isRetirementYear ? 'text-amber-700' : 'text-emerald-600'}">${formatNumber(item.bonus)} ฿</p>
        <p class="text-xs text-slate-400">${state.bonusRate} เท่า</p>
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
    <div class="p-5 rounded-xl ${
      formula.selected 
        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow-md' 
        : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
    } transition-all duration-200">
      <p class="font-semibold ${formula.selected ? 'text-emerald-800' : 'text-slate-700'} mb-2 flex items-center gap-2">
        ${formula.title}
        ${formula.selected ? '<span class="text-lg">⭐</span>' : ''}
      </p>
      <p class="text-sm font-mono ${formula.selected ? 'text-emerald-700' : 'text-slate-600'} mb-2">
        ${formula.calculation}
      </p>
      ${formula.selected 
        ? '<p class="text-sm text-emerald-600 font-medium flex items-center gap-1">✅ ใช้สูตรนี้เพราะให้ผลมากกว่า</p>' 
        : ''}
    </div>
  `).join('')
}

function renderSummary(data) {
  document.getElementById('summaryValue').textContent = `${formatNumber(data.totalMoney)} ฿`
  
  const detailsContainer = document.getElementById('summaryDetails')
  detailsContainer.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
      <div class="p-4 bg-white/60 rounded-xl">
        <p class="text-sm text-slate-500 mb-1">เงินเกษียณอายุ</p>
        <p class="text-xl font-bold text-rose-600">${formatNumber(data.retirementBenefit)} ฿</p>
      </div>
      <div class="p-4 bg-white/60 rounded-xl">
        <p class="text-sm text-slate-500 mb-1">เงินกองทุนรวม</p>
        <p class="text-xl font-bold text-primary-600">${formatNumber(data.totalProvidentFund)} ฿</p>
      </div>
    </div>
    <div class="mt-4 text-sm text-slate-500 space-y-1">
      <p>เงินกองทุนเดิม: ${formatNumber(data.existingFundAtRetirement)} ฿</p>
      <p>เงินกองทุนใหม่: ${formatNumber(data.futureProvidentFund)} ฿</p>
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
  state.currentAge = Number(document.getElementById('currentAge').value) || 0
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
  document.getElementById('currentAge').value = state.currentAge || ''
  document.getElementById('currentSalary').value = state.currentSalary || ''
  document.getElementById('bonusRate').value = state.bonusRate || ''
  document.getElementById('salaryIncreaseRate').value = state.salaryIncreaseRate || ''
  document.getElementById('providentFundRate').value = state.providentFundRate || ''
  document.getElementById('fundReturnRate').value = state.fundReturnRate || 1
  document.getElementById('existingProvidentFund').value = state.existingProvidentFund || ''
}

function handleCalculate() {
  updateStateFromInputs()

  if (state.workStartYear === 0 || state.currentAge === 0 || state.currentSalary === 0) {
    alert('⚠️ กรุณากรอกข้อมูลที่จำเป็น: ปีเริ่มงาน, อายุปัจจุบัน, และเงินเดือน')
    return
  }

  if (state.workStartYear > state.currentYear) {
    alert('⚠️ ปีเริ่มงานต้องไม่มากกว่าปีปัจจุบัน')
    return
  }

  if (state.currentAge >= state.retirementAge) {
    alert('⚠️ อายุปัจจุบันต้องน้อยกว่าอายุเกษียณ (60 ปี)')
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
    'workStartYear',
    'currentAge',
    'currentSalary',
    'bonusRate',
    'salaryIncreaseRate',
    'providentFundRate',
    'fundReturnRate',
    'existingProvidentFund'
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
  console.log('🚀 Initializing Retirement Calculator...')
  console.log('📅 ปีปัจจุบัน:', state.currentYear)

  const hasData = loadFromLocalStorage()

  if (hasData) {
    console.log('📦 พบข้อมูลที่บันทึกไว้')
    loadStateToInputs()
    if (state.workStartYear > 0 && state.currentAge > 0 && state.currentSalary > 0) {
      updateUI()
    }
  } else {
    console.log('📝 ไม่พบข้อมูลที่บันทึกไว้')
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

  console.log('✅ Initialization complete!')
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
