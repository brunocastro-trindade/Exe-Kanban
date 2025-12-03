/*
Funcionalidades:
- Estado em memória + localStorage
- Renderização dinâmica
- Criar / Editar / Excluir tarefa
- Drag e Drop nativo entre colunas
*/
/* --------- Estado inicial e persistência ------- */
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

 /* -------  Seleterores DOM ----------- */
 const colA = document.getElementById("col-aFazer");
 const colB = document.getElementById("col-Fazendo");
 const colC = document.getElementById("col-concluido");
 const btnNova = document.getElementById("btnNova");
 const btnLimpar = document.getElementById("btnLimpar");
 const modal = document.getElementById("modal");
 const backdrop = document.getElementById("backdrop");
 const taskForm = document.getElementById("modalClose");
 const taskidInput = document.getElementById("Taskid");
 const taskDescinput = document.getElementById("taskDesc");
 const cancelBtn = document.getElementById("cancelBtn");

 /* -------- Helpers ------- */
 function salvarEstado () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
 }
 function gerarId() {
    return Date.now() .toString(36) +
    Math.random().toString(36).slice(2,8);
 }

 /* -------- Renderização ----- */
 function criarCardElement(task) {
    const card = document.getElement("div");
    card.className = "card";
    card.setAttribute("draggable", "true");
    card.dataset.id = task.id;
    /* Monta o HTML do card que vai dentro do board */
    card.innerHTML = `
    <div class="card-head">
        <h3>${escapeHtml (task.titulo)}</h3>
        <div class="card-actions">
        <button class="delete" title="Excluir tarefa">✖</button>
            </div>
        </div>
        <p>${escapeHtml(task.descricao || "")}</p>
        `;
 // Eventos: drag
 card.addEventListener("dragstart", onDragstart);
 card.addEventListener("dragend", onDragEnd);

 // Delete
 card.querySelector(".delete").addEventListener("click", (e) => {
    e.stopPropagation();
    removerTarefa(task.id);
 });

 // Edit on double click
 card.addEventListener("dblclick", () =)

 }