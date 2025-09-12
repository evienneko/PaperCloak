// PaperCloak Application JavaScript
class PaperCloak {
    constructor() {
        this.pdfText = '';
        this.currentConfig = {};
        this.currentPaperHtml = '';
        this.currentTheme = localStorage.getItem('paperCloak_theme') || 'light';
        console.log('PaperCloak initialized');
        this.initializeApp();
    }

    initializeApp() {
        try {
            this.setupPdfJs();
            this.setupEventListeners();
            this.setupTabNavigation();
            this.setupTheme();
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

    setupTheme() {
        // Apply saved theme and override system preferences
        document.body.setAttribute('data-theme', this.currentTheme);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('paperCloak_theme', this.currentTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = button.getAttribute('data-tab');
                console.log('Tab clicked:', tabName);

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

    setupEventListeners() {
        try {
            console.log('Setting up event listeners...');

            // App logo click handler - redirect to home
            const appLogo = document.getElementById('app-logo');
            if (appLogo) {
                appLogo.addEventListener('click', () => this.goToHome());
            }

            // Theme toggle click handler
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // File input change handler
            const pdfInput = document.getElementById('pdf-input');
            if (pdfInput) {
                pdfInput.onchange = (e) => this.handleFileSelect(e);
            }

            // Upload area click handler
            const uploadArea = document.getElementById('upload-area');
            if (uploadArea) {
                uploadArea.onclick = () => this.triggerFileInput();

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

            // PDF download button
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

    goToHome() {
        try {
            console.log('Going to home...');
            this.resetApp();

            const transformTab = document.querySelector('[data-tab="transform"]');
            const historyTab = document.querySelector('[data-tab="history"]');

            if (transformTab && historyTab) {
                historyTab.classList.remove('active');
                document.getElementById('history-tab').style.display = 'none';
                document.getElementById('history-tab').classList.remove('active');

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
            alert('Error processing PDF. Please try again.');
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
            const sections = ['upload-progress', 'upload-section', 'processing-section', 'preview-section'];
            sections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.style.display = 'none';
                }
            });

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
            if (!this.pdfText.trim()) {
                alert('No content available. Please upload a PDF.');
                return;
            }

            this.showProcessing();

            this.currentConfig = {
                title: document.getElementById('paper-title').value.trim(),
                authors: document.getElementById('author-names').value.trim(),
                field: document.getElementById('research-field').value,
                layout: document.querySelector('input[name="layout"]:checked').value
            };

            console.log('Current config:', this.currentConfig);

            await this.sleep(3000);

            const paperHtml = this.generateAcademicPaper();
            this.currentPaperHtml = paperHtml;
            this.showPreview(paperHtml);
            this.saveToHistory();
        } catch (error) {
            console.error('Error transforming to paper:', error);
            alert('Error generating paper. Please try again.');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showProcessing() {
        try {
            console.log('Showing processing...');
            document.getElementById('config-section').style.display = 'none';
            document.getElementById('processing-section').style.display = 'block';

            const statuses = [
                'Analyzing content structure...',
                'Formatting academic sections...',
                'Generating citations...',
                'Applying layout template...',
                'Finalizing document...'
            ];

            let statusIndex = 0;
            const statusElement = document.getElementById('processing-status');
            const statusInterval = setInterval(() => {
                if (statusElement && statusIndex < statuses.length) {
                    statusElement.textContent = statuses[statusIndex];
                    statusIndex++;
                } else {
                    clearInterval(statusInterval);
                }
            }, 600);
        } catch (error) {
            console.error('Error showing processing:', error);
        }
    }

    generateAcademicPaper() {
        try {
            const data = this.generatePaperData();
            const title = this.currentConfig.title || this.generateTitle();
            const authors = this.generateAuthors(data);
            const institution = this.generateInstitution(data);
            const abstract = this.generateAbstract();
            const keywords = this.generateKeywords();

            // Generate sections from actual PDF content
            const sections = this.extractSectionsFromPdf();
            const references = this.generateReferences(data);

            const layoutClass = this.currentConfig.layout === 'double' ? 'two-column' : 'single-column';

            return `
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

                    ${Object.keys(sections).map(type => {
                        const title = type.charAt(0).toUpperCase() + type.slice(1);
                        return `
                            <div class="section">
                                <h2 class="section-header">${title}</h2>
                                <div class="section-content">
                                    ${sections[type].split('\n\n').map(p => `<p>${this.preserveFormatting(p.trim())}</p>`).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}

                    <div class="references">
                        <h3>References</h3>
                        <ol>
                            ${references.map(ref => `<li class="reference-item">${ref}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error generating academic paper:', error);
            return '<div class="error">Error generating paper content</div>';
        }
    }

    extractSectionsFromPdf() {
        const sections = {};
        const text = this.pdfText;

        if (text.length < 1000) {
            return this.getDefaultSections();
        }

        const chunks = text.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 50);
        const sectionTypes = ['introduction', 'methodology', 'results', 'discussion', 'conclusion'];

        chunks.forEach((chunk, index) => {
            const sectionType = sectionTypes[index % sectionTypes.length];
            if (!sections[sectionType]) {
                sections[sectionType] = '';
            }
            sections[sectionType] += chunk.trim() + '\n\n';
        });

        Object.keys(sections).forEach(key => {
            if (sections[key].length > 2000) {
                sections[key] = sections[key].substring(0, 2000) + '...';
            }
        });

        return sections;
    }

    getDefaultSections() {
        const templates = {
            introduction: `This study investigates important aspects within the field of ${this.currentConfig.field}. Current research has identified several key areas requiring further investigation. The primary objective of this research is to contribute to our understanding of these complex phenomena.\n\nThe methodology employed in this study builds upon established frameworks while incorporating novel approaches to data analysis.`,

            methodology: `The experimental design incorporated systematic data collection with careful attention to established protocols. Data collection procedures followed standard guidelines for research in ${this.currentConfig.field}. Statistical analysis was conducted using appropriate software packages.`,

            results: `The analysis revealed significant relationships between key variables. Results indicate patterns consistent with theoretical predictions. Statistical evaluation established clear trends supporting the primary hypothesis of this investigation.`,

            discussion: `These findings contribute significantly to our understanding of the subject matter. The results align with previous research while revealing novel insights. The implications of these discoveries extend beyond the immediate scope of this study.`,

            conclusion: `In conclusion, this research provides valuable evidence supporting the main hypotheses. The findings have practical implications for future work in ${this.currentConfig.field}. Continued investigation in this area will enhance our theoretical understanding and practical applications.`
        };

        return templates[sectionType] || `Content analysis and interpretation will be presented in this section.`;
    }

    preserveFormatting(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>');
    }

    generatePaperData() {
        return {
            field: this.currentConfig.field,
            textLength: this.pdfText.length,
            wordCount: this.pdfText.split(/\s+/).length,
            hasMethodology: this.pdfText.toLowerCase().includes('method'),
            hasResults: this.pdfText.toLowerCase().includes('result'),
            hasReferences: this.pdfText.toLowerCase().includes('reference')
        };
    }

    generateTitle() {
        const field = this.currentConfig.field;
        const titles = [
            `Advanced Research in ${field}: A Comprehensive Analysis`,
            `Innovative Approaches to ${field} Research`,
            `Contemporary Studies in ${field}`,
            `Emerging Trends in ${field} Research`,
            `Analytical Framework for ${field} Studies`
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    generateAuthors(data) {
        const author = this.currentConfig.authors || 'Anonymous Researcher';
        return author;
    }

    generateInstitution(data) {
        const institutions = [
            'Department of Research, Academic University',
            'Institute for Advanced Studies',
            'Research Center for Applied Sciences',
            'University Research Laboratory'
        ];
        return institutions[Math.floor(Math.random() * institutions.length)];
    }

    generateAbstract() {
        const field = this.currentConfig.field;
        return `This research presents a comprehensive investigation into key aspects of ${field}. Through systematic analysis and methodological rigor, this study contributes valuable insights to the existing body of knowledge. The findings demonstrate significant implications for future research and practical applications in the field.`;
    }

    generateKeywords() {
        const field = this.currentConfig.field;
        const keywords = [field, 'research', 'analysis', 'methodology', 'findings'];
        return keywords.join(', ');
    }

    generateReferences(data) {
        const field = this.currentConfig.field;
        return [
            `Smith, J. (2023). Foundations of ${field} Research. Academic Press.`,
            `Johnson, M., & Brown, K. (2022). Contemporary approaches in ${field}. Journal of Research, 15(3), 45-67.`,
            `Davis, L. (2023). Methodological frameworks for ${field} studies. Research Quarterly, 8(2), 123-145.`,
            `Wilson, P., et al. (2022). Advanced techniques in ${field} analysis. Scientific Publications.`,
            `Thompson, R. (2023). Future directions in ${field} research. Annual Review, 12, 78-102.`
        ];
    }

    // UPDATED: Enhanced showPreview method with two-column layout support
    showPreview(paperHtml) {
        try {
            console.log('Showing preview...');
            document.getElementById('processing-section').style.display = 'none';
            document.getElementById('preview-section').style.display = 'block';
            document.getElementById('paper-preview').innerHTML = paperHtml;

            // ADDED: Ensure the layout class is properly applied
            const previewElement = document.getElementById('paper-preview');
            if (previewElement) {
                const academicPaper = previewElement.querySelector('.academic-paper');
                if (academicPaper && this.currentConfig.layout) {
                    // Remove any existing layout classes
                    academicPaper.classList.remove('single-column', 'two-column');

                    // Add the correct layout class
                    const layoutClass = this.currentConfig.layout === 'double' ? 'two-column' : 'single-column';
                    academicPaper.classList.add(layoutClass);

                    console.log('Layout class applied:', layoutClass);
                }
            }

            console.log('Preview displayed');
        } catch (error) {
            console.error('Error showing preview:', error);
        }
    }

    resetApp() {
        try {
            console.log('Resetting app...');
            this.pdfText = '';
            this.currentConfig = {};
            this.currentPaperHtml = '';

            document.getElementById('upload-section').style.display = 'block';
            document.getElementById('upload-progress').style.display = 'none';
            document.getElementById('config-section').style.display = 'none';
            document.getElementById('processing-section').style.display = 'none';
            document.getElementById('preview-section').style.display = 'none';

            document.getElementById('pdf-input').value = '';
            const progressFill = document.getElementById('progress-fill');
            if (progressFill) progressFill.style.width = '0%';

            console.log('App reset complete');
        } catch (error) {
            console.error('Error resetting app:', error);
        }
    }

    downloadPaper() {
        if (!this.currentPaperHtml) {
            alert('No paper available for download. Please generate a paper first.');
            return;
        }

        const element = document.createElement('a');
        const file = new Blob([this.currentPaperHtml], { type: 'text/html' });
        element.href = URL.createObjectURL(file);
        element.download = 'academic-paper.html';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    copyPaper() {
        if (!this.currentPaperHtml) {
            alert('No paper available to copy. Please generate a paper first.');
            return;
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.currentPaperHtml;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        navigator.clipboard.writeText(textContent).then(() => {
            alert('Paper content copied to clipboard!');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            alert('Error copying to clipboard. Please try again.');
        });
    }

    downloadPaperAsPdf() {
        try {
            console.log('Starting PDF download...');

            if (!this.currentPaperHtml) {
                alert('No paper available for download. Please generate a paper first.');
                return;
            }

            // Detect mobile devices
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // Create a new window with the paper content
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow) {
                alert('Please allow popups for this site to download the PDF.');
                return;
            }

            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Academic Paper</title>
                    <style>
                        body {
                            font-family: 'Times New Roman', serif;
                            line-height: 1.6;
                            margin: 40px;
                            color: #000;
                            background: white;
                            text-align: justify;
                        }
                        .paper {
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                        }
                        .paper-title {
                            font-size: 24px;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 20px;
                            line-height: 1.3;
                        }
                        .authors {
                            text-align: center;
                            font-size: 14px;
                            margin-bottom: 10px;
                        }
                        .institution {
                            text-align: center;
                            font-style: italic;
                            font-size: 12px;
                            margin-bottom: 30px;
                        }
                        .abstract {
                            margin: 30px 0;
                            padding: 20px;
                            background: #f9f9f9;
                            border-left: 4px solid #ccc;
                            text-align: justify;
                        }
                        .abstract h3 {
                            margin-top: 0;
                            font-size: 16px;
                            text-align: center;
                        }
                        .abstract p {
                            text-align: justify;
                        }
                        .keywords {
                            margin: 20px 0;
                            font-size: 11px;
                            text-align: left;
                        }
                        .section {
                            margin: 30px 0;
                            text-align: justify;
                        }
                        .section h2 {
                            font-size: 18px;
                            margin-bottom: 15px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 5px;
                            text-align: left;
                        }
                        .section p {
                            text-align: justify;
                            text-justify: inter-word;
                            font-size: 11px;
                        }
                        .references {
                            margin-top: 40px;
                        }
                        .references h2 {
                            font-size: 18px;
                            margin-bottom: 20px;
                            text-align: left;
                        }
                        .references ol {
                            padding-left: 20px;
                        }
                        .references li {
                            margin-bottom: 8px;
                            font-size: 11px;
                            text-align: justify;
                        }
                        .two-column {
                            column-count: 2;
                            column-gap: 30px;
                        }
                        .single-column {
                            column-count: 1;
                        }
                        p {
                            text-align: justify;
                            text-justify: inter-word;
                            font-size: 11px;
                        }
                        /* Mobile-specific styles */
                        @media screen and (max-width: 768px) {
                            body { 
                                margin: 20px; 
                                font-size: 14px;
                            }
                            .two-column {
                                column-count: 1;
                            }
                            .paper-title {
                                font-size: 20px;
                            }
                            .section h2 {
                                font-size: 16px;
                            }
                        }
                        @media print {
                            body { margin: 0; }
                            .paper { margin: 20px; }
                        }
                        /* Print button for mobile */
                        .mobile-print-btn {
                            display: none;
                            position: fixed;
                            bottom: 20px;
                            right: 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 15px 20px;
                            border-radius: 5px;
                            font-size: 16px;
                            cursor: pointer;
                            z-index: 1000;
                        }
                        @media screen and (max-width: 768px) {
                            .mobile-print-btn {
                                display: block;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="paper">
                        ${this.currentPaperHtml}
                    </div>
                    <button class="mobile-print-btn" onclick="window.print()">Print/Save PDF</button>
                    <script>
                        // Auto-trigger print for desktop, manual trigger for mobile
                        window.addEventListener('load', function() {
                            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                            if (!isMobile) {
                                setTimeout(function() {
                                    window.print();
                                }, 500);
                            }
                        });
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(fullHtml);
            printWindow.document.close();

            // Focus the new window
            printWindow.focus();

            console.log('PDF download initiated');

        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error downloading PDF. Please try again.');
        }
    }

    saveToHistory() {
        try {
            const historyItem = {
                id: Date.now(),
                title: this.currentConfig.title || 'Untitled Paper',
                authors: this.currentConfig.authors || 'Anonymous',
                field: this.currentConfig.field,
                layout: this.currentConfig.layout,
                html: this.currentPaperHtml,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString()
            };

            let history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            history.unshift(historyItem);

            // Keep only the last 10 items
            if (history.length > 10) {
                history = history.slice(0, 10);
            }

            localStorage.setItem('paperCloak_history', JSON.stringify(history));
            console.log('Saved to history:', historyItem.title);
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    }

    loadHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            const historyList = document.getElementById('history-list');

            if (!historyList) return;

            if (history.length === 0) {
                historyList.innerHTML = `
                    <div class="history-empty">
                        <div class="empty-icon">📄</div>
                        <h4>No papers yet</h4>
                        <p>Transform your first PDF to see it here!</p>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-item-header">
                        <h4>${item.title}</h4>
                        <span class="history-date">${item.date} at ${item.time}</span>
                    </div>
                    <div class="history-item-details">
                        <span class="history-field">Field: ${item.field}</span>
                        <span class="history-layout">Layout: ${item.layout}</span>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn--sm btn--outline" onclick="app.previewHistoryItem(${item.id})">
                            👁️ Preview
                        </button>
                        <button class="btn btn--sm btn--secondary" onclick="app.downloadHistoryItem(${item.id})">
                            📥 Download
                        </button>
                        <button class="btn btn--sm btn--outline" onclick="app.deleteHistoryItem(${item.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    previewHistoryItem(id) {
        try {
            const history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            const item = history.find(h => h.id === id);

            if (item) {
                this.currentPaperHtml = item.html;
                this.currentConfig = {
                    title: item.title,
                    authors: item.authors,
                    field: item.field,
                    layout: item.layout
                };

                // Switch to transform tab and show preview
                const transformTab = document.querySelector('[data-tab="transform"]');
                const historyTab = document.querySelector('[data-tab="history"]');

                if (transformTab && historyTab) {
                    historyTab.classList.remove('active');
                    document.getElementById('history-tab').style.display = 'none';
                    document.getElementById('history-tab').classList.remove('active');

                    transformTab.classList.add('active');
                    document.getElementById('transform-tab').style.display = 'block';
                    document.getElementById('transform-tab').classList.add('active');
                }

                this.showPreview(item.html);
            }
        } catch (error) {
            console.error('Error previewing history item:', error);
        }
    }

    downloadHistoryItem(id) {
        try {
            const history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            const item = history.find(h => h.id === id);

            if (item) {
                this.currentPaperHtml = item.html;
                this.currentConfig = {
                    title: item.title,
                    authors: item.authors,
                    field: item.field,
                    layout: item.layout
                };
                this.downloadPaperAsPdf();
            }
        } catch (error) {
            console.error('Error downloading history item:', error);
        }
    }

    deleteHistoryItem(id) {
        try {
            if (confirm('Are you sure you want to delete this paper from history?')) {
                let history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
                history = history.filter(h => h.id !== id);
                localStorage.setItem('paperCloak_history', JSON.stringify(history));
                this.loadHistory();
            }
        } catch (error) {
            console.error('Error deleting history item:', error);
        }
    }

    clearHistory() {
        try {
            if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
                localStorage.removeItem('paperCloak_history');
                this.loadHistory();
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PaperCloak();
});
