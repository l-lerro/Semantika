// Init Supabase
const supabaseUrl = 'https://mhhggwkrgyopzazdobre.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaGdnd2tyZ3lvcHphemRvYnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzM0ODIsImV4cCI6MjA4MDEwOTQ4Mn0.C-Z80ffr--fAbc6tGbraRCPkW4uQaahkcx_60jy9_2U';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Get Elements
const inputField = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const listContainer = document.getElementById('guesses-list');
const attemptsEl = document.getElementById('attempts');
const bestRankEl = document.getElementById('best-rank');
const infoDiv = document.querySelector('.info');

// Game state
let attempts = 0;
let bestRank = Infinity;
let guessedWords = new Set();

// Eventi
submitBtn.addEventListener('click', playTurn);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') playTurn();
});


// Main
async function playTurn() {
    const word = inputField.value.trim().toLowerCase();

    if (!word) return;

    if (guessedWords.has(word)) {
        inputField.value = '';
        return;
    }

    submitBtn.disabled = true;
    inputField.disabled = true;

    // SB call
    try {
        const { data, error } = await _supabase
            .rpc('guess_word', { user_guess: word });

        if (error) throw error;

        if (data.length === 0) {
            // TODO - Aggiungi parola non nel dizionario
        } else {
            const result = data[0];
            
            guessedWords.add(word);
            attempts++;

            if (attempts === 1) {
                const infoDiv = document.querySelector('.info');
                if (infoDiv) {
                    infoDiv.classList.add('fade-out');
                }
            }
            
            if (result.rank < bestRank) {
                bestRank = result.rank;
            }

            updateStats();
            addResultToScreen(result);

            if (result.rank === 1) {
                setTimeout(() => {
                    //TO DO salva sessione
                }, 500);
            }
        }
    } catch (err) {
        console.error('Errore:', err);
        alert('Errore di connessione! Riprova.');
    } finally {

        submitBtn.disabled = false;
        inputField.disabled = false;
        inputField.value = '';
        inputField.focus();
    }
}


function updateStats() {
    attemptsEl.textContent = attempts;
    bestRankEl.textContent = bestRank === Infinity ? '-' : bestRank;
}


//TO DO
function getTempCategory(rank, totalCandidates = 1485) {
    const percentage = (rank / totalCandidates) * 100;

    if (rank === 1) {
        return { class: 'winner', emoji: '🎉', label: 'TROVATA!' };
    }
    if (percentage <= 3) {
        return { class: 'burning', emoji: '🔥', label: 'Rovente' };
    }
    if (percentage <= 10) {
        return { class: 'hot', emoji: '🌶️', label: 'Caldo' };
    }
    if (percentage <= 30) {
        return { class: 'warm', emoji: '☀️', label: 'Tiepido' };
    }
    if (percentage <= 60) {
        return { class: 'cool', emoji: '🌤️', label: 'Fresco' };
    }
    if (percentage <= 85) {
        return { class: 'cold', emoji: '❄️', label: 'Freddo' };
    }
    return { class: 'frozen', emoji: '🧊', label: 'Gelido' };
}


function addResultToScreen(result) {
    const row = document.createElement('div');
    const temp = getTempCategory(result.rank);
    
    row.className = `guess-row ${temp.class}`;

    if (result.rank === 1) {
        // Caso vittoria
        row.innerHTML = `
            <div class="word-container">
                <span class="emoji">${temp.emoji}</span>
                <strong style="font-size: 1.4rem;">${result.word.toUpperCase()}</strong>
            </div>
            <div class="rank-container">
                <span class="rank-label">${temp.label}</span>
            </div>
        `;
    } else {
        // Caso normale
        row.innerHTML = `
            <div class="word-container">
                <span class="emoji">${temp.emoji}</span>
                <span>${result.word}</span>
            </div>
            <div class="rank-container">
                <span class="rank">Pos: ${result.rank}</span>
            </div>
        `;
        //DONE - Rimosso result.label
    }


    listContainer.prepend(row);
}


//!! Entra nel box testo all'avvio
inputField.focus();