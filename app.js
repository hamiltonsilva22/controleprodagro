document.addEventListener('DOMContentLoaded', () => {

    // ---- Funções Auxiliares ----
    function calcularTotalPes() {
        const areaHa = parseFloat(document.getElementById('talhao-area').value);
        const espLinhas = parseFloat(document.getElementById('talhao-esp-linhas').value);
        const espPlantas = parseFloat(document.getElementById('talhao-esp-plantas').value);

        if (!isNaN(areaHa) && areaHa > 0 &&
            !isNaN(espLinhas) && espLinhas > 0 &&
            !isNaN(espPlantas) && espPlantas > 0) {

            const areaM2 = areaHa * 10000; // 1 ha = 10.000 m²
            const plantasPorM2 = 1 / (espLinhas * espPlantas);
            const totalPes = Math.floor(areaM2 * plantasPorM2);

            document.getElementById('talhao-total-pes').value = totalPes;
        } else {
            document.getElementById('talhao-total-pes').value = '';
        }
    }

    // Atualizar automaticamente o total de pés ao digitar
    ['talhao-area', 'talhao-esp-linhas', 'talhao-esp-plantas'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', calcularTotalPes);
    });

    // Melhoria de Usabilidade: Cálculo de custo em tempo real
    async function calcularCustoAtividade() {
        const colaboradorId = document.getElementById('tarefa-colaborador').value;
        const maquinarioId = document.getElementById('tarefa-maquinario').value;
        const horas = parseFloat(document.getElementById('tarefa-horas').value) || 0;

        if (!colaboradorId || !maquinarioId || !horas) {
            document.getElementById('tarefa-custo-estimado').value = formatCurrency(0);
            return;
        }

        const colaborador = await getDataById('colaboradores', parseInt(colaboradorId));
        const maquinario = await getDataById('maquinario', parseInt(maquinarioId));

        const custoMaoDeObra = (colaborador?.valor_hora || 0) * horas; // valor_hora é calculado no cadastro
        const custoMaquinario = (maquinario?.consumo_combustivel || 0) * (maquinario?.preco_combustivel || 0) * horas;
        const custoTotal = custoMaoDeObra + custoMaquinario;

        document.getElementById('tarefa-custo-estimado').value = formatCurrency(custoTotal);
    }
    ['tarefa-colaborador', 'tarefa-maquinario', 'tarefa-horas'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', calcularCustoAtividade);
    });

    // Melhoria de Usabilidade: Cálculo de valor total da venda rápida
    function calcularVendaRapidaTotal() {
        const sacas = parseFloat(document.getElementById('venda-rapida-sacas').value) || 0;
        const preco = parseFloat(document.getElementById('venda-rapida-preco-saca').value) || 0;
        document.getElementById('venda-rapida-total').value = formatCurrency(sacas * preco);
    }
    ['venda-rapida-sacas', 'venda-rapida-preco-saca'].forEach(id => document.getElementById(id).addEventListener('input', calcularVendaRapidaTotal));

    // Melhoria de Usabilidade: Puxar área do talhão automaticamente no Planejamento
    const planejamentoTalhaoSelect = document.getElementById('planejamento-talhao');
    if (planejamentoTalhaoSelect) {
        planejamentoTalhaoSelect.addEventListener('change', async (event) => {
            const talhaoId = parseInt(event.target.value);
            if (talhaoId) {
                const talhao = await getDataById('talhoes', talhaoId);
                if (talhao && talhao.area) {
                    document.getElementById('planejamento-area').value = talhao.area;
                }
            } else {
                document.getElementById('planejamento-area').value = ''; // Limpa se nenhum talhão for selecionado
            }
        });
    }

    // Melhoria de Usabilidade: Cálculo de valor/hora do colaborador
    function calcularValorHora() {
        const salario = parseFloat(document.getElementById('colaborador-salario').value) || 0;
        const jornada = parseFloat(document.getElementById('colaborador-jornada').value) || 0;
        const valorHoraInput = document.getElementById('colaborador-valor-hora');

        if (salario > 0 && jornada > 0) {
            const valorHora = salario / jornada; // O valor é numérico
            valorHoraInput.value = valorHora.toFixed(2); // Exibe como número, a formatação é visual
        } else {
            valorHoraInput.value = '';
        }
    }
    ['colaborador-salario', 'colaborador-jornada'].forEach(id => document.getElementById(id)?.addEventListener('input', calcularValorHora));


    // ---- Estado da Aplicação ----
    let db;
    let currentPanel = 'login-panel';
    // A inicialização do DB agora é mais direta para garantir estabilidade.
    let dbPromise;

    const painelTitulos = {
        'dashboard-home': 'Dashboard Principal',
        'fazendas-painel': 'Gestão de Fazendas',
        'talhoes-painel': 'Gestão de Talhões',
        'planejamento-painel': 'Planejamento e Previsão de Safras',
        'estoque-painel': 'Estoque',
        'aplicacoes-painel': 'Registro de Aplicações',
        'vendas-painel': 'Registro de Vendas',
        'colaboradores-painel': 'Gestão de Colaboradores',
        'maquinario-painel': 'Gestão de Maquinário',
        'atividades-painel': 'Gerenciar Atividades',
        'financas-painel': 'Resumo Financeiro',
        'dre-painel': 'DRE',
        'seguros-painel': 'Seguros',
        'alertas-painel': 'Alertas',
        'perfil-painel': 'Meu Perfil',
        'manutencao-painel': 'Plano de Manutenção',
        'relatorios-painel': 'Relatórios Gerenciais'
    };

    // Melhoria de Lógica: Mapeamento de painéis para funções de renderização
    const painelRenderFunctions = {
        'dashboard-home': popularDashboard,
        'financas-painel': renderFinancas,
        'fazendas-painel': renderFazendas,
        'estoque-painel': renderEstoque,
        'aplicacoes-painel': renderAplicacoes,
        'vendas-painel': renderVendas,
        'colaboradores-painel': renderColaboradores,
        'maquinario-painel': renderMaquinario,
        'atividades-painel': renderAtividades,
        'talhoes-painel': renderTalhoes,
        'planejamento-painel': renderPlanejamentos,
        'dre-painel': popularSelectDRE,
        'seguros-painel': renderSeguros,
        'alertas-painel': renderAlertas,
        'manutencao-painel': renderManutencao,
        'perfil-painel': renderPerfil,
        'relatorios-painel': renderRelatorios
    };
   

    // ---- Funções de Banco de Dados (IndexedDB) ----
  function openDatabase() {
return new Promise((resolve, reject) => {
const request = indexedDB.open('erpAgrarioDB', 13); // Incrementado para resolver o conflito de versão

request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains('usuarios')) {
      db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('fazendas')) {
      db.createObjectStore('fazendas', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('talhoes')) {
      db.createObjectStore('talhoes', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('safras')) {
      db.createObjectStore('safras', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('estoque')) {
      db.createObjectStore('estoque', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('aplicacoes')) {
      db.createObjectStore('aplicacoes', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('vendas')) {
      db.createObjectStore('vendas', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('colaboradores')) {
      db.createObjectStore('colaboradores', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('maquinario')) {
      db.createObjectStore('maquinario', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('atividades')) {
      db.createObjectStore('atividades', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('financas')) {
      db.createObjectStore('financas', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('alertas')) {
      db.createObjectStore('alertas', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('seguros')) {
      db.createObjectStore('seguros', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('manutencoes')) {
      db.createObjectStore('manutencoes', { keyPath: 'id', autoIncrement: true });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  resolve(db);
};

request.onerror = (event) => {
  reject('Erro ao abrir o banco de dados: ' + (event.target.error || event.target.errorCode));
};

request.onblocked = () => {
  reject('Abertura do DB bloqueada por outra conexão');
};
});
}
   

    async function addData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function updateData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function deleteData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function getData(storeName) {
        // Revertido para o método direto e estável, sem cache.
        await dbPromise; // Garante que o DB esteja pronto
        if (!db) throw new Error("A conexão com o banco de dados falhou.");
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function getDataById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // ---- Funções de UI ----
    function showToast(message, isSuccess = true) {
        if (!bootstrap) return; // Evita erro se o bootstrap não carregou
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toast-body');
       
        toastBody.textContent = message;
        toastEl.className = `toast align-items-center text-white border-0 ${isSuccess ? 'bg-success' : 'bg-danger'}`;
       
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    async function showPanel(panelId) {
        document.body.classList.remove('login-active');
        document.getElementById('login-panel').classList.add('d-none');
        document.getElementById('dashboard').classList.remove('d-none');

        // Esconde todos os painéis
        Object.keys(painelRenderFunctions).forEach(id => {
            const panel = document.getElementById(id);
            if (panel) panel.classList.add('d-none');
        });

        // Mostra o painel solicitado
        const panelToShow = document.getElementById(panelId);
        if (panelToShow) {
            panelToShow.classList.remove('d-none');
        }

        // Atualiza o título
        if (painelTitulos[panelId]) {
            document.getElementById('painel-titulo').textContent = painelTitulos[panelId];
        } else {
            document.getElementById('painel-titulo').textContent = 'ERP Agrícola';
        }

        // Chama a função de renderização correspondente
        const renderFunction = painelRenderFunctions[panelId];
        if (renderFunction) {
            await renderFunction();
        }

        popularSelects();
    }

      async function handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const usuarios = await getData('usuarios');
            const user = usuarios.find(u => u.username === username && u.password === password);

            if (user) {
                showPanel('dashboard-home');
            } else {
                showToast('Nome de usuário ou senha incorretos.', false);
            }
        } catch (error) {
            showToast('Erro ao tentar logar. Tente novamente.', false);
            console.error(error);
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            showToast('As senhas não coincidem!', false);
            return;
        }

        try {
            const usuarios = await getData('usuarios');
            const userExists = usuarios.some(u => u.username === username);
            if (userExists) {
                showToast('Nome de usuário já existe. Escolha outro.', false);
                return;
            }

            await addData('usuarios', { username, password });
            showToast('Usuário registrado com sucesso! Faça o login.');
            document.getElementById('login-tab').click();
            document.getElementById('register-form').reset(); // Limpa o formulário após o sucesso
        } catch (error) {
            showToast('Erro ao registrar. Tente novamente.', false);
            console.error(error);
        }
    }

    function handleLogout() {
        document.body.classList.add('login-active');
        document.getElementById('dashboard').classList.add('d-none');
        document.getElementById('login-panel').classList.remove('d-none');
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        showToast('Sessão encerrada.');
    }

    async function popularDashboard() {
        const alertas = await getData('alertas');
        const fazendas = await getData('fazendas');
        const talhoes = await getData('talhoes');
        const estoque = await getData('estoque');
        const atividades = await getData('atividades');
       
        showSpinner('lista-alertas-dashboard');
        document.getElementById('total-fazendas').textContent = fazendas.length;
        document.getElementById('total-talhoes').textContent = talhoes.length;
        document.getElementById('total-estoque').textContent = estoque.length;
       
        renderAtividadesDashboard(atividades);
        popularAnalisesDashboard(); // Melhoria para Tomada de Decisão
        buscarCotacoes(); // Melhoria de Funcionalidade: Dados em tempo real
        buscarPrevisaoTempo(); // Melhoria de Funcionalidade: Dados em tempo real

        const listaAlertas = document.getElementById('lista-alertas-dashboard');
        listaAlertas.innerHTML = '';
        if (alertas.length === 0) {
            listaAlertas.innerHTML = '<li class="list-group-item">Nenhum alerta pendente.</li>';
        } else {
            alertas.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `<strong>${item.tipo.toUpperCase()}:</strong> ${item.descricao} <span class="badge bg-danger">${item.criticidade.toUpperCase()}</span>`;
                listaAlertas.appendChild(li);
            });
        }
    }

    // Melhoria de Funcionalidade: Buscar cotações em tempo real
    async function buscarCotacoes() {
        // Usando dados de exemplo fixos para evitar erros de API
        document.getElementById('cotacao-soja').textContent = 'R$ 135,00/sc';
        document.getElementById('cotacao-milho').textContent = 'R$ 68,50/sc';
        document.getElementById('cotacao-cafe').textContent = 'R$ 2.189,00';
        document.getElementById('cotacao-dolar').textContent = 'R$ 5,33';
    }

    // Melhoria de Funcionalidade: Buscar previsão do tempo
    async function buscarPrevisaoTempo() {
        // Usando dados de exemplo fixos para evitar erros de API
        document.getElementById('temp-hoje').textContent = '25°C';
        document.getElementById('condicao-hoje').textContent = 'Sol com nuvens';
    }

    // Melhoria de UX: Funções para mostrar/ocultar spinner
    function showSpinner(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="d-flex justify-content-center align-items-center p-5">
                    <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div>
                </div>`;
        }
    }

    async function popularSelects() {
        const fazendas = await getData('fazendas');
        const talhoes = await getData('talhoes');
        const safras = await getData('safras');
        const estoque = await getData('estoque');
        const colaboradores = await getData('colaboradores');
        const maquinario = await getData('maquinario');
       
        const selectsToClear = [
            'talhao-fazenda', 'safra-talhao', 'aplicacao-talhao',
            'aplicacao-produto', 'venda-talhao', 'venda-safra', 'planejamento-talhao',
            'venda-rapida-talhao', 'venda-rapida-safra', 'despesa-rapida-talhao', 'manutencao-maquina-select', 'manutencao-historico-select',
            'relatorio-talhao-select',
            'tarefa-talhao',
            'tarefa-colaborador', 'tarefa-maquinario', 'financa-talhao', 'seguro-referencia'
        ];
        selectsToClear.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '';
                if (!select.hasAttribute('multiple')) {
                    select.innerHTML += '<option value="">Selecione...</option>';
                }
            }
        });

        if (document.getElementById('talhao-fazenda')) {
            fazendas.forEach(item => {
                document.getElementById('talhao-fazenda').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('planejamento-talhao')) {
            const select = document.getElementById('planejamento-talhao');
            // Adiciona a opção "Todos" se houver mais de um talhão
            if (talhoes.length > 1) {
                select.innerHTML += `<option value="todos">Todos os Talhões</option>`;
            }
            talhoes.forEach(item => {
                select.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('aplicacao-talhao')) {
            talhoes.forEach(item => {
                document.getElementById('aplicacao-talhao').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('aplicacao-produto')) {
            estoque.forEach(item => {
                document.getElementById('aplicacao-produto').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('venda-talhao')) {
            talhoes.forEach(item => {
                document.getElementById('venda-talhao').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('venda-safra')) {
            safras.forEach(item => {
                document.getElementById('venda-safra').innerHTML += `<option value="${item.id}">${item.ano}</option>`;
            });
        }
        // Popula selects dos modais de acesso rápido
        if (document.getElementById('venda-rapida-talhao')) {
            talhoes.forEach(item => {
                document.getElementById('venda-rapida-talhao').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('despesa-rapida-talhao')) {
            talhoes.forEach(item => {
                document.getElementById('despesa-rapida-talhao').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('relatorio-talhao-select')) {
            talhoes.forEach(item => {
                document.getElementById('relatorio-talhao-select').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('relatorio-produtividade-select')) {
            const select = document.getElementById('relatorio-produtividade-select');
            select.innerHTML = '<option value="">Selecione...</option>';
            select.innerHTML += '<optgroup label="Colaboradores">';
            colaboradores.forEach(c => select.innerHTML += `<option value="colaborador-${c.id}">${c.nome}</option>`);
            select.innerHTML += '</optgroup>';
            select.innerHTML += '<optgroup label="Maquinário">';
            maquinario.forEach(m => select.innerHTML += `<option value="maquina-${m.id}">${m.nome}</option>`);
            select.innerHTML += '</optgroup>';
        }
        if (document.getElementById('manutencao-maquina-select')) {
            maquinario.forEach(item => document.getElementById('manutencao-maquina-select').innerHTML += `<option value="${item.id}">${item.nome}</option>`);
        }
        if (document.getElementById('manutencao-historico-select')) {
            maquinario.forEach(item => document.getElementById('manutencao-historico-select').innerHTML += `<option value="${item.id}">${item.nome}</option>`);
            document.getElementById('manutencao-historico-select').addEventListener('change', renderHistoricoManutencao);
        }
        if (document.getElementById('venda-rapida-safra')) {
            safras.forEach(item => {
                document.getElementById('venda-rapida-safra').innerHTML += `<option value="${item.id}">${item.ano}</option>`;
            });
        }
        if (document.getElementById('tarefa-talhao')) {
            talhoes.forEach(item => {
                document.getElementById('tarefa-talhao').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('tarefa-colaborador')) {
            colaboradores.forEach(item => {
                document.getElementById('tarefa-colaborador').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('tarefa-maquinario')) {
            maquinario.forEach(item => {
                document.getElementById('tarefa-maquinario').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }
        if (document.getElementById('financa-talhao')) {
            talhoes.forEach(item => {
                document.getElementById('financa-talhao').innerHTML += `<option value="${item.id}">${item.nome}</option>`;
            });
        }

        // popular seguro-referencia conforme tipo (listener)
        if (document.getElementById('seguro-tipo')) {
            document.getElementById('seguro-tipo').addEventListener('change', function () {
                const tipo = this.value;
                const refSelect = document.getElementById('seguro-referencia');
                refSelect.innerHTML = '<option value="">Selecione...</option>';
                if (!tipo) return;
                if (tipo === 'maquina') {
                    maquinario.forEach(item => {
                        refSelect.innerHTML += `<option value="maquina-${item.id}">${item.nome} (Máquina)</option>`;
                    });
                } else if (tipo === 'fazenda') {
                    fazendas.forEach(item => {
                        refSelect.innerHTML += `<option value="fazenda-${item.id}">${item.nome} (Fazenda)</option>`;
                    });
                }
            });
        }
    }

    // Melhoria para Tomada de Decisão: Análises do Dashboard
    async function popularAnalisesDashboard() {
        const financas = await getData('financas');
        const talhoes = await getData('talhoes');
        const atividades = await getData('atividades');

        // 1. Top Talhões Rentáveis
        const lucroPorTalhao = {};
        const talhaoMap = new Map(talhoes.map(t => [t.id, t.nome]));
        talhoes.forEach(t => lucroPorTalhao[t.nome] = 0);

        financas.forEach(f => {
            if (f.talhaoId) {
                const nomeTalhao = talhaoMap.get(f.talhaoId);
                if (nomeTalhao) {
                    lucroPorTalhao[nomeTalhao] += (f.tipo === 'receita' ? f.valor : -f.valor);
                }
            }
        });

        const topTalhoes = Object.entries(lucroPorTalhao)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        const listaTopTalhoes = document.getElementById('top-talhoes-rentaveis');
        listaTopTalhoes.innerHTML = '';
        if (topTalhoes.length === 0) {
            listaTopTalhoes.innerHTML = '<li class="list-group-item">Nenhum dado de lucro por talhão.</li>';
        } else {
            topTalhoes.forEach(([nome, lucro], index) => {
                listaTopTalhoes.innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>${index + 1}. ${nome}</span> <strong class="${lucro >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(lucro)}</strong></li>`;
            });
        }

        // 2. Maiores Despesas
        const custoAplicacoes = financas.filter(f => f.tipo === 'despesa' && f.descricao.includes('Custo de aplicação')).reduce((sum, f) => sum + f.valor, 0);
        const custoAtividades = atividades.reduce((sum, a) => sum + (a.custo || 0), 0);
        const custoSeguros = financas.filter(f => f.tipo === 'despesa' && f.descricao.includes('Prêmio de seguro')).reduce((sum, f) => sum + f.valor, 0);
        const outrasDespesas = financas.filter(f => f.tipo === 'despesa' && !f.descricao.includes('Custo de aplicação') && !f.descricao.includes('Prêmio de seguro')).reduce((sum, f) => sum + f.valor, 0);

        const topDespesas = [
            { nome: 'Aplicações', valor: custoAplicacoes },
            { nome: 'Atividades', valor: custoAtividades },
            { nome: 'Seguros', valor: custoSeguros },
            { nome: 'Despesas Gerais', valor: outrasDespesas }
        ].sort((a, b) => b.valor - a.valor).slice(0, 3);

        const listaTopDespesas = document.getElementById('top-despesas');
        listaTopDespesas.innerHTML = '';
        topDespesas.forEach((despesa, index) => {
            listaTopDespesas.innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>${index + 1}. ${despesa.nome}</span> <strong>${formatCurrency(despesa.valor)}</strong></li>`;
        });
    }
   
    // Atividades do Dia / Tarefas
    async function renderAtividadesDashboard(atividades) {
        const listaAtividades = document.getElementById('tarefas-hoje');
        listaAtividades.innerHTML = '';
       
        const today = new Date().toISOString().split('T')[0];
        const atividadesHoje = atividades.filter(t => t.data === today);

        if (atividadesHoje.length === 0) {
            listaAtividades.innerHTML = '<li class="list-group-item d-flex justify-content-between align-items-center">Nenhuma tarefa agendada para hoje.</li>';
        } else {
            // Ordena para mostrar as não concluídas primeiro
            atividadesHoje.sort((a, b) => (a.status === 'concluido') - (b.status === 'concluido'));
            atividadesHoje.forEach(async atividade => {
                const li = document.createElement('li');
                const isCompleted = atividade.status === 'concluido';
                li.className = `list-group-item d-flex justify-content-between align-items-center tarefa-item ${isCompleted ? 'completed' : ''}`;
                li.innerHTML = `
                    <div class="d-flex align-items-center">
                        <input type="checkbox" class="form-check-input me-3 tarefa-checkbox" data-id="${atividade.id}" ${isCompleted ? 'checked' : ''}>
                        <span>${atividade.descricao}</span>
                    </div>
                    ${isCompleted 
                        ? '<span class="badge bg-success">Concluída!</span>'
                        : ''
                    }
                `;
                listaAtividades.appendChild(li);
            });
        }
    }
   
    // Atividades (aba completa)
    async function renderAtividades() {
        const atividades = await getData('atividades');
        const talhoes = await getData('talhoes');
        const colaboradores = await getData('colaboradores');
        const maquinario = await getData('maquinario');
        const listaAtividades = document.getElementById('lista-atividades');
        listaAtividades.innerHTML = '';
       
        if (atividades.length === 0) { 
            listaAtividades.innerHTML = '<div class="alert alert-info">Nenhuma atividade agendada.</div>';
            return;
        }
 
        atividades.sort((a, b) => new Date(a.data) - new Date(b.data));

        atividades.forEach(atividade => {
            const talhaoNome = talhoes.find(t => t.id === parseInt(atividade.talhaoId))?.nome || 'Não Encontrado';
            const colaboradorNome = colaboradores.find(c => c.id === parseInt(atividade.colaboradorId))?.nome || 'Não Encontrado';
            const maquinarioNome = maquinario.find(m => m.id === parseInt(atividade.maquinarioId))?.nome || 'Não Encontrado';

            const isCompleted = atividade.status === 'concluido';
            const card = document.createElement('div');
            card.className = `card p-3 mb-2 ${isCompleted ? 'opacity-75' : ''}`;
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center tarefa-item ${isCompleted ? 'completed' : ''}">
                    <div class="d-flex align-items-center">
                        <input type="checkbox" class="form-check-input me-3 tarefa-checkbox" data-id="${atividade.id}" ${isCompleted ? 'checked' : ''}>
                        <div>
                            <h5 class="card-title mb-1">${atividade.descricao}</h5>
                            <p class="card-text text-muted mb-0">Talhão: ${talhaoNome} | Data: ${new Date(atividade.data).toLocaleDateString()}</p>
                            <p class="card-text text-muted mb-0">Colaborador: ${colaboradorNome} | Maquinário: ${maquinarioNome} | Horas: ${atividade.horas}</p>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm btn-editar-atividade me-2" data-id="${atividade.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-atividade" data-id="${atividade.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaAtividades.appendChild(card);
        });
    }

    async function handleFormTarefa(event) {
        event.preventDefault();
        const id = document.getElementById('tarefa-id').value; // Adicionado para edição
        const talhaoId = document.getElementById('tarefa-talhao').value;
        const colaboradorId = document.getElementById('tarefa-colaborador').value;
        const maquinarioId = document.getElementById('tarefa-maquinario').value;
        const descricao = document.getElementById('tarefa-descricao').value;
        const horas = parseFloat(document.getElementById('tarefa-horas').value);
        const data = document.getElementById('tarefa-data').value;

        const custoTotal = parseFloat(document.getElementById('tarefa-custo-estimado').value.replace('R$', '').replace('.', '').replace(',', '.').trim());

        const novaAtividade = {
            id: id ? parseInt(id) : undefined,
            talhaoId: parseInt(talhaoId),
            colaboradorId: parseInt(colaboradorId),
            maquinarioId: parseInt(maquinarioId),
            descricao,
            horas,
            data, 
            status: 'a-fazer', // Status inicial
            custo: custoTotal
        };

        if (id) {
            await updateData('atividades', novaAtividade);
            showToast('Atividade atualizada com sucesso.');
        } else {
            delete novaAtividade.id; // Remove o ID indefinido para o addData
            await addData('atividades', novaAtividade);
            // Melhoria de Lógica: Atualiza horas de uso da máquina
            await atualizarHorasMaquina(parseInt(maquinarioId), horas);
            showToast('Atividade adicionada com sucesso.');
        }

        document.getElementById('form-tarefa').reset();
       
        // Se o formulário estiver dentro de um modal, fecha o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAtividade'));
        if (document.activeElement) document.activeElement.blur();
        if (modal) modal.hide();
        renderAtividades();
        popularDashboard();
    }
   
    // Melhoria de Lógica: Atualiza horas de uso e cria alerta de manutenção
    async function atualizarHorasMaquina(maquinarioId, horas) {
        const maquina = await getDataById('maquinario', maquinarioId);
        if (!maquina) return;

        maquina.horas_uso = (maquina.horas_uso || 0) + horas;
        await updateData('maquinario', maquina);

        // Verifica se a manutenção está próxima (ex: faltando 50 horas ou menos)
        const horasParaManutencao = maquina.proxima_manutencao_horas - maquina.horas_uso;
        if (horasParaManutencao <= 50) {
            const alertaData = {
                tipo: 'manutencao',
                criticidade: horasParaManutencao <= 0 ? 'alta' : 'media',
                data: new Date().toISOString().split('T')[0],
                descricao: `Manutenção necessária para a máquina "${maquina.nome}". Horas restantes: ${horasParaManutencao.toFixed(0)}.`
            };
            // Evita criar alertas duplicados
            const alertas = await getData('alertas');
            const jaExiste = alertas.some(a => a.tipo === 'manutencao' && a.descricao.includes(`"${maquina.nome}"`));
            if (!jaExiste) { await addData('alertas', alertaData); }
        }
    }

    // Função unificada para alterar o status da atividade
    async function toggleAtividadeStatus(id, isChecked) {
        const atividade = await getDataById('atividades', id);
        if (!atividade) return;

        atividade.status = isChecked ? 'concluido' : 'a-fazer';
        await updateData('atividades', atividade);
        showToast(`Atividade marcada como ${isChecked ? 'concluída' : 'pendente'}.`);
        
        // Re-renderiza os painéis que podem estar visíveis para refletir a mudança
        if (document.getElementById('dashboard-home').offsetParent !== null) {
            await popularDashboard();
        }
        if (document.getElementById('atividades-painel').offsetParent !== null) {
            await renderAtividades();
        }
    }

    // Delegação de eventos para botões de exclusão de tarefas
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-excluir-atividade')) {
            const button = e.target.closest('.btn-excluir-atividade');
            const id = parseInt(button.dataset.id);
            if (!confirm('Tem certeza que deseja excluir esta atividade?')) {
                return;
            }
            await deleteData('atividades', id);
            showToast('Atividade excluída com sucesso.'); 
            if (document.getElementById('dashboard-home').offsetParent !== null) await popularDashboard();
            if (document.getElementById('atividades-painel').offsetParent !== null) await renderAtividades();
        }
    });
   
         async function renderFazendas() {
        const fazendas = await getData('fazendas');
        showSpinner('lista-fazendas');
        const listaFazendas = document.getElementById('lista-fazendas');
        listaFazendas.innerHTML = '';
        if (fazendas.length === 0) {
            listaFazendas.innerHTML = '<div class="alert alert-info">Nenhuma fazenda cadastrada.</div>';
            return;
        }
        fazendas.forEach(fazenda => {
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="card-title mb-1">${fazenda.nome}</h5>
                            <div class="card-details text-muted small">
                                <span><i class="bi bi-person-fill me-1"></i> ${fazenda.proprietario}</span>
                                <span><i class="bi bi-rulers me-1"></i> Total: ${fazenda.area} ha</span>
                                <span><i class="bi bi-tree-fill me-1"></i> Reserva: ${fazenda.area_reserva} ha</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm btn-editar-fazenda me-2" data-id="${fazenda.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-fazenda" data-id="${fazenda.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaFazendas.appendChild(card);
        });
    }
    async function handleFormFazenda(event) {
        event.preventDefault();
        const id = document.getElementById('fazenda-id').value;
        const nome = document.getElementById('fazenda-nome').value;
        const proprietario = document.getElementById('fazenda-proprietario').value.trim();
        const area = parseFloat(document.getElementById('fazenda-area').value);
        const area_producao = parseFloat(document.getElementById('fazenda-area-producao').value);
        const area_reserva = parseFloat(document.getElementById('fazenda-area-reserva').value);

        if (!nome.trim() || !proprietario || isNaN(area) || area <= 0 || isNaN(area_producao) || area_producao < 0 || isNaN(area_reserva) || area_reserva < 0) {
            showToast('Por favor, preencha todos os campos da fazenda.', false);
            return;
        }

        const data = { nome: nome.trim(), proprietario, area, area_producao, area_reserva };
        if (id) {
            data.id = parseInt(id);
            await updateData('fazendas', data);
            showToast('Fazenda atualizada com sucesso.');
        } else {
            await addData('fazendas', data);
            showToast('Fazenda adicionada com sucesso.');
        }

        document.getElementById('form-fazenda').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalFazenda'));
        if (document.activeElement) document.activeElement.blur();
        if (modal) modal.hide();
        renderFazendas();
        popularSelects();
    }

    // Talhões
    async function renderTalhoes() {
        // Esta função não precisa mais existir, pois o conteúdo está dentro do modal.
        // A lógica de renderização da lista permanece.
        showSpinner('lista-talhoes');
        const talhoes = await getData('talhoes');
        const fazendas = await getData('fazendas');
        const listaTalhoes = document.getElementById('lista-talhoes');
        listaTalhoes.innerHTML = '';
        if (talhoes.length === 0) {
            listaTalhoes.innerHTML = '<div class="alert alert-info">Nenhum talhão cadastrado.</div>';
            return;
        }
        talhoes.forEach(talhao => {
            const fazendaNome = fazendas.find(f => f.id === parseInt(talhao.fazendaId))?.nome || 'Fazenda não encontrada';
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title">${talhao.nome}</h5>
                        <div class="card-details text-muted">
                            <span><i class="bi bi-geo-alt-fill me-1"></i> ${fazendaNome}</span>
                            <span><i class="bi bi-flower1 me-1"></i> ${talhao.cultura}</span>
                                <span><i class="bi bi-calendar3 me-1"></i> Plantio: ${talhao.ano_plantio}</span>
                            <span><i class="bi bi-rulers me-1"></i> ${talhao.area} ha</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm btn-editar-talhao me-2" data-id="${talhao.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-talhao" data-id="${talhao.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaTalhoes.appendChild(card);
        });
    }
    async function handleFormTalhao(event) {
        event.preventDefault();
        const id = document.getElementById('talhao-id').value;
        const nome = document.getElementById('talhao-nome').value;
        const fazendaId = parseInt(document.getElementById('talhao-fazenda').value);
        const cultura = document.getElementById('talhao-cultura').value;
        const area = parseFloat(document.getElementById('talhao-area').value);
        const ano_plantio = parseInt(document.getElementById('talhao-ano-plantio').value);
        const esp_linhas = parseFloat(document.getElementById('talhao-esp-linhas').value);
        const esp_plantas = parseFloat(document.getElementById('talhao-esp-plantas').value);
        const total_pes = parseFloat(document.getElementById('talhao-total-pes').value);
   
        if (!nome.trim() || !fazendaId || !cultura.trim() || isNaN(area) || area <= 0 || isNaN(ano_plantio) || ano_plantio <= 1900 || isNaN(esp_linhas) || esp_linhas <= 0 || isNaN(esp_plantas) || esp_plantas <= 0) {
            showToast('Por favor, preencha todos os campos do talhão.', false);
            return;
        }

        const data = { nome: nome.trim(), fazendaId, cultura: cultura.trim(), area, ano_plantio, esp_linhas, esp_plantas, total_pes };

        if (id) {
            data.id = parseInt(id);
            await updateData('talhoes', data);
            showToast('Talhão atualizado com sucesso.');
        } else {
            await addData('talhoes', data);
            showToast('Talhão adicionado com sucesso.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalTalhao'));
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('form-talhao').reset();
        if (modal) modal.hide();
        renderTalhoes(); // Re-renderiza a lista
        popularSelects();
    }

    // Planejamentos
    async function renderPlanejamentos() {
        showSpinner('lista-planejamentos');
        const planejamentos = await getData('safras'); // Continua usando a store 'safras'
        const talhoes = await getData('talhoes');
        const listaPlanejamentos = document.getElementById('lista-planejamentos');
        listaPlanejamentos.innerHTML = '';
        if (planejamentos.length === 0) {
            listaPlanejamentos.innerHTML = '<div class="alert alert-info">Nenhum planejamento de safra encontrado.</div>';
            return;
        }
        planejamentos.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';

            if (p.consolidado) {
                p.talhaoNome = talhoes.find(t => t.id === parseInt(p.talhaoId))?.nome;
                card.innerHTML = getComparisonCard(p);
            } else {
                const talhaoNome = talhoes.find(t => t.id === parseInt(p.talhaoId))?.nome || 'N/A';
                const custoTotal = p.area * p.custo_ha;
                const producaoTotal = p.area * p.produtividade;
                const receitaBruta = producaoTotal * p.preco_saca;
                const lucroLiquido = receitaBruta - custoTotal;
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                            <h5 class="card-title">${p.nome}</h5>
                            <p class="card-text text-muted">Talhão: ${talhaoNome} | Cultura: ${p.cultura} | Área: ${p.area} ha</p>
                            <div class="row mt-3">
                                <div class="col-md-3"><strong>Custo Total:</strong><br>${formatCurrency(custoTotal)}</div>
                                <div class="col-md-3"><strong>Produção Total:</strong><br>${producaoTotal.toFixed(2)} scs</div>
                                <div class="col-md-3"><strong>Receita Bruta:</strong><br>${formatCurrency(receitaBruta)}</div>
                                <div class="col-md-3"><strong>Lucro Líquido:</strong><br><strong class="${lucroLiquido >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(lucroLiquido)}</strong></div>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-success btn-sm btn-consolidar-safra me-2" data-id="${p.id}" data-bs-toggle="modal" data-bs-target="#modalConsolidarSafra">Consolidar Safra</button>
                            <button class="btn btn-warning btn-sm btn-editar-planejamento me-2" data-id="${p.id}">Editar</button>
                            <button class="btn btn-danger btn-sm btn-excluir-planejamento" data-id="${p.id}">Excluir</button>
                        </div>
                    </div>
                `;
            }

            listaPlanejamentos.appendChild(card);
        });
    }

    function getComparisonCard(p) {
        const talhaoNome = p.talhaoNome || 'N/A';
        // PREVISTO
        const custoPrevisto = p.area * p.custo_ha;
        const producaoPrevista = p.area * p.produtividade;
        const receitaPrevista = producaoPrevista * p.preco_saca;
        const lucroPrevisto = receitaPrevista - custoPrevisto;
        // REALIZADO
        const custoReal = p.custo_real || 0;
        const producaoReal = p.producao_real || 0;
        const receitaReal = producaoReal * (p.preco_venda_real || 0);
        const lucroReal = receitaReal - custoReal;

        const renderRow = (label, previsto, realizado) => {
            const diff = realizado - previsto;
            const isGood = (label.includes('Lucro') || label.includes('Receita') || label.includes('Produção')) ? diff >= 0 : diff <= 0;
            const diffIcon = isGood ? 'bi-arrow-up-circle-fill text-success' : 'bi-arrow-down-circle-fill text-danger';
            const diffClass = isGood ? 'text-success' : 'text-danger';
            const diffFormatted = (label.includes('Produção')) ? diff.toFixed(2) : formatCurrency(diff);

            return `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td>${(label.includes('Produção')) ? previsto.toFixed(2) : formatCurrency(previsto)}</td>
                    <td>${(label.includes('Produção')) ? realizado.toFixed(2) : formatCurrency(realizado)}</td>
                    <td class="${diffClass}"><i class="bi ${diffIcon}"></i> ${diffFormatted}</td>
                </tr>
            `;
        };

        return `
            <h5 class="card-title">${p.nome} - Comparativo</h5>
            <p class="card-text text-muted">Talhão: ${talhaoNome} | Cultura: ${p.cultura} | Área: ${p.area} ha</p>
            <table class="table table-sm table-bordered mt-3">
                <thead class="table-light"><tr><th>Métrica</th><th>Previsto</th><th>Realizado</th><th>Diferença</th></tr></thead>
                <tbody>
                    ${renderRow('Custo Total', custoPrevisto, custoReal)}
                    ${renderRow('Produção Total (scs)', producaoPrevista, producaoReal)}
                    ${renderRow('Receita Bruta', receitaPrevista, receitaReal)}
                    ${renderRow('Lucro Líquido', lucroPrevisto, lucroReal)}
                </tbody>
            </table>
            <div class="text-end mt-2">
                <button class="btn btn-danger btn-sm btn-excluir-planejamento" data-id="${p.id}">Excluir</button>
            </div>
        `;
    }

    async function handleFormPlanejamento(event) {
        event.preventDefault();
        const id = document.getElementById('planejamento-id').value;
        const nome = document.getElementById('planejamento-nome').value;
        const talhaoValue = document.getElementById('planejamento-talhao').value;
        const cultura = document.getElementById('planejamento-cultura').value;
        const area = parseFloat(document.getElementById('planejamento-area').value);
        const custo_ha = parseFloat(document.getElementById('planejamento-custo-ha').value);
        const produtividade = parseFloat(document.getElementById('planejamento-produtividade').value);
        const preco_saca = parseFloat(document.getElementById('planejamento-preco-saca').value);

        // Corrige a validação para aceitar a opção "todos"
        const talhaoId = talhaoValue === 'todos' ? 'todos' : parseInt(talhaoValue);
        if (!nome.trim() || !talhaoId || !cultura.trim() || isNaN(area) || isNaN(custo_ha) || isNaN(produtividade) || isNaN(preco_saca)) {
            showToast('Por favor, preencha todos os campos do planejamento.', false);
            return;
        }

        const data = { nome: nome.trim(), talhaoId, cultura: cultura.trim(), area, custo_ha, produtividade, preco_saca };
        if (id) {
            data.id = parseInt(id);
            await updateData('safras', data); // Continua usando a store 'safras'
            showToast('Planejamento atualizado com sucesso.');
        } else {
            await addData('safras', data); // Continua usando a store 'safras'
            showToast('Planejamento adicionado com sucesso.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPlanejamento'));
        document.getElementById('form-planejamento').reset();
        if (document.activeElement) document.activeElement.blur();
        if (modal) modal.hide();
        renderPlanejamentos(); // Re-renderiza a lista
        popularSelects();
    }
   
    // Função para converter Array de Objetos para CSV
    function convertToCSV(data) {
        if (!data || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => {
                let value = row[header];
                if (typeof value === 'string' && value.includes(',')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    }

    // Estoque
    async function renderEstoque(filtro = '') {
        showSpinner('tabela-estoque-container');
        const estoque = await getData('estoque');
        const container = document.getElementById('tabela-estoque-container');
        container.innerHTML = '';

        const valorTotalEstoque = estoque.reduce((sum, item) => sum + (item.quantidade * item.preco_compra), 0);
        document.getElementById('estoque-valor-total').textContent = formatCurrency(valorTotalEstoque);

        const estoqueFiltrado = estoque.filter(item => item.nome.toLowerCase().includes(filtro.toLowerCase()));

        if (estoqueFiltrado.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhum item no estoque encontrado.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-hover align-middle';
        table.innerHTML = `
            <thead class="table-light">
                <tr>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Preço Unit.</th>
                    <th>Valor em Estoque</th>
                    <th class="text-end">Ações</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;

        const tbody = table.querySelector('tbody');
        estoqueFiltrado.forEach(item => {
            const isLowStock = item.quantidade <= item.quantidade_minima;
            const valorItem = item.quantidade * item.preco_compra;
            const tr = document.createElement('tr');
            tr.className = isLowStock ? 'table-warning' : '';
            tr.innerHTML = `
                <td>${item.nome} ${isLowStock ? '<i class="bi bi-exclamation-triangle-fill text-danger" title="Estoque baixo!"></i>' : ''}</td>
                <td>${item.classe}</td>
                <td>${item.quantidade} ${item.unidade}</td>
                <td>${formatCurrency(item.preco_compra)}</td>
                <td>${formatCurrency(valorItem)}</td>
                <td class="text-end">
                    <button class="btn btn-warning btn-sm btn-editar-estoque me-2" data-id="${item.id}">Editar</button>
                    <button class="btn btn-danger btn-sm btn-excluir-estoque" data-id="${item.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        container.appendChild(table);
    }

    async function handleFormEstoque(event) {
        event.preventDefault();
        const id = document.getElementById('estoque-id').value;
        const nome = document.getElementById('estoque-nome').value.trim();
        const classe = document.getElementById('estoque-classe').value;
        const grupo = document.getElementById('estoque-grupo').value;
        const quantidade = parseFloat(document.getElementById('estoque-quantidade').value.replace(',', '.'));
        const unidade = document.getElementById('estoque-unidade').value;
        const quantidade_minima = parseFloat(document.getElementById('estoque-quantidade-minima').value.replace(',', '.'));
        const preco_compra = parseFloat(document.getElementById('estoque-preco-compra').value.replace(',', '.')) || 0;

        // Validação atualizada para os novos campos
        if (!nome || !classe || !grupo || isNaN(quantidade) || !unidade || isNaN(quantidade_minima) || isNaN(preco_compra)) {
            showToast('Por favor, preencha todos os campos do produto corretamente.', false);
            return;
        }

        const data = { nome, classe, grupo, quantidade, unidade, quantidade_minima, preco_compra };
        if (id) {
            data.id = parseInt(id);
            await updateData('estoque', data);
            showToast('Item do estoque atualizado com sucesso.');
        } else {
            await addData('estoque', data);
            showToast('Item adicionado ao estoque com sucesso.');
            
            // Melhoria de Lógica: Lança a compra do estoque como despesa
            const custoTotalCompra = quantidade * (preco_compra || 0);
            if (custoTotalCompra > 0) {
                const despesaEstoque = {
                    tipo: 'despesa',
                    valor: custoTotalCompra,
                    descricao: `Compra de estoque: ${quantidade} ${unidade} de ${nome}`,
                    data: new Date().toISOString().split('T')[0] // Usa a data de hoje
                };
                await addData('financas', despesaEstoque);
            }
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstoque'));
        document.getElementById('form-estoque').reset();
        if (document.activeElement) document.activeElement.blur();
        if (modal) modal.hide();
        popularSelects();
            renderEstoque(); // Re-renderiza a lista de estoque
    }
    // Aplicações
    async function renderAplicacoes() {
        showSpinner('lista-aplicacoes');
        const aplicacoes = await getData('aplicacoes');
        const safras = await getData('safras');
        const talhoes = await getData('talhoes');
        const estoque = await getData('estoque');
        const listaAplicacoes = document.getElementById('lista-aplicacoes');
        listaAplicacoes.innerHTML = '';
        if (aplicacoes.length === 0) {
            listaAplicacoes.innerHTML = '<div class="alert alert-info">Nenhuma aplicação registrada.</div>';
            return;
        }
        aplicacoes.forEach(aplicacao => {
            const safraInfo = safras.find(s => s.id === parseInt(aplicacao.safraId)) || {};
            const talhaoInfo = talhoes.find(t => t.id === parseInt(aplicacao.talhaoId)) || {};
            const produtoInfo = estoque.find(p => p.id === parseInt(aplicacao.produtoId)) || {};
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title">Aplicação em ${talhaoInfo.nome}</h5>
                        <div class="card-details text-muted">
                            <span><i class="bi bi-calendar-event me-1"></i> ${new Date(aplicacao.data).toLocaleDateString()}</span>
                            <span><i class="bi bi-box-seam me-1"></i> ${produtoInfo.nome}</span>
                            <span><i class="bi bi-droplet-half me-1"></i> ${aplicacao.quantidade}</span>
                            <span><i class="bi bi-cash-coin me-1"></i> ${formatCurrency(aplicacao.custo)}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm btn-editar-aplicacao me-2" data-id="${aplicacao.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-aplicacao" data-id="${aplicacao.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaAplicacoes.appendChild(card);
        });
    }
    async function handleFormAplicacao(event) {
        event.preventDefault();
        const id = document.getElementById('aplicacao-id').value;
        const talhaoId = parseInt(document.getElementById('aplicacao-talhao').value);
        const data = document.getElementById('aplicacao-data').value;
        const produtoId = parseInt(document.getElementById('aplicacao-produto').value);
        const quantidade = parseFloat(document.getElementById('aplicacao-quantidade').value);
        const produto = await getDataById('estoque', produtoId);
        const custo = quantidade * (produto?.preco_compra || 0);

        if (!talhaoId || !data || !produtoId || !quantidade) {
            showToast('Por favor, preencha todos os campos da aplicação.', false);
            return;
        }

        const aplicacaoData = { talhaoId, data, produtoId, quantidade, custo };

        if (id) {
            aplicacaoData.id = parseInt(id);
            await updateData('aplicacoes', aplicacaoData);
            showToast('Aplicação atualizada com sucesso.');
        } else {
            await addData('aplicacoes', aplicacaoData);
            if (produto) {
                produto.quantidade -= quantidade;
                await updateData('estoque', produto);

                // Melhoria para Tomada de Decisão: Gerar alerta de estoque baixo
                if (produto.quantidade <= produto.quantidade_minima) {
                    const alertaData = {
                        tipo: 'estoque-baixo',
                        criticidade: 'media',
                        data: new Date().toISOString().split('T')[0],
                        descricao: `O item "${produto.nome}" atingiu o estoque mínimo. Quantidade atual: ${produto.quantidade} ${produto.unidade}.`
                    };
                    // Evita criar alertas duplicados para o mesmo item no mesmo dia
                    const alertas = await getData('alertas');
                    const jaExiste = alertas.some(a => a.tipo === 'estoque-baixo' && a.descricao.includes(`"${produto.nome}"`) && a.data === alertaData.data);
                    if (!jaExiste) await addData('alertas', alertaData);
                }
            }
            showToast('Aplicação adicionada com sucesso.');

            const despesa = {
                tipo: 'despesa',
                valor: custo,
                descricao: `Custo de aplicação: ${produto.nome}`,
                data: aplicacaoData.data,
                talhaoId
            };
            await addData('financas', despesa);
        }

        if (document.activeElement) document.activeElement.blur();
        document.getElementById('form-aplicacao').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAplicacao'));
        if (modal) modal.hide();
        popularSelects();
        renderAplicacoes(); // Atualiza a lista de aplicações
        renderEstoque(); // Atualiza a lista de estoque
    }

    // Vendas
    async function renderVendas() {
        showSpinner('lista-vendas');
        const vendas = await getData('vendas');
        const safras = await getData('safras');
        const talhoes = await getData('talhoes');
        const listaVendas = document.getElementById('lista-vendas');
        listaVendas.innerHTML = '';
        if (vendas.length === 0) {
            listaVendas.innerHTML = '<div class="alert alert-info">Nenhuma venda registrada.</div>';
            return;
        }
        vendas.forEach(venda => {
            const safraInfo = safras.find(s => s.id === parseInt(venda.safraId)) || {};
            const talhaoInfo = talhoes.find(t => t.id === parseInt(venda.talhaoId)) || {};
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title">Venda de ${venda.scs} scs de ${talhaoInfo.cultura || 'produto'}</h5>
                        <div class="card-details text-muted">
                            <span><i class="bi bi-tag me-1"></i> Preço/Saca: ${formatCurrency(venda.preco_saca)}</span>
                            <span><i class="bi bi-cash-stack me-1"></i> Total: <strong>${formatCurrency(venda.scs * venda.preco_saca)}</strong></span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm btn-editar-venda me-2" data-id="${venda.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-venda" data-id="${venda.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaVendas.appendChild(card);
        });
    }
    async function handleFormVenda(event) {
        event.preventDefault();
        const id = document.getElementById('venda-id').value;
        const talhaoId = parseInt(document.getElementById('venda-talhao').value);
        const scs = parseFloat(document.getElementById('venda-sacas').value);
        const preco_saca = parseFloat(document.getElementById('venda-preco-saca').value);
        const data = document.getElementById('venda-data').value;

            if (!talhaoId || !data || isNaN(scs) || scs <= 0 || isNaN(preco_saca) || preco_saca <= 0) {
                showToast('Por favor, preencha todos os campos da venda.', false);
                return;
            }

        const vendaData = { talhaoId, scs, preco_saca, data };

        if (id) {
            vendaData.id = parseInt(id); 
            await updateData('vendas', vendaData);
            showToast('Venda atualizada com sucesso.');
        } else {
            const newId = await addData('vendas', vendaData);
            vendaData.id = newId; // Adiciona o ID para a lógica de receita

            showToast('Venda adicionada com sucesso.');

            const receita = {
                tipo: 'receita',
                valor: scs * preco_saca,
            descricao: `Venda de ${scs} scs`,
                data,
                talhaoId
            };
            await addData('financas', receita);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalVenda'));
        document.getElementById('form-venda').reset();
        if (document.activeElement) document.activeElement.blur();
        if (modal) modal.hide();
        renderVendas(); // Atualiza a lista de vendas
        renderFinancas();
    }

    // Colaboradores
    async function renderColaboradores() {
        showSpinner('lista-colaboradores');
        const colaboradores = await getData('colaboradores');
        const listaColaboradores = document.getElementById('lista-colaboradores');
        listaColaboradores.innerHTML = '';
        if (colaboradores.length === 0) {
            listaColaboradores.innerHTML = '<div class="alert alert-info">Nenhum colaborador cadastrado.</div>';
            return;
        }
        colaboradores.forEach(colaborador => {
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title">${colaborador.nome}</h5>
                        <div class="card-details text-muted">
                            <span><i class="bi bi-person-badge me-1"></i> Cargo: ${colaborador.cargo || 'N/A'}</span>
                            <span><i class="bi bi-cash me-1"></i> Valor/Hora: ${formatCurrency(colaborador.valor_hora)}</span>
                            <span><i class="bi bi-calendar-plus me-1"></i> Admissão: ${colaborador.admissao ? new Date(colaborador.admissao).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm btn-editar-colaborador me-2" data-id="${colaborador.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-colaborador" data-id="${colaborador.id}">Excluir</button>
                    </div>
                </div>
            `;
                            listaColaboradores.appendChild(card);
        });
    }
    async function handleFormColaborador(event) {
        event.preventDefault();
        const id = document.getElementById('colaborador-id').value;
        const nome = document.getElementById('colaborador-nome').value;
        const cpf = document.getElementById('colaborador-cpf').value;
        const filiacao_mae = document.getElementById('colaborador-filiacao-mae').value;
        const filiacao_pai = document.getElementById('colaborador-filiacao-pai').value;
        const admissao = document.getElementById('colaborador-admissao').value;
        const cargo = document.getElementById('colaborador-cargo').value;
        const salario = parseFloat(document.getElementById('colaborador-salario').value);
        const jornada = parseInt(document.getElementById('colaborador-jornada').value);
        const valor_hora = salario / jornada;

        if (!nome.trim() || !cpf.trim() || !admissao || !cargo.trim() || isNaN(salario) || isNaN(jornada)) {
            showToast('Por favor, preencha todos os campos de contrato e pessoais.', false);
            return;
        }

        const data = { nome: nome.trim(), cpf: cpf.trim(), filiacao_mae, filiacao_pai, admissao, cargo: cargo.trim(), salario, jornada, valor_hora };
        if (id) {
            data.id = parseInt(id);
            await updateData('colaboradores', data);
            showToast('Colaborador atualizado com sucesso.');
        } else {
            await addData('colaboradores', data);
            showToast('Colaborador adicionado com sucesso.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalColaborador'));
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('form-colaborador').reset();
        if (modal) modal.hide();
        renderColaboradores(); // Re-renderiza a lista
        popularSelects();
    }

    // Maquinário
    async function renderMaquinario() {
        showSpinner('lista-maquinario');
        const maquinario = await getData('maquinario');
        const listaMaquinario = document.getElementById('lista-maquinario');
        listaMaquinario.innerHTML = '';
        if (maquinario.length === 0) {
            listaMaquinario.innerHTML = '<div class="alert alert-info">Nenhum maquinário cadastrado.</div>';
            return;
        }
        maquinario.forEach(maquina => {
            const horasUso = maquina.horas_uso || 0;
            const vidaUtil = maquina.vida_util || 1; // Evita divisão por zero
            const percentualUso = (horasUso / vidaUtil) * 100;
           
            const depreciacaoPorHora = maquina.valor_compra / vidaUtil;
            const depreciacaoAcumulada = depreciacaoPorHora * horasUso;
            const valorAtual = maquina.valor_compra - depreciacaoAcumulada;

            const horasParaManutencao = (maquina.proxima_manutencao_horas || 0) - horasUso;
            const manutencaoProxima = horasParaManutencao <= 50;

            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title">${maquina.nome} ${manutencaoProxima ? '<i class="bi bi-tools text-danger" title="Manutenção Próxima!"></i>' : ''}</h5>
                        <div class="card-details text-muted mb-2">
                            <span><i class="bi bi-cash-coin me-1"></i> Valor Atual: <strong>${formatCurrency(valorAtual)}</strong></span>
                            <span><i class="bi bi-clock-history me-1"></i> Horas de Uso: ${horasUso.toFixed(1)}h</span>
                            <span><i class="bi bi-wrench-adjustable-circle me-1"></i> Próx. Manutenção: ${maquina.proxima_manutencao_horas}h</span>
                        </div>
                        <div class="progress" style="height: 10px;" title="Vida útil consumida: ${percentualUso.toFixed(1)}%">
                            <div class="progress-bar" role="progressbar" style="width: ${percentualUso}%;" aria-valuenow="${percentualUso}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    <div class="ms-3">
                        <button class="btn btn-warning btn-sm btn-editar-maquina me-2" data-id="${maquina.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-maquina" data-id="${maquina.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaMaquinario.appendChild(card);
        });
        document.querySelectorAll('.btn-gerar-pdf-maquina').forEach(btn => {
            btn.addEventListener('click', (e) => gerarPDFMaquina(e.currentTarget.dataset.id));
        });
    }
    async function handleFormMaquinario(event) {
        event.preventDefault();
        const id = document.getElementById('maquina-id').value;
        const nome = document.getElementById('maquina-nome').value;
        const marca = document.getElementById('maquina-marca').value.trim();
        const modelo = document.getElementById('maquina-modelo').value.trim();
        const ano = parseInt(document.getElementById('maquina-ano').value);
        const valor_compra = parseFloat(document.getElementById('maquina-valor-compra').value);
        const vida_util = parseInt(document.getElementById('maquina-vida-util').value);
        const tipo_combustivel = document.getElementById('maquina-tipo-combustivel').value.trim();
        const consumo_combustivel = parseFloat(document.getElementById('maquina-consumo-combustivel').value) || 0;
        const preco_combustivel = parseFloat(document.getElementById('maquina-preco-combustivel').value) || 0;
        const proxima_manutencao_horas = parseInt(document.getElementById('maquina-proxima-manutencao').value);

        if (!nome.trim() || !marca || !modelo || isNaN(ano) || isNaN(valor_compra) || isNaN(vida_util) || !tipo_combustivel || isNaN(proxima_manutencao_horas)) {
            showToast('Por favor, preencha todos os campos do maquinário.', false);
            return;
        }

        const data = { nome: nome.trim(), marca, modelo, ano, valor_compra, vida_util, tipo_combustivel, consumo_combustivel, preco_combustivel, proxima_manutencao_horas, horas_uso: 0 };
        if (id) {
            data.id = parseInt(id);
            await updateData('maquinario', data);
            showToast('Maquinário atualizado com sucesso.');
        } else {
            await addData('maquinario', data);
            showToast('Maquinário adicionado com sucesso.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalMaquinario'));
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('form-maquinario').reset();
        if (modal) modal.hide();
        renderMaquinario(); // Re-renderiza a lista
        popularSelects();
    }

    // Finanças
    let composicaoDespesasChart, lucroTalhaoChart;

    async function renderFinancas() {
        const colaboradores = await getData('colaboradores');
        const maquinario = await getData('maquinario');
        const financas = await getData('financas');
        const atividades = await getData('atividades');
        const talhoes = await getData('talhoes');

        let receitaTotal = 0;
        const custoSalarios = colaboradores.reduce((sum, c) => sum + (c.salario || 0), 0);
        const depreciacaoMaquinario = maquinario.reduce((sum, m) => {
            const depreciacaoMensal = m.vida_util > 0 ? (m.valor_compra / m.vida_util) * (m.horas_uso / 12) : 0; // Exemplo simplificado
            return sum + depreciacaoMensal;
        }, 0);
        const custosFixos = custoSalarios + depreciacaoMaquinario;

        const lucroPorTalhao = {};
        const talhaoMap = new Map(talhoes.map(t => [t.id, t.nome]));

        talhoes.forEach(t => lucroPorTalhao[t.nome] = 0);

        financas.forEach(f => {
            if (f.tipo === 'receita') {
                receitaTotal += f.valor;
                if (f.talhaoId) {
                    const nomeTalhao = talhaoMap.get(f.talhaoId);
                    if (nomeTalhao) lucroPorTalhao[nomeTalhao] += f.valor;
                }
            } else {
                if (f.talhaoId) {
                    const nomeTalhao = talhaoMap.get(f.talhaoId);
                    if (nomeTalhao) lucroPorTalhao[nomeTalhao] -= f.valor;
                }
            }
        });

        // 2. Despesas Variáveis (detalhadas para o painel de Finanças)
        const custoAplicacoesFin = financas
            .filter(f => f.tipo === 'despesa' && f.descricao.includes('Custo de aplicação'))
            .reduce((sum, f) => sum + (f.valor || 0), 0);

        const custoAtividadesFin = atividades.reduce((sum, a) => sum + (a.custo || 0), 0); // Atividades são consideradas variáveis

        const custoEstoqueFin = financas
            .filter(f => f.tipo === 'despesa' && f.descricao.toLowerCase().includes('compra de estoque'))
            .reduce((sum, f) => sum + (f.valor || 0), 0);

        const custoSegurosFin = financas
            .filter(f => f.tipo === 'despesa' && f.descricao.includes('Prêmio de seguro'))
            .reduce((sum, f) => sum + (f.valor || 0), 0);

        const custoManutencaoFin = financas
            .filter(f => f.tipo === 'despesa' && f.descricao.includes('Manutenção:'))
            .reduce((sum, f) => sum + (f.valor || 0), 0);

        const outrasDespesasFin = financas
            .filter(f =>
                f.tipo === 'despesa' &&
                !f.descricao.includes('Custo de aplicação') &&
                !f.descricao.includes('Prêmio de seguro') &&
                !f.descricao.includes('Compra de estoque') &&
                !f.descricao.includes('Manutenção:') &&
                !f.descricao.includes('Custo de atividade:') // Evita dupla contagem se atividades também geram entradas financeiras separadas
            )
            .reduce((sum, f) => sum + (f.valor || 0), 0);

        const despesaVariavelTotal = custoAplicacoesFin + custoAtividadesFin + custoEstoqueFin + custoSegurosFin + custoManutencaoFin + outrasDespesasFin;
   
   
        const lucroLiquido = receitaTotal - despesaVariavelTotal - custosFixos;
       
        // Melhoria de Interface: Atualiza os cards de resumo
        document.getElementById('financas-resumo-receita').textContent = formatCurrency(receitaTotal);
        document.getElementById('financas-resumo-despesa').textContent = formatCurrency(despesaVariavelTotal);
        document.getElementById('financas-resumo-custos-fixos').textContent = formatCurrency(custosFixos);

        const lucroEl = document.getElementById('financas-resumo-lucro');
        lucroEl.textContent = formatCurrency(lucroLiquido);
        lucroEl.className = `card-text fs-4 fw-bold ${lucroLiquido >= 0 ? 'text-success-emphasis' : 'text-danger-emphasis'}`;

        const detalhesDiv = document.getElementById('financas-detalhes');
        detalhesDiv.innerHTML = '';
        if (financas.length === 0) {
            detalhesDiv.innerHTML = '<div class="list-group-item">Nenhuma transação financeira registrada.</div>';
        } else {
            // Melhoria de Interface: Ícone para origem da transação
            const getIconForDescription = (desc) => {
                if (desc.toLowerCase().includes('venda')) return '<i class="bi bi-cash-coin text-success me-2" title="Venda"></i>';
                if (desc.toLowerCase().includes('aplicação')) return '<i class="bi bi-droplet-fill text-info me-2" title="Aplicação"></i>';
                if (desc.toLowerCase().includes('seguro')) return '<i class="bi bi-shield-fill-check text-secondary me-2" title="Seguro"></i>';
                return '<i class="bi bi-receipt text-muted me-2" title="Outra Despesa"></i>';
            };

            financas.sort((a, b) => new Date(b.data) - new Date(a.data));
            financas.forEach(f => {
                const card = document.createElement('div');
                card.className = `list-group-item list-group-item-action flex-column align-items-start`;
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1 me-3">
                            <h6 class="mb-0">${getIconForDescription(f.descricao)} ${f.descricao}</h6>
                            <small class="text-muted">Data: ${new Date(f.data).toLocaleDateString()} | Talhão: ${f.talhaoId ? talhaoMap.get(f.talhaoId) : 'Geral'}</small>
                        </div>
                        <strong class="fs-5 ${f.tipo === 'receita' ? 'text-success' : 'text-danger'}">${f.tipo === 'receita' ? '+' : '-'} ${formatCurrency(f.valor)}</strong>
                    </div>
                `;
                detalhesDiv.appendChild(card);
            });
        }

        // Melhoria de Funcionalidade: Gráfico de Composição das Despesas
        const ctxComposicaoDespesas = document.getElementById('grafico-composicao-despesas').getContext('2d');
        if (composicaoDespesasChart) composicaoDespesasChart.destroy();
        composicaoDespesasChart = new Chart(ctxComposicaoDespesas, {
            type: 'doughnut',
            data: {
                labels: ['Insumos', 'Atividades', 'Compras', 'Seguros', 'Manutenção', 'Salários', 'Outras'],
                datasets: [{
                    label: 'Composição das Despesas',
                    data: [custoAplicacoesFin, custoAtividadesFin, custoEstoqueFin, custoSegurosFin, custoManutencaoFin, custoSalarios, outrasDespesasFin],
                    // Melhoria de UX: Adiciona um valor mínimo para evitar gráfico em branco
                    data: [
                        custoAplicacoesFin || 0.01, 
                        custoAtividadesFin || 0.01, 
                        custoEstoqueFin || 0.01, 
                        custoSegurosFin || 0.01, 
                        custoManutencaoFin || 0.01, 
                        custoSalarios || 0.01, 
                        outrasDespesasFin || 0.01
                    ],
                    backgroundColor: [ // Paleta de cores mais vibrante
                        '#FF9F40', // Laranja para Insumos
                        '#36A2EB', // Azul para Atividades
                        '#4BC0C0', // Verde-água para Compras
                        '#9966FF', // Roxo para Seguros
                        '#FF6384', // Rosa para Manutenção
                        '#FFCE56', // Amarelo para Salários
                        '#C9CBCF'  // Cinza para Outras
                    ], 
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { 
                    legend: { 
                        position: 'top',
                        labels: { font: { size: 14 } } // Aumenta a fonte da legenda
                    },
                    tooltip: { bodyFont: { size: 14 } } // Aumenta a fonte do tooltip
                }
            }
        });

        const ctxLucroTalhao = document.getElementById('grafico-lucro-talhao').getContext('2d');
        if (lucroTalhaoChart) lucroTalhaoChart.destroy();
        lucroTalhaoChart = new Chart(ctxLucroTalhao, {
            type: 'bar',
            data: {
                labels: Object.keys(lucroPorTalhao),
                datasets: [{
                    label: 'Lucro por Talhão',
                    data: Object.values(lucroPorTalhao),
                    backgroundColor: Object.values(lucroPorTalhao).map(lucro => lucro >= 0 ? 'rgba(74, 119, 41, 0.7)' : 'rgba(217, 83, 79, 0.7)'),
                    borderColor: Object.values(lucroPorTalhao).map(lucro => lucro >= 0 ? '#4A7729' : '#D9534F'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: { font: { size: 14 } } // Aumenta a fonte do eixo Y
                    },
                    x: {
                        ticks: { font: { size: 14 } } // Aumenta a fonte do eixo X
                    }
                }
            }
        });
    }

    // DRE Charts
    let dreResumoChart, dreDespesasChart;

    // DRE
    async function popularSelectDRE() {
        const fazendas = await getData('fazendas');
        const selectFazenda = document.getElementById('dre-fazenda-select');
        selectFazenda.innerHTML = '<option value="">Selecione uma fazenda...</option>';
        fazendas.forEach(fazenda => {
            selectFazenda.innerHTML += `<option value="${fazenda.id}">${fazenda.nome}</option>`;
        });
       
        document.getElementById('dre-resultado').innerHTML = '<div class="alert alert-info">Selecione uma fazenda para visualizar o Demonstrativo de Resultado.</div>';
        // Limpa os gráficos ao trocar de painel
        const resumoCanvas = document.getElementById('dre-grafico-resumo');
        const despesasCanvas = document.getElementById('dre-grafico-despesas');
        if(resumoCanvas) resumoCanvas.getContext('2d').clearRect(0, 0, resumoCanvas.width, resumoCanvas.height);
        despesasCanvas.getContext('2d').clearRect(0, 0, despesasCanvas.width, despesasCanvas.height);
        if (dreResumoChart) dreResumoChart.destroy();
        if (dreDespesasChart) dreDespesasChart.destroy();
    }

    document.getElementById('dre-fazenda-select').addEventListener('change', async (event) => {
        const fazendaId = event.target.value;
        const selectTalhao = document.getElementById('dre-talhao-select');
       
        selectTalhao.innerHTML = '<option value="">Todos os Talhões</option>';
        selectTalhao.disabled = !fazendaId;
       
        if (fazendaId) {
            const talhoes = await getData('talhoes');
            const talhoesDaFazenda = talhoes.filter(t => t.fazendaId === parseInt(fazendaId));
            talhoesDaFazenda.forEach(talhao => {
                selectTalhao.innerHTML += `<option value="${talhao.id}">${talhao.nome}</option>`;
            });
            await calcularDRE(parseInt(fazendaId));
        } else {
            popularSelectDRE(); // Limpa a tela se "Selecione" for escolhido
        }
    });

    document.getElementById('dre-talhao-select').addEventListener('change', async (event) => {
        const fazendaId = parseInt(document.getElementById('dre-fazenda-select').value);
        const talhaoId = parseInt(event.target.value);
        await calcularDRE(fazendaId, talhaoId);
    });

   async function calcularDRE(fazendaId = null, talhaoId = null) {
const financas = await getData('financas');
const atividades = await getData('atividades');
const talhoes = await getData('talhoes');
const seguros = await getData('seguros');

let financasFiltradas = financas;
let atividadesFiltradas = atividades;

if (fazendaId) {
    const talhoesDaFazenda = talhoes.filter(t => t.fazendaId === fazendaId).map(t => t.id);
    // Filtra finanças ligadas aos talhões da fazenda OU finanças gerais (sem talhão)
    financasFiltradas = financas.filter(f => talhoesDaFazenda.includes(f.talhaoId) || f.talhaoId === null);
    atividadesFiltradas = atividades.filter(a => a.talhaoId && talhoesDaFazenda.includes(a.talhaoId));
}

if (talhaoId) {
    financasFiltradas = financas.filter(f => f.talhaoId === talhaoId);
    atividadesFiltradas = atividades.filter(a => a.talhaoId === talhaoId);
    // Para talhão, seguros da fazenda-mãe são considerados
    const talhao = talhoes.find(t => t.id === talhaoId);
    if (talhao) {
        segurosFiltrados = seguros.filter(s => s.referenciaTipo === 'fazenda' && s.referenciaId === talhao.fazendaId);
    } else {
        segurosFiltrados = [];
    }
}

// 1. Receita
const receitaTotal = financasFiltradas.filter(f => f.tipo === 'receita').reduce((sum, f) => sum + (f.valor || 0), 0);

// 2. Despesas (detalhadas) - Remodelagem do DRE
const custoAplicacoes = financasFiltradas
    .filter(f => f.tipo === 'despesa' && f.descricao.includes('Custo de aplicação'))
    .reduce((sum, f) => sum + (f.valor || 0), 0);

const custoAtividades = atividadesFiltradas.reduce((sum, a) => sum + (a.custo || 0), 0);

const custoSeguros = financasFiltradas
    .filter(f => f.tipo === 'despesa' && f.descricao.includes('Prêmio de seguro'))
    .reduce((sum, f) => sum + (f.valor || 0), 0);

const custoManutencao = financasFiltradas
    .filter(f => f.tipo === 'despesa' && f.descricao.includes('Manutenção:'))
    .reduce((sum, f) => sum + (f.valor || 0), 0);

const outrasDespesas = financasFiltradas
    .filter(f => 
        f.tipo === 'despesa' && 
        !f.descricao.includes('Custo de aplicação') && 
        !f.descricao.includes('Prêmio de seguro') &&
        !f.descricao.includes('Compra de estoque') &&
        !f.descricao.includes('Manutenção:')
    )
    .reduce((sum, f) => sum + (f.valor || 0), 0);
 
const despesaVariavelTotal = custoAplicacoes + custoAtividades + custoSeguros + custoManutencao + outrasDespesas;
 
// 3. Lucro
const lucroLiquido = receitaTotal - despesaVariavelTotal;

// 4. Renderização do DRE
const resultadoDiv = document.getElementById('dre-resultado');
resultadoDiv.innerHTML = `
    <div class="card">
        <div class="card-header">
            Demonstrativo de Resultado
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>RECEITA BRUTA DE VENDAS</strong>
                <span class="fs-5 text-success">${formatCurrency(receitaTotal)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center text-danger">
                <strong>(-) CUSTOS TOTAIS</strong>
                <span class="fs-5">${formatCurrency(despesaVariavelTotal)}</span>
            </li>
            <ul class="list-group list-group-flush ms-4">
                <li class="list-group-item d-flex justify-content-between align-items-center text-muted small"><span>- Custo com Insumos (Utilizado)</span> <span>${formatCurrency(custoAplicacoes)}</span></li>
                <li class="list-group-item d-flex justify-content-between align-items-center text-muted small"><span>- Custo com Atividades (M.O/Maquinário)</span> <span>${formatCurrency(custoAtividades)}</span></li>
                <li class="list-group-item d-flex justify-content-between align-items-center text-muted small"><span>- Custo com Seguros</span> <span>${formatCurrency(custoSeguros)}</span></li>
                <li class="list-group-item d-flex justify-content-between align-items-center text-muted small"><span>- Manutenção de Maquinário</span> <span>${formatCurrency(custoManutencao)}</span></li>
                <li class="list-group-item d-flex justify-content-between align-items-center text-muted small"><span>- Outras Despesas</span> <span>${formatCurrency(outrasDespesas)}</span></li>
            </ul>
            <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
                <strong>= LUCRO LÍQUIDO</strong>
                <span class="fs-4 ${lucroLiquido >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(lucroLiquido)}</span>
            </li>
        </ul>
    </div>
`;

const ctxDespesas = document.getElementById('dre-grafico-despesas').getContext('2d');
if (dreDespesasChart) dreDespesasChart.destroy();
dreDespesasChart = new Chart(ctxDespesas, {
    type: 'bar', // Alterado para gráfico de barras
    data: {
        labels: ['Receita', 'Insumos', 'Atividades', 'Seguros', 'Manutenção', 'Outras'],
        datasets: [{
            label: 'Valores (R$)',
            data: [receitaTotal, custoAplicacoes, custoAtividades, custoSeguros, custoManutencao, outrasDespesas],
            // Melhoria de UX: Adiciona um valor mínimo para evitar gráfico em branco
            data: [
                receitaTotal || 0.01, 
                custoAplicacoes || 0.01, 
                custoAtividades || 0.01, 
                custoSeguros || 0.01, 
                custoManutencao || 0.01, 
                outrasDespesas || 0.01
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)', // Receita (Verde)
                'rgba(255, 99, 132, 0.6)',  // Insumos (Vermelho)
                'rgba(255, 159, 64, 0.6)', // Atividades (Laranja)
                'rgba(255, 205, 86, 0.6)',  // Estoque (Amarelo)
                'rgba(54, 162, 235, 0.6)', // Seguros (Azul)
                'rgba(153, 102, 255, 0.6)',// Manutenção (Roxo)
                'rgba(201, 203, 207, 0.6)' // Outras (Cinza)
            ],
            borderColor: [
                'rgb(75, 192, 192)',
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)'
            ],
            borderWidth: 1
        }],
    },
    options: {
        indexAxis: 'y', // Transforma em barras horizontais
        responsive: true,
        plugins: {
            legend: { display: false } // Oculta a legenda, pois os rótulos já são claros
        }
    }
});
}


    // Seguros
    async function renderSeguros() {
        showSpinner('lista-seguros');
        const seguros = await getData('seguros');
        const lista = document.getElementById('lista-seguros');
        lista.innerHTML = '';
        if (seguros.length === 0) {
            lista.innerHTML = '<div class="alert alert-info">Nenhum seguro registrado.</div>';
            return;
        }
        seguros.forEach(s => {
            const hoje = new Date().setHours(0, 0, 0, 0);
            const vencimento = new Date(s.vencimento).setHours(0, 0, 0, 0);
            const isVencido = vencimento < hoje;

            const card = document.createElement('div');
            card.className = `card p-3 mb-3 ${isVencido ? 'border-danger' : 'border-success'}`;
            const refLabel = s.referenciaTipo === 'maquina' ? `Máquina: ${s.referenciaNome}` : `Fazenda: ${s.referenciaNome}`;
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title mb-1">${refLabel} <span class="badge ${isVencido ? 'bg-danger' : 'bg-success'}">${isVencido ? 'Vencido' : 'Vigente'}</span></h5>
                        <p class="card-text text-muted small mb-2">Apólice: ${s.apolice} | Vencimento: ${new Date(s.vencimento).toLocaleDateString()}</p>
                        <p class="card-text mb-1"><strong>Cobertura:</strong> ${s.cobertura}</p>
                        <p class="card-text small text-muted"><strong>Contato:</strong> ${s.contato}</p>
                    </div>
                    <div class="ms-3">
                        <button class="btn btn-warning btn-sm btn-editar-seguro me-2" data-id="${s.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-excluir-seguro" data-id="${s.id}">Excluir</button>
                    </div>
                </div>
            `;
            lista.appendChild(card);
        });
    }

    async function handleFormSeguro(event) {
        event.preventDefault();
        const id = document.getElementById('seguro-id').value;
        const tipo = document.getElementById('seguro-tipo').value;
        const referencia = document.getElementById('seguro-referencia').value;
        const apolice = document.getElementById('seguro-apolice').value;
        const valor = parseFloat(document.getElementById('seguro-valor').value);
        const data = document.getElementById('seguro-data').value;
        const vencimento = document.getElementById('seguro-vencimento').value.trim();
        const contato = document.getElementById('seguro-contato').value.trim();
        const cobertura = document.getElementById('seguro-cobertura').value.trim();
        const observacao = document.getElementById('seguro-observacao').value;

        if (!tipo || !referencia || !apolice.trim() || isNaN(valor) || !data || !vencimento || !contato || !cobertura) {
            showToast('Por favor, preencha todos os campos obrigatórios do seguro.', false);
            return;
        }

        const parts = referencia.split('-');
        const referenciaTipo = parts[0];
        const referenciaId = parseInt(parts[1]);

        let referenciaNome = 'Não encontrado';
        if (referenciaTipo === 'maquina') {
            const m = await getDataById('maquinario', referenciaId);
            referenciaNome = m?.nome || referenciaNome;
        } else if (referenciaTipo === 'fazenda') {
            const f = await getDataById('fazendas', referenciaId);
            referenciaNome = f?.nome || referenciaNome;
        }

        const seguroData = {
            tipo,
            referenciaTipo,
            referenciaId,
            referenciaNome,
            apolice,
            valor,
            data,
                vencimento,
                contato,
                cobertura,
                observacao,
        };

        if (id) {
            seguroData.id = parseInt(id);
            await updateData('seguros', seguroData);
            showToast('Seguro atualizado com sucesso.');
        } else {
            await addData('seguros', seguroData);
            const despesa = {
                tipo: 'despesa',
                valor,
                descricao: `Prêmio de seguro (${referenciaNome}) apólice ${apolice}`,
                data,
                talhaoId: null
            };
            await addData('financas', despesa);
            showToast('Seguro adicionado com sucesso e despesa registrada no financeiro.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalSeguro'));
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('form-seguro').reset();
        if (modal) modal.hide();
            renderSeguros(); // Re-renderiza a lista
        renderFinancas();
        popularSelects();
    }

    // Alertas
    async function renderAlertas() {
        showSpinner('lista-alertas');
        const alertas = await getData('alertas');
        const listaAlertas = document.getElementById('lista-alertas');
        listaAlertas.innerHTML = '';
        if (alertas.length === 0) {
            listaAlertas.innerHTML = '<div class="alert alert-info">Nenhum alerta registrado.</div>';
            return;
        }
        alertas.forEach(alerta => {
            const card = document.createElement('div');
            card.className = 'card p-3 mb-2';
            let alertClass;
            if (alerta.criticidade === 'alta') alertClass = 'bg-danger text-white';
            else if (alerta.criticidade === 'media') alertClass = 'bg-warning';
            else alertClass = 'bg-info';

            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h5 class="card-title">${alerta.tipo.toUpperCase()}</h5>
                        <p class="card-text text-muted">Data: ${new Date(alerta.data).toLocaleDateString()} | Criticidade: <span class="badge ${alertClass}">${alerta.criticidade.toUpperCase()}</span></p>
                        <p class="card-text">${alerta.descricao}</p>
                    </div>
                    <div>
                        <button class="btn btn-danger btn-sm btn-excluir-alerta" data-id="${alerta.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaAlertas.appendChild(card);
        });
    }
    async function handleFormAlerta(event) {
        event.preventDefault();
        const id = document.getElementById('alerta-id').value;
        const tipo = document.getElementById('alerta-tipo').value;
        const criticidade = document.getElementById('alerta-criticidade').value;
        const data = document.getElementById('alerta-data').value;
        const descricao = document.getElementById('alerta-descricao').value;

        const alertaData = { tipo, criticidade, data, descricao };
        if (id) {
            alertaData.id = parseInt(id);
            await updateData('alertas', alertaData);
            showToast('Alerta atualizado com sucesso.');
        } else {
            await addData('alertas', alertaData);
            showToast('Alerta adicionado com sucesso.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAlerta'));
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('form-alerta').reset();
        if (modal) modal.hide();
        popularDashboard();
    }

    // Perfil
    async function renderPerfil() {
        const users = await getData('usuarios');
        const currentUser = users[0];
        if (currentUser) {
            // Atualiza o display visual
            document.getElementById('perfil-display-name').textContent = currentUser.nome || currentUser.username;
            document.getElementById('perfil-display-username').textContent = `@${currentUser.username}`;

            // Preenche o formulário
            document.getElementById('perfil-nome').value = currentUser.nome || '';
            document.getElementById('perfil-email').value = currentUser.email || '';
        }
    }

    async function handleFormPerfil(event) {
        event.preventDefault();
        // Busca o usuário (assumindo o primeiro por simplicidade)
        const users = await getData('usuarios');
        const currentUser = users[0];
        if (!currentUser) return;

        // Atualiza nome e email
        currentUser.nome = document.getElementById('perfil-nome').value;
        currentUser.email = document.getElementById('perfil-email').value;

        // Lógica para alteração de senha
        const senhaAtual = document.getElementById('perfil-senha-atual').value;
        const novaSenha = document.getElementById('perfil-nova-senha').value;
        const confirmaNovaSenha = document.getElementById('perfil-confirma-nova-senha').value;

        let senhaAlterada = false;
        if (novaSenha) { // Só tenta alterar se o campo de nova senha for preenchido
            if (senhaAtual !== currentUser.password) {
                showToast('A senha atual está incorreta.', false);
                return;
            }
            if (novaSenha !== confirmaNovaSenha) {
                showToast('A nova senha e a confirmação não coincidem.', false);
                return;
            }
            currentUser.password = novaSenha;
            senhaAlterada = true;
        }

        await updateData('usuarios', currentUser);
        showToast(`Perfil atualizado com sucesso.${senhaAlterada ? ' A senha foi alterada.' : ''}`);
       
        // Limpa os campos de senha após o sucesso
        document.getElementById('perfil-senha-atual').value = '';
        document.getElementById('perfil-nova-senha').value = '';
        document.getElementById('perfil-confirma-nova-senha').value = '';
        renderPerfil(); // Re-renderiza para atualizar o display name
    }

    // ---- Event Listeners (Formulários e Navegação) ----
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);      
    document.getElementById('form-perfil').addEventListener('submit', handleFormPerfil);

    // Listeners para botões de salvar dos modais
    document.getElementById('btn-salvar-fazenda').addEventListener('click', handleFormFazenda);
    document.getElementById('btn-salvar-talhao').addEventListener('click', handleFormTalhao);
    document.getElementById('btn-salvar-planejamento').addEventListener('click', handleFormPlanejamento);
    document.getElementById('btn-salvar-estoque').addEventListener('click', (e) => handleFormEstoque(e));
    document.getElementById('btn-salvar-aplicacao').addEventListener('click', handleFormAplicacao);
    document.getElementById('btn-salvar-venda').addEventListener('click', handleFormVenda);
    document.getElementById('btn-salvar-colaborador').addEventListener('click', handleFormColaborador);
    document.getElementById('btn-salvar-maquinario').addEventListener('click', handleFormMaquinario);
    document.getElementById('btn-salvar-tarefa').addEventListener('click', handleFormTarefa);
    document.getElementById('btn-salvar-seguro').addEventListener('click', handleFormSeguro);
    document.getElementById('btn-salvar-alerta').addEventListener('click', handleFormAlerta);
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const panelId = link.getAttribute('data-panel');
            if (panelId) {
                document.querySelectorAll('.sidebar .nav-link').forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
                showPanel(panelId);
            }
        });
    });
    document.getElementById('logout-link').addEventListener('click', handleLogout);

    // Delegação de eventos para edição/exclusão genérica (inclui seguros)
    document.addEventListener('click', async (e) => {
        // Edição
        if (e.target.classList.contains('btn-editar-fazenda')) {
            const id = parseInt(e.target.dataset.id);
            const fazenda = await getDataById('fazendas', id);
            document.getElementById('fazenda-id').value = fazenda.id;
            document.getElementById('fazenda-nome').value = fazenda.nome;
            document.getElementById('fazenda-proprietario').value = fazenda.proprietario;
            document.getElementById('fazenda-area').value = fazenda.area;
            document.getElementById('fazenda-area-producao').value = fazenda.area_producao;
            document.getElementById('fazenda-area-reserva').value = fazenda.area_reserva;
            new bootstrap.Modal(document.getElementById('modalFazenda')).show();
        } else if (e.target.classList.contains('btn-editar-talhao')) {
            const id = parseInt(e.target.dataset.id);
            const talhao = await getDataById('talhoes', id);
            document.getElementById('talhao-id').value = talhao.id;
            document.getElementById('talhao-nome').value = talhao.nome;
            document.getElementById('talhao-fazenda').value = talhao.fazendaId;
            document.getElementById('talhao-cultura').value = talhao.cultura;
            document.getElementById('talhao-area').value = talhao.area;
            document.getElementById('talhao-ano-plantio').value = talhao.ano_plantio || '';
            // Campos que estavam faltando na edição
            document.getElementById('talhao-esp-linhas').value = talhao.esp_linhas || '';
            document.getElementById('talhao-esp-plantas').value = talhao.esp_plantas || '';
            // Dispara o cálculo para preencher o total de pés
            calcularTotalPes();
            new bootstrap.Modal(document.getElementById('modalTalhao')).show();
        } else if (e.target.classList.contains('btn-editar-planejamento')) {
            const id = parseInt(e.target.dataset.id);
            const p = await getDataById('safras', id); // Continua usando a store 'safras'
            document.getElementById('planejamento-id').value = p.id;
            document.getElementById('planejamento-nome').value = p.nome;
            document.getElementById('planejamento-talhao').value = p.talhaoId;
            document.getElementById('planejamento-cultura').value = p.cultura;
            document.getElementById('planejamento-area').value = p.area;
            document.getElementById('planejamento-custo-ha').value = p.custo_ha;
            document.getElementById('planejamento-produtividade').value = p.produtividade;
            document.getElementById('planejamento-preco-saca').value = p.preco_saca;
            new bootstrap.Modal(document.getElementById('modalPlanejamento')).show();
        } else if (e.target.classList.contains('btn-consolidar-safra')) {
            const id = parseInt(e.target.dataset.id);
            document.getElementById('consolidar-planejamento-id').value = id;
        } else if (e.target.classList.contains('btn-editar-colaborador')) {
            const id = parseInt(e.target.dataset.id);
            const colaborador = await getDataById('colaboradores', id);
            document.getElementById('colaborador-id').value = colaborador.id;
            document.getElementById('colaborador-nome').value = colaborador.nome;
            document.getElementById('colaborador-cpf').value = colaborador.cpf;
            document.getElementById('colaborador-filiacao-mae').value = colaborador.filiacao_mae;
            document.getElementById('colaborador-filiacao-pai').value = colaborador.filiacao_pai;
            document.getElementById('colaborador-admissao').value = colaborador.admissao;
            document.getElementById('colaborador-cargo').value = colaborador.cargo;
            document.getElementById('colaborador-salario').value = colaborador.salario;
            document.getElementById('colaborador-jornada').value = colaborador.jornada;
            // Dispara o cálculo para preencher o valor/hora
            calcularValorHora();
            new bootstrap.Modal(document.getElementById('modalColaborador')).show();
        } else if (e.target.classList.contains('btn-editar-maquina')) {
            const id = parseInt(e.target.dataset.id);
            const maquina = await getDataById('maquinario', id);
            document.getElementById('maquina-id').value = maquina.id;
            document.getElementById('maquina-nome').value = maquina.nome;
            document.getElementById('maquina-marca').value = maquina.marca || '';
            document.getElementById('maquina-modelo').value = maquina.modelo || '';
            document.getElementById('maquina-ano').value = maquina.ano || '';
            document.getElementById('maquina-valor-compra').value = maquina.valor_compra;
            document.getElementById('maquina-vida-util').value = maquina.vida_util;
            document.getElementById('maquina-tipo-combustivel').value = maquina.tipo_combustivel || 'diesel'; //
            document.getElementById('maquina-consumo-combustivel').value = maquina.consumo_combustivel || ''; //
            document.getElementById('maquina-preco-combustivel').value = maquina.preco_combustivel || ''; //
            document.getElementById('maquina-proxima-manutencao').value = maquina.proxima_manutencao_horas;
            new bootstrap.Modal(document.getElementById('modalMaquinario')).show();
        } else if (e.target.classList.contains('btn-editar-estoque')) {
            const id = parseInt(e.target.dataset.id);
            const item = await getDataById('estoque', id);
            document.getElementById('estoque-id').value = item.id;
            document.getElementById('estoque-nome').value = item.nome;
            document.getElementById('estoque-quantidade').value = item.quantidade;
            document.getElementById('estoque-unidade').value = item.unidade;
            document.getElementById('estoque-classe').value = item.classe;
            document.getElementById('estoque-grupo').value = item.grupo;
            document.getElementById('estoque-quantidade-minima').value = item.quantidade_minima;
            document.getElementById('estoque-preco-compra').value = item.preco_compra;
            new bootstrap.Modal(document.getElementById('modalEstoque')).show();
        } else if (e.target.classList.contains('btn-editar-aplicacao')) {
            const id = parseInt(e.target.dataset.id);
            const aplicacao = await getDataById('aplicacoes', id);
            document.getElementById('aplicacao-id').value = aplicacao.id;
            document.getElementById('aplicacao-talhao').value = aplicacao.talhaoId;
            document.getElementById('aplicacao-data').value = aplicacao.data;
            document.getElementById('aplicacao-produto').value = aplicacao.produtoId;
            document.getElementById('aplicacao-quantidade').value = aplicacao.quantidade;
            new bootstrap.Modal(document.getElementById('modalAplicacao')).show();
        } else if (e.target.classList.contains('btn-editar-seguro')) { // Botão de editar para seguros não existia, adicionando
            const id = parseInt(e.target.dataset.id);
            const seguro = await getDataById('seguros', id);
            if (!seguro) {
                showToast('Seguro não encontrado.', false);
                return;
            }

            // Preenche campos básicos
            document.getElementById('seguro-id').value = seguro.id;
            document.getElementById('seguro-apolice').value = seguro.apolice || '';
            document.getElementById('seguro-valor').value = seguro.valor ?? '';
            document.getElementById('seguro-data').value = seguro.data || '';
                document.getElementById('seguro-vencimento').value = seguro.vencimento || '';
                document.getElementById('seguro-contato').value = seguro.contato || '';
                document.getElementById('seguro-cobertura').value = seguro.cobertura || '';
            document.getElementById('seguro-observacao').value = seguro.observacao || '';

            // Define o tipo (máquina / fazenda) e garante que as opções de referência sejam populadas
            const tipoSel = document.getElementById('seguro-tipo');
            tipoSel.value = seguro.tipo || seguro.referenciaTipo || '';
            // Força atualização das opções de referência imediatamente
            // Usa os dados atuais do DB para popular (mesma lógica de popularSelects)
            const refSel = document.getElementById('seguro-referencia');
            refSel.innerHTML = '<option value="">Selecione...</option>';

            const fazendas = await getData('fazendas');
            const maquinario = await getData('maquinario');

if (tipoSel.value === 'maquina') {
    maquinario.forEach(item => {
        const val = `maquina-${item.id}`;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = `${item.nome} (Máquina)`;
        refSel.appendChild(opt);
    });
} else if (tipoSel.value === 'fazenda') {
    fazendas.forEach(item => {
        const val = `fazenda-${item.id}`;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = `${item.nome} (Fazenda)`;
        refSel.appendChild(opt);
    });
} else {
    // se tipo indefinido, adiciona ambas as listas para permitir edição
    maquinario.forEach(item => {
        refSel.innerHTML += `<option value="maquina-${item.id}">${item.nome} (Máquina)</option>`;
    });
    fazendas.forEach(item => {
        refSel.innerHTML += `<option value="fazenda-${item.id}">${item.nome} (Fazenda)</option>`;
    });
}

// Seleciona a opção correta (referenciaTipo-referenciaId)
const expectedVal = `${seguro.referenciaTipo}-${seguro.referenciaId}`;
// se a opção existe, seta; caso não exista, tenta buscar por nome e criar opção
if ([...refSel.options].some(o => o.value === expectedVal)) {
    refSel.value = expectedVal;
} else {
    // cria opção fallback e seleciona
    const fallback = document.createElement('option');
    fallback.value = expectedVal;
    fallback.textContent = `${seguro.referenciaNome || 'Referência não encontrada'} (Selecionado)`;
    refSel.appendChild(fallback);
    refSel.value = expectedVal;
}

new bootstrap.Modal(document.getElementById('modalSeguro')).show();

// Garante que o listener change do tipo esteja ativo (se depender de popularSelects)
// (opcional): dispara o evento change para manter comportamentos dependentes
tipoSel.dispatchEvent(new Event('change'));
} else if (e.target.classList.contains('btn-editar-atividade')) {
            const id = parseInt(e.target.dataset.id);
            const atividade = await getDataById('atividades', id);
            document.getElementById('tarefa-id').value = atividade.id;
            document.getElementById('tarefa-talhao').value = atividade.talhaoId;
            document.getElementById('tarefa-colaborador').value = atividade.colaboradorId;
            document.getElementById('tarefa-maquinario').value = atividade.maquinarioId;
            document.getElementById('tarefa-descricao').value = atividade.descricao;
            document.getElementById('tarefa-horas').value = atividade.horas;
            document.getElementById('tarefa-data').value = atividade.data;
            await calcularCustoAtividade(); // Recalcula o custo ao abrir
            new bootstrap.Modal(document.getElementById('modalAtividade')).show();
} else if (e.target.classList.contains('btn-editar-venda')) {
            const id = parseInt(e.target.dataset.id);
            const venda = await getDataById('vendas', id);
            if (!venda) return;
            document.getElementById('venda-id').value = venda.id;
            document.getElementById('venda-talhao').value = venda.talhaoId;
            document.getElementById('venda-sacas').value = venda.scs;
            document.getElementById('venda-preco-saca').value = venda.preco_saca;
            document.getElementById('venda-data').value = venda.data;
            new bootstrap.Modal(document.getElementById('modalVenda')).show();
}


        // Exclusão
        if (e.target.classList.contains('btn-excluir-fazenda')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir esta fazenda?')) return;
            await deleteData('fazendas', id);
            showToast('Fazenda excluída com sucesso.');
            renderFazendas();
        } else if (e.target.classList.contains('btn-excluir-talhao')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este talhão?')) return;
            await deleteData('talhoes', id);
            showToast('Talhão excluído com sucesso.');
            renderTalhoes();
        } else if (e.target.classList.contains('btn-excluir-planejamento')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este planejamento?')) return;
            await deleteData('safras', id); // Continua usando a store 'safras'
            showToast('Planejamento excluído com sucesso.');
            renderPlanejamentos();
        } else if (e.target.classList.contains('btn-excluir-estoque')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este item do estoque?')) return;
            await deleteData('estoque', id);
            showToast('Item do estoque excluído com sucesso.');
            renderEstoque();
        } else if (e.target.classList.contains('btn-excluir-aplicacao')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir esta aplicação?')) return;
            const aplicacao = await getDataById('aplicacoes', id);
            await deleteData('aplicacoes', id);

            // Melhoria de Lógica: Remove a transação financeira correspondente
            const financas = await getData('financas');
            const transacaoDespesa = financas.find(f =>
                f.tipo === 'despesa' &&
                f.data === aplicacao.data &&
                f.valor === aplicacao.custo
            );
            if (transacaoDespesa) await deleteData('financas', transacaoDespesa.id);
            showToast('Aplicação e despesa correspondente foram excluídas.');
            renderAplicacoes();
        } else if (e.target.classList.contains('btn-excluir-venda')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir esta venda?')) {
                return;
            }
            const venda = await getDataById('vendas', id);
            await deleteData('vendas', id);

            // Melhoria de Lógica: Remove a transação financeira correspondente
            const financas = await getData('financas');
            const transacaoReceita = financas.find(f => 
                f.tipo === 'receita' &&
                f.data === venda.data && 
                f.valor === (venda.scs * venda.preco_saca)
            );
            if (transacaoReceita) await deleteData('financas', transacaoReceita.id);
            showToast('Venda e transação financeira correspondente foram excluídas.');
            renderVendas();
        } else if (e.target.classList.contains('btn-excluir-colaborador')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
            await deleteData('colaboradores', id);
            showToast('Colaborador excluído com sucesso.');
            renderColaboradores();
        } else if (e.target.classList.contains('btn-excluir-maquina')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este maquinário?')) return;
            await deleteData('maquinario', id);
            showToast('Maquinário excluído com sucesso.');
            renderMaquinario();
        } else if (e.target.classList.contains('btn-excluir-alerta')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este alerta?')) return;
            await deleteData('alertas', id);
            showToast('Alerta excluído com sucesso.');
            renderAlertas();
        } else if (e.target.classList.contains('btn-excluir-seguro')) {
            const id = parseInt(e.target.dataset.id);
            if (!confirm('Tem certeza que deseja excluir este seguro?')) return;
            const seguro = await getDataById('seguros', id);
            await deleteData('seguros', id);

            // Melhoria de Lógica: Remove a transação financeira correspondente
            const financas = await getData('financas');
            const transacaoDespesa = financas.find(f =>
                f.tipo === 'despesa' &&
                f.data === seguro.data &&
                f.valor === seguro.valor
            );
            if (transacaoDespesa) await deleteData('financas', transacaoDespesa.id);
            showToast('Seguro e despesa correspondente foram excluídos.');
            renderSeguros();
        }

        // Listener para o checkbox de status da atividade
        if (e.target.classList.contains('tarefa-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            const isChecked = e.target.checked;
            await toggleAtividadeStatus(id, isChecked);
        }
    });

    // Listener para recuperação de senha
    document.getElementById('btn-recuperar-senha').addEventListener('click', async () => {
        const username = document.getElementById('esqueci-senha-username').value;
        if (!username) {
            showToast('Por favor, digite seu nome de usuário.', false);
            return;
        }

        const usuarios = await getData('usuarios'); // Garante que o cache está atualizado
        const user = usuarios.find(u => u.username === username);

        if (user) {
            showToast(`Sua senha é: "${user.password}"`, true);
        } else {
            showToast('Usuário não encontrado.', false);
        }

        bootstrap.Modal.getInstance(document.getElementById('modalEsqueciSenha')).hide();
        document.getElementById('form-esqueci-senha').reset();
    });

    // ---- Listeners para Backup/Restore e CSV ----

    // Busca no Estoque
    const buscaEstoqueInput = document.getElementById('busca-estoque');
    if (buscaEstoqueInput) {
        buscaEstoqueInput.addEventListener('input', (e) => renderEstoque(e.target.value));
    }

    // Backup
    document.getElementById('btn-backup').addEventListener('click', async () => {
        try {
            const allData = {};
            const stores = db.objectStoreNames;
            for (const storeName of stores) {
                allData[storeName] = await getData(storeName);
            }
            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_erp_agricola_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Backup gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar backup:', error);
            showToast('Falha ao gerar o backup.', false);
        }
    });

    // Restore
    document.getElementById('input-restore').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const transaction = db.transaction(db.objectStoreNames, 'readwrite');
                for (const storeName in data) {
                    if (db.objectStoreNames.contains(storeName)) {
                        const store = transaction.objectStore(storeName);
                        store.clear(); // Limpa a store antes de adicionar novos dados
                        for (const item of data[storeName]) {
                            store.add(item);
                        }
                    }
                }
                    await loadAllDataToCache(); // Invalida e recarrega o cache
                    showToast('Dados restaurados com sucesso!');
                    // Força a re-renderização do painel atual para refletir os novos dados
                    showPanel(currentPanel);
            } catch (error) {
                console.error('Erro ao restaurar backup:', error);
                showToast('Arquivo de backup inválido ou corrompido.', false);
            }
        };
        reader.readAsText(file);
    });

    // Exportar CSV
    const setupCSVExport = async (buttonId, storeName, fileName) => {
        document.getElementById(buttonId)?.addEventListener('click', async () => {
            const data = await getData(storeName);
            const csv = convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${fileName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    setupCSVExport('btn-export-estoque-csv', 'estoque', 'export_estoque');
    setupCSVExport('btn-export-financas-csv', 'financas', 'export_financas');

    // Listener para salvar a consolidação da safra
    document.getElementById('btn-salvar-consolidacao').addEventListener('click', async () => {
        const id = parseInt(document.getElementById('consolidar-planejamento-id').value);
        const producao_real = parseFloat(document.getElementById('consolidar-producao-real').value);
        const preco_venda_real = parseFloat(document.getElementById('consolidar-preco-venda-real').value);

        if (!id || !producao_real || !preco_venda_real) {
            showToast('Por favor, preencha todos os campos.', false);
            return;
        }

        const planejamento = await getDataById('safras', id);
        const financas = await getData('financas');
        planejamento.custo_real = financas.filter(f => f.tipo === 'despesa' && f.talhaoId === planejamento.talhaoId).reduce((sum, f) => sum + f.valor, 0);
        planejamento.producao_real = producao_real;
        planejamento.preco_venda_real = preco_venda_real;
        planejamento.consolidado = true;

        await updateData('safras', planejamento);
        showToast('Safra consolidada com sucesso!');
        if (document.activeElement) document.activeElement.blur();
        bootstrap.Modal.getInstance(document.getElementById('modalConsolidarSafra')).hide();
        renderPlanejamentos();
    });

    // ---- Listeners para Modais de Acesso Rápido ----
    document.getElementById('btn-salvar-venda-rapida').addEventListener('click', async () => {
        const talhaoId = parseInt(document.getElementById('venda-rapida-talhao').value);
        const safraId = parseInt(document.getElementById('venda-rapida-safra').value);
        const data = document.getElementById('venda-rapida-data').value;
        const scs = parseFloat(document.getElementById('venda-rapida-sacas').value);
        const preco_saca = parseFloat(document.getElementById('venda-rapida-preco-saca').value);

        if (!talhaoId || !safraId || !data || !scs || !preco_saca) {
            showToast('Por favor, preencha todos os campos da venda.', false);
            return;
        }

        const vendaData = { talhaoId, safraId, data, scs, preco_saca };
        await addData('vendas', vendaData);
       
        const receita = {
            tipo: 'receita',
            valor: scs * preco_saca,
                descricao: `Venda de ${scs} scs`,
            data,
            talhaoId
        };
        await addData('financas', receita);

        showToast('Venda rápida registrada com sucesso!');
        document.getElementById('form-venda-rapida').reset();
        if (document.activeElement) document.activeElement.blur();
        bootstrap.Modal.getInstance(document.getElementById('modalNovaVenda')).hide();
        renderVendas(); // Atualiza a lista de vendas
        renderFinancas(); // Atualiza o financeiro
    });

    // Listener para o modal de despesa rápida
    document.getElementById('btn-salvar-despesa-rapida').addEventListener('click', async () => {
        const descricao = document.getElementById('despesa-rapida-descricao').value;
        const valor = parseFloat(document.getElementById('despesa-rapida-valor').value);
        const data = document.getElementById('despesa-rapida-data').value;
        const talhaoId = document.getElementById('despesa-rapida-talhao').value ? parseInt(document.getElementById('despesa-rapida-talhao').value) : null;

        if (!descricao.trim() || isNaN(valor) || !data) {
            showToast('Por favor, preencha a descrição, valor e data da despesa.', false);
            return;
        }

        const despesaData = {
            tipo: 'despesa',
            descricao: descricao.trim(),
            valor,
            data,
            talhaoId
        };

        await addData('financas', despesaData);
        showToast('Despesa registrada com sucesso!');
        document.getElementById('form-despesa-rapida').reset();
        if (document.activeElement) document.activeElement.blur();
        bootstrap.Modal.getInstance(document.getElementById('modalNovaDespesa')).hide();
        if (currentPanel === 'financas-painel') renderFinancas();
    });

    // ---- Lógica para Relatórios ----
    async function renderRelatorios() {
        // Popula o select de talhões no painel de relatórios
        const talhoes = await getData('talhoes');
        const select = document.getElementById('relatorio-talhao-select');
        select.innerHTML = '<option value="">Selecione um talhão</option>';
        talhoes.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
        });
        // Limpa resultados anteriores
        document.getElementById('resultado-relatorio-custo').classList.add('d-none');
    }

    async function gerarRelatorioCustoProducao() {
        const talhaoId = parseInt(document.getElementById('relatorio-talhao-select').value);
        if (!talhaoId) {
            showToast('Por favor, selecione um talhão para gerar o relatório.', false);
            return;
        }

        const talhao = await getDataById('talhoes', talhaoId);
        const financas = await getData('financas');
        const atividades = await getData('atividades');
        const aplicacoes = await getData('aplicacoes');

        // Filtra dados relevantes para o talhão
        const financasTalhao = financas.filter(f => f.talhaoId === talhaoId);
        const atividadesTalhao = atividades.filter(a => a.talhaoId === talhaoId);
        const aplicacoesTalhao = aplicacoes.filter(a => a.talhaoId === talhaoId);

        // 1. Calcula Receita
        const receitaTotal = financasTalhao.filter(f => f.tipo === 'receita').reduce((sum, f) => sum + f.valor, 0);

        // 2. Calcula Custos
        const custoInsumos = aplicacoesTalhao.reduce((sum, a) => sum + (a.custo || 0), 0);
        const custoAtividades = atividadesTalhao.reduce((sum, a) => sum + (a.custo || 0), 0);
        const outrasDespesas = financasTalhao.filter(f => f.tipo === 'despesa' && !f.descricao.includes('Custo de aplicação') && !f.descricao.includes('Prêmio de seguro')).reduce((sum, f) => sum + f.valor, 0);
        const custoTotal = custoInsumos + custoAtividades + outrasDespesas;

        // 3. Calcula Resultado
        const lucroLiquido = receitaTotal - custoTotal;

        // 4. Renderiza o resultado
        const resultadoDiv = document.getElementById('resultado-relatorio-custo');
        resultadoDiv.innerHTML = `
            <h5 class="mb-3">Resultado para: <strong>${talhao.nome}</strong></h5>
            <div class="report-item">
                <span><i class="bi bi-graph-up text-success"></i> Receita Bruta Total</span>
                <strong>${formatCurrency(receitaTotal)}</strong>
            </div>
            <div class="report-item">
                <span><i class="bi bi-graph-down text-danger"></i> Custo Total de Produção</span>
                <strong>${formatCurrency(custoTotal)}</strong>
            </div>
            <ul class="list-unstyled ms-4 mt-2 small text-muted">
                <li>- Custo com Insumos: ${formatCurrency(custoInsumos)}</li>
                <li>- Custo com Atividades: ${formatCurrency(custoAtividades)}</li>
                <li>- Outras Despesas: ${formatCurrency(outrasDespesas)}</li>
            </ul>
            <div class="report-item mt-3 fs-5 fw-bold ${lucroLiquido >= 0 ? 'text-success' : 'text-danger'}">
                <span><i class="bi bi-calculator"></i> Lucro/Prejuízo Líquido</span>
                <strong>${formatCurrency(lucroLiquido)}</strong>
            </div>
        `;
        resultadoDiv.classList.remove('d-none');
    }

    document.getElementById('btn-gerar-relatorio-custo').addEventListener('click', gerarRelatorioCustoProducao);

    async function renderManutencao() {
        await renderProximasManutencoes();
        await renderHistoricoManutencao();
    }

    async function renderProximasManutencoes() {
        const maquinario = await getData('maquinario');
        const container = document.getElementById('lista-proximas-manutencoes');
        container.innerHTML = '';

        const maquinasComManutencao = maquinario
            .filter(m => m.proxima_manutencao_horas > (m.horas_uso || 0))
            .sort((a, b) => (a.proxima_manutencao_horas - (a.horas_uso || 0)) - (b.proxima_manutencao_horas - (b.horas_uso || 0)));

        if (maquinasComManutencao.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhuma manutenção futura agendada.</div>';
            return;
        }

        maquinasComManutencao.forEach(maquina => {
            const horasRestantes = maquina.proxima_manutencao_horas - (maquina.horas_uso || 0);
            const item = document.createElement('div');
            item.className = 'report-item';
            item.innerHTML = `
                <span>${maquina.nome}</span>
                <span class="badge ${horasRestantes <= 50 ? 'bg-danger' : 'bg-warning'}">Faltam ${horasRestantes.toFixed(0)}h</span>
            `;
            container.appendChild(item);
        });
    }

    async function renderHistoricoManutencao() {
        const maquinaId = document.getElementById('manutencao-historico-select').value;
        const manutencoes = await getData('manutencoes');
        const container = document.getElementById('lista-historico-manutencoes');
        container.innerHTML = '';

        const historicoFiltrado = maquinaId ? manutencoes.filter(m => m.maquinaId === parseInt(maquinaId)) : manutencoes;

        if (historicoFiltrado.length === 0) {
            container.innerHTML = '<div class="alert alert-secondary">Nenhum histórico encontrado para esta seleção.</div>';
            return;
        }

        historicoFiltrado.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(item => {
            const card = document.createElement('div');
            card.className = 'card card-body mb-2';
            card.innerHTML = `
                <p class="mb-1"><strong>Serviço:</strong> ${item.descricao}</p>
                <p class="text-muted small mb-0">Data: ${new Date(item.data).toLocaleDateString()} | Custo: ${formatCurrency(item.custo)}</p>
            `;
            container.appendChild(card);
        });
    }

    async function handleFormManutencao(event) {
        event.preventDefault();
        const maquinaId = parseInt(document.getElementById('manutencao-maquina-select').value);
        const data = document.getElementById('manutencao-data').value;
        const descricao = document.getElementById('manutencao-descricao').value;
        const custo = parseFloat(document.getElementById('manutencao-custo').value);

        if (!maquinaId || !data || !descricao.trim() || isNaN(custo)) {
            showToast('Por favor, preencha todos os campos.', false);
            return;
        }

        await addData('manutencoes', { maquinaId, data, descricao, custo });

        if (document.activeElement) document.activeElement.blur();
        // Lança a despesa no financeiro
        const despesa = {
            tipo: 'despesa',
            valor: custo,
            descricao: `Manutenção: ${descricao}`,
            data: data,
            talhaoId: null
        };
        await addData('financas', despesa);

        showToast('Manutenção registrada com sucesso!');
        document.getElementById('form-manutencao').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalManutencao')).hide();
        renderManutencao();
    }

    document.getElementById('btn-salvar-manutencao').addEventListener('click', handleFormManutencao);

    async function gerarRelatorioUsoInsumos() {
        const dataInicio = document.getElementById('relatorio-insumos-data-inicio').value;
        const dataFim = document.getElementById('relatorio-insumos-data-fim').value;

        if (!dataInicio || !dataFim) {
            showToast('Por favor, selecione o período de início e fim.', false);
            return;
        }

        const aplicacoes = await getData('aplicacoes');
        const estoque = await getData('estoque');
        const estoqueMap = new Map(estoque.map(item => [item.id, { nome: item.nome, unidade: item.unidade }]));

        const aplicacoesNoPeriodo = aplicacoes.filter(a => a.data >= dataInicio && a.data <= dataFim);

        const consumo = aplicacoesNoPeriodo.reduce((acc, a) => {
            acc[a.produtoId] = (acc[a.produtoId] || 0) + a.quantidade;
            return acc;
        }, {});

        const resultadoDiv = document.getElementById('resultado-relatorio-insumos');
        if (Object.keys(consumo).length === 0) {
            resultadoDiv.innerHTML = '<div class="p-3">Nenhum consumo de insumos registrado no período.</div>';
        } else {
            let tableHTML = '<table class="table table-striped"><thead><tr><th>Insumo</th><th>Quantidade Consumida</th></tr></thead><tbody>';
            for (const produtoId in consumo) {
                const produtoInfo = estoqueMap.get(parseInt(produtoId));
                tableHTML += `<tr><td>${produtoInfo.nome}</td><td>${consumo[produtoId].toFixed(2)} ${produtoInfo.unidade}</td></tr>`;
            }
            tableHTML += '</tbody></table>';
            resultadoDiv.innerHTML = tableHTML;
        }
        resultadoDiv.classList.remove('d-none');
    }

    document.getElementById('btn-gerar-relatorio-insumos').addEventListener('click', gerarRelatorioUsoInsumos);

    async function gerarRelatorioProdutividade() {
        const selecao = document.getElementById('relatorio-produtividade-select').value;
        if (!selecao) {
            showToast('Por favor, selecione um colaborador ou máquina.', false);
            return;
        }

        const [tipo, id] = selecao.split('-');
        const atividades = await getData('atividades');
        let atividadesFiltradas = [];
        let nomeEntidade = '';

        if (tipo === 'colaborador') {
            atividadesFiltradas = atividades.filter(a => a.colaboradorId === parseInt(id));
            const colaborador = await getDataById('colaboradores', parseInt(id));
            nomeEntidade = colaborador.nome;
        } else { // maquina
            atividadesFiltradas = atividades.filter(a => a.maquinarioId === parseInt(id));
            const maquina = await getDataById('maquinario', parseInt(id));
            nomeEntidade = maquina.nome;
        }

        const totalHoras = atividadesFiltradas.reduce((sum, a) => sum + a.horas, 0);
        const custoTotal = atividadesFiltradas.reduce((sum, a) => sum + (a.custo || 0), 0);

        const resultadoDiv = document.getElementById('resultado-relatorio-produtividade');
        if (atividadesFiltradas.length === 0) {
            resultadoDiv.innerHTML = `<div class="p-3">Nenhuma atividade encontrada para <strong>${nomeEntidade}</strong>.</div>`;
        } else {
            resultadoDiv.innerHTML = `
                <h5 class="mb-3">Resultado para: <strong>${nomeEntidade}</strong></h5>
                <div class="report-item">
                    <span>Total de Atividades</span>
                    <strong>${atividadesFiltradas.length}</strong>
                </div>
                <div class="report-item">
                    <span>Total de Horas Trabalhadas</span>
                    <strong>${totalHoras.toFixed(1)}h</strong>
                </div>
                <div class="report-item">
                    <span>Custo Total Associado</span>
                    <strong>${formatCurrency(custoTotal)}</strong>
                </div>
            `;
        }
        resultadoDiv.classList.remove('d-none');
    }

    document.getElementById('btn-gerar-relatorio-produtividade').addEventListener('click', gerarRelatorioProdutividade);

    // ---- Gerar PDF ----
    async function gerarPDFMaquina(maquinaId) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const maquina = await getDataById('maquinario', parseInt(maquinaId));
        const manutencoes = await getData('manutencoes');
        const historico = manutencoes.filter(m => m.maquinaId === maquina.id);

        // Cabeçalho
        doc.setFontSize(18);
        doc.text('Ficha Técnica de Maquinário', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(maquina.nome, 105, 30, { align: 'center' });

        let y = 50; // Posição vertical inicial

        // Dados Gerais
        doc.setFontSize(12);
        doc.text('Dados Gerais', 14, y);
        doc.line(14, y + 2, 196, y + 2); // Linha separadora
        y += 10;

        const dadosGerais = [
            ['Marca / Modelo:', `${maquina.marca} / ${maquina.modelo}`],
            ['Ano de Fabricação:', `${maquina.ano}`],
            ['Valor de Compra:', formatCurrency(maquina.valor_compra)],
            ['Vida Útil Total:', `${maquina.vida_util} horas`],
            ['Horas de Uso Atuais:', `${(maquina.horas_uso || 0).toFixed(1)} horas`],
            ['Próxima Manutenção Agendada:', `${maquina.proxima_manutencao_horas} horas`],
        ];

        doc.setFontSize(10);
        dadosGerais.forEach(dado => {
            doc.text(dado[0], 14, y);
            doc.text(dado[1], 80, y);
            y += 7;
        });

        // Histórico de Manutenção
        y += 10;
        doc.setFontSize(12);
        doc.text('Histórico de Manutenção', 14, y);
        doc.line(14, y + 2, 196, y + 2);
        y += 10;

        doc.setFontSize(10);
        historico.forEach(item => {
            doc.text(`Data: ${new Date(item.data).toLocaleDateString()} - Custo: ${formatCurrency(item.custo)}`, 14, y);
            doc.text(`Serviço: ${item.descricao}`, 14, y + 5);
            y += 12;
        });

        // Rodapé
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Relatório gerado em: ${new Date().toLocaleDateString()}`, 14, 285);
            doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        }

        // Salva o PDF
        doc.save(`ficha_maquina_${maquina.nome.replace(/\s/g, '_')}.pdf`);
    }

    // ---- Resetar Dados ----
    function resetarDados() {
        if (!confirm('ATENÇÃO! Isso apagará PERMANENTEMENTE todos os dados do sistema. Esta ação não pode ser desfeita. Deseja continuar?')) {
            return;
        }
        const req = indexedDB.deleteDatabase('erpAgrarioDB');
        req.onsuccess = function () {
            showToast('Todos os dados foram apagados com sucesso. A página será recarregada.');
            setTimeout(() => window.location.reload(), 3000);
        };
        req.onerror = function () {
            showToast('Não foi possível apagar o banco de dados.', false);
        };
        req.onblocked = function () {
            showToast('Não foi possível apagar o banco de dados pois ele está em uso. Feche outras abas e tente novamente.', false);
        };
    }
    document.getElementById('btn-resetar-dados').addEventListener('click', resetarDados);

    // Inicializa o banco de dados
    // Inicialização segura (substitua sua chamada atual)
    (async function initApp() {
        document.body.classList.add('login-active'); // Inicia com o fundo de login
        try {
            dbPromise = openDatabase();
            db = await dbPromise; // Garante que 'db' esteja definido

            // inicializações que usam o DB
            await popularSelects();
            const usuarios = await getData('usuarios');

            // Melhoria de Lógica: Persistência de Dados
            // Carrega os dados de teste apenas se o banco de dados estiver vazio.
            if (usuarios.length === 0) {
                try {
                    const response = await fetch('test-data.json');
                    const testData = await response.json();
                    const transaction = db.transaction(Object.keys(testData), 'readwrite');

                    for (const storeName in testData) {
                        if (db.objectStoreNames.contains(storeName)) {
                            const store = transaction.objectStore(storeName);
                            testData[storeName].forEach(item => store.add(item));
                        }
                    }
                    await transaction.done;
                    showToast('Banco de dados inicializado com dados de teste.');
                    await popularSelects(); // Repopula selects com os novos dados
                } catch (error) {
                    console.error('Erro ao carregar dados de teste:', error);
                    showToast('Falha ao inicializar o banco de dados.', false);
                }
            }

            // Limpa formulários dos modais ao abrir para um novo registro
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.addEventListener('show.bs.modal', (e) => {
                    // Só limpa se o modal foi aberto por um botão que NÃO seja de edição (ou tenha a classe 'editar')
                    if (e.relatedTarget && !e.relatedTarget.className.includes('editar')) {
                        const form = modal.querySelector('form');
                        if (form) form.reset();
                        const idInput = form.querySelector('input[type="hidden"]');
                        if (idInput) idInput.value = '';
                    }
                });
            });
        } catch (err) {
            console.error('Erro abrindo DB:', err);
            showToast('Erro crítico ao abrir o banco de dados. Veja o console.', false);
        }
    })();

    // Melhoria de UI: Lógica do seletor de tema
    const themeSwitcher = document.getElementById('theme-switcher');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeSwitcher.checked = true;
        }
    }

    themeSwitcher.addEventListener('change', () => {
        let theme = 'light';
        if (themeSwitcher.checked) {
            theme = 'dark';
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    // Melhoria de UI: Lógica do menu responsivo
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Expondo funções para debug e scripts de teste no console
    window.dbFuncs = { addData, getData, openDatabase };
});

document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.querySelector('#toggle-password-visibility');
    const password = document.querySelector('#login-password');
    const icon = togglePassword.querySelector('i');

    togglePassword.addEventListener('click', function () {
        // Alterna o tipo do input
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        
        // Alterna o ícone
        icon.classList.toggle('bi-eye-fill');
        icon.classList.toggle('bi-eye-slash-fill');
    });
});
