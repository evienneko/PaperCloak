class PaperCloak {
  constructor() {
    this.pdfText = '';
    this.currentConfig = {};
    this.currentPaperHtml = '';
    this.currentTheme = localStorage.getItem('paperCloak_theme') || 'light';
    this.initializeApp();
  }

  initializeApp() {
    this.setupPdfJs();
    this.setupEventListeners();
    this.setupTabNavigation();
    this.setupTheme();
    this.loadHistory();
  }

  setupPdfJs() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  setupTheme() {
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
      button.addEventListener('click', e => {
        e.preventDefault();
        const tabName = button.getAttribute('data-tab');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => {
          content.classList.remove('active');
          content.style.display = 'none';
        });
        button.classList.add('active');
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
          targetTab.classList.add('active');
          targetTab.style.display = 'block';
        }
        if (tabName === 'history') {
          this.loadHistory();
        }
      });
    });
  }

  setupEventListeners() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('pdf-input')?.addEventListener('change', (e) => this.handleFileSelect(e));
    document.getElementById('upload-area')?.addEventListener('click', () => this.triggerFileInput());
    document.getElementById('transform-btn')?.addEventListener('click', () => this.transformToPaper());
    document.getElementById('new-upload-btn')?.addEventListener('click', () => this.resetApp());
    document.getElementById('download-btn')?.addEventListener('click', () => this.downloadPaper());
    document.getElementById('copy-btn')?.addEventListener('click', () => this.copyPaper());
    document.getElementById('download-pdf-btn')?.addEventListener('click', () => this.downloadPaperAsPdf());
  }

  triggerFileInput() {
    document.getElementById('pdf-input')?.click();
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    this.pdfText = file ? 'Simulated PDF Extraction Text' : '';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('config-section').style.display = 'block';
  }

  transformToPaper() {
    if (!this.pdfText.trim()) {
      alert('No content available. Please upload a PDF.');
      return;
    }
    document.getElementById('processing-section').style.display = 'block';
    document.getElementById('config-section').style.display = 'none';
    this.currentConfig = {
      title: document.getElementById('paper-title').value.trim(),
      authors: document.getElementById('author-names').value.trim(),
      field: document.getElementById('research-field').value,
      layout: document.querySelector('input[name="layout"]:checked').value,
    };
    setTimeout(() => {
      this.showPreview(this.generateAcademicPaper());
      document.getElementById('processing-section').style.display = 'none';
    }, 1200);
  }

  generateAcademicPaper() {
    const layoutClass =
      this.currentConfig.layout === 'double'
        ? 'academic-paper two-column'
        : 'academic-paper single-column';

    return `
      <h1 class="title">${this.currentConfig.title || 'Untitled Paper'}</h1>
      <div class="authors">${this.currentConfig.authors || 'Anonymous Authors'}</div>
      <section class="abstract"><strong>Abstract:</strong> This is a sample abstract text.</section>
      <section class="keywords">Keywords: sample, academic, paper, PDF</section>
      <h2 class="section-title">Introduction</h2>
      <div class="section-content">This is a sample introduction section content.</div>
      <h2 class="section-title">Methods</h2>
      <div class="section-content">Methods section here.</div>
      <h2 class="section-title">Results</h2>
      <div class="section-content">Results section here.</div>
      <h2 class="section-title">Discussion</h2>
      <div class="section-content">Discussion section here.</div>
      <h2 class="section-title">References</h2>
      <div class="references">
        <div class="reference-item">[1] Reference details as sample.</div>
      </div>
    `;
  }

  showPreview(html) {
    document.getElementById('preview-section').style.display = 'block';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('config-section').style.display = 'none';
    const paperContainer = document.getElementById('paper-container');
    const layout = this.currentConfig.layout;
    paperContainer.className =
      layout === 'double' ? 'academic-paper two-column' : 'academic-paper single-column';
    paperContainer.innerHTML = html;
  }

  resetApp() {
    this.pdfText = '';
    this.currentConfig = {};
    this.currentPaperHtml = '';
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('config-section').style.display = 'none';
    document.getElementById('pdf-input').value = '';
  }

  downloadPaper() { alert('Download Text! (implementation omitted)'); }
  copyPaper() { alert('Copied! (implementation omitted)'); }
  downloadPaperAsPdf() { alert('Download PDF! (implementation omitted)'); }
  loadHistory() { document.getElementById('history-list').innerHTML = 'No history (mockup)'; }
}

window.onload = () => new PaperCloak();
