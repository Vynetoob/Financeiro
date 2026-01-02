// js/lancamentos.js
import { supabase } from './supabase.js';

let currentMonth = new Date(); // Mês atual sendo exibido
let transactionsListElement;
let currentMonthYearElement;
let addEntryBtn;
let addExitBtn;
let transactionModal;
let closeButton;
let transactionForm;
let modalTitle;
let transactionIdInput;
let transactionCurrentTypeInput;
let transactionDescriptionInput;
let transactionValueInput;
let transactionDateInput;
let transactionCategorySelect;
let paymentMethodGroup;
let recurrentGroup;
let transactionRecurrentCheckbox;
let deleteTransactionBtn;
let installmentsGroup;
let transactionInstallmentsInput;
let transactionPaymentMethodSelect;
let cardSelectGroup;
let transactionCardSelect;

let currentUserId = null; // Inicializa como null

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
   FUNÇÕES DE CARREGAMENTO DE DADOS
========================= */

async function loadCategories(type, selectedCategoryId = null) {
    // CORREÇÃO: Verifica se currentUserId está definido antes de prosseguir
    if (!currentUserId) {
        console.warn("currentUserId não definido em loadCategories. Pulando carregamento de categorias.");
        return;
    }

    const { data: categories, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .or(`user_id.eq.${currentUserId},is_general.eq.true`)
        .eq('tipo', type);

    if (error) {
        console.error('Erro ao carregar categorias:', error.message);
        if (transactionCategorySelect) {
            transactionCategorySelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
        }
        return;
    }

    if (transactionCategorySelect) {
        transactionCategorySelect.innerHTML = '<option value="">Selecione uma Categoria</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            if (c.id === selectedCategoryId) opt.selected = true;
            transactionCategorySelect.appendChild(opt);
        });
    }
}

async function loadCardsForSelect(selectedCardId = null) {
    // CORREÇÃO: Verifica se currentUserId está definido antes de prosseguir
    if (!currentUserId) {
        console.warn("currentUserId não definido em loadCardsForSelect. Pulando carregamento de cartões.");
        if (transactionCardSelect) {
            transactionCardSelect.innerHTML = '<option value="">Erro ao carregar cartões</option>';
        }
        return;
    }

    const { data: cards, error } = await supabase
        .from('cartoes_credito')
        .select('id, nome_cartao')
        .eq('user_id', currentUserId)
        .order('nome_cartao', { ascending: true });

    if (error) {
        console.error('Erro ao carregar cartões para seleção:', error.message);
        if (transactionCardSelect) {
            transactionCardSelect.innerHTML = '<option value="">Erro ao carregar cartões</option>';
        }
        return;
    }

    if (transactionCardSelect) {
        transactionCardSelect.innerHTML = '<option value="">Selecione um Cartão</option>';
        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.nome_cartao;
            if (selectedCardId && card.id === selectedCardId) {
                option.selected = true;
            }
            transactionCardSelect.appendChild(option);
        });
    }
}

/* =========================
   INICIALIZAÇÃO DOM
========================= */

function initializeLancamentosDOM() {
    transactionsListElement = document.getElementById('transactions-list');
    currentMonthYearElement = document.getElementById('current-month-year');
    addEntryBtn = document.getElementById('add-entry-btn');
    addExitBtn = document.getElementById('add-exit-btn');
    transactionModal = document.getElementById('transaction-modal');
    closeButton = transactionModal ? transactionModal.querySelector('.close-button') : null; // Verificação adicionada
    transactionForm = document.getElementById('transaction-form');
    modalTitle = document.getElementById('modal-title');
    transactionIdInput = document.getElementById('transaction-id');
    transactionCurrentTypeInput = document.getElementById('transaction-current-type');
    transactionDescriptionInput = document.getElementById('transaction-description');
    transactionValueInput = document.getElementById('transaction-value');
    transactionDateInput = document.getElementById('transaction-date');
    transactionCategorySelect = document.getElementById('transaction-category');
    paymentMethodGroup = document.getElementById('payment-method-group');
    recurrentGroup = document.getElementById('recurrent-group');
    transactionRecurrentCheckbox = document.getElementById('transaction-recurrent');
    deleteTransactionBtn = document.getElementById('delete-transaction-btn');
    installmentsGroup = document.getElementById('installments-group');
    transactionInstallmentsInput = document.getElementById('transaction-installments');
    transactionPaymentMethodSelect = document.getElementById('transaction-payment-method');
    cardSelectGroup = document.getElementById('card-select-group');
    transactionCardSelect = document.getElementById('transaction-card-select');

    // Adicionar event listeners
    const prevMonthBtn = document.getElementById('prev-month'); // Verificação adicionada
    const nextMonthBtn = document.getElementById('next-month'); // Verificação adicionada

    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));
    
    if (addEntryBtn) addEntryBtn.addEventListener('click', () => openTransactionModal('entrada'));
    if (addExitBtn) addExitBtn.addEventListener('click', () => openTransactionModal('saida'));
    if (closeButton) closeButton.addEventListener('click', closeTransactionModal);
    
    window.addEventListener('click', (event) => {
        if (transactionModal && event.target == transactionModal) {
            closeTransactionModal();
        }
    });
    if (transactionForm) transactionForm.addEventListener('submit', handleTransactionSubmit);
    if (transactionPaymentMethodSelect) {
        transactionPaymentMethodSelect.addEventListener('change', () => toggleFormFields(transactionCurrentTypeInput.value));
    }
    if (deleteTransactionBtn) deleteTransactionBtn.addEventListener('click', deleteTransaction);
}

/* =========================
   FORMULÁRIO
========================= */

function toggleFormFields(type) {
    if (type === 'entrada') {
        if (paymentMethodGroup) paymentMethodGroup.style.display = 'none';
        if (recurrentGroup) recurrentGroup.style.display = 'none';
        if (installmentsGroup) installmentsGroup.style.display = 'none';
        if (cardSelectGroup) cardSelectGroup.style.display = 'none';
    } else { // type === 'saida'
        if (paymentMethodGroup) paymentMethodGroup.style.display = 'block';
        if (recurrentGroup) recurrentGroup.style.display = 'block';

        if (transactionPaymentMethodSelect && transactionPaymentMethodSelect.value === 'Credito') {
            if (installmentsGroup) installmentsGroup.style.display = 'block';
            if (cardSelectGroup) cardSelectGroup.style.display = 'block';
        } else {
            if (installmentsGroup) installmentsGroup.style.display = 'none';
            if (cardSelectGroup) cardSelectGroup.style.display = 'none';
        }
    }
    // CORREÇÃO: Adicionada verificação para currentUserId antes de chamar loadCategories
    if (currentUserId) {
        loadCategories(type);
    }
}

async function openTransactionModal(type = 'entrada', transaction = null) {
    if (transactionForm) transactionForm.reset();
    if (transactionIdInput) transactionIdInput.value = '';
    if (deleteTransactionBtn) deleteTransactionBtn.style.display = 'none';
    if (transactionRecurrentCheckbox) {
        transactionRecurrentCheckbox.checked = false;
        transactionRecurrentCheckbox.disabled = false;
    }
    if (transactionInstallmentsInput) {
        transactionInstallmentsInput.value = 1;
        transactionInstallmentsInput.disabled = false;
    }
    if (transactionCardSelect) transactionCardSelect.value = '';

    if (modalTitle) modalTitle.textContent = transaction ? 'Editar Lançamento' : (type === 'entrada' ? 'Nova Entrada' : 'Nova Saída');
    if (transactionCurrentTypeInput) transactionCurrentTypeInput.value = type;

    if (transaction && transaction.tipo === 'saida') {
        if (transactionPaymentMethodSelect) transactionPaymentMethodSelect.value = transaction.forma_pagamento || 'Dinheiro';
    } else {
        if (transactionPaymentMethodSelect) transactionPaymentMethodSelect.value = 'Dinheiro';
    }
    
    await loadCardsForSelect(transaction?.cartao_id);
    toggleFormFields(type); // toggleFormFields já chama loadCategories
    
    // await loadCategories(type, transaction?.categoria_id); // Removido, pois toggleFormFields já faz isso

    if (transaction) {
        if (transactionIdInput) transactionIdInput.value = transaction.id;
        if (transactionDescriptionInput) transactionDescriptionInput.value = transaction.descricao;
        if (transactionValueInput) transactionValueInput.value = transaction.valor;
        if (transactionDateInput) transactionDateInput.value = transaction.data;
        
        if (transaction.cartao_id) {
            if (transactionCardSelect) transactionCardSelect.value = transaction.cartao_id;
        }

        if (transaction.total_parcelas > 1) {
            if (transactionInstallmentsInput) {
                transactionInstallmentsInput.value = transaction.total_parcelas;
                transactionInstallmentsInput.disabled = true;
            }
            if (transactionRecurrentCheckbox) {
                transactionRecurrentCheckbox.checked = false;
                transactionRecurrentCheckbox.disabled = true;
            }
            if (transactionCardSelect) transactionCardSelect.disabled = true;
        } else if (transaction.recorrente_id || transaction.is_recorrente_master) {
            if (transactionRecurrentCheckbox) {
                transactionRecurrentCheckbox.checked = true;
                transactionRecurrentCheckbox.disabled = true;
            }
            if (transactionInstallmentsInput) {
                transactionInstallmentsInput.value = 1;
                transactionInstallmentsInput.disabled = true;
            }
            if (transactionCardSelect) transactionCardSelect.disabled = true;
        } else {
            if (transactionInstallmentsInput) {
                transactionInstallmentsInput.value = 1;
                transactionInstallmentsInput.disabled = false;
            }
            if (transactionRecurrentCheckbox) {
                transactionRecurrentCheckbox.checked = false;
                transactionRecurrentCheckbox.disabled = false;
            }
            if (transactionCardSelect) transactionCardSelect.disabled = false;
        }
        
        if (deleteTransactionBtn) deleteTransactionBtn.style.display = 'block';
    } else {
        if (transactionDateInput) transactionDateInput.valueAsDate = new Date();
        if (transactionInstallmentsInput) transactionInstallmentsInput.disabled = false;
        if (transactionRecurrentCheckbox) transactionRecurrentCheckbox.disabled = false;
        if (transactionCardSelect) transactionCardSelect.disabled = false;
    }

    if (transactionModal) transactionModal.style.display = 'flex';
}

function closeTransactionModal() {
    if (transactionModal) transactionModal.style.display = 'none';
}

/* =========================
   SUBMIT
========================= */

async function handleTransactionSubmit(e) {
    e.preventDefault();
    if (!currentUserId) {
        alert('Usuário não identificado.');
        return;
    }

    const isRecurrent = transactionRecurrentCheckbox.checked;
    const totalInstallments = parseInt(transactionInstallmentsInput.value);
    const transactionId = transactionIdInput.value;
    const transactionType = transactionCurrentTypeInput.value;

    let selectedCardId = null;
    if (transactionType === 'saida' && transactionPaymentMethodSelect.value === 'Credito') {
        selectedCardId = transactionCardSelect.value || null;
        if (!selectedCardId) {
            alert('Por favor, selecione um cartão de crédito.');
            return;
        }
    }

    const baseTransactionData = {
        user_id: currentUserId,
        tipo: transactionType,
        descricao: transactionDescriptionInput.value,
        valor: parseFloat(transactionValueInput.value),
        data: transactionDateInput.value,
        categoria_id: transactionCategorySelect.value || null,
        forma_pagamento: transactionType === 'saida'
            ? transactionPaymentMethodSelect.value
            : null,
        pago: false,
        cartao_id: selectedCardId,
        conta_tipo: 'individual', // Adicionado para consistência
    };

    let error;

    if (!transactionId) { // NOVO LANÇAMENTO
        if (totalInstallments > 1 && baseTransactionData.tipo === 'saida' && baseTransactionData.forma_pagamento === 'Credito') {
            const valuePerInstallment = baseTransactionData.valor / totalInstallments;
            const [y, m, d] = baseTransactionData.data.split('-').map(Number);
            const originalDateLocal = new Date(y, m - 1, d);
            const originalDay = originalDateLocal.getDate();

            let masterInstallmentId = null;
            const installmentTransactions = [];

            for (let i = 0; i < totalInstallments; i++) {
                const nextDate = new Date(originalDateLocal.getFullYear(), originalDateLocal.getMonth() + i, 1);
                const lastDayOfTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                nextDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
                const formattedDate = formatDateLocal(nextDate);

                const parcelData = {
                    ...baseTransactionData,
                    valor: valuePerInstallment,
                    data: formattedDate,
                    parcela_atual: i + 1,
                    total_parcelas: totalInstallments,
                    descricao: `${baseTransactionData.descricao} (${i + 1}/${totalInstallments})`,
                    is_recorrente_master: (i === 0), // A primeira parcela é a master da série
                    recorrente_id: (i === 0) ? null : masterInstallmentId, // As demais apontam para a master
                    frequencia: 'parcela', // Frequência para parcelas
                    data_fim_recorrencia: null,
                };

                if (i === 0) {
                    const { data: result, error: insertError } = await supabase
                        .from('lancamentos')
                        .insert([parcelData])
                        .select();
                    if (insertError) {
                        error = insertError;
                        break;
                    }
                    masterInstallmentId = result[0].id;
                    installmentTransactions.push({ ...parcelData, id: masterInstallmentId });
                } else {
                    parcelData.recorrente_id = masterInstallmentId;
                    installmentTransactions.push(parcelData);
                }
            }

            if (!error && installmentTransactions.length > 1) {
                const remainingInstallments = installmentTransactions.slice(1);
                const { error: insertRemainingError } = await supabase
                    .from('lancamentos')
                    .insert(remainingInstallments);
                error = error || insertRemainingError;
            }

        } else if (isRecurrent) {
            const [y, m, d] = baseTransactionData.data.split('-').map(Number);
            const originalDateLocal = new Date(y, m - 1, d);
            const originalDay = originalDateLocal.getDate();

            const endRecurrence = new Date(originalDateLocal.getFullYear() + 1, originalDateLocal.getMonth(), originalDay);
            const formattedEndDate = formatDateLocal(endRecurrence);

            const { data: masterTransaction, error: masterError } = await supabase.from('lancamentos').insert([{
                ...baseTransactionData,
                is_recorrente_master: true,
                frequencia: 'mensal',
                data_fim_recorrencia: formattedEndDate,
            }]).select();

            if (masterError) {
                error = masterError;
            } else {
                const masterId = masterTransaction[0].id;
                const recurringTransactions = [];

                for (let i = 1; i <= 11; i++) {
                    const nextDate = new Date(originalDateLocal.getFullYear(), originalDateLocal.getMonth() + i, 1);
                    const lastDayOfTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                    nextDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
                    const formattedNextDate = formatDateLocal(nextDate);

                    recurringTransactions.push({
                        ...baseTransactionData,
                        data: formattedNextDate,
                        recorrente_id: masterId,
                        is_recorrente_master: false,
                        frequencia: 'mensal',
                        data_fim_recorrencia: formattedEndDate,
                    });
                }

                if (recurringTransactions.length > 0) {
                    const { error: recurError } = await supabase.from('lancamentos').insert(recurringTransactions);
                    error = error || recurError;
                }
            }
        } else {
            const { error: insertError } = await supabase.from('lancamentos').insert([baseTransactionData]);
            error = insertError;
        }
    } else { // EDITANDO UM LANÇAMENTO EXISTENTE
        const { data: originalTransaction, error: fetchError } = await supabase
            .from('lancamentos')
            .select('id, recorrente_id, is_recorrente_master, total_parcelas')
            .eq('id', transactionId)
            .single();

        if (fetchError) {
            console.error('Erro ao buscar lançamento para edição:', fetchError.message);
            alert('Erro ao editar lançamento. Tente novamente.');
            return;
        }

        const { error: updateError } = await supabase
            .from('lancamentos')
            .update(baseTransactionData)
            .eq('id', transactionId)
            .eq('user_id', currentUserId);
        error = updateError;

        if (!error) {
            // Se for um lançamento mestre recorrente, atualiza as instâncias derivadas também
            if (originalTransaction.is_recorrente_master) {
                const { error: updateRecorrenteError } = await supabase
                    .from('lancamentos')
                    .update({
                        descricao: baseTransactionData.descricao,
                        valor: baseTransactionData.valor,
                        categoria_id: baseTransactionData.categoria_id,
                        forma_pagamento: baseTransactionData.forma_pagamento,
                        cartao_id: baseTransactionData.cartao_id,
                    })
                    .eq('recorrente_id', transactionId)
                    .eq('user_id', currentUserId);
                error = error || updateRecorrenteError;
            }
            // Se for uma parcela master, atualiza as parcelas derivadas também
            if (originalTransaction.total_parcelas > 1 && originalTransaction.is_recorrente_master) {
                const { error: updateParcelaError } = await supabase
                    .from('lancamentos')
                    .update({
                        descricao: baseTransactionData.descricao,
                        valor: baseTransactionData.valor,
                        categoria_id: baseTransactionData.categoria_id,
                        forma_pagamento: baseTransactionData.forma_pagamento,
                        cartao_id: baseTransactionData.cartao_id,
                    })
                    .eq('recorrente_id', transactionId)
                    .eq('user_id', currentUserId);
                error = error || updateParcelaError;
            }
        }
    }

    if (error) {
        console.error('Erro ao salvar lançamento:', error.message);
        alert('Erro ao salvar lançamento. Tente novamente.');
    } else {
        alert('Lançamento salvo com sucesso!');
        closeTransactionModal();
        await renderTransactions();
    }
}

/* =========================
   AÇÕES (PAGAR/EXCLUIR)
========================= */

async function togglePaidStatus(transactionId, currentStatus) {
    if (!currentUserId) {
        alert('Você precisa estar logado para alterar o status.');
        return;
    }

    const { error } = await supabase
        .from('lancamentos')
        .update({ pago: !currentStatus })
        .eq('id', transactionId)
        .eq('user_id', currentUserId);

    if (error) {
        console.error('Erro ao alterar status de pagamento:', error.message);
        alert('Erro ao alterar status. Tente novamente.');
    } else {
        alert('Status de pagamento atualizado com sucesso!');
        await renderTransactions();
    }
}

async function deleteTransaction() {
    const transactionId = transactionIdInput.value;
    if (!transactionId) return;

    const { data: transactionToDelete, error: fetchError } = await supabase
        .from('lancamentos')
        .select('is_recorrente_master, recorrente_id, total_parcelas')
        .eq('id', transactionId)
        .single();

    if (fetchError || !transactionToDelete) {
        console.error('Erro ao buscar lançamento para exclusão:', fetchError?.message);
        alert('Erro ao excluir lançamento. Tente novamente.');
        return;
    }

    let confirmMessage = 'Tem certeza que deseja excluir este lançamento?';
    let shouldDeleteSeries = false;

    if (transactionToDelete.is_recorrente_master) {
        confirmMessage = 'Este é o lançamento mestre de uma série recorrente ou parcelada. Deseja excluir TODA A SÉRIE?';
        shouldDeleteSeries = confirm(confirmMessage);
    } else if (transactionToDelete.recorrente_id) {
        confirmMessage = 'Este lançamento faz parte de uma série recorrente ou parcelada. Deseja excluir APENAS esta instância, ou TODA A SÉRIE? (Clique OK para série, Cancelar para instância)';
        shouldDeleteSeries = confirm(confirmMessage);
    } else if (transactionToDelete.total_parcelas > 1) {
        confirmMessage = 'Este lançamento faz parte de uma série parcelada. Deseja excluir APENAS esta parcela, ou TODA A SÉRIE? (Clique OK para série, Cancelar para parcela)';
        shouldDeleteSeries = confirm(confirmMessage);
    }

    let deleteError;
    if (shouldDeleteSeries) {
        let query = supabase.from('lancamentos').delete().eq('user_id', currentUserId);
        
        if (transactionToDelete.is_recorrente_master) {
            query = query.or(`id.eq.${transactionId},recorrente_id.eq.${transactionId}`);
        } else if (transactionToDelete.recorrente_id) {
            query = query.or(`id.eq.${transactionToDelete.recorrente_id},recorrente_id.eq.${transactionToDelete.recorrente_id}`);
        } else {
            deleteError = { message: 'Erro na lógica de exclusão da série.' };
        }
        
        const { error: seriesError } = await query;
        deleteError = seriesError;

    } else {
        const { error: instanceError } = await supabase
            .from('lancamentos')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', currentUserId);
        deleteError = instanceError;
    }

    if (deleteError) {
        console.error('Erro ao excluir lançamento:', deleteError.message);
        alert('Erro ao excluir lançamento. Tente novamente.');
    } else {
        alert('Lançamento(s) excluído(s) com sucesso!');
        closeTransactionModal();
        await renderTransactions();
    }
}

/* =========================
   RENDER
========================= */

async function renderTransactions() {
    if (!currentUserId || !transactionsListElement) return;

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data: transactions, error } = await supabase
        .from('lancamentos')
        .select('*, categorias(nome), cartoes_credito(nome_cartao)')
        .eq('user_id', currentUserId)
        .gte('data', formatDateLocal(startOfMonth))
        .lte('data', formatDateLocal(endOfMonth))
        .order('data', { ascending: false });

    if (error) {
        console.error('Erro ao buscar lançamentos:', error.message);
        transactionsListElement.innerHTML = `<p class="no-transactions-message">Erro ao carregar lançamentos.</p>`;
        return;
    }

    if (transactions.length === 0) {
        transactionsListElement.innerHTML = `<p class="no-transactions-message">Nenhum lançamento encontrado para este mês.</p>`;
        return;
    }

    transactionsListElement.innerHTML = '';
    transactions.forEach(transaction => {
        const [year, month, day] = transaction.data.split('-').map(Number);
        const displayDate = new Date(year, month - 1, day);

        const transactionItem = document.createElement('div');
        transactionItem.classList.add('transaction-item');
        transactionItem.classList.add(transaction.pago ? 'paid' : 'unpaid');
        
        if (transaction.total_parcelas > 1) {
            transactionItem.classList.add('installment-transaction');
        } else if (transaction.recorrente_id || transaction.is_recorrente_master) {
            transactionItem.classList.add('recurrent-transaction');
        } else if (transaction.conta_tipo === 'individual_derivado') { // Novo estilo para lançamentos derivados de conjunto
            transactionItem.classList.add('derived-joint-transaction');
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
        } else if (transaction.conta_tipo === 'individual_derivado') {
            seriesIndicator = ' 🤝 '; // Ícone para lançamento derivado de conjunto
        }

        const cardNameDisplay = transaction.cartoes_credito ? ` | ${transaction.cartoes_credito.nome_cartao}` : '';


        transactionItem.innerHTML = `
            <div class="transaction-icon ${iconClass}">${icon}</div>
            <div class="transaction-details">
                <div class="description">${transaction.descricao}${seriesIndicator}</div>
                <div class="info">
                    ${displayDate.toLocaleDateString('pt-BR')} |
                    ${categoryName}
                    ${cardNameDisplay}
                    ${transaction.forma_pagamento || ''}
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">${formatCurrency(transaction.valor)}</div>
            <div class="transaction-actions-item">
                <button class="btn-small btn-edit" data-id="${transaction.id}">✏️</button>
                <button class="btn-small btn-mark-paid ${transaction.pago ? 'paid' : ''}" data-id="${transaction.id}" data-paid="${transaction.pago}">
                    ${transaction.pago ? '✅ Pago' : 'Pagar'}
                </button>
            </div>
        `;
        transactionsListElement.appendChild(transactionItem);
    });

    transactionsListElement.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const transaction = transactions.find(t => t.id === id);
            if (transaction) {
                openTransactionModal(transaction.tipo, transaction);
            }
        });
    });

    transactionsListElement.querySelectorAll('.btn-mark-paid').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const paidStatus = e.target.dataset.paid === 'true';
            togglePaidStatus(id, paidStatus);
        });
    });
}

/* =========================
   MÊS
========================= */

function updateMonthDisplay() {
    if (currentMonthYearElement) {
        currentMonthYearElement.textContent =
            currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
}

async function changeMonth(offset) {
    currentMonth.setMonth(currentMonth.getMonth() + offset);
    updateMonthDisplay();
    await renderTransactions();
}

/* =========================
   CARREGAMENTO INICIAL
========================= */

// CORREÇÃO: Nova função para carregar o user_id
async function loadCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUserId = user.id;
    } else {
        console.error('Usuário não logado.');
        currentUserId = null; // Garante que é null se não estiver logado
    }
}

export async function initLancamentosPage() {
    initializeLancamentosDOM();
    await loadCurrentUserId(); // CORREÇÃO: Carrega o user_id antes de renderizar
    if (transactionsListElement) { // Garante que o DOM foi inicializado
        updateMonthDisplay();
        await renderTransactions();
        toggleFormFields('entrada'); // Chama toggleFormFields que agora verifica currentUserId
    } else {
        console.error("DOM para página de lançamentos não foi totalmente inicializado. Verifique o HTML.");
    }
}