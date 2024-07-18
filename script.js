document.getElementById('start-quiz-button').addEventListener('click', startQuiz);
document.getElementById('restart-button').addEventListener('click', resetGame);

let currentMovie = null;
let currentQuestionIndex = 0;
let correctAnswerIndex = 0;
let scoreLevel = 0;
let tabCheated = false;
let lobbyMusic = new Audio('Sounds/Main.mp3'); // Musik für das Lobby-Menü
let questionMusic = new Audio('Sounds/Question.mp3'); // Musik für Fragen
let correctSound = new Audio('Sounds/Win.mp3'); // Ton für richtige Antwort
let incorrectSound = new Audio('Sounds/Lose.mp3'); // Ton für falsche Antwort

// Startet die Lobby-Musik, wenn die Seite geladen wird
window.addEventListener('DOMContentLoaded', (event) => {
    playMusic();
});

const apiKey = '809f0efc';
const genreMap = {
    action: 'Action',
    thriller: 'Thriller',
    comedy: 'Comedy',
    drama: 'Drama'
};

const questions = [
    { key: 'Director', question: 'Wie lautet der Name des Regisseurs von' },
    { key: 'Year', question: 'Wann war die veröffentlichung des Films' },
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
        showGameOver('Es gab ein Problem beim Abrufen der Filmdaten. Bitte versuche es später erneut.');
    }
}

async function startQuiz() {
    const genreSelect = document.getElementById('genre-select');
    const selectedGenre = genreSelect.value;
    document.getElementById('quiz-question').style.display = "flex";
    scoreLevel = 0;
    updateScoreboard();
    stopMusic();
    questionMusic.loop = true; // Frage-Musik in Dauerschleife abspielen
    questionMusic.play();
    await loadNewQuestion(selectedGenre);
}

async function loadNewQuestion(genre) {
    try {
        currentMovie = await getRandomMovieByGenre(genre);
        currentQuestionIndex = Math.floor(Math.random() * questions.length);
        displayQuizQuestion(currentMovie);
    } catch (error) {
        console.error('Fehler beim Laden der Frage:', error);
        showGameOver('Es gab ein Problem beim Laden der Frage. Bitte versuche es später erneut.');
    }
}

function displayQuizQuestion(movie) {
    if (!movie) {
        console.error('Kein Film geladen');
        showGameOver('Es konnte kein Film geladen werden.');
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
    }).catch(error => {
        console.error('Fehler beim Generieren falscher Antworten:', error);
        showGameOver('Es gab ein Problem beim Generieren der Antwortmöglichkeiten.');
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
        // Sicherstellen, dass wir trotzdem mindestens 3 falsche Antworten haben
        while (wrongAnswers.size < 3) {
            wrongAnswers.add('Falsche Antwort');
        }
    }
    return [...wrongAnswers];
}

function checkAnswer(selectedIndex) {
    if (selectedIndex === correctAnswerIndex) {
        correctSound.play(); // Ton für richtige Antwort abspielen
        alert('Richtig!');
        scoreLevel += 1;
        updateScoreboard();
        loadNewQuestion(document.getElementById('genre-select').value);
    } else {
        incorrectSound.play(); // Ton für falsche Antwort abspielen
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

function showGameOver(message = 'Game Over!') {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('quiz-question').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-message').textContent = message;
    questionMusic.pause(); // Frage-Musik stoppen
}

function resetGame() {
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('game-over').style.display = 'none';
    tabCheated = false;
    questionMusic.loop = true; // Frage-Musik in Dauerschleife abspielen
    questionMusic.play();
    startQuiz();
}

// Detect tab switching
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        tabCheated = true;
    }
});

function playMusic() {
    lobbyMusic.loop = true;
    lobbyMusic.play().catch(error => console.error('Fehler beim Abspielen der Lobby-Musik:', error));
}

// Musik stoppen
function stopMusic() {
    lobbyMusic.pause();
    lobbyMusic.currentTime = 0; // Zurück zum Anfang der Musik
}

// Funktion zur Sprachausgabe
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE'; // Setzt die Sprache auf Deutsch
    // Optionale Anpassung der Stimme, um eine ähnliche Stimme wie Günther Jauch zu emulieren
    utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.name.includes('Google')) || null;
    window.speechSynthesis.speak(utterance);
}
