// js/main.js
import { supabase } from './supabase.js';
import { initLancamentosPage } from './lancamentos.js';
import { initConjuntoPage } from './conjunto.js';
import { initCartoesPage } from './cartoes.js';
import { initConfiguracoesPage } from './configuracoes.js';
import { initDashboardPage } from './dashboard.js';

// ATENÇÃO: Para usar ChartDataLabels, certifique-se de que o script
// <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
// esteja incluído no seu dashboard.html, APÓS o script do Chart.js.
// Se você não for usar labels de dados nos gráficos, pode remover as duas linhas abaixo.
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// Chart.register(ChartDataLabels);


/* =========================
   DECLARAÇÃO DE ELEMENTOS DOM GLOBAIS
   ========================= */

// Elementos principais do layout e navegação
const mainContentArea = document.getElementById('main-content-area');
const menuLinks = document.querySelectorAll('.sidebar ul li a');

// Elementos para o sistema de notificações
const customNotificationElement = document.getElementById('custom-notification');
const notificationMessageElement = document.getElementById('notification-message');

// Elementos para o modo escuro e botão de logout (localizados no dashboard.html)
const darkModeToggle = document.getElementById('dark-mode-toggle');
const logoutButton = document.getElementById('logout-button');


/* =========================
   UTILIDADES
   ========================= */

/**
 * Formata um valor numérico para o formato de moeda brasileira (BRL).
 * @param {number} value - O valor a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Exibe uma notificação personalizada (toast) na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success' | 'error' | 'info'} [type='success'] - O tipo da notificação (afeta a cor).
 * @param {number} [duration=3000] - Duração em milissegundos que a notificação ficará visível.
 */
export function showNotification(message, type = 'success', duration = 3000) {
    if (!customNotificationElement || !notificationMessageElement) {
        console.error('Elementos de notificação não encontrados no DOM. Exibindo alert como fallback.');
        alert(message); // Fallback para alert se os elementos não existirem
        return;
    }

    notificationMessageElement.textContent = message;
    // Remove classes anteriores e adiciona as novas
    customNotificationElement.className = 'custom-notification show ' + type;

    setTimeout(() => {
        customNotificationElement.classList.remove('show');
        // Opcional: remover a classe de tipo após a transição
        setTimeout(() => {
            customNotificationElement.className = 'custom-notification';
        }, 300); // Tempo da transição CSS
    }, duration);
}


/* =========================
   FUNCIONALIDADE DE MODO ESCURO
   ========================= */

/**
 * Aplica o tema (claro ou escuro) ao body do documento.
 * Atualiza o texto e ícone do botão de toggle.
 * @param {'light' | 'dark'} theme - O tema a ser aplicado.
 */
function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    if (darkModeToggle) {
        const iconSpan = darkModeToggle.querySelector('.icon');
        const textSpan = darkModeToggle.querySelector('.text');
        if (iconSpan) {
            iconSpan.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        if (textSpan) {
            textSpan.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        }
    }
}

/**
 * Alterna entre o modo claro e escuro, salvando a preferência no localStorage.
 */
function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

/**
 * Carrega o tema salvo no localStorage ou detecta a preferência do sistema.
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Verifica a preferência do sistema se não houver tema salvo
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light'); // Padrão para claro se nada for detectado
    }
}


/* =========================
   NAVEGAÇÃO E AUTENTICAÇÃO
   ========================= */

/**
 * Carrega o conteúdo HTML de uma página dinamicamente na área principal.
 * @param {string} pageName - O nome do arquivo HTML da página (ex: 'dashboard_home').
 */
async function loadContent(pageName) {
    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) {
            throw new Error(`Não foi possível carregar a página: ${pageName}.html`);
        }
        const htmlContent = await response.text();
        mainContentArea.innerHTML = htmlContent;

        // Após carregar o conteúdo, inicializa scripts específicos da página
        if (pageName === 'dashboard_home') {
            await initDashboardPage();
        } else if (pageName === 'lancamentos') {
            await initLancamentosPage();
        } else if (pageName === 'conjunto') {
            await initConjuntoPage();
        } else if (pageName === 'cartoes') {
            await initCartoesPage();
        } else if (pageName === 'configuracoes') {
            await initConfiguracoesPage();
        }
        // Adicione mais 'else if' para outras páginas conforme necessário

    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        mainContentArea.innerHTML = `<div class="page-content"><h2>Erro</h2><p>${error.message}</p></div>`;
        showNotification('Erro ao carregar página. Tente novamente.', 'error');
    }
}

/**
 * Verifica a sessão do usuário e redireciona para o login se não houver sessão ativa.
 * Caso contrário, carrega o dashboard.
 */
async function checkUser() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('Nenhuma sessão encontrada ou erro na sessão:', sessionError?.message);
        window.location.href = 'index.html'; // Redireciona para a página de login
        return;
    }

    // Carrega o dashboard como página inicial após login
    await loadContent('dashboard_home');
    // Ativa o link do dashboard no menu
    const dashboardLink = document.getElementById('menu-dashboard');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    }
}


/* =========================
   EVENT LISTENERS
   ========================= */

// Listener para o botão de logout
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error.message);
            showNotification('Erro ao sair. Tente novamente.', 'error');
        } else {
            showNotification('Logout realizado com sucesso!', 'success');
            window.location.href = 'index.html'; // Redirecionar para a página de login
        }
    });
}

// Listeners para os links do menu
menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        menuLinks.forEach(item => item.classList.remove('active'));
        e.target.classList.add('active');

        let pageToLoad;
        switch (e.target.id) {
            case 'menu-dashboard':
                pageToLoad = 'dashboard_home';
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

// Listener para o botão de toggle do modo escuro
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}


/* =========================
   INICIALIZAÇÃO DA APLICAÇÃO
   ========================= */

// Carrega o tema (claro/escuro) o mais cedo possível, antes do conteúdo ser totalmente carregado.
document.addEventListener('DOMContentLoaded', loadTheme);

// Inicializa a aplicação (verifica usuário e carrega conteúdo) após o carregamento completo da janela.
window.addEventListener('load', checkUser);