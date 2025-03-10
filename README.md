# Chat Context Manager

A browser extension that allows you to save and reuse AI chat context between conversations. This solves the problem of limited conversation history in AI chat applications like ChatGPT, Claude, and Google Bard.

## Features

- **Conversation Capture**: Extract and save the full conversation from popular AI chat platforms
- **Context Processing**: Intelligently process conversations to extract key information
- **Context Injection**: Prepare context files that can be used to start new conversations
- **Multiple Platform Support**: Works with ChatGPT, Claude, and Google Bard

## Installation

### Developer Mode

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the repository folder

## Usage

1. Visit any supported AI chat platform (ChatGPT, Claude, Bard)
2. Have your conversation with the AI
3. Click the "Capture Chat Context" button that appears in the bottom-right corner
4. The context file will be downloaded as a JSON file
5. To use the context in a new conversation, you can:
   - Copy the relevant parts into your new conversation
   - Use the extension's popup to manage and view your saved contexts

## How It Works

1. **Content Script**: Monitors the chat interface and captures messages
2. **Background Script**: Processes captured messages into a context file
3. **Popup Interface**: Provides a UI to manage saved contexts

## Limitations

- The extension can only capture what's visible in the DOM
- Some AI platforms may change their DOM structure, requiring updates
- Large conversations may create large context files

## Future Improvements

- AI-powered context summarization
- Direct context injection into new conversations
- Fine-tuned processing for different types of conversations
- Cloud sync for context files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
