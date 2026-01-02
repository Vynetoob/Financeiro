// js/auth.js
import { supabase } from './supabase.js';

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const signupLink = document.getElementById('signup-link');

let isLoginMode = true; // Estado para alternar entre login e cadastro

// Função para exibir mensagens ao usuário
function showMessage(message, type = 'error') {
    let messageElement = document.getElementById('auth-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'auth-message';
        messageElement.classList.add('auth-message');
        authForm.insertBefore(messageElement, authForm.firstChild);
    }
    messageElement.textContent = message;
    messageElement.className = `auth-message ${type}`;
}

// Função para alternar entre login e cadastro
signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    loginButton.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    signupLink.textContent = isLoginMode ? 'Cadastre-se' : 'Já tenho uma conta';
    authForm.querySelector('h2').textContent = isLoginMode ? 'Bem-vindo ao Controle Financeiro' : 'Criar Nova Conta';
    // Remover mensagem anterior ao alternar
    const messageElement = document.getElementById('auth-message');
    if (messageElement) messageElement.remove();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    if (isLoginMode) {
        // Lógica de Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showMessage(error.message, 'error');
        } else {
            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            // Redirecionar para a página principal (dashboard.html)
            window.location.href = 'dashboard.html';
        }
    } else {
        // Lógica de Cadastro
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            showMessage(error.message, 'error');
        } else {
            showMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.', 'success');
            // Após o cadastro, pode-se redirecionar ou manter na tela de login
            isLoginMode = true; // Volta para o modo de login após o cadastro
            loginButton.textContent = 'Entrar';
            signupLink.textContent = 'Cadastre-se';
            authForm.querySelector('h2').textContent = 'Bem-vindo ao Controle Financeiro';
        }
    }
});

// Verificar sessão ao carregar a página
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Se houver sessão ativa, redirecionar para o dashboard
        window.location.href = 'dashboard.html';
    }
}

// Chamar a verificação de sessão ao carregar a página de login
window.addEventListener('load', checkSession);