/**
 * 動火作業單 - 應用程式邏輯
 * Features: Form management, LocalStorage persistence, PDF export (individual & all)
 */

// ========================================
// Constants & State
// ========================================
const STORAGE_KEY = 'hotwork_forms_v2';
let currentFormId = null;

// Photo storage (in-memory, synced with form data)
let sectionPhotos = {
    before: [],
    during: [],
    after: []
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    // Selectors & Buttons
    savedFormsList: document.getElementById('savedFormsList'),
    helpBtn: document.getElementById('helpBtn'),
    saveBtn: document.getElementById('saveBtn'),
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
    toast: document.getElementById('toast'),

    // Modal
    imagePreviewModal: document.getElementById('imagePreviewModal'),
    modalImageContainer: document.getElementById('modalImageContainer'),
    closeModalBtn: document.querySelector('.close-modal'),
    downloadImageBtn: document.getElementById('downloadImageBtn'),

    // Photo inputs and galleries
    beforePhotos: document.getElementById('beforePhotos'),
    duringPhotos: document.getElementById('duringPhotos'),
    afterPhotos: document.getElementById('afterPhotos'),
    beforePhotoGallery: document.getElementById('beforePhotoGallery'),
    duringPhotoGallery: document.getElementById('duringPhotoGallery'),
    afterPhotoGallery: document.getElementById('afterPhotoGallery')
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
// Photo Handling Functions
// ========================================
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 1200; // Max dimension for compression (larger = better quality)

// Compress image to reduce storage size
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if necessary
                if (width > MAX_PHOTO_SIZE || height > MAX_PHOTO_SIZE) {
                    if (width > height) {
                        height = (height / width) * MAX_PHOTO_SIZE;
                        width = MAX_PHOTO_SIZE;
                    } else {
                        width = (width / height) * MAX_PHOTO_SIZE;
                        height = MAX_PHOTO_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Add photos to a section
async function addPhotos(section, files) {
    const currentCount = sectionPhotos[section].length;
    const remainingSlots = MAX_PHOTOS - currentCount;

    if (remainingSlots <= 0) {
        showToast(`每個區段最多只能附加 ${MAX_PHOTOS} 張照片`, 'warning');
        return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    showToast('正在處理照片...', 'info');

    try {
        for (const file of filesToAdd) {
            const compressedImage = await compressImage(file);
            sectionPhotos[section].push(compressedImage);
        }
        renderPhotoGallery(section);
        showToast(`已新增 ${filesToAdd.length} 張照片`, 'success');

        // Auto-save if form exists
        if (currentFormId) {
            const formData = collectFormData();
            saveForm(currentFormId, formData);
            updateFormsList();
        }
    } catch (error) {
        console.error('Photo processing error:', error);
        showToast('照片處理失敗', 'error');
    }
}

// Remove a photo from a section
function removePhoto(section, index) {
    sectionPhotos[section].splice(index, 1);
    renderPhotoGallery(section);
    showToast('照片已刪除', 'success');

    // Auto-save if form exists
    if (currentFormId) {
        const formData = collectFormData();
        saveForm(currentFormId, formData);
        updateFormsList();
    }
}

// Render photo gallery for a section
function renderPhotoGallery(section) {
    const gallery = elements[`${section}PhotoGallery`];
    if (!gallery) return;

    gallery.innerHTML = '';
    sectionPhotos[section].forEach((photoData, index) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `
            <img src="${photoData}" alt="照片 ${index + 1}">
            <button type="button" class="photo-delete" data-section="${section}" data-index="${index}">×</button>
        `;
        gallery.appendChild(item);
    });

    // Update add button text to show remaining slots
    const addBtn = document.querySelector(`.btn-add-photo[data-section="${section}"]`);
    if (addBtn) {
        const remaining = MAX_PHOTOS - sectionPhotos[section].length;
        if (remaining > 0) {
            addBtn.textContent = `📷 附加照片 (剩餘 ${remaining} 張)`;
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
        } else {
            addBtn.textContent = '📷 已達上限';
            addBtn.disabled = true;
            addBtn.style.opacity = '0.6';
        }
    }
}

// Clear all photos
function clearPhotos() {
    sectionPhotos = {
        before: [],
        during: [],
        after: []
    };
    renderPhotoGallery('before');
    renderPhotoGallery('during');
    renderPhotoGallery('after');
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
            workContent: elements.beforeWorkContent.value,
            photos: sectionPhotos.before
        },
        during: {
            date: elements.duringDate.value,
            company: elements.duringCompany.value,
            workName: elements.duringWorkName.value,
            workLocation: elements.duringWorkLocation.value,
            workTime: getWorkTime(elements.duringWorkTimeStart, elements.duringWorkTimeEnd),
            workContent: elements.duringWorkContent.value,
            photos: sectionPhotos.during
        },
        after: {
            date: elements.afterDate.value,
            company: elements.afterCompany.value,
            workName: elements.afterWorkName.value,
            workLocation: elements.afterWorkLocation.value,
            workTime: getWorkTime(elements.afterWorkTimeStart, elements.afterWorkTimeEnd),
            workContent: elements.afterWorkContent.value,
            completeTime: elements.afterCompleteTime.value,
            photos: sectionPhotos.after
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

    // Load photos
    sectionPhotos.before = formData.before?.photos || [];
    sectionPhotos.during = formData.during?.photos || [];
    sectionPhotos.after = formData.after?.photos || [];
    renderPhotoGallery('before');
    renderPhotoGallery('during');
    renderPhotoGallery('after');

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

    // Clear photos
    clearPhotos();

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
// Function removed as per user request to use Image export only

/**
 * Create the printable element for export
 */
function createExportElement(section, sectionData, footerText, photos = []) {
    const dateDisplay = formatDate(sectionData.date) || '________________';

    // Create a container that mimics the A4 landscape layout
    const container = document.createElement('div');
    container.style.cssText = `
        width: 297mm;
        min-height: 210mm;
        padding: 20mm;
        background: white;
        font-family: "DFKai-SB", "標楷體", "KaiTi", "楷体", "BiauKai", "Microsoft JhengHei", serif;
        box-sizing: border-box;
        position: relative;
        color: #000;
    `;

    // Build photos HTML if any
    let photosHtml = '';
    if (photos && photos.length > 0) {
        photosHtml = `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
                <div style="font-size: 14pt; font-weight: bold; margin-bottom: 15px;">📷 附加照片：</div>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    ${photos.map((photo, idx) => `
                        <img src="${photo}" alt="照片${idx + 1}" style="width: 280px; height: 210px; object-fit: cover; border: 2px solid #ccc; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    `).join('')}
                </div>
            </div>
        `;
    }

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

        <div style="margin-top: 40px; font-size: 14pt; font-weight: bold; line-height: 1.5;">${footerText}</div>
        
        ${photosHtml}
    `;

    return container;
}

// Export single section as PDF - REMOVED
// Export all sections as PDF - REMOVED

// Export single section as Image (JPG) with Modal Preview
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

    const content = createExportElement(sectionLabel, sectionData, footerText, sectionPhotos[section]);
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

        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const filename = `動火作業單-${sectionLabel}-${formatDate(sectionData.date) || 'unknown'}.jpg`;

        // Show Modal
        showImageModal(imgDataUrl, filename);

        showToast('圖片已產生！長按圖片可分享', 'success');
    } catch (error) {
        console.error('Image export failed:', error);
        showToast('圖片產生失敗', 'error');
    } finally {
        exportContainer.innerHTML = ''; // Cleanup
    }
}

function showImageModal(imgDataUrl, filename) {
    const img = document.createElement('img');
    img.src = imgDataUrl;
    elements.modalImageContainer.innerHTML = '';
    elements.modalImageContainer.appendChild(img);

    elements.imagePreviewModal.style.display = 'block';

    // Update download button action
    elements.downloadImageBtn.onclick = () => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = imgDataUrl;
        link.click();
    };
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

    showToast('正在產生圖片...', 'info');
    const exportContainer = document.getElementById('export-container');

    try {
        // Only show the first one in modal if multiples, or implement a gallery?
        // For simplicity, let's just create individual downloads for "Export All" as requested before, 
        // to avoid complex gallery implementation. Or maybe just show the BEFORE one?
        // Let's keep the previous behavior for "Export All" (Download All) but maybe prompt.
        // Actually, user use-case is likely single export. Let's keep "Export All" as direct download to avoid blocking.

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            exportContainer.innerHTML = '';
            const content = createExportElement(section.label, section.data, section.footer, sectionPhotos[section.sectionId]);
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
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${tabId}`).classList.add('active');
        });
    });

    // Help button
    elements.helpBtn.addEventListener('click', () => {
        document.getElementById('helpModal').style.display = 'block';
    });

    // Close help modal
    document.querySelector('.close-help').addEventListener('click', () => {
        document.getElementById('helpModal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('helpModal')) {
            document.getElementById('helpModal').style.display = 'none';
        }
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

    // Modal Events
    elements.closeModalBtn.addEventListener('click', () => {
        elements.imagePreviewModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.imagePreviewModal) {
            elements.imagePreviewModal.style.display = 'none';
        }
    });

    // Photo attachment buttons
    document.querySelectorAll('.btn-add-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            const fileInput = elements[`${section}Photos`];
            if (fileInput) {
                fileInput.click();
            }
        });
    });

    // Photo file input handlers
    ['before', 'during', 'after'].forEach(section => {
        const fileInput = elements[`${section}Photos`];
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    addPhotos(section, e.target.files);
                    e.target.value = ''; // Reset input
                }
            });
        }
    });

    // Photo delete buttons (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('photo-delete')) {
            const section = e.target.dataset.section;
            const index = parseInt(e.target.dataset.index, 10);
            removePhoto(section, index);
        }
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
