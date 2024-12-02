require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const router = express.Router();

// Configurar la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Ruta para servir la página de inicio de sesión
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'vista', 'login.html'));
});

// Ruta para manejar el envío del formulario de inicio de sesión
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Verificar las credenciales del usuario en la base de datos
    const query = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            res.status(500).json({ success: false, message: 'Error del servidor' });
            return;
        }

        if (results.length > 0) {
            req.session.authenticated = true;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Correo electrónico o contraseña incorrectos' });
        }
    });
});

// Middleware para verificar la autenticación
router.use((req, res, next) => {
    if (req.session.authenticated || req.path === '/login' || req.path === '/login.html') {
        next();
    } else {
        res.redirect('/login');
    }
});

module.exports = router;