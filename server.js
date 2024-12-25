const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Статический хостинг файлов из папки public
app.use(express.static('public'));

// Папка для хранения чатов
const chatStorage = path.join(__dirname, 'chats');
if (!fs.existsSync(chatStorage)) {
    fs.mkdirSync(chatStorage);
}

// Обработчик API для получения списка каналов
app.get('/api/channels', (req, res) => {
    res.json([
        { name: 'General' },
        { name: 'GameTeam' },
        { name: 'Study' },
    ]);
});

// Обработчик API для загрузки сообщений канала
app.get('/api/messages/:channel', (req, res) => {
    const channel = req.params.channel;
    const filePath = path.join(chatStorage, `${channel}.txt`);

    if (fs.existsSync(filePath)) {
        const messages = fs.readFileSync(filePath, 'utf8').split('\n').filter(line => line).map(JSON.parse);
        res.json(messages);
    } else {
        res.json([]);
    }
});

// WebSocket-соединения
wss.on('connection', (ws) => {
    console.log('Новое соединение');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Получено сообщение:', data);

        if (data.type === 'join') {
            console.log(`${data.user} присоединился к каналу: ${data.channel}`);
            ws.send(
                JSON.stringify({
                    type: 'info',
                    message: `Вы присоединились к каналу ${data.channel} как ${data.user}`,
                })
            );
        } else if (data.type === 'message') {
            console.log(`Сообщение в канале ${data.channel} от ${data.user}: ${data.text}`);

            const messageData = {
                type: 'message',
                channel: data.channel,
                user: data.user,
                text: data.text,
            };

            // Сохраняем сообщение в файл
            const filePath = path.join(chatStorage, `${data.channel}.txt`);
            fs.appendFileSync(filePath, JSON.stringify(messageData) + '\n');

            // Рассылаем сообщение всем клиентам
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(messageData));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Соединение закрыто');
    });
});

// Запуск сервера
server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
