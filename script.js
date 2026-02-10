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
