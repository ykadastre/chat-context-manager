// Background script for Chat Context Manager

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureConversation') {
    // Process and store conversation data
    processConversation(request.data)
      .then(result => sendResponse({ success: true, contextFile: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

// Process conversation data into a context file
async function processConversation(conversationData) {
  // 1. Parse the conversation data
  const messages = conversationData.messages;
  
  // 2. Identify key information and important context
  // This could be enhanced with more sophisticated algorithms
  const contextSummary = summarizeConversation(messages);
  
  // 3. Create a structured context file
  const contextFile = {
    metadata: {
      source: conversationData.source,
      timestamp: new Date().toISOString(),
      messageCount: messages.length
    },
    summary: contextSummary,
    messages: messages,
    keyInsights: extractKeyInsights(messages)
  };
  
  // 4. Store in extension storage
  await chrome.storage.local.set({
    ['context_' + Date.now()]: contextFile
  });
  
  return contextFile;
}

// Simple summarization function - this could be improved with NLP or AI techniques
function summarizeConversation(messages) {
  // Basic approach: take the first exchange and the last few exchanges
  let summary = "";
  
  if (messages.length > 0) {
    // Add the initial prompt/question
    summary += "Initial prompt: " + messages[0].content.substring(0, 200);
    
    // Add the last exchanges if there are more than 3 messages
    if (messages.length > 3) {
      summary += "\n\nRecent exchanges:\n";
      for (let i = Math.max(1, messages.length - 4); i < messages.length; i++) {
        const role = messages[i].role === 'user' ? 'Human' : 'AI';
        summary += `${role}: ${messages[i].content.substring(0, 100)}...\n`;
      }
    }
  }
  
  return summary;
}

// Extract key insights from the conversation
function extractKeyInsights(messages) {
  // This is a placeholder for more sophisticated extraction
  // In a real implementation, we might use NLP techniques to identify important concepts
  const insights = [];
  
  // Very simple approach: look for potential key points in AI responses
  messages.forEach(message => {
    if (message.role !== 'user') {
      // Look for bullet points or numbered lists
      const bulletPoints = message.content.match(/[\u2022\-*]\s(.+?)(?=\n|$)/g);
      if (bulletPoints) insights.push(...bulletPoints.slice(0, 3));
      
      // Look for sentences with key indicator phrases
      const keyPhrases = ['important', 'key point', 'remember', 'crucial', 'essential'];
      keyPhrases.forEach(phrase => {
        const regex = new RegExp(`[^.!?]*${phrase}[^.!?]*[.!?]`, 'gi');
        const matches = message.content.match(regex);
        if (matches) insights.push(...matches.slice(0, 2));
      });
    }
  });
  
  // Deduplicate and limit
  return [...new Set(insights)].slice(0, 10);
}