document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('api-form').addEventListener('submit', handleApiFormSubmit);
  document.getElementById('websocket-form').addEventListener('submit', handleWebSocketFormSubmit);
  document.getElementById('ws-send-btn').addEventListener('click', sendMessage);
  document.getElementById('ws-close-btn').addEventListener('click', closeWebSocket);
  document.getElementById('jwt-form').addEventListener('submit', handleJwtFormSubmit);

  document.getElementById('requests_btn').addEventListener('click', show_requests_div);
  document.getElementById('websockets_btn').addEventListener('click', show_websockets_div);
  document.getElementById('jwt_btn').addEventListener('click', show_jwt_div);

  show_requests_div();
});

const active_btn = 'cursor-pointer inline-block p-4 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active';
const inactive_btn = 'cursor-pointer inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300';

function handleApiFormSubmit(event) {
  event.preventDefault();
  const url = document.getElementById('url').value;
  const method = document.getElementById('method').value;
  const headers = JSON.parse(document.getElementById('headers').value || '{}');
  const body = JSON.parse(document.getElementById('api_body').value || '{}');

  fetch(url, {
    method: method,
    headers: headers,
    body: method === 'GET' ? undefined : JSON.stringify(body),
  })
  .then(response => response.text())
  .then(data => {
    document.getElementById('response').classList.remove('hidden');
    document.getElementById('response-body').textContent = data;
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('response').classList.remove('hidden');
    document.getElementById('response-body').textContent = `Error: ${error.message}`;
  });
}

let ws;

function handleWebSocketFormSubmit(event) {
  event.preventDefault();
  const wsUrl = document.getElementById('ws-url').value;
  connectWebSocket(wsUrl);
}

function connectWebSocket(url) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    logWsMessage('WebSocket connection already open');
    return;
  }

  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    logWsMessage('WebSocket connection opened');
    document.getElementById('ws-send-btn').classList.remove('hidden');
    document.getElementById('ws-close-btn').classList.remove('hidden');
  });

  ws.addEventListener('message', (event) => {
    logWsMessage(`Message received: ${event.data}`);
  });

  ws.addEventListener('close', () => {
    logWsMessage('WebSocket connection closed');
    document.getElementById('ws-send-btn').classList.add('hidden');
    document.getElementById('ws-close-btn').classList.add('hidden');
  });

  ws.addEventListener('error', (error) => {
    logWsMessage(`WebSocket error: ${error.message}`);
  });
}

function sendMessage() {
  const message = document.getElementById('ws-message').value;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    logWsMessage('WebSocket connection not open');
    return;
  }

  ws.send(message);
  logWsMessage(`Message sent: ${message}`);
}

function closeWebSocket() {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    logWsMessage('WebSocket connection already closed');
    return;
  }

  ws.close();
}

function logWsMessage(message) {
  document.getElementById('ws-messages').classList.remove('hidden');
  const log = document.getElementById('ws-message-log');
  log.textContent += `${new Date().toISOString()}: ${message}\n`;
}

function show_requests_div() {
  document.getElementById('requests').style.display = 'block';
  document.getElementById('websockets').style.display = 'none';
  document.getElementById('jwt').style.display = 'none';
  document.getElementById('requests_btn').classList = active_btn;
  document.getElementById('websockets_btn').classList = inactive_btn;
  document.getElementById('jwt_btn').classList = inactive_btn;
}

function show_websockets_div() {
  document.getElementById('requests').style.display = 'none';
  document.getElementById('websockets').style.display = 'block';
  document.getElementById('jwt').style.display = 'none';
  document.getElementById('requests_btn').classList = inactive_btn;
  document.getElementById('websockets_btn').classList = active_btn;
  document.getElementById('jwt_btn').classList = inactive_btn;
}

function show_jwt_div() {
  document.getElementById('requests').style.display = 'none';
  document.getElementById('websockets').style.display = 'none';
  document.getElementById('jwt').style.display = 'block';
  document.getElementById('requests_btn').classList = inactive_btn;
  document.getElementById('websockets_btn').classList = inactive_btn;
  document.getElementById('jwt_btn').classList = active_btn;
}

function handleJwtFormSubmit(event) {
  event.preventDefault();
  const token = document.getElementById('jwt-token').value;
  if (!token) {
    alert('Please enter a JWT token');
    return;
  }

  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

  document.getElementById('jwt-result').classList.remove('hidden');
  document.getElementById('jwt-payload').textContent = jsonPayload;
}
