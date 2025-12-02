// =====================================
// ELEMENT REFERENCES
// =====================================
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

// ===========================
// DARK MODE
// ===========================
(function () {
    const toggleBtn = document.getElementById("darkModeToggle");
    if (!toggleBtn) return;

    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark");
        toggleBtn.textContent = "☀️";
    } else {
        toggleBtn.textContent = "🌙";
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const enabled = document.body.classList.contains("dark");
        localStorage.setItem("darkMode", enabled ? "enabled" : "disabled");
        toggleBtn.textContent = enabled ? "☀️" : "🌙";
    });
})();

// =====================================
// LOAD FROM LOCAL STORAGE
// =====================================
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['health', 'productivity', 'learning'];
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
let habitToEdit = null;

// Normalize habits for streak values (backward compatibility)
habits = habits.map(habit => {
    habit.streak = habit.streak || 0;           // Habit completion streak
    habit.dailyStreak = habit.dailyStreak || 0; // Daily click-in streak
    habit.longestStreak = habit.longestStreak || 0;
    habit.lastCompleted = habit.lastCompleted || null;
    habit.lastDailyCheck = habit.lastDailyCheck || null;
    habit.lastUpdated = habit.lastUpdated || new Date().toISOString().split('T')[0];
    habit.progress = habit.progress || 0;
    habit.completed = habit.completed || false;
    return habit;
});

document.addEventListener('DOMContentLoaded', () => {
    renderHabits();
    renderCategories();
    renderReminders();
    updateCategoryOptions();
    updateOverview();
    updateAnalytics();
    requestNotificationPermission();
});

// =====================================
// EVENT LISTENERS
// =====================================
habitForm.addEventListener('submit', handleHabitSubmit);
editHabitForm.addEventListener('submit', handleEditHabitSubmit);
cancelEditBtn.addEventListener('click', cancelEdit);
categoryForm.addEventListener('submit', handleCategorySubmit);
reminderForm.addEventListener('submit', handleReminderSubmit);

// =====================================
// FORM HANDLERS
// =====================================
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
        addReminder(Number(habitId), reminderTime, reminderFrequency);
        reminderTimeInput.value = '';
    }
}

// =====================================
// HABIT CRUD
// =====================================
function addHabit(name, category, frequency) {
    const habit = {
        id: Date.now(),
        name,
        category,
        frequency,
        completed: false,
        progress: 0,
        streak: 0,
        dailyStreak: 0,
        longestStreak: 0,
        lastCompleted: null,
        lastDailyCheck: null,
        lastUpdated: new Date().toISOString().split('T')[0]
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

function removeHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    reminders = reminders.filter(reminder => reminder.habitId !== id);
    updateLocalStorage();
    renderHabits();
    updateOverview();
    renderReminders();
    updateAnalytics();
}

// =====================================
// CATEGORY FUNCTIONS
// =====================================
function addCategory(name) {
    categories.push(name);
    updateLocalStorage();
    renderCategories();
    updateCategoryOptions();
}

function removeCategory(name) {
    categories = categories.filter(category => category !== name);
    updateLocalStorage();
    renderCategories();
    updateCategoryOptions();
}

// =====================================
// RENDER FUNCTIONS
// =====================================
function renderHabits(filter = 'all') {
    habitList.innerHTML = '';
    habits
        .filter(habit => filter === 'all' || habit.category === filter)
        .forEach(habit => {
            resetProgressIfNeeded(habit);

            const habitDiv = document.createElement('div');
            habitDiv.classList.add('habit');
            if (document.body.classList.contains('dark')) habitDiv.classList.add('dark');

            const habitTitle = document.createElement('h3');
            habitTitle.textContent = `${habit.name} (${habit.category})`;

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

            // STREAK DISPLAY
            const streakDiv = document.createElement('div');
            streakDiv.className = 'streak';
            const streakCount = habit.streak || 0;
            const dailyStreakCount = habit.dailyStreak || 0;
            streakDiv.textContent = `🔥 Habit Streak: ${streakCount} days | 🌞 Daily Streak: ${dailyStreakCount} days`;
            if (streakCount === 0 && dailyStreakCount === 0) streakDiv.style.display = 'none';

            progressDiv.appendChild(progressBar);

            habitDiv.appendChild(habitTitle);
            habitDiv.appendChild(progressDiv);
            habitDiv.appendChild(completeButton);
            habitDiv.appendChild(editButton);
            habitDiv.appendChild(removeButton);
            habitDiv.appendChild(streakDiv);

            habitList.appendChild(habitDiv);
        });

    updateReminderOptions();
}

// =====================================
// PROGRESS + STREAK LOGIC
// =====================================
function resetProgressIfNeeded(habit) {
    const today = new Date().toISOString().split('T')[0];

    if (habit.lastUpdated !== today) {
        const resetDaily = habit.frequency === 'daily';
        let resetWeekly = false;
        try {
            resetWeekly = habit.frequency === 'weekly' &&
                (new Date(habit.lastUpdated) < new Date(Date.now() - 7 * 86400000));
        } catch (e) {
            resetWeekly = habit.frequency === 'weekly';
        }

        if (resetDaily || resetWeekly) {
            habit.progress = 0;
            habit.completed = false;
            habit.lastUpdated = today;
        }
    }
}

function markHabitComplete(id) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    habits = habits.map(habit => {
        if (habit.id === id) {
            // --- Update Progress ---
            habit.progress = Math.min((habit.progress || 0) + 25, 100);
            habit.completed = habit.progress === 100;

            // --- Habit Completion Streak ---
            if (habit.completed && habit.lastCompleted !== today) {
                if (!habit.lastCompleted) {
                    habit.streak = 1;
                } else if (habit.lastCompleted === yesterday) {
                    habit.streak += 1;
                } else {
                    habit.streak = 1;
                }
                habit.lastCompleted = today;
                habit.longestStreak = Math.max(habit.longestStreak, habit.streak);
                checkStreakMilestone(habit.streak, habit.name);
            }

            // --- Daily Click-in Streak ---
            if (habit.lastDailyCheck !== today) {
                if (!habit.lastDailyCheck) {
                    habit.dailyStreak = 1;
                } else if (habit.lastDailyCheck === yesterday) {
                    habit.dailyStreak += 1;
                } else {
                    habit.dailyStreak = 1;
                }
                habit.lastDailyCheck = today;
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
        alert(`🎉 Congrats! You've reached a streak of ${streak} days for habit: ${habitName}`);
    }
}

// =====================================
// REMINDER FUNCTIONS
// =====================================
function addReminder(habitId, time, frequency) {
    const reminder = {
        id: Date.now(),
        habitId: Number(habitId),
        time,
        frequency,
    };
    reminders.push(reminder);
    updateLocalStorage();
    renderReminders();
    scheduleNotification(reminder);
}

function removeReminder(id) {
    reminders = reminders.filter(rem => rem.id !== id);
    updateLocalStorage();
    renderReminders();
}

function scheduleNotification(reminder) {
    const [hours, minutes] = reminder.time.split(':');
    const now = new Date();
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    if (reminderTime > now) {
        setTimeout(() => {
            showNotification(reminder);
        }, reminderTime - now);
    }
}

function showNotification(reminder) {
    const habit = habits.find(h => h.id === reminder.habitId);
    if (habit && Notification.permission === 'granted') {
        new Notification("Habit Reminder", { body: `Time to work on: ${habit.name}` });
    }
}

function requestNotificationPermission() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

// =====================================
// DROPDOWN OPTIONS UPDATE
// =====================================
function updateCategoryOptions() {
    habitCategorySelect.innerHTML = '';
    editHabitCategorySelect.innerHTML = '';
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;

        const option2 = option1.cloneNode(true);
        habitCategorySelect.appendChild(option1);
        editHabitCategorySelect.appendChild(option2);
    });
}

// =====================================
// OVERVIEW & ANALYTICS
// =====================================
function updateOverview() {
    const totalHabits = habits.length;
    const completedCount = habits.filter(h => h.completed).length;
    const longest = habits.length ? Math.max(...habits.map(h => h.longestStreak || 0)) : 0;

    const totalEl = document.getElementById('total-habits');
    const completedEl = document.getElementById('completed-habits');
    const longestEl = document.getElementById('longest-streak');

    if (totalEl) totalEl.textContent = totalHabits;
    if (completedEl) completedEl.textContent = completedCount;
    if (longestEl) longestEl.textContent = longest + " days";
}

function updateAnalytics() {
    const healthCompletedEl = document.getElementById('health-completed');
    const productivityCompletedEl = document.getElementById('productivity-completed');
    const learningCompletedEl = document.getElementById('learning-completed');

    if (healthCompletedEl) healthCompletedEl.textContent =
        habits.filter(h => h.completed && h.category === 'health').length;
    if (productivityCompletedEl) productivityCompletedEl.textContent =
        habits.filter(h => h.completed && h.category === 'productivity').length;
    if (learningCompletedEl) learningCompletedEl.textContent =
        habits.filter(h => h.completed && h.category === 'learning').length;
}

// =====================================
// LOCAL STORAGE
// =====================================
function updateLocalStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// =====================================
// EDIT HELPERS
// =====================================
function startEditHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    habitToEdit = id;
    editHabitNameInput.value = habit.name;
    editHabitCategorySelect.value = habit.category;
    editHabitFrequencySelect.value = habit.frequency;
    toggleEditSection(true);
}

function toggleEditSection(show) {
    if (!editHabitSection) return;
    editHabitSection.style.display = show ? 'block' : 'none';
}

function updateReminderOptions() {
    if (!reminderHabitSelect) return;
    reminderHabitSelect.innerHTML = '';
    habits.forEach(habit => {
        const opt = document.createElement('option');
        opt.value = habit.id;
        opt.textContent = habit.name;
        reminderHabitSelect.appendChild(opt);
    });
}
