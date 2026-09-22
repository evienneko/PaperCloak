/* =========================================================
   PaperCloak — Application Logic
   ========================================================= */

// Single source of truth for exported paper styling, so the
// live preview, HTML download, and PDF/print output are always
// visually identical. Mirrors the ".academic-paper" rules in style.css.
const PAPER_EXPORT_CSS = `
  body { font-family: "Times New Roman", Times, serif; line-height: 1.6; color: #000;
         background: white; margin: 40px; }
  .academic-paper { max-width: 800px; margin: 0 auto; padding: 48px; box-sizing: border-box; text-align: justify; }
  .paper-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; line-height: 1.3; }
  .authors { text-align: center; font-size: 14px; margin-bottom: 10px; }
  .institution { text-align: center; font-style: italic; font-size: 12px; margin-bottom: 30px; }
  .abstract { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #ccc; }
  .abstract h3 { margin-top: 0; font-size: 16px; text-align: center; }
  .abstract p { margin: 0; font-size: 12px; text-align: justify; }
  .keywords { margin: 20px 0; font-size: 12px; }
  .section { margin: 30px 0; }
  .section h2 { font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #333; padding-bottom: 5px; }
  .section p { font-size: 12px; text-align: justify; text-justify: inter-word; line-height: 1.6; margin-bottom: 10px; }
  .references { margin-top: 40px; }
  .references h2 { font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 5px; }
  .references ol { padding-left: 20px; }
  .references li { margin-bottom: 8px; font-size: 12px; text-align: justify; line-height: 1.6; }
  .two-column { column-count: 2; column-gap: 30px; }
  .two-column .paper-title, .two-column .authors, .two-column .institution,
  .two-column .abstract, .two-column .keywords { column-span: all; margin-bottom: 20px; }
  .two-column .section { break-inside: avoid; }
  .single-column { column-count: 1; }
  @media (max-width: 768px) {
    body { margin: 20px; font-size: 14px; }
    .academic-paper { padding: 24px; }
    .two-column { column-count: 1; }
    .paper-title { font-size: 20px; }
    .section h2 { font-size: 16px; }
  }
  @media print { body { margin: 0; } .academic-paper { padding: 20mm; } }
`;

class PaperCloak {
  constructor() {
    this.pdfText = '';
    this.currentConfig = {};
    this.currentPaperHtml = '';
    this.currentTheme = localStorage.getItem('paperCloakTheme') || 'light';
    this.initializeApp();
  }

  initializeApp() {
    try {
      this.setupPdfJs();
      this.setupEventListeners();
      this.setupTabNavigation();
      this.setupTheme();
      this.loadHistory();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  setupPdfJs() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  /* ---------------- Theme ---------------- */
  setupTheme() {
    document.body.setAttribute('data-theme', this.currentTheme);
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.updateThemeIcon();
  }

  toggleTheme = () => {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', this.currentTheme);
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('paperCloakTheme', this.currentTheme);
    this.updateThemeIcon();
  };

  updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
  }

  /* ---------------- Tabs ---------------- */
  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = button.getAttribute('data-tab');

        tabButtons.forEach((btn) => btn.classList.remove('active'));
        tabContents.forEach((content) => {
          content.classList.remove('active');
          content.style.display = 'none';
        });

        button.classList.add('active');
        const target = document.getElementById(`${tabName}-tab`);
        if (target) {
          target.classList.add('active');
          target.style.display = 'block';
        }

        if (tabName === 'history') this.loadHistory();
      });
    });
  }

  goToHome = () => {
    this.resetApp();
    document.querySelector('[data-tab="transform"]').classList.add('active');
    document.querySelector('[data-tab="history"]').classList.remove('active');
    document.getElementById('transform-tab').style.display = 'block';
    document.getElementById('transform-tab').classList.add('active');
    document.getElementById('history-tab').style.display = 'none';
    document.getElementById('history-tab').classList.remove('active');
  };

  /* ---------------- Event wiring ---------------- */
  setupEventListeners() {
    document.getElementById('app-logo')?.addEventListener('click', this.goToHome);
    document.getElementById('theme-toggle')?.addEventListener('click', this.toggleTheme);

    const pdfInput = document.getElementById('pdf-input');
    if (pdfInput) pdfInput.onchange = (e) => this.handleFileSelect(e);

    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.onclick = () => this.triggerFileInput();
      uploadArea.ondragover = (e) => this.handleDragOver(e);
      uploadArea.ondragleave = (e) => this.handleDragLeave(e);
      uploadArea.ondrop = (e) => this.handleDrop(e);
    }

    document.getElementById('transform-btn')?.addEventListener('click', () => this.transformToPaper());
    document.getElementById('new-upload-btn')?.addEventListener('click', () => this.resetApp());
    document.getElementById('download-btn')?.addEventListener('click', () => this.downloadPaper());
    document.getElementById('copy-btn')?.addEventListener('click', () => this.copyPaper());
    document.getElementById('download-pdf-btn')?.addEventListener('click', () => this.downloadPaperAsPdf());
    document.getElementById('clear-history-btn')?.addEventListener('click', () => this.clearHistory());
  }

  /* ---------------- Upload handling ---------------- */
  triggerFileInput() {
    document.getElementById('pdf-input')?.click();
  }

  handleDragOver(e) {
    e.preventDefault();
    document.getElementById('upload-area')?.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('upload-area')?.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    document.getElementById('upload-area')?.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) this.processFile(files[0]);
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) this.processFile(file);
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
    document.getElementById('upload-section').style.display = 'none';
    const progressSection = document.getElementById('upload-progress');
    if (progressSection) progressSection.style.display = 'block';

    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (fill) fill.style.width = `${progress}%`;
      if (text) {
        if (progress <= 30) text.textContent = 'Extracting text...';
        else if (progress <= 60) text.textContent = 'Processing content...';
        else if (progress <= 90) text.textContent = 'Almost done...';
        else text.textContent = 'Complete!';
      }
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => this.showConfigSection(), 400);
      }
    }, 150);
  }

  resetProgress() {
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('upload-progress').style.display = 'none';
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (fill) fill.style.width = '0%';
    if (text) text.textContent = 'Uploading...';
  }

  async extractPdfText(file) {
    if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js not loaded');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(' ') + '\n';
    }
    this.pdfText = fullText.trim();
  }

  showConfigSection() {
    ['upload-progress', 'upload-section', 'processing-section', 'preview-section'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const config = document.getElementById('config-section');
    if (config) config.style.display = 'block';
  }

  /* ---------------- Transformation ---------------- */
  async transformToPaper() {
    try {
      if (!this.pdfText.trim()) {
        alert('No content available. Please upload a PDF.');
        return;
      }
      this.showProcessing();

      this.currentConfig = {
        title: document.getElementById('paper-title').value.trim(),
        authors: document.getElementById('author-names').value.trim(),
        field: document.getElementById('research-field').value,
        layout: document.querySelector('input[name="layout"]:checked').value,
      };

      await this.sleep(2200);
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showProcessing() {
    document.getElementById('config-section').style.display = 'none';
    document.getElementById('processing-section').style.display = 'block';

    const statuses = [
      'Analyzing content structure...',
      'Formatting academic sections...',
      'Generating citations...',
      'Applying layout template...',
      'Finalizing document...',
    ];
    let i = 0;
    const statusEl = document.getElementById('processing-status');
    const interval = setInterval(() => {
      if (statusEl && i < statuses.length) {
        statusEl.textContent = statuses[i];
        i++;
      } else {
        clearInterval(interval);
      }
    }, 450);
  }

  /* ---------------- Content generation ---------------- */
  generateAcademicPaper() {
    try {
      const data = this.generatePaperData();
      const title = this.currentConfig.title || this.generateTitle();
      const authors = this.generateAuthors(data);
      const institution = this.generateInstitution(data);
      const abstract = this.generateAbstract();
      const keywords = this.generateKeywords();
      const sections = this.extractSectionsFromPdf();
      const references = this.generateReferences(data);
      const layoutClass = this.currentConfig.layout === 'double' ? 'two-column' : 'single-column';

      return `
        <div class="academic-paper ${layoutClass}">
          <div class="paper-title">${title}</div>
          <div class="authors">${authors}</div>
          <div class="institution">${institution}</div>
          <div class="abstract">
            <h3>Abstract</h3>
            <p>${abstract}</p>
          </div>
          <div class="keywords"><strong>Keywords:</strong> ${keywords}</div>
          ${sections}
          <div class="references">
            <h2>References</h2>
            <ol>${references.map((ref) => `<li>${ref}</li>`).join('')}</ol>
          </div>
        </div>`;
    } catch (error) {
      console.error('Error generating academic paper:', error);
      return '<div class="error">Error generating paper content. Please try again.</div>';
    }
  }

  generatePaperData() {
    return {
      sampleAuthors: [
        'Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez', 'Prof. David Thompson',
        'Dr. Amanda Wilson', 'Prof. James Park', 'Dr. Lisa Anderson', 'Prof. Robert Kim',
      ],
      sampleInstitutions: [
        'Department of Research, University of Excellence', 'Institute for Advanced Studies',
        'Metropolitan University', 'School of Sciences, Academic Research Center',
        'Department of Innovation, Technology Institute', 'Center for Research Excellence, State University',
      ],
      journalNames: [
        'Journal of Advanced Research', 'International Review of Studies', 'Quarterly Journal of Science',
        'Annual Review of Research', 'Journal of Contemporary Analysis', 'International Journal of Innovation',
        'Research Quarterly Review', 'Journal of Applied Sciences',
      ],
    };
  }

  extractSectionsFromPdf() {
    if (!this.pdfText) return this.generateDefaultSections();

    const paragraphs = this.pdfText.split('\n').filter((p) => p.trim().length > 50);
    const sectionTypes = ['Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'];

    if (paragraphs.length === 0) return this.generateDefaultSections();

    const chunkSize = Math.max(1, Math.floor(paragraphs.length / sectionTypes.length));
    return sectionTypes
      .map((type, index) => {
        const start = chunkSize * index;
        const end = index === sectionTypes.length - 1 ? paragraphs.length : chunkSize * (index + 1);
        const chunk = paragraphs.slice(start, end);
        const body = chunk.length
          ? chunk.map((p) => `<p>${this.preserveFormatting(p.trim())}</p>`).join('')
          : this.generateDefaultSectionContent(type.toLowerCase());
        return `<div class="section"><h2>${type}</h2>${body}</div>`;
      })
      .join('');
  }

  generateDefaultSections() {
    const sectionTypes = ['Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'];
    return sectionTypes
      .map((type) => `<div class="section"><h2>${type}</h2>${this.generateDefaultSectionContent(type.toLowerCase())}</div>`)
      .join('');
  }

  generateDefaultSectionContent(sectionType) {
    const field = this.currentConfig.field || 'this field';
    const templates = {
      introduction: `<p>This study investigates important aspects within the field of ${field}. Current research has identified several key areas requiring further investigation. The primary objective of this research is to contribute to our understanding of these complex phenomena.</p><p>The methodology employed in this study builds upon established frameworks while incorporating novel approaches to data analysis.</p>`,
      methodology: `<p>The experimental design incorporated systematic data collection with careful attention to established protocols. Data collection procedures followed standard guidelines for research in ${field}. Statistical analysis was conducted using appropriate software packages.</p>`,
      results: `<p>The analysis revealed significant relationships between key variables. Results indicate patterns consistent with theoretical predictions. Statistical evaluation established clear trends supporting the primary hypothesis of this investigation.</p>`,
      discussion: `<p>These findings contribute significantly to our understanding of the subject matter. The results align with previous research while revealing novel insights. The implications of these discoveries extend beyond the immediate scope of this study.</p>`,
      conclusion: `<p>In conclusion, this research provides valuable evidence supporting the main hypotheses. The findings have practical implications for future work in ${field}. Continued investigation in this area will enhance our theoretical understanding and practical applications.</p>`,
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
    const field = this.currentConfig.field || 'the Field';
    const templates = [
      `Advanced Studies in ${field}: A Comprehensive Analysis`,
      `Investigating Key Phenomena in ${field} Research`,
      `Novel Approaches to ${field}: Methodology and Applications`,
      `Contemporary Perspectives on ${field}: Theory and Practice`,
      `Analytical Framework for ${field} Research Development`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateAuthors(data) {
    if (this.currentConfig.authors) return this.currentConfig.authors;
    const numAuthors = Math.floor(Math.random() * 3) + 1;
    const selected = [];
    while (selected.length < numAuthors) {
      const author = data.sampleAuthors[Math.floor(Math.random() * data.sampleAuthors.length)];
      if (!selected.includes(author)) selected.push(author);
    }
    return selected.join(', ');
  }

  generateInstitution(data) {
    return data.sampleInstitutions[Math.floor(Math.random() * data.sampleInstitutions.length)];
  }

  generateAbstract() {
    const field = this.currentConfig.field || 'this field';
    return `This study investigates fundamental principles within ${field} through comprehensive analysis and methodological innovation. The research employs advanced techniques to examine key variables and their relationships within established theoretical frameworks. Results demonstrate significant correlations and provide novel insights into the underlying mechanisms governing these phenomena. The findings contribute to current understanding while identifying important directions for future research. Statistical analysis confirms the validity of the proposed hypotheses and supports the development of enhanced methodological approaches. These discoveries have practical implications for both theoretical advancement and real-world applications in ${field}. The study concludes with recommendations for continued investigation and methodological refinement in this important area of research.`;
  }

  generateKeywords() {
    const field = (this.currentConfig.field || '').toLowerCase();
    const general = ['methodology', 'analysis', 'research', 'statistical significance', 'experimental design'];
    const fieldSpecific = {
      biology: ['molecular biology', 'genetics', 'cellular processes'],
      psychology: ['cognitive processes', 'behavioral analysis', 'psychological assessment'],
      'computer science': ['algorithms', 'data structures', 'computational complexity'],
      chemistry: ['chemical reactions', 'molecular structure', 'analytical chemistry'],
      physics: ['theoretical physics', 'experimental methods', 'quantum mechanics'],
    };
    const keywords = [...general, ...(fieldSpecific[field] || [])];
    return keywords.slice(0, 6).join(', ');
  }

  generateReferences(data) {
    const references = [];
    const numRefs = Math.floor(Math.random() * 5) + 8; // 8-12
    for (let i = 0; i < numRefs; i++) {
      const author = data.sampleAuthors[Math.floor(Math.random() * data.sampleAuthors.length)];
      const journal = data.journalNames[Math.floor(Math.random() * data.journalNames.length)];
      const year = 2018 + Math.floor(Math.random() * 7); // 2018-2024
      const volume = Math.floor(Math.random() * 50) + 1;
      const pages = `${100 + Math.floor(Math.random() * 500)}-${150 + Math.floor(Math.random() * 500)}`;
      const title = this.generateReferenceTitle();
      const cleanAuthor = author.replace('Dr. ', '').replace('Prof. ', '');
      references.push(`${cleanAuthor} (${year}). ${title} <em>${journal}</em>, ${volume}, ${pages}.`);
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
      'Systematic review of current analytical techniques.',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /* ---------------- Preview ---------------- */
  showPreview(paperHtml) {
    document.getElementById('processing-section').style.display = 'none';
    document.getElementById('preview-section').style.display = 'block';
    document.getElementById('paper-preview').innerHTML = paperHtml;
  }

  /* ---------------- Export helpers ---------------- */
  buildExportDocument({ includePrintButton } = {}) {
    const paperContent = document.getElementById('paper-preview').innerHTML;
    const printButton = includePrintButton
      ? `<button class="mobile-print-btn" onclick="window.print()">Print / Save PDF</button>
         <style>
           .mobile-print-btn { display: none; position: fixed; bottom: 20px; right: 20px;
             background: #21808d; color: white; border: none; padding: 12px 18px;
             border-radius: 8px; font-size: 15px; cursor: pointer; z-index: 1000; }
           @media screen and (max-width: 768px) { .mobile-print-btn { display: block; } }
         </style>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.currentConfig.title || 'Academic Paper'}</title>
  <style>${PAPER_EXPORT_CSS}</style>
</head>
<body>
  ${paperContent}
  ${printButton}
  <script>
    (function() {
      var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) { window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 400); }); }
    })();
  </script>
</body>
</html>`;
  }

  downloadPaper() {
    try {
      const html = this.buildExportDocument({ includePrintButton: false });
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentConfig.title || 'academic-paper'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML:', error);
      alert('Error downloading HTML file. Please try again.');
    }
  }

  downloadPaperAsPdf() {
    try {
      if (!this.currentPaperHtml) {
        alert('No paper available for download. Please generate a paper first.');
        return;
      }
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Please allow popups for this site to download the PDF.');
        return;
      }
      const html = this.buildExportDocument({ includePrintButton: true });
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  }

  copyPaper() {
    try {
      const text = document.getElementById('paper-preview').innerText;
      navigator.clipboard.writeText(text).then(() => alert('Paper content copied to clipboard!'));
    } catch (error) {
      console.error('Error copying paper:', error);
      alert('Error copying paper. Please try again.');
    }
  }

  /* ---------------- History ---------------- */
  saveToHistory() {
    try {
      const item = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        title: this.currentConfig.title || 'Untitled Paper',
        field: this.currentConfig.field,
        layout: this.currentConfig.layout,
        html: this.currentPaperHtml,
      };
      let history = JSON.parse(localStorage.getItem('paperCloakHistory') || '[]');
      history.unshift(item);
      history = history.slice(0, 50);
      localStorage.setItem('paperCloakHistory', JSON.stringify(history));
      this.loadHistory();
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  loadHistory() {
    try {
      const historyList = document.getElementById('history-list');
      if (!historyList) return;
      const history = JSON.parse(localStorage.getItem('paperCloakHistory') || '[]');

      if (history.length === 0) {
        historyList.innerHTML = `
          <div class="history-empty">
            <div class="empty-icon">📭</div>
            <h4>No conversions yet</h4>
            <p>Transform your first PDF to see it here!</p>
          </div>`;
        return;
      }

      historyList.innerHTML = history
        .map(
          (item) => `
        <div class="history-item" data-id="${item.id}">
          <div class="history-item-header">
            <h4>${item.title}</h4>
            <span class="history-date">${item.date} at ${item.time}</span>
          </div>
          <div class="history-item-details">
            <span class="history-field">${item.field}</span>
            <span class="history-layout">${item.layout === 'double' ? 'Two Column' : 'Single Column'}</span>
          </div>
          <div class="history-actions">
            <button class="btn btn--sm btn--secondary" onclick="app.viewHistoryItem(${item.id})">View</button>
            <button class="btn btn--sm btn--outline" onclick="app.deleteHistoryItem(${item.id})">Delete</button>
          </div>
        </div>`
        )
        .join('');
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  viewHistoryItem(id) {
    try {
      const history = JSON.parse(localStorage.getItem('paperCloakHistory') || '[]');
      const item = history.find((h) => h.id === id);
      if (!item) return;

      this.currentPaperHtml = item.html;
      this.currentConfig = { title: item.title, field: item.field, layout: item.layout };

      document.getElementById('history-tab').style.display = 'none';
      document.getElementById('history-tab').classList.remove('active');
      document.querySelector('[data-tab="history"]').classList.remove('active');
      document.querySelector('[data-tab="transform"]').classList.add('active');
      document.getElementById('transform-tab').style.display = 'block';
      document.getElementById('transform-tab').classList.add('active');

      ['upload-section', 'upload-progress', 'config-section', 'processing-section'].forEach((id2) => {
        const el = document.getElementById(id2);
        if (el) el.style.display = 'none';
      });
      document.getElementById('preview-section').style.display = 'block';
      document.getElementById('paper-preview').innerHTML = item.html;
    } catch (error) {
      console.error('Error viewing history item:', error);
    }
  }

  deleteHistoryItem(id) {
    try {
      if (!confirm('Are you sure you want to delete this item?')) return;
      let history = JSON.parse(localStorage.getItem('paperCloakHistory') || '[]');
      history = history.filter((item) => item.id !== id);
      localStorage.setItem('paperCloakHistory', JSON.stringify(history));
      this.loadHistory();
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  }

  clearHistory() {
    try {
      if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) return;
      localStorage.removeItem('paperCloakHistory');
      this.loadHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /* ---------------- Reset ---------------- */
  resetApp() {
    try {
      this.pdfText = '';
      this.currentConfig = {};
      this.currentPaperHtml = '';

      document.getElementById('upload-section').style.display = 'block';
      ['upload-progress', 'config-section', 'processing-section', 'preview-section'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      const titleInput = document.getElementById('paper-title');
      const authorInput = document.getElementById('author-names');
      if (titleInput) titleInput.value = '';
      if (authorInput) authorInput.value = '';

      this.resetProgress();
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PaperCloak();
});
