document.getElementById('start-quiz-button').addEventListener('click', startQuiz);

let currentMovie = null;
let lives = 3;
const apiKey = 'dein_api_schlüssel';
const moviesByGenre = {
    action: ["Mad Max: Fury Road", "Die Hard", "The Dark Knight"],
    thriller: ["Inception", "Se7en", "Gone Girl"],
    comedy: ["Superbad", "The Big Lebowski", "Step Brothers"],
    drama: ["The Shawshank Redemption", "Forrest Gump", "Fight Club"]
};

function updateLives() {
    document.getElementById('lives').textContent = '❤️'.repeat(lives);
}

function startQuiz() {
    const genreSelect = document.getElementById('genre-select');
    const selectedGenre = genreSelect.value;

    const movies = moviesByGenre[selectedGenre];
    const randomIndex = Math.floor(Math.random() * movies.length);
    const randomMovieTitle = movies[randomIndex];

    const url = `http://www.omdbapi.com/?t=${randomMovieTitle}&apikey=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.Response === 'True') {
                currentMovie = data;
                displayQuizQuestion(data);
            } else {
                alert('Film nicht gefunden!');
            }
        })
        .catch(error => console.error('Fehler:', error));
}

function displayQuizQuestion(movie) {
    document.getElementById('quiz-question').style.display = 'block';
    document.getElementById('question-text').textContent = `Wie lautet der Name des Regisseurs von "${movie.Title}"?`;
    document.getElementById('movie-poster').innerHTML = `<img src="${movie.Poster}" alt="${movie.Title} Poster">`;

    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
}

function checkAnswer() {
    const answer = document.getElementById('answer-input').value;
    if (answer.toLowerCase() === currentMovie.Director.toLowerCase()) {
        alert('Richtig!');
        // Weitere Frage stellen
        startQuiz();
    } else {
        lives -= 1;
        updateLives();
        if (lives > 0) {
            alert('Falsch! Der richtige Regisseur ist: ' + currentMovie.Director);
            // Weitere Frage stellen
            startQuiz();
        } else {
            alert('Game Over! Keine Leben mehr übrig.');
            resetGame();
        }
    }
}

function resetGame() {
    lives = 3;
    updateLives();
    document.getElementById('quiz-question').style.display = 'none';
}
