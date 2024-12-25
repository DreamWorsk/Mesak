let ws;
let currentChannel = null;
let currentUser = null;

// DOM Elements
const channelsDiv = document.getElementById('channels');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Запрашиваем имя пользователя
async function chooseUsername() {
    const username = prompt('Введите ваше имя пользователя:');
    currentUser = username && username.trim() ? username : 'User';
    startApp();
}

// Инициализация WebSocket и загрузка данных
function startApp() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket подключен');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'message' && data.channel === currentChannel) {
            displayMessage(data.user, data.text);
        }

        if (data.type === 'info') {
            displayMessage('System', data.message, true);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket отключен');
    };

    // Загружаем каналы
    fetchChannels();
}

// Fetch and display channels
async function fetchChannels() {
    try {
        const response = await fetch('/api/channels');
        const channels = await response.json();

        channels.forEach((channel) => {
            const div = document.createElement('div');
            div.className = 'channel';
            div.textContent = channel.name;
            div.style.backgroundColor = '#ffe6cc';
            div.style.marginBottom = '5px';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => joinChannel(channel.name));
            channelsDiv.appendChild(div);
        });
    } catch (error) {
        console.error('Ошибка при загрузке каналов:', error);
    }
}

// Join a channel and load messages
async function joinChannel(channel) {
    currentChannel = channel;
    messagesDiv.innerHTML = ''; // Clear messages

    try {
        const response = await fetch(`/api/messages/${channel}`);
        const messages = await response.json();

        // Отобразить сохраненные сообщения
        messages.forEach((message) => {
            displayMessage(message.user, message.text, message.type === 'info');
        });

        // Уведомление о присоединении
        ws.send(JSON.stringify({ type: 'join', channel, user: currentUser }));
    } catch (error) {
        console.error('Ошибка при загрузке сообщений:', error);
    }
}

// Display a message in the chat
function displayMessage(user, text, isInfo = false) {
    const div = document.createElement('div');
    div.className = 'message';
    div.style.marginBottom = '10px';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.backgroundColor = isInfo ? '#fff0e0' : '#fff4e6';
    div.style.border = '1px solid #ffcc99';
    if (isInfo) {
        div.style.color = 'gray';
    }
    div.innerHTML = isInfo ? text : `<strong style="color: #ff6600;">${user}:</strong> ${text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Автопрокрутка вниз
}

// Send a message
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentChannel) {
        ws.send(
            JSON.stringify({
                type: 'message',
                channel: currentChannel,
                user: currentUser,
                text: text,
            })
        );
        messageInput.value = ''; // Очистка поля ввода
    }
}

// Event listeners
sendButton.style.backgroundColor = '#ff9900';
sendButton.style.color = 'white';
sendButton.style.border = 'none';
sendButton.style.borderRadius = '5px';
sendButton.style.padding = '10px 20px';
sendButton.style.cursor = 'pointer';
sendButton.addEventListener('click', sendMessage);
messageInput.style.border = '2px solid #ffa64d';
messageInput.style.borderRadius = '5px';
messageInput.style.padding = '10px';
messageInput.style.marginRight = '10px';
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Вызываем выбор имени пользователя перед началом
chooseUsername();
