chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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