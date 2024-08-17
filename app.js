const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const habitList = document.getElementById('habit-list');
let habits = [];

habitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const habitName = habitNameInput.value.trim();
    if (habitName !== '') {
        addHabit(habitName);
        habitNameInput.value = '';
    }
});

function addHabit(name) {
    const habit = {
        id: Date.now(),
        name: name,
        completed: false,
        progress: 0
    };
    habits.push(habit);
    renderHabits();
}

function renderHabits() {
    habitList.innerHTML = '';
    habits.forEach(function (habit) {
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

function markHabitComplete(id) {
    habits = habits.map(function (habit) {
        if (habit.id === id) {
            habit.progress = 100;
            habit.completed = true;
        }
        return habit;
    });
    renderHabits();
}

function removeHabit(id) {
    habits = habits.filter(function (habit) {
        return habit.id !== id;
    });
    renderHabits();
}
