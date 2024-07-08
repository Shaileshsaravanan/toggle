chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "resizeViewport") {
        resizeViewport(request.width, request.height);
      }
    
    if (request.action === "analyzePerformance") {
      const performanceData = analyzePerformance();
      sendResponse(performanceData);
    }
    return true;
  });
  
  function analyzePerformance() {
    const timing = performance.timing;
    const resources = performance.getEntriesByType('resource');
  
    const metrics = {
      totalLoadTime: timing.loadEventEnd - timing.navigationStart,
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      serverResponse: timing.responseStart - timing.requestStart,
      domLoading: timing.domComplete - timing.domLoading,
      resourceLoading: timing.loadEventStart - timing.responseEnd
    };
  
    const slowResources = resources
      .filter(resource => resource.duration > 500) // Consider resources taking more than 500ms as slow
      .map(resource => ({
        name: resource.name,
        duration: resource.duration
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5); // Show top 5 slow resources
  
    return { metrics, slowResources };
}

function resizeViewport(width, height) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = `width=${width}, height=${height}, initial-scale=1`;
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = `width=${width}, height=${height}, initial-scale=1`;
      document.head.appendChild(newViewport);
    }
    
    // Force reflow
    document.body.style.width = width + 'px';
    document.body.style.height = height + 'px';
    window.dispatchEvent(new Event('resize'));
} 

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getCode") {
      if (request.codeType === 'html') {
        sendResponse({code: document.documentElement.outerHTML});
      } else if (request.codeType === 'css') {
        let cssCode = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
          try {
            const rules = document.styleSheets[i].cssRules;
            for (let j = 0; j < rules.length; j++) {
              cssCode += rules[j].cssText + '\n';
            }
          } catch (e) {
            console.log('Error accessing stylesheet:', e);
          }
        }
        sendResponse({code: cssCode});
      }
    }
    return true;
});