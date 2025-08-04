// ... firebaseConfig e resto igual
// ... tudo igual às versões anteriores para criar/registrar/controlar/zerar contadores e histórico ...

document.getElementById("btnBaixar").onclick = function() {
  const registros = Array.from(document.querySelectorAll('#listaRegistros li'))
    .map(li => li.textContent);
  if (!registros.length) { alert('Nenhum registro para baixar.'); return; }
  
  // Cabeçalho Excel
  const dados = [['SVC', 'Transportadora', 'Placa', 'Tempo decorrido']]; 
  registros.forEach(txt => {
    // Exemplo: "SVC: ... | Transportadora: ... | Placa: ... | Tempo decorrido: ..."
    let [svc, transp, placa, tempo] = txt.split('|').map(s => (s || '').replace(/^.*:\s*/, '').trim());
    dados.push([svc, transp, placa, tempo]);
  });

  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Histórico");
  
  XLSX.writeFile(wb, "historico.xlsx");
};

// Demais funções e lógica igual à resposta anterior...