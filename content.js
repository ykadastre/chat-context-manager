// Content script for Chat Context Manager

// Identify which platform we're on
const platform = identifyPlatform();

// Set up message capturing based on the platform
setupMessageCapturing(platform);

// Add UI elements to the page
injectUI(platform);

// Function to identify the current AI chat platform
function identifyPlatform() {
  const url = window.location.href;
  if (url.includes('chat.openai.com')) return 'chatgpt';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('bard.google.com')) return 'bard';
  return 'unknown';
}

// Set up platform-specific message capturing
function setupMessageCapturing(platform) {
  // We'll use different DOM selectors based on the platform
  switch (platform) {
    case 'chatgpt':
      // For ChatGPT
      observeDOMChanges('.markdown');
      break;
    case 'claude':
      // For Claude
      observeDOMChanges('.claude-msg');
      break;
    case 'bard':
      // For Bard
      observeDOMChanges('.bard-response');
      break;
  }
}

// Observe DOM changes to capture new messages
function observeDOMChanges(messageSelector) {
  // Create a MutationObserver to watch for new messages
  const observer = new MutationObserver(mutations => {
    // When new elements are added, check if they're messages
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Look for new message elements
        const newMessages = document.querySelectorAll(messageSelector);
        if (newMessages.length > 0) {
          // Store the updated messages
          storeMessages();
        }
      }
    }
  });

  // Start observing the chat container
  const chatContainer = document.querySelector('.chat-container') || document.body;
  observer.observe(chatContainer, { childList: true, subtree: true });
}

// Store messages from the current conversation
function storeMessages() {
  // Extract messages based on the platform
  const messages = extractMessages(platform);
  
  // Store them in extension storage
  chrome.storage.local.set({ 'currentConversation': { 
    messages,
    updatedAt: new Date().toISOString(),
    source: platform
  }});
}

// Extract messages based on the platform
function extractMessages(platform) {
  const messages = [];
  let messageElements = [];
  
  switch (platform) {
    case 'chatgpt':
      messageElements = document.querySelectorAll('.group');
      break;
    case 'claude':
      messageElements = document.querySelectorAll('.message');
      break;
    case 'bard':
      messageElements = document.querySelectorAll('.conversation-message');
      break;
  }
  
  // Process each message element
  messageElements.forEach(element => {
    // Determine if this is a user or AI message
    const isUser = determineIfUserMessage(element, platform);
    
    // Get the text content
    const content = extractMessageContent(element, platform);
    
    if (content) {
      messages.push({
        role: isUser ? 'user' : 'assistant',
        content: content,
        timestamp: new Date().toISOString() // We don't have actual timestamps from the DOM
      });
    }
  });
  
  return messages;
}

// Helper function to determine if a message is from the user
function determineIfUserMessage(element, platform) {
  switch (platform) {
    case 'chatgpt':
      return !element.classList.contains('assistant');
    case 'claude':
      return element.classList.contains('user-message');
    case 'bard':
      return element.classList.contains('user-message');
    default:
      return false;
  }
}

// Helper function to extract message content
function extractMessageContent(element, platform) {
  switch (platform) {
    case 'chatgpt':
      const markdown = element.querySelector('.markdown');
      return markdown ? markdown.textContent.trim() : '';
    case 'claude':
      const msgContent = element.querySelector('.message-content');
      return msgContent ? msgContent.textContent.trim() : '';
    case 'bard':
      const responseContent = element.querySelector('.response-content');
      return responseContent ? responseContent.textContent.trim() : '';
    default:
      return '';
  }
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureFromPopup') {
    // Get the current conversation from storage
    chrome.storage.local.get('currentConversation', (data) => {
      if (data.currentConversation) {
        // Send to background script for processing
        chrome.runtime.sendMessage(
          {
            action: 'captureConversation',
            data: data.currentConversation
          },
          (response) => {
            sendResponse(response);
          }
        );
      } else {
        sendResponse({ success: false, error: 'No conversation data found' });
      }
    });
    return true; // Keep the messaging channel open for async response
  }
});

// Inject UI elements for the extension
function injectUI(platform) {
  // Create the capture button
  const captureButton = document.createElement('button');
  captureButton.textContent = 'Capture Chat Context';
  captureButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 10px 15px;
    background-color: #5540af;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  // Add click event handler
  captureButton.addEventListener('click', () => {
    // Get the current conversation
    chrome.storage.local.get('currentConversation', (data) => {
      if (data.currentConversation) {
        // Send to background script for processing
        chrome.runtime.sendMessage(
          {
            action: 'captureConversation',
            data: data.currentConversation
          },
          (response) => {
            if (response && response.success) {
              // Show success notification
              showNotification('Chat context captured successfully!', 'success');
              
              // Download the context file
              downloadContextFile(response.contextFile);
            } else {
              // Show error notification
              showNotification('Failed to capture chat context.', 'error');
            }
          }
        );
      } else {
        showNotification('No conversation found to capture.', 'error');
      }
    });
  });
  
  // Add the button to the page
  document.body.appendChild(captureButton);
}

// Show a notification to the user
function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 15px 20px;
    background-color: ${type === 'success' ? '#4CAF50' : '#F44336'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-size: 14px;
    max-width: 300px;
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Download context file
function downloadContextFile(contextFile) {
  // Create a JSON string
  const jsonString = JSON.stringify(contextFile, null, 2);
  
  // Create a blob and download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `chat-context-${Date.now()}.json`;
  
  // Trigger download
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  // Clean up
  URL.revokeObjectURL(url);
}