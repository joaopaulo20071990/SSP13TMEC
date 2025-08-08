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
const bipar2dBtn = document.getElementById('bipar2dBtn');
const bipar2dBox = document.getElementById('bipar2dBox');
const biparInput = document.getElementById('biparInput');
bipar2dBtn.onclick = function() {
  bipar2dBox.style.display = 'block';
  biparInput.value = '';
  biparInput.focus();
};
biparInput.addEventListener('keydown', function(e){
  if (e.key === "Enter" || e.key === "Tab") {
    const valor = biparInput.value.trim();
    let [svc, placa, transportadora] = valor.split(';');
    if (svc && placa && transportadora) {
      biparInput.value = '';
      bipar2dBox.style.display = 'none';
      database.ref('contadores').push({
        svc,
        placa,
        transportadora,
        horaEntrada: new Date().toISOString(),
        horaSaida: "",
        tempoDecorrido: 0,
        ativo: true
      });
    } else {
      alert('Código inválido: precisa ser SVC;PLACA;TRANSPORTADORA');
      biparInput.value = '';
      bipar2dBox.style.display = 'none';
    }
  }
});

document.getElementById('lerQr').onclick = function() {
  document.getElementById('qr-show').style.display = 'block';
  const html5QrCode = new Html5Qrcode("qr-show");
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      html5QrCode.start(
        cameras[0].id,
        { fps: 10, qrbox: 220 },
        qrMessage => {
          html5QrCode.stop();
          document.getElementById('qr-show').style.display = 'none';
          let [svc, placa, transportadora] = qrMessage.trim().split(';');
          if(!svc || !placa || !transportadora) {
            alert("QR Code inválido. Precisa conter: SVC;PLACA;TRANSPORTADORA");
            return;
          }
          database.ref('contadores').push({
            svc,
            placa,
            transportadora,
            horaEntrada: new Date().toISOString(),
            horaSaida: "",
            tempoDecorrido: 0,
            ativo: true
          });
        }
      );
    } else {
      alert("Câmera não encontrada!");
    }
  });
};

database.ref("contadores").on("value", snapshot => {
  const dados = snapshot.val() || {};
  contadoresContainer.innerHTML = "";
  Object.entries(dados).forEach(([id, contador]) => {
    contadoresContainer.appendChild(criarContadorDoBanco(id, contador));
  });
  filtrarContadores();
});

document.getElementById("novoContadorBtn").onclick = function() {
  exibirFormularioNovo();
};

function exibirFormularioNovo() {
  const form = document.createElement('div');
  form.className = 'contador';
  form.innerHTML = `
    <label>SVC:</label>
    <input type="text" class="svc" placeholder="Digite o SVC"/>
    <label>Placa:</label>
    <input type="text" class="placa" placeholder="Digite a placa"/>
    <label>Transportadora:</label>
    <select class="transportadora">
      <option value="">Selecione</option>
      <option value="A L C TRANSPORTES">A L C TRANSPORTES</option>
      <option value="Murici">Murici</option>
      <option value="TORRESTRANSP">TORRESTRANSP</option>
      <option value="UNICA TRANSPORTES">UNICA TRANSPORTES</option>
      <option value="BLD LOGÍSTICA">BLD LOGÍSTICA</option>
      <option value="Kangu Logistics">Kangu Logistics</option>
      <option value="ON TIME SERVICOS">ON TIME SERVICOS</option>
      <option value="3A BRASIL">3A BRASIL</option>
      <option value="BASEPEX ENCOM">BASEPEX ENCOM</option>
      <option value="RodaCoop">RodaCoop</option>
    </select>
    <button class="button registrar-entrada">Registrar Entrada</button>
    <button class="remover cancelar">Cancelar</button>
  `;
  contadoresContainer.insertBefore(form, contadoresContainer.firstChild);

  form.querySelector(".registrar-entrada").onclick = () => {
    const svc = form.querySelector('.svc').value.trim();
    const placa = form.querySelector('.placa').value.trim();
    const transportadora = form.querySelector('.transportadora').value;
    if (!svc || !placa || !transportadora) {
      alert("Preencha o SVC, placa e selecione a transportadora!");
      return;
    }
    database.ref('contadores').push({
      svc,
      placa,
      transportadora,
      horaEntrada: new Date().toISOString(),
      horaSaida: "",
      tempoDecorrido: 0,
      ativo: true
    });
    form.remove();
  };
  form.querySelector(".cancelar").onclick = () => form.remove();
}

function criarContadorDoBanco(id, dados) {
  const contador = document.createElement("div");
  contador.className = "contador";
  contador.setAttribute("data-transportadora", dados.transportadora);

  let timerInterval = null;
  contador.innerHTML = `
    <label>SVC:</label>
    <input type="text" value="${dados.svc || ''}" disabled class="svc"/>
    <label>Placa:</label>
    <input type="text" value="${dados.placa}" disabled class="placa"/>
    <label>Transportadora:</label>
    <input type="text" value="${dados.transportadora}" disabled class="transportadora"/>
    <button class="button btnEntrada">Registrar Entrada</button>
    <input type="text" class="horaEntrada" placeholder="Hora de entrada" value="${dados.horaEntrada ? formatTime(new Date(dados.horaEntrada)) : ''}" readonly>
    <div style="margin: 15px 0 0 0; font-weight: bold;">Tempo decorrido:</div>
    <span class="timer">${dados.tempoDecorrido ? formatDuration(dados.tempoDecorrido) : "00:00:00"}</span>
    <button class="button btnSaida">Registrar Saída</button>
    <input type="text" class="horaSaida" placeholder="Hora de saída" value="${dados.horaSaida ? formatTime(new Date(dados.horaSaida)) : ""}" readonly>
  `;
  const btnEntrada = contador.querySelector(".btnEntrada");
  const btnSaida = contador.querySelector(".btnSaida");
  const timer = contador.querySelector('.timer');

  btnEntrada.disabled = !!dados.horaEntrada;
  btnSaida.disabled = !dados.horaEntrada || !!dados.horaSaida;

  btnEntrada.onclick = function () {
    const agora = new Date();
    database.ref('contadores/' + id).update({
      horaEntrada: agora.toISOString(),
      ativo: true,
      tempoDecorrido: 0,
      horaSaida: ""
    });
  };

  btnSaida.onclick = function () {
    if (!dados.horaEntrada) return;
    const agora = new Date();
    const diff = Math.floor((agora - new Date(dados.horaEntrada)) / 1000);
    const texto = `SVC: ${dados.svc || ''} | Transportadora: ${dados.transportadora} | Placa: ${dados.placa.toUpperCase()} | Tempo decorrido: ${formatDuration(diff)}`;
    adicionarAoHistoricoGlobal(texto, {
      svc: dados.svc || '', 
      transportadora: dados.transportadora, 
      placa: (dados.placa || '').toUpperCase(), 
      tempoDecorrido: formatDuration(diff)
    });
    database.ref('contadores/' + id).remove();
  };

  if (dados.horaEntrada && !dados.horaSaida) {
    const entrada = new Date(dados.horaEntrada);
    timerInterval = setInterval(() => {
      const diff = Math.floor((Date.now() - entrada.getTime()) / 1000);
      timer.textContent = formatDuration(diff);
    }, 1000);
    contador.addEventListener('DOMNodeRemoved', function(){ clearInterval(timerInterval); });
  } else if (dados.tempoDecorrido && dados.horaSaida) {
    timer.textContent = formatDuration(dados.tempoDecorrido);
  }

  return contador;
}

// Download TXT
document.getElementById("btnBaixar").onclick = function() {
  const registros = Array.from(document.querySelectorAll('#listaRegistros li'))
    .map(li => li.textContent)
    .join('\n');
  if (!registros) { alert('Nenhum registro para baixar.'); return; }
  const blob = new Blob([registros], {type: "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registros.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
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