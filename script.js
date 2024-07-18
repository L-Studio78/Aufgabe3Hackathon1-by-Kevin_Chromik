document.getElementById('start-quiz-button').addEventListener('click', startQuiz);
document.getElementById('restart-button').addEventListener('click', resetGame);

let currentMovie = null;
let currentQuestionIndex = 0;
let correctAnswerIndex = 0;
let scoreLevel = 0; // Startet bei der ersten Stufe
let tabCheated = false;

const apiKey = '809f0efc';
const genreMap = {
    action: 'Action',
    thriller: 'Thriller',
    comedy: 'Comedy',
    drama: 'Drama'
};

const questions = [
    { key: 'Director', question: 'Wie lautet der Name des Regisseurs von' },
    { key: 'Year', question: 'In welchem Jahr wurde der Film veröffentlicht' },
    { key: 'Genre', question: 'Welches Genre hat der Film' },
    { key: 'Actors', question: 'Nenne einen der Hauptdarsteller von' }
];

async function getRandomMovieByGenre(genre) {
    try {
        const url = `https://www.omdbapi.com/?apikey=${apiKey}&type=movie&s=${genreMap[genre]}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === 'True') {
            const movies = data.Search;
            if (movies.length > 0) {
                const randomIndex = Math.floor(Math.random() * movies.length);
                const randomMovieID = movies[randomIndex].imdbID;
                const movieResponse = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${randomMovieID}`);
                return await movieResponse.json();
            } else {
                throw new Error('Keine Filme gefunden!');
            }
        } else {
            throw new Error('Fehler beim Abrufen der Filme');
        }
    } catch (error) {
        console.error('Fehler:', error);
        showGameOver();
    }
}

async function startQuiz() {
    const genreSelect = document.getElementById('genre-select');
    const selectedGenre = genreSelect.value;
    document.getElementById('quiz-question').style.display = "flex";
    scoreLevel = 0;
    updateScoreboard();
    await loadNewQuestion(selectedGenre);
}

async function loadNewQuestion(genre) {
    try {
        currentMovie = await getRandomMovieByGenre(genre);
        currentQuestionIndex = Math.floor(Math.random() * questions.length);
        displayQuizQuestion(currentMovie);
    } catch (error) {
        console.error('Fehler beim Laden der Frage:', error);
        showGameOver();
    }
}

function displayQuizQuestion(movie) {
    if (!movie) {
        console.error('Kein Film geladen');
        showGameOver();
        return;
    }

    const questionObj = questions[currentQuestionIndex];
    const questionText = `${questionObj.question} "${movie.Title}"?`;
    
    // Frage anzeigen
    document.getElementById('question-text').textContent = questionText;

    // Bild anzeigen
    document.getElementById('movie-poster').innerHTML = `<img src="${movie.Poster}" alt="${movie.Title} Poster" style="max-width: 200px; max-height: 300px;">`;

    // Antwortmöglichkeiten generieren und anzeigen
    generateWrongAnswers(questionObj.key, movie[questionObj.key]).then(wrongAnswers => {
        const options = [...wrongAnswers];
        correctAnswerIndex = Math.floor(Math.random() * 4);
        options.splice(correctAnswerIndex, 0, movie[questionObj.key]);

        document.querySelectorAll('.option-button').forEach((button, index) => {
            button.textContent = options[index];
            button.onclick = () => checkAnswer(index);
        });

        // Sprachausgabe der Frage
        speak(questionText);
    });
}

async function generateWrongAnswers(key, correctAnswer) {
    const wrongAnswers = new Set();
    try {
        while (wrongAnswers.size < 3) {
            const movie = await getRandomMovieByGenre(document.getElementById('genre-select').value);
            if (movie[key] !== correctAnswer) {
                wrongAnswers.add(movie[key]);
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden falscher Antworten:', error);
    }
    return [...wrongAnswers];
}

function checkAnswer(selectedIndex) {
    if (selectedIndex === correctAnswerIndex) {
        alert('Richtig!');
        scoreLevel += 1;
        updateScoreboard();
        loadNewQuestion(document.getElementById('genre-select').value);
    } else {
        showGameOver();
    }
}

function updateScoreboard() {
    const scoreList = document.getElementById('score-list').children;
    for (let i = 0; i < scoreList.length; i++) {
        if (i === scoreLevel) {
            scoreList[i].classList.add('current');
        } else {
            scoreList[i].classList.remove('current');
        }
    }
}

function showGameOver() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('quiz-question').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
    const gameOverMessage = tabCheated ? "Schummler! Du hast den Tab gewechselt." : "Game Over! Du hast die Antwort falsch beantwortet.";
    document.getElementById('game-over-message').textContent = gameOverMessage;
}

function resetGame() {
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('game-over').style.display = 'none';
    tabCheated = false;
    startQuiz();
}

// Detect tab switching
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        tabCheated = true;
    }
});

// Funktion zur Sprachausgabe
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE'; // Setzt die Sprache auf Deutsch
    // Optionale Anpassung der Stimme, um eine ähnliche Stimme wie Günther Jauch zu emulieren
    utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.name.includes('Google')) || null;
    window.speechSynthesis.speak(utterance);
}
