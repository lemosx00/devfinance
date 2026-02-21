const storage = {
    get: () => JSON.parse(localStorage.getItem("devf:trans")) || [],
    set: (t) => localStorage.setItem("devf:trans", JSON.stringify(t))
};
const catStorage = {
    get: () => JSON.parse(localStorage.getItem("devf:cats")) || ["Trabalho", "Alimentação", "Lazer", "Meta"],
    set: (c) => localStorage.setItem("devf:cats", JSON.stringify(c))
};
const goalStorage = {
    get: () => JSON.parse(localStorage.getItem("devf:goal")) || { title: "Reserva", value: 1000, deadline: "" },
    set: (g) => localStorage.setItem("devf:goal", JSON.stringify(g))
};
const limitStorage = {
    get: () => JSON.parse(localStorage.getItem("devf:limits")) || { "Alimentação": 500 }, 
    set: (l) => localStorage.setItem("devf:limits", JSON.stringify(l))
};

let transactions = storage.get();
let categories = catStorage.get();
let currentGoal = goalStorage.get();
let currentFilter = 'all';

const App = {
    update() {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const total = income - expense;

        document.getElementById('incomeDisplay').innerText = `R$ ${income.toFixed(2)}`;
        document.getElementById('expenseDisplay').innerText = `R$ ${expense.toFixed(2)}`;
        document.getElementById('totalDisplay').innerText = `R$ ${total.toFixed(2)}`;
        
        const totalCard = document.getElementById('totalCard');
        totalCard.classList.toggle('danger-alert', total < 0);

        this.updateGoal();
        this.renderTable();
        this.updateChart(income, expense);
        this.populateCategories();
        this.updateGreeting();
    },

    updateGreeting() {
        let name = localStorage.getItem("devf:name") || prompt("Qual seu nome?");
        if (name) localStorage.setItem("devf:name", name);
        const hour = new Date().getHours();
        const msg = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
        document.getElementById('greetingText').innerText = `${msg}, ${name || 'Visitante'}!`;
    },

    populateCategories() {
        const select = document.getElementById('categorySelect');
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    updateGoal() {
        const progress = transactions.filter(t => t.category === "Meta" && t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const percent = Math.min((progress / currentGoal.value) * 100, 100);
        document.getElementById('progressFill').style.width = `${percent}%`;
        
        let info = "";
        if (currentGoal.deadline) {
            const days = Math.ceil((new Date(currentGoal.deadline) - new Date()) / (1000*60*60*24));
            if (days > 0 && percent < 100) info = `<br><small>Faltam ${days} dias. Guarde R$ ${((currentGoal.value - progress)/days).toFixed(2)}/dia.</small>`;
        }
        document.getElementById('goalTitleDisplay').innerText = currentGoal.title;
        document.getElementById('goalText').innerHTML = `Progresso: ${percent.toFixed(1)}% (R$ ${progress.toFixed(2)} de ${currentGoal.value}) ${info}`;
    },

    renderTable() {
        const tbody = document.getElementById('transaction-body');
        const limits = limitStorage.get();
        tbody.innerHTML = '';
        transactions.filter(t => currentFilter === 'all' || t.type === currentFilter).forEach((t, i) => {
            const spent = transactions.filter(item => item.category === t.category && item.type === 'expense').reduce((a, b) => a + b.amount, 0);
            const exceeded = limits[t.category] && spent > limits[t.category];
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${t.description}</td><td class="${t.type}">${t.type==='expense'?'-':''} R$ ${t.amount.toFixed(2)}</td>
                <td><span class="tag-cat ${exceeded?'tag-limit-exceeded':''}">${t.category}</span></td>
                <td>${t.type==='income'?'🟢':'🔴'}</td><td><button onclick="removeTransaction(${i})">🗑️</button></td>`;
            tbody.appendChild(tr);
        });
    },

    updateChart(inc, exp) {
        const ctx = document.getElementById('financeChart').getContext('2d');
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Entradas', 'Saídas'], datasets: [{ data: [inc, exp], backgroundColor: ['#2d7a34', '#e92929'] }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
};

function handleFormSubmit(e) {
    e.preventDefault();
    transactions.push({ description: document.getElementById('description').value, amount: parseFloat(document.getElementById('amount').value), category: document.getElementById('categorySelect').value, type: document.getElementById('type').value, date: new Date().toISOString() });
    storage.set(transactions); App.update(); toggleModal(); e.target.reset();
}

function handleGoalUpdate(e) {
    e.preventDefault();
    currentGoal = { title: document.getElementById('newGoalTitle').value, value: parseFloat(document.getElementById('newGoalValue').value), deadline: document.getElementById('newGoalDate').value };
    goalStorage.set(currentGoal); App.update(); toggleGoalModal();
}

function addNewCategory() {
    const n = prompt("Nova categoria:");
    if (n && !categories.includes(n)) { categories.push(n); catStorage.set(categories); App.populateCategories(); }
}

function removeTransaction(i) { transactions.splice(i, 1); storage.set(transactions); App.update(); }
function toggleModal() { document.getElementById('modal').classList.toggle('active'); }
function toggleGoalModal() { document.getElementById('goal-modal').classList.toggle('active'); }
function toggleTheme() { const t = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.body.setAttribute('data-theme', t); localStorage.setItem('theme', t); }
function filterTransactions(t, b) { currentFilter = t; document.querySelectorAll('.btn-filter').forEach(x => x.classList.remove('active')); b.classList.add('active'); App.renderTable(); }
function exportBackup() { const blob = new Blob([JSON.stringify({t: transactions, c: categories, g: currentGoal})], {type: "application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "backup.json"; a.click(); }
function importBackup() { const i = document.createElement("input"); i.type = "file"; i.onchange = e => { const r = new FileReader(); r.onload = x => { const d = JSON.parse(x.target.result); storage.set(d.t); catStorage.set(d.c); goalStorage.set(d.g); location.reload(); }; r.readAsText(e.target.files[0]); }; i.click(); }

document.body.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
App.update();
// Função para esconder o loader com um pequeno delay para suavidade
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-overlay');
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker Ativo!'))
    .catch(err => console.log('Erro no SW:', err));
}
    
    setTimeout(() => {
        loader.classList.add('loader-hidden');
    }, 800); // 800ms é o tempo ideal para o usuário perceber o capricho visual

});
