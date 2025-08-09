// Exemplo de montagem do formulário principal
function exibirFormularioNovo() {
  const form = document.createElement('div');
  form.className = 'contador';
  form.innerHTML = `
    <label>SVC:</label>
    <input type="text" class="svc" required/>
    <label>Placa:</label>
    <input type="text" class="placa" required/>
    <label>Transportadora:</label>
    <select class="transportadora" required>
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
    <button class="botao-amarelo registrar-entrada">Registrar Entrada</button>
    <button class="botao-amarelo remover cancelar">Cancelar</button>
  `;
  contadoresContainer.insertBefore(form, contadoresContainer.firstChild);

  form.querySelector(".registrar-entrada").onclick = () => {
    const svc = form.querySelector('.svc').value.trim();
    const placa = form.querySelector('.placa').value.trim();
    const transp = form.querySelector('.transportadora').value;
    if (!svc || !placa || !transp) {
      alert("Preencha todos os campos!");
      return;
    }
    database.ref('contadores').push({
      svc, placa, transportadora: transp,
      horaEntrada: new Date().toISOString(),
      horaSaida: "",
      tempoDecorrido: 0,
      ativo: true
    });
    form.remove();
  };
  form.querySelector(".cancelar").onclick = () => form.remove();
}

// O resto do JS igual ao seu sistema (firebase, criação cards, filtros)