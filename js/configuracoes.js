// js/configuracoes.js
import { supabase } from './supabase.js';

let currentUserId = null;
let usernameInput;
let saveUsernameBtn;
let userIdDisplay;
let partnerIdInput;
let savePartnerIdBtn;
let partnerIdDisplay;

// Elementos para Categorias
let addCategoryBtn;
let categoryModal;
let closeButtonCategoryModal;
let categoryModalTitle;
let categoryModalForm;
let categoryIdInput;
let categoryNameInput;
let categoryTypeSelect;
let categoryIsGeneralCheckbox;
let deleteCategoryBtn;
let cancelCategoryEditBtn;
let categoriesList;


/* =========================
   UTILIDADES
========================= */

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}


/* =========================
   INICIALIZAÇÃO DOM
========================= */

function initializeConfiguracoesDOM() {
    usernameInput = document.getElementById('username-input');
    saveUsernameBtn = document.getElementById('save-username-btn');
    userIdDisplay = document.getElementById('user-id-display');
    partnerIdInput = document.getElementById('partner-id-input');
    savePartnerIdBtn = document.getElementById('save-partner-id-btn');
    partnerIdDisplay = document.getElementById('partner-id-display');

    addCategoryBtn = document.getElementById('add-category-btn');
    categoryModal = document.getElementById('category-modal');
    closeButtonCategoryModal = categoryModal ? categoryModal.querySelector('.close-button') : null; // Verificação adicionada
    categoryModalTitle = document.getElementById('category-modal-title');
    categoryModalForm = document.getElementById('category-modal-form');
    categoryIdInput = document.getElementById('category-id');
    categoryNameInput = document.getElementById('category-name');
    categoryTypeSelect = document.getElementById('category-type');
    categoryIsGeneralCheckbox = document.getElementById('category-is-general');
    deleteCategoryBtn = document.getElementById('delete-category-btn');
    cancelCategoryEditBtn = document.getElementById('cancel-category-edit-btn');
    categoriesList = document.getElementById('categories-list');


    saveUsernameBtn.addEventListener('click', saveUsername);
    savePartnerIdBtn.addEventListener('click', savePartnerId);

    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => openCategoryModal());
    if (closeButtonCategoryModal) closeButtonCategoryModal.addEventListener('click', closeCategoryModal);
    if (categoryModalForm) categoryModalForm.addEventListener('submit', handleCategorySubmit);
    if (deleteCategoryBtn) deleteCategoryBtn.addEventListener('click', deleteCategory);
    if (cancelCategoryEditBtn) cancelCategoryEditBtn.addEventListener('click', closeCategoryModal);
    
    window.addEventListener('click', (event) => {
        if (categoryModal && event.target == categoryModal) {
            closeCategoryModal();
        }
    });
}

/* =========================
   FUNÇÕES DE PERFIL E PARCEIRO
========================= */

async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('Usuário não logado.');
        currentUserId = null; // Garante que é null se não estiver logado
        return;
    }
    currentUserId = user.id;
    if (userIdDisplay) userIdDisplay.textContent = currentUserId;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, partner_id')
        .eq('id', currentUserId)
        .single();

    if (error) {
        console.error('Erro ao carregar perfil:', error.message);
        return;
    }

    if (profile) {
        if (usernameInput) usernameInput.value = profile.username || '';
        if (partnerIdInput) partnerIdInput.value = profile.partner_id || '';
        if (partnerIdDisplay) partnerIdDisplay.textContent = profile.partner_id || 'Nenhum parceiro vinculado.';
    }
}

async function saveUsername() {
    if (!currentUserId) { // Verificação adicionada
        alert('Usuário não identificado.');
        return;
    }
    const newUsername = usernameInput.value.trim();
    if (!newUsername) {
        alert('O nome de usuário não pode ser vazio.');
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', currentUserId);

    if (error) {
        console.error('Erro ao salvar nome de usuário:', error.message);
        alert('Erro ao salvar nome de usuário. Tente novamente.');
    } else {
        alert('Nome de usuário salvo com sucesso!');
    }
}

async function savePartnerId() {
    if (!currentUserId) { // Verificação adicionada
        alert('Usuário não identificado.');
        return;
    }
    const newPartnerId = partnerIdInput.value.trim();
    if (!newPartnerId) {
        alert('O ID do parceiro não pode ser vazio.');
        return;
    }

    if (newPartnerId === currentUserId) {
        alert('Você não pode vincular a si mesmo como parceiro.');
        return;
    }

    const { data: partnerProfile, error: partnerError } = await supabase
        .from('profiles')
        .select('id, partner_id')
        .eq('id', newPartnerId)
        .single();

    if (partnerError || !partnerProfile) {
        alert('ID de parceiro inválido ou parceiro não encontrado.');
        console.error('Erro ao buscar perfil do parceiro:', partnerError?.message);
        return;
    }

    if (partnerProfile.partner_id && partnerProfile.partner_id !== currentUserId) {
        alert('Este parceiro já está vinculado a outra pessoa.');
        return;
    }

    const { error: userUpdateError } = await supabase
        .from('profiles')
        .update({ partner_id: newPartnerId })
        .eq('id', currentUserId);

    const { error: partnerUpdateError } = await supabase
        .from('profiles')
        .update({ partner_id: currentUserId })
        .eq('id', newPartnerId);

    if (userUpdateError || partnerUpdateError) {
        console.error('Erro ao vincular parceiro:', userUpdateError?.message || partnerUpdateError?.message);
        alert('Erro ao vincular parceiro. Tente novamente.');
    } else {
        alert('Parceiro vinculado com sucesso!');
        if (partnerIdDisplay) partnerIdDisplay.textContent = newPartnerId;
    }
}

/* =========================
   FUNÇÕES DE CATEGORIAS
========================= */

async function openCategoryModal(category = null) {
    if (categoryModalForm) categoryModalForm.reset();
    if (categoryIdInput) categoryIdInput.value = '';
    if (deleteCategoryBtn) deleteCategoryBtn.style.display = 'none';
    if (cancelCategoryEditBtn) cancelCategoryEditBtn.style.display = 'inline-block';
    if (categoryIsGeneralCheckbox) {
        categoryIsGeneralCheckbox.checked = false;
        categoryIsGeneralCheckbox.disabled = false;
    }

    if (categoryModalTitle) categoryModalTitle.textContent = category ? 'Editar Categoria' : 'Nova Categoria';

    if (category) {
        const isDefaultCategory = category.user_id === null;
        if (isDefaultCategory) {
            alert('Categorias padrão não podem ser editadas ou excluídas.');
            closeCategoryModal();
            return;
        }

        if (categoryIdInput) categoryIdInput.value = category.id;
        if (categoryNameInput) categoryNameInput.value = category.nome;
        if (categoryTypeSelect) categoryTypeSelect.value = category.tipo;
        if (categoryIsGeneralCheckbox) categoryIsGeneralCheckbox.checked = category.is_general;
        if (deleteCategoryBtn) deleteCategoryBtn.style.display = 'block';
    }

    if (categoryModal) categoryModal.style.display = 'flex';
}

function closeCategoryModal() {
    if (categoryModal) categoryModal.style.display = 'none';
    resetCategoryForm();
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    if (!currentUserId) {
        alert('Usuário não logado.');
        return;
    }

    const id = categoryIdInput.value;
    const name = categoryNameInput.value.trim();
    const type = categoryTypeSelect.value;
    const isGeneral = categoryIsGeneralCheckbox.checked;

    if (!name) {
        alert('O nome da categoria não pode ser vazio.');
        return;
    }

    let error;
    if (id) {
        const { error: updateError } = await supabase
            .from('categorias')
            .update({ nome: name, tipo: type, is_general: isGeneral })
            .eq('id', id)
            .eq('user_id', currentUserId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('categorias')
            .insert([{ nome: name, tipo: type, user_id: currentUserId, is_general: isGeneral }]);
        error = insertError;
    }

    if (error) {
        console.error('Erro ao salvar categoria:', error.message);
        alert('Erro ao salvar categoria. Tente novamente.');
    } else {
        alert('Categoria salva com sucesso!');
        closeCategoryModal();
        await renderCategories();
    }
}

async function deleteCategory() {
    const id = categoryIdInput.value;
    if (!id) return;

    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
        return;
    }

    const { count, error: countError } = await supabase
        .from('lancamentos')
        .select('id', { count: 'exact' })
        .eq('categoria_id', id)
        .eq('user_id', currentUserId);

    if (countError) {
        console.error('Erro ao verificar uso da categoria:', countError.message);
        alert('Erro ao verificar categoria. Tente novamente.');
        return;
    }

    if (count > 0) {
        alert('Não é possível excluir esta categoria porque ela está em uso em um ou mais lançamentos.');
        return;
    }

    const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);

    if (error) {
        console.error('Erro ao excluir categoria:', error.message);
        alert('Erro ao excluir categoria. Tente novamente.');
    } else {
        alert('Categoria excluída com sucesso!');
        closeCategoryModal();
        await renderCategories();
    }
}

function resetCategoryForm() {
    if (categoryModalForm) categoryModalForm.reset();
    if (categoryIdInput) categoryIdInput.value = '';
    if (categoryModalTitle) categoryModalTitle.textContent = 'Nova Categoria';
    if (deleteCategoryBtn) deleteCategoryBtn.style.display = 'none';
    if (cancelCategoryEditBtn) cancelCategoryEditBtn.style.display = 'inline-block';
    if (categoryIsGeneralCheckbox) {
        categoryIsGeneralCheckbox.checked = false;
        categoryIsGeneralCheckbox.disabled = false;
    }
}

async function renderCategories() {
    if (!currentUserId || !categoriesList) return;

    const { data: categories, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo, user_id, is_general')
        .or(`user_id.eq.${currentUserId},is_general.eq.true`)
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao carregar categorias:', error.message);
        categoriesList.innerHTML = `<p>Erro ao carregar categorias.</p>`;
        return;
    }

    categoriesList.innerHTML = '';
    if (categories.length === 0) {
        categoriesList.innerHTML = `<p>Nenhuma categoria encontrada.</p>`;
        return;
    }

    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('data-item');
        
        const isDefaultCategory = category.user_id === null;
        const isUserOwned = category.user_id === currentUserId;
        const isGeneralShared = category.is_general && !isUserOwned;

        let categoryInfo = `${category.nome} (${category.tipo === 'entrada' ? 'Entrada' : 'Saída'})`;
        if (isDefaultCategory) {
            categoryInfo += ' (Padrão do Sistema)';
        } else if (category.is_general) {
            categoryInfo += ' (Geral)';
        }


        categoryItem.innerHTML = `
            <span>${categoryInfo}</span>
            <div class="item-actions">
                <button class="btn-small btn-edit" data-id="${category.id}" ${isDefaultCategory || isGeneralShared ? 'disabled' : ''}>✏️</button>
                <button class="btn-small btn-delete" data-id="${category.id}" ${isDefaultCategory || isGeneralShared ? 'disabled' : ''}>🗑️</button>
            </div>
        `;
        categoriesList.appendChild(categoryItem);
    });

    categoriesList.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const category = categories.find(c => c.id === id);
            if (category) {
                openCategoryModal(category);
            }
        });
    });

    categoriesList.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const category = categories.find(c => c.id === id);
            if (category) {
                const isDefaultCategory = category.user_id === null;
                const isGeneralShared = category.is_general && category.user_id !== currentUserId;
                if (isDefaultCategory || isGeneralShared) {
                    alert('Categorias padrão ou gerais de outros usuários não podem ser excluídas.');
                    return;
                }
                categoryIdInput.value = category.id;
                deleteCategory();
            }
        });
    });
}


/* =========================
   CARREGAMENTO INICIAL
========================= */

export async function initConfiguracoesPage() {
    initializeConfiguracoesDOM();
    await loadUserProfile(); // CORREÇÃO: Carrega o user_id antes de renderizar
    if (categoriesList) { // Garante que o DOM foi inicializado
        await renderCategories();
    } else {
        console.error("DOM para página de configurações não foi totalmente inicializado. Verifique o HTML.");
    }
}