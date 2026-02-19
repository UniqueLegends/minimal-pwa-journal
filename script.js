// ================== ELEMENTS ==================
const dateInput = document.getElementById("dateInput");
const diaryText = document.getElementById("diaryText");
const saveBtn = document.getElementById("saveBtn");

const conceptName = document.getElementById("conceptName");
const conceptExplanation = document.getElementById("conceptExplanation");
const conceptSaveBtn = document.getElementById("conceptSaveBtn");
const showConcepts = document.getElementById("showConcepts");
const conceptList = document.getElementById("conceptList");
const hideConcepts = document.getElementById("hideConcepts");

// ================== DIARY ==================

// Use a single key in localStorage to hold all entries as an object
function getDiaryEntries() {
    return JSON.parse(localStorage.getItem('diaryEntries')) || {};
}

function saveDiaryEntries(entries) {
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
}

// cache in-memory for efficiency
let diaryEntries = getDiaryEntries();

function loadEntryForDate(date) {
    diaryText.value = diaryEntries[date] || "";
}

function persistCurrentEntry() {
    const date = dateInput.value;
    if (!date) return;
    const value = diaryText.value;
    if (value) {
        diaryEntries[date] = value;
    } else {
        delete diaryEntries[date];
    }
    saveDiaryEntries(diaryEntries);
}

// manual save
saveBtn.addEventListener("click", persistCurrentEntry);

// auto save while typing
let inputSaveTimer;
diaryText.addEventListener("input", function () {
    clearTimeout(inputSaveTimer);
    inputSaveTimer = setTimeout(persistCurrentEntry, 500);
});

// date change
dateInput.addEventListener("change", function () {
    const date = dateInput.value;
    if (!date) return;
    loadEntryForDate(date);
});

// load today's entry on start
window.addEventListener("DOMContentLoaded", function () {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    loadEntryForDate(today);
});

// ================== CONCEPTS ==================

function getConcepts() {
    return JSON.parse(localStorage.getItem("concepts")) || [];
}

function saveConcepts(concepts) {
    localStorage.setItem("concepts", JSON.stringify(concepts));
}

let concepts = getConcepts();

// Save new concept
conceptSaveBtn.addEventListener("click", function () {
    const title = conceptName.value.trim();
    const explanation = conceptExplanation.value.trim();

    // Validation inside event (correct place)
    if (!title || !explanation) return;

    // Prevent duplicate titles
    const exists = concepts.some(c => c.title === title);
    if (exists) {
        alert("Concept already exists");
        return;
    }

    concepts.push({ title, explanation });
    saveConcepts(concepts);

    conceptName.value = "";
    conceptExplanation.value = "";
});

// Show concepts
showConcepts.addEventListener("click", function () {
    conceptList.innerHTML = "";
    conceptList.style.display = "block";

    // no need to re-read from storage, we keep `concepts` updated already
    concepts.forEach(function (concept) {
        const wrapper = document.createElement("div");

        const title = document.createElement("h3");
        const explanation = document.createElement("p");
        const deleteBtn = document.createElement("button");

        title.textContent = concept.title;
        explanation.textContent = concept.explanation;
        deleteBtn.textContent = "Delete";

        // Delete logic INSIDE loop (correct scope)
        deleteBtn.addEventListener("click", function () {
            concepts = concepts.filter(c => c.title !== concept.title);
            saveConcepts(concepts);
            wrapper.remove();
        });

        wrapper.appendChild(title);
        wrapper.appendChild(explanation);
        wrapper.appendChild(deleteBtn);

        conceptList.appendChild(wrapper);
    });
});

// Hide concepts
hideConcepts.addEventListener("click", function () {
    conceptList.innerHTML = "";
    conceptList.style.display = "none";
});

// ================== DEV TOOL ==================

function clearAllData() {
    if (confirm("Delete everything?")) {
        localStorage.removeItem('diaryEntries');
        localStorage.removeItem('concepts');
        // other keys (like manifest info) remain untouched
        location.reload();
    }
}

// ================== SPLASH / SWIPE HANDLER ==================
// Splash shows calculator. Unlock sequence: left → right → left.
// Supports touch and mouse; resets after 3 seconds of inactivity or wrong swipe.

(function () {
    const splash = document.getElementById('splash');
    const container = document.querySelector('.container');
    if (!splash) return;

    // start hidden until we explicitly show on reset
    if (container) container.style.display = 'none';

    let startX = 0;
    let swipeState = 0; // 0=left,1=right,2=left
    const threshold = 50;
    let timer;

    function resetSplash() {
        splash.style.display = 'block';
        if (container) container.style.display = 'none';
        swipeState = 0;
        clearCalculator();
        resetTimer();
    }

    function resetTimer() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            swipeState = 0;
        }, 3000);
    }

    function handleEnd(dx) {
        if (dx < -threshold) {
            // left swipe
            if (swipeState === 0 || swipeState === 2) {
                swipeState++;
            } else {
                swipeState = 0;
            }
        } else if (dx > threshold) {
            // right swipe
            if (swipeState === 1) {
                swipeState++;
            } else {
                swipeState = 0;
            }
        }

        if (swipeState === 3) {
            // unlocked
            splash.style.display = 'none';
            if (container) container.style.display = 'block';
        }
        resetTimer();
    }

    function startHandler(x) {
        startX = x;
    }

    function endHandler(x) {
        const dx = x - startX;
        handleEnd(dx);
    }

    // touch events
    splash.addEventListener('touchstart', e => {
        if (e.touches.length === 1) startHandler(e.touches[0].clientX);
    });
    splash.addEventListener('touchend', e => {
        endHandler(e.changedTouches[0].clientX);
    });

    // mouse events (desktop/test)
    let mouseDown = false;
    splash.addEventListener('mousedown', e => {
        mouseDown = true;
        startHandler(e.clientX);
    });
    splash.addEventListener('mouseup', e => {
        if (mouseDown) {
            mouseDown = false;
            endHandler(e.clientX);
        }
    });

    // lock button
    const lockBtn = document.getElementById('lockBtn');
    if (lockBtn) lockBtn.addEventListener('click', resetSplash);

    // lock on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            resetSplash();
        }
    });

    // calculator logic remains unchanged
    const display = document.getElementById('calcDisplay');
    const buttons = splash.querySelectorAll('.calc-buttons button');

    function clearCalculator() {
        if (display) display.value = '0';
    }
    function appendCalc(value) {
        if (!display) return;
        if (display.value === '0' && value !== '.') {
            display.value = value;
        } else {
            display.value += value;
        }
    }
    function evaluateCalc() {
        if (!display) return;
        try {
            const sanitized = display.value.replace(/[^0-9.+\-*/]/g, '');
            const result = Function('return ' + sanitized)();
            display.value = result;
        } catch {
            display.value = 'Error';
        }
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-value');
            if (btn.id === 'calcClear') {
                clearCalculator();
            } else if (btn.id === 'calcEquals') {
                evaluateCalc();
            } else if (val) {
                appendCalc(val);
            }
        });
    });

    // ensure splash starts visible
    resetSplash();
})();

