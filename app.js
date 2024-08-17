const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const habitFrequencySelect = document.getElementById('habit-frequency');
const habitList = document.getElementById('habit-list');
let habits = JSON.parse(localStorage.getItem('habits')) || [];

habitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const habitName = habitNameInput.value.trim();
    const habitFrequency = habitFrequencySelect.value;
    if (habitName !== '') {
        addHabit(habitName, habitFrequency);
        habitNameInput.value = '';
    }
});

function addHabit(name, frequency) {
    const habit = {
        id: Date.now(),
        name: name,
        frequency: frequency,
        completed: false,
        progress: 0,
        lastUpdated: new Date().toISOString().split('T')[0] // Store only the date
    };
    habits.push(habit);
    updateLocalStorage();
    renderHabits();
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
            habit.lastUpdated = new Date().toISOString().split('T')[0];
        }
        return habit;
    });
    updateLocalStorage();
    renderHabits();
}

function removeHabit(id) {
    habits = habits.filter(function (habit) {
        return habit.id !== id;
    });
    updateLocalStorage();
    renderHabits();
}

function updateLocalStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

renderHabits();
