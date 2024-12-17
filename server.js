const express = require('express');
const path = require('path');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const crypto = require('crypto')

const app = express();
const port = 3000;

// Подключение к базе данных
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'announcedb',
    password: 'your_password',
    port: 5432,
});

client.connect();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/reg', (req, res) => {
    res.sendFile(path.join(__dirname, 'reg.html'));
});

app.post('/register', async (req, res) => {
    const { name, surname, phone, mail, password } = req.body;
    const hashedPassword = hashPassword(password);

    try {
        const query = 'INSERT INTO users (name, surname, phone, mail, password) VALUES ($1, $2, $3, $4, $5)';
        await client.query(query, [name, surname, phone, mail, hashedPassword]);
        res.status(201).send('Регистрация прошла успешно!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при регистрации');
    }
});

// Обработчик для страницы index.html
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработчик для получения пользователей
app.get('/users', async (req, res) => {
    try {
        const result = await client.query('SELECT mail, password FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении данных');
    }
});

app.post('/login', async (req, res) => {
    const { mail, password } = req.body;
    const hashedPassword = hashPassword(password)

    try {
        const query = 'SELECT * FROM users WHERE mail = $1 AND password = $2';
        const result = await client.query(query, [mail, hashedPassword]);

        if (result.rows.length > 0) {
            // Успешный вход
            res.status(200).json({ message: 'Вход выполнен успешно!' });
        } else {
            // Неверные данные
            res.status(401).json({ error: 'Неверный email или пароль' });
        }
    } catch (error) {
        console.error(error);
        // Ошибка сервера
        res.status(500).json({ error: 'Ошибка при входе' });
    }
});

// Обработчик для страницы announcements.html
app.get('/announcements', (req, res) => {
    res.sendFile(path.join(__dirname, 'announcements.html'));
});

// Обработчик для получения событий
app.get('/events', async (req, res) => {
    try {
        const result = await client.query('SELECT id, title, event_date FROM events');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении данных');
    }
});

// Обработчик для добавления события
app.post('/add-event', async (req, res) => {
    const { title, event_date } = req.body;
    try {
        const query = 'INSERT INTO events (title, event_date) VALUES ($1, $2)';
        await client.query(query, [title, event_date]);
        res.status(201).send('Событие добавлено');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при добавлении события');
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
