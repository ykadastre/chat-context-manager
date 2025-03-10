// Context Formatter - Utility to process and optimize conversation contexts

/**
 * Formats a conversation context for optimal AI input
 * 
 * @param {Object} contextFile - The raw context file
 * @param {Object} options - Formatting options
 * @returns {String} - Formatted context string ready for AI input
 */
function formatContextForAI(contextFile, options = {}) {
  const defaultOptions = {
    maxTokens: 4000,           // Approximate token limit
    includeSummary: true,      // Include context summary
    includeKeyInsights: true,  // Include key insights
    preferRecentMessages: true, // Prioritize recent messages if truncation needed
    format: 'markdown'         // Output format (markdown, text, json)
  };
  
  // Merge with default options
  const settings = { ...defaultOptions, ...options };
  
  // Start building the formatted context
  let formattedContext = '';
  
  // Include metadata header
  const source = contextFile.metadata.source.charAt(0).toUpperCase() + contextFile.metadata.source.slice(1);
  const date = new Date(contextFile.metadata.timestamp).toLocaleString();
  const messageCount = contextFile.metadata.messageCount;
  
  if (settings.format === 'markdown') {
    formattedContext += `# Previous Conversation Context\n\n`;
    formattedContext += `**Source:** ${source}\n`;
    formattedContext += `**Date:** ${date}\n`;
    formattedContext += `**Messages:** ${messageCount}\n\n`;
    
    // Include summary if available and requested
    if (settings.includeSummary && contextFile.summary) {
      formattedContext += `## Summary\n\n${contextFile.summary}\n\n`;
    }
    
    // Include key insights if available and requested
    if (settings.includeKeyInsights && contextFile.keyInsights && contextFile.keyInsights.length > 0) {
      formattedContext += `## Key Points\n\n`;
      contextFile.keyInsights.forEach(insight => {
        formattedContext += `- ${insight}\n`;
      });
      formattedContext += '\n';
    }
    
    // Add the conversation
    formattedContext += `## Conversation\n\n`;
    
    // Process messages based on preferences
    const messages = processMessages(contextFile.messages, settings);
    
    // Add messages to the context
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '**Human:**' : '**Assistant:**';
      formattedContext += `${role}\n${message.content}\n\n`;
    });
    
    // Add final instruction
    formattedContext += `--- End of previous conversation ---\n\n`;
    formattedContext += `Please continue the conversation as if this context was part of our current exchange. The human will now continue with their next message.\n`;
  } 
  else if (settings.format === 'json') {
    // For direct API usage, create a more structured format
    const contextObj = {
      metadata: {
        source: contextFile.metadata.source,
        date: date,
        messageCount: messageCount
      },
      summary: settings.includeSummary ? contextFile.summary : null,
      keyInsights: settings.includeKeyInsights ? contextFile.keyInsights : null,
      messages: processMessages(contextFile.messages, settings)
    };
    
    formattedContext = JSON.stringify(contextObj, null, 2);
  }
  else {
    // Plain text format
    formattedContext += `PREVIOUS CONVERSATION CONTEXT\n\n`;
    formattedContext += `Source: ${source}\n`;
    formattedContext += `Date: ${date}\n`;
    formattedContext += `Messages: ${messageCount}\n\n`;
    
    if (settings.includeSummary && contextFile.summary) {
      formattedContext += `SUMMARY\n\n${contextFile.summary}\n\n`;
    }
    
    if (settings.includeKeyInsights && contextFile.keyInsights && contextFile.keyInsights.length > 0) {
      formattedContext += `KEY POINTS\n\n`;
      contextFile.keyInsights.forEach(insight => {
        formattedContext += `- ${insight}\n`;
      });
      formattedContext += '\n';
    }
    
    formattedContext += `CONVERSATION\n\n`;
    
    const messages = processMessages(contextFile.messages, settings);
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'Human:' : 'Assistant:';
      formattedContext += `${role}\n${message.content}\n\n`;
    });
    
    formattedContext += `--- End of previous conversation ---\n\n`;
    formattedContext += `Please continue the conversation as if this context was part of our current exchange. The human will now continue with their next message.\n`;
  }
  
  return formattedContext;
}

/**
 * Processes messages for inclusion in the context
 * Handles truncation and selection based on settings
 */
function processMessages(messages, settings) {
  // If we don't need to trim, return all messages
  if (messages.length <= 10) {
    return messages;
  }
  
  // Need to truncate based on settings
  if (settings.preferRecentMessages) {
    // Always include the first message (initial prompt) and the most recent messages
    const initialMessage = messages[0];
    const recentMessages = messages.slice(-9); // Last 9 messages
    
    return [initialMessage, ...recentMessages];
  } else {
    // Evenly sample throughout the conversation
    const step = Math.floor(messages.length / 10);
    const sampledMessages = [];
    
    // Always include first and last
    sampledMessages.push(messages[0]);
    
    // Sample middle parts
    for (let i = 1; i < messages.length - 1; i += step) {
      sampledMessages.push(messages[i]);
    }
    
    // Add last message if it's not already included
    if (sampledMessages[sampledMessages.length - 1] !== messages[messages.length - 1]) {
      sampledMessages.push(messages[messages.length - 1]);
    }
    
    return sampledMessages.slice(0, 10);
  }
}

/**
 * Estimates token count for a string of text
 * This is a very rough approximation (4 chars ≈ 1 token)
 */
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatContextForAI,
    processMessages,
    estimateTokenCount
  };
}
