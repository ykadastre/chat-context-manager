// Popup script for Chat Context Manager

// Initialize when the popup is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load saved contexts
  loadSavedContexts();
  
  // Set up event listeners
  document.getElementById('capture-button').addEventListener('click', captureCurrentChat);
  document.getElementById('clear-button').addEventListener('click', clearAllData);
  document.getElementById('import-button').addEventListener('click', importContext);
});

// Load saved contexts from storage
function loadSavedContexts() {
  chrome.storage.local.get(null, (data) => {
    const contextList = document.getElementById('context-list');
    contextList.innerHTML = '';
    
    // Filter for context items only
    const contextKeys = Object.keys(data).filter(key => key.startsWith('context_'));
    
    if (contextKeys.length === 0) {
      // Show empty state
      contextList.innerHTML = '<div class="empty-state">No saved contexts yet</div>';
      return;
    }
    
    // Sort by timestamp (most recent first)
    contextKeys.sort((a, b) => {
      return new Date(data[b].metadata.timestamp) - new Date(data[a].metadata.timestamp);
    });
    
    // Create list items for each context
    contextKeys.forEach(key => {
      const context = data[key];
      const item = document.createElement('div');
      item.className = 'context-item';
      
      // Format timestamp
      const timestamp = new Date(context.metadata.timestamp);
      const formattedDate = timestamp.toLocaleDateString();
      const formattedTime = timestamp.toLocaleTimeString();
      
      // Create content
      item.innerHTML = `
        <div><strong>${context.metadata.source} Chat</strong></div>
        <div>${formattedDate} ${formattedTime}</div>
        <div>${context.metadata.messageCount} messages</div>
        <div class="context-actions">
          <button class="download-btn" data-key="${key}">Download</button>
          <button class="delete-btn secondary" data-key="${key}">Delete</button>
        </div>
      `;
      
      contextList.appendChild(item);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.download-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadContext(button.dataset.key);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteContext(button.dataset.key);
      });
    });
  });
}

// Capture the current chat from the active tab
function captureCurrentChat() {
  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    // Send message to content script
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: 'captureFromPopup' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          // Refresh the list
          loadSavedContexts();
        }
      }
    );
  });
}

// Clear all stored data
function clearAllData() {
  if (confirm('Are you sure you want to clear all saved contexts? This cannot be undone.')) {
    chrome.storage.local.clear(() => {
      loadSavedContexts();
    });
  }
}

// Download a specific context file
function downloadContext(key) {
  chrome.storage.local.get(key, (data) => {
    if (!data[key]) return;
    
    const context = data[key];
    const jsonString = JSON.stringify(context, null, 2);
    
    // Create a blob and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  });
}

// Delete a specific context
function deleteContext(key) {
  if (confirm('Are you sure you want to delete this context?')) {
    chrome.storage.local.remove(key, () => {
      loadSavedContexts();
    });
  }
}

// Import a context file
function importContext() {
  const fileInput = document.getElementById('import-context');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file to import');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const context = JSON.parse(e.target.result);
      
      // Validate the context structure
      if (!context.metadata || !context.messages) {
        throw new Error('Invalid context file format');
      }
      
      // Store the imported context
      chrome.storage.local.set({
        ['context_' + Date.now()]: context
      }, () => {
        alert('Context imported successfully');
        loadSavedContexts();
        fileInput.value = '';
      });
    } catch (error) {
      alert('Failed to import context: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}