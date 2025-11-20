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
                <div class="paper ${layoutClass}">
                    <div class="paper-title">${title}</div>
                    <div class="authors">${authors}</div>
                    <div class="institution">${institution}</div>
                    
                    <div class="abstract">
                        <h3>Abstract</h3>
                        <p>${abstract}</p>
                    </div>
                    
                    <div class="keywords">
                        <strong>Keywords:</strong> ${keywords}
                    </div>
                    
                    ${sections}
                    
                    <div class="references">
                        <h2>References</h2>
                        <ol>
                            ${references.map(ref => `<li>${ref}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error generating academic paper:', error);
            return '<div class="error">Error generating paper content. Please try again.</div>';
        }
    }

    generatePaperData() {
        return {
            sample_authors: [
                'Dr. Sarah Johnson',
                'Prof. Michael Chen',
                'Dr. Emily Rodriguez',
                'Prof. David Thompson',
                'Dr. Amanda Wilson',
                'Prof. James Park',
                'Dr. Lisa Anderson',
                'Prof. Robert Kim'
            ],
            sample_institutions: [
                'Department of Research, University of Excellence',
                'Institute for Advanced Studies, Metropolitan University',
                'School of Sciences, Academic Research Center',
                'Department of Innovation, Technology Institute',
                'Center for Research Excellence, State University'
            ],
            journal_names: [
                'Journal of Advanced Research',
                'International Review of Studies',
                'Quarterly Journal of Science',
                'Annual Review of Research',
                'Journal of Contemporary Analysis',
                'International Journal of Innovation',
                'Research Quarterly Review',
                'Journal of Applied Sciences'
            ],
            method_terms: [
                'systematic data collection',
                'experimental protocols',
                'established guidelines',
                'statistical analysis',
                'quality control measures',
                'data integrity'
            ],
            result_terms: [
                'significant correlations',
                'Statistical analysis',
                'patterns',
                'comprehensive evaluation',
                'Comparative analysis'
            ]
        };
    }

    extractSectionsFromPdf() {
        if (!this.pdfText) {
            return this.generateDefaultSections();
        }

        const paragraphs = this.pdfText.split('\n\n').filter(p => p.trim().length > 50);
        const sectionTypes = ['introduction', 'methods', 'results', 'discussion', 'conclusion'];
        const sections = {};

        sectionTypes.forEach((type, index) => {
            const startIndex = Math.floor((paragraphs.length / sectionTypes.length) * index);
            const endIndex = Math.floor((paragraphs.length / sectionTypes.length) * (index + 1));
            const sectionParagraphs = paragraphs.slice(startIndex, endIndex);
            
            if (sectionParagraphs.length > 0) {
                sections[type] = sectionParagraphs
                    .map(p => `<p>${this.preserveFormatting(p.trim())}</p>`)
                    .join('');
            }
        });

        return Object.keys(sections).map(type => {
            const title = type.charAt(0).toUpperCase() + type.slice(1);
            return `
                <div class="section">
                    <h2>${title}</h2>
                    ${sections[type] || this.generateDefaultSectionContent(type)}
                </div>
            `;
        }).join('');
    }

    generateDefaultSectionContent(sectionType) {
        const templates = {
            introduction: `<p>This study investigates important aspects within the field of ${this.currentConfig.field}. Current research has identified several key areas requiring further investigation. The primary objective of this research is to contribute to our understanding of these complex phenomena.</p><p>The methodology employed in this study builds upon established frameworks while incorporating novel approaches to data analysis.</p>`,
            methodology: `<p>The experimental design incorporated systematic data collection with careful attention to established protocols. Data collection procedures followed standard guidelines for research in ${this.currentConfig.field}. Statistical analysis was conducted using appropriate software packages.</p>`,
            results: `<p>The analysis revealed significant relationships between key variables. Results indicate patterns consistent with theoretical predictions. Statistical evaluation established clear trends supporting the primary hypothesis of this investigation.</p>`,
            discussion: `<p>These findings contribute significantly to our understanding of the subject matter. The results align with previous research while revealing novel insights. The implications of these discoveries extend beyond the immediate scope of this study.</p>`,
            conclusion: `<p>In conclusion, this research provides valuable evidence supporting the main hypotheses. The findings have practical implications for future work in ${this.currentConfig.field}. Continued investigation in this area will enhance our theoretical understanding and practical applications.</p>`
        };

        return templates[sectionType] || '<p>Content analysis and interpretation will be presented in this section.</p>';
    }

    preserveFormatting(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
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

    // CORRECTED HTML DOWNLOAD FUNCTION WITH JUSTIFIED TEXT
    downloadPaper() {
        try {
            const paperContent = document.getElementById('paper-preview').innerHTML;
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
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
                            font-size: 12px;
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
                            font-size: 12px;
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
                        }
                        @media print {
                            body { margin: 0; }
                            .paper { margin: 20px; }
                        }
                    </style>
                </head>
                <body>
                    ${paperContent}
                </body>
                </html>
            `;

            const blob = new Blob([fullHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentConfig.title || 'academic-paper'}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('HTML download completed');
        } catch (error) {
            console.error('Error downloading HTML:', error);
            alert('Error downloading HTML file. Please try again.');
        }
    }

    // CORRECTED PDF DOWNLOAD FUNCTION WITH JUSTIFIED TEXT AND MOBILE SUPPORT
    async downloadPaperAsPdf() {
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
                            font-size: 12px;
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
                            font-size: 12px;
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

    copyPaper() {
        try {
            const paperContent = document.getElementById('paper-preview').innerText;
            navigator.clipboard.writeText(paperContent).then(() => {
                alert('Paper content copied to clipboard!');
            });
        } catch (error) {
            console.error('Error copying paper:', error);
            alert('Error copying paper. Please try again.');
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
                        <p>Transform your first PDF to see it here!</p>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = history.map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-info">
                        <h3>${item.title}</h3>
                        <p>Field: ${item.field} | Layout: ${item.layout}</p>
                        <small>${item.date} at ${item.time}</small>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn--small" onclick="app.viewHistoryItem(${item.id})">View</button>
                        <button class="btn btn--small btn--outline" onclick="app.deleteHistoryItem(${item.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    viewHistoryItem(id) {
        try {
            const history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
            const item = history.find(h => h.id === id);
            
            if (item) {
                this.currentPaperHtml = item.html;
                this.currentConfig = {
                    title: item.title,
                    field: item.field,
                    layout: item.layout
                };
                
                // Hide history and show preview
                document.getElementById('history-tab').style.display = 'none';
                document.getElementById('preview-section').style.display = 'block';
                document.getElementById('paper-preview').innerHTML = item.html;
                
                // Update tab navigation
                document.querySelector('[data-tab="history"]').classList.remove('active');
                document.querySelector('[data-tab="transform"]').classList.add('active');
                document.getElementById('transform-tab').style.display = 'block';
                document.getElementById('transform-tab').classList.add('active');
            }
        } catch (error) {
            console.error('Error viewing history item:', error);
        }
    }

    deleteHistoryItem(id) {
        try {
            if (confirm('Are you sure you want to delete this item?')) {
                let history = JSON.parse(localStorage.getItem('paperCloak_history') || '[]');
                history = history.filter(item => item.id !== id);
                localStorage.setItem('paperCloak_history', JSON.stringify(history));
                this.loadHistory();
            }
        } catch (error) {
            console.error('Error deleting history item:', error);
        }
    }

    clearHistory() {
        try {
            if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                localStorage.removeItem('paperCloak_history');
                this.loadHistory();
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    resetApp() {
        try {
            console.log('Resetting app...');
            
            // Reset internal state
            this.pdfText = '';
            this.currentConfig = {};
            this.currentPaperHtml = '';
            
            // Reset UI
            document.getElementById('upload-section').style.display = 'block';
            const sections = ['upload-progress', 'config-section', 'processing-section', 'preview-section'];
            sections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.style.display = 'none';
                }
            });
            
            // Reset form
            const form = document.getElementById('config-form');
            if (form) {
                form.reset();
            }
            
            // Reset progress
            this.resetProgress();
            
            console.log('App reset complete');
        } catch (error) {
            console.error('Error resetting app:', error);
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PaperCloak();
});
