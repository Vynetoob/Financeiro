// js/cartoes.js
import { supabase } from './supabase.js';

let currentUserId = null;

let cardsListElement;
let addCardButton;
let cardModal;
let closeButtonCardModal;
let cardForm;
let cardModalTitle;
let cardIdInput;
let cardNameInput;
let cardLimitInput;
let cardClosingDayInput;
let cardDueDayInput;
let deleteCardButton;

let cardTransactionsModal;
let closeButtonCardTransactionsModal;
let cardTransactionsModalTitle;
let cardTransactionsListElement;

/* =========================
   UTILIDADES
========================= */

// Formata valor em moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

// ✅ FORMATA DATA LOCAL (SEM UTC / SEM BUG)
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/* =========================
   INICIALIZAÇÃO DOM
========================= */

function initializeCartoesDOM() {
    cardsListElement = document.getElementById('cards-list');
    addCardButton = document.getElementById('add-card-btn');
    cardModal = document.getElementById('card-modal');
    closeButtonCardModal = cardModal.querySelector('.close-button');
    cardForm = document.getElementById('card-form');
    cardModalTitle = document.getElementById('card-modal-title');
    cardIdInput = document.getElementById('card-id');
    cardNameInput = document.getElementById('card-name');
    cardLimitInput = document.getElementById('card-limit');
    cardClosingDayInput = document.getElementById('card-closing-day');
    cardDueDayInput = document.getElementById('card-due-day');
    deleteCardButton = document.getElementById('delete-card-btn');

    cardTransactionsModal = document.getElementById('card-transactions-modal');
    closeButtonCardTransactionsModal = cardTransactionsModal.querySelector('.close-button-card-transactions');
    cardTransactionsModalTitle = document.getElementById('card-transactions-modal-title');
    cardTransactionsListElement = document.getElementById('card-transactions-list');

    // Event Listeners
    addCardButton.addEventListener('click', () => openCardModal());
    closeButtonCardModal.addEventListener('click', closeCardModal);
    cardForm.addEventListener('submit', handleCardSubmit);
    deleteCardButton.addEventListener('click', deleteCard);

    closeButtonCardTransactionsModal.addEventListener('click', closeCardTransactionsModal);
    window.addEventListener('click', (event) => {
        if (event.target == cardModal) {
            closeCardModal();
        }
        if (event.target == cardTransactionsModal) {
            closeCardTransactionsModal();
        }
    });
}

/* =========================
   MODAL DE CARTÃO (CRUD)
========================= */

async function openCardModal(card = null) {
    cardForm.reset();
    cardIdInput.value = '';
    deleteCardButton.style.display = 'none';

    cardModalTitle.textContent = card ? 'Editar Cartão' : 'Novo Cartão';

    if (card) {
        cardIdInput.value = card.id;
        cardNameInput.value = card.nome_cartao;
        cardLimitInput.value = card.limite_total;
        cardClosingDayInput.value = card.dia_fechamento_fatura;
        cardDueDayInput.value = card.dia_vencimento_fatura;
        deleteCardButton.style.display = 'block';
    }

    cardModal.style.display = 'flex';
}

function closeCardModal() {
    cardModal.style.display = 'none';
}

async function handleCardSubmit(event) {
    event.preventDefault();

    if (!currentUserId) {
        alert('Usuário não identificado.');
        return;
    }

    const cardData = {
        user_id: currentUserId,
        nome_cartao: cardNameInput.value.trim(),
        limite_total: parseFloat(cardLimitInput.value),
        dia_fechamento_fatura: parseInt(cardClosingDayInput.value),
        dia_vencimento_fatura: parseInt(cardDueDayInput.value),
    };

    const cardId = cardIdInput.value;
    let error;

    if (cardId) {
        const { error: updateError } = await supabase
            .from('cartoes_credito')
            .update(cardData)
            .eq('id', cardId)
            .eq('user_id', currentUserId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('cartoes_credito').insert([cardData]);
        error = insertError;
    }

    if (error) {
        console.error('Erro ao salvar cartão:', error.message);
        alert(`Erro ao salvar cartão: ${error.message}. Tente novamente.`);
    } else {
        alert('Cartão salvo com sucesso!');
        closeCardModal();
        await renderCards();
    }
}

async function deleteCard() {
    const cardId = cardIdInput.value;
    if (!cardId) return;

    if (!confirm('Tem certeza que deseja excluir este cartão? Todos os lançamentos associados a ele permanecerão, mas não serão mais vinculados a um cartão.')) {
        return;
    }

    const { error } = await supabase
        .from('cartoes_credito')
        .delete()
        .eq('id', cardId)
        .eq('user_id', currentUserId);

    if (error) {
        console.error('Erro ao excluir cartão:', error.message);
        alert(`Erro ao excluir cartão: ${error.message}. Tente novamente.`);
    } else {
        alert('Cartão excluído com sucesso!');
        closeCardModal();
        await renderCards();
    }
}

/* =========================
   MODAL DE LANÇAMENTOS DO CARTÃO
========================= */

async function openCardTransactionsModal(card) {
    if (!currentUserId) return;

    cardTransactionsModalTitle.textContent = `Lançamentos de ${card.nome_cartao}`;
    cardTransactionsListElement.innerHTML = `<p class="no-transactions-message">Carregando lançamentos...</p>`;

    const today = new Date();
    let invoiceStartDate, invoiceEndDate, invoiceDueDate;

    const currentDay = today.getDate();
    let startMonth = today.getMonth();
    let startYear = today.getFullYear();
    let endMonth = today.getMonth();
    let endYear = today.getFullYear();

    if (currentDay > card.dia_fechamento_fatura) {
        invoiceStartDate = new Date(startYear, startMonth, card.dia_fechamento_fatura + 1);
        invoiceEndDate = new Date(endYear, endMonth + 1, card.dia_fechamento_fatura);
        invoiceDueDate = new Date(endYear, endMonth + 1, card.dia_vencimento_fatura);
    } else {
        invoiceStartDate = new Date(startYear, startMonth - 1, card.dia_fechamento_fatura + 1);
        invoiceEndDate = new Date(endYear, endMonth, card.dia_fechamento_fatura);
        invoiceDueDate = new Date(endYear, endMonth, card.dia_vencimento_fatura);
    }

    invoiceStartDate.setDate(Math.min(invoiceStartDate.getDate(), new Date(invoiceStartDate.getFullYear(), invoiceStartDate.getMonth() + 1, 0).getDate()));
    invoiceEndDate.setDate(Math.min(invoiceEndDate.getDate(), new Date(invoiceEndDate.getFullYear(), invoiceEndDate.getMonth() + 1, 0).getDate()));
    invoiceDueDate.setDate(Math.min(invoiceDueDate.getDate(), new Date(invoiceDueDate.getFullYear(), invoiceDueDate.getMonth() + 1, 0).getDate()));


    // Busca lançamentos para o cartão específico e dentro do período da fatura atual
    const { data: currentInvoiceTransactions, error: currentTransError } = await supabase
        .from('lancamentos')
        .select('*, categorias(nome)')
        .eq('user_id', currentUserId)
        .eq('tipo', 'saida')
        .eq('forma_pagamento', 'Credito')
        .eq('cartao_id', card.id)
        .gte('data', formatDateLocal(invoiceStartDate))
        .lte('data', formatDateLocal(invoiceEndDate))
        .order('data', { ascending: false });

    if (currentTransError) {
        console.error('Erro ao buscar lançamentos da fatura atual:', currentTransError.message);
        cardTransactionsListElement.innerHTML = `<p class="no-transactions-message">Erro ao carregar lançamentos da fatura atual: ${currentTransError.message}.</p>`;
        cardTransactionsModal.style.display = 'flex';
        return;
    }

    let currentInvoiceTotal = 0;
    currentInvoiceTransactions.forEach(t => {
        if (!t.pago) {
            currentInvoiceTotal += t.valor;
        }
    });

    // --- Cálculo do Limite Comprometido (para o card geral) ---
    const { data: allPendingTransactions, error: allPendingError } = await supabase
        .from('lancamentos')
        .select('valor')
        .eq('user_id', currentUserId)
        .eq('tipo', 'saida')
        .eq('forma_pagamento', 'Credito')
        .eq('cartao_id', card.id)
        .filter('pago', 'eq', false);

    let totalComprometido = 0;
    if (allPendingError) {
        console.error('Erro ao buscar todos os lançamentos pendentes para limite:', allPendingError.message);
    } else {
        allPendingTransactions.forEach(t => {
            totalComprometido += t.valor;
        });
    }
    const limiteDisponivel = card.limite_total - totalComprometido;
    // --- Fim do Cálculo do Limite Comprometido ---


    // --- NOVO: Lógica para Faturas Futuras ---
    const futureInvoices = [];
    const numFutureInvoices = 6; // Quantidade de faturas futuras para exibir

    for (let i = 1; i <= numFutureInvoices; i++) {
        let futureInvoiceStartDate, futureInvoiceEndDate, futureInvoiceDueDate;

        // Calcula o período para a próxima fatura
        if (currentDay > card.dia_fechamento_fatura) {
            // Se a fatura atual já fechou, a próxima começa no mês atual
            futureInvoiceStartDate = new Date(today.getFullYear(), today.getMonth() + i, card.dia_fechamento_fatura + 1);
            futureInvoiceEndDate = new Date(today.getFullYear(), today.getMonth() + i + 1, card.dia_fechamento_fatura);
            futureInvoiceDueDate = new Date(today.getFullYear(), today.getMonth() + i + 1, card.dia_vencimento_fatura);
        } else {
            // Se a fatura atual ainda vai fechar, a próxima começa no mês atual
            futureInvoiceStartDate = new Date(today.getFullYear(), today.getMonth() + i - 1, card.dia_fechamento_fatura + 1);
            futureInvoiceEndDate = new Date(today.getFullYear(), today.getMonth() + i, card.dia_fechamento_fatura);
            futureInvoiceDueDate = new Date(today.getFullYear(), today.getMonth() + i, card.dia_vencimento_fatura);
        }

        // Ajusta para o último dia do mês, se necessário
        futureInvoiceStartDate.setDate(Math.min(futureInvoiceStartDate.getDate(), new Date(futureInvoiceStartDate.getFullYear(), futureInvoiceStartDate.getMonth() + 1, 0).getDate()));
        futureInvoiceEndDate.setDate(Math.min(futureInvoiceEndDate.getDate(), new Date(futureInvoiceEndDate.getFullYear(), futureInvoiceEndDate.getMonth() + 1, 0).getDate()));
        futureInvoiceDueDate.setDate(Math.min(futureInvoiceDueDate.getDate(), new Date(futureInvoiceDueDate.getFullYear(), futureInvoiceDueDate.getMonth() + 1, 0).getDate()));


        // Busca lançamentos para o cartão específico e dentro do período da fatura futura
        const { data: futureTransactions, error: futureTransError } = await supabase
            .from('lancamentos')
            .select('valor')
            .eq('user_id', currentUserId)
            .eq('tipo', 'saida')
            .eq('forma_pagamento', 'Credito')
            .eq('cartao_id', card.id)
            .gte('data', formatDateLocal(futureInvoiceStartDate))
            .lte('data', formatDateLocal(futureInvoiceEndDate))
            .filter('pago', 'eq', false); // Apenas lançamentos não pagos

        let futureInvoiceTotal = 0;
        if (futureTransError) {
            console.error(`Erro ao buscar lançamentos para fatura futura ${i}:`, futureTransError.message);
        } else {
            futureTransactions.forEach(t => {
                futureInvoiceTotal += t.valor;
            });
        }
        futureInvoices.push({
            monthYear: futureInvoiceEndDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            total: futureInvoiceTotal
        });
    }
    // --- Fim da Lógica para Faturas Futuras ---


    let headerHtml = `
        <div class="card-summary-details">
            <p><strong>Limite Total:</strong> ${formatCurrency(card.limite_total)}</p>
            <p><strong>Limite Comprometido:</strong> ${formatCurrency(totalComprometido)}</p>
            <p><strong>Limite Disponível:</strong> <span class="${limiteDisponivel >= 0 ? 'positive' : 'negative'}">${formatCurrency(limiteDisponivel)}</span></p>
        </div>
        <div class="invoice-summary-details">
            <h4>Fatura Atual</h4>
            <p><strong>Período:</strong> ${invoiceStartDate.toLocaleDateString('pt-BR')} - ${invoiceEndDate.toLocaleDateString('pt-BR')}</p>
            <p><strong>Fechamento:</strong> ${invoiceEndDate.toLocaleDateString('pt-BR')}</p>
            <p><strong>Vencimento:</strong> ${invoiceDueDate.toLocaleDateString('pt-BR')}</p>
            <p><strong>Valor Total da Fatura:</strong> <span class="invoice-total">${formatCurrency(currentInvoiceTotal)}</span></p>
        </div>
        <div class="future-invoices-summary">
            <h4>Próximas Faturas</h4>
            <div class="future-invoices-list">
                ${futureInvoices.map(inv => `
                    <div class="future-invoice-item">
                        <span>${inv.monthYear}:</span>
                        <span class="future-invoice-total">${formatCurrency(inv.total)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    cardTransactionsListElement.innerHTML = headerHtml;


    if (currentInvoiceTransactions.length === 0) { // MUDANÇA: Usa currentInvoiceTransactions
        cardTransactionsListElement.innerHTML += `<p class="no-transactions-message">Nenhum lançamento de crédito encontrado para este cartão no período da fatura atual.</p>`;
    } else {
        currentInvoiceTransactions.forEach(transaction => { // MUDANÇA: Itera sobre currentInvoiceTransactions
            const [year, month, day] = transaction.data.split('-').map(Number);
            const displayDate = new Date(year, month - 1, day);

            const transactionItem = document.createElement('div');
            transactionItem.classList.add('transaction-item');
            transactionItem.classList.add(transaction.pago ? 'paid' : 'unpaid');
            
            const transactionDateObj = new Date(transaction.data);
            if (transactionDateObj >= invoiceStartDate && transactionDateObj <= invoiceEndDate) {
                transactionItem.classList.add('current-invoice-transaction');
            }

            if (transaction.total_parcelas > 1) {
                transactionItem.classList.add('installment-transaction');
            } else if (transaction.recorrente_id || transaction.is_recorrente_master) {
                transactionItem.classList.add('recurrent-transaction');
            }

            const icon = transaction.tipo === 'entrada' ? '⬆️' : '⬇️';
            const iconClass = transaction.tipo === 'entrada' ? 'entry' : 'exit';
            const amountClass = transaction.tipo === 'entrada' ? 'entry' : 'exit';

            const categoryName = transaction.categorias ? transaction.categorias.nome : 'Sem Categoria';

            let seriesIndicator = '';
            if (transaction.total_parcelas > 1) {
                seriesIndicator = ` (${transaction.parcela_atual}/${transaction.total_parcelas}) 💳 `;
            } else if (transaction.recorrente_id || transaction.is_recorrente_master) {
                seriesIndicator = ' 🔄 ';
            }


            transactionItem.innerHTML = `
                <div class="transaction-icon ${iconClass}">${icon}</div>
                <div class="transaction-details">
                    <div class="description">${transaction.descricao}${seriesIndicator}</div>
                    <div class="info">
                        ${displayDate.toLocaleDateString('pt-BR')} |
                        ${categoryName}
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">${formatCurrency(transaction.valor)}</div>
                <div class="transaction-actions-item">
                    <button class="btn-small btn-mark-paid ${transaction.pago ? 'paid' : ''}" data-id="${transaction.id}" data-paid="${transaction.pago}">
                        ${transaction.pago ? '✅ Pago' : 'Pagar'}
                    </button>
                </div>
            `;
            cardTransactionsListElement.appendChild(transactionItem);
        });
    }


    cardTransactionsListElement.querySelectorAll('.btn-mark-paid').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const paidStatus = e.target.dataset.paid === 'true';
            
            const { error: updateError } = await supabase
                .from('lancamentos')
                .update({ pago: !paidStatus })
                .eq('id', id)
                .eq('user_id', currentUserId);

            if (updateError) {
                console.error('Erro ao alterar status de pagamento:', updateError.message);
                alert('Erro ao alterar status. Tente novamente.');
            } else {
                await openCardTransactionsModal(card); 
                await renderCards();
            }
        });
    });

    cardTransactionsModal.style.display = 'flex';
}

function closeCardTransactionsModal() {
    cardTransactionsModal.style.display = 'none';
}


/* =========================
   RENDERIZAÇÃO DE CARTÕES
========================= */

async function renderCards() {
    if (!currentUserId) return;

    const { data: cards, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('user_id', currentUserId)
        .order('nome_cartao', { ascending: true });

    if (error) {
        console.error('Erro ao buscar cartões:', error.message);
        cardsListElement.innerHTML = `<p class="no-cards-message">Erro ao carregar cartões: ${error.message}.</p>`;
        return;
    }

    if (cards.length === 0) {
        cardsListElement.innerHTML = `<p class="no-cards-message">Nenhum cartão cadastrado.</p>`;
        return;
    }

    cardsListElement.innerHTML = '';
    for (const card of cards) {
        const { data: creditTransactions, error: transError } = await supabase
            .from('lancamentos')
            .select('valor, pago')
            .eq('user_id', currentUserId)
            .eq('tipo', 'saida')
            .eq('forma_pagamento', 'Credito')
            .eq('cartao_id', card.id)
            .filter('pago', 'eq', false);

        if (transError) {
            console.error(`Erro ao buscar lançamentos de crédito para o cartão ${card.nome_cartao}:`, transError.message);
            continue;
        }

        let totalComprometido = 0;
        creditTransactions.forEach(t => {
            totalComprometido += t.valor;
        });
        
        const limiteDisponivel = card.limite_total - totalComprometido;
        let committedMessage = "";

        const cardItem = document.createElement('div');
        cardItem.classList.add('card-item');

        cardItem.innerHTML = `
            <div class="card-details">
                <div class="name">${card.nome_cartao}</div>
                <div class="info">
                    Limite Total: ${formatCurrency(card.limite_total)}<br>
                    Limite Comprometido: ${formatCurrency(totalComprometido)}<br>
                    Limite Disponível: <span class="${limiteDisponivel >= 0 ? 'positive' : 'negative'}">${formatCurrency(limiteDisponivel)}</span><br>
                    Fechamento: Dia ${card.dia_fechamento_fatura} | Vencimento: Dia ${card.dia_vencimento_fatura}
                </div>
            </div>
            <div class="card-actions-item">
                <button class="btn-small btn-view-transactions" data-card='${JSON.stringify(card)}'>Ver Lançamentos</button>
                <button class="btn-small btn-edit" data-id="${card.id}">✏️</button>
            </div>
        `;
        cardsListElement.appendChild(cardItem);
    }

    cardsListElement.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const card = cards.find(c => c.id === id);
            if (card) {
                openCardModal(card);
            }
        });
    });

    cardsListElement.querySelectorAll('.btn-view-transactions').forEach(button => {
        button.addEventListener('click', (e) => {
            const cardData = JSON.parse(e.target.dataset.card);
            openCardTransactionsModal(cardData);
        });
    });
}

/* =========================
   CARREGAMENTO INICIAL
========================= */

export async function initCartoesPage() {
    initializeCartoesDOM();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUserId = user.id;
        await renderCards();
    } else {
        console.error('Usuário não logado para carregar cartões.');
        cardsListElement.innerHTML = `<p class="no-cards-message">Por favor, faça login para gerenciar seus cartões.</p>`;
    }
}