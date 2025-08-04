// ... firebaseConfig igual às outras versões ...
const firebaseConfig = { /* ...suas configs... */ };
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const contadoresContainer = document.getElementById('contadoresContainer');
const listaRegistros = document.getElementById('listaRegistros');

// ======= Histórico local =======
function carregarHistorico() {
  const dados = JSON.parse(localStorage.getItem('historicoRegistros') || "[]");
  listaRegistros.innerHTML = "";
  dados.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    listaRegistros.appendChild(li);
  });
}
function salvarHistorico() {
  const dados = Array.from(listaRegistros.querySelectorAll('li')).map(li => li.textContent);
  localStorage.setItem('historicoRegistros', JSON.stringify(dados));
}
function adicionarAoHistoricoRegistro(txt) {
  const li = document.createElement("li");
  li.textContent = txt;
  listaRegistros.appendChild(li);
  salvarHistorico();
}
function zerarHistorico() {
  if (window.confirm("Tem certeza que deseja apagar o histórico?")) {
    listaRegistros.innerHTML = '';
    localStorage.removeItem('historicoRegistros');
  }
}
window.addEventListener('DOMContentLoaded', carregarHistorico);
document.getElementById('zerarHistoricoBtn').onclick = zerarHistorico;

// ========== Botão Bipar com Leitor 2D ==========
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

// ========== QR Code ==========
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

// ====== Contadores em tempo real e atualização de SVCs no filtro ======
function atualizarFiltroSVC() {
  const filtroSVC = document.getElementById('filtroSVC');
  const svcSet = new Set();
  document.querySelectorAll('.contador .svc')
    .forEach(input => {
      let val = (input.value || input.textContent || '').trim();
      if(val) svcSet.add(val);
    });
  const valorAtual = filtroSVC.value;
  filtroSVC.innerHTML = `<option value="">Todos</option>`;
  Array.from(svcSet).sort().forEach(svcVal => {
    const selected = svcVal === valorAtual ? 'selected' : '';
    filtroSVC.innerHTML += `<option value="${svcVal}" ${selected}>${svcVal}</option>`;
  });
}

database.ref("contadores").on("value", snapshot => {
  const dados = snapshot.val() || {};
  contadoresContainer.innerHTML = "";
  Object.entries(dados).forEach(([id, contador]) => {
    contadoresContainer.appendChild(criarContadorDoBanco(id, contador));
  });
  atualizarFiltroSVC();
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
      <option value="ALC">ALC</option>
      <option value="MURICI">MURICI</option>
      <option value="TORRES">TORRES</option>
      <option value="ÚNICA">ÚNICA</option>
      <option value="KANGU">KANGU</option>
      <option value="BLD">BLD</option>
    </select>
    <button class="button cadastrar">Cadastrar</button>
    <button class="remover cancelar">Cancelar</button>
  `;
  contadoresContainer.insertBefore(form, contadoresContainer.firstChild);
  form.querySelector(".cadastrar").onclick = () => {
    const svc = form.querySelector('.svc').value.trim();
    const placa = form.querySelector('.placa').value.trim();
    const transportadora = form.querySelector('.transportadora').value;
    if (!svc || !placa || !transportadora) { alert("Preencha o SVC, placa e selecione a transportadora!"); return; }
    database.ref('contadores').push({
      svc, placa, transportadora,
      horaEntrada: "",
      horaSaida: "",
      tempoDecorrido: 0,
      ativo: false
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
    <button class="remover">Remover</button>
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
    adicionarAoHistoricoRegistro(
      `SVC: ${dados.svc || ''} | Transportadora: ${dados.transportadora} | Placa: ${dados.placa.toUpperCase()} | Tempo decorrido: ${formatDuration(diff)}`
    );
    database.ref('contadores/' + id).remove();
  };

  contador.querySelector('.remover').onclick = function(){
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
  setTimeout(() => {document.body.removeChild(a); URL.revokeObjectURL(url)}, 0);
};

function filtrarContadores() {
  const selecao = document.getElementById('filtroTransportadora').value;
  const svcSel = document.getElementById('filtroSVC').value;
  const todos = document.querySelectorAll('.contador');
  todos.forEach(c => {
    const transp = (c.getAttribute('data-transportadora') || '');
    const svc = (c.querySelector('.svc')?.value || c.querySelector('.svc')?.textContent || "");
    let exibir = true;
    if (selecao && transp !== selecao) exibir = false;
    if (svcSel && svc !== svcSel) exibir = false;
    c.style.display = exibir ? '' : 'none';
  });
}
document.getElementById('filtroTransportadora').addEventListener('change', filtrarContadores);
document.getElementById('filtroSVC').addEventListener('change', filtrarContadores);

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR').padStart(8, '0');
}
function formatDuration(seconds) {
  const h = String(Math.floor(seconds/3600)).padStart(2,'0');
  const m = String(Math.floor((seconds%3600)/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}