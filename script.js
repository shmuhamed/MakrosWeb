// Загружаем макросы из localStorage, если они есть
let macros = JSON.parse(localStorage.getItem('macros')) || [
    { name: 'Привет', phrase: 'Привет, как дела?', lang: 'ru', theme: 'Приветствие' },
    { name: 'Hello', phrase: 'Hello, how are you?', lang: 'en', theme: 'Greeting' },
    { name: 'Salom', phrase: 'Salom, qanday?', lang: 'uz', theme: 'Salomlashish' }
];

let themes = JSON.parse(localStorage.getItem('themes')) || ['Приветствие', 'Greeting', 'Salomlashish']; // доступные темы
let currentLang = 'ru'; // начальный язык
let selectedTheme = '';
let macroToDeleteIndex = null; // Индекс макроса, который нужно удалить

function renderMacros() {
    const macroList = document.getElementById('macro-list');
    macroList.innerHTML = '';
    const filteredMacros = macros.filter(macro => macro.lang === currentLang && (selectedTheme ? macro.theme === selectedTheme : true));

    filteredMacros.forEach((macro, index) => {
        const div = document.createElement('div');
        div.className = 'macro-card';
        div.innerHTML = `
            <div class="macro-header">${macro.name}</div>
            <div class="macro-body">${macro.phrase}</div>
            <button class="delete-btn" onclick="prepareDeleteMacro(${index})"><i class="fas fa-trash-alt"></i></button>
        `;
        div.onclick = function() {
            navigator.clipboard.writeText(macro.phrase);
        };
        macroList.appendChild(div);
    });
}

function addMacro() {
    const name = document.getElementById('theme').value || document.getElementById('existing-theme').value;
    const text = document.getElementById('macro-text').value;
    const theme = document.getElementById('theme').value || document.getElementById('existing-theme').value;
    const lang = document.getElementById('language').value;

    if (!text || !theme) {
        alert('Заполните все поля');
        return;
    }

    if (!name) {
        name = theme;  // если имя не введено, используем имя темы
    }

    if (!themes.includes(theme)) {
        themes.push(theme); // добавляем новую тему
        localStorage.setItem('themes', JSON.stringify(themes)); // сохраняем новую тему
    }

    macros.push({ name, phrase: text, lang, theme });

    // Сохраняем макросы в localStorage
    localStorage.setItem('macros', JSON.stringify(macros));

    renderMacros();
    closeAddMacroModal();
}

function showAddMacroModal() {
    document.getElementById('add-macro-modal').style.display = 'block';
    populateExistingThemes();
}

function closeAddMacroModal() {
    document.getElementById('add-macro-modal').style.display = 'none';
}

function showThemeSelectorModal() {
    document.getElementById('theme-selector-modal').style.display = 'block';
    populateExistingThemesForSelector();
}

function closeThemeSelectorModal() {
    document.getElementById('theme-selector-modal').style.display = 'none';
}

function populateExistingThemes() {
    const existingThemeSelect = document.getElementById('existing-theme');
    existingThemeSelect.innerHTML = '<option value="">Выберите тему...</option>'; // очищаем список

    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        existingThemeSelect.appendChild(option);
    });
}

function populateExistingThemesForSelector() {
    const themeSelector = document.getElementById('theme-selector');
    themeSelector.innerHTML = '<option value="">Выберите тему...</option>'; // очищаем список

    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        themeSelector.appendChild(option);
    });
}

function goToTheme() {
    const theme = document.getElementById('theme-selector').value;
    if (theme) {
        selectedTheme = theme;
        renderMacros();
        closeThemeSelectorModal();
    } else {
        alert('Пожалуйста, выберите тему');
    }
}

function prepareDeleteMacro(index) {
    macroToDeleteIndex = index;
    document.getElementById('delete-confirmation-modal').style.display = 'block';
}

function confirmDelete() {
    const macroToDelete = macros[macroToDeleteIndex];
    macros.splice(macroToDeleteIndex, 1); // Удаляем макрос

    // Удаляем тему, если она больше не используется
    const themeIsUsed = macros.some(macro => macro.theme === macroToDelete.theme);
    if (!themeIsUsed) {
        themes = themes.filter(theme => theme !== macroToDelete.theme);
    }

    localStorage.setItem('macros', JSON.stringify(macros)); // Сохраняем изменения в localStorage
    localStorage.setItem('themes', JSON.stringify(themes)); // Сохраняем изменения в темах

    renderMacros();
    closeDeleteConfirmationModal();
}

function cancelDelete() {
    closeDeleteConfirmationModal();
}

function closeDeleteConfirmationModal() {
    document.getElementById('delete-confirmation-modal').style.display = 'none';
}

function switchLanguage(lang) {
    currentLang = lang;
    renderMacros();
}

function searchMacros() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const macroList = document.getElementById('macro-list');
    macroList.innerHTML = '';
    const filteredMacros = macros.filter(macro => 
        (macro.lang === currentLang) && 
        (macro.name.toLowerCase().includes(searchTerm) || macro.phrase.toLowerCase().includes(searchTerm))
    );

    filteredMacros.forEach(macro => {
        const div = document.createElement('div');
        div.className = 'macro-card';
        div.innerHTML = `
            <div class="macro-header">${macro.name}</div>
            <div class="macro-body">${macro.phrase}</div>
            <button class="delete-btn" onclick="prepareDeleteMacro(${macros.indexOf(macro)})"><i class="fas fa-trash-alt"></i></button>
        `;
        div.onclick = function() {
            navigator.clipboard.writeText(macro.phrase);
        };
        macroList.appendChild(div);
    });
}

renderMacros();
// Инициализация Firestore
const db = firebase.firestore();

// Получение макросов из Firestore
function getMacrosFromFirebase() {
    db.collection("macros").get()
        .then((querySnapshot) => {
            macros = [];
            querySnapshot.forEach((doc) => {
                const macro = doc.data();
                macros.push({
                    id: doc.id, // хранить ID документа для удаления
                    name: macro.name,
                    phrase: macro.phrase,
                    theme: macro.theme,
                    lang: macro.lang
                });
            });
            renderMacros(); // Рендерим макросы после получения из Firestore
        })
        .catch((error) => {
            console.error("Ошибка получения макросов: ", error);
        });
}

// Добавление макроса в Firestore
function addMacroToFirebase(name, text, theme, lang) {
    db.collection("macros").add({
        name: name,
        phrase: text,
        theme: theme,
        lang: lang
    })
    .then(() => {
        console.log("Макрос добавлен в Firebase");
        renderMacros(); // Обновляем список макросов
    })
    .catch((error) => {
        console.error("Ошибка добавления макроса в Firebase: ", error);
    });
}

// Удаление макроса из Firestore
function deleteMacroFromFirebase(id) {
    db.collection("macros").doc(id).delete()
        .then(() => {
            console.log("Макрос удален из Firebase");
            renderMacros(); // Обновляем список макросов после удаления
        })
        .catch((error) => {
            console.error("Ошибка удаления макроса из Firebase: ", error);
        });
}

// Обновление функции renderMacros
function renderMacros() {
    const macroList = document.getElementById('macro-list');
    macroList.innerHTML = '';
    const filteredMacros = macros.filter(macro => macro.lang === currentLang && (selectedTheme ? macro.theme === selectedTheme : true));

    filteredMacros.forEach((macro, index) => {
        const div = document.createElement('div');
        div.className = 'macro-card';
        div.innerHTML = `
            <div class="macro-header">${macro.name}</div>
            <div class="macro-body">${macro.phrase}</div>
            <button class="delete-btn" onclick="prepareDeleteMacro(${macro.id})"><i class="fas fa-trash-alt"></i></button>
        `;
        div.onclick = function() {
            navigator.clipboard.writeText(macro.phrase);
        };
        macroList.appendChild(div);
    });
}

// Подготовка удаления макроса
function prepareDeleteMacro(id) {
    macroToDeleteIndex = id;
    document.getElementById('delete-confirmation-modal').style.display = 'block';
}

// Подтверждение удаления макроса
function confirmDelete() {
    const macroToDelete = macros[macroToDeleteIndex];
    deleteMacroFromFirebase(macroToDelete.id); // Удаляем макрос из Firestore

    // Удаляем тему, если она больше не используется
    const themeIsUsed = macros.some(macro => macro.theme === macroToDelete.theme);
    if (!themeIsUsed) {
        deleteThemeFromFirebase(macroToDelete.theme); // Удаляем тему из Firestore, если она больше не используется
    }

    closeDeleteConfirmationModal();
}

// Удаление темы из Firestore
function deleteThemeFromFirebase(theme) {
    db.collection("themes").doc(theme).delete()
        .then(() => {
            console.log("Тема удалена из Firebase");
        })
        .catch((error) => {
            console.error("Ошибка удаления темы из Firebase: ", error);
        });
}

// Закрытие окна подтверждения удаления
function closeDeleteConfirmationModal() {
    document.getElementById('delete-confirmation-modal').style.display = 'none';
}

// Добавление макроса
function addMacro() {
    const name = document.getElementById('theme').value || document.getElementById('existing-theme').value;
    const text = document.getElementById('macro-text').value;
    const theme = document.getElementById('theme').value || document.getElementById('existing-theme').value;
    const lang = document.getElementById('language').value;

    if (!text || !theme) {
        alert('Заполните все поля');
        return;
    }

    if (!name) {
        name = theme;  // если имя не введено, используем имя темы
    }

    addMacroToFirebase(name, text, theme, lang); // Добавляем макрос в Firebase
}

