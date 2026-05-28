// PaperCloak Application JavaScript

class PaperCloak {
  constructor() {
    this.pdfText = "";
    this.currentConfig = {};
    this.currentPaperHtml = "";
    this.currentTheme =
      localStorage.getItem("paperCloak_theme") || "light";

    console.log("PaperCloak initialized");
    this.initializeApp();
  }

  initializeApp() {
    try {
      this.setupPdfJs();
      this.setupEventListeners();
      this.setupTabNavigation();
      this.setupTheme();
      this.loadHistory();
      console.log("App initialization complete");
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  }

  setupPdfJs() {
    if (typeof pdfjsLib !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  // THEME

  setupTheme() {
    document.body.setAttribute("data-theme", this.currentTheme);
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    this.updateThemeIcon();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", this.currentTheme);
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    localStorage.setItem("paperCloak_theme", this.currentTheme);
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const themeIcon = document.querySelector(".theme-icon");
    if (themeIcon) {
      themeIcon.textContent =
        this.currentTheme === "light" ? "🌙" : "☀️";
    }
  }

  // TABS

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const tabName = button.getAttribute("data-tab");
        console.log("Tab clicked:", tabName);

        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => {
          content.classList.remove("active");
          content.style.display = "none";
        });

        button.classList.add("active");
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
          targetTab.classList.add("active");
          targetTab.style.display = "block";
        }

        if (tabName === "history") {
          this.loadHistory();
        }
      });
    });
  }

  // EVENT LISTENERS

  setupEventListeners() {
    try {
      console.log("Setting up event listeners...");

      const appLogo = document.getElementById("app-logo");
      if (appLogo) {
        appLogo.addEventListener("click", () => this.goToHome());
      }

      const themeToggle = document.getElementById("theme-toggle");
      if (themeToggle) {
        themeToggle.addEventListener("click", () => this.toggleTheme());
      }

      const pdfInput = document.getElementById("pdf-input");
      if (pdfInput) {
        pdfInput.onchange = (e) => this.handleFileSelect(e);
      }

      const uploadArea = document.getElementById("upload-area");
      if (uploadArea) {
        uploadArea.onclick = () => this.triggerFileInput();
        uploadArea.ondragover = (e) => this.handleDragOver(e);
        uploadArea.ondragleave = (e) => this.handleDragLeave(e);
        uploadArea.ondrop = (e) => this.handleDrop(e);
      }

      const transformBtn = document.getElementById("transform-btn");
      if (transformBtn) {
        transformBtn.onclick = () => this.transformToPaper();
      }

      const newUploadBtn = document.getElementById("new-upload-btn");
      if (newUploadBtn) {
        newUploadBtn.onclick = () => this.resetApp();
      }

      const downloadBtn = document.getElementById("download-btn");
      if (downloadBtn) {
        downloadBtn.onclick = () => this.downloadPaper();
      }

      const copyBtn = document.getElementById("copy-btn");
      if (copyBtn) {
        copyBtn.onclick = () => this.copyPaper();
      }

      const downloadPdfBtn = document.getElementById("download-pdf-btn");
      if (downloadPdfBtn) {
        downloadPdfBtn.onclick = () => this.downloadPaperAsPdf();
      }

      const clearHistoryBtn = document.getElementById("clear-history-btn");
      if (clearHistoryBtn) {
        clearHistoryBtn.onclick = () => this.clearHistory();
      }

      console.log("Event listeners set up successfully");
    } catch (error) {
      console.error("Error setting up event listeners:", error);
    }
  }

  // NAVIGATION

  goToHome() {
    try {
      console.log("Going to home...");
      this.resetApp();

      const transformTab = document.querySelector("[data-tab='transform']");
      const historyTab = document.querySelector("[data-tab='history']");
      if (transformTab && historyTab) {
        historyTab.classList.remove("active");
        const historyContent = document.getElementById("history-tab");
        if (historyContent) {
          historyContent.style.display = "none";
          historyContent.classList.remove("active");
        }

        transformTab.classList.add("active");
        const transformContent = document.getElementById("transform-tab");
        if (transformContent) {
          transformContent.style.display = "block";
          transformContent.classList.add("active");
        }
      }
    } catch (error) {
      console.error("Error going to home:", error);
    }
  }

  // FILE HANDLING

  triggerFileInput() {
    try {
      console.log("Triggering file input...");
      const pdfInput = document.getElementById("pdf-input");
      if (pdfInput) {
        pdfInput.value = "";
        pdfInput.click();
      } else {
        console.error("PDF input not found");
      }
    } catch (error) {
      console.error("Error triggering file input:", error);
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    const uploadArea = document.getElementById("upload-area");
    if (uploadArea) {
      uploadArea.classList.add("dragover");
    }
  }

  handleDragLeave(e) {
    e.preventDefault();
    const uploadArea = document.getElementById("upload-area");
    if (uploadArea) {
      uploadArea.classList.remove("dragover");
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const uploadArea = document.getElementById("upload-area");
    if (uploadArea) {
      uploadArea.classList.remove("dragover");
    }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  handleFileSelect(e) {
    console.log("File selected");
    const file = e.target.files[0];
    if (file) {
      console.log("Processing file:", file.name);
      this.processFile(file);
    }
  }

  async processFile(file) {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    try {
      this.showProgress();
      await this.extractPdfText(file);
      this.showConfigSection();
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Error processing PDF. Please try again.");
      this.resetProgress();
    }
  }

  showProgress() {
    try {
      console.log("Showing progress...");
      document.getElementById("upload-section").style.display = "none";

      const progressSection = document.getElementById("upload-progress");
      if (progressSection) {
        progressSection.style.display = "block";
      }

      const progressFill = document.getElementById("progress-fill");
      const progressText = document.getElementById("progress-text");
      let progress = 0;

      const interval = setInterval(() => {
        progress += 10;

        if (progressFill) {
          progressFill.style.width = progress + "%";
        }

        if (progressText) {
          if (progress === 30) {
            progressText.textContent = "Extracting text...";
          } else if (progress === 60) {
            progressText.textContent = "Processing content...";
          } else if (progress === 90) {
            progressText.textContent = "Almost done...";
          }
        }

        if (progress >= 100) {
          clearInterval(interval);
          if (progressText) {
            progressText.textContent = "Complete!";
          }
          setTimeout(() => {
            this.showConfigSection();
          }, 500);
        }
      }, 200);
    } catch (error) {
      console.error("Error showing progress:", error);
    }
  }

  resetProgress() {
    document.getElementById("upload-section").style.display = "block";
    document.getElementById("upload-progress").style.display = "none";

    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    if (progressFill) progressFill.style.width = "0%";
    if (progressText) progressText.textContent = "Uploading...";
  }

  async extractPdfText(file) {
    if (typeof pdfjsLib === "undefined") {
      throw new Error("PDF.js not loaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    this.pdfText = fullText.trim();
  }

  showConfigSection() {
    try {
      console.log("Showing config section...");
      const sections = [
        "upload-progress",
        "upload-section",
        "processing-section",
        "preview-section",
      ];

      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.style.display = "none";
        }
      });

      const configSection = document.getElementById("config-section");
      if (configSection) {
        configSection.style.display = "block";
        console.log("Config section displayed");
      } else {
        console.error("Config section not found");
      }
    } catch (error) {
      console.error("Error showing config section:", error);
    }
  }

  // TRANSFORM

  async transformToPaper() {
    try {
      console.log("Transforming to paper...");
      if (!this.pdfText || !this.pdfText.trim()) {
        alert("No content available. Please upload a PDF.");
        return;
      }

      this.showProcessing();

      this.currentConfig = {
        title: document.getElementById("paper-title").value.trim(),
        authors: document.getElementById("author-names").value.trim(),
        field: document.getElementById("research-field").value,
        layout: document.querySelector("input[name='layout']:checked")
          .value,
      };

      console.log("Current config:", this.currentConfig);

      await this.sleep(3000);

      const paperHtml = this.generateAcademicPaper();
      this.currentPaperHtml = paperHtml;
      this.showPreview(paperHtml);
      this.saveToHistory();
    } catch (error) {
      console.error("Error transforming to paper:", error);
      alert("Error generating paper. Please try again.");
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showProcessing() {
    try {
      console.log("Showing processing...");
      document.getElementById("config-section").style.display = "none";
      document.getElementById("processing-section").style.display =
        "block";

      const statuses = [
        "Analyzing content structure...",
        "Formatting academic sections...",
        "Generating citations...",
        "Applying layout template...",
        "Finalizing document...",
      ];
      let statusIndex = 0;
      const statusElement = document.getElementById("processing-status");

      const statusInterval = setInterval(() => {
        if (statusElement && statusIndex < statuses.length) {
          statusElement.textContent = statuses[statusIndex];
          statusIndex++;
        } else {
          clearInterval(statusInterval);
        }
      }, 600);
    } catch (error) {
      console.error("Error showing processing:", error);
    }
  }

  // CORE PAPER GENERATION
  // This preserves your original academic-paper structure and styling.

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

      const sectionsHtml = Object.keys(sections)
        .map((type) => {
          const titleCase =
            type.charAt(0).toUpperCase() + type.slice(1);
          return `
        <div class="section">
          <h2>${titleCase}</h2>
          <div class="section-content">
            ${sections[type]}
          </div>
        </div>
      `;
        })
        .join("");

      const referencesHtml = references
        .map((ref) => `<li>${ref}</li>`)
        .join("");

      const layoutClass =
        this.currentConfig.layout === "double"
          ? "two-column"
          : "single-column";

      // IMPORTANT: matches your CSS selectors in style-3.css
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

          ${sectionsHtml}

          <div class="references">
            <h2>References</h2>
            <ol>
              ${referencesHtml}
            </ol>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error generating academic paper", error);
      return `<div class="error">Error generating paper content. Please try again.</div>`;
    }
  }

  generatePaperData() {
    return {
      sampleAuthors: [
        "Dr. Sarah Johnson",
        "Prof. Michael Chen",
        "Dr. Emily Rodriguez",
        "Prof. David Thompson",
        "Dr. Amanda Wilson",
        "Prof. James Park",
        "Dr. Lisa Anderson",
        "Prof. Robert Kim",
      ],
      sampleInstitutions: [
        "Department of Research, University of Excellence",
        "Institute for Advanced Studies, Metropolitan University",
        "School of Sciences, Academic Research Center",
        "Department of Innovation, Technology Institute",
        "Center for Research Excellence, State University",
      ],
      journalNames: [
        "Journal of Advanced Research",
        "International Review of Studies",
        "Quarterly Journal of Science",
        "Annual Review of Research",
        "Journal of Contemporary Analysis",
        "International Journal of Innovation",
        "Research Quarterly Review",
        "Journal of Applied Sciences",
      ],
    };
  }

  extractSectionsFromPdf() {
    if (!this.pdfText) {
      return this.generateDefaultSections();
    }

    const paragraphs = this.pdfText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 50);

    if (paragraphs.length === 0) {
      return this.generateDefaultSections();
    }

    const sectionTypes = [
      "introduction",
      "methodology",
      "results",
      "discussion",
      "conclusion",
    ];

    const sections = {};
    sectionTypes.forEach((type, index) => {
      const startIndex = Math.floor(
        (paragraphs.length / sectionTypes.length) * index
      );
      const endIndex = Math.floor(
        (paragraphs.length / sectionTypes.length) * (index + 1)
      );

      const sectionParagraphs = paragraphs.slice(startIndex, endIndex);
      if (sectionParagraphs.length > 0) {
        sections[type] = sectionParagraphs
          .map((p) => `<p>${this.preserveFormatting(p.trim())}</p>`)
          .join("");
      }
    });

    if (Object.keys(sections).length === 0) {
      return this.generateDefaultSections();
    }

    return sections;
  }

  generateDefaultSections() {
    const sectionTypes = [
      "introduction",
      "methodology",
      "results",
      "discussion",
      "conclusion",
    ];
    const sections = {};
    sectionTypes.forEach((type) => {
      sections[type] = this.generateDefaultSectionContent(type);
    });
    return sections;
  }

  generateDefaultSectionContent(sectionType) {
    const field = this.currentConfig.field || "this field";

    const templates = {
      introduction: `
        <p>This study investigates important aspects within the field of ${field}. Current research has identified several key areas requiring further investigation. The primary objective of this research is to contribute to our understanding of these complex phenomena.</p>
        <p>The methodology employed in this study builds upon established frameworks while incorporating novel approaches to data analysis.</p>
      `,
      methodology: `
        <p>The experimental design incorporated systematic data collection with careful attention to established protocols. Data collection procedures followed standard guidelines for research in ${field}. Statistical analysis was conducted using appropriate software packages.</p>
      `,
      results: `
        <p>The analysis revealed significant relationships between key variables. Results indicate patterns consistent with theoretical predictions. Statistical evaluation established clear trends supporting the primary hypothesis of this investigation.</p>
      `,
      discussion: `
        <p>These findings contribute significantly to our understanding of the subject matter. The results align with previous research while revealing novel insights. The implications of these discoveries extend beyond the immediate scope of this study.</p>
      `,
      conclusion: `
        <p>In conclusion, this research provides valuable evidence supporting the main hypotheses. The findings have practical implications for future work in ${field}. Continued investigation in this area will enhance our theoretical understanding and practical applications.</p>
      `,
    };

    return (
      templates[sectionType] ||
      `<p>Content analysis and interpretation will be presented in this section.</p>`
    );
  }

  preserveFormatting(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  }

  generateTitle() {
    const field = this.currentConfig.field || "Research";
    const titleTemplates = [
      `Advanced Studies in ${field}: A Comprehensive Analysis`,
      `Investigating Key Phenomena in ${field} Research`,
      `Novel Approaches to ${field} Methodology and Applications`,
      `Contemporary Perspectives on ${field} Theory and Practice`,
      `Analytical Framework for ${field} Research Development`,
    ];
    return titleTemplates[
      Math.floor(Math.random() * titleTemplates.length)
    ];
  }

  generateAuthors(data) {
    if (this.currentConfig.authors) {
      return this.currentConfig.authors;
    }

    const authors = data.sampleAuthors;
    const numAuthors = Math.floor(Math.random() * 3) + 1;

    const selected = [];
    while (selected.length < numAuthors) {
      const author = authors[Math.floor(Math.random() * authors.length)];
      if (!selected.includes(author)) {
        selected.push(author);
      }
    }

    return selected.join(", ");
  }

  generateInstitution(data) {
    return data.sampleInstitutions[
      Math.floor(Math.random() * data.sampleInstitutions.length)
    ];
  }

  generateAbstract() {
    const field = this.currentConfig.field || "this field";
    return `This study investigates fundamental principles within ${field} through comprehensive analysis and methodological innovation. The research employs advanced techniques to examine key variables and their relationships within established theoretical frameworks. Results demonstrate significant correlations and provide novel insights into the underlying mechanisms governing these phenomena. The findings contribute to current understanding while identifying important directions for future research. Statistical analysis confirms the validity of the proposed hypotheses and supports the development of enhanced methodological approaches. These discoveries have practical implications for both theoretical advancement and real-world applications in ${field}. The study concludes with recommendations for continued investigation and methodological refinement in this important area of research.`;
  }

  generateKeywords() {
    const field = (this.currentConfig.field || "").toLowerCase();

    const generalKeywords = [
      "methodology",
      "analysis",
      "research",
      "statistical significance",
      "experimental design",
    ];

    const fieldSpecific = {
      biology: [
        "molecular biology",
        "genetics",
        "cellular processes",
      ],
      "computer science": [
        "algorithms",
        "data structures",
        "computational complexity",
      ],
      chemistry: ["chemical reactions", "molecular structure"],
      physics: ["theoretical physics", "experimental methods"],
    };

    const keywords = [...generalKeywords];
    if (fieldSpecific[field]) {
      keywords.push(...fieldSpecific[field]);
    }

    return keywords.slice(0, 6).join(", ");
  }

  generateReferences(data) {
    const references = [];
    const numRefs = Math.floor(Math.random() * 4) + 8; // 8–11

    for (let i = 0; i < numRefs; i++) {
      const author =
        data.sampleAuthors[
          Math.floor(Math.random() * data.sampleAuthors.length)
        ]
          .replace("Dr. ", "")
          .replace("Prof. ", "");
      const journal =
        data.journalNames[
          Math.floor(Math.random() * data.journalNames.length)
        ];
      const year = 2018 + Math.floor(Math.random() * 7);
      const volume = Math.floor(Math.random() * 50) + 1;
      const pagesStart = Math.floor(Math.random() * 300) + 1;
      const pagesEnd = pagesStart + Math.floor(Math.random() * 10) + 5;

      const title = this.generateReferenceTitle();
      const ref = `${author} (${year}). ${title} ${journal}, ${volume}, ${pagesStart}-${pagesEnd}.`;
      references.push(ref);
    }

    return references;
  }

  generateReferenceTitle() {
    const titles = [
      "Advances in theoretical frameworks and practical applications.",
      "Methodological innovations in contemporary research practices.",
      "Statistical approaches to complex data analysis systems.",
      "Comprehensive analysis of experimental methodologies and outcomes.",
      "Novel perspectives on established research paradigms.",
      "Quantitative assessment of theoretical model validation.",
      "Empirical investigation of fundamental research principles.",
      "Systematic review of current analytical techniques.",
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  // PREVIEW

  showPreview(paperHtml) {
    try {
      console.log("Showing preview...");
      document.getElementById("processing-section").style.display =
        "none";
      document.getElementById("preview-section").style.display =
        "block";

      const container = document.getElementById("paper-preview");
      container.innerHTML = paperHtml;

      console.log("Preview displayed");
    } catch (error) {
      console.error("Error showing preview", error);
    }
  }

  // DOWNLOADS – now reuse preview HTML + style.css

  downloadPaper() {
    try {
      if (!this.currentPaperHtml) {
        alert("No paper available. Please generate a paper first.");
        return;
      }

      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.currentConfig.title || "Academic Paper"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>
<body data-theme="light">
  ${this.currentPaperHtml}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        (this.currentConfig.title || "academic-paper") + ".html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading HTML", error);
      alert("Error downloading HTML file. Please try again.");
    }
  }

  async downloadPaperAsPdf() {
    try {
      console.log("Starting PDF download...");
      if (!this.currentPaperHtml) {
        alert(
          "No paper available for download. Please generate a paper first."
        );
        return;
      }

      const printWindow = window.open(
        "",
        "_blank",
        "width=900,height=700"
      );
      if (!printWindow) {
        alert("Please allow popups for this site to download the PDF.");
        return;
      }

      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.currentConfig.title || "Academic Paper"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>
<body data-theme="light">
  ${this.currentPaperHtml}
  <button class="mobile-print-btn" onclick="window.print()">Print / Save PDF</button>
  <script>
    window.addEventListener("load", function () {
      var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (!isMobile) {
        setTimeout(function () { window.print(); }, 500);
      }
    });
  </script>
</body>
</html>`;

      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();

      console.log("PDF download window opened");
    } catch (error) {
      console.error("Error downloading PDF", error);
      alert("Error downloading PDF. Please try again.");
    }
  }

  copyPaper() {
    try {
      if (!this.currentPaperHtml) {
        alert("No paper available to copy.");
        return;
      }
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = this.currentPaperHtml;
      const textContent = tempDiv.innerText;
      navigator.clipboard.writeText(textContent).then(
        () => {
          alert("Paper content copied to clipboard!");
        },
        (err) => {
          console.error("Error copying paper", err);
          alert("Error copying paper. Please try again.");
        }
      );
    } catch (error) {
      console.error("Error copying paper", error);
      alert("Error copying paper. Please try again.");
    }
  }

  // HISTORY

  saveToHistory() {
    try {
      const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        title: this.currentConfig.title || "Untitled Paper",
        field: this.currentConfig.field,
        layout: this.currentConfig.layout,
        html: this.currentPaperHtml,
      };

      let history =
        JSON.parse(localStorage.getItem("paperCloak_history")) || [];
      history.unshift(historyItem);
      history = history.slice(0, 50);
      localStorage.setItem("paperCloak_history", JSON.stringify(history));

      this.loadHistory();
    } catch (error) {
      console.error("Error saving to history", error);
    }
  }

  loadHistory() {
    try {
      const historyList = document.getElementById("history-list");
      if (!historyList) return;

      const history =
        JSON.parse(localStorage.getItem("paperCloak_history")) || [];

      if (history.length === 0) {
        historyList.innerHTML = `
          <div class="history-empty">
            <div class="empty-icon">🗂️</div>
            <h4>No conversions yet</h4>
            <p>Transform your first PDF to see it here!</p>
          </div>
        `;
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
            <span class="history-field">Field: ${item.field}</span>
            <span class="history-layout">Layout: ${item.layout}</span>
          </div>
          <div class="history-actions">
            <button class="btn btn--sm" onclick="app.viewHistoryItem(${item.id})">View</button>
            <button class="btn btn--sm btn--outline" onclick="app.deleteHistoryItem(${item.id})">Delete</button>
          </div>
        </div>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error loading history", error);
    }
  }

  viewHistoryItem(id) {
    try {
      const history =
        JSON.parse(localStorage.getItem("paperCloak_history")) || [];
      const item = history.find((h) => h.id === id);
      if (!item) return;

      this.currentPaperHtml = item.html;
      this.currentConfig = {
        title: item.title,
        field: item.field,
        layout: item.layout,
      };

      const historyTab = document.getElementById("history-tab");
      if (historyTab) {
        historyTab.style.display = "none";
        historyTab.classList.remove("active");
      }

      const previewSection = document.getElementById("preview-section");
      if (previewSection) {
        previewSection.style.display = "block";
      }

      const transformTab = document.querySelector("[data-tab='transform']");
      const historyTabButton = document.querySelector(
        "[data-tab='history']"
      );
      if (historyTabButton && transformTab) {
        historyTabButton.classList.remove("active");
        transformTab.classList.add("active");
      }

      const transformContent = document.getElementById("transform-tab");
      if (transformContent) {
        transformContent.style.display = "block";
        transformContent.classList.add("active");
      }

      const container = document.getElementById("paper-preview");
      if (container) {
        container.innerHTML = item.html;
      }
    } catch (error) {
      console.error("Error viewing history item", error);
    }
  }

  deleteHistoryItem(id) {
    try {
      if (!confirm("Are you sure you want to delete this item?")) return;

      let history =
        JSON.parse(localStorage.getItem("paperCloak_history")) || [];
      history = history.filter((item) => item.id !== id);
      localStorage.setItem("paperCloak_history", JSON.stringify(history));
      this.loadHistory();
    } catch (error) {
      console.error("Error deleting history item", error);
    }
  }

  clearHistory() {
    try {
      if (
        !confirm(
          "Are you sure you want to clear all history? This cannot be undone."
        )
      )
        return;

      localStorage.removeItem("paperCloak_history");
      this.loadHistory();
    } catch (error) {
      console.error("Error clearing history", error);
    }
  }

  // RESET

  resetApp() {
    try {
      console.log("Resetting app...");
      this.pdfText = "";
      this.currentConfig = {};
      this.currentPaperHtml = "";

      document.getElementById("upload-section").style.display =
        "block";
      const sections = [
        "upload-progress",
        "config-section",
        "processing-section",
        "preview-section",
      ];
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.style.display = "none";
        }
      });

      const form = document.getElementById("config-form");
      if (form) form.reset();

      this.resetProgress();
      console.log("App reset complete");
    } catch (error) {
      console.error("Error resetting app", error);
    }
  }
}

// Initialize the application
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new PaperCloak();
});
