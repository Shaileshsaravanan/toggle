const devices = {
  iPhone12: { width: 390, height: 844 },
  iPadAir: { width: 820, height: 1180 },
  GalaxyS21: { width: 360, height: 800 },
  Pixel5: { width: 393, height: 851 }
};

let currentOrientation = 'portrait';

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('sendRequest').addEventListener('click', sendRequest);
  document.getElementById('addHeader').addEventListener('click', addHeaderField);
  document.getElementById('authType').addEventListener('change', toggleAuthFields);
  document.getElementById('saveRequest').addEventListener('click', saveRequest);
  document.getElementById('loadRequest').addEventListener('click', loadRequest);
  document.getElementById('deleteRequest').addEventListener('click', deleteRequest);
  document.getElementById('deviceSelect').addEventListener('change', toggleCustomSize);
  document.getElementById('applySize').addEventListener('click', applySize);
  document.getElementById('toggleOrientation').addEventListener('click', toggleOrientation);
  document.getElementById('validateHTML').addEventListener('click', () => validateCode('html'));
  document.getElementById('validateCSS').addEventListener('click', () => validateCode('css'));
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

document.getElementById('startAnalysis').addEventListener('click', startPerformanceAnalysis);

function startPerformanceAnalysis() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "analyzePerformance"}, function(response) {
      displayPerformanceResults(response);
    });
  });
}

function displayPerformanceResults(results) {
  const metricsElement = document.getElementById('performanceMetrics');
  const resourcesElement = document.getElementById('slowResources');
  
  metricsElement.innerHTML = '';
  resourcesElement.innerHTML = '';

  // Display performance metrics
  for (const [key, value] of Object.entries(results.metrics)) {
    const li = document.createElement('li');
    li.textContent = `${key}: ${value.toFixed(2)} ms`;
    metricsElement.appendChild(li);
  }

  // Display slow resources
  results.slowResources.forEach(resource => {
    const li = document.createElement('li');
    li.textContent = `${resource.name}: ${resource.duration.toFixed(2)} ms`;
    resourcesElement.appendChild(li);
  });

  document.getElementById('performanceResults').classList.remove('hidden');
}
function toggleCustomSize() {
  const isCustom = document.getElementById('deviceSelect').value === 'custom';
  document.getElementById('customSize').classList.toggle('hidden', !isCustom);
}

function applySize() {
  const deviceSelect = document.getElementById('deviceSelect');
  let width, height;

  if (deviceSelect.value === 'custom') {
    width = parseInt(document.getElementById('customWidth').value);
    height = parseInt(document.getElementById('customHeight').value);
  } else {
    const device = devices[deviceSelect.value];
    width = currentOrientation === 'portrait' ? device.width : device.height;
    height = currentOrientation === 'portrait' ? device.height : device.width;
  }

  if (width && height) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "resizeViewport",
        width: width,
        height: height
      });
    });
    updateSizeDisplay(width, height);
  }
}

function toggleOrientation() {
  currentOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
  applySize();
}

function updateSizeDisplay(width, height) {
  document.getElementById('sizeDisplay').textContent = `${width}x${height}`;
}

function validateCode(type) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getCode", codeType: type}, function(response) {
      if (type === 'html') {
        displayValidationResults(validateHTML(response.code));
      } else if (type === 'css') {
        displayValidationResults(validateCSS(response.code));
      }
    });
  });
}

function displayValidationResults(results) {
  const outputElement = document.getElementById('validationOutput');
  outputElement.innerHTML = '';
  
  results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.classList.add(result.type);
    resultElement.textContent = `${result.type.toUpperCase()}: Line ${result.line} - ${result.message}`;
    if (result.suggestion) {
      const suggestionElement = document.createElement('div');
      suggestionElement.classList.add('suggestion');
      suggestionElement.textContent = `Suggestion: ${result.suggestion}`;
      resultElement.appendChild(suggestionElement);
    }
    outputElement.appendChild(resultElement);
  });

  document.getElementById('validationResults').classList.remove('hidden');
}

function validateHTML(html) {
  const results = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const errors = doc.querySelectorAll('parsererror');

  if (errors.length) {
    results.push({
      type: 'error',
      line: 1, // Basic implementation; actual line numbers would require more complex parsing
      message: 'Invalid HTML structure',
      suggestion: 'Check for unclosed tags or improper nesting'
    });
  }

  // Basic checks (expand these for more comprehensive validation)
  if (html.includes('<center>') || html.includes('<font>')) {
    results.push({
      type: 'warning',
      line: 1,
      message: 'Deprecated HTML tags detected',
      suggestion: 'Use CSS for styling instead of deprecated HTML tags'
    });
  }

  if (!html.toLowerCase().includes('<!doctype html>')) {
    results.push({
      type: 'warning',
      line: 1,
      message: 'Doctype declaration missing',
      suggestion: 'Add <!DOCTYPE html> at the beginning of your HTML document'
    });
  }

  return results;
}

function validateCSS(css) {
  const results = [];
  const lines = css.split('\n');

  lines.forEach((line, index) => {
    // Check for !important
    if (line.includes('!important')) {
      results.push({
        type: 'warning',
        line: index + 1,
        message: 'Use of !important detected',
        suggestion: 'Avoid using !important as it breaks the natural cascading of CSS'
      });
    }

    // Check for potential box model issues
    if (line.includes('width') && line.includes('padding') && !line.includes('box-sizing')) {
      results.push({
        type: 'warning',
        line: index + 1,
        message: 'Potential box model issue detected',
        suggestion: 'Consider using box-sizing: border-box to include padding in the width'
      });
    }

    // Check for browser-specific prefixes
    if (line.includes('-webkit-') || line.includes('-moz-') || line.includes('-ms-')) {
      results.push({
        type: 'info',
        line: index + 1,
        message: 'Browser-specific prefix detected',
        suggestion: 'Consider using a CSS autoprefixer for better cross-browser compatibility'
      });
    }
  });

  return results;
}