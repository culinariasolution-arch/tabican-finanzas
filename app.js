const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentFilter = 'todos';

function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  render();
}

function getData() {
  return JSON.parse(localStorage.getItem('tabian_transactions') || '[]');
}

function saveData(data) {
  localStorage.setItem('tabian_transactions', JSON.stringify(data));
}

function fmtMoney(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function updateMonthLabel() {
  document.getElementById('month-label').textContent = MESES[currentMonth] + ' ' + currentYear;
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  updateMonthLabel();
  render();
}

function render() {
  const all = getData();

  
const monthTxs = all.filter(tx => {
    const d = new Date(tx.date + 'T12:00:00');
    const enMes = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    const enFiltro = currentFilter === 'todos' || tx.type === currentFilter;
    return enMes && enFiltro;
  });


  const totalIn = monthTxs.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
  const totalOut = monthTxs.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
  const balance = totalIn - totalOut;

  document.getElementById('total-ingresos').textContent = fmtMoney(totalIn);
  document.getElementById('total-gastos').textContent = fmtMoney(totalOut);

  const balEl = document.getElementById('balance');
  balEl.textContent = (balance >= 0 ? '+' : '') + fmtMoney(balance);
  balEl.className = 'amount ' + (balance >= 0 ? 'balance-positive' : 'balance-negative');

  const sorted = [...monthTxs].sort((a, b) => b.date.localeCompare(a.date));
  const list = document.getElementById('tx-list');

  if (sorted.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Sin movimientos este mes</p>';
    return;
  }

  list.innerHTML = sorted.map(tx => `
    <div class="tx-item">
      <div class="tx-info">
        <div class="tx-concept">${tx.concept}</div>
        <div class="tx-meta">${fmtDate(tx.date)}</div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === 'ingreso' ? '+' : '-'}${fmtMoney(tx.amount)}</div>
      <button class="tx-delete" onclick="deleteTransaction('${tx.id}')">🗑</button>
    </div>
  `).join('');
}

function deleteTransaction(id) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  const data = getData().filter(t => t.id !== id);
  saveData(data);
  render();
}

function openModal(type) {
  document.getElementById('modal-title').textContent = type === 'ingreso' ? '↑ INGRESO' : '↓ GASTO';
  document.getElementById('modal').classList.add('open');
  document.getElementById('btn-submit').dataset.type = type;

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  document.getElementById('f-date').value = y + '-' + m + '-' + d;

  document.getElementById('f-amount').value = '';
  document.getElementById('f-concept').value = '';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

function saveTransaction() {
  const type = document.getElementById('btn-submit').dataset.type;
  const amount = parseFloat(document.getElementById('f-amount').value);
  const concept = document.getElementById('f-concept').value.trim();
  const date = document.getElementById('f-date').value;

  if (!amount || amount <= 0) { alert('Introduce un importe válido'); return; }
  if (!concept) { alert('Introduce un concepto'); return; }

  const tx = {
    id: Date.now().toString(),
    type: type,
    amount: amount,
    concept: concept,
    date: date
  };

  const data = getData();
  data.push(tx);
  saveData(data);

  const d = new Date(date + 'T12:00:00');
  currentMonth = d.getMonth();
  currentYear = d.getFullYear();
  updateMonthLabel();

  closeModal();
  render();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

updateMonthLabel();
render();

