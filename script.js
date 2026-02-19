// ================== ELEMENTS ==================
const dateInput = document.getElementById("dateInput");
const diaryText = document.getElementById("diaryText");
const dateDisplay = document.getElementById("dateDisplay");
const lockBtn = document.getElementById("lockBtn");
const conceptBtn = document.getElementById("conceptBtn");
const conceptView = document.getElementById("conceptView");
const backToDiary = document.getElementById("backToDiary");
const conceptName = document.getElementById("conceptName");
const conceptText = document.getElementById("conceptText");
const saveConcept = document.getElementById("saveConcept");
const conceptListEl = document.getElementById("conceptList");
const showConceptsBtn = document.getElementById("showConcepts");
const hideConceptsBtn = document.getElementById("hideConcepts");
const container = document.querySelector('.container');
const writingArea = document.getElementById('writingArea');

// ================== DATA HANDLING ==================

function getDiaryEntries() {
    return JSON.parse(localStorage.getItem('diaryEntries')) || {};
}

function saveDiaryEntries(entries) {
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
}

function getConcepts() {
    return JSON.parse(localStorage.getItem('concepts')) || [];
}

function saveConcepts(c) {
    localStorage.setItem('concepts', JSON.stringify(c));
}

let diaryEntries = getDiaryEntries();
let concepts = getConcepts();

// ================== DIARY LOGIC ==================

function loadEntryForDate(date) {
    diaryText.value = diaryEntries[date] || "";
    // Update cursor visibility
    if (diaryText.value.length > 0) {
        writingArea.classList.add('writing-has-text');
    } else {
        writingArea.classList.remove('writing-has-text');
    }
}

c

// This specific handler ensures that as soon as the wheel stops on a date, 
// the app switches to that date.
const dateHandler = () => {
    if (dateInput.value) {
        updateDate(dateInput.value);
        // Optional: Remove focus to tell iOS the interaction is done
        dateInput.blur(); 
    }
};

// Use 'change' specifically for the picker closing/finalizing selection
dateInput.addEventListener("change", dateHandler);

// Keep 'input' for real-time selection if the browser supports it
dateInput.addEventListener("input", dateHandler);


let inputSaveTimer;
diaryText.addEventListener("input", () => {
    clearTimeout(inputSaveTimer);
    inputSaveTimer = setTimeout(() => {
        const date = dateInput.value;
        if (!date) return;
        diaryEntries[date] = diaryText.value;
        saveDiaryEntries(diaryEntries);
    }, 400);
});

// Help iOS focus the textarea
writingArea.addEventListener('click', (e) => {
    if (e.target !== diaryText) {
        diaryText.focus();
    }
});

// ================== DATE PICKER FIXES ==================

function formatDateForDisplay(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString(undefined, opts);
}

function updateDate(iso) {
    if (!iso) return;
    if (dateDisplay) dateDisplay.textContent = formatDateForDisplay(iso);
    loadEntryForDate(iso);
}

function changeDate(offset) {
    const cur = new Date(dateInput.value);
    if (isNaN(cur)) return;
    cur.setDate(cur.getDate() + offset);
    const iso = cur.toISOString().split('T')[0];
    dateInput.value = iso;
    updateDate(iso);
}

const openPicker = (e) => {
    if (e) e.stopPropagation();
    if (dateInput) {
        if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
        } else {
            dateInput.focus();
            dateInput.click();
        }
    }
};

if (dateDisplay) dateDisplay.addEventListener('click', openPicker);
if (dateInput) {
    dateInput.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
}

// ================== CONCEPTS LOGIC ==================

function renderConcepts() {
    if (!conceptListEl) return;
    conceptListEl.innerHTML = '';
    concepts.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'concept-row';
        row.innerHTML = `
            <h3>${c.name}</h3>
            <p>${c.text}</p>
            <button class="concept-delete" data-index="${idx}">×</button>
        `;
        row.querySelector('.concept-delete').addEventListener('click', () => {
            concepts.splice(idx, 1);
            saveConcepts(concepts);
            renderConcepts();
        });
        conceptListEl.appendChild(row);
    });
}

if (saveConcept) {
    saveConcept.addEventListener('click', () => {
        const name = conceptName.value.trim();
        const text = conceptText.value.trim();
        if (name && text) {
            concepts.push({ name, text });
            saveConcepts(concepts);
            conceptName.value = '';
            conceptText.value = '';
            renderConcepts();
        } else {
            alert("Please enter both a title and text.");
        }
    });
}

// ================== VIEW TOGGLING ==================

if (conceptBtn) {
    conceptBtn.addEventListener('click', () => {
        container.style.display = 'none';
        conceptView.classList.add('active');
        conceptView.style.display = 'block';
    });
}

if (backToDiary) {
    backToDiary.addEventListener('click', () => {
        conceptView.classList.remove('active');
        conceptView.style.display = 'none';
        container.style.display = 'flex';
    });
}

if (showConceptsBtn) {
    showConceptsBtn.addEventListener('click', () => {
        renderConcepts();
        conceptListEl.style.display = 'grid';
        showConceptsBtn.style.display = 'none';
        hideConceptsBtn.style.display = 'inline-block';
    });
}

if (hideConceptsBtn) {
    hideConceptsBtn.addEventListener('click', () => {
        conceptListEl.style.display = 'none';
        hideConceptsBtn.style.display = 'none';
        showConceptsBtn.style.display = 'inline-block';
    });
}

// ================== INITIALIZATION ==================

document.addEventListener("DOMContentLoaded", function () {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    updateDate(today);

    // Swipe navigation for dates
    let startX;
    container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) startX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', e => {
        if (startX === undefined) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (dx > 70) changeDate(-1);
        else if (dx < -70) changeDate(1);
        startX = undefined;
    });

    // Cursor Styling
    diaryText.addEventListener('focus', () => writingArea.classList.add('writing-focused'));
    diaryText.addEventListener('blur', () => writingArea.classList.remove('writing-focused'));
    diaryText.addEventListener('input', () => {
        if (diaryText.value.length > 0) writingArea.classList.add('writing-has-text');
        else writingArea.classList.remove('writing-has-text');
    });
});

// ================== SPLASH / LOCK ==================

(function () {
    const splash = document.getElementById('splash');
    if (!splash) return;

    let swipeState = 0;
    const threshold = 50;
    let startX = 0;

    function resetSplash() {
        splash.style.display = 'flex';
        container.style.display = 'none';
        conceptView.style.display = 'none';
        swipeState = 0;
        if (document.getElementById('calcDisplay')) document.getElementById('calcDisplay').value = '0';
    }

    splash.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    splash.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        if (dx < -threshold && (swipeState === 0 || swipeState === 2)) swipeState++;
        else if (dx > threshold && swipeState === 1) swipeState++;
        else swipeState = 0;

        if (swipeState === 3) {
            splash.style.display = 'none';
            container.style.display = 'flex';
        }
    });

    if (lockBtn) lockBtn.addEventListener('click', resetSplash);
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetSplash(); });

    // Calc Logic
    const display = document.getElementById('calcDisplay');
    splash.querySelectorAll('.calc-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-value');
            if (btn.id === 'calcClear') display.value = '0';
            else if (btn.id === 'calcEquals') {
                try { display.value = eval(display.value.replace(/[^0-9.+\-*/]/g, '')); }
                catch { display.value = 'Error'; }
            } else if (val) {
                display.value = (display.value === '0') ? val : display.value + val;
            }
        });
    });
    resetSplash();
})();