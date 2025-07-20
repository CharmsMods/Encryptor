// Main application initialization and UI event handlers
// This file sets up the basic UI interactions and prepares for component integration

class SecureFileImageConverter {
    constructor() {
        this.currentMode = 'encrypt';
        this.currentInputType = 'file';
        this.currentOutputFormat = 'image';
        this.currentDecryptInputType = 'image';
        
        // Initialize error handler first
        this.errorHandler = new ErrorHandler();
        this.errorHandler.setDebugMode(false); // Set to true for development
        
        // Initialize security manager
        this.securityManager = this.initializeSecurityManager();
        
        // Initialize components
        this.validationEngine = new ValidationEngineImpl();
        this.fileProcessor = new FileProcessorImpl();
        
        // Store current files and results
        this.selectedFile = null;
        this.selectedFiles = []; // Array for multiple files
        this.selectedImage = null;
        this.encryptionResult = null;
        
        // Initialize file archiver
        this.fileArchiver = new FileArchiver();
        
        // Track current operations for cleanup
        this.currentOperations = new Set();
        
        // Setup security monitoring
        this.setupSecurityMonitoring();
        
        this.initializeEventListeners();
        this.initializeUI();
    }

    /**
     * Initialize SecurityManager if available
     * @returns {SecurityManager|Object} SecurityManager instance or minimal implementation
     */
    initializeSecurityManager() {
        try {
            // Try to get SecurityManager from global scope first
            if (typeof window !== 'undefined' && window.SecurityManager) {
                return new window.SecurityManager();
            }
            
            // Try to get SecurityManager from import
            if (typeof SecurityManager !== 'undefined') {
                return new SecurityManager();
            }
            
            // Return a minimal security manager for testing
            return this.createMinimalSecurityManager();
        } catch (error) {
            console.warn('SecurityManager not available, using minimal implementation');
            return this.createMinimalSecurityManager();
        }
    }

    /**
     * Creates a minimal security manager for testing/fallback
     * @returns {Object} Minimal security manager
     */
    createMinimalSecurityManager() {
        return {
            validateSecurityState: () => ({ overall: true }),
            getSecurityRecommendations: () => [],
            getMemoryUsage: () => ({ percentage: 0 }),
            performSecureCleanup: () => 0
        };
    }

    initializeEventListeners() {
        // Mode switching
        document.getElementById('encrypt-mode-btn').addEventListener('click', () => {
            this.switchMode('encrypt');
        });
        
        document.getElementById('decrypt-mode-btn').addEventListener('click', () => {
            this.switchMode('decrypt');
        });

        // Encrypt section tab switching
        document.getElementById('file-input-tab').addEventListener('click', () => {
            this.switchEncryptInputType('file');
        });
        
        document.getElementById('text-input-tab').addEventListener('click', () => {
            this.switchEncryptInputType('text');
        });

        // Decrypt section tab switching
        document.getElementById('image-input-tab').addEventListener('click', () => {
            this.switchDecryptInputType('image');
        });
        
        document.getElementById('base64-input-tab').addEventListener('click', () => {
            this.switchDecryptInputType('base64');
        });

        // File input handlers
        this.setupFileInputHandlers();
        
        // Password input handlers
        this.setupPasswordHandlers();
        
        // Output format handlers
        this.setupOutputFormatHandlers();
        
        // Action button handlers
        this.setupActionButtonHandlers();
    }

    setupFileInputHandlers() {
        // File drag and drop
        const fileDropArea = document.getElementById('file-drop-area');
        const fileInput = document.getElementById('file-input');
        const filePickerBtn = document.getElementById('file-picker-btn');

        filePickerBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleMultipleFileSelection(Array.from(e.target.files));
            }
        });

        // Drag and drop events
        fileDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropArea.classList.add('drag-over');
        });

        fileDropArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileDropArea.classList.remove('drag-over');
        });

        fileDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropArea.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleMultipleFileSelection(Array.from(e.dataTransfer.files));
            }
        });

        // Image drag and drop
        const imageDropArea = document.getElementById('image-drop-area');
        const imageInput = document.getElementById('image-input');
        const imagePickerBtn = document.getElementById('image-picker-btn');

        imagePickerBtn.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageSelection(e.target.files[0]);
            }
        });

        // Image drag and drop events
        imageDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageDropArea.classList.add('drag-over');
        });

        imageDropArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            imageDropArea.classList.remove('drag-over');
        });

        imageDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageDropArea.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleImageSelection(e.dataTransfer.files[0]);
            }
        });
    }

    setupPasswordHandlers() {
        const encryptPassword = document.getElementById('encrypt-password');
        const decryptPassword = document.getElementById('decrypt-password');
        const textInput = document.getElementById('text-input');
        const base64Input = document.getElementById('base64-input');

        encryptPassword.addEventListener('input', () => {
            this.updateEncryptButtonState();
        });

        decryptPassword.addEventListener('input', () => {
            this.updateDecryptButtonState();
        });

        // Add validation for text input
        textInput.addEventListener('input', () => {
            this.updateEncryptButtonState();
        });

        // Add validation for Base64 input with real-time feedback
        base64Input.addEventListener('input', () => {
            this.validateBase64Input();
            this.updateDecryptButtonState();
        });
    }

    setupOutputFormatHandlers() {
        const outputFormatRadios = document.querySelectorAll('input[name="output-format"]');
        outputFormatRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentOutputFormat = e.target.value;
            });
        });
    }

    setupActionButtonHandlers() {
        document.getElementById('encrypt-btn').addEventListener('click', () => {
            this.handleEncrypt();
        });

        document.getElementById('decrypt-btn').addEventListener('click', () => {
            this.handleDecrypt();
        });

        // Clipboard and download handlers
        document.getElementById('copy-base64-btn').addEventListener('click', () => {
            this.copyToClipboard('base64-text');
        });

        document.getElementById('paste-base64-btn').addEventListener('click', () => {
            this.pasteFromClipboard('base64-input');
        });

        document.getElementById('copy-text-btn').addEventListener('click', () => {
            this.copyToClipboard('decrypted-text');
        });

        // Multi-file handlers
        document.getElementById('clear-files-btn').addEventListener('click', () => {
            this.clearSelectedFiles();
        });
    }

    setupSecurityMonitoring() {
        // Validate security state on initialization
        const securityState = this.securityManager.validateSecurityState();
        
        if (!securityState.overall) {
            console.warn('Security validation failed:', securityState);
            const recommendations = this.securityManager.getSecurityRecommendations();
            if (recommendations.length > 0) {
                console.warn('Security recommendations:', recommendations);
            }
        }
        
        // Setup periodic security checks
        setInterval(() => {
            const memoryUsage = this.securityManager.getMemoryUsage();
            if (memoryUsage.percentage > 80) {
                console.warn('High memory usage detected:', memoryUsage);
                // Trigger cleanup if memory usage is too high
                this.securityManager.performSecureCleanup();
            }
        }, 30000); // Check every 30 seconds
        
        // Setup cleanup on operations completion
        this.setupOperationCleanup();
    }

    setupOperationCleanup() {
        // Override the original methods to add cleanup
        const originalHandleEncrypt = this.handleEncrypt.bind(this);
        const originalHandleDecrypt = this.handleDecrypt.bind(this);
        
        this.handleEncrypt = async () => {
            try {
                await originalHandleEncrypt();
            } finally {
                // Always perform cleanup after encryption
                setTimeout(() => this.securityManager.performSecureCleanup(), 1000);
            }
        };
        
        this.handleDecrypt = async () => {
            try {
                await originalHandleDecrypt();
            } finally {
                // Always perform cleanup after decryption
                setTimeout(() => this.securityManager.performSecureCleanup(), 1000);
            }
        };
    }

    initializeUI() {
        // Set initial UI state
        this.switchMode('encrypt');
        this.switchEncryptInputType('file');
        this.switchDecryptInputType('image');
        this.updateEncryptButtonState();
        this.updateDecryptButtonState();
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${mode}-mode-btn`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${mode}-section`).classList.add('active');
        
        // Clear any previous errors
        this.clearErrors();
    }

    switchEncryptInputType(type) {
        this.currentInputType = type;
        
        // Update tab buttons
        document.querySelectorAll('#encrypt-section .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${type}-input-tab`).classList.add('active');
        
        // Update input areas
        document.querySelectorAll('#encrypt-section .input-area').forEach(area => {
            area.classList.remove('active');
        });
        document.getElementById(`${type}-input-area`).classList.add('active');
        
        this.updateEncryptButtonState();
    }

    switchDecryptInputType(type) {
        this.currentDecryptInputType = type;
        
        // Update tab buttons
        document.querySelectorAll('#decrypt-section .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${type}-input-tab`).classList.add('active');
        
        // Update input areas
        document.querySelectorAll('#decrypt-section .input-area').forEach(area => {
            area.classList.remove('active');
        });
        document.getElementById(`${type}-input-area`).classList.add('active');
        
        this.updateDecryptButtonState();
    }

    handleFileSelection(file) {
        // Clear any previous errors
        this.clearErrors();
        
        // Validate the selected file
        const validationResult = this.validationEngine.validateFileForEncryption(file);
        
        if (!validationResult.isValid) {
            this.showError('encrypt', validationResult.userMessage);
            this.selectedFile = null;
            document.getElementById('file-info').style.display = 'none';
            this.updateEncryptButtonState();
            return;
        }
        
        // Display file information
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = this.formatFileSize(file.size);
        document.getElementById('file-info').style.display = 'flex';
        
        this.selectedFile = file;
        this.updateEncryptButtonState();
    }

    handleMultipleFileSelection(files) {
        // Clear any previous errors
        this.clearErrors();
        
        if (!files || files.length === 0) {
            this.clearSelectedFiles();
            return;
        }
        
        // Validate each file
        const validFiles = [];
        let totalSize = 0;
        
        for (const file of files) {
            const validationResult = this.validationEngine.validateFileForEncryption(file);
            if (validationResult.isValid) {
                validFiles.push(file);
                totalSize += file.size;
            } else {
                this.showError('encrypt', `${file.name}: ${validationResult.userMessage}`);
                return;
            }
        }
        
        // Check total size limit (1GB for all files combined)
        if (totalSize > CONSTANTS.MAX_FILE_SIZE) {
            this.showError('encrypt', `Total file size (${this.formatFileSize(totalSize)}) exceeds the 1GB limit.`);
            return;
        }
        
        // Store selected files
        this.selectedFiles = validFiles;
        
        // Update UI based on number of files
        if (validFiles.length === 1) {
            // Show single file info
            this.selectedFile = validFiles[0];
            document.getElementById('file-name').textContent = validFiles[0].name;
            document.getElementById('file-size').textContent = this.formatFileSize(validFiles[0].size);
            document.getElementById('file-info').style.display = 'flex';
            document.getElementById('multi-file-list').style.display = 'none';
        } else {
            // Show multi-file list
            this.selectedFile = null;
            document.getElementById('file-info').style.display = 'none';
            this.displayMultiFileList(validFiles, totalSize);
        }
        
        this.updateEncryptButtonState();
    }

    displayMultiFileList(files, totalSize) {
        const multiFileList = document.getElementById('multi-file-list');
        const fileItems = document.getElementById('file-items');
        const fileCount = document.getElementById('file-count');
        const totalSizeSpan = document.getElementById('total-size');
        
        // Update header
        fileCount.textContent = files.length;
        totalSizeSpan.textContent = this.formatFileSize(totalSize);
        
        // Clear existing items
        fileItems.innerHTML = '';
        
        // Add each file
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-item-info">
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="file-item-remove" data-index="${index}">×</button>
            `;
            
            // Add remove button handler
            const removeBtn = fileItem.querySelector('.file-item-remove');
            removeBtn.addEventListener('click', () => {
                this.removeFileFromSelection(index);
            });
            
            fileItems.appendChild(fileItem);
        });
        
        multiFileList.style.display = 'block';
    }

    removeFileFromSelection(index) {
        if (index >= 0 && index < this.selectedFiles.length) {
            this.selectedFiles.splice(index, 1);
            
            if (this.selectedFiles.length === 0) {
                this.clearSelectedFiles();
            } else {
                const totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
                this.displayMultiFileList(this.selectedFiles, totalSize);
            }
            
            this.updateEncryptButtonState();
        }
    }

    clearSelectedFiles() {
        this.selectedFiles = [];
        this.selectedFile = null;
        document.getElementById('file-info').style.display = 'none';
        document.getElementById('multi-file-list').style.display = 'none';
        this.updateEncryptButtonState();
    }

    handleImageSelection(file) {
        // Clear any previous errors
        this.clearErrors();
        
        // Validate the selected image
        const validationResult = this.validationEngine.validateImageForDecryption(file);
        
        if (!validationResult.isValid) {
            this.showError('decrypt', validationResult.userMessage);
            this.selectedImage = null;
            document.getElementById('image-info').style.display = 'none';
            this.updateDecryptButtonState();
            return;
        }
        
        // Display image information
        document.getElementById('image-name').textContent = file.name;
        document.getElementById('image-size').textContent = this.formatFileSize(file.size);
        document.getElementById('image-info').style.display = 'flex';
        
        this.selectedImage = file;
        this.updateDecryptButtonState();
    }

    updateEncryptButtonState() {
        const encryptBtn = document.getElementById('encrypt-btn');
        const password = document.getElementById('encrypt-password').value;
        const textInput = document.getElementById('text-input').value;
        
        let hasInput = false;
        if (this.currentInputType === 'file') {
            hasInput = this.selectedFile != null || this.selectedFiles.length > 0;
        } else {
            hasInput = textInput.trim().length > 0;
        }
        
        // Validate password
        const passwordValidation = this.validationEngine.validatePasswordWithDetails(password);
        const hasValidPassword = passwordValidation.isValid;
        
        encryptBtn.disabled = !(hasInput && hasValidPassword);
    }

    updateDecryptButtonState() {
        const decryptBtn = document.getElementById('decrypt-btn');
        const password = document.getElementById('decrypt-password').value;
        const base64Input = document.getElementById('base64-input').value;
        
        let hasValidInput = false;
        if (this.currentDecryptInputType === 'image') {
            hasValidInput = this.selectedImage != null;
        } else {
            // Validate Base64 input
            const base64Validation = this.validationEngine.validateBase64String(base64Input);
            hasValidInput = base64Validation.isValid;
        }
        
        // Validate password
        const passwordValidation = this.validationEngine.validatePasswordWithDetails(password);
        const hasValidPassword = passwordValidation.isValid;
        
        decryptBtn.disabled = !(hasValidInput && hasValidPassword);
    }

    validateBase64Input() {
        const base64Input = document.getElementById('base64-input');
        const base64Value = base64Input.value;
        
        // Clear any previous errors when input is empty
        if (base64Value.trim().length === 0) {
            this.clearErrors();
            return;
        }
        
        // Validate Base64 format
        const validationResult = this.validationEngine.validateBase64String(base64Value);
        
        if (!validationResult.isValid) {
            this.showError('decrypt', validationResult.userMessage);
        } else {
            this.clearErrors();
        }
    }

    async handleEncrypt() {
        const operationId = `encrypt_${Date.now()}`;
        this.currentOperations.add(operationId);
        
        try {
            this.clearErrors();
            this.hideOutput('encrypt');
            
            const password = document.getElementById('encrypt-password').value;
            
            // Enhanced progress callback with error handling
            const onProgress = (percent, phase) => {
                try {
                    this.showProgress('encrypt', percent, phase);
                } catch (progressError) {
                    const processedError = this.errorHandler.handleError(progressError, 'progress_reporting');
                    console.warn('Progress reporting error:', processedError.userMessage);
                }
            };
            
            let result;
            
            if (this.currentInputType === 'file') {
                // Handle multiple files or single file
                if (this.selectedFiles.length > 1) {
                    // Multiple files - create archive first
                    onProgress(5, 'Creating Archive');
                    const archiveResult = await this.fileArchiver.createArchive(this.selectedFiles);
                    
                    onProgress(15, 'Encrypting Archive');
                    const imageBlob = await this.fileProcessor.encryptFile(
                        new File([archiveResult.data], archiveResult.metadata.filename, {
                            type: archiveResult.metadata.mimeType
                        }), 
                        password, 
                        (percent, phase) => onProgress(15 + (percent * 0.85), phase)
                    );
                    
                    if (this.currentOutputFormat === 'image') {
                        result = { imageBlob };
                    } else {
                        const base64 = await this.blobToBase64(imageBlob);
                        result = { base64, imageBlob };
                    }
                } else if (this.selectedFile || this.selectedFiles.length === 1) {
                    // Single file
                    const fileToEncrypt = this.selectedFile || this.selectedFiles[0];
                    
                    // Pre-validate memory usage
                    const memoryValidation = this.validationEngine.validateMemoryUsage(fileToEncrypt.size);
                    if (!memoryValidation.isValid) {
                        throw new Error(memoryValidation.userMessage);
                    }
                    
                    const imageBlob = await this.fileProcessor.encryptFile(fileToEncrypt, password, onProgress);
                    
                    if (this.currentOutputFormat === 'image') {
                        result = { imageBlob };
                    } else {
                        const base64 = await this.blobToBase64(imageBlob);
                        result = { base64, imageBlob };
                    }
                } else {
                    throw new Error('No file selected');
                }
            } else {
                // Encrypt text
                const textInput = document.getElementById('text-input').value;
                if (!textInput.trim()) {
                    throw new Error('No text entered');
                }
                
                result = await this.fileProcessor.encryptText(textInput, password, onProgress);
            }
            
            // Store result and show output
            this.encryptionResult = result;
            this.showEncryptionOutput(result);
            this.showSuccessMessage('encrypt', 'File encrypted successfully!');
            
        } catch (error) {
            const processedError = this.errorHandler.handleError(error, 'encryption', {
                inputType: this.currentInputType,
                outputFormat: this.currentOutputFormat,
                fileSize: this.selectedFile?.size,
                operationId
            });
            
            this.showEnhancedError('encrypt', processedError);
        } finally {
            this.currentOperations.delete(operationId);
            // Perform cleanup after operation
            this.performOperationCleanup();
        }
    }

    async handleDecrypt() {
        const operationId = `decrypt_${Date.now()}`;
        this.currentOperations.add(operationId);
        
        try {
            this.clearErrors();
            this.hideOutput('decrypt');
            
            const password = document.getElementById('decrypt-password').value;
            
            // Enhanced progress callback with error handling
            const onProgress = (percent, phase) => {
                try {
                    this.showProgress('decrypt', percent, phase);
                } catch (progressError) {
                    const processedError = this.errorHandler.handleError(progressError, 'progress_reporting');
                    console.warn('Progress reporting error:', processedError.userMessage);
                }
            };
            
            let result;
            
            if (this.currentDecryptInputType === 'image') {
                // Decrypt from image
                if (!this.selectedImage) {
                    throw new Error('No image selected');
                }
                
                result = await this.fileProcessor.decryptFile(this.selectedImage, password, onProgress);
            } else {
                // Decrypt from Base64
                const base64Input = document.getElementById('base64-input').value;
                if (!base64Input.trim()) {
                    throw new Error('No Base64 data entered');
                }
                
                result = await this.fileProcessor.decryptBase64(base64Input.trim(), password, onProgress);
            }
            
            // Show decryption output
            this.showDecryptionOutput(result);
            this.showSuccessMessage('decrypt', 'File decrypted successfully!');
            
        } catch (error) {
            const processedError = this.errorHandler.handleError(error, 'decryption', {
                inputType: this.currentDecryptInputType,
                imageSize: this.selectedImage?.size,
                operationId
            });
            
            this.showEnhancedError('decrypt', processedError);
        } finally {
            this.currentOperations.delete(operationId);
            // Perform cleanup after operation
            this.performOperationCleanup();
        }
    }

    async simulateProgress(type) {
        // Simulate progress for demonstration purposes
        const phases = ['Processing...', 'Converting...', 'Finalizing...'];
        
        for (let i = 0; i < phases.length; i++) {
            const progress = ((i + 1) / phases.length) * 100;
            this.showProgress(type, progress, phases[i]);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    showProgress(type, percent, phase) {
        const progressContainer = document.getElementById(`${type}-progress`);
        const progressFill = document.getElementById(`${type}-progress-fill`);
        const progressText = document.getElementById(`${type}-progress-text`);
        
        progressContainer.style.display = 'block';
        progressFill.style.width = `${percent}%`;
        progressText.textContent = phase;
        
        if (percent < 100) {
            progressFill.classList.add('loading');
        } else {
            progressFill.classList.remove('loading');
        }
    }

    hideProgress(type) {
        const progressContainer = document.getElementById(`${type}-progress`);
        progressContainer.style.display = 'none';
    }

    showSuccess(type, message) {
        this.hideProgress(type);
        // TODO: Show success message and results
        console.log(`${type} success:`, message);
    }

    showError(type, message) {
        this.hideProgress(type);
        const errorDisplay = document.getElementById(`${type}-error`);
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    }

    clearErrors() {
        document.querySelectorAll('.error-display').forEach(error => {
            error.style.display = 'none';
        });
    }

    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        try {
            await navigator.clipboard.writeText(element.value);
            // TODO: Show success feedback
        } catch (error) {
            // Fallback for older browsers
            element.select();
            document.execCommand('copy');
        }
    }

    async pasteFromClipboard(elementId) {
        const element = document.getElementById(elementId);
        try {
            const text = await navigator.clipboard.readText();
            element.value = text;
            this.updateDecryptButtonState();
        } catch (error) {
            // TODO: Show error message
            console.error('Failed to paste from clipboard:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
            reader.readAsDataURL(blob);
        });
    }

    hideOutput(type) {
        const outputArea = document.getElementById(`${type}-output`);
        outputArea.style.display = 'none';
    }

    showEncryptionOutput(result) {
        this.hideProgress('encrypt');
        const outputArea = document.getElementById('encrypt-output');
        const imageOutput = document.getElementById('image-output');
        const base64Output = document.getElementById('base64-output');
        
        // Show appropriate output based on format selection
        if (this.currentOutputFormat === 'image') {
            // Show image download option
            imageOutput.style.display = 'block';
            base64Output.style.display = 'none';
            
            if (result.imageBlob) {
                this.setupImageDownload(result.imageBlob);
            }
        } else {
            // Show Base64 text output
            imageOutput.style.display = 'none';
            base64Output.style.display = 'block';
            
            if (result.base64) {
                document.getElementById('base64-text').value = result.base64;
            }
        }
        
        outputArea.style.display = 'block';
    }

    showDecryptionOutput(result) {
        this.hideProgress('decrypt');
        const outputArea = document.getElementById('decrypt-output');
        const textOutput = document.getElementById('text-output');
        const fileOutput = document.getElementById('file-output');
        
        // Check if this is an archive file
        const isArchive = result.metadata && result.metadata.mimeType === 'application/x-file-archive';
        
        if (isArchive) {
            // Handle multi-file archive
            this.handleArchiveDecryption(result);
        } else {
            // Determine if result is text or file based on metadata
            const isTextContent = result.metadata && result.metadata.mimeType === 'text/plain';
            
            if (isTextContent) {
                // Show text output
                textOutput.style.display = 'block';
                fileOutput.style.display = 'none';
                
                const textData = new TextDecoder().decode(result.data);
                document.getElementById('decrypted-text').value = textData;
            } else {
                // Show file download option
                textOutput.style.display = 'none';
                fileOutput.style.display = 'block';
                
                document.getElementById('restored-file-name').textContent = result.filename || result.metadata?.filename || 'decrypted_file';
                document.getElementById('restored-file-size').textContent = this.formatFileSize(result.data.byteLength);
                
                this.setupFileDownload(result.data, result.filename || result.metadata?.filename || 'decrypted_file', result.mimeType || result.metadata?.mimeType);
            }
        }
        
        outputArea.style.display = 'block';
    }

    async handleArchiveDecryption(result) {
        try {
            // Extract files from archive
            const extractedFiles = await this.fileArchiver.extractArchive(result.data);
            
            // Hide single file output and show multi-file output
            document.getElementById('text-output').style.display = 'none';
            document.getElementById('file-output').style.display = 'none';
            
            // Create or update multi-file output section
            this.showMultiFileOutput(extractedFiles);
            
        } catch (error) {
            console.error('Failed to extract archive:', error);
            this.showError('decrypt', 'Failed to extract files from archive: ' + error.message);
        }
    }

    showMultiFileOutput(extractedFiles) {
        const outputArea = document.getElementById('decrypt-output');
        
        // Remove existing multi-file output if it exists
        const existingMultiOutput = document.getElementById('multi-file-output');
        if (existingMultiOutput) {
            existingMultiOutput.remove();
        }
        
        // Create multi-file output section
        const multiFileOutput = document.createElement('div');
        multiFileOutput.id = 'multi-file-output';
        multiFileOutput.className = 'output-section';
        multiFileOutput.innerHTML = `
            <h3>Decrypted Files (${extractedFiles.length})</h3>
            <div class="multi-file-downloads" id="multi-file-downloads"></div>
            <button id="download-all-btn" class="download-btn">Download All as ZIP</button>
        `;
        
        // Add to output area
        outputArea.appendChild(multiFileOutput);
        
        // Populate individual file download buttons
        const downloadsContainer = document.getElementById('multi-file-downloads');
        
        extractedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-download-item';
            fileItem.innerHTML = `
                <div class="file-download-info">
                    <div class="file-download-name">${file.name}</div>
                    <div class="file-download-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="download-btn file-download-btn" data-index="${index}">Download</button>
            `;
            
            // Add download handler for individual file
            const downloadBtn = fileItem.querySelector('.file-download-btn');
            downloadBtn.addEventListener('click', () => {
                this.downloadIndividualFile(file);
            });
            
            downloadsContainer.appendChild(fileItem);
        });
        
        // Add download all handler
        document.getElementById('download-all-btn').addEventListener('click', () => {
            this.downloadAllFiles(extractedFiles);
        });
    }

    downloadIndividualFile(file) {
        const blob = new Blob([file.data], { type: file.type || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async downloadAllFiles(extractedFiles) {
        try {
            // Create a simple ZIP-like structure for download
            // For now, we'll download files individually with a delay
            for (let i = 0; i < extractedFiles.length; i++) {
                setTimeout(() => {
                    this.downloadIndividualFile(extractedFiles[i]);
                }, i * 500); // 500ms delay between downloads
            }
        } catch (error) {
            console.error('Failed to download all files:', error);
            this.showError('decrypt', 'Failed to download all files: ' + error.message);
        }
    }

    setupImageDownload(imageBlob) {
        const downloadBtn = document.getElementById('download-image-btn');
        
        // Remove any existing event listeners
        const newBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
        
        newBtn.addEventListener('click', () => {
            const url = URL.createObjectURL(imageBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `encrypted_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    setupFileDownload(arrayBuffer, filename, mimeType) {
        const downloadBtn = document.getElementById('download-file-btn');
        
        // Remove any existing event listeners
        const newBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
        
        newBtn.addEventListener('click', () => {
            const blob = new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Show enhanced error with recovery options
     * @param {string} type - Operation type ('encrypt' or 'decrypt')
     * @param {ProcessedError} processedError - Processed error with recovery options
     */
    showEnhancedError(type, processedError) {
        this.hideProgress(type);
        
        const errorDisplay = document.getElementById(`${type}-error`);
        
        // Create enhanced error display with recovery options
        let errorHtml = `
            <div class="error-content">
                <div class="error-message">${processedError.userMessage}</div>
        `;
        
        // Add recovery suggestions if available
        if (processedError.recovery && processedError.recovery.canRecover) {
            errorHtml += `
                <div class="error-recovery">
                    <h4>What you can try:</h4>
                    <ul>
            `;
            
            processedError.recovery.suggestions.forEach(suggestion => {
                errorHtml += `<li>${suggestion}</li>`;
            });
            
            errorHtml += `
                    </ul>
                </div>
            `;
            
            // Add retry button for recoverable errors
            if (processedError.recovery.strategy === 'retry_password' || 
                processedError.recovery.strategy === 'reupload_file') {
                errorHtml += `
                    <div class="error-actions">
                        <button class="retry-btn" onclick="window.app.retryOperation('${type}')">Try Again</button>
                    </div>
                `;
            }
        }
        
        // Add error ID for debugging
        if (this.errorHandler.debugMode) {
            errorHtml += `<div class="error-id">Error ID: ${processedError.id}</div>`;
        }
        
        errorHtml += `</div>`;
        
        errorDisplay.innerHTML = errorHtml;
        errorDisplay.style.display = 'block';
        
        // Auto-hide non-critical errors after 10 seconds
        if (processedError.severity === 'low' || processedError.severity === 'medium') {
            setTimeout(() => {
                if (errorDisplay.style.display === 'block') {
                    this.fadeOutError(errorDisplay);
                }
            }, 10000);
        }
    }

    /**
     * Show success message with fade out
     * @param {string} type - Operation type
     * @param {string} message - Success message
     */
    showSuccessMessage(type, message) {
        this.hideProgress(type);
        
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        // Insert after the action button
        const actionBtn = document.getElementById(`${type}-btn`);
        actionBtn.parentNode.insertBefore(successDiv, actionBtn.nextSibling);
        
        // Fade out after 3 seconds
        setTimeout(() => {
            this.fadeOutError(successDiv);
        }, 3000);
    }

    /**
     * Fade out error or success message
     * @param {HTMLElement} element - Element to fade out
     */
    fadeOutError(element) {
        element.style.transition = 'opacity 0.5s ease-out';
        element.style.opacity = '0';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 500);
    }

    /**
     * Retry operation after error
     * @param {string} type - Operation type to retry
     */
    retryOperation(type) {
        this.clearErrors();
        
        if (type === 'encrypt') {
            this.handleEncrypt();
        } else if (type === 'decrypt') {
            this.handleDecrypt();
        }
    }

    /**
     * Perform cleanup after operations
     */
    performOperationCleanup() {
        try {
            // Clear sensitive data from memory
            this.securityManager.performSecureCleanup();
            
            // Clear any temporary variables
            if (this.encryptionResult && this.encryptionResult.base64) {
                // Don't clear the result as user might need it, but log cleanup
                console.log('Operation cleanup performed');
            }
            
            // Force garbage collection if available (development only)
            if (this.errorHandler.debugMode && window.gc) {
                window.gc();
            }
        } catch (cleanupError) {
            const processedError = this.errorHandler.handleError(cleanupError, 'cleanup');
            console.warn('Cleanup error:', processedError.userMessage);
        }
    }

    /**
     * Enhanced clipboard operations with error handling
     */
    async copyToClipboard(elementId) {
        try {
            const element = document.getElementById(elementId);
            await navigator.clipboard.writeText(element.value);
            
            // Show success feedback
            this.showTemporaryMessage(element, 'Copied to clipboard!', 'success');
        } catch (error) {
            const processedError = this.errorHandler.handleError(error, 'clipboard_copy');
            
            // Fallback for older browsers
            try {
                const element = document.getElementById(elementId);
                element.select();
                document.execCommand('copy');
                this.showTemporaryMessage(element, 'Copied to clipboard!', 'success');
            } catch (fallbackError) {
                this.showTemporaryMessage(element, 'Failed to copy to clipboard', 'error');
            }
        }
    }

    async pasteFromClipboard(elementId) {
        try {
            const element = document.getElementById(elementId);
            const text = await navigator.clipboard.readText();
            element.value = text;
            this.updateDecryptButtonState();
            
            // Show success feedback
            this.showTemporaryMessage(element, 'Pasted from clipboard!', 'success');
        } catch (error) {
            const processedError = this.errorHandler.handleError(error, 'clipboard_paste');
            const element = document.getElementById(elementId);
            this.showTemporaryMessage(element, 'Failed to paste from clipboard', 'error');
        }
    }

    /**
     * Show temporary message near an element
     * @param {HTMLElement} element - Element to show message near
     * @param {string} message - Message to show
     * @param {string} type - Message type ('success' or 'error')
     */
    showTemporaryMessage(element, message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message ${type}`;
        messageDiv.textContent = message;
        
        // Position near the element
        element.parentNode.insertBefore(messageDiv, element.nextSibling);
        
        // Remove after 2 seconds
        setTimeout(() => {
            this.fadeOutError(messageDiv);
        }, 2000);
    }

    /**
     * Enhanced progress reporting with time estimates
     * @param {string} type - Operation type
     * @param {number} percent - Progress percentage
     * @param {string} phase - Current phase
     */
    showProgress(type, percent, phase) {
        const progressContainer = document.getElementById(`${type}-progress`);
        const progressFill = document.getElementById(`${type}-progress-fill`);
        const progressText = document.getElementById(`${type}-progress-text`);
        
        if (!progressContainer || !progressFill || !progressText) {
            console.warn('Progress elements not found');
            return;
        }
        
        progressContainer.style.display = 'block';
        progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        
        // Enhanced progress text with phase and percentage
        let displayText = phase;
        if (percent > 0 && percent < 100) {
            displayText += ` (${Math.round(percent)}%)`;
        }
        
        // Add time estimate for large operations
        if (this.selectedFile && this.selectedFile.size > 10 * 1024 * 1024) { // > 10MB
            const estimatedTime = this.fileProcessor.estimateProcessingTime?.(this.selectedFile.size);
            if (estimatedTime && percent > 10 && percent < 90) {
                const remainingTime = Math.round((estimatedTime * (100 - percent)) / 100);
                if (remainingTime > 0) {
                    displayText += ` - ~${remainingTime}s remaining`;
                }
            }
        }
        
        progressText.textContent = displayText;
        
        if (percent < 100) {
            progressFill.classList.add('loading');
        } else {
            progressFill.classList.remove('loading');
        }
    }

    /**
     * Get error statistics for debugging
     */
    getErrorStatistics() {
        return this.errorHandler.getErrorStatistics();
    }

    /**
     * Export error log for debugging
     */
    exportErrorLog() {
        const errorLog = this.errorHandler.exportErrorLog();
        const blob = new Blob([errorLog], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Enable debug mode for detailed error logging
     */
    enableDebugMode() {
        this.errorHandler.setDebugMode(true);
        console.log('Debug mode enabled. Error details will be logged to console.');
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.errorHandler.setDebugMode(false);
        console.log('Debug mode disabled.');
    }
}

// Application class is now initialized from the HTML module script