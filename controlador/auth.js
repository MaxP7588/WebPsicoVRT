// controlador/auth.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

// Configurar body-parser
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la base de datos con retry
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 20000,
    acquireTimeout: 20000,
    // Agregar configuración para autenticación antigua
    insecureAuth: true,
    authPlugins: {
        mysql_native_password: () => () => Buffer.from([0])
    }
};

let db;

function connectWithRetry() {
    console.log('Intentando conectar a MySQL...');
    db = mysql.createConnection(dbConfig);

    db.connect(err => {
        if (err) {
            console.error('Error de conexión:', err);
            console.log('Reintentando en 5 segundos...');
            setTimeout(connectWithRetry, 5000);
            return;
        }
        console.log('Conectado a MySQL!');
    });

    db.on('error', err => {
        console.error('Error de DB:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connectWithRetry();
        }
    });
}

connectWithRetry();

// Función para encriptar la contraseña
function encryptPassword(password) {
    return crypto.createHash('sha256').update(password).digest('base64');
}

// Ruta para servir la página de inicio de sesión
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.post('/login', async (req, res) => {
    try {
        console.log('Body recibido:', req.body);
        
        if (!req.body || !req.body.email || !req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const { email, password } = req.body;
        const encryptedPassword = encryptPassword(password);

        db.query(
            'SELECT * FROM usuarios WHERE email = ? AND password = ?',
            [email, encryptedPassword],
            (err, results) => {
                if (err) {
                    console.error('Error en query:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error de servidor',
                        debug: process.env.NODE_ENV === 'development' ? err.message : null
                    });
                }

                if (results && results.length > 0) {
                    req.session.authenticated = true;
                    req.session.userId = results[0].id_usuario;
                    return res.json({ success: true });
                }

                res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
        );
    } catch (error) {
        console.error('Error en /login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para manejar el cierre de sesión
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true });
    });
});

module.exports = router;