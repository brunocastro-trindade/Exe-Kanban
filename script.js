/* 
   Funcionalidades: 
   - Estado em memória + localStorage 
   - Renderização dinâmica 
   - Criar / Editar / Excluir tarefa 
   - Drag & Drop nativo entre colunas 
*/
/* ----------  Estado inicial e persistência ---------- */
const STORAGE_KEY = "kanban_estado_v1";

let state = {
    aFazer: [],
    fazendo: [],
    concluido: []
};

// Carrega estado do localStorage, se existir 
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
    try {
        state = JSON.parse(saved);
    } catch (e) {
        console.warn("Erro ao parsear estado salvo:", e);
    }
}

/* ----------  Seletores DOM ---------- */
const colA = document.getElementById("col-aFazer");
const colB = document.getElementById("col-fazendo");
const colC = document.getElementById("col-concluido");
const btnNova = document.getElementById("btnNova");
const btnLimpar = document.getElementById("btnLimpar");
const modal = document.getElementById("modal");
const backdrop = document.getElementById("backdrop");
const modalClose = document.getElementById("modalClose");
const taskForm = document.getElementById("taskForm");
const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescInput = document.getElementById("taskDesc");
const cancelBtn = document.getElementById("cancelBtn");

/* ----------  Helpers ---------- */
function salvarEstado() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ----------  Renderização ---------- */
function criarCardElement(task) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("draggable", "true");
    card.dataset.id = task.id;

    /* Monta o HTML do card que vai dentro do board */
    card.innerHTML = ` 
    <div class="card-head"> 
      <h3>${escapeHtml(task.titulo)}</h3> 
      <div class="card-actions"> 
        <button class="delete" title="Excluir tarefa">✖</button> 
      </div> 
    </div> 
    <p>${escapeHtml(task.descricao || "")}</p> 
  `;

    // Eventos: drag 
    card.addEventListener("dragstart", onDragStart);
    card.addEventListener("dragend", onDragEnd);

    // Delete 
    card.querySelector(".delete").addEventListener("click", (e) => {
        e.stopPropagation();
        removerTarefa(task.id);
    });

    // Edit on double click 
    card.addEventListener("dblclick", () => abrirModalParaEdicao(task));

    return card;
}

// Limpa e renderiza todas as colunas 
function renderizarQuadros() {
    // limpar 
    [colA, colB, colC].forEach(c => { c.innerHTML = ""; });

    // popular 
    state.aFazer.forEach(t => colA.appendChild(criarCardElement(t)));
    state.fazendo.forEach(t => colB.appendChild(criarCardElement(t)));
    state.concluido.forEach(t => colC.appendChild(criarCardElement(t)));

    salvarEstado();
}

/* ----------  Manipulação de tarefas ---------- */
function adicionarTarefa({ titulo, descricao }) {
    const task = { id: gerarId(), titulo: titulo.trim(), descricao: descricao?.trim() || "" };
    // unshift() insere um item no começo do array. 
    state.aFazer.unshift(task); // adicionar no topo de A Fazer 
    renderizarQuadros();
}

function atualizarTarefa(id, dados) {
    const colName = encontrarColunaPorId(id);
    if (!colName) return;
    const arr = state[colName];
    const idx = arr.findIndex(t => t.id === id);
    if (idx < 0) return;
    arr[idx] = { ...arr[idx], ...dados };
    renderizarQuadros();
}

function removerTarefa(id) {
    ["aFazer", "fazendo", "concluido"].forEach(col => {
        state[col] = state[col].filter(t => t.id !== id);
    });
    renderizarQuadros();
}

function encontrarColunaPorId(id) {
    if (state.aFazer.some(t => t.id === id)) return "aFazer";
    if (state.fazendo.some(t => t.id === id)) return "fazendo";
    if (state.concluido.some(t => t.id === id)) return "concluido";
    return null;
}

/* ----------  Drag & Drop ---------- */
let draggedId = null;

function onDragStart(e) {
    const el = e.currentTarget;
    draggedId = el.dataset.id;
    el.classList.add("dragging");
    e.dataTransfer.setData("text/plain", draggedId);
    // Melhor compatibilidade: 
    e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e) {
    const el = e.currentTarget;
    el.classList.remove("dragging");
    draggedId = null;
}

// Configura eventos nas colunas 
function configurarDrop(colElement, colKey) {
    colElement.addEventListener("dragover", (e) => {
        e.preventDefault(); // permite drop 
        colElement.parentElement.classList.add("drop-target");
    });

    colElement.addEventListener("dragleave", () => {
        colElement.parentElement.classList.remove("drop-target");
    });

    colElement.addEventListener("drop", (e) => {
        e.preventDefault();
        colElement.parentElement.classList.remove("drop-target");
        const id = e.dataTransfer.getData("text/plain") || draggedId;
        if (!id) return;
        moverTarefaParaColuna(id, colKey);
    });
}

function moverTarefaParaColuna(id, destinoCol) {
    // remove de qualquer coluna e adiciona no topo do destino 
    let task = null;
    ["aFazer", "fazendo", "concluido"].forEach(col => {
        const idx = state[col].findIndex(t => t.id === id);
        if (idx >= 0) {
            task = state[col].splice(idx, 1)[0];
        }
    });
    if (!task) return;
    state[destinoCol].unshift(task);
    renderizarQuadros();
}

/* ----------  Modal (criar / editar) ---------- */
function abrirModal(novo = true) {
    modal.setAttribute("aria-hidden", "false");
    taskForm.reset();
    taskIdInput.value = "";
    document.getElementById("modal-title").textContent = novo ? "Nova Tarefa" : "Editar Tarefa";
    taskTitleInput.focus();
}

function fecharModal() {
    modal.setAttribute("aria-hidden", "true");
    taskForm.reset();
    taskIdInput.value = "";
}

function abrirModalParaEdicao(task) {
    abrirModal(false);
    taskIdInput.value = task.id;
    taskTitleInput.value = task.titulo;
    taskDescInput.value = task.descricao;
}

/* ----------  Eventos do formulário ---------- */
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = taskIdInput.value;
    const titulo = taskTitleInput.value.trim();
    const descricao = taskDescInput.value.trim();
    if (!titulo) {
        alert("Título obrigatório");
        return;
    }
    if (id) {
        atualizarTarefa(id, { titulo, descricao });
    } else {
        adicionarTarefa({ titulo, descricao });
    }
    fecharModal();
});

btnNova.addEventListener("click", () => abrirModal(true));
modalClose.addEventListener("click", fecharModal);
cancelBtn.addEventListener("click", fecharModal);
backdrop.addEventListener("click", fecharModal);

// atalhos de teclado: Esc fecha modal 
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
});

/* ----------  Limpar quadro (ação destrutiva) ---------- */
btnLimpar.addEventListener("click", () => {
    if (!confirm("Deseja realmente limpar todo o quadro? Essa ação não pode ser desfeita.")) return;
    state = { aFazer: [], fazendo: [], concluido: [] };
    salvarEstado();
    renderizarQuadros();
});

/* ----------  Inicialização ---------- */
configurarDrop(colA.parentElement, "aFazer"); // passamos a section (pai) para indicar área de drop visual 
configurarDrop(colB.parentElement, "fazendo");
configurarDrop(colC.parentElement, "concluido");

// Também permitir dropar sobre a area interna (col-body) 
configurarDrop(colA, "aFazer");
configurarDrop(colB, "fazendo");
configurarDrop(colC, "concluido");

// Render inicial 
renderizarQuadros();

/* ----------  Segurança simples: escape HTML ---------- */
/* 
  Transforma entrada do usuário em texto seguro, impedindo XSS, 
  que é um dos ataques mais comuns da web. 
*/
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replaceAll("&", "&amp;")   // evita & ser interpretado como entidade HTML 
        .replaceAll("<", "&lt;")    // fecha a porta pra <tag> 
        .replaceAll(">", "&gt;")    // fecha a porta pra <tag> 
        .replaceAll('"', "&quot;")  // protege atributos HTML 
        .replaceAll("'", "&#039;"); // protege atributos com aspas simples 
} 