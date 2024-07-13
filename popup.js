document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('api-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const url = document.getElementById('url').value;
      const method = document.getElementById('method').value;
      const headers = JSON.parse(document.getElementById('headers').value || '{}');
      const body = document.getElementById('body').value;

      try {
          const response = await fetch(url, {
              method,
              headers,
              body: method !== 'GET' ? body : undefined
          });

          const data = await response.text();
          document.getElementById('response-body').textContent = data;
          document.getElementById('response').classList.remove('hidden');
      } catch (error) {
          document.getElementById('response-body').textContent = `Error: ${error.message}`;
      }
  });

  document.getElementById('requests_btn').addEventListener('click', () => {
      show_requests_div();
  });

  document.getElementById('websockets_btn').addEventListener('click', () => {
      show_websockets_div();
  });

  document.getElementById('websocket-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const wsUrl = document.getElementById('ws-url').value;
      connectWebSocket(wsUrl);
  });
  
});

const active_btn = 'cursor-pointer inline-block p-4 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active';
const inactive_btn = 'cursor-pointer inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300';

function show_requests_div() {
  document.getElementById('requests').style.display = 'block';
  document.getElementById('websockets').style.display = 'none';
  document.getElementById('requests_btn').classList = active_btn;
  document.getElementById('websockets_btn').classList = inactive_btn;
}

function show_websockets_div() {
  document.getElementById('requests').style.display = 'none';
  document.getElementById('websockets').style.display = 'block';
  document.getElementById('requests_btn').classList = inactive_btn;
  document.getElementById('websockets_btn').classList = active_btn;
}

show_requests_div()

let ws;

function connectWebSocket(url) {
    if (ws) {
        ws.close(); 
    }

    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
        logWsMessage('WebSocket connection opened');
    });

    ws.addEventListener('message', (event) => {
        logWsMessage(`Message received: ${event.data}`);
    });

    ws.addEventListener('close', () => {
        logWsMessage('WebSocket connection closed');
    });

    ws.addEventListener('error', (error) => {
        logWsMessage(`WebSocket error: ${error.message}`);
    });
}

function logWsMessage(message) {
    document.getElementById('ws-messages').classList.remove('hidden');
    const log = document.getElementById('ws-message-log');
    log.textContent += `${new Date().toISOString()}: ${message}\n`;
}