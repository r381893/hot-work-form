/**
 * 動火作業單 - 應用程式邏輯
 * Features: Form management, LocalStorage persistence, PDF export (individual & all)
 */

// ========================================
// Constants & State
// ========================================
const STORAGE_KEY = 'hotwork_forms_v2';
let currentFormId = null;

// ========================================
// DOM Elements
// ========================================
const elements = {
    // Selectors & Buttons
    savedFormsList: document.getElementById('savedFormsList'),
    newFormBtn: document.getElementById('newFormBtn'),
    saveBtn: document.getElementById('saveBtn'),
    exportAllBtn: document.getElementById('exportAllBtn'),
    exportAllImageBtn: document.getElementById('exportAllImageBtn'),
    deleteBtn: document.getElementById('deleteBtn'),

    // Before (動火前)
    beforeDate: document.getElementById('beforeDate'),
    beforeCompany: document.getElementById('beforeCompany'),
    beforeWorkName: document.getElementById('beforeWorkName'),
    beforeWorkLocation: document.getElementById('beforeWorkLocation'),
    beforeWorkTimeStart: document.getElementById('beforeWorkTimeStart'),
    beforeWorkTimeEnd: document.getElementById('beforeWorkTimeEnd'),
    beforeWorkContent: document.getElementById('beforeWorkContent'),

    // During (動火中)
    duringDate: document.getElementById('duringDate'),
    duringCompany: document.getElementById('duringCompany'),
    duringWorkName: document.getElementById('duringWorkName'),
    duringWorkLocation: document.getElementById('duringWorkLocation'),
    duringWorkTimeStart: document.getElementById('duringWorkTimeStart'),
    duringWorkTimeEnd: document.getElementById('duringWorkTimeEnd'),
    duringWorkContent: document.getElementById('duringWorkContent'),

    // After (動火後)
    afterDate: document.getElementById('afterDate'),
    afterCompany: document.getElementById('afterCompany'),
    afterWorkName: document.getElementById('afterWorkName'),
    afterWorkLocation: document.getElementById('afterWorkLocation'),
    afterWorkTimeStart: document.getElementById('afterWorkTimeStart'),
    afterWorkTimeEnd: document.getElementById('afterWorkTimeEnd'),
    afterWorkContent: document.getElementById('afterWorkContent'),
    afterCompleteTime: document.getElementById('afterCompleteTime'),

    // Toast
    toast: document.getElementById('toast')
};

// ========================================
// Utility Functions
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Update complete time display
function updateCompleteTimeDisplay() {
    const display = document.querySelector('.complete-time-display');
    if (display) {
        display.textContent = elements.afterCompleteTime.value || '_________';
    }
}

// ========================================
// Storage Functions
// ========================================
function getAllForms() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveAllForms(forms) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

function getForm(id) {
    const forms = getAllForms();
    return forms[id] || null;
}

function saveForm(id, formData) {
    const forms = getAllForms();
    forms[id] = {
        ...formData,
        updatedAt: new Date().toISOString()
    };
    saveAllForms(forms);
}

function deleteForm(id) {
    const forms = getAllForms();
    delete forms[id];
    saveAllForms(forms);
}

// ========================================
// Form Data Collection & Population
// ========================================

// Helper to get work time from start/end selectors
function getWorkTime(startEl, endEl) {
    const start = startEl.value;
    const end = endEl.value;
    if (start && end) {
        return `${start}-${end}`;
    } else if (start) {
        return start;
    } else if (end) {
        return end;
    }
    return '';
}

// Helper to set work time to start/end selectors
function setWorkTime(startEl, endEl, timeStr) {
    if (!timeStr) {
        startEl.value = '';
        endEl.value = '';
        return;
    }
    const parts = timeStr.split('-');
    if (parts.length === 2) {
        startEl.value = parts[0].trim();
        endEl.value = parts[1].trim();
    } else {
        startEl.value = timeStr;
        endEl.value = '';
    }
}

function collectFormData() {
    return {
        before: {
            date: elements.beforeDate.value,
            company: elements.beforeCompany.value,
            workName: elements.beforeWorkName.value,
            workLocation: elements.beforeWorkLocation.value,
            workTime: getWorkTime(elements.beforeWorkTimeStart, elements.beforeWorkTimeEnd),
            workContent: elements.beforeWorkContent.value
        },
        during: {
            date: elements.duringDate.value,
            company: elements.duringCompany.value,
            workName: elements.duringWorkName.value,
            workLocation: elements.duringWorkLocation.value,
            workTime: getWorkTime(elements.duringWorkTimeStart, elements.duringWorkTimeEnd),
            workContent: elements.duringWorkContent.value
        },
        after: {
            date: elements.afterDate.value,
            company: elements.afterCompany.value,
            workName: elements.afterWorkName.value,
            workLocation: elements.afterWorkLocation.value,
            workTime: getWorkTime(elements.afterWorkTimeStart, elements.afterWorkTimeEnd),
            workContent: elements.afterWorkContent.value,
            completeTime: elements.afterCompleteTime.value
        },
        createdAt: currentFormId ? (getForm(currentFormId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
}

function populateForm(formData) {
    if (!formData) return;

    // Before
    elements.beforeDate.value = formData.before?.date || '';
    elements.beforeCompany.value = formData.before?.company || '南部發電廠機械組修配課';
    elements.beforeWorkName.value = formData.before?.workName || '';
    elements.beforeWorkLocation.value = formData.before?.workLocation || '';
    setWorkTime(elements.beforeWorkTimeStart, elements.beforeWorkTimeEnd, formData.before?.workTime || '');
    elements.beforeWorkContent.value = formData.before?.workContent || '';

    // During
    elements.duringDate.value = formData.during?.date || '';
    elements.duringCompany.value = formData.during?.company || '南部發電廠機械組修配課';
    elements.duringWorkName.value = formData.during?.workName || '';
    elements.duringWorkLocation.value = formData.during?.workLocation || '';
    setWorkTime(elements.duringWorkTimeStart, elements.duringWorkTimeEnd, formData.during?.workTime || '');
    elements.duringWorkContent.value = formData.during?.workContent || '';

    // After
    elements.afterDate.value = formData.after?.date || '';
    elements.afterCompany.value = formData.after?.company || '南部發電廠機械組修配課';
    elements.afterWorkName.value = formData.after?.workName || '';
    elements.afterWorkLocation.value = formData.after?.workLocation || '';
    setWorkTime(elements.afterWorkTimeStart, elements.afterWorkTimeEnd, formData.after?.workTime || '');
    elements.afterWorkContent.value = formData.after?.workContent || '';
    elements.afterCompleteTime.value = formData.after?.completeTime || '';

    updateCompleteTimeDisplay();
}

function clearForm() {
    const defaultCompany = '南部發電廠機械組修配課';

    elements.beforeDate.value = '';
    elements.beforeCompany.value = defaultCompany;
    elements.beforeWorkName.value = '';
    elements.beforeWorkLocation.value = '';
    elements.beforeWorkTimeStart.value = '';
    elements.beforeWorkTimeEnd.value = '';
    elements.beforeWorkContent.value = '';

    elements.duringDate.value = '';
    elements.duringCompany.value = defaultCompany;
    elements.duringWorkName.value = '';
    elements.duringWorkLocation.value = '';
    elements.duringWorkTimeStart.value = '';
    elements.duringWorkTimeEnd.value = '';
    elements.duringWorkContent.value = '';

    elements.afterDate.value = '';
    elements.afterCompany.value = defaultCompany;
    elements.afterWorkName.value = '';
    elements.afterWorkLocation.value = '';
    elements.afterWorkTimeStart.value = '';
    elements.afterWorkTimeEnd.value = '';
    elements.afterWorkContent.value = '';
    elements.afterCompleteTime.value = '';

    updateCompleteTimeDisplay();
}

// ========================================
// Forms List Management
// ========================================
function updateFormsList() {
    const forms = getAllForms();
    elements.savedFormsList.innerHTML = '<option value="">-- 選擇已儲存的表單 --</option>';

    const sortedForms = Object.entries(forms).sort((a, b) => {
        return new Date(b[1].updatedAt) - new Date(a[1].updatedAt);
    });

    sortedForms.forEach(([id, form]) => {
        const option = document.createElement('option');
        option.value = id;
        const workName = form.before?.workName || form.during?.workName || '未命名';
        const date = new Date(form.updatedAt).toLocaleDateString('zh-TW');
        option.textContent = `${workName} - ${date}`;
        elements.savedFormsList.appendChild(option);
    });
}
// ========================================
// PDF Export Functions (Mobile-friendly direct download)
// ========================================

// ========================================
// PDF Export Functions (Using html2canvas + jspdf for reliable mobile download)
// ========================================

/**
 * Generate PDF from a DOM element
 * @param {HTMLElement} element - The element to render
 * @param {string} filename - The output filename
 */
async function generatePDF(element, filename) {
    const { jsPDF } = window.jspdf;

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            // Force A4 landscape dimensions (approx at 96dpi)
            // 297mm = 1122.5px, 210mm = 793.7px
            windowWidth: 1123,
            windowHeight: 794
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // A4 landscape size: 297mm x 210mm
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);

        return true;
    } catch (err) {
        console.error('PDF export failed:', err);
        throw err;
    }
}

/**
 * Create the printable element for export
 */
function createExportElement(section, sectionData, footerText) {
    const dateDisplay = formatDate(sectionData.date) || '________________';

    // Create a container that mimics the A4 landscape layout
    const container = document.createElement('div');
    container.style.cssText = `
        width: 297mm;
        height: 210mm;
        padding: 20mm;
        background: white;
        font-family: "DFKai-SB", "標楷體", "KaiTi", "楷体", "BiauKai", "Microsoft JhengHei", serif;
        box-sizing: border-box;
        position: relative;
        color: #000;
    `;

    container.innerHTML = `
        <div style="text-align: right; font-size: 24pt; font-weight: bold; margin-bottom: 30px; letter-spacing: 5px;">動火(${section})</div>
        
        <div style="font-size: 16pt; line-height: 2.2;">
            <div style="display: flex; margin-bottom: 5px;">
                <span style="font-weight: bold; width: 160px; flex-shrink: 0;">日期：</span>
                <span style="color: #0066cc;">${dateDisplay}</span>
            </div>
            <div style="display: flex; margin-bottom: 5px;">
                <span style="font-weight: bold; width: 160px; flex-shrink: 0;">公司名稱：</span>
                <span style="color: #0066cc;">${sectionData.company || ''}</span>
            </div>
            <div style="display: flex; margin-bottom: 5px;">
                <span style="font-weight: bold; width: 160px; flex-shrink: 0;">工作名稱：</span>
                <span style="color: #0066cc;">${sectionData.workName || ''}</span>
            </div>
            <div style="display: flex; margin-bottom: 5px;">
                <span style="font-weight: bold; width: 160px; flex-shrink: 0;">工作地點：</span>
                <span style="color: #0066cc;">${sectionData.workLocation || ''}</span>
            </div>
            <div style="display: flex; margin-bottom: 5px;">
                <span style="font-weight: bold; width: 160px; flex-shrink: 0;">作業時間：</span>
                <span style="color: #0066cc;">${sectionData.workTime || ''}</span>
            </div>
            <div style="display: flex; margin-bottom: 5px;">
                <span style="font-weight: bold; width: 160px; flex-shrink: 0;">動火作業內容：</span>
                <span style="color: #0066cc;">${sectionData.workContent || ''}</span>
            </div>
        </div>

        <div style="margin-top: 60px; font-size: 14pt; font-weight: bold; line-height: 1.5;">${footerText}</div>
    `;

    return container;
}

// Export single section as PDF
async function exportSectionPDF(section) {
    const formData = collectFormData();
    let sectionData, footerText, sectionLabel;

    switch (section) {
        case 'before':
            sectionData = formData.before;
            footerText = '動火前：氣體測定數值正常、已置備防火毯、滅火器.. 如附相片';
            sectionLabel = '前';
            break;
        case 'during':
            sectionData = formData.during;
            footerText = '動火中：檢附核准之動火許可單、現場電焊中，氣體連續偵測、已鋪設防火毯、火花無掉落情形.. 如附相片';
            sectionLabel = '中';
            break;
        case 'after':
            sectionData = formData.after;
            footerText = `動火後：現場作業已於<span style="color: #0066cc;">${formData.after.completeTime || '_________'}</span>完成，並完成環境整理無殘留火星，已填報火災預防收工前巡檢紀錄。如附相片`;
            sectionLabel = '後';
            break;
    }

    showToast('正在產生 PDF，請稍候...', 'info');
    const exportContainer = document.getElementById('export-container');
    exportContainer.innerHTML = ''; // Clear previous

    const content = createExportElement(sectionLabel, sectionData, footerText);
    exportContainer.appendChild(content);

    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const filename = `動火作業單-${sectionLabel}-${formatDate(sectionData.date) || 'unknown'}.pdf`;
        await generatePDF(exportContainer, filename);
        showToast('PDF 下載完成！', 'success');
    } catch (error) {
        showToast('PDF 產生失敗', 'error');
    } finally {
        exportContainer.innerHTML = ''; // Cleanup
    }
}

// Export all sections as PDF
async function exportAllPDF() {
    const formData = collectFormData();
    const { jsPDF } = window.jspdf;

    const sections = [
        {
            label: '前',
            data: formData.before,
            footer: '動火前：氣體測定數值正常、已置備防火毯、滅火器.. 如附相片'
        },
        {
            label: '中',
            data: formData.during,
            footer: '動火中：檢附核准之動火許可單、現場電焊中，氣體連續偵測、已鋪設防火毯、火花無掉落情形.. 如附相片'
        },
        {
            label: '後',
            data: formData.after,
            footer: `動火後：現場作業已於<span style="color: #0066cc;">${formData.after.completeTime || '_________'}</span>完成，並完成環境整理無殘留火星，已填報火災預防收工前巡檢紀錄。如附相片`
        }
    ];

    showToast('正在產生完整 PDF，請稍候...', 'info');
    const exportContainer = document.getElementById('export-container');

    // Create PDF instance
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    try {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            // Clear and prepare container
            exportContainer.innerHTML = '';
            const content = createExportElement(section.label, section.data, section.footer);
            exportContainer.appendChild(content);

            // Wait for DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture
            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1123,
                windowHeight: 794
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // Add to PDF
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        const filename = `動火作業單-完整-${formatDate(formData.before.date) || 'unknown'}.pdf`;
        pdf.save(filename);
        showToast('完整 PDF 下載完成！', 'success');

    } catch (err) {
        console.error('Export all failed:', err);
        showToast('產生 PDF 失敗', 'error');
    } finally {
        exportContainer.innerHTML = ''; // Cleanup
    }
}

// Export single section as Image (JPG)
async function exportSectionImage(section) {
    const formData = collectFormData();
    let sectionData, footerText, sectionLabel;

    switch (section) {
        case 'before':
            sectionData = formData.before;
            footerText = '動火前：氣體測定數值正常、已置備防火毯、滅火器.. 如附相片';
            sectionLabel = '前';
            break;
        case 'during':
            sectionData = formData.during;
            footerText = '動火中：檢附核准之動火許可單、現場電焊中，氣體連續偵測、已鋪設防火毯、火花無掉落情形.. 如附相片';
            sectionLabel = '中';
            break;
        case 'after':
            sectionData = formData.after;
            footerText = `動火後：現場作業已於<span style="color: #0066cc;">${formData.after.completeTime || '_________'}</span>完成，並完成環境整理無殘留火星，已填報火災預防收工前巡檢紀錄。如附相片`;
            sectionLabel = '後';
            break;
    }

    showToast('正在產生圖片，請稍候...', 'info');
    const exportContainer = document.getElementById('export-container');
    exportContainer.innerHTML = ''; // Clear previous

    const content = createExportElement(sectionLabel, sectionData, footerText);
    exportContainer.appendChild(content);

    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 1123,
            windowHeight: 794
        });

        const link = document.createElement('a');
        link.download = `動火作業單-${sectionLabel}-${formatDate(sectionData.date) || 'unknown'}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();

        showToast('圖片下載完成！', 'success');
    } catch (error) {
        console.error('Image export failed:', error);
        showToast('圖片產生失敗', 'error');
    } finally {
        exportContainer.innerHTML = ''; // Cleanup
    }
}

// Export all sections as Images (Zip or multiple downloads - using multiple downloads for simplicity on mobile)
async function exportAllImages() {
    const formData = collectFormData();

    const sections = [
        {
            label: '前',
            sectionId: 'before',
            data: formData.before,
            footer: '動火前：氣體測定數值正常、已置備防火毯、滅火器.. 如附相片'
        },
        {
            label: '中',
            sectionId: 'during',
            data: formData.during,
            footer: '動火中：檢附核准之動火許可單、現場電焊中，氣體連續偵測、已鋪設防火毯、火花無掉落情形.. 如附相片'
        },
        {
            label: '後',
            sectionId: 'after',
            data: formData.after,
            footer: `動火後：現場作業已於<span style="color: #0066cc;">${formData.after.completeTime || '_________'}</span>完成，並完成環境整理無殘留火星，已填報火災預防收工前巡檢紀錄。如附相片`
        }
    ];

    showToast('正在產生圖片，請允許下載多個檔案...', 'info');
    const exportContainer = document.getElementById('export-container');

    try {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            exportContainer.innerHTML = '';
            const content = createExportElement(section.label, section.data, section.footer);
            exportContainer.appendChild(content);

            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1123,
                windowHeight: 794
            });

            // Trigger download with delay
            setTimeout(() => {
                const link = document.createElement('a');
                link.download = `動火作業單-${section.label}-${formatDate(section.data.date) || 'unknown'}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
            }, i * 1000); // Stagger downloads
        }

        showToast('圖片匯出程序已啟動', 'success');

    } catch (err) {
        console.error('Export all images failed:', err);
        showToast('產生圖片失敗', 'error');
    } finally {
        // Cleanup after a delay to ensure captures are done
        setTimeout(() => {
            exportContainer.innerHTML = '';
        }, 4000);
    }
}

// ========================================
// Event Listeners
// ========================================
function initEventListeners() {
    // New form
    elements.newFormBtn.addEventListener('click', () => {
        currentFormId = generateId();
        clearForm();
        elements.savedFormsList.value = '';
        showToast('已建立新表單', 'success');
    });

    // Load saved form
    elements.savedFormsList.addEventListener('change', (e) => {
        if (e.target.value) {
            currentFormId = e.target.value;
            const formData = getForm(currentFormId);
            populateForm(formData);
            showToast('表單已載入', 'success');
        }
    });

    // Save form
    elements.saveBtn.addEventListener('click', () => {
        if (!currentFormId) {
            currentFormId = generateId();
        }
        const formData = collectFormData();
        saveForm(currentFormId, formData);
        updateFormsList();
        elements.savedFormsList.value = currentFormId;
        showToast('表單已儲存', 'success');
    });

    // Export all PDF
    elements.exportAllBtn.addEventListener('click', exportAllPDF);

    // Export all Images
    elements.exportAllImageBtn.addEventListener('click', exportAllImages);

    // Export individual sections (PDF)
    document.querySelectorAll('.btn-export-section').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            exportSectionPDF(section);
        });
    });

    // Export individual sections (Image)
    document.querySelectorAll('.btn-export-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            exportSectionImage(section);
        });
    });

    // Delete form
    elements.deleteBtn.addEventListener('click', () => {
        if (!currentFormId) {
            showToast('沒有選擇的表單', 'warning');
            return;
        }
        if (confirm('確定要刪除此表單嗎？')) {
            deleteForm(currentFormId);
            currentFormId = null;
            clearForm();
            updateFormsList();
            showToast('表單已刪除', 'success');
        }
    });

    // Update complete time display
    elements.afterCompleteTime.addEventListener('input', updateCompleteTimeDisplay);

    // Auto-save on input change (debounced)
    let autoSaveTimeout;
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('change', () => {
            if (currentFormId) {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    const formData = collectFormData();
                    saveForm(currentFormId, formData);
                    updateFormsList();
                    // Subtle feedback
                    elements.saveBtn.style.opacity = '0.7';
                    setTimeout(() => {
                        elements.saveBtn.style.opacity = '1';
                    }, 300);
                }, 1000);
            }
        });
    });
}

// ========================================
// Initialization
// ========================================
function init() {
    updateFormsList();
    initEventListeners();
    updateCompleteTimeDisplay();

    // Create a new form by default if no forms exist
    const forms = getAllForms();
    if (Object.keys(forms).length === 0) {
        currentFormId = generateId();
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
