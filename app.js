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

// Create HTML content for PDF - Landscape orientation with large fonts
function createPDFContent(section, sectionData, footerText) {
    const dateDisplay = formatDate(sectionData.date) || '________________';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>動火(${section})</title>
    <style>
        @page { size: A4 landscape; margin: 15mm; }
        @media print { 
            .no-print { display: none !important; }
            body { padding: 40px 60px; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "DFKai-SB", "標楷體", "KaiTi", "楷体", "BiauKai", "Microsoft JhengHei", serif;
            font-size: 28px;
            line-height: 2.2;
            padding: 20px;
            background: white;
        }
        .help-bar {
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            margin-bottom: 30px;
            border-radius: 8px;
            text-align: center;
            font-family: sans-serif;
            font-size: 16px;
        }
        .help-bar button {
            background: white;
            color: #4CAF50;
            border: none;
            padding: 10px 25px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            margin-left: 15px;
            cursor: pointer;
        }
        .content {
            padding: 20px 40px;
        }
        .header { text-align: right; font-size: 42px; font-weight: bold; margin-bottom: 30px; letter-spacing: 5px; }
        .field { margin-bottom: 8px; font-size: 28px; }
        .label { font-weight: bold; display: inline-block; min-width: 180px; }
        .value { color: #0066cc; }
        .footer { margin-top: 80px; font-size: 24px; font-weight: bold; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="help-bar no-print">
        📱 點擊按鈕儲存 PDF
        <button onclick="window.print()">儲存 PDF</button>
    </div>
    <div class="content">
        <div class="header">動火(${section})</div>
        <div class="field"><span class="label">日期：</span><span class="value">${dateDisplay}</span></div>
        <div class="field"><span class="label">公司名稱：</span><span class="value">${sectionData.company || ''}</span></div>
        <div class="field"><span class="label">工作名稱：</span><span class="value">${sectionData.workName || ''}</span></div>
        <div class="field"><span class="label">工作地點：</span><span class="value">${sectionData.workLocation || ''}</span></div>
        <div class="field"><span class="label">作業時間：</span><span class="value">${sectionData.workTime || ''}</span></div>
        <div class="field"><span class="label">動火作業內容：</span><span class="value">${sectionData.workContent || ''}</span></div>
        <div class="footer">${footerText}</div>
    </div>
</body>
</html>`;
}


// Create image content element
function createImageElement(section, sectionData, footerText) {
    const dateDisplay = formatDate(sectionData.date) || '________________';

    const container = document.createElement('div');
    container.style.cssText = `
        width: 1200px;
        padding: 50px 80px;
        background-color: #ffffff;
        font-family: "Microsoft JhengHei", "PingFang TC", "Heiti TC", sans-serif;
        font-size: 32px;
        line-height: 2.0;
        box-sizing: border-box;
        color: #000000;
    `;

    // Use simple text with colored value parts
    container.innerHTML = `
        <div style="text-align: right; font-size: 48px; font-weight: bold; margin-bottom: 40px; letter-spacing: 5px; color: #333333;">動火(${section})</div>
        <p style="margin: 0 0 15px 0; font-size: 32px; color: #000000;"><b>日期：</b><span style="color: #0066cc;">${dateDisplay}</span></p>
        <p style="margin: 0 0 15px 0; font-size: 32px; color: #000000;"><b>公司名稱：</b><span style="color: #0066cc;">${sectionData.company || ''}</span></p>
        <p style="margin: 0 0 15px 0; font-size: 32px; color: #000000;"><b>工作名稱：</b><span style="color: #0066cc;">${sectionData.workName || ''}</span></p>
        <p style="margin: 0 0 15px 0; font-size: 32px; color: #000000;"><b>工作地點：</b><span style="color: #0066cc;">${sectionData.workLocation || ''}</span></p>
        <p style="margin: 0 0 15px 0; font-size: 32px; color: #000000;"><b>作業時間：</b><span style="color: #0066cc;">${sectionData.workTime || ''}</span></p>
        <p style="margin: 0 0 15px 0; font-size: 32px; color: #000000;"><b>動火作業內容：</b><span style="color: #0066cc;">${sectionData.workContent || ''}</span></p>
        <div style="margin-top: 60px; font-size: 28px; font-weight: bold; line-height: 1.6; color: #333333; border-top: 2px solid #cccccc; padding-top: 20px;">${footerText}</div>
    `;

    return container;
}

// Export single section as PDF
function exportSectionPDF(section) {
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
            footerText = `動火後：現場作業已於<span class="value">${formData.after.completeTime || '_________'}</span>完成，並完成環境整理無殘留火星，已填報火災預防收工前巡檢紀錄。如附相片`;
            sectionLabel = '後';
            break;
    }

    const htmlContent = createPDFContent(sectionLabel, sectionData, footerText);

    // Open in new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    showToast('📱 iPhone: 分享 → 列印 → 雙指放大 → 再分享儲存', 'success');
}

// Export all sections as PDF
function exportAllPDF() {
    const formData = collectFormData();

    const beforeFooter = '動火前：氣體測定數值正常、已置備防火毯、滅火器.. 如附相片';
    const duringFooter = '動火中：檢附核准之動火許可單、現場電焊中，氣體連續偵測、已鋪設防火毯、火花無掉落情形.. 如附相片';
    const afterFooter = `動火後：現場作業已於<span class="value">${formData.after.completeTime || '_________'}</span>完成，並完成環境整理無殘留火星，已填報火災預防收工前巡檢紀錄。如附相片`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: A4 landscape; margin: 15mm; }
        @media print { .page { page-break-after: always; } .page:last-child { page-break-after: auto; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "DFKai-SB", "標楷體", "KaiTi", "楷体", "BiauKai", "Microsoft JhengHei", serif;
            font-size: 28px;
            line-height: 2.2;
        }
        .page {
            padding: 40px 60px;
            background: white;
        }
        .header { text-align: right; font-size: 42px; font-weight: bold; margin-bottom: 30px; letter-spacing: 5px; }
        .field { margin-bottom: 8px; font-size: 28px; }
        .label { font-weight: bold; display: inline-block; min-width: 180px; }
        .value { color: #0066cc; }
        .footer { margin-top: 80px; font-size: 24px; font-weight: bold; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">動火(前)</div>
        <div class="field"><span class="label">日期：</span><span class="value">${formatDate(formData.before.date) || ''}</span></div>
        <div class="field"><span class="label">公司名稱：</span><span class="value">${formData.before.company || ''}</span></div>
        <div class="field"><span class="label">工作名稱：</span><span class="value">${formData.before.workName || ''}</span></div>
        <div class="field"><span class="label">工作地點：</span><span class="value">${formData.before.workLocation || ''}</span></div>
        <div class="field"><span class="label">作業時間：</span><span class="value">${formData.before.workTime || ''}</span></div>
        <div class="field"><span class="label">動火作業內容：</span><span class="value">${formData.before.workContent || ''}</span></div>
        <div class="footer">${beforeFooter}</div>
    </div>
    <div class="page">
        <div class="header">動火(中)</div>
        <div class="field"><span class="label">日期：</span><span class="value">${formatDate(formData.during.date) || ''}</span></div>
        <div class="field"><span class="label">公司名稱：</span><span class="value">${formData.during.company || ''}</span></div>
        <div class="field"><span class="label">工作名稱：</span><span class="value">${formData.during.workName || ''}</span></div>
        <div class="field"><span class="label">工作地點：</span><span class="value">${formData.during.workLocation || ''}</span></div>
        <div class="field"><span class="label">作業時間：</span><span class="value">${formData.during.workTime || ''}</span></div>
        <div class="field"><span class="label">動火作業內容：</span><span class="value">${formData.during.workContent || ''}</span></div>
        <div class="footer">${duringFooter}</div>
    </div>
    <div class="page">
        <div class="header">動火(後)</div>
        <div class="field"><span class="label">日期：</span><span class="value">${formatDate(formData.after.date) || ''}</span></div>
        <div class="field"><span class="label">公司名稱：</span><span class="value">${formData.after.company || ''}</span></div>
        <div class="field"><span class="label">工作名稱：</span><span class="value">${formData.after.workName || ''}</span></div>
        <div class="field"><span class="label">工作地點：</span><span class="value">${formData.after.workLocation || ''}</span></div>
        <div class="field"><span class="label">作業時間：</span><span class="value">${formData.after.workTime || ''}</span></div>
        <div class="field"><span class="label">動火作業內容：</span><span class="value">${formData.after.workContent || ''}</span></div>
        <div class="footer">${afterFooter}</div>
    </div>
</body>
</html>`;

    // Open in new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    showToast('📱 iPhone: 分享 → 列印 → 雙指放大 → 再分享儲存', 'success');
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

    // Export individual sections
    document.querySelectorAll('.btn-export-section').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            exportSectionPDF(section);
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
