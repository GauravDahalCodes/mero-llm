class LLM7Chat {
    constructor() {
        this.apiUrl = 'https://api.llm7.io/v1/chat/completions';
        this.currentModel = 'gpt-4.1';
        this.messages = [];
        this.selectedImage = null;
        
        // Models that support images
        this.multimodalModels = [
            'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'openai-roblox',
            'mistral-small-3.1-24B', 'unity-mistral-large', 'mirexa', 
            'searchgpt', 'phi-4', 'sur', 'bidara', 'pixtral-12b-2409', 
            'pixtral-large-2411'
        ];
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateModelInfo();
    }
    
    initializeElements() {
        this.modelSelect = document.getElementById('model-select');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.imageUploadBtn = document.getElementById('image-upload-btn');
        this.imageInput = document.getElementById('image-input');
        this.imagePreview = document.getElementById('image-preview');
        this.previewImg = document.getElementById('preview-img');
        this.removeImageBtn = document.getElementById('remove-image');
        this.currentModelInfo = document.getElementById('current-model-info');
        this.multimodalIndicator = document.getElementById('multimodal-indicator');
    }
    
    setupEventListeners() {
        // Model selection
        this.modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.clearChat();
            this.updateModelInfo();
        });
        
        // Message input
        this.messageInput.addEventListener('input', () => {
            this.updateSendButton();
            this.autoResizeTextarea();
        });
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Send button
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Image upload
        this.imageUploadBtn.addEventListener('click', () => {
            if (this.isMultimodal()) {
                this.imageInput.click();
            }
        });
        
        this.imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        this.removeImageBtn.addEventListener('click', () => {
            this.removeSelectedImage();
        });
    }
    
    updateModelInfo() {
        const modelName = this.modelSelect.options[this.modelSelect.selectedIndex].text;
        this.currentModelInfo.textContent = `Current model: ${modelName}`;
        
        if (this.isMultimodal()) {
            this.multimodalIndicator.style.display = 'inline-block';
            this.imageUploadBtn.style.display = 'flex';
            this.imageUploadBtn.disabled = false;
        } else {
            this.multimodalIndicator.style.display = 'none';
            this.imageUploadBtn.style.display = 'none';
            this.removeSelectedImage();
        }
    }
    
    isMultimodal() {
        return this.multimodalModels.includes(this.currentModel);
    }
    
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        const hasImage = this.selectedImage !== null;
        this.sendBtn.disabled = !(hasText || hasImage);
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('Image size must be less than 10MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.selectedImage = {
                data: e.target.result,
                file: file
            };
            this.showImagePreview();
            this.updateSendButton();
        };
        reader.readAsDataURL(file);
    }
    
    showImagePreview() {
        if (this.selectedImage) {
            this.previewImg.src = this.selectedImage.data;
            this.imagePreview.style.display = 'block';
        }
    }
    
    removeSelectedImage() {
        this.selectedImage = null;
        this.imagePreview.style.display = 'none';
        this.imageInput.value = '';
        this.updateSendButton();
    }
    
    clearChat() {
        this.messages = [];
        this.removeSelectedImage();
        
        // Remove all messages except welcome message
        const messageElements = this.chatMessages.querySelectorAll('.message, .loading-message');
        messageElements.forEach(el => el.remove());
    }
    
    addMessage(content, role, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        let imageHtml = '';
        if (imageData) {
            imageHtml = `<img src="${imageData}" alt="Uploaded image" class="message-image">`;
        }
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            ${imageHtml}
            <div class="message-bubble">
                ${this.formatMessage(content)}
            </div>
            <div class="message-time">${time}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Hide welcome message when first message is sent
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }
    
    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.innerHTML = `
            <div class="loading-message">
                <span>Thinking</span>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(loadingDiv);
        this.scrollToBottom();
        return loadingDiv;
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    async sendMessage() {
        const messageText = this.messageInput.value.trim();
        const imageData = this.selectedImage;
        
        if (!messageText && !imageData) return;
        
        // Add user message to chat
        this.addMessage(messageText, 'user', imageData?.data);
        
        // Prepare message for API
        const messageContent = [];
        
        if (messageText) {
            messageContent.push({
                type: 'text',
                text: messageText
            });
        }
        
        if (imageData && this.isMultimodal()) {
            messageContent.push({
                type: 'image_url',
                image_url: {
                    url: imageData.data
                }
            });
        }
        
        // Add to conversation history
        this.messages.push({
            role: 'user',
            content: messageContent.length === 1 && messageContent[0].type === 'text' 
                ? messageText 
                : messageContent
        });
        
        // Clear input and image
        this.messageInput.value = '';
        this.removeSelectedImage();
        this.autoResizeTextarea();
        this.updateSendButton();
        
        // Show loading animation
        const loadingElement = this.showLoading();
        
        try {
            const response = await this.callAPI();
            loadingElement.remove();
            
            if (response && response.choices && response.choices[0]) {
                const assistantMessage = response.choices[0].message.content;
                this.addMessage(assistantMessage, 'assistant');
                
                // Add to conversation history
                this.messages.push({
                    role: 'assistant',
                    content: assistantMessage
                });
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            loadingElement.remove();
            this.addMessage(`Error: ${error.message}`, 'assistant');
        }
    }
    
    async callAPI() {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer unused'
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: this.messages,
                max_tokens: 4000,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }
}

// Initialize the chat application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LLM7Chat();
});