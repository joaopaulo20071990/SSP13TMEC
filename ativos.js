// ... firebaseConfig igual ao seu ...
const database = firebase.database();
const contadoresContainer = document.getElementById("contadoresContainer");

function iniciarAtualizacaoTempo(){
  if(window.timerAtivos) clearInterval(window.timerAtivos);
  window.timerAtivos = setInterval(() => {
    document.querySelectorAll('.contador').forEach(el => {
      const timerSpan = el.querySelector('.timer');
      const dt = timerSpan?.getAttribute('data-horaentrada');
      if (!dt) return;
      timerSpan.textContent = tempoDecorrido(dt);
    });
  }, 1000);
}

database.ref("contadores").on("value", snapshot => {
  const dados = snapshot.val() || {};
  let ativos = [];
  Object.values(dados).forEach(contador => {
    if (contador.horaEntrada && !contador.horaSaida) {
      const entrada = new Date(contador.horaEntrada);
      const tempo = Math.floor((Date.now() - entrada.getTime()) / 1000);
      ativos.push({...contador, _decorrido: tempo});
    }
  });
  ativos.sort((a, b) => b._decorrido - a._decorrido);
  contadoresContainer.innerHTML = "";
  ativos.forEach(contador => {
    contadoresContainer.appendChild(montaCard(contador));
  });
  filtrarAtivos();
  iniciarAtualizacaoTempo();
});

function montaCard(dados) {
  const el = document.createElement('div');
  el.className = 'contador';
  el.innerHTML = `
    <label>SVC:</label>
    <input type="text" value="${dados.svc || ''}" disabled class="svc"/>
    <label>Placa:</label>
    <input type="text" value="${dados.placa}" disabled class="placa"/>
    <label>Transportadora:</label>
    <input type="text" value="${dados.transportadora}" disabled class="transportadora"/>
    <input type="text" class="horaEntrada" placeholder="Hora de entrada" value="${dados.horaEntrada ? formatTime(new Date(dados.horaEntrada)) : ''}" readonly>
    <div style="margin-top: 14px; font-weight: bold;">Tempo decorrido:</div>
    <span class="timer" data-horaentrada="${dados.horaEntrada}">
      ${dados.horaEntrada ? tempoDecorrido(dados.horaEntrada) : "00:00:00"}
    </span>
  `;
  el.setAttribute("data-transportadora", dados.transportadora);
  return el;
}

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR').padStart(8, '0');
}
function tempoDecorrido(dtStr) {
  const entrada = new Date(dtStr);
  const diff = Math.floor((Date.now() - entrada.getTime()) / 1000);
  const h = String(Math.floor(diff/3600)).padStart(2,'0');
  const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
  const s = String(diff%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}
document.getElementById('filtroTransportadora').addEventListener('change', filtrarAtivos);
document.getElementById('filtroSVC').addEventListener('input', filtrarAtivos);
function filtrarAtivos() {
  const selecao = document.getElementById('filtroTransportadora').value;
  const svcFiltro = document.getElementById('filtroSVC').value.trim().toLowerCase();
  const todos = document.querySelectorAll('.contador');
  todos.forEach(c => {
    const transp = (c.getAttribute('data-transportadora') || '').toLowerCase();
    const svc = (c.querySelector('.svc')?.value || "").toLowerCase();
    let exibir = true;
    if (selecao && transp !== selecao.toLowerCase()) exibir = false;
    if (svcFiltro && !svc.includes(svcFiltro)) exibir = false;
    c.style.display = exibir ? '' : 'none';
  });
}
document.getElementById('zerarHistoricoBtn').onclick = function() {
  if (window.confirm("Tem certeza que deseja apagar TODO o histórico para TODOS?")) {
    firebase.database().ref('registros_finalizados').remove();
  }
};