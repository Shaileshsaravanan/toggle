document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('sendRequest').addEventListener('click', sendRequest);
    document.getElementById('addHeader').addEventListener('click', addHeaderField);
    document.getElementById('authType').addEventListener('change', toggleAuthFields);
    document.getElementById('saveRequest').addEventListener('click', saveRequest);
    document.getElementById('loadRequest').addEventListener('click', loadRequest);
    document.getElementById('deleteRequest').addEventListener('click', deleteRequest);
    loadSavedRequests();
  });
  
  function addHeaderField() {
    const headerDiv = document.createElement('div');
    headerDiv.innerHTML = `
      <input type="text" placeholder="Key" class="headerKey">
      <input type="text" placeholder="Value" class="headerValue">
      <button class="removeHeader">Remove</button>
    `;
    headerDiv.querySelector('.removeHeader').addEventListener('click', function() {
      document.getElementById('headers').removeChild(headerDiv);
    });
    document.getElementById('headers').appendChild(headerDiv);
  }
  
  function toggleAuthFields() {
    const authType = document.getElementById('authType').value;
    document.getElementById('basicAuth').classList.toggle('hidden', authType !== 'basic');
    document.getElementById('bearerToken').classList.toggle('hidden', authType !== 'bearer');
  }
  
  function getHeaders() {
    const headers = {};
    document.querySelectorAll('#headers div').forEach(div => {
      const key = div.querySelector('.headerKey').value;
      const value = div.querySelector('.headerValue').value;
      if (key && value) headers[key] = value;
    });
    return headers;
  }
  
  function getAuthorization() {
    const authType = document.getElementById('authType').value;
    if (authType === 'basic') {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      return 'Basic ' + btoa(username + ':' + password);
    } else if (authType === 'bearer') {
      return 'Bearer ' + document.getElementById('token').value;
    }
    return null;
  }
  
  function sendRequest() {
    const url = document.getElementById('url').value;
    const method = document.getElementById('method').value;
    const contentType = document.getElementById('contentType').value;
    const requestBody = document.getElementById('requestBody').value;
  
    let headers = getHeaders();
    const authHeader = getAuthorization();
    if (authHeader) headers['Authorization'] = authHeader;
  
    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }
  
    let body;
    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType === 'application/json') {
        body = requestBody;
      } else if (contentType === 'application/x-www-form-urlencoded') {
        body = new URLSearchParams(requestBody);
      } else if (contentType === 'multipart/form-data') {
        body = new FormData();
        requestBody.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          body.append(key, value);
        });
      } else {
        body = requestBody;
      }
    }
  
    const startTime = Date.now();
  
    fetch(url, {
      method: method,
      headers: headers,
      body: body
    })
    .then(response => {
      const endTime = Date.now();
      document.getElementById('status').textContent = response.status + ' ' + response.statusText;
      document.getElementById('time').textContent = endTime - startTime;
      displayResponseHeaders(response.headers);
      return response.text();
    })
    .then(data => {
      try {
        const jsonData = JSON.parse(data);
        document.getElementById('response').textContent = JSON.stringify(jsonData, null, 2);
      } catch {
        document.getElementById('response').textContent = data;
      }
    })
    .catch(error => {
      document.getElementById('response').textContent = 'Error: ' + error;
    });
  }
  
  function displayResponseHeaders(headers) {
    let headerText = '';
    for (let [key, value] of headers) {
      headerText += `${key}: ${value}\n`;
    }
    document.getElementById('responseHeaders').textContent = headerText;
  }
  
  function saveRequest() {
    const request = {
      url: document.getElementById('url').value,
      method: document.getElementById('method').value,
      headers: getHeaders(),
      authType: document.getElementById('authType').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      token: document.getElementById('token').value,
      contentType: document.getElementById('contentType').value,
      requestBody: document.getElementById('requestBody').value
    };
  
    chrome.storage.local.get({requests: {}}, function(data) {
      const requests = data.requests;
      const key = `${request.method} ${request.url}`;
      requests[key] = request;
      chrome.storage.local.set({requests: requests}, function() {
        loadSavedRequests();
      });
    });
  }
  
  function loadSavedRequests() {
    const select = document.getElementById('savedRequests');
    select.innerHTML = '<option value="">Select a saved request</option>';
  
    chrome.storage.local.get({requests: {}}, function(data) {
      Object.keys(data.requests).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        select.appendChild(option);
      });
    });
  }
  
  function loadRequest() {
    const key = document.getElementById('savedRequests').value;
    if (!key) return;
  
    chrome.storage.local.get({requests: {}}, function(data) {
      const request = data.requests[key];
      document.getElementById('url').value = request.url;
      document.getElementById('method').value = request.method;
      document.getElementById('headers').innerHTML = '';
      Object.entries(request.headers).forEach(([key, value]) => {
        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = `
          <input type="text" placeholder="Key" class="headerKey" value="${key}">
          <input type="text" placeholder="Value" class="headerValue" value="${value}">
          <button class="removeHeader">Remove</button>
        `;
        headerDiv.querySelector('.removeHeader').addEventListener('click', function() {
          document.getElementById('headers').removeChild(headerDiv);
        });
        document.getElementById('headers').appendChild(headerDiv);
      });
      document.getElementById('authType').value = request.authType;
      document.getElementById('username').value = request.username;
      document.getElementById('password').value = request.password;
      document.getElementById('token').value = request.token;
      document.getElementById('contentType').value = request.contentType;
      document.getElementById('requestBody').value = request.requestBody;
      toggleAuthFields();
    });
  }
  
  function deleteRequest() {
    const key = document.getElementById('savedRequests').value;
    if (!key) return;
  
    chrome.storage.local.get({requests: {}}, function(data) {
      const requests = data.requests;
      delete requests[key];
      chrome.storage.local.set({requests: requests}, function() {
        loadSavedRequests();
      });
    });
  }