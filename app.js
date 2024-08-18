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
const categoryForm = document.getElementById('category-form');
const newCategoryInput = document.getElementById('new-category');
const categoryList = document.getElementById('category-list');
const reminderForm = document.getElementById('reminder-form');
const reminderHabitSelect = document.getElementById('reminder-habit');
const reminderTimeInput = document.getElementById('reminder-time');
const reminderFrequencySelect = document.getElementById('reminder-frequency');
const reminderList = document.getElementById('reminder-list');
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['health', 'productivity', 'learning'];
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
let habitToEdit = null;

document.addEventListener('DOMContentLoaded', () => {
    renderHabits();
    renderCategories();
    renderReminders();
    updateCategoryOptions();
    updateOverview();
    updateAnalytics();
    requestNotificationPermission();
});

habitForm.addEventListener('submit', handleHabitSubmit);
editHabitForm.addEventListener('submit', handleEditHabitSubmit);
cancelEditBtn.addEventListener('click', cancelEdit);
categoryForm.addEventListener('submit', handleCategorySubmit);
reminderForm.addEventListener('submit', handleReminderSubmit);
themeSwitcher.addEventListener('click', toggleTheme);

function handleHabitSubmit(event) {
    event.preventDefault();
    const habitName = habitNameInput.value.trim();
    if (habitName) {
        addHabit(habitName, habitCategorySelect.value, habitFrequencySelect.value);
        habitNameInput.value = '';
    }
}

function handleEditHabitSubmit(event) {
    event.preventDefault();
    const newName = editHabitNameInput.value.trim();
    if (newName && habitToEdit) {
        editHabit(habitToEdit, newName, editHabitCategorySelect.value, editHabitFrequencySelect.value);
        habitToEdit = null;
        toggleEditSection(false);
    }
}

function handleCategorySubmit(event) {
    event.preventDefault();
    const newCategory = newCategoryInput.value.trim();
    if (newCategory) {
        addCategory(newCategory);
        newCategoryInput.value = '';
    }
}

function handleReminderSubmit(event) {
    event.preventDefault();
    const habitId = reminderHabitSelect.value;
    const reminderTime = reminderTimeInput.value;
    const reminderFrequency = reminderFrequencySelect.value;
    if (habitId && reminderTime) {
        addReminder(habitId, reminderTime, reminderFrequency);
        reminderTimeInput.value = '';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
}

function cancelEdit() {
    habitToEdit = null;
    toggleEditSection(false);
}

function toggleEditSection(show) {
    editHabitSection.style.display = show ? 'block' : 'none';
    habitForm.style.display = show ? 'none' : 'block';
}

function addHabit(name, category, frequency) {
    const habit = {
        id: Date.now(),
        name,
        category,
        frequency,
        completed: false,
        progress: 0,
        streak: 0,
        longestStreak: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
    };
    habits.push(habit);
    updateLocalStorage();
    renderHabits();
    updateOverview();
    updateAnalytics();
    updateReminderOptions();
}

function editHabit(id, newName, newCategory, newFrequency) {
    habits = habits.map(habit => 
        habit.id === id
            ? { ...habit, name: newName, category: newCategory, frequency: newFrequency }
            : habit
    );
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

function addReminder(habitId, time, frequency) {
    const reminder = {
        id: Date.now(),
        habitId,
        time,
        frequency,
    };
    reminders.push(reminder);
    updateLocalStorage();
    renderReminders();
    scheduleNotification(reminder);
}

const filterCategorySelect = document.getElementById('filter-category');

filterCategorySelect.addEventListener('change', () => {
    const selectedCategory = filterCategorySelect.value;
    renderHabits(selectedCategory);
});

function renderHabits(filter = 'all') {
    habitList.innerHTML = '';
    habits
        .filter(habit => filter === 'all' || habit.category === filter)
        .forEach(habit => {
            resetProgressIfNeeded(habit);
            const habitDiv = document.createElement('div');
            habitDiv.classList.add('habit');

            const habitTitle = document.createElement('h3');
            habitTitle.textContent = `${habit.name} (${habit.category})`;
            
            if (habit.streak >= 10) {
                const badge = document.createElement('span');
                badge.classList.add('badge');
                badge.textContent = `🔥 Streak: ${habit.streak}`;
                habitTitle.appendChild(badge);
            }

            const progressDiv = document.createElement('div');
            progressDiv.classList.add('progress');

            const progressBar = document.createElement('span');
            progressBar.classList.add('progress-bar');
            progressBar.style.width = `${habit.progress}%`;

            const completeButton = document.createElement('button');
            completeButton.textContent = 'Mark as Complete';
            completeButton.classList.add('complete-btn');
            completeButton.addEventListener('click', () => markHabitComplete(habit.id));

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-btn');
            editButton.addEventListener('click', () => startEditHabit(habit.id));

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.classList.add('remove-btn');
            removeButton.addEventListener('click', () => removeHabit(habit.id));

            progressDiv.appendChild(progressBar);
            habitDiv.appendChild(habitTitle);
            habitDiv.appendChild(progressDiv);
            habitDiv.appendChild(completeButton);
            habitDiv.appendChild(editButton);
            habitDiv.appendChild(removeButton);

            habitList.appendChild(habitDiv);
        });
    updateReminderOptions();
}



function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.textContent = category;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => removeCategory(category));

        categoryItem.appendChild(deleteButton);
        categoryList.appendChild(categoryItem);
    });
}

function renderReminders() {
    reminderList.innerHTML = '';
    reminders.forEach(reminder => {
        const habit = habits.find(h => h.id === reminder.habitId);
        const reminderItem = document.createElement('div');
        reminderItem.classList.add('reminder-item');
        reminderItem.textContent = `Reminder for ${habit.name} at ${reminder.time} (${reminder.frequency})`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => removeReminder(reminder.id));

        reminderItem.appendChild(deleteButton);
        reminderList.appendChild(reminderItem);
    });
}

function updateReminderOptions() {
    reminderHabitSelect.innerHTML = '';
    habits.forEach(habit => {
        const option = document.createElement('option');
        option.value = habit.id;
        option.textContent = habit.name;
        reminderHabitSelect.appendChild(option);
    });
}

function updateOverview() {
    const totalHabits = habits.length;
    const completedHabits = habits.filter(habit => habit.completed).length;
    const longestStreak = Math.max(...habits.map(habit => habit.longestStreak), 0);

    document.getElementById('total-habits').textContent = totalHabits;
    document.getElementById('completed-habits').textContent = completedHabits;
    document.getElementById('longest-streak').textContent = `${longestStreak} days`;
}

function updateAnalytics() {
    const healthCompleted = habits.filter(habit => habit.completed && habit.category === 'health').length;
    const productivityCompleted = habits.filter(habit => habit.completed && habit.category === 'productivity').length;
    const learningCompleted = habits.filter(habit => habit.completed && habit.category === 'learning').length;

    document.getElementById('health-completed').textContent = healthCompleted;
    document.getElementById('productivity-completed').textContent = productivityCompleted;
    document.getElementById('learning-completed').textContent = learningCompleted;
}

function resetProgressIfNeeded(habit) {
    const today = new Date().toISOString().split('T')[0];
    if (habit.lastUpdated !== today) {
        const resetCondition = habit.frequency === 'daily' || (habit.frequency === 'weekly' && new Date(habit.lastUpdated) < new Date(today).setDate(new Date(today).getDate() - 7));
        if (resetCondition) {
            habit.progress = 0;
            habit.completed = false;
            habit.lastUpdated = today;
        }
    }
}

function markHabitComplete(id) {
    habits = habits.map(habit => {
        if (habit.id === id) {
            habit.progress = Math.min(habit.progress + 25, 100);
            habit.completed = habit.progress === 100;
            if (habit.completed) {
                habit.streak += 1;
                habit.longestStreak = Math.max(habit.longestStreak, habit.streak);
                checkStreakMilestone(habit.streak, habit.name);
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

function checkStreakMilestone(streak, habitName) {
    const milestones = [5, 10, 20, 50, 100];
    if (milestones.includes(streak)) {
        alert(`Congratulations! You've reached a streak of ${streak} days on your habit: ${habitName}. Keep up the great work!`);
    }
}


function removeHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    reminders = reminders.filter(reminder => reminder.habitId !== id);
    updateLocalStorage();
    renderHabits();
    updateOverview();
    renderReminders();
    updateAnalytics();
}

function removeCategory(name) {
    categories = categories.filter(category => category !== name);
    updateCategoryOptions();
    updateLocalStorage();
    renderCategories();
}

function removeReminder(id) {
    const reminderItem = document.querySelector(`.reminder-item[data-id="${id}"]`);
    if (reminderItem) {
        reminderItem.classList.add('removed');
        setTimeout(() => {
            reminders = reminders.filter(reminder => reminder.id !== id);
            updateLocalStorage();
            renderReminders();
        }, 500);
    } else {
        reminders = reminders.filter(reminder => reminder.id !== id);
        updateLocalStorage();
        renderReminders();
    }
}

function scheduleNotification(reminder) {
    const [hours, minutes] = reminder.time.split(':');
    const now = new Date();
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    if (reminderTime > now) {
        const timeout = reminderTime - now;
        setTimeout(() => {
            showNotification(reminder);
            if (reminder.frequency === 'daily' || reminder.frequency === 'weekly') {
                scheduleRecurringNotification(reminder);
            }
        }, timeout);
    }
}

function scheduleRecurringNotification(reminder) {
    const interval = reminder.frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    setInterval(() => showNotification(reminder), interval);
}

function showNotification(reminder) {
    const habit = habits.find(h => h.id === reminder.habitId);
    if (habit && Notification.permission === 'granted') {
        new Notification(`Habit Reminder`, {
            body: `Time to work on your habit: ${habit.name}`,
            icon: 'path/to/icon.png'
        });
    }
}

function requestNotificationPermission() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                reminders.forEach(scheduleNotification);
            }
        });
    }
}

function updateCategoryOptions() {
    habitCategorySelect.innerHTML = '';
    editHabitCategorySelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        habitCategorySelect.appendChild(option);
        editHabitCategorySelect.appendChild(option);
    });
}

function updateLocalStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('reminders', JSON.stringify(reminders));
}
