const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const habitFrequencySelect = document.getElementById('habit-frequency');
const habitList = document.getElementById('habit-list');
const editHabitForm = document.getElementById('edit-habit-form');
const editHabitNameInput = document.getElementById('edit-habit-name');
const editHabitFrequencySelect = document.getElementById('edit-habit-frequency');
const editHabitSection = document.getElementById('edit-habit');
const cancelEditBtn = document.getElementById('cancel-edit');
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let habitToEdit = null;

habitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const habitName = habitNameInput.value.trim();
    const habitFrequency = habitFrequencySelect.value;
    if (habitName !== '') {
        addHabit(habitName, habitFrequency);
        habitNameInput.value = '';
    }
});

editHabitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const newName = editHabitNameInput.value.trim();
    const newFrequency = editHabitFrequencySelect.value;
    if (newName !== '' && habitToEdit !== null) {
        editHabit(habitToEdit, newName, newFrequency);
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

function addHabit(name, frequency) {
    const habit = {
        id: Date.now(),
        name: name,
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
}

function renderHabits() {
    habitList.innerHTML = '';
    habits.forEach(function (habit) {
        resetProgressIfNeeded(habit);
        const habitDiv = document.createElement('div');
        habitDiv.classList.add('habit');

        const habitTitle = document.createElement('h3');
        habitTitle.textContent = habit.name;

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
}

function removeHabit(id) {
    habits = habits.filter(function (habit) {
        return habit.id !== id;
    });
    updateLocalStorage();
    renderHabits();
    updateOverview();
}

function startEditHabit(id) {
    const habit = habits.find(habit => habit.id === id);
    if (habit) {
        habitToEdit = id;
        editHabitNameInput.value = habit.name;
        editHabitFrequencySelect.value = habit.frequency;
        editHabitSection.style.display = 'block';
        habitForm.style.display = 'none';
    }
}

function editHabit(id, newName, newFrequency) {
    habits = habits.map(function (habit) {
        if (habit.id === id) {
            habit.name = newName;
            habit.frequency = newFrequency;
        }
        return habit;
    });
    updateLocalStorage();
    renderHabits();
    updateOverview();
}

function updateOverview() {
    const totalHabits = habits.length;
    const completedHabits = habits.filter(habit => habit.completed).length;
    const longestStreak = Math.max(...habits.map(habit => habit.longestStreak), 0);

    totalHabitsEl.textContent = totalHabits;
    completedHabitsEl.textContent = completedHabits;
    longestStreakEl.textContent = `${longestStreak} days`;
}

function updateLocalStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

renderHabits();
updateOverview();
