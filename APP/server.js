const express = require('express');
const client = require('prom-client');
const app = express();
app.use(express.json());

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});


let users = [];


app.use((req, res, next) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


app.post('/register', (req, res) => {
    const { username, password } = req.body;
    users.push({ id: users.length + 1, username, password });
    console.log(`[SUCCESS] Novo usuario registrado: ${username}`);
    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
});

app.get('/users', (req, res) => {
    res.json(users);
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        console.log(`[AUTH] Login realizado: ${username}`);
        res.send("Bem-vindo!");
    } else {
        
        console.error(`[ERROR] Falha de login: ${username}`);
        res.status(401).send("Credenciais inválidas");
    }
});


app.get('/stress', (req, res) => {
    console.log("[INCIDENTE] Iniciando loop.");
    let a = 0;
    for (let i = 0; i < 1e7; i++) { a += Math.sqrt(i); }
    res.send("Processamento concluído");
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`[SYSTEM] Servidor rodando na porta ${PORT}`);
});
