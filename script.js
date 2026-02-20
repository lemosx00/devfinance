const storage = {
    get: () => JSON.parse(localStorage.getItem("devf:trans")) || [],
    set: (t) => localStorage.setItem("devf:trans", JSON.stringify(t))
};

const goalStorage = {
    get: () => JSON.parse(localStorage.getItem("devf:goal")) || { title: "Reserva", value: 1000 },
    set: (g) => localStorage.setItem("devf:goal", JSON.stringify(g))
};

let transactions = storage.get();
let currentGoal = goalStorage.get();
let currentFilter = 'all';

const App = {
    update() {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const total = income - expense;

        document.getElementById('incomeDisplay').innerText = `R$ ${income.toFixed(2)}`;
        document.getElementById('expenseDisplay').innerText = `R$ ${expense.toFixed(2)}`;
        const totalDisp = document.getElementById('totalDisplay');
        totalDisp.innerText = `R$ ${total.toFixed(2)}`;

        // Cor dinâmica do Saldo
        const totalCard = document.getElementById('totalCard');
        totalCard.style.backgroundColor = total < 0 ? "var(--red)" : "var(--primary)";

        this.updateGoal(total);
        this.renderTable();
        this.updateChart(income, expense);
    },

    updateGoal(balance) {
        const percent = Math.min((balance / currentGoal.value) * 100, 100);
        const fill = document.getElementById('progressFill');
        document.getElementById('goalTitleDisplay').innerText = `Meta: ${currentGoal.title}`;
        fill.style.width = `${percent}%`;
        fill.style.background = percent >= 100 ? "#FFD700" : "var(--primary)";
        document.getElementById('goalText').innerText = `Progresso: ${percent.toFixed(1)}% (R$ ${balance.toFixed(2)} de R$ ${currentGoal.value})`;
    },

    renderTable() {
        const tbody = document.getElementById('transaction-body');
        tbody.innerHTML = '';
        
        transactions.filter(t => currentFilter === 'all' || t.type === currentFilter).forEach((t) => {
            const index = transactions.indexOf(t);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.description}</td>
                <td class="${t.type}">${t.type === 'income' ? '' : '-'} R$ ${t.amount.toFixed(2)}</td>
                <td>${t.category}</td>
                <td>${t.type === 'income' ? '🟢' : '🔴'}</td>
                <td><button onclick="removeTransaction(${index})">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    updateChart(inc, exp) {
        const ctx = document.getElementById('financeChart').getContext('2d');
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Entradas', 'Saídas'],
                datasets: [{ data: [inc, exp], backgroundColor: ['#2d7a34', '#e92929'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

function handleFormSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;

    transactions.push({ description, amount, category, type });
    storage.set(transactions);
    App.update();
    toggleModal();
    e.target.reset();
}

function handleGoalUpdate(e) {
    e.preventDefault();
    currentGoal = { title: document.getElementById('newGoalTitle').value, value: parseFloat(document.getElementById('newGoalValue').value) };
    goalStorage.set(currentGoal);
    App.update();
    toggleGoalModal();
}

function filterTransactions(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    App.renderTable();
}

function removeTransaction(index) {
    transactions.splice(index, 1);
    storage.set(transactions);
    App.update();
}

function toggleModal() { document.getElementById('modal').classList.toggle('active'); }
function toggleGoalModal() { document.getElementById('goal-modal').classList.toggle('active'); }

function toggleTheme() {
    const theme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Init
document.body.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
App.update();