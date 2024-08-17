const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const habitCategorySelect = document.getElementById('habit-category');
const habitFrequencySelect = document.getElementById('habit-frequency');
const habitList = document.getElementById('habit-list');
const editHabitForm = document.getElementById('edit-habit-form');
const editHabitNameInput = document.getElementById('edit-habit-name');
const editHabitCategorySelect = document.getElementById('edit-habit-category');
const editHabitFrequencySelect = document.getElementById('edit-habit-frequency');
const editHabitSection = document.getElementById('edit-habit');
const cancelEditBtn = document.getElementById('cancel-edit');
const themeSwitcher = document.getElementById('theme-switcher');
const analyticsContent = document.getElementById('analytics-content');
const categoryForm = document.getElementById('category-form');
const newCategoryInput = document.getElementById('new-category');
const categoryList = document.getElementById('category-list');
const reminderContent = document.getElementById('reminder-content');
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['health', 'productivity', 'learning'];
let habitToEdit = null;

habitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const habitName = habitNameInput.value.trim();
    const habitCategory = habitCategorySelect.value;
    const habitFrequency = habitFrequencySelect.value;
    if (habitName !== '') {
        addHabit(habitName, habitCategory, habitFrequency);
        habitNameInput.value = '';
    }
});

editHabitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const newName = editHabitNameInput.value.trim();
    const newCategory = editHabitCategorySelect.value;
    const newFrequency = editHabitFrequencySelect.value;
    if (newName !== '' && habitToEdit !== null) {
        editHabit(habitToEdit, newName, newCategory, newFrequency);
        habitToEdit = null;
        editHabitSection.style.display = 'none';
        habitForm.style.display = 'block';
    }
});

cancelEditBtn.addEventListener('click', function () {
    habitToEdit = null;
    editHabitSection.style.display = 'none';
    habitForm.style.display = 'block';
});

categoryForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const newCategory = newCategoryInput.value.trim();
    if (newCategory !== '') {
        addCategory(newCategory);
        newCategoryInput.value = '';
    }
});

themeSwitcher.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
});

function addHabit(name, category, frequency) {
    const habit = {
        id: Date.now(),
        name: name,
        category: category,
        frequency: frequency,
        completed: false,
        progress: 0,
        streak: 0,
        longestStreak: 0,
        lastUpdated: new Date().toISOString().split('T')[0]
    };
    habits.push(habit);
    updateLocalStorage();
    renderHabits();
    updateOverview();
    updateAnalytics();
}

function addCategory(name) {
    categories.push(name);
    updateCategoryOptions();
    updateLocalStorage();
    renderCategories();
}

function renderHabits() {
    habitList.innerHTML = '';
    habits.forEach(function (habit) {
        resetProgressIfNeeded(habit);
        const habitDiv = document.createElement('div');
        habitDiv.classList.add('habit');

        const habitTitle = document.createElement('h3');
        habitTitle.textContent = `${habit.name} (${habit.category})`;

        const progressDiv = document.createElement('div');
        progressDiv.classList.add('progress');

        const progressBar = document.createElement('span');
        progressBar.classList.add('progress-bar');
        progressBar.style.width = habit.progress + '%';

        const completeButton = document.createElement('button');
        completeButton.textContent = 'Mark as Complete';
        completeButton.classList.add('complete-btn');
        completeButton.addEventListener('click', function () {
            markHabitComplete(habit.id);
        });

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-btn');
        editButton.addEventListener('click', function () {
            startEditHabit(habit.id);
        });

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-btn');
        removeButton.addEventListener('click', function () {
            removeHabit(habit.id);
        });

        progressDiv.appendChild(progressBar);
        habitDiv.appendChild(habitTitle);
        habitDiv.appendChild(progressDiv);
        habitDiv.appendChild(completeButton);
        habitDiv.appendChild(editButton);
        habitDiv.appendChild(removeButton);

        habitList.appendChild(habitDiv);
    });
}

function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach(function (category) {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.textContent = category;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function () {
            removeCategory(category);
        });

        categoryItem.appendChild(deleteButton);
        categoryList.appendChild(categoryItem);
    });
}

function resetProgressIfNeeded(habit) {
    const today = new Date().toISOString().split('T')[0];
    if (habit.lastUpdated !== today) {
        if (habit.frequency === 'daily' || (habit.frequency === 'weekly' && new Date(habit.lastUpdated) < new Date(today).setDate(new Date(today).getDate() - 7))) {
            habit.progress = 0;
            habit.completed = false;
            habit.lastUpdated = today;
        }
    }
}

function markHabitComplete(id) {
    habits = habits.map(function (habit) {
        if (habit.id === id) {
            habit.progress = Math.min(habit.progress + 25, 100);
            habit.completed = habit.progress === 100;
            if (habit.completed) {
                habit.streak += 1;
                if (habit.streak > habit.longestStreak) {
                    habit.longestStreak = habit.streak;
                }
            }
            habit.lastUpdated = new Date().toISOString().split('T')[0];
        }
        return habit;
    });
    updateLocalStorage();
    renderHabits();
    updateOverview();
    updateAnalytics();
}

function removeHabit(id) {
    habits = habits.filter(function (habit) {
        return habit.id !== id;
    });
    updateLocalStorage();
    renderHabits();
    updateOverview();
    updateAnalytics();
}

function startEditHabit(id) {
    const habit = habits.find(habit => habit.id === id);
    if (habit) {
        habitToEdit = id;
        editHabitNameInput.value = habit.name;
        editHabitCategorySelect.value = habit.category;
        editHabitFrequencySelect.value = habit.frequency;
        editHabitSection.style.display = 'block';
        habitForm.style.display = 'none';
    }
}

function editHabit(id, newName, newCategory, newFrequency) {
    habits = habits.map(function (habit) {
        if (habit.id === id) {
            habit.name = newName;
            habit.category = newCategory;
            habit.frequency = newFrequency;
        }
        return habit;
    });
    updateLocalStorage();
    renderHabits();
    updateOverview();
    updateAnalytics();
}

function removeCategory(name) {
    categories = categories.filter(category => category !== name);
    updateCategoryOptions();
    updateLocalStorage();
    renderCategories();
}

function updateCategoryOptions() {
    habitCategorySelect.innerHTML = '';
    editHabitCategorySelect.innerHTML = '';
    categories.forEach(function (category) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        habitCategorySelect.appendChild(option);
        editHabitCategorySelect.appendChild(option);
    });
}

function updateOverview() {
    const totalHabits = habits.length;
    const completedHabits = habits.filter(habit => habit.completed).length;
    const longestStreak = Math.max(...habits.map(habit => habit.longestStreak), 0);

    totalHabitsEl.textContent = totalHabits;
    completedHabitsEl.textContent = completedHabits;
    longestStreakEl.textContent = `${longestStreak} days`;
}

function updateAnalytics() {
    const healthCompleted = habits.filter(habit => habit.completed && habit.category === 'health').length;
    const productivityCompleted = habits.filter(habit => habit.completed && habit.category === 'productivity').length;
    const learningCompleted = habits.filter(habit => habit.completed && habit.category === 'learning').length;

    document.getElementById('health-completed').textContent = healthCompleted;
    document.getElementById('productivity-completed').textContent = productivityCompleted;
    document.getElementById('learning-completed').textContent = learningCompleted;
}

function updateLocalStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('categories', JSON.stringify(categories));
}

renderHabits();
renderCategories();
updateCategoryOptions();
updateOverview();
updateAnalytics();
