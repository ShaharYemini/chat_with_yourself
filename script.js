const userSelect = document.getElementById('user-select');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const newChatButton = document.getElementById('new-chat-button');
// Select buttons and input
const exportButton = document.getElementById('export-chat');
const importButton = document.getElementById('import-chat');
const importFileInput = document.getElementById('import-file');

// Ensure this is added after the declaration of `chatInput`
document.addEventListener('keydown', (event) => {
    // Check if the focus is not on any input element
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        // Focus the message input
        chatInput.focus();

        // If the key is a printable character, append it to the input value
        const isPrintableKey = event.key.length === 1; // Excludes non-printable keys like "Shift", "Control", etc.
        if (isPrintableKey) {
            chatInput.value += event.key;
        }

        // Prevent the default action for the event (if necessary)
        event.preventDefault();
    }
});

let chatLog = []; // In-memory log to hold the chat

let chatList = {}; // Stores all chats
let currentChatId = null; // Tracks the active chat

// Load chat log for the active chat
function loadChatLog() {
    const activeChat = chatList[currentChatId];
    chatLog = activeChat ? activeChat.messages : [];
    renderChat();
}

// Load chats from localStorage
function loadChats() {
    const savedChats = localStorage.getItem('chatList');
    const savedCurrentChat = localStorage.getItem('currentChatId');

    if (savedChats) {
        chatList = JSON.parse(savedChats);
    }

    if (savedCurrentChat) {
        currentChatId = savedCurrentChat;
    } else {
        createNewChat(); // Create a default chat if none exist
    }

    renderChatList();
    loadChatLog();
}

// Save the chat log for the active chat
function saveChatLog() {
    if (chatList[currentChatId]) {
        chatList[currentChatId].messages = chatLog;
        saveChats();
    }
}

// Save all chats to localStorage
function saveChats() {
    localStorage.setItem('chatList', JSON.stringify(chatList));
    localStorage.setItem('currentChatId', currentChatId);
}

// Render the chat list sidebar
function renderChatList() {
    const chatListContainer = document.getElementById('chat-list');
    chatListContainer.innerHTML = '';

    Object.keys(chatList).forEach(chatId => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';

        // Chat name
        const chatName = document.createElement('span');
        chatName.className = 'chat-name';
        chatName.textContent = chatList[chatId].name || `Chat ${chatId}`;

        // Icons container
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'chat-item-icons';

        // Bin icon for deleting
        const binIcon = document.createElement('img');
        binIcon.src = 'img/bin-icon.svg'; // Path to the bin icon
        binIcon.alt = 'Delete';
        binIcon.className = 'chat-icon';
        binIcon.onclick = (event) => {
            event.stopPropagation();
            deleteChat(chatId);
        };

        // Pencil icon for renaming
        const pencilIcon = document.createElement('img');
        pencilIcon.src = 'img/pencil-icon.svg'; // Path to the pencil icon
        pencilIcon.alt = 'Rename';
        pencilIcon.className = 'chat-icon';
        pencilIcon.onclick = (event) => {
            event.stopPropagation();
            renameChat(chatId);
        };

        // Add icons to container
        iconsContainer.appendChild(binIcon);
        iconsContainer.appendChild(pencilIcon);

        // Append everything to chat item
        chatItem.appendChild(chatName);
        chatItem.appendChild(iconsContainer);

        chatItem.addEventListener('click', () => {
            currentChatId = chatId;
            renderChatList();
            loadChatLog();
        });

        chatListContainer.appendChild(chatItem);
    });
}


// Delete a chat
function deleteChat(chatId) {
    if (confirm('Are you sure you want to delete this chat?')) {
        delete chatList[chatId];
        saveChats();
        renderChatList();
    }
}

// Rename a chat
function renameChat(chatId) {
    const chat = chatList[chatId];
    if (!chat) return;

    const newName = prompt('Enter the new name for this chat:', chat.name);
    if (newName) {
        chat.name = newName;
        saveChats();
        renderChatList();
    }
}

// Create a new chat
function createNewChat() {
    const chatId = `chat-${Date.now()}`;
    chatList[chatId] = { name: `Chat ${Object.keys(chatList).length + 1}`, messages: [] };
    currentChatId = chatId;

    saveChats();
    renderChatList();
    loadChatLog();
}

// Function to render the chat log
// Store the original message being responded to
let respondingTo = null;

// Add context menu functionality
chatWindow.addEventListener('contextmenu', (event) => {
    event.preventDefault();

    // Check if a message was clicked
    const targetMessage = event.target.closest('.message');
    if (!targetMessage) return;

    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.context-menu');
    if (existingDropdown) existingDropdown.remove();

    // Create a dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'context-menu';
    dropdown.textContent = 'Respond to this message';
    dropdown.style.top = `${event.clientY}px`;
    dropdown.style.left = `${event.clientX}px`;

    // Add event listener for responding
    dropdown.addEventListener('click', () => {
        respondingTo = targetMessage.querySelector('.message-text').textContent;

        // Show the response preview in the input area
        const responsePreview = document.createElement('div');
        responsePreview.className = 'response-preview';
        responsePreview.textContent = `Responding to: ${respondingTo.slice(0, 50)}...`;

        // Add response preview above the input field
        const existingPreview = document.querySelector('.response-preview');
        if (existingPreview) existingPreview.remove(); // Replace existing preview
        chatForm.insertBefore(responsePreview, chatInput);

        dropdown.remove(); // Close dropdown
    });

    // Add dropdown to the DOM
    document.body.appendChild(dropdown);
});

// Remove dropdown when clicking elsewhere
document.addEventListener('click', () => {
    const dropdown = document.querySelector('.context-menu');
    if (dropdown) dropdown.remove();
});

// Modify message rendering to include response references
function renderChat() {
    chatWindow.innerHTML = ''; // Clear previous messages
    chatLog.forEach(({ user, message, respondingTo }) => {
        const messageDiv = document.createElement('div');
        let userClass = user == 'אני' ? 'User1' : 'User2';
        messageDiv.className = `message ${userClass}`;

        // Add the responded-to snippet (if any)
        if (respondingTo) {
            const reference = document.createElement('div');
            reference.className = 'response-reference';
            reference.textContent = `מגיב ל: ${respondingTo.slice(0, 50)}...`;
            messageDiv.appendChild(reference);
        }

        // Add the sender's name
        const senderName = document.createElement('span');
        senderName.className = 'sender-name';
        senderName.textContent = user;
        messageDiv.appendChild(senderName);

        // Add the message text
        const messageText = document.createElement('p');
        messageText.className = 'message-text';
        messageText.textContent = message;
        messageDiv.appendChild(messageText);

        chatWindow.appendChild(messageDiv);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Modify form submission to include the reference
chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const activeUser = userSelect.value;
    const message = chatInput.value.trim();
    if (message) {
        chatLog.push({ user: activeUser, message, respondingTo });
        renderChat();
        saveChatLog(); // Save to localStorage
        chatInput.value = '';
        respondingTo = null; // Reset response reference

        // Remove the response preview
        const existingPreview = document.querySelector('.response-preview');
        if (existingPreview) existingPreview.remove();
    }
});


// Function to export chatList as a JSON file
function exportChats() {
    const chatListData = JSON.stringify(chatList, null, 2); // Format the JSON for readability
    const blob = new Blob([chatListData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'chatList.json';
    link.click();
}

function importChats(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedChatList = JSON.parse(e.target.result);
                if (typeof importedChatList === 'object') {
                    chatList = importedChatList;
                    localStorage.setItem('chatList', JSON.stringify(chatList)); // Save to localStorage
                    renderChatList(); // Update UI
                    alert('Chats imported successfully!');
                } else {
                    throw new Error('Invalid file format.');
                }
            } catch (error) {
                alert('Error importing chats: ' + error.message);
            } finally {
                event.target.value = ''; // Reset file input value
            }
        };
        reader.readAsText(file);
    }
}


newChatButton.addEventListener('click', createNewChat);
exportButton.addEventListener('click', exportChats);
importButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('input', importChats);

// Initialize the app
loadChats();

