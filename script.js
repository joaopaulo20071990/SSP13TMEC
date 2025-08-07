// ... firebase config, bipagem, QR code, histórico firebase, filtros, etc (como já enviado antes) ...

document.getElementById("btnBaixar").onclick = function() {
  const registros = Array.from(document.querySelectorAll('#listaRegistros li')).map(li => li.textContent);
  if (!registros.length) { alert('Nenhum registro para baixar.'); return; }
  // Cabeçalho CSV
  let csv = 'SVC,Transportadora,Placa,Tempo decorrido\n';
  registros.forEach(txt => {
    // "SVC: ... | Transportadora: ... | Placa: ... | Tempo decorrido: ..."
    let [svc, transp, placa, tempo] = txt.split('|').map(s => (s || '').replace(/^.*:\s*/, '').replace(/,/g,';').trim());
    csv += `"${svc || ''}","${transp || ''}","${placa || ''}","${tempo || ''}"\n`;
  });

  // Baixa como CSV
  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registros.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

// ... restante do código igual: registrar, histórico, criarContadorDoBanco, entrada/saída, filtros, etc ...