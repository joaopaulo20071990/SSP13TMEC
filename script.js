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
const listaRegistros = document.getElementById('listaRegistros');

// Histórico global Firebase
function carregarHistoricoGlobal() {
  database.ref('registros_finalizados').on('value', snapshot => {
    listaRegistros.innerHTML = "";
    const dados = snapshot.val() || {};
    Object.values(dados).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.texto || "";
      listaRegistros.appendChild(li);
    });
  });
}
function adicionarAoHistoricoGlobal(txt, dadosRegistroFinal) {
  database.ref('registros_finalizados').push({
    texto: txt,
    ...dadosRegistroFinal,
    timestamp: new Date().toISOString()
  });
}
function zerarHistoricoGlobal() {
  if (window.confirm("Tem certeza que deseja apagar TODO o histórico para TODOS?")) {
    database.ref('registros_finalizados').remove();
  }
}
window.addEventListener('DOMContentLoaded', carregarHistoricoGlobal);
document.getElementById('zerarHistoricoBtn').onclick = zerarHistoricoGlobal;

// Novo contador padrão, leitura 2D, QR e filtros em tempo real...
// ... (igual suas últimas versões)

document.getElementById("btnBaixarCSV").onclick = function() {
  const registros = Array.from(document.querySelectorAll('#listaRegistros li')).map(li => li.textContent);
  if (!registros.length) {
    alert('Nenhum registro para exportar.');
    return;
  }
  let csv = 'SVC,Transportadora,Placa,Tempo decorrido\n';
  registros.forEach(txt => {
    let [svc, transp, placa, tempo] = txt.split('|').map(s => (s || '').replace(/^.*:\s*/, '').replace(/,/g,';').trim());
    csv += `"${svc || ''}","${transp || ''}","${placa || ''}","'${tempo || ''}"\n`; // <-- apóstrofo força texto no Excel
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registros.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 0);
};

document.getElementById("btnBaixarXLSX").onclick = function () {
  const registros = Array.from(document.querySelectorAll('#listaRegistros li')).map(li => li.textContent);
  if (!registros.length) { alert('Nenhum registro para exportar.'); return; }
  const dados = [['SVC', 'Transportadora', 'Placa', 'Tempo decorrido']];
  registros.forEach(txt => {
    let [svc, transp, placa, tempo] = txt.split('|').map(s => (s||'').replace(/^.*:\s*/, '').trim());
    dados.push([svc, transp, placa, "'" + tempo]);
  });
  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Historico");
  XLSX.writeFile(wb, "registros.xlsx");
};

document.getElementById('filtroTransportadora').addEventListener('change', filtrarContadores);
document.getElementById('filtroSVC').addEventListener('input', filtrarContadores);

function filtrarContadores() {
  const selecao = document.getElementById('filtroTransportadora').value;
  const svcFiltro = document.getElementById('filtroSVC').value.trim().toLowerCase();
  const todos = document.querySelectorAll('.contador');
  todos.forEach(c => {
    const transp = (c.getAttribute('data-transportadora') || '').toLowerCase();
    const svc = (c.querySelector('.svc')?.value || c.querySelector('.svc')?.textContent || "").toLowerCase();
    let exibir = true;
    if (selecao && transp !== selecao.toLowerCase()) exibir = false;
    if (svcFiltro && !svc.includes(svcFiltro)) exibir = false;
    c.style.display = exibir ? '' : 'none';
  });
}
function formatTime(date) {
  return date.toLocaleTimeString('pt-BR').padStart(8, '0');
}
function formatDuration(seconds) {
  const h = String(Math.floor(seconds/3600)).padStart(2,'0');
  const m = String(Math.floor((seconds%3600)/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}

// ... mantenha resto do script como nas últimas versões: exibirFormularioNovo(), criarContadorDoBanco() etc.