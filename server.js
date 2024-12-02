require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRouter = require('./auth');

const app = express();
const server = app.listen(process.env.PORT, () => 
    console.log(`Server running on port ${process.env.PORT}`));

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Servir archivos estáticos
app.use(express.static('public'));

// Usar el router de autenticación
app.use(authRouter);

// Ruta para servir la página de transmisión
app.get('/transmision', (req, res) => {
    if (req.session.authenticated) {
        res.sendFile(path.join(__dirname, 'public', 'transmision.html'));
    } else {
        res.redirect('/login');
    }
});

// Configurar servidor WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    ws.on('message', (message) => {
        // Reenviar mensaje a todos los demás clientes
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
});