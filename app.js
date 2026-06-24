const express = require('express');
const client = require('prom-client');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'segredo-do-if-bank',
  resave: false,
  saveUninitialized: true
}));

// CONFIGURACAO DO PROMETHEUS
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const transacoesContador = new client.Counter({
  name: 'banco_transacoes_total',
  help: 'Total de transacoes realizadas',
  labelNames: ['tipo', 'status']
});

const volumeFinanceiroContador = new client.Counter({
  name: 'banco_volume_financeiro_reais',
  help: 'Volume total de dinheiro movimentado no banco',
  labelNames: ['tipo']
});

const DATA_FILE = path.join(__dirname, 'dados_banco.json');

function carregarDados() {
  if (!fs.existsSync(DATA_FILE)) {
    const dadosIniciais = [
      { id: 1, usuario: "douglas", senha: "123", nome: "Professor Douglas", saldo: 5000.00 },
      { id: 2, usuario: "estudante", senha: "123", nome: "Estudante IF", saldo: 1000.00 }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(dadosIniciais, null, 2));
    return dadosIniciais;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
}

app.use((req, res, next) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ROTA PARA SERVIR O LOGO DA PASTA LOCAL
app.get('/logo.png', (req, res) => {
  const logoPath = path.join(__dirname, 'logo.png');
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(404).send('Logo nao encontrado. Salve a imagem como logo.png na pasta do projeto.');
  }
});

// INTERFACE GRAFICA COM LOGO E CAMPOS MAIORES
app.get('/', (req, res) => {
  const usuarios = carregarDados();
  
  if (!req.session.usuarioId) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>IF-Bank - Login</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace, sans-serif; background: #ffffff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #000000; position: relative; }
          
          .app-logo { position: absolute; top: 20px; left: 20px; width: 120px; height: auto; }
          
          .dev-corner-panel { position: absolute; top: 20px; right: 20px; border: 1px solid #000000; padding: 15px; background: #ffffff; max-width: 220px; z-index: 100; }
          .dev-corner-panel h3 { margin-top: 0; margin-bottom: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: center; }
          .dev-btn { width: 100%; background: #ffffff; color: #000000; border: 1px solid #000000; padding: 10px; font-size: 11px; text-transform: uppercase; font-weight: bold; cursor: pointer; margin-bottom: 8px; }
          .dev-btn:last-child { margin-bottom: 0; }
          .dev-btn:hover { background: #000000; color: #ffffff; }

          .login-card { background: #ffffff; padding: 50px; border: 2px solid #000000; width: 100%; max-width: 450px; box-sizing: border-box; }
          h1 { text-align: center; font-size: 32px; letter-spacing: 2px; margin-bottom: 35px; border-bottom: 2px solid #000000; padding-bottom: 10px; }
          .form-group { margin-bottom: 25px; }
          label { display: block; margin-bottom: 10px; font-weight: bold; font-size: 16px; text-transform: uppercase; }
          input { width: 100%; padding: 15px; border: 1px solid #000000; background: #ffffff; box-sizing: border-box; font-size: 18px; font-family: inherit; }
          button.main-btn { background: #000000; color: #ffffff; border: none; padding: 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 10px; }
          button.main-btn:hover { background: #333333; }
          .error { color: #ffffff; background: #000000; padding: 12px; text-align: center; margin-bottom: 15px; display: none; font-size: 14px; }
        </style>
      </head>
      <body>

        <img src="/logo.png" class="app-logo" alt="IFSULDEMINAS">

        <div class="dev-corner-panel">
          <h3>Simulador Dev</h3>
          <button class="dev-btn" onclick="gerarUsuarios()">Gerar 10 Usuarios</button>
          <button class="dev-btn" onclick="simularLogins()">Simular 10 Logins</button>
        </div>

        <div class="login-card">
          <h1>IF-BANK</h1>
          <div id="login-error" class="error"></div>
          <div class="form-group">
            <label>Usuario:</label>
            <input type="text" id="username" placeholder="Digite seu usuario">
          </div>
          <div class="form-group">
            <label>Senha:</label>
            <input type="password" id="password" placeholder="Digite sua senha">
          </div>
          <button class="main-btn" onclick="fazerLogin()">Acessar Conta</button>
        </div>

        <script>
          async function fazerLogin() {
            const usuario = document.getElementById('username').value;
            const senha = document.getElementById('password').value;
            const errDiv = document.getElementById('login-error');

            const res = await fetch('/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usuario, senha })
            });

            if (res.ok) {
              window.location.reload();
            } else {
              const data = await res.json();
              errDiv.innerText = data.error;
              errDiv.style.display = 'block';
            }
          }

          async function gerarUsuarios() {
            const response = await fetch('/dev/gerar-usuarios', { method: 'POST' });
            const result = await response.json();
            alert(result.message.toUpperCase());
          }

          async function simularLogins() {
            const response = await fetch('/dev/simular-logins', { method: 'POST' });
            const result = await response.json();
            alert(result.message.toUpperCase());
          }
        </script>
      </body>
      </html>
    `);
  }

  const usuarioLogado = usuarios.find(u => u.id === req.session.usuarioId);

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>IF-Bank - Area do Cliente</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace, sans-serif; background: #ffffff; margin: 0; padding: 20px; color: #000000; }
        .container { max-width: 850px; margin: 30px auto; position: relative; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 35px; }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .app-logo-inside { width: 100px; height: auto; }
        h1 { margin: 0; font-size: 32px; letter-spacing: 2px; }
        .btn-logout { border: 1px solid #000000; color: #000000; padding: 10px 20px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; }
        .btn-logout:hover { background: #000000; color: #ffffff; }
        
        /* Tabela estrutural maior para a conta */
        .card { border: 2px solid #000000; padding: 40px; text-align: center; margin-bottom: 35px; background: #ffffff; }
        .welcome { font-size: 18px; text-transform: uppercase; color: #555555; margin-bottom: 10px; }
        .saldo { font-size: 54px; font-weight: bold; margin: 20px 0; letter-spacing: 1px; }
        
        /* Formulario e tabelas internas aumentadas */
        .actions { border: 2px solid #000000; padding: 35px; background: #ffffff; margin-bottom: 35px; }
        .actions h2 { margin-top: 0; font-size: 22px; text-transform: uppercase; border-bottom: 2px dashed #000000; padding-bottom: 10px; margin-bottom: 25px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
        select, input { width: 100%; padding: 15px; border: 1px solid #000000; background: #ffffff; box-sizing: border-box; font-size: 18px; font-family: inherit; }
        button.action-btn { background: #000000; color: #ffffff; border: none; padding: 16px; font-size: 16px; text-transform: uppercase; cursor: pointer; width: 100%; font-weight: bold; }
        button.action-btn:hover { background: #333333; }
        
        .dev-panel { border: 2px dashed #000000; padding: 25px; background: #fafafa; }
        .dev-panel h3 { margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
        .dev-buttons { display: flex; gap: 15px; flex-wrap: wrap; }
        .dev-btn { flex: 1; min-width: 160px; background: #ffffff; color: #000000; border: 1px solid #000000; padding: 12px; font-size: 12px; text-transform: uppercase; font-weight: bold; cursor: pointer; }
        .dev-btn:hover { background: #000000; color: #ffffff; }
        
        #message { margin-top: 20px; padding: 15px; border: 1px solid #000000; display: none; text-align: center; font-weight: bold; font-size: 16px; }
        .success-msg { background: #000000; color: #ffffff; }
        .error-msg { background: #ffffff; color: #000000; border-style: double !important; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <img src="/logo.png" class="app-logo-inside" alt="IFSULDEMINAS">
            <h1>IF-BANK</h1>
          </div>
          <a href="/logout" class="btn-logout">Sair</a>
        </div>
        
        <div class="card">
          <div class="welcome">Titular: ${usuarioLogado.nome}</div>
          <div class="saldo">R$ <span id="saldo-atual">${usuarioLogado.saldo.toFixed(2)}</span></div>
          <div style="color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Saldo Disponivel</div>
        </div>

        <div class="actions">
          <h2>Movimentacao Individual</h2>
          <div class="form-group">
            <label>Operacao:</label>
            <select id="operacao">
              <option value="deposito">Deposito</option>
              <option value="saque">Saque</option>
            </select>
          </div>
          <div class="form-group">
            <label>Valor (R$):</label>
            <input type="number" id="valor" placeholder="0.00" step="0.01">
          </div>
          <button class="action-btn" onclick="executarOperacao()">Confirmar Transacao</button>
          <div id="message"></div>
        </div>

        <div class="dev-panel">
          <h3>Movimentacao em Massa (Painel Dev)</h3>
          <div class="dev-buttons">
            <button class="dev-btn" onclick="simularMassa('deposito')">Simular Depositos</button>
            <button class="dev-btn" onclick="simularMassa('saque')">Simular Saques</button>
          </div>
        </div>
      </div>

      <script>
        async function executarOperacao() {
          const operacao = document.getElementById('operacao').value;
          const valor = parseFloat(document.getElementById('valor').value);
          const msgDiv = document.getElementById('message');

          if(!valor || valor <= 0) {
            msgDiv.className = 'error-msg';
            msgDiv.innerText = 'VALOR INVALIDO!';
            msgDiv.style.display = 'block';
            return;
          }

          try {
            const response = await fetch('/' + operacao, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ valor })
            });
            const result = await response.json();
            if (response.ok) {
              msgDiv.className = 'success-msg';
              msgDiv.innerText = result.message.toUpperCase();
              document.getElementById('saldo-atual').innerText = result.novoSaldo.toFixed(2);
            } else {
              msgDiv.className = 'error-msg';
              msgDiv.innerText = result.error.toUpperCase();
            }
          } catch (err) {
            msgDiv.className = 'error-msg';
            msgDiv.innerText = 'ERRO DE CONEXAO.';
          }
          msgDiv.style.display = 'block';
          document.getElementById('valor').value = '';
        }

        async function simularMassa(tipo) {
          const response = await fetch('/dev/simular-massa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo })
          });
          const result = await response.json();
          alert(result.message.toUpperCase());
          
          const resSaldo = await fetch('/usuarios');
          const users = await resSaldo.json();
          const atual = users.find(u => u.id === ${usuarioLogado.id});
          if(atual) document.getElementById('saldo-atual').innerText = atual.saldo.toFixed(2);
        }
      </script>
    </body>
    </html>
  `);
});

// APIs REST
app.get('/usuarios', (req, res) => res.json(carregarDados()));

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  const usuarios = carregarDados();
  const user = usuarios.find(u => u.usuario === usuario.toLowerCase() && u.senha === senha);
  if (user) {
    req.session.usuarioId = user.id;
    console.log(`[SUCCESS] Login: ${user.nome}`);
    return res.json({ success: true });
  }
  console.warn(`[WARN] Tentativa de login invalida para o usuario: ${usuario}`);
  res.status(401).json({ error: "Usuario ou senha incorretos!" });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.post('/deposito', (req, res) => {
  if (!req.session.usuarioId) return res.status(401).json({ error: "Nao autorizado" });
  const { valor } = req.body;
  const usuarios = carregarDados();
  const usuario = usuarios.find(u => u.id === req.session.usuarioId);

  if (!valor || valor <= 0) {
    transacoesContador.labels('deposito', 'erro').inc();
    return res.status(400).json({ error: "Valor invalido." });
  }

  usuario.saldo += valor;
  salvarDados(usuarios);
  transacoesContador.labels('deposito', 'sucesso').inc();
  volumeFinanceiroContador.labels('deposito').inc(valor);
  res.json({ message: "Deposito efetuado com sucesso!", novoSaldo: usuario.saldo });
});

app.post('/saque', (req, res) => {
  if (!req.session.usuarioId) return res.status(401).json({ error: "Nao autorizado" });
  const { valor } = req.body;
  const usuarios = carregarDados();
  const usuario = usuarios.find(u => u.id === req.session.usuarioId);

  if (!valor || valor <= 0) {
    transacoesContador.labels('saque', 'erro').inc();
    return res.status(400).json({ error: "Valor invalido." });
  }

  if (usuario.saldo < valor) {
    transacoesContador.labels('saque', 'erro').inc();
    return res.status(400).json({ error: "Saldo insuficiente." });
  }

  usuario.saldo -= valor;
  salvarDados(usuarios);
  transacoesContador.labels('saque', 'sucesso').inc();
  volumeFinanceiroContador.labels('saque').inc(valor);
  res.json({ message: "Saque efetuado com sucesso!", novoSaldo: usuario.saldo });
});

// GENERATION DE USUARIOS (10 UNIDADES)
app.post('/dev/gerar-usuarios', (req, res) => {
  const usuarios = carregarDados();
  const nomesAleatorios = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
  
  for (let i = 0; i < 10; i++) {
    const idNovo = usuarios.length + 1;
    const sobrenome = nomesAleatorios[Math.floor(Math.random() * nomesAleatorios.length)];
    const userString = `user${idNovo}`;
    
    usuarios.push({
      id: idNovo,
      usuario: userString,
      senha: "123",
      nome: `Cliente ${sobrenome} ${idNovo}`,
      saldo: parseFloat((Math.random() * 3000 + 100).toFixed(2))
    });
  }
  
  salvarDados(usuarios);
  console.log(`[SYSTEM] 10 novos usuarios gerados no sistema.`);
  res.json({ message: "10 novos usuarios gerados com sucesso!" });
});

// SIMULACAO DE LOGINS (10 CONTAS)
app.post('/dev/simular-logins', (req, res) => {
  const usuarios = carregarDados();
  let sucessos = 0;
  let falhas = 0;

  for (let i = 0; i < 10; i++) {
    if (Math.random() > 0.5 && usuarios.length > 0) {
      const u = usuarios[Math.floor(Math.random() * usuarios.length)];
      console.log(`[SUCCESS] Login simulado: ${u.nome}`);
      sucessos++;
    } else {
      const listaInvasores = ['admin', 'root', 'user_teste', 'hacker', 'douglas_fake'];
      const userErrado = listaInvasores[Math.floor(Math.random() * listaInvasores.length)];
      console.warn(`[WARN] Tentativa de login invalida para o usuario: ${userErrado}`);
      falhas++;
    }
  }

  res.json({ message: `Simulacao concluida: ${sucessos} acessos e ${falhas} falhas de seguranca geradas nos logs.` });
});

// MOVIMENTACAO EM MASSA
app.post('/dev/simular-massa', (req, res) => {
  const { tipo } = req.body;
  const usuarios = carregarDados();
  
  if (usuarios.length === 0) return res.status(400).json({ error: "Nenhum usuario no sistema." });

  let operacoesSucesso = 0;
  let operacoesErro = 0;

  for (let i = 0; i < 20; i++) {
    const usuarioAleatorio = usuarios[Math.floor(Math.random() * usuarios.length)];
    const valorAleatorio = parseFloat((Math.random() * 500 + 10).toFixed(2));

    if (tipo === 'deposito') {
      usuarioAleatorio.saldo += valorAleatorio;
      transacoesContador.labels('deposito', 'sucesso').inc();
      volumeFinanceiroContador.labels('deposito').inc(valorAleatorio);
      operacoesSucesso++;
    } else if (tipo === 'saque') {
      if (usuarioAleatorio.saldo >= valorAleatorio) {
        usuarioAleatorio.saldo -= valorAleatorio;
        transacoesContador.labels('saque', 'sucesso').inc();
        volumeFinanceiroContador.labels('saque').inc(valorAleatorio);
        operacoesSucesso++;
      } else {
        transacoesContador.labels('saque', 'erro').inc();
        operacoesErro++;
      }
    }
  }

  salvarDados(usuarios);
  console.log(`[SYSTEM] Simulacao de ${tipo} em massa executada: ${operacoesSucesso} sucessos, ${operacoesErro} erros.`);
  res.json({ message: `Simulacao concluida: ${operacoesSucesso} sucessos e ${operacoesErro} erros registrados.` });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[SYSTEM] IF-Bank com Logo e tabelas expandidas rodando na porta ${PORT}`);
});
