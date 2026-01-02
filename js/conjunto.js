// js/conjunto.js
import { supabase } from './supabase.js';

let currentMonthConjunto = new Date(); // Mês atual sendo exibido
let transactionsListConjuntoElement;
let currentMonthYearConjuntoElement;
let addEntryBtnConjunto;
let addExitBtnConjunto;
let transactionModalConjunto;
let closeButtonConjunto;
let transactionFormConjunto;
let modalTitleConjunto;
let transactionIdInputConjunto;
let transactionCurrentTypeInputConjunto;
let transactionDescriptionInputConjunto;
let transactionValueInputConjunto;
let transactionDateInputConjunto;
let transactionCategorySelectConjunto;
let paymentMethodGroupConjunto;
let recurrentGroupConjunto;
let transactionRecurrentCheckboxConjunto;
let deleteTransactionBtnConjunto;
let installmentsGroupConjunto;
let transactionInstallmentsInputConjunto;
let transactionPaymentMethodSelectConjunto;
let cardSelectGroupConjunto;
let transactionCardSelectConjunto;

let currentUserId = null;
let currentPartnerId = null;

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

// Função para carregar categorias conjuntas
async function loadCategoriesConjunto(type, selectedCategoryId = null) {
    // CORREÇÃO: Verifica se currentUserId está definido antes de prosseguir
    if (!currentUserId) {
        console.warn("currentUserId não definido em loadCategoriesConjunto. Pulando carregamento de categorias.");
        return;
    }

    const { data: categories, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .or(`user_id.eq.${currentUserId},is_general.eq.true`)
        .eq('tipo', type);

    if (error) {
        console.error('Erro ao carregar categorias:', error.message);
        if (transactionCategorySelectConjunto) {
            transactionCategorySelectConjunto.innerHTML = '<option value="">Erro ao carregar categorias</option>';
        }
        return;
    }

    if (transactionCategorySelectConjunto) {
        transactionCategorySelectConjunto.innerHTML = '<option value="">Selecione uma Categoria</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            if (c.id === selectedCategoryId) opt.selected = true;
            transactionCategorySelectConjunto.appendChild(opt);
        });
    }
}


// Função para carregar cartões no select conjunto
async function loadCardsForSelectConjunto(selectedCardId = null) {
    // CORREÇÃO: Verifica se currentUserId está definido antes de prosseguir
    if (!currentUserId) {
        console.warn("currentUserId não definido em loadCardsForSelectConjunto. Pulando carregamento de cartões.");
        if (transactionCardSelectConjunto) {
            transactionCardSelectConjunto.innerHTML = '<option value="">Erro ao carregar cartões</option>';
        }
        return;
    }

    const { data: cards, error } = await supabase
        .from('cartoes_credito')
        .select('id, nome_cartao')
        .eq('user_id', currentUserId) // Usa currentUserId
        .order('nome_cartao', { ascending: true });

    if (error) {
        console.error('Erro ao carregar cartões para seleção conjunta:', error.message);
        if (transactionCardSelectConjunto) {
            transactionCardSelectConjunto.innerHTML = '<option value="">Erro ao carregar cartões</option>';
        }
        return;
    }

    if (transactionCardSelectConjunto) {
        transactionCardSelectConjunto.innerHTML = '<option value="">Selecione um Cartão</option>';
        cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.nome_cartao;
            if (selectedCardId && card.id === selectedCardId) {
                option.selected = true;
            }
            transactionCardSelectConjunto.appendChild(option);
        });
    }
}


/* =========================
   INICIALIZAÇÃO DOM
========================= */

function initializeConjuntoDOM() {
    transactionsListConjuntoElement = document.getElementById('transactions-list-conjunto');
    currentMonthYearConjuntoElement = document.getElementById('current-month-year-conjunto');
    addEntryBtnConjunto = document.getElementById('add-entry-btn-conjunto');
    addExitBtnConjunto = document.getElementById('add-exit-btn-conjunto');
    transactionModalConjunto = document.getElementById('transaction-modal-conjunto');
    
    if (transactionModalConjunto) { // Verificação adicionada
        closeButtonConjunto = transactionModalConjunto.querySelector('.close-button'); // Corrigido para .close-button
    }

    transactionFormConjunto = document.getElementById('transaction-form-conjunto');
    modalTitleConjunto = document.getElementById('modal-title-conjunto');
    transactionIdInputConjunto = document.getElementById('transaction-id-conjunto');
    transactionCurrentTypeInputConjunto = document.getElementById('transaction-current-type-conjunto');
    transactionDescriptionInputConjunto = document.getElementById('transaction-description-conjunto');
    transactionValueInputConjunto = document.getElementById('transaction-value-conjunto');
    transactionDateInputConjunto = document.getElementById('transaction-date-conjunto');
    transactionCategorySelectConjunto = document.getElementById('transaction-category-conjunto');
    paymentMethodGroupConjunto = document.getElementById('payment-method-group-conjunto');
    recurrentGroupConjunto = document.getElementById('recurrent-group-conjunto');
    transactionRecurrentCheckboxConjunto = document.getElementById('transaction-recurrent-conjunto');
    deleteTransactionBtnConjunto = document.getElementById('delete-transaction-btn-conjunto');
    installmentsGroupConjunto = document.getElementById('installments-group-conjunto');
    transactionInstallmentsInputConjunto = document.getElementById('transaction-installments-conjunto');
    transactionPaymentMethodSelectConjunto = document.getElementById('transaction-payment-method-conjunto');
    cardSelectGroupConjunto = document.getElementById('card-select-group-conjunto');
    transactionCardSelectConjunto = document.getElementById('transaction-card-select-conjunto');


    // Adicionar event listeners com verificações de existência
    const prevBtnConjunto = document.getElementById('prev-month-conjunto');
    const nextBtnConjunto = document.getElementById('next-month-conjunto');

    if (prevBtnConjunto) prevBtnConjunto.addEventListener('click', () => changeMonthConjunto(-1));
    if (nextBtnConjunto) nextBtnConjunto.addEventListener('click', () => changeMonthConjunto(1));
    
    if (addEntryBtnConjunto) addEntryBtnConjunto.addEventListener('click', () => openTransactionModalConjunto('entrada'));
    if (addExitBtnConjunto) addExitBtnConjunto.addEventListener('click', () => openTransactionModalConjunto('saida'));
    if (closeButtonConjunto) closeButtonConjunto.addEventListener('click', closeTransactionModalConjunto);
    
    window.addEventListener('click', (event) => {
        if (transactionModalConjunto && event.target == transactionModalConjunto) {
            closeTransactionModalConjunto();
        }
    });
    if (transactionFormConjunto) transactionFormConjunto.addEventListener('submit', handleTransactionSubmitConjunto);
    if (transactionPaymentMethodSelectConjunto) {
        transactionPaymentMethodSelectConjunto.addEventListener('change', () => toggleFormFieldsConjunto(transactionCurrentTypeInputConjunto.value));
    }
    if (deleteTransactionBtnConjunto) deleteTransactionBtnConjunto.addEventListener('click', deleteTransactionConjunto);
}

/* =========================
   FORMULÁRIO
========================= */

function toggleFormFieldsConjunto(type) {
    if (type === 'entrada') {
        if (paymentMethodGroupConjunto) paymentMethodGroupConjunto.style.display = 'none';
        if (recurrentGroupConjunto) recurrentGroupConjunto.style.display = 'none';
        if (installmentsGroupConjunto) installmentsGroupConjunto.style.display = 'none';
        if (cardSelectGroupConjunto) cardSelectGroupConjunto.style.display = 'none';
    } else { // type === 'saida'
        if (paymentMethodGroupConjunto) paymentMethodGroupConjunto.style.display = 'block';
        if (recurrentGroupConjunto) recurrentGroupConjunto.style.display = 'block';

        if (transactionPaymentMethodSelectConjunto && transactionPaymentMethodSelectConjunto.value === 'Credito') {
            if (installmentsGroupConjunto) installmentsGroupConjunto.style.display = 'block';
            if (cardSelectGroupConjunto) cardSelectGroupConjunto.style.display = 'block';
        } else {
            if (installmentsGroupConjunto) installmentsGroupConjunto.style.display = 'none';
            if (cardSelectGroupConjunto) cardSelectGroupConjunto.style.display = 'none';
        }
    }
    // CORREÇÃO: Adicionada verificação para currentUserId antes de chamar loadCategoriesConjunto
    if (currentUserId) {
        loadCategoriesConjunto(type);
    }
}


async function openTransactionModalConjunto(type = 'entrada', transaction = null) {
    if (transactionFormConjunto) transactionFormConjunto.reset();
    if (transactionIdInputConjunto) transactionIdInputConjunto.value = '';
    if (deleteTransactionBtnConjunto) deleteTransactionBtnConjunto.style.display = 'none';
    if (transactionRecurrentCheckboxConjunto) {
        transactionRecurrentCheckboxConjunto.checked = false;
        transactionRecurrentCheckboxConjunto.disabled = false;
    }
    if (transactionInstallmentsInputConjunto) {
        transactionInstallmentsInputConjunto.value = 1;
        transactionInstallmentsInputConjunto.disabled = false;
    }
    if (transactionCardSelectConjunto) transactionCardSelectConjunto.value = '';

    if (modalTitleConjunto) modalTitleConjunto.textContent = transaction ? 'Editar Lançamento Conjunto' : (type === 'entrada' ? 'Nova Entrada Conjunta' : 'Nova Saída Conjunta');
    if (transactionCurrentTypeInputConjunto) transactionCurrentTypeInputConjunto.value = type;

    if (transaction && transaction.tipo === 'saida') {
        if (transactionPaymentMethodSelectConjunto) transactionPaymentMethodSelectConjunto.value = transaction.forma_pagamento || 'Dinheiro';
    } else {
        if (transactionPaymentMethodSelectConjunto) transactionPaymentMethodSelectConjunto.value = 'Dinheiro';
    }
    
    await loadCardsForSelectConjunto(transaction?.cartao_id);
    toggleFormFieldsConjunto(type); // toggleFormFieldsConjunto já chama loadCategoriesConjunto
    
    // await loadCategoriesConjunto(type, transaction?.categoria_id); // Removido, pois toggleFormFieldsConjunto já faz isso

    if (transaction) {
        if (transactionIdInputConjunto) transactionIdInputConjunto.value = transaction.id;
        if (transactionDescriptionInputConjunto) transactionDescriptionInputConjunto.value = transaction.descricao;
        if (transactionValueInputConjunto) transactionValueInputConjunto.value = transaction.valor;
        if (transactionDateInputConjunto) transactionDateInputConjunto.value = transaction.data;
        
        if (transaction.cartao_id) {
            if (transactionCardSelectConjunto) transactionCardSelectConjunto.value = transaction.cartao_id;
        }

        if (transaction.total_parcelas > 1) {
            if (transactionInstallmentsInputConjunto) {
                transactionInstallmentsInputConjunto.value = transaction.total_parcelas;
                transactionInstallmentsInputConjunto.disabled = true;
            }
            if (transactionRecurrentCheckboxConjunto) {
                transactionRecurrentCheckboxConjunto.checked = false;
                transactionRecurrentCheckboxConjunto.disabled = true;
            }
            if (transactionCardSelectConjunto) transactionCardSelectConjunto.disabled = true;
        } else if (transaction.recorrente_id || transaction.is_recorrente_master) {
            if (transactionRecurrentCheckboxConjunto) {
                transactionRecurrentCheckboxConjunto.checked = true;
                transactionRecurrentCheckboxConjunto.disabled = true;
            }
            if (transactionInstallmentsInputConjunto) {
                transactionInstallmentsInputConjunto.value = 1;
                transactionInstallmentsInputConjunto.disabled = true;
            }
            if (transactionCardSelectConjunto) transactionCardSelectConjunto.disabled = true;
        } else {
            if (transactionInstallmentsInputConjunto) {
                transactionInstallmentsInputConjunto.value = 1;
                transactionInstallmentsInputConjunto.disabled = false;
            }
            if (transactionRecurrentCheckboxConjunto) {
                transactionRecurrentCheckboxConjunto.checked = false;
                transactionRecurrentCheckboxConjunto.disabled = false;
            }
            if (transactionCardSelectConjunto) transactionCardSelectConjunto.disabled = false;
        }
        
        if (deleteTransactionBtnConjunto) deleteTransactionBtnConjunto.style.display = 'block';
    } else {
        if (transactionDateInputConjunto) transactionDateInputConjunto.valueAsDate = new Date();
        if (transactionInstallmentsInputConjunto) transactionInstallmentsInputConjunto.disabled = false;
        if (transactionRecurrentCheckboxConjunto) transactionRecurrentCheckboxConjunto.disabled = false;
        if (transactionCardSelectConjunto) transactionCardSelectConjunto.disabled = false;
    }

    if (transactionModalConjunto) transactionModalConjunto.style.display = 'flex';
}

function closeTransactionModalConjunto() {
    if (transactionModalConjunto) transactionModalConjunto.style.display = 'none';
}

/* =========================
   SUBMIT
========================= */

async function handleTransactionSubmitConjunto(e) {
    e.preventDefault();
    if (!currentUserId || !currentPartnerId) {
        alert('Usuário ou parceiro não identificado. Não é possível salvar lançamentos conjuntos.');
        return;
    }

    const isRecurrent = transactionRecurrentCheckboxConjunto.checked;
    const totalInstallments = parseInt(transactionInstallmentsInputConjunto.value);
    const transactionId = transactionIdInputConjunto.value;
    const transactionType = transactionCurrentTypeInputConjunto.value;

    let selectedCardId = null;
    if (transactionType === 'saida' && transactionPaymentMethodSelectConjunto.value === 'Credito') {
        selectedCardId = transactionCardSelectConjunto.value || null;
        if (!selectedCardId) {
            alert('Por favor, selecione um cartão de crédito.');
            return;
        }
    }

    const baseTransactionDataConjunto = { // Dados para lancamentos_conjuntos
        user_id_criador: currentUserId,
        user_id_parceiro: currentPartnerId,
        tipo: transactionType,
        descricao: transactionDescriptionInputConjunto.value,
        valor: parseFloat(transactionValueInputConjunto.value),
        data: transactionDateInputConjunto.value,
        categoria_id: transactionCategorySelectConjunto.value || null,
        forma_pagamento: transactionType === 'saida'
            ? transactionPaymentMethodSelectConjunto.value
            : null,
        pago: false,
        conta_tipo: 'conjunta',
        cartao_id: selectedCardId
    };

    let error;
    const dividedValue = baseTransactionDataConjunto.valor / 2; // Divisão igualitária

    if (!transactionId) { // NOVO LANÇAMENTO
        if (totalInstallments > 1 && baseTransactionDataConjunto.tipo === 'saida' && baseTransactionDataConjunto.forma_pagamento === 'Credito') {
            // Lógica para parcelamento conjunto
            const valuePerInstallmentConjunto = baseTransactionDataConjunto.valor / totalInstallments;
            const valuePerInstallmentIndividual = dividedValue / totalInstallments;

            const [y, m, d] = baseTransactionDataConjunto.data.split('-').map(Number);
            const originalDateLocal = new Date(y, m - 1, d);
            const originalDay = originalDateLocal.getDate();

            let masterInstallmentId = null; // ID do primeiro lançamento da série de parcelas
            const installmentTransactionsConjunto = [];
            const installmentTransactionsIndividual = [];

            for (let i = 0; i < totalInstallments; i++) {
                const nextDate = new Date(originalDateLocal.getFullYear(), originalDateLocal.getMonth() + i, 1);
                const lastDayOfTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                nextDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
                const formattedDate = formatDateLocal(nextDate);

                const jointParcelData = {
                    ...baseTransactionDataConjunto,
                    valor: valuePerInstallmentConjunto,
                    data: formattedDate,
                    parcela_atual: i + 1,
                    total_parcelas: totalInstallments,
                    descricao: `${baseTransactionDataConjunto.descricao} (${i + 1}/${totalInstallments})`,
                    is_recorrente_master: (i === 0), // A primeira parcela é a master da série
                    recorrente_id: (i === 0) ? null : masterInstallmentId, // As demais apontam para a master
                    frequencia: 'parcela', // Adiciona frequência para diferenciar de 'mensal'
                    data_fim_recorrencia: null, // Não se aplica diretamente aqui
                };

                // Insere a primeira parcela e captura seu ID
                if (i === 0) {
                    const { data: result, error: insertError } = await supabase
                        .from('lancamentos_conjuntos')
                        .insert([jointParcelData])
                        .select();
                    if (insertError) {
                        error = insertError;
                        break;
                    }
                    masterInstallmentId = result[0].id; // Captura o ID da primeira parcela
                    installmentTransactionsConjunto.push({ ...jointParcelData, id: masterInstallmentId });
                } else {
                    // Para as demais parcelas, define recorrente_id para o masterInstallmentId
                    jointParcelData.recorrente_id = masterInstallmentId;
                    installmentTransactionsConjunto.push(jointParcelData);
                }

                // Cria os lançamentos individuais derivados para cada parcela conjunta
                const individualDerivedBase = {
                    tipo: jointParcelData.tipo,
                    descricao: jointParcelData.descricao,
                    valor: valuePerInstallmentIndividual,
                    data: jointParcelData.data,
                    categoria_id: jointParcelData.categoria_id,
                    forma_pagamento: jointParcelData.forma_pagamento,
                    pago: jointParcelData.pago,
                    cartao_id: jointParcelData.cartao_id,
                    parcela_atual: jointParcelData.parcela_atual,
                    total_parcelas: jointParcelData.total_parcelas,
                    is_recorrente_master: jointParcelData.is_recorrente_master,
                    recorrente_id: jointParcelData.recorrente_id, // Aponta para o masterInstallmentId
                    frequencia: jointParcelData.frequencia,
                    data_fim_recorrencia: jointParcelData.data_fim_recorrencia,
                    conta_tipo: 'individual_derivado',
                    lancamento_conjunto_id: masterInstallmentId, // Vincula ao ID da primeira parcela conjunta
                };

                installmentTransactionsIndividual.push({ ...individualDerivedBase, user_id: currentUserId, descricao: `${jointParcelData.descricao} (Sua parte)` });
                installmentTransactionsIndividual.push({ ...individualDerivedBase, user_id: currentPartnerId, descricao: `${jointParcelData.descricao} (Parte do parceiro)` });
            }

            // Finaliza a inserção das parcelas conjuntas restantes
            if (!error && installmentTransactionsConjunto.length > 1) {
                const remainingInstallments = installmentTransactionsConjunto.slice(1);
                const { error: insertRemainingError } = await supabase
                    .from('lancamentos_conjuntos')
                    .insert(remainingInstallments);
                error = error || insertRemainingError;
            }

            // Insere todos os lançamentos individuais derivados
            if (!error && installmentTransactionsIndividual.length > 0) {
                const { error: insertIndividualError } = await supabase
                    .from('lancamentos')
                    .insert(installmentTransactionsIndividual);
                error = error || insertIndividualError;
            }

        } else if (isRecurrent) { // Lançamento conjunto recorrente
            const [y, m, d] = baseTransactionDataConjunto.data.split('-').map(Number);
            const originalDateLocal = new Date(y, m - 1, d);
            const originalDay = originalDateLocal.getDate();

            const endRecurrence = new Date(originalDateLocal.getFullYear() + 1, originalDateLocal.getMonth(), originalDay);
            const formattedEndDate = formatDateLocal(endRecurrence);

            // Insere o lançamento mestre conjunto
            const { data: masterConjunto, error: masterErrorConjunto } = await supabase.from('lancamentos_conjuntos').insert([{
                ...baseTransactionDataConjunto,
                is_recorrente_master: true,
                frequencia: 'mensal',
                data_fim_recorrencia: formattedEndDate,
            }]).select();

            if (masterErrorConjunto) {
                error = masterErrorConjunto;
            } else {
                const masterIdConjunto = masterConjunto[0].id;

                // Cria o lançamento mestre individual derivado para cada usuário
                const individualMasterBase = {
                    tipo: baseTransactionDataConjunto.tipo,
                    descricao: baseTransactionDataConjunto.descricao,
                    valor: dividedValue,
                    data: baseTransactionDataConjunto.data,
                    categoria_id: baseTransactionDataConjunto.categoria_id,
                    forma_pagamento: baseTransactionDataConjunto.forma_pagamento,
                    pago: baseTransactionDataConjunto.pago,
                    cartao_id: baseTransactionDataConjunto.cartao_id,
                    conta_tipo: 'individual_derivado',
                    lancamento_conjunto_id: masterIdConjunto,
                    is_recorrente_master: true,
                    frequencia: 'mensal',
                    data_fim_recorrencia: formattedEndDate,
                };

                const masterIndividualDerived = [{
                    ...individualMasterBase,
                    user_id: currentUserId,
                    descricao: `${baseTransactionDataConjunto.descricao} (Sua parte)`
                }, {
                    ...individualMasterBase,
                    user_id: currentPartnerId,
                    descricao: `${baseTransactionDataConjunto.descricao} (Parte do parceiro)`
                }];

                const { data: masterIndividualResult, error: masterIndividualError } = await supabase.from('lancamentos').insert(masterIndividualDerived).select();
                if (masterIndividualError) {
                    error = error || masterIndividualError;
                } else {
                    const masterIdIndividualUser = masterIndividualResult[0].id;
                    const masterIdIndividualPartner = masterIndividualResult[1].id;

                    const recurringConjunto = [];
                    const recurringIndividual = [];

                    for (let i = 1; i <= 11; i++) {
                        const nextDate = new Date(originalDateLocal.getFullYear(), originalDateLocal.getMonth() + i, 1);
                        const lastDayOfTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                        nextDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
                        const formattedNextDate = formatDateLocal(nextDate);

                        // Recorrência Conjunta
                        recurringConjunto.push({
                            ...baseTransactionDataConjunto,
                            data: formattedNextDate,
                            recorrente_id: masterIdConjunto,
                            is_recorrente_master: false,
                            frequencia: 'mensal',
                            data_fim_recorrencia: formattedEndDate,
                        });

                        // Recorrência Individual Derivada
                        const individualRecurringBase = {
                            tipo: baseTransactionDataConjunto.tipo,
                            descricao: baseTransactionDataConjunto.descricao,
                            valor: dividedValue,
                            data: formattedNextDate,
                            categoria_id: baseTransactionDataConjunto.categoria_id,
                            forma_pagamento: baseTransactionDataConjunto.forma_pagamento,
                            pago: baseTransactionDataConjunto.pago,
                            cartao_id: baseTransactionDataConjunto.cartao_id,
                            conta_tipo: 'individual_derivado',
                            lancamento_conjunto_id: masterIdConjunto,
                            is_recorrente_master: false,
                            frequencia: 'mensal',
                            data_fim_recorrencia: formattedEndDate,
                        };

                        recurringIndividual.push({
                            ...individualRecurringBase,
                            user_id: currentUserId,
                            recorrente_id: masterIdIndividualUser,
                            descricao: `${baseTransactionDataConjunto.descricao} (Sua parte)`
                        });
                        recurringIndividual.push({
                            ...individualRecurringBase,
                            user_id: currentPartnerId,
                            recorrente_id: masterIdIndividualPartner,
                            descricao: `${baseTransactionDataConjunto.descricao} (Parte do parceiro)`
                        });
                    }

                    if (recurringConjunto.length > 0) {
                        const { error: recurErrorConjunto } = await supabase
                            .from('lancamentos_conjuntos')
                            .insert(recurringConjunto);
                        error = error || recurErrorConjunto;
                    }
                    if (recurringIndividual.length > 0) {
                        const { error: recurErrorIndividual } = await supabase
                            .from('lancamentos')
                            .insert(recurringIndividual);
                        error = error || recurErrorIndividual;
                    }
                }
            }
        } else { // Lançamento conjunto único
            // Insere o lançamento conjunto
            const { data: resultConjunto, error: insertErrorConjunto } = await supabase
                .from('lancamentos_conjuntos')
                .insert([baseTransactionDataConjunto])
                .select();

            if (insertErrorConjunto) {
                error = insertErrorConjunto;
            } else {
                const jointTransactionId = resultConjunto[0].id;

                // Cria os lançamentos individuais derivados
                const individualDerivedSingleBase = {
                    tipo: baseTransactionDataConjunto.tipo,
                    descricao: baseTransactionDataConjunto.descricao,
                    valor: dividedValue,
                    data: baseTransactionDataConjunto.data,
                    categoria_id: baseTransactionDataConjunto.categoria_id,
                    forma_pagamento: baseTransactionDataConjunto.forma_pagamento,
                    pago: baseTransactionDataConjunto.pago,
                    cartao_id: baseTransactionDataConjunto.cartao_id,
                    conta_tipo: 'individual_derivado',
                    lancamento_conjunto_id: jointTransactionId,
                };

                const individualDerived = [{
                    ...individualDerivedSingleBase,
                    user_id: currentUserId,
                    descricao: `${baseTransactionDataConjunto.descricao} (Sua parte)`
                }, {
                    ...individualDerivedSingleBase,
                    user_id: currentPartnerId,
                    descricao: `${baseTransactionDataConjunto.descricao} (Parte do parceiro)`
                }];

                const { error: insertErrorIndividual } = await supabase
                    .from('lancamentos')
                    .insert(individualDerived);
                error = error || insertErrorIndividual;
            }
        }
    } else { // EDITANDO UM LANÇAMENTO EXISTENTE
        // Busca o lançamento conjunto original
        const { data: originalConjunto, error: fetchError } = await supabase
            .from('lancamentos_conjuntos')
            .select('id, recorrente_id, is_recorrente_master, total_parcelas')
            .eq('id', transactionId)
            .single();

        if (fetchError) {
            console.error('Erro ao buscar lançamento conjunto para edição:', fetchError.message);
            alert('Erro ao editar lançamento. Tente novamente.');
            return;
        }

        // Atualiza o lançamento conjunto
        const { error: updateErrorConjunto } = await supabase
            .from('lancamentos_conjuntos')
            .update(baseTransactionDataConjunto)
            .eq('id', transactionId)
            .or(`user_id_criador.eq.${currentUserId},user_id_parceiro.eq.${currentUserId}`);
        error = updateErrorConjunto;

        if (!error) {
            // Atualiza os lançamentos individuais derivados
            const { error: updateErrorIndividual } = await supabase
                .from('lancamentos')
                .update({
                    descricao: `${baseTransactionDataConjunto.descricao} (Sua parte)`,
                    valor: dividedValue,
                    data: baseTransactionDataConjunto.data,
                    categoria_id: baseTransactionDataConjunto.categoria_id,
                    forma_pagamento: baseTransactionDataConjunto.forma_pagamento,
                    cartao_id: baseTransactionDataConjunto.cartao_id,
                })
                .eq('lancamento_conjunto_id', transactionId)
                .or(`user_id.eq.${currentUserId},user_id.eq.${currentPartnerId}`);
            error = error || updateErrorIndividual;

            // Se for um lançamento mestre recorrente conjunto, atualiza as instâncias derivadas também
            if (originalConjunto.is_recorrente_master) {
                const { error: updateErrorRecorrenteIndividual } = await supabase
                    .from('lancamentos')
                    .update({
                        descricao: `${baseTransactionDataConjunto.descricao} (Sua parte)`,
                        valor: dividedValue,
                        categoria_id: baseTransactionDataConjunto.categoria_id,
                        forma_pagamento: baseTransactionDataConjunto.forma_pagamento,
                        cartao_id: baseTransactionDataConjunto.cartao_id,
                    })
                    .eq('lancamento_conjunto_id', transactionId)
                    .or(`user_id.eq.${currentUserId},user_id.eq.${currentPartnerId}`);
                error = error || updateErrorRecorrenteIndividual;
            }
            // Se for uma parcela conjunta, atualiza as parcelas derivadas também
            if (originalConjunto.total_parcelas > 1) {
                 const { error: updateErrorParcelaIndividual } = await supabase
                    .from('lancamentos')
                    .update({
                        descricao: `${baseTransactionDataConjunto.descricao} (Sua parte)`,
                        valor: dividedValue,
                        categoria_id: baseTransactionDataConjunto.categoria_id,
                        forma_pagamento: baseTransactionDataConjunto.forma_pagamento,
                        cartao_id: baseTransactionDataConjunto.cartao_id,
                    })
                    .eq('lancamento_conjunto_id', transactionId)
                    .or(`user_id.eq.${currentUserId},user_id.eq.${currentPartnerId}`);
                error = error || updateErrorParcelaIndividual;
            }
        }
    }

    if (error) {
        console.error('Erro ao salvar lançamento conjunto:', error.message);
        alert('Erro ao salvar lançamento conjunto. Tente novamente.');
    } else {
        alert('Lançamento conjunto salvo com sucesso!');
        closeTransactionModalConjunto();
        await renderTransactionsConjunto();
    }
}

/* =========================
   AÇÕES (PAGAR/EXCLUIR)
========================= */

async function togglePaidStatusConjunto(transactionId, currentStatus) {
    if (!currentUserId) {
        alert('Você precisa estar logado para alterar o status.');
        return;
    }

    // Atualiza o status pago do lançamento conjunto
    const { error: updateConjuntoError } = await supabase
        .from('lancamentos_conjuntos')
        .update({ pago: !currentStatus })
        .eq('id', transactionId)
        .or(`user_id_criador.eq.${currentUserId},user_id_parceiro.eq.${currentUserId}`);

    if (updateConjuntoError) {
        console.error('Erro ao alterar status de pagamento conjunto:', updateConjuntoError.message);
        alert('Erro ao alterar status. Tente novamente.');
        return;
    }

    // Sincroniza o status pago dos lançamentos individuais derivados
    const { error: updateIndividualError } = await supabase
        .from('lancamentos')
        .update({ pago: !currentStatus })
        .eq('lancamento_conjunto_id', transactionId)
        .or(`user_id.eq.${currentUserId},user_id.eq.${currentPartnerId}`);

    if (updateIndividualError) {
        console.error('Erro ao sincronizar status de pagamento individual derivado:', updateIndividualError.message);
        alert('Erro ao sincronizar status. Tente novamente.');
        return;
    }

    alert('Status de pagamento atualizado com sucesso!');
    await renderTransactionsConjunto();
}

async function deleteTransactionConjunto() {
    const transactionId = transactionIdInputConjunto.value;
    if (!transactionId) return;

    // Busca o lançamento para obter informações de recorrência/parcelamento
    const { data: transactionToDelete, error: fetchError } = await supabase
        .from('lancamentos_conjuntos')
        .select('is_recorrente_master, recorrente_id, total_parcelas, user_id_criador, user_id_parceiro')
        .eq('id', transactionId)
        .single();

    if (fetchError || !transactionToDelete) {
        console.error('Erro ao buscar lançamento para exclusão:', fetchError?.message);
        alert('Erro ao excluir lançamento. Tente novamente.');
        return;
    }

    let confirmMessage = 'Tem certeza que deseja excluir este lançamento conjunto?';
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Você precisa estar logado para excluir lançamentos.');
        return;
    }

    if (transactionToDelete.user_id_criador !== user.id && transactionToDelete.user_id_parceiro !== user.id) {
        alert('Você não tem permissão para excluir este lançamento.');
        return;
    }

    let deleteError;
    if (shouldDeleteSeries) {
        let query = supabase.from('lancamentos_conjuntos').delete();
        
        if (transactionToDelete.is_recorrente_master) {
            query = query.or(`id.eq.${transactionId},recorrente_id.eq.${transactionId}`);
        } else if (transactionToDelete.recorrente_id) {
            query = query.or(`id.eq.${transactionToDelete.recorrente_id},recorrente_id.eq.${transactionToDelete.recorrente_id}`);
        } else {
            deleteError = { message: 'Erro na lógica de exclusão da série.' };
        }
        
        const { error: seriesError } = await query;
        deleteError = seriesError;

        // Deleta também os lançamentos individuais derivados
        if (!deleteError) {
            let individualQuery = supabase.from('lancamentos').delete();
            if (transactionToDelete.is_recorrente_master) {
                individualQuery = individualQuery.or(`lancamento_conjunto_id.eq.${transactionId},recorrente_id.eq.${transactionId}`);
            } else if (transactionToDelete.recorrente_id) {
                individualQuery = individualQuery.or(`lancamento_conjunto_id.eq.${transactionToDelete.recorrente_id},recorrente_id.eq.${transactionToDelete.recorrente_id}`);
            }
            const { error: individualSeriesError } = await individualQuery;
            deleteError = deleteError || individualSeriesError;
        }

    } else { // Excluir apenas a instância atual
        const { error: instanceError } = await supabase
            .from('lancamentos_conjuntos')
            .delete()
            .eq('id', transactionId);
        deleteError = instanceError;

        // Deleta também os lançamentos individuais derivados
        if (!deleteError) {
            const { error: individualInstanceError } = await supabase
                .from('lancamentos')
                .delete()
                .eq('lancamento_conjunto_id', transactionId);
            deleteError = deleteError || individualInstanceError;
        }
    }


    if (deleteError) {
        console.error('Erro ao excluir lançamento conjunto:', deleteError.message);
        alert('Erro ao excluir lançamento conjunto. Tente novamente.');
    } else {
        alert('Lançamento(s) conjunto(s) excluído(s) com sucesso!');
        closeTransactionModalConjunto();
        await renderTransactionsConjunto();
    }
}

/* =========================
   RENDER
========================= */

async function renderTransactionsConjunto() {
    if (!currentUserId || !transactionsListConjuntoElement) return;

    const startOfMonth = new Date(currentMonthConjunto.getFullYear(), currentMonthConjunto.getMonth(), 1);
    const endOfMonth = new Date(currentMonthConjunto.getFullYear(), currentMonthConjunto.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data: transactions, error } = await supabase
        .from('lancamentos_conjuntos')
        .select('*, categorias(nome), cartoes_credito(nome_cartao)')
        .or(`user_id_criador.eq.${currentUserId},user_id_parceiro.eq.${currentUserId}`)
        .gte('data', formatDateLocal(startOfMonth))
        .lte('data', formatDateLocal(endOfMonth))
        .order('data', { ascending: false });

    if (error) {
        console.error('Erro ao buscar lançamentos conjuntos:', error.message);
        transactionsListConjuntoElement.innerHTML = `<p class="no-transactions-message">Erro ao carregar lançamentos conjuntos.</p>`;
        return;
    }

    if (transactions.length === 0) {
        transactionsListConjuntoElement.innerHTML = `<p class="no-transactions-message">Nenhum lançamento conjunto encontrado para este mês.</p>`;
        return;
    }

    transactionsListConjuntoElement.innerHTML = '';
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
        transactionsListConjuntoElement.appendChild(transactionItem);
    });

    transactionsListConjuntoElement.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const transaction = transactions.find(t => t.id === id);
            if (transaction) {
                openTransactionModalConjunto(transaction.tipo, transaction);
            }
        });
    });

    transactionsListConjuntoElement.querySelectorAll('.btn-mark-paid').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const paidStatus = e.target.dataset.paid === 'true';
            togglePaidStatusConjunto(id, paidStatus);
        });
    });
}

/* =========================
   MÊS
========================= */

function updateMonthDisplayConjunto() {
    if (currentMonthYearConjuntoElement) {
        currentMonthYearConjuntoElement.textContent =
            currentMonthConjunto.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
}

async function changeMonthConjunto(offset) {
    currentMonthConjunto.setMonth(currentMonthConjunto.getMonth() + offset);
    updateMonthDisplayConjunto();
    await renderTransactionsConjunto();
}

/* =========================
   CARREGAMENTO INICIAL
========================= */

// CORREÇÃO: Nova função para carregar o user_id e partner_id
async function loadUserAndPartnerProfilesForConjunto() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('Usuário não logado.');
        currentUserId = null;
        currentPartnerId = null;
        return;
    }
    currentUserId = user.id;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', currentUserId)
        .single();

    if (error || !profile || !profile.partner_id) {
        console.error('Erro ao carregar perfil do usuário ou parceiro não vinculado:', error?.message);
        if (transactionsListConjuntoElement) {
            transactionsListConjuntoElement.innerHTML = `<p class="no-transactions-message">Não foi possível carregar o perfil do seu parceiro. Verifique se ele está cadastrado e vinculado.</p>`;
        }
        currentPartnerId = null;
        return;
    }
    currentPartnerId = profile.partner_id;
}

export async function initConjuntoPage() {
    initializeConjuntoDOM();
    await loadUserAndPartnerProfilesForConjunto(); // CORREÇÃO: Carrega IDs antes de renderizar
    if (transactionsListConjuntoElement) { // Garante que o DOM foi inicializado
        updateMonthDisplayConjunto();
        await renderTransactionsConjunto();
        toggleFormFieldsConjunto('entrada'); // Chama toggleFormFieldsConjunto que agora verifica currentUserId
    } else {
        console.error("DOM para página conjunta não foi totalmente inicializado. Verifique o HTML.");
    }
}