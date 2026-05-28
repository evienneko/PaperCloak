// PaperCloak Application JavaScript
class PaperCloak {
    constructor() {
        this.pdfText = '';
        this.currentConfig = {};
        this.currentPaperHtml = '';
        console.log('PaperCloak initialized');
        this.initializeApp();
    }

    initializeApp() {
        try {
            this.setupPdfJs();
            this.setupEventListeners();
            this.setupTabNavigation();
            this.addDemoButton();
            this.loadHistory();
            console.log('App initialization complete');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    setupPdfJs() {
        // Set PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = button.getAttribute('data-tab');
                
                console.log('Tab clicked:', tabName); // Debug log
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetTab = document.getElementById(`${tabName}-tab`);
                if (targetTab) {
                    targetTab.classList.add('active');
                    targetTab.style.display = 'block';
                }

                // Load history if history tab is selected
                if (tabName === 'history') {
                    this.loadHistory();
                }
            });
        });
    }

    addDemoButton() {
        try {
            const uploadArea = document.getElementById('upload-area');
            if (!uploadArea) {
                console.error('Upload area not found');
                return;
            }

            // Check if demo button already exists
            if (uploadArea.querySelector('.demo-button')) {
                return;
            }

            const demoButton = document.createElement('button');
            demoButton.className = 'btn btn--outline demo-button';
            demoButton.textContent = 'Upload PDF';
            demoButton.style.marginTop = '16px';

            // Use arrow function to preserve 'this' context
            demoButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Demo button clicked');
                this.loadDemoContent();
            };

            uploadArea.appendChild(demoButton);
            console.log('Demo button added successfully');
        } catch (error) {
            console.error('Error adding demo button:', error);
        }
    }

    loadDemoContent() {
        try {
            console.log('Loading demo content...');
            this.pdfText = `Chapter 1: Introduction
This is a sample document that demonstrates the PaperCloak transformation process. The content you see here represents typical text that might be extracted from a PDF document. The methodology employed in this analysis follows established research protocols while incorporating innovative approaches to data interpretation and statistical analysis.

Chapter 2: Background and Literature Review
Previous studies have established foundational knowledge in this area of research. The theoretical framework builds upon existing paradigms while identifying opportunities for methodological enhancement. Furthermore, contemporary research has highlighted the importance of comprehensive data collection procedures and rigorous experimental design protocols.

Chapter 3: Methodology and Data Collection
The experimental approach utilized advanced statistical techniques to ensure validity and reliability of results. Data collection procedures were implemented according to established guidelines and best practices. Moreover, quality control measures were maintained throughout the research process to ensure data integrity and analytical accuracy.

Chapter 4: Results and Analysis
The findings reveal significant correlations between key variables, with statistical significance confirmed through comprehensive analytical procedures. Observable patterns emerged that support the primary research hypotheses. In addition, comparative analysis demonstrated clear trends that align with theoretical predictions and contribute to our understanding of the underlying phenomena.

Chapter 5: Discussion and Future Directions
These results have important implications for both theoretical advancement and practical applications. The study contributes to existing knowledge while identifying areas for continued investigation and methodological refinement.`;

            console.log('Demo content loaded, showing config section');
            this.showConfigSection();
        } catch (error) {
            console.error('Error loading demo content:', error);
            alert('Error loading demo content. Please refresh the page and try again.');
        }
    }

    setupEventListeners() {
        try {
            console.log('Setting up event listeners...');

            // App logo click handler - redirect to home
            const appLogo = document.getElementById('app-logo');
            if (appLogo) {
                appLogo.addEventListener('click', () => this.goToHome());
            }

            // File input change handler
            const pdfInput = document.getElementById('pdf-input');
            if (pdfInput) {
                pdfInput.onchange = (e) => this.handleFileSelect(e);
            }

            // Upload area click handler (excluding demo button)
            const uploadArea = document.getElementById('upload-area');
            if (uploadArea) {
                uploadArea.onclick = (e) => {
                    // Don't trigger file input if clicking on demo button
                    if (!e.target.classList.contains('demo-button') && !e.target.closest('.demo-button')) {
                        this.triggerFileInput();
                    }
                };

                // Drag and drop handlers
                uploadArea.ondragover = (e) => this.handleDragOver(e);
                uploadArea.ondragleave = (e) => this.handleDragLeave(e);
                uploadArea.ondrop = (e) => this.handleDrop(e);
            }

            // Transform button
            const transformBtn = document.getElementById('transform-btn');
            if (transformBtn) {
                transformBtn.onclick = () => this.transformToPaper();
            }

            // Control buttons
            const newUploadBtn = document.getElementById('new-upload-btn');
            if (newUploadBtn) {
                newUploadBtn.onclick = () => this.resetApp();
            }

            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn) {
                downloadBtn.onclick = () => this.downloadPaper();
            }

            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                copyBtn.onclick = () => this.copyPaper();
            }

            // New PDF download button
            const downloadPdfBtn = document.getElementById('download-pdf-btn');
            if (downloadPdfBtn) {
                downloadPdfBtn.onclick = () => this.downloadPaperAsPdf();
            }

            // History controls
            const clearHistoryBtn = document.getElementById('clear-history-btn');
            if (clearHistoryBtn) {
                clearHistoryBtn.onclick = () => this.clearHistory();
            }

            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    // New method to handle going to home
    goToHome() {
        try {
            console.log('Going to home...');
            
            // Reset the app to initial state
            this.resetApp();
            
            // Make sure Transform tab is active
            const transformTab = document.querySelector('[data-tab="transform"]');
            const historyTab = document.querySelector('[data-tab="history"]');
            
            if (transformTab && historyTab) {
                // Remove active from history tab
                historyTab.classList.remove('active');
                document.getElementById('history-tab').style.display = 'none';
                document.getElementById('history-tab').classList.remove('active');
                
                // Activate transform tab
                transformTab.classList.add('active');
                document.getElementById('transform-tab').style.display = 'block';
                document.getElementById('transform-tab').classList.add('active');
            }
            
        } catch (error) {
            console.error('Error going to home:', error);
        }
    }

    triggerFileInput() {
        try {
            console.log('Triggering file input...');
            const pdfInput = document.getElementById('pdf-input');
            if (pdfInput) {
                pdfInput.click();
                console.log('File input clicked');
            } else {
                console.error('PDF input not found');
            }
        } catch (error) {
            console.error('Error triggering file input:', error);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.add('dragover');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('dragover');
        }

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        console.log('File selected');
        const file = e.target.files[0];
        if (file) {
            console.log('Processing file:', file.name);
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            return;
        }

        try {
            this.showProgress();
            await this.extractPdfText(file);
            this.showConfigSection();
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF. Please try the demo instead.');
            this.resetProgress();
        }
    }

    showProgress() {
        try {
            console.log('Showing progress...');
            document.getElementById('upload-section').style.display = 'none';
            const progressSection = document.getElementById('upload-progress');
            if (progressSection) {
                progressSection.style.display = 'block';
            }

            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');

            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (progressFill) {
                    progressFill.style.width = progress + '%';
                }
                if (progressText) {
                    if (progress === 30) progressText.textContent = 'Extracting text...';
                    else if (progress === 60) progressText.textContent = 'Processing content...';
                    else if (progress === 90) progressText.textContent = 'Almost done...';
                }

                if (progress >= 100) {
                    clearInterval(interval);
                    if (progressText) {
                        progressText.textContent = 'Complete!';
                    }
                    setTimeout(() => {
                        this.showConfigSection();
                    }, 500);
                }
            }, 200);
        } catch (error) {
            console.error('Error showing progress:', error);
        }
    }

    resetProgress() {
        document.getElementById('upload-section').style.display = 'block';
        document.getElementById('upload-progress').style.display = 'none';
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = 'Uploading...';
    }

    async extractPdfText(file) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js not loaded');
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        this.pdfText = fullText.trim();
    }

    showConfigSection() {
        try {
            console.log('Showing config section...');
            // Hide other sections
            const sections = ['upload-progress', 'upload-section', 'processing-section', 'preview-section'];
            sections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.style.display = 'none';
                }
            });

            // Show config section
            const configSection = document.getElementById('config-section');
            if (configSection) {
                configSection.style.display = 'block';
                console.log('Config section displayed');
            } else {
                console.error('Config section not found');
            }
        } catch (error) {
            console.error('Error showing config section:', error);
        }
    }

    async transformToPaper() {
        try {
            console.log('Transforming to paper...');

            // Validate that we have content
            if (!this.pdfText.trim()) {
                alert('No content available. Please upload a PDF or try the demo.');
                return;
            }

            this.showProcessing();

            // Get configuration
            this.currentConfig = {
                title: document.getElementById('paper-title').value.trim(),
                authors: document.getElementById('author-names').value.trim(),
                field: document.getElementById('research-field').value,
                layout: document.querySelector('input[name="layout"]:checked').value
            };

            console.log('Current config:', this.currentConfig);

            // Simulate processing time
            await this.sleep(3000);

            const paperHtml = this.generateAcademicPaper();
            this.currentPaperHtml = paperHtml;
            this.showPreview(paperHtml);
            
            // Save to history
            this.saveToHistory();

        } catch (error) {
            console.error('Error transforming to paper:', error);
            alert('Error generating paper. Please try again.');
        }
    }

    saveToHistory() {
        try {
            const historyItem = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                title: this.currentConfig.title || 'Untitled Paper',
                field: this.currentConfig.field,
                layout: this.currentConfig.layout,
                html: this.currentPaperHtml
            };

            let history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            history.unshift(historyItem); // Add to beginning
            
            // Keep only last 50 items
            history = history.slice(0, 50);
            
            localStorage.setItem('paperCloak_history', JSON.stringify(history));
            this.loadHistory();
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    }

    loadHistory() {
        try {
            const historyList = document.getElementById('history-list');
            if (!historyList) return;

            const history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            
            if (history.length === 0) {
                historyList.innerHTML = `
                    <div class="history-empty">
                        <div class="empty-icon">📄</div>
                        <h4>No conversions yet</h4>
                        <p>Transform your first PDF to see it here!</p>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = history.map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-item-header">
                        <h4>${item.title}</h4>
                        <span class="history-date">${item.date} ${item.time}</span>
                    </div>
                    <div class="history-item-details">
                        <span class="history-field">${item.field}</span>
                        <span class="history-layout">${item.layout} column</span>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn btn--sm btn--outline view-history-btn">👁️ View</button>
                        <button class="btn btn--sm btn--outline download-history-pdf-btn">📄 PDF</button>
                        <button class="btn btn--sm btn--outline delete-history-btn">🗑️ Delete</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners to history items
            historyList.querySelectorAll('.view-history-btn').forEach((btn, index) => {
                btn.addEventListener('click', () => this.viewHistoryItem(history[index]));
            });

            historyList.querySelectorAll('.download-history-pdf-btn').forEach((btn, index) => {
                btn.addEventListener('click', () => this.downloadHistoryItemAsPdf(history[index]));
            });

            historyList.querySelectorAll('.delete-history-btn').forEach((btn, index) => {
                btn.addEventListener('click', () => this.deleteHistoryItem(history[index].id));
            });

        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    viewHistoryItem(item) {
        // Switch to transform tab and show the paper
        document.querySelector('[data-tab="transform"]').click();
        this.currentPaperHtml = item.html;
        this.showPreview(item.html);
    }

    downloadHistoryItemAsPdf(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.html;
        this.printToPdf(tempDiv, item.title);
    }

    deleteHistoryItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                let history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
                history = history.filter(item => item.id !== id);
                localStorage.setItem('paperCloak_history', JSON.stringify(history));
                this.loadHistory();
            } catch (error) {
                console.error('Error deleting history item:', error);
            }
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            localStorage.removeItem('paperCloak_history');
            this.loadHistory();
        }
    }

    downloadPaperAsPdf() {
        if (!this.currentPaperHtml) {
            alert('No paper available to download.');
            return;
        }

        const title = this.currentConfig.title || 'Academic Paper';
        const paperElement = document.getElementById('paper-preview');
        this.printToPdf(paperElement, title);
    }

    printToPdf(element, filename = 'Academic Paper') {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Get the paper content
        const content = element.innerHTML || element.outerHTML;
        
        // Create the print document
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        line-height: 1.6;
                        color: #000;
                        background-color: #fff;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .academic-paper {
                        font-family: 'Times New Roman', Times, serif;
                        line-height: 1.6;
                        color: #000 !important;
                        background-color: #fff;
                        padding: 0;
                        margin: 0;
                        max-width: none;
                        min-height: auto;
                    }
                    
                    .academic-paper.two-column .paper-content {
                        column-count: 2;
                        column-gap: 20px;
                        column-rule: none;
                    }
                    
                    .academic-paper.two-column .paper-title,
                    .academic-paper.two-column .paper-authors,
                    .academic-paper.two-column .paper-abstract,
                    .academic-paper.two-column .paper-keywords {
                        column-span: all;
                        margin-bottom: 20px;
                    }
                    
                    .paper-title {
                        font-size: 18px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 20px;
                        line-height: 1.4;
                        color: #000 !important;
                    }
                    
                    .paper-authors {
                        text-align: center;
                        font-size: 12px;
                        margin-bottom: 5px;
                        color: #000 !important;
                    }
                    
                    .paper-institution {
                        text-align: center;
                        font-size: 10px;
                        font-style: italic;
                        margin-bottom: 30px;
                        color: #666 !important;
                    }
                    
                    .section-header {
                        font-size: 12px;
                        font-weight: bold;
                        margin: 20px 0 10px 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #000 !important;
                        break-after: avoid;
                    }
                    
                    .section-content,
                    .section-content p {
                        font-size: 11px;
                        text-align: justify;
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #000 !important;
                    }
                    
                    .paper-abstract h3 {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #000 !important;
                    }
                    
                    .paper-abstract p {
                        font-size: 10px;
                        text-align: justify;
                        margin-bottom: 0;
                        color: #000 !important;
                    }
                    
                    .paper-keywords {
                        margin-bottom: 25px;
                        font-size: 10px;
                        color: #000 !important;
                    }
                    
                    .references h3 {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #000 !important;
                    }
                    
                    .reference-item {
                        font-size: 10px;
                        margin-bottom: 8px;
                        text-align: justify;
                        text-indent: -20px;
                        padding-left: 20px;
                        color: #000 !important;
                    }
                    
                    * {
                        color: #000 !important;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    }

    showProcessing() {
        try {
            console.log('Showing processing...');
            document.getElementById('config-section').style.display = 'none';
            document.getElementById('processing-section').style.display = 'block';

            const statusMessages = [
                'Extracting text content...',
                'Generating academic structure...',
                'Creating references...',
                'Formatting document...',
                'Finalizing paper...'
            ];

            let messageIndex = 0;
            const statusElement = document.getElementById('processing-status');

            const interval = setInterval(() => {
                if (messageIndex < statusMessages.length && statusElement) {
                    statusElement.textContent = statusMessages[messageIndex];
                    messageIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 600);
        } catch (error) {
            console.error('Error showing processing:', error);
        }
    }

    generateAcademicPaper() {
        try {
            console.log('Generating academic paper...');

            const data = this.getApplicationData();
            const title = this.currentConfig.title || this.generateTitle();
            const authors = this.currentConfig.authors || this.generateAuthors(data);
            const institution = this.generateInstitution(data);
            const abstract = this.generateAbstract();
            const keywords = this.generateKeywords();
            const references = this.generateReferences(data);
            const sections = this.distributePdfContent();
            const layoutClass = this.currentConfig.layout === 'double' ? 'two-column' : 'single-column';

            const paperHtml = `
                <div class="academic-paper ${layoutClass}">
                    <div class="paper-title">${title}</div>
                    <div class="paper-authors">${authors}</div>
                    <div class="paper-institution">${institution}</div>
                    
                    <div class="paper-abstract">
                        <h3>Abstract</h3>
                        <p>${abstract}</p>
                    </div>
                    
                    <div class="paper-keywords">
                        <strong>Keywords:</strong> ${keywords}
                    </div>
                    
                    <div class="paper-content">
                        <div class="section-header">1. Introduction</div>
                        <div class="section-content">${sections.introduction}</div>
                        
                        <div class="section-header">2. Methods</div>
                        <div class="section-content">${sections.methods}</div>
                        
                        <div class="section-header">3. Results</div>
                        <div class="section-content">${sections.results}</div>
                        
                        <div class="section-header">4. Discussion</div>
                        <div class="section-content">${sections.discussion}</div>
                        
                        <div class="section-header">5. Conclusion</div>
                        <div class="section-content">${sections.conclusion}</div>
                        
                        <div class="section-header">Acknowledgments</div>
                        <div class="section-content">
                            <p>The authors would like to thank the research team and institutional support that made this study possible. We also acknowledge the valuable contributions of our colleagues and the technical staff who assisted in data collection and analysis.</p>
                        </div>
                        
                        <div class="references">
                            <h3>References</h3>
                            ${references.map(ref => `<div class="reference-item">${ref}</div>`).join('')}
                        </div>
                    </div>
                </div>
            `;

            return paperHtml;
        } catch (error) {
            console.error('Error generating paper:', error);
            return '<div class="academic-paper"><p>Error generating paper content.</p></div>';
        }
    }

    distributePdfContent() {
        const paragraphs = this.pdfText.split(/\n\s*\n/).filter(p => p.trim().length > 20);
        const totalParagraphs = paragraphs.length;

        if (totalParagraphs === 0) {
            return this.generateDefaultSections();
        }

        // Distribute content across sections
        const sectionsCount = 5; // intro, methods, results, discussion, conclusion
        const paragraphsPerSection = Math.ceil(totalParagraphs / sectionsCount);

        const sections = {
            introduction: this.formatSectionContent(paragraphs.slice(0, paragraphsPerSection)),
            methods: this.formatSectionContent(paragraphs.slice(paragraphsPerSection, paragraphsPerSection * 2)),
            results: this.formatSectionContent(paragraphs.slice(paragraphsPerSection * 2, paragraphsPerSection * 3)),
            discussion: this.formatSectionContent(paragraphs.slice(paragraphsPerSection * 3, paragraphsPerSection * 4)),
            conclusion: this.formatSectionContent(paragraphs.slice(paragraphsPerSection * 4))
        };

        // Ensure each section has content
        Object.keys(sections).forEach(key => {
            if (!sections[key] || sections[key].length < 50) {
                sections[key] = this.generateDefaultSectionContent(key);
            }
        });

        return sections;
    }

    formatSectionContent(paragraphs) {
        if (!paragraphs || paragraphs.length === 0) return '';
        
        return paragraphs
            .map(p => `<p>${this.preserveFormatting(p.trim())}</p>`)
            .join('');
    }

    preserveFormatting(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>');
    }

    generateDefaultSections() {
        const data = this.getApplicationData();
        const phrases = data.academic_phrases;

        const templates = {
            introduction: `<p>This study examines important aspects within the field of ${this.currentConfig.field}. ${phrases[0]}, current research has identified several key areas requiring further investigation. The primary objective of this research is to contribute to our understanding of these complex phenomena.</p><p>${phrases[1]}, the methodology employed in this study builds upon established frameworks while incorporating novel approaches to data analysis.</p>`,
            
            methods: `<p>The experimental design incorporated ${data.method_terms[0]} with careful attention to ${data.method_terms[2]}. Data collection procedures followed established protocols for ${data.method_terms[1]}. ${phrases[2]}, ${data.method_terms[3]} was implemented according to standard guidelines.</p><p>Statistical analysis was conducted using appropriate software packages, with ${data.method_terms[5]} maintained throughout the experimental process.</p>`,
            
            results: `<p>The analysis revealed ${data.result_terms[0]} between key variables (p &lt; 0.05). ${data.result_terms[1]} indicate ${data.result_terms[2]} consistent with theoretical predictions. ${phrases[3]}, ${data.result_terms[3]} was established through comprehensive statistical evaluation.</p><p>${data.result_terms[4]} demonstrated clear trends supporting the primary hypothesis of this investigation.</p>`,
            
            discussion: `<p>These findings contribute significantly to our understanding of the subject matter. ${phrases[4]}, the results align with previous research while revealing novel insights. The implications of these discoveries extend beyond the immediate scope of this study.</p><p>${phrases[5]}, limitations of the current methodology should be acknowledged, and future research directions are suggested to address these considerations.</p>`,
            
            conclusion: `<p>In conclusion, this research provides valuable evidence supporting the main hypotheses. The findings have practical implications for future work in ${this.currentConfig.field}. ${phrases[6]}, continued investigation in this area will enhance our theoretical understanding and practical applications.</p>`
        };

        return templates;
    }

    generateDefaultSectionContent(sectionType) {
        const templates = this.generateDefaultSections();
        return templates[sectionType] || '<p>Content analysis and interpretation will be presented in this section.</p>';
    }

    generateTitle() {
        const field = this.currentConfig.field;
        const titleTemplates = [
            `Advanced Studies in ${field}: A Comprehensive Analysis`,
            `Investigating Key Phenomena in ${field} Research`,
            `Novel Approaches to ${field}: Methodology and Applications`,
            `Contemporary Perspectives on ${field} Theory and Practice`,
            `Analytical Framework for ${field} Research Development`
        ];
        return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    }

    generateAuthors(data) {
        if (this.currentConfig.authors) {
            return this.currentConfig.authors;
        }

        const numAuthors = Math.floor(Math.random() * 3) + 1;
        const selectedAuthors = [];

        for (let i = 0; i < numAuthors; i++) {
            const author = data.sample_authors[Math.floor(Math.random() * data.sample_authors.length)];
            if (!selectedAuthors.includes(author)) {
                selectedAuthors.push(author);
            }
        }

        return selectedAuthors.join(', ');
    }

    generateInstitution(data) {
        return data.sample_institutions[Math.floor(Math.random() * data.sample_institutions.length)];
    }

    generateAbstract() {
        const field = this.currentConfig.field;
        return `This study investigates fundamental principles within ${field} through comprehensive analysis and methodological innovation. The research employs advanced techniques to examine key variables and their relationships within established theoretical frameworks. Results demonstrate significant correlations and provide novel insights into the underlying mechanisms governing these phenomena. The findings contribute to current understanding while identifying important directions for future research. Statistical analysis confirms the validity of the proposed hypotheses and supports the development of enhanced methodological approaches. These discoveries have practical implications for both theoretical advancement and real-world applications in ${field}. The study concludes with recommendations for continued investigation and methodological refinement in this important area of research.`;
    }

    generateKeywords() {
        const field = this.currentConfig.field.toLowerCase();
        const generalKeywords = ['methodology', 'analysis', 'research', 'statistical significance', 'experimental design'];
        
        const fieldSpecific = {
            biology: ['molecular biology', 'genetics', 'cellular processes'],
            psychology: ['cognitive processes', 'behavioral analysis', 'psychological assessment'],
            'computer science': ['algorithms', 'data structures', 'computational complexity'],
            chemistry: ['chemical reactions', 'molecular structure', 'analytical chemistry'],
            physics: ['theoretical physics', 'experimental methods', 'quantum mechanics']
        };

        const keywords = [...generalKeywords];
        if (fieldSpecific[field]) {
            keywords.push(...fieldSpecific[field]);
        }

        return keywords.slice(0, 6).join(', ');
    }

    generateReferences(data) {
        const references = [];
        const numRefs = Math.floor(Math.random() * 5) + 8; // 8-12 references

        for (let i = 0; i < numRefs; i++) {
            const author = data.sample_authors[Math.floor(Math.random() * data.sample_authors.length)];
            const journal = data.journal_names[Math.floor(Math.random() * data.journal_names.length)];
            const year = 2018 + Math.floor(Math.random() * 7); // 2018-2024
            const volume = Math.floor(Math.random() * 50) + 1;
            const pages = `${100 + Math.floor(Math.random() * 500)}-${150 + Math.floor(Math.random() * 500)}`;
            const title = this.generateReferenceTitle();

            references.push(`${author.replace('Dr. ', '').replace('Prof. ', '')} (${year}). ${title} ${journal}, ${volume}, ${pages}.`);
        }

        return references;
    }

    generateReferenceTitle() {
        const titles = [
            'Advances in theoretical frameworks and practical applications.',
            'Methodological innovations in contemporary research practices.',
            'Statistical approaches to complex data analysis systems.',
            'Comprehensive analysis of experimental methodologies and outcomes.',
            'Novel perspectives on established research paradigms.',
            'Quantitative assessment of theoretical model validation.',
            'Empirical investigation of fundamental research principles.',
            'Systematic review of current analytical techniques.'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    showPreview(paperHtml) {
        try {
            console.log('Showing preview...');
            document.getElementById('processing-section').style.display = 'none';
            document.getElementById('preview-section').style.display = 'block';
            document.getElementById('paper-preview').innerHTML = paperHtml;
            console.log('Preview displayed');
        } catch (error) {
            console.error('Error showing preview:', error);
        }
    }

    downloadPaper() {
        try {
            const paperContent = document.getElementById('paper-preview').innerHTML;
            const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Academic Paper</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; }
        .academic-paper { max-width: none; }
    </style>
</head>
<body>
    ${paperContent}
</body>
</html>`;

            const blob = new Blob([fullHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'academic-paper.html';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading paper:', error);
        }
    }

    copyPaper() {
        try {
            const paperElement = document.getElementById('paper-preview');
            const text = paperElement.textContent || paperElement.innerText;
            navigator.clipboard.writeText(text).then(() => {
                alert('Paper text copied to clipboard!');
            });
        } catch (error) {
            console.error('Error copying paper:', error);
            alert('Error copying text. Please try selecting and copying manually.');
        }
    }

    resetApp() {
        try {
            console.log('Resetting app...');
            
            // Reset data
            this.pdfText = '';
            this.currentConfig = {};
            this.currentPaperHtml = '';
            
            // Reset form
            document.getElementById('paper-title').value = '';
            document.getElementById('author-names').value = '';
            document.getElementById('research-field').selectedIndex = 0;
            document.querySelector('input[name="layout"][value="single"]').checked = true;
            
            // Reset file input
            document.getElementById('pdf-input').value = '';
            
            // Show upload section, hide others
            document.getElementById('upload-section').style.display = 'block';
            document.getElementById('config-section').style.display = 'none';
            document.getElementById('processing-section').style.display = 'none';
            document.getElementById('preview-section').style.display = 'none';
            
            // Reset progress
            this.resetProgress();
            
            console.log('App reset complete');
        } catch (error) {
            console.error('Error resetting app:', error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getApplicationData() {
        return {
            sample_authors: [
                'Dr. James Williams', 'Dr. Sarah Chen', 'Prof. Michael Rodriguez', 
                'Dr. Emily Johnson', 'Dr. Robert Kim', 'Prof. Lisa Anderson',
                'Dr. David Thompson', 'Dr. Maria Garcia', 'Prof. John Davis'
            ],
            
            sample_institutions: [
                'Stanford University', 'Harvard University', 'MIT', 
                'University of California, Berkeley', 'Oxford University',
                'Cambridge University', 'Yale University', 'Princeton University'
            ],
            
            journal_names: [
                'Journal of Advanced Research', 'Nature Communications',
                'Science Advances', 'Proceedings of the Academy',
                'International Journal of Studies', 'Annual Review of Sciences'
            ],
            
            academic_phrases: [
                'Furthermore', 'Moreover', 'In addition', 'Consequently',
                'Therefore', 'Nevertheless', 'However'
            ],
            
            method_terms: [
                'systematic methodology', 'experimental protocols', 'rigorous standards',
                'quality assurance', 'data validation', 'analytical procedures'
            ],
            
            result_terms: [
                'significant correlations', 'Statistical analyses', 'meaningful patterns',
                'strong evidence', 'Comprehensive evaluation'
            ]
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PaperCloak();
});
