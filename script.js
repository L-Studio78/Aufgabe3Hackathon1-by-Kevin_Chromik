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
    { key: 'Year', question: 'Wann war die Veröffentlichung des Films' },
    { key: 'Genre', question: 'Welches Genre hat der Film' },
    { key: 'Actors', question: 'Nenne einen der Hauptdarsteller von' }
];

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

async function loadNewQuestion(genre) {
    try {
        currentMovie = await getRandomMovieByGenre(genre);
        const difficultyLevel = Math.min(scoreLevel + 1, questions.length); // Sicherstellen, dass der Schwierigkeitsgrad nicht zu hoch ist
        currentQuestionIndex = Math.floor(Math.random() * difficultyLevel);

        if (scoreLevel >= 9) { // Die letzte Frage (10. Frage) erreichen
            displayWinMessage();
        } else {
            displayQuizQuestion(currentMovie);
        }
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

    document.getElementById('question-text').textContent = questionText;

    document.getElementById('movie-poster').innerHTML = `<img src="${movie.Poster}" alt="${movie.Title} Poster" style="max-width: 200px; max-height: 300px;">`;

    generateWrongAnswers(questionObj.key, movie[questionObj.key]).then(wrongAnswers => {
        const options = [...wrongAnswers];
        correctAnswerIndex = Math.floor(Math.random() * 4);
        options.splice(correctAnswerIndex, 0, movie[questionObj.key]);

        document.querySelectorAll('.option-button').forEach((button, index) => {
            button.textContent = options[index];
            button.onclick = () => checkAnswer(index);
        });

        speak(questionText, 2000); // Verzögerte Sprachausgabe der Frage
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
    scoreLevel = 0; // Zurücksetzen des Punktestands
    updateScoreboard();
    questionMusic.loop = true; // Frage-Musik in Dauerschleife abspielen
    questionMusic.play();
    startQuiz();
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        tabCheated = true;
        showCheatingWarning();
    }
});

function playMusic() {
    lobbyMusic.loop = true;
    lobbyMusic.play().catch(error => console.error('Fehler beim Abspielen der Lobby-Musik:', error));
}

function stopMusic() {
    lobbyMusic.pause();
    lobbyMusic.currentTime = 0; // Zurück zum Anfang der Musik
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function speak(text, delay = 1000) {
    await sleep(delay);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE'; // Setzt die Sprache auf Deutsch
    utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.name.includes('Google')) || null;
    window.speechSynthesis.speak(utterance);
}

function displayWinMessage() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('quiz-question').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-message').innerHTML = `
        <h1>Herzlichen Glückwunsch!</h1>
        <h2>Du hast gewonnen!</h2>
        <img src="https://img.icons8.com/ios/452/money--v1.png" alt="Geld" style="width: 100px; height: 100px;">
        <p>Leider gibt es hier kein echtes Geld, aber du hast es geschafft!</p>
    `;
    questionMusic.pause(); // Frage-Musik stoppen
}

function showCheatingWarning() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('quiz-question').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-message').innerHTML = `
        <h1>Schummeln erkannt!</h1>
        <p>Es sieht so aus, als ob du versucht hast, den Tab zu verlassen. Spiel nicht schummeln!</p>
        <img src="data:image/jpeg;base64,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" alt="Schummeln" style="width: 100px; height: 100px;">
    `;
    questionMusic.pause(); // Frage-Musik stoppen
}
