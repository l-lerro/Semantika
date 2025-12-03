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
const surrenderBtn = document.getElementById('surrender-btn');
const hintBtn = document.getElementById('hint-btn');

// Game state
let attempts = 0;
let bestRank = Infinity;
let guessedWords = new Set();
let hintsUsed = 0;
const MAX_HINTS = 30; // Rimuovi

// Ascolto Eventi
submitBtn.addEventListener('click', playTurn);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') playTurn();
});

if(surrenderBtn) {
    surrenderBtn.addEventListener('click', surrender);
}

if(hintBtn) {
    hintBtn.addEventListener('click', getHint);
}


// Main
async function playTurn() {
    const word = inputField.value.trim().toLowerCase();

    if (!word) return;

    if (guessedWords.has(word)) {
        inputField.value = '';
        triggerShake(inputField);
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
            // TODO - aggiungi animazione errore
            triggerShake(inputField);
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

async function surrender() {

    try {
        const { data, error } = await _supabase.rpc('get_daily_word');
        
        if (error) throw error;

        const secretWord = data;
        
        const row = document.createElement('div');
        row.className = 'guess-row surrender';
        row.innerHTML = `
            <div class="word-container">
                <span class="emoji">🏳️</span>
                <strong style="font-size: 1.4rem;">${secretWord.toUpperCase()}</strong>
            </div>
            <div class="rank-container">
                <span class="rank-label">Ti sei arreso</span>
            </div>
        `;
        listContainer.prepend(row);
   
        inputField.disabled = true;
        submitBtn.disabled = true;
        hintBtn.disabled = true;
        surrenderBtn.disabled = true;
        
    } catch (err) {
        console.error('Errore:', err);
        alert('Errore nel recupero della parola segreta!');
    }
}

async function getHint() {
    hintBtn.disabled = true;
    
    let currentBest = bestRank;

    if (currentBest === Infinity || currentBest > 2000) {
        currentBest = 1000; 
    }

    let targetRank = Math.floor(currentBest / 2);

    if (targetRank < 2) targetRank = 2;


    if (currentBest <= 2) {
        return;
    }

    try {

        const { data, error } = await _supabase.rpc('get_hint', { 
            target_rank: targetRank 
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const hint = data[0];

            hintsUsed++;
            hintBtn.textContent = `💡 Aiuto (${30 - hintsUsed})`;

            inputField.value = hint.word;
            await playTurn();

            if (hintsUsed < 30) hintBtn.disabled = false;

        } else {
            alert("Nessun indizio trovato per questo livello.");
            hintBtn.disabled = false;
        }
        
    } catch (err) {
        console.error('Errore:', err);
        alert('Errore connessione!');
        hintBtn.disabled = false;
    }
}

function triggerShake(element) {
    element.classList.remove('shake');
    void element.offsetWidth; 
    element.classList.add('shake');

    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}


//!! Entra nel box testo all'avvio
inputField.focus();