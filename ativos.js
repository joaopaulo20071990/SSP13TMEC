const firebaseConfig = {
  apiKey: "AIzaSyC_ptT-QJVoNaX7IWJRpbvE-9Plwt2DyY8",
  authDomain: "tmec-mariliassp13.firebaseapp.com",
  databaseURL: "https://tmec-mariliassp13-default-rtdb.firebaseio.com",
  projectId: "tmec-mariliassp13",
  storageBucket: "tmec-mariliassp13.appspot.com",
  messagingSenderId: "1078206182223",
  appId: "1:1078206182223:web:e07aa821b482efb29acb3a",
  measurementId: "G-TEB1KFTEZP"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const contadoresContainer = document.getElementById('contadoresContainer');

database.ref("contadores").on("value", snapshot => {
  const dados = snapshot.val() || {};
  contadoresContainer.innerHTML = "";
  Object.values(dados).forEach(contador => {
    if (contador.horaEntrada && !contador.horaSaida) { // só ativos
      contadoresContainer.appendChild(montaCard(contador));
    }
  });
  filtrarAtivos();
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
    <span class="timer">${dados.horaEntrada ? tempoDecorrido(dados.horaEntrada) : "00:00:00"}</span>
  `;
  el.setAttribute("data-transportadora", dados.transportadora);
  return el;
}

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR').padStart(8, '0');
}
// Só mostra tempo fixo ao carregar a tela (não atualiza ao vivo)
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