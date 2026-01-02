// js/dashboard.js
import { supabase } from './supabase.js';

// Elementos do Dashboard
let saldoAtualElement;
let totalEntradasElement;
let totalSaidasElement;
let resultadoPeriodoElement;
let dashboardUserNameElement; // NOVO: Elemento para o nome do usuário

// Elementos do filtro do Dashboard
let periodFilterSelect;
let startDateInput;
let endDateInput;
let applyFilterButton;

// Variáveis para o período selecionado
let currentStartDate;
let currentEndDate;

// Função auxiliar para formatar valores como moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

// Função para inicializar a página do Dashboard
export async function initDashboardPage() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html'; // Redireciona se não houver usuário
        return;
    }

    // Seleciona os elementos do DOM do Dashboard
    saldoAtualElement = document.getElementById('saldo-atual');
    totalEntradasElement = document.getElementById('total-entradas');
    totalSaidasElement = document.getElementById('total-saidas');
    resultadoPeriodoElement = document.getElementById('resultado-periodo');
    dashboardUserNameElement = document.getElementById('dashboard-user-name'); // Seleciona o elemento do nome

    // Inicializa elementos do filtro
    periodFilterSelect = document.getElementById('period-filter');
    startDateInput = document.getElementById('start-date');
    endDateInput = document.getElementById('end-date');
    applyFilterButton = document.getElementById('apply-filter-btn');

    // Adiciona Event Listeners para os filtros
    if (periodFilterSelect) periodFilterSelect.addEventListener('change', handlePeriodFilterChange);
    if (applyFilterButton) applyFilterButton.addEventListener('click', updateDashboardUI);

    // --- Lógica para exibir o nome do usuário ---
    if (dashboardUserNameElement) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil do usuário para dashboard:', error.message);
            dashboardUserNameElement.textContent = user.email; // Fallback para email
        } else if (profile && profile.username) {
            dashboardUserNameElement.textContent = profile.username;
        } else {
            dashboardUserNameElement.textContent = user.email; // Fallback para email se username não existir
        }
    }

    // Define o período inicial como Mês Atual e atualiza a UI
    setPeriodDates('current_month');
    handlePeriodFilterChange(); // Chama para ajustar visibilidade dos inputs de data
    await updateDashboardUI();
}


// Define as datas de início e fim do período com base na seleção do filtro
function setPeriodDates(filterType) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (filterType) {
        case 'current_month':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'last_3_months':
            start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'current_year':
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'custom':
            // As datas serão pegas dos inputs de data
            break;
    }
    currentStartDate = start.toISOString();
    currentEndDate = end.toISOString();

    // Atualiza os inputs de data se for o caso
    if (startDateInput) startDateInput.value = start.toISOString().split('T')[0];
    if (endDateInput) endDateInput.value = end.toISOString().split('T')[0];
}

// Lida com a mudança no filtro de período
function handlePeriodFilterChange() {
    const filterType = periodFilterSelect.value;
    if (filterType === 'custom') {
        if (startDateInput) startDateInput.style.display = 'inline-block';
        if (endDateInput) endDateInput.style.display = 'inline-block';
        if (applyFilterButton) applyFilterButton.style.display = 'inline-block';
    } else {
        if (startDateInput) startDateInput.style.display = 'none';
        if (endDateInput) endDateInput.style.display = 'none';
        if (applyFilterButton) applyFilterButton.style.display = 'none';
        setPeriodDates(filterType); // Define as datas e atualiza
        updateDashboardUI();
    }
}

// Função para buscar e atualizar os dados do dashboard
async function updateDashboardUI() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Erro ao buscar usuário para dashboard:', userError?.message);
        // O dashboardUserNameElement já deve ter um fallback para email
        return;
    }

    // Se o filtro for personalizado, pega as datas dos inputs
    if (periodFilterSelect && periodFilterSelect.value === 'custom') {
        currentStartDate = new Date(startDateInput.value).toISOString();
        currentEndDate = new Date(endDateInput.value + 'T23:59:59.999').toISOString(); // Garante o final do dia
    }

    // --- Busca de lançamentos para os cards de resumo do período selecionado ---
    const { data: lancamentosPeriodo, error: lancamentosPeriodoError } = await supabase
        .from('lancamentos')
        .select('valor, tipo, data, categoria_id, categorias(nome)') // Inclui categoria para os gráficos
        .eq('user_id', user.id)
        .gte('data', currentStartDate)
        .lte('data', currentEndDate);

    if (lancamentosPeriodoError) {
        console.error('Erro ao buscar lançamentos do período:', lancamentosPeriodoError.message);
        return;
    }

    let totalEntradas = 0;
    let totalSaidas = 0;

    lancamentosPeriodo.forEach(lancamento => {
        if (lancamento.tipo === 'entrada') {
            totalEntradas += lancamento.valor;
        } else if (lancamento.tipo === 'saida') {
            totalSaidas += lancamento.valor;
        }
    });

    const saldoAtual = totalEntradas - totalSaidas;
    const resultadoPeriodo = totalEntradas - totalSaidas;

    if (saldoAtualElement) {
        saldoAtualElement.textContent = formatCurrency(saldoAtual);
        saldoAtualElement.classList.remove('positive', 'negative');
        if (saldoAtual >= 0) {
            saldoAtualElement.classList.add('positive');
        } else {
            saldoAtualElement.classList.add('negative');
        }
    }

    if (totalEntradasElement) {
        totalEntradasElement.textContent = formatCurrency(totalEntradas);
    }

    if (totalSaidasElement) {
        totalSaidasElement.textContent = formatCurrency(totalSaidas);
    }

    if (resultadoPeriodoElement) {
        resultadoPeriodoElement.textContent = formatCurrency(resultadoPeriodo);
        resultadoPeriodoElement.classList.remove('positive', 'negative');
        if (resultadoPeriodo >= 0) {
            resultadoPeriodoElement.classList.add('positive');
        } else {
            resultadoPeriodoElement.classList.add('negative');
        }
    }

    // --- Lógica para o Gráfico de Fluxo Financeiro (Entradas x Saídas por Mês no Ano Atual) ---
    // Este gráfico usará sempre o ano atual, independente do filtro de período dos cards
    const today = new Date();
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString();

    const { data: lancamentosAnoAtual, error: lancamentosAnoAtualError } = await supabase
        .from('lancamentos')
        .select('valor, tipo, data')
        .eq('user_id', user.id)
        .gte('data', startOfYear)
        .lte('data', endOfYear)
        .order('data', { ascending: true });

    if (lancamentosAnoAtualError) {
        console.error('Erro ao buscar lançamentos do ano atual para o gráfico de fluxo:', lancamentosAnoAtualError.message);
    } else {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(currentYear, i).toLocaleString('pt-BR', { month: 'short' }),
            entradas: 0,
            saidas: 0
        }));

        lancamentosAnoAtual.forEach(lancamento => {
            const monthIndex = new Date(lancamento.data).getMonth();
            if (lancamento.tipo === 'entrada') {
                monthlyData[monthIndex].entradas += lancamento.valor;
            } else if (lancamento.tipo === 'saida') {
                monthlyData[monthIndex].saidas += lancamento.valor;
            }
        });

        renderBarChart(
            'chart-fluxo-financeiro',
            monthlyData,
            'Fluxo Financeiro Anual',
            'mês',
            ['entradas', 'saidas'],
            ['#28a745', '#dc3545'] // Verde para entradas, vermelho para saídas
        );
    }

    // --- NOVO: Lógica para Gráfico de Saldo Histórico (ao longo do período selecionado) ---
    // Agrupa lançamentos por dia para calcular o saldo acumulado
    const dailyBalanceData = {};
    lancamentosPeriodo.sort((a, b) => new Date(a.data) - new Date(b.data)); // Ordena por data

    let cumulativeBalance = 0;
    lancamentosPeriodo.forEach(lancamento => {
        const dateKey = new Date(lancamento.data).toISOString().split('T')[0]; // "YYYY-MM-DD"
        if (!dailyBalanceData[dateKey]) {
            dailyBalanceData[dateKey] = 0;
        }
        if (lancamento.tipo === 'entrada') {
            dailyBalanceData[dateKey] += lancamento.valor;
        } else {
            dailyBalanceData[dateKey] -= lancamento.valor;
        }
    });

    const balanceHistory = [];
    let currentDate = new Date(currentStartDate);
    const endDate = new Date(currentEndDate);

    while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        cumulativeBalance += (dailyBalanceData[dateKey] || 0);
        balanceHistory.push({
            date: dateKey,
            balance: cumulativeBalance
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    renderLineChart(
        'chart-saldo-historico',
        balanceHistory,
        'Saldo Acumulado',
        'Data',
        [{ name: 'Saldo', dataKey: 'balance', color: '#007bff' }]
    );


    // --- Lógica para o Gráfico de Gastos por Categoria (Período Selecionado) ---
    const expensesByCategory = {};
    lancamentosPeriodo.filter(l => l.tipo === 'saida').forEach(lancamento => {
        const categoryName = lancamento.categorias ? lancamento.categorias.nome : 'Outros';
        if (!expensesByCategory[categoryName]) {
            expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += lancamento.valor;
    });

    const pieChartDataExpenses = Object.keys(expensesByCategory).map(category => ({
        name: category,
        value: expensesByCategory[category]
    }));

    renderPieChart(
        'chart-gastos-categoria',
        pieChartDataExpenses,
        'Gastos por Categoria (Período)'
    );

    // --- NOVO: Lógica para o Gráfico de Entradas por Categoria (Período Selecionado) ---
    const incomesByCategory = {};
    lancamentosPeriodo.filter(l => l.tipo === 'entrada').forEach(lancamento => {
        const categoryName = lancamento.categorias ? lancamento.categorias.nome : 'Outros';
        if (!incomesByCategory[categoryName]) {
            incomesByCategory[categoryName] = 0;
        }
        incomesByCategory[categoryName] += lancamento.valor;
    });

    const pieChartDataIncomes = Object.keys(incomesByCategory).map(category => ({
        name: category,
        value: incomesByCategory[category]
    }));

    renderPieChart(
        'chart-entradas-categoria',
        pieChartDataIncomes,
        'Entradas por Categoria (Período)'
    );
}

// --- Funções para Renderização de Gráficos (usando Chart.js) ---

function renderBarChart(elementId, data, title, xAxisLabel, seriesKeys, colors) {
    const chartContainer = document.getElementById(elementId);
    if (!chartContainer) {
        console.error(`Elemento ${elementId} não encontrado para renderizar o gráfico.`);
        return;
    }
    chartContainer.innerHTML = ''; // Limpa o conteúdo anterior

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const labels = data.map(item => item.month);
    const datasets = seriesKeys.map((key, index) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1), // Capitaliza a primeira letra
        data: data.map(item => item[key]),
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1
    }));

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xAxisLabel
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}

function renderPieChart(elementId, data, title) {
    const chartContainer = document.getElementById(elementId);
    if (!chartContainer) {
        console.error(`Elemento ${elementId} não encontrado para renderizar o gráfico.`);
        return;
    }
    chartContainer.innerHTML = ''; // Limpa o conteúdo anterior

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const generateRandomColors = (numColors) => {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            const hue = Math.floor(Math.random() * 360);
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        return colors;
    };
    const backgroundColors = generateRandomColors(data.length);

    const labels = data.map(item => item.name);
    const values = data.map(item => item.value);

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos',
                data: values,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function renderLineChart(elementId, data, title, xAxisLabel, series) {
    const chartContainer = document.getElementById(elementId);
    if (!chartContainer) {
        console.error(`Elemento ${elementId} não encontrado para renderizar o gráfico.`);
        return;
    }
    chartContainer.innerHTML = ''; // Limpa o conteúdo anterior

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const labels = data.map(item => new Date(item.date).toLocaleDateString('pt-BR'));

    const datasets = series.map(s => ({
        label: s.name,
        data: data.map(item => item[s.dataKey]),
        borderColor: s.color,
        backgroundColor: s.color + '40',
        fill: true,
        tension: 0.4
    }));

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xAxisLabel
                    },
                    type: 'category'
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}