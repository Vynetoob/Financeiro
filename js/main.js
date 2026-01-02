// js/main.js
import { supabase } from './supabase.js';
import { initLancamentosPage } from './lancamentos.js';
import { initConjuntoPage } from './conjunto.js';
import { initCartoesPage } from './cartoes.js';
import { initConfiguracoesPage } from './configuracoes.js';
import { initDashboardPage } from './dashboard.js'; // NOVO: Importa a função de inicialização do dashboard

// ATENÇÃO: Para usar ChartDataLabels, certifique-se de que o script
// <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
// esteja incluído no seu dashboard.html, APÓS o script do Chart.js.
// Se você não for usar labels de dados nos gráficos, pode remover as duas linhas abaixo.
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// Chart.register(ChartDataLabels);


const logoutButton = document.getElementById('logout-button');
const mainContentArea = document.getElementById('main-content-area');
const menuLinks = document.querySelectorAll('.sidebar ul li a');

// REMOVIDO: Elementos do Dashboard - serão gerenciados por dashboard.js
// REMOVIDO: Elementos do filtro do Dashboard
// REMOVIDO: Variáveis para o período selecionado


// Função auxiliar para formatar valores como moeda (mantida aqui se usada em outros lugares)
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

// Função para carregar conteúdo dinamicamente
async function loadContent(pageName) {
    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) {
            throw new Error(`Não foi possível carregar a página: ${pageName}.html`);
        }
        const htmlContent = await response.text();
        mainContentArea.innerHTML = htmlContent;

        // Após carregar o conteúdo, inicializa scripts específicos
        if (pageName === 'dashboard_home') {
            await initDashboardPage(); // CHAMA A FUNÇÃO DE INICIALIZAÇÃO DO DASHBOARD
        } else if (pageName === 'lancamentos') {
            await initLancamentosPage();
        } else if (pageName === 'conjunto') {
            await initConjuntoPage();
        } else if (pageName === 'cartoes') {
            await initCartoesPage();
        } else if (pageName === 'configuracoes') {
            await initConfiguracoesPage();
        }
        // Adicionaremos mais 'else if' para outras páginas no futuro

    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        mainContentArea.innerHTML = `<div class="page-content"><h2>Erro</h2><p>${error.message}</p></div>`;
    }
}

// REMOVIDO: setPeriodDates - movido para dashboard.js
// REMOVIDO: handlePeriodFilterChange - movido para dashboard.js
// REMOVIDO: updateDashboardUI - movido para dashboard.js
// REMOVIDO: renderBarChart - movido para dashboard.js
// REMOVIDO: renderPieChart - movido para dashboard.js
// REMOVIDO: renderLineChart - movido para dashboard.js


async function checkUser() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('Nenhuma sessão encontrada ou erro na sessão:', sessionError?.message);
        window.location.href = 'index.html'; // Redireciona para a página de login
        return;
    }

    // Carrega o dashboard como página inicial após login
    await loadContent('dashboard_home');
    document.getElementById('menu-dashboard').classList.add('active');
}

// Listener para o botão de logout (no sidebar, que é fixo no index.html)
if (logoutButton) { // Verifica se o botão existe, pois pode não estar presente em todas as páginas
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error.message);
            alert('Erro ao sair. Tente novamente.');
        } else {
            window.location.href = 'index.html'; // Redirecionar para a página de login
        }
    });
}


// Listeners para os links do menu (no sidebar)
menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        menuLinks.forEach(item => item.classList.remove('active'));
        e.target.classList.add('active');

        let pageToLoad;
        switch (e.target.id) {
            case 'menu-dashboard':
                pageToLoad = 'dashboard_home'; // Mantém o nome da página como 'dashboard_home'
                break;
            case 'menu-lancamentos':
                pageToLoad = 'lancamentos';
                break;
            case 'menu-conjunto':
                pageToLoad = 'conjunto';
                break;
            case 'menu-cartao':
                pageToLoad = 'cartoes';
                break;
            case 'menu-configuracoes':
                pageToLoad = 'configuracoes';
                break;
            default:
                pageToLoad = 'dashboard_home';
        }
        loadContent(pageToLoad);
    });
});

// Inicializa a aplicação ao carregar a janela
window.addEventListener('load', checkUser);