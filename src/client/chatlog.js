import {sendChatToServer} from './networking.js';

const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');

// Handle sending messages
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && chatInput.value.trim() !== '') {
    const message = chatInput.value.trim();
    sendChatToServer(message); // Add your own message
    chatInput.value = '';

    // TODO: Send the message to the server
  }
});

// Function to add a message to the chat log
export function addChatMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${message.username}: ${message.message}`;
  chatLog.appendChild(messageElement);

  // Scroll to the bottom of the chat log
  chatLog.scrollTop = chatLog.scrollHeight;
}

