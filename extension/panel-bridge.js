// Bridge between the Chrome DevTools panel and the inspected Angular page.
// Detects the devframe connection endpoint and loads the SPA with the correct baseURL.

const frame = document.getElementById('devtools-frame');
const status = document.getElementById('status');

const tabId = chrome.devtools.inspectedWindow.tabId;
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

// Where devframe may be mounted.
const PATHS = ['/__ng-devtools/', '/__devframe/', '/'];
const CONNECTION_FILES = ['__devframe/__connection.json', '__connection.json'];

// Look for a devframe connection, but only on a loopback page: nothing else
// can be connected to, so nothing else is worth probing.
function detectConnection() {
  chrome.devtools.inspectedWindow.eval('location.origin', (origin, error) => {
    if (error || typeof origin !== 'string') {
      loadPanel(null);
      return;
    }

    let hostname;
    try {
      hostname = new URL(origin).hostname;
    } catch {
      loadPanel(null);
      return;
    }

    if (!LOCAL_HOSTS.includes(hostname)) {
      loadPanel(null);
      return;
    }

    findConnection(origin).then(loadPanel);
  });
}

// The first mount path that answers with a connection file, or null.
async function findConnection(origin) {
  for (const base of PATHS) {
    for (const file of CONNECTION_FILES) {
      try {
        const response = await fetch(new URL(base + file, origin), {
          credentials: 'omit',
          cache: 'no-store',
        });
        if (!response.ok) continue;
        await response.json();
        return base;
      } catch {
        // Not mounted here; try the next one.
      }
    }
  }
  return null;
}

function loadPanel(baseURL) {
  status.classList.add('hidden');
  frame.style.display = 'block';

  // The SPA is bundled inside the extension at ui/index.html
  const panelUrl = chrome.runtime.getURL('ui/index.html');

  if (baseURL) {
    // Get the inspected page's origin to build the full baseURL
    chrome.devtools.inspectedWindow.eval('location.origin', (origin) => {
      const url = new URL(baseURL, origin);
      if (!LOCAL_HOSTS.includes(url.hostname)) {
        frame.src = panelUrl;
        return;
      }
      frame.src = `${panelUrl}?baseURL=${encodeURIComponent(url.href)}`;
    });
  } else {
    frame.src = panelUrl;
  }
}

// Start detection after a short delay to let the page settle
setTimeout(detectConnection, 500);

// Re-detect on navigation
chrome.devtools.network.onNavigated.addListener(() => {
  frame.style.display = 'none';
  status.classList.remove('hidden');
  status.textContent = 'Detecting Angular app…';
  setTimeout(detectConnection, 1000);
});
