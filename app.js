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
    initializeTheme();
    renderHabits();
    renderCategories();
    renderReminders();
    updateCategoryOptions();
    updateOverview();
    updateAnalytics();
    requestNotificationPermission();
    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
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
    const isDarkMode = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeSwitcherIcon();
}

function updateThemeSwitcherIcon() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeSwitcher.textContent = isDarkMode ? '☀️' : '🌙';
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
    updateThemeSwitcherIcon();
}

function cancelEdit() {
    habitToEdit = null;
    toggleEditSection(false);
}

function startEditHabit(id) {
    habitToEdit = id;
    const habit = habits.find(h => h.id === id);
    if (habit) {
        editHabitNameInput.value = habit.name;
        editHabitCategorySelect.value = habit.category;
        editHabitFrequencySelect.value = habit.frequency;
        toggleEditSection(true);
    }
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
            
            // Show streak badge for all habits with active streak
            if (habit.streak > 0) {
                const badge = document.createElement('span');
                badge.classList.add('badge');
                if (habit.streak >= 10) {
                    badge.textContent = `🔥 Streak: ${habit.streak}`;
                } else {
                    badge.textContent = `📈 Streak: ${habit.streak}`;
                }
                habitTitle.appendChild(badge);
            }

            const progressDiv = document.createElement('div');
            progressDiv.classList.add('progress');

            const progressBar = document.createElement('span');
            progressBar.classList.add('progress-bar');
            progressBar.style.width = `${habit.progress}%`;

            const progressText = document.createElement('span');
            progressText.classList.add('progress-text');
            progressText.textContent = `${habit.progress}%`;

            const completeButton = document.createElement('button');
            completeButton.textContent = habit.completed ? '✓ Completed Today' : 'Mark as Complete';
            completeButton.classList.add('complete-btn');
            completeButton.disabled = habit.completed;
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
            progressDiv.appendChild(progressText);
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
    if (categories.length === 0) {
        categoryList.innerHTML = '<p>No categories added yet.</p>';
        return;
    }
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.setAttribute('data-category', category);
        
        const categoryName = document.createElement('span');
        categoryName.textContent = category;
        categoryItem.appendChild(categoryName);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.type = 'button';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeCategory(category);
        });

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
    const lastUpdatedDate = new Date(habit.lastUpdated);
    const todayDate = new Date(today);
    
    // Calculate the difference in days
    const timeDiff = todayDate.getTime() - lastUpdatedDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // If more than 1 day has passed, reset streak
    if (dayDiff > 1) {
        habit.streak = 0;
    }
    
    // Reset daily progress if a new day has started
    if (habit.lastUpdated !== today) {
        const resetCondition = habit.frequency === 'daily' || (habit.frequency === 'weekly' && dayDiff >= 7);
        if (resetCondition) {
            habit.progress = 0;
            habit.completed = false;
        }
    }
}

function markHabitComplete(id) {
    const today = new Date().toISOString().split('T')[0];
    habits = habits.map(habit => {
        if (habit.id === id) {
            // First, check if streak needs to be reset (if a day was missed)
            resetProgressIfNeeded(habit);
            
            habit.progress = Math.min(habit.progress + 25, 100);
            habit.completed = habit.progress === 100;
            
            if (habit.completed) {
                // Only increment streak if it's the first completion today
                if (habit.lastUpdated !== today) {
                    habit.streak += 1;
                    habit.longestStreak = Math.max(habit.longestStreak, habit.streak);
                    checkStreakMilestone(habit.streak, habit.name);
                    console.log(`✅ ${habit.name}: Streak increased to ${habit.streak}`);
                }
            }
            habit.lastUpdated = today;
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
    // Check if category is used by any habits
    const isUsed = habits.some(habit => habit.category === name);
    if (isUsed) {
        alert(`Cannot delete "${name}" category because it's being used by one or more habits.`);
        return;
    }
    
    if (confirm(`Are you sure you want to delete the "${name}" category?`)) {
        categories = categories.filter(category => category !== name);
        updateCategoryOptions();
        updateLocalStorage();
        renderCategories();
    }
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
    // Clear existing options
    habitCategorySelect.innerHTML = '';
    editHabitCategorySelect.innerHTML = '';
    filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Add categories from the categories array
    if (categories && categories.length > 0) {
        categories.forEach(category => {
            // Add to habit category select
            const option1 = document.createElement('option');
            option1.value = category;
            option1.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            habitCategorySelect.appendChild(option1);
            
            // Add to edit habit category select
            const option2 = document.createElement('option');
            option2.value = category;
            option2.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            editHabitCategorySelect.appendChild(option2);
            
            // Add to filter category select
            const option3 = document.createElement('option');
            option3.value = category;
            option3.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            filterCategorySelect.appendChild(option3);
        });
    } else {
        // Fallback to default categories
        const defaultCategories = ['health', 'productivity', 'learning'];
        defaultCategories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category;
            option1.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            habitCategorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = category;
            option2.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            editHabitCategorySelect.appendChild(option2);
            
            const option3 = document.createElement('option');
            option3.value = category;
            option3.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            filterCategorySelect.appendChild(option3);
        });
    }
}

function updateLocalStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        habits = [];
        categories = ['health', 'productivity', 'learning'];
        reminders = [];
        updateLocalStorage();
        renderHabits();
        renderCategories();
        renderReminders();
        updateCategoryOptions();
        updateOverview();
        updateAnalytics();
        alert('All data has been cleared.');
    }
}
