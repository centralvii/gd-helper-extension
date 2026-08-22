/**
 * GDHelper Extension Background Service Worker
 * Configures Side Panel behavior for Chrome Manifest V3
 */

// Open side panel when the action (toolbar icon) is clicked
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.error('Error setting panel behavior:', error);
    });
  }
  console.log('GDHelper Extension installed successfully.');
});

// Fallback click handler if setPanelBehavior is not supported
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('Could not open sidePanel directly:', err);
    }
  }
});
