// ====== CONFIGURAÇÃO FIREBASE =======
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
// ====== FIM CONFIG FIREBASE =======

const contadoresContainer = document.getElementById('contadoresContainer');
const listaRegistros = document.getElementById('listaRegistros');

// ========== Botão "Bipar com Leitor 2D" ==========
const bipar2dBtn = document.getElementById('bipar2dBtn');
const bipar2dBox = document.getElementById('bipar2dBox');
const biparInput = document.getElementById('biparInput');

bipar2dBtn.onclick = function() {
  bipar2dBox.style.display = 'block';
  biparInput.value = '';
  biparInput.focus();
};

// Ao bipar e dar Enter, cria direto contador
biparInput.addEventListener('keydown', function(e){
  if (e.key === "Enter" || e.key === "Tab") {
    const valor = biparInput.value.trim();
    if (valor.includes(';')) {
      const [placa, transportadora] = valor.split(';');
      biparInput.value = '';
      bipar2dBox.style.display = 'none';

      if (placa && transportadora) {
        database.ref('contadores').push({
          placa: placa,
          transportadora: transportadora,
          horaEntrada: new Date().toISOString(),
          horaSaida: "",
          tempoDecorrido: 0,
          ativo: true
        });
      } else {
        alert('Código inválido: precisa ser PLACA;TRANSPORTADORA');
      }
    } else {
      alert('Código inválido: precisa ser PLACA;TRANSPORTADORA');
      biparInput.value = '';
      bipar2dBox.style.display = 'none';
    }
  }
});

// ========== QR Code por câmera ==========
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
          let [placa, transportadora] = qrMessage.trim().split(';');
          if(!placa || !transportadora) {
            alert("QR Code inválido. Precisa conter: PLACA;TRANSPORTADORA");
            return;
          }
          database.ref('contadores').push({
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

// ---------- Firebase: Listar todos em tempo real ----------
database.ref("contadores").on("value", snapshot => {
  const dados = snapshot.val() || {};
  contadoresContainer.innerHTML = "";
  Object.entries(dados).forEach(([id, contador]) => {
    contadoresContainer.appendChild(criarContadorDoBanco(id, contador));
  });
});

// ---------- Novo contador manual ----------
document.getElementById("novoContadorBtn").onclick = function() {
  exibirFormularioNovo();
};

function exibirFormularioNovo() {
  const form = document.createElement('div');
  form.className = 'contador';
  form.innerHTML = `
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
    const placa = form.querySelector('.placa').value.trim();
    const transportadora = form.querySelector('.transportadora').value;
    if (!placa || !transportadora) { alert("Preencha a placa e selecione a transportadora!"); return; }
    database.ref('contadores').push({
      placa, transportadora,
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
  const horaEntrada = contador.querySelector('.horaEntrada');
  const horaSaida = contador.querySelector('.horaSaida');
  const timer = contador.querySelector('.timer');

  btnEntrada.disabled = !!dados.horaEntrada;
  btnSaida.disabled = !dados.horaEntrada || !!dados.horaSaida;

  // Entrada
  btnEntrada.onclick = function () {
    const agora = new Date();
    database.ref('contadores/' + id).update({
      horaEntrada: agora.toISOString(),
      ativo: true,
      tempoDecorrido: 0,
      horaSaida: ""
    });
  };

  // Saída
  btnSaida.onclick = function () {
    if (!dados.horaEntrada) return;
    const agora = new Date();
    const diff = Math.floor((agora - new Date(dados.horaEntrada)) / 1000);
    database.ref('contadores/' + id).update({
      horaSaida: agora.toISOString(),
      ativo: false,
      tempoDecorrido: diff
    });

    const li = document.createElement("li");
    li.textContent = `Transportadora: ${dados.transportadora} | Placa: ${dados.placa.toUpperCase()} | Tempo decorrido: ${formatDuration(diff)}`;
    listaRegistros.appendChild(li);
  };

  contador.querySelector('.remover').onclick = function(){
    database.ref('contadores/' + id).remove();
  };

  // Timer ao vivo!
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

// ===== Baixar registros salvos em tela ======
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

// ======= Filtro =======
function filtrarContadores() {
  const selecao = document.getElementById('filtroTransportadora').value;
  const todos = document.querySelectorAll('.contador');
  todos.forEach(c => {
    const transp = c.getAttribute('data-transportadora');
    if (!selecao || transp === selecao) {
      c.style.display = '';
    } else {
      c.style.display = 'none';
    }
  });
}
document.getElementById('filtroTransportadora').addEventListener('change', filtrarContadores);

// ===== Funções utilitárias de tempo =====
function formatTime(date) {
  return date.toLocaleTimeString('pt-BR').padStart(8, '0');
}
function formatDuration(seconds) {
  const h = String(Math.floor(seconds/3600)).padStart(2,'0');
  const m = String(Math.floor((seconds%3600)/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}