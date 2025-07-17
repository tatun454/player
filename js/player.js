const DEEZER_API_BASE_URL =
  "https://striveschool-api.herokuapp.com/api/deezer/";
const DEEZER_SEARCH_QUERY_PARAM = "search?q=";

const DOM = {
  audioSource: document.getElementById("audio-source"),
  playPauseBtn: document.getElementById("play-pause-btn"),
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  progressBar: document.getElementById("progress-bar"),
  currentTimeSpan: document.getElementById("current-time"),
  durationSpan: document.getElementById("duration"),
  volumeBar: document.getElementById("volume-bar"),
  muteBtn: document.getElementById("mute-btn"),
  trackTitleDisplay: document.getElementById("track-title"),
  shuffleBtn: document.getElementById("shuffle-btn"),
  repeatBtn: document.getElementById("repeat-btn"),
  searchInput: document.getElementById("search-input"),
  searchButton: document.getElementById("search-button"),
  searchResultsContainer: document.getElementById("search-results"),
  currentAlbumCover: document.getElementById("current-album-cover"),
  currentArtistSpan: document.getElementById("current-artist"),
};

// Stato del player centralizzato
const playerState = {
  lastVolume: 100,
  currentPlayingTrack: null,
  currentPlaylist: [],
  currentTrackIndex: -1,
  isShuffling: false,
  isRepeating: false,
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

function _updatePlayPauseButton() {
  if (DOM.audioSource.paused) {
    DOM.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    DOM.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  }
}

function _updateMuteButton() {
  if (DOM.audioSource.volume === 0) {
    DOM.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (DOM.audioSource.volume < 0.5) {
    DOM.muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    DOM.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
}

function _updateProgressBarFill() {
  if (
    DOM.progressBar &&
    !isNaN(DOM.progressBar.value) &&
    !isNaN(DOM.progressBar.max) &&
    DOM.progressBar.max > 0
  ) {
    const percentage =
      (parseFloat(DOM.progressBar.value) / parseFloat(DOM.progressBar.max)) *
      100;
    DOM.progressBar.style.setProperty("--track-fill", `${percentage}%`);
  } else {
    DOM.progressBar.style.setProperty("--track-fill", `0%`);
  }
}

function _updateVolumeBarFill() {
  if (
    DOM.volumeBar &&
    !isNaN(DOM.volumeBar.value) &&
    !isNaN(DOM.volumeBar.max) &&
    DOM.volumeBar.max > 0
  ) {
    const percentage =
      (parseFloat(DOM.volumeBar.value) / parseFloat(DOM.volumeBar.max)) * 100;
    DOM.volumeBar.style.setProperty("--volume-fill", `${percentage}%`);
  } else {
    DOM.volumeBar.style.setProperty("--volume-fill", `100%`);
  }
}

function updatePlayerUI() {
  _updatePlayPauseButton();
  _updateMuteButton();
  _updateProgressBarFill();
  _updateVolumeBarFill();
  DOM.shuffleBtn.classList.toggle("active", playerState.isShuffling);
  DOM.repeatBtn.classList.toggle("active", playerState.isRepeating);
}

function loadTrack(trackObject, newIndex, playImmediately = false) {
  if (!trackObject || !trackObject.src) {
    console.error("Oggetto traccia non valido fornito a loadTrack.");
    return;
  }

  playerState.currentPlayingTrack = trackObject;
  playerState.currentTrackIndex = newIndex;

  DOM.audioSource.src = trackObject.src;

  if (DOM.trackTitleDisplay) {
    DOM.trackTitleDisplay.textContent = trackObject.title;
  }

  if (DOM.currentAlbumCover) {
    if (trackObject.album && trackObject.album.cover_small) {
      DOM.currentAlbumCover.src = trackObject.album.cover_small;
    } else if (trackObject.artist && trackObject.artist.picture_small) {
      DOM.currentAlbumCover.src = trackObject.artist.picture_small;
    } else {
      DOM.currentAlbumCover.src = "https://via.placeholder.com/60";
    }
  }
  if (DOM.currentArtistSpan) {
    if (trackObject.artist && trackObject.artist.name) {
      DOM.currentArtistSpan.textContent = trackObject.artist.name;
    } else {
      DOM.currentArtistSpan.textContent = "Artista sconosciuto";
    }
  }

  DOM.audioSource.load();

  if (playImmediately || !DOM.audioSource.paused) {
    DOM.audioSource.play();
  } else {
    DOM.audioSource.pause();
  }

  updatePlayerUI();
}

// Funzione per gestire il passaggio al brano successivo o precedente nella playlist corrente
function goToNextOrPreviousTrack(direction) {
  const targetPlaylist = playerState.currentPlaylist;
  const currentIndex = playerState.currentTrackIndex;

  if (targetPlaylist.length === 0) {
    console.warn("Nessun brano nella playlist corrente.");
    return;
  }

  let newIndex;
  // Logica di riproduzione casuale
  if (playerState.isShuffling) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * targetPlaylist.length);
    } while (randomIndex === currentIndex && targetPlaylist.length > 1);
    newIndex = randomIndex;
  } else {
    // Logica di riproduzione sequenziale
    newIndex =
      (currentIndex + direction + targetPlaylist.length) %
      targetPlaylist.length;
  }

  // Carica e riproduce il nuovo brano
  loadTrack(targetPlaylist[newIndex], newIndex, true);
}

// Listener per il pulsante Play/Pause
DOM.playPauseBtn.addEventListener("click", () => {
  if (DOM.audioSource.paused) {
    DOM.audioSource.play();
  } else {
    DOM.audioSource.pause();
  }
});

// Listener per gli eventi 'play' e 'pause' dell'audio
DOM.audioSource.addEventListener("play", updatePlayerUI);
DOM.audioSource.addEventListener("pause", updatePlayerUI);

// Listener per l'evento 'loadedmetadata'
DOM.audioSource.addEventListener("loadedmetadata", () => {
  DOM.progressBar.max = DOM.audioSource.duration;
  DOM.durationSpan.textContent = formatTime(DOM.audioSource.duration);
  DOM.progressBar.value = 0;
  DOM.currentTimeSpan.textContent = formatTime(0);
  updatePlayerUI();
});

// Listener per l'evento 'timeupdate' (aggiorna il tempo corrente e la progress bar)
DOM.audioSource.addEventListener("timeupdate", () => {
  if (!DOM.progressBar.dataset.dragging) {
    DOM.progressBar.value = DOM.audioSource.currentTime;
  }
  DOM.currentTimeSpan.textContent = formatTime(DOM.audioSource.currentTime);
  _updateProgressBarFill();
});

// Listener per l'evento 'input' sulla progress bar (trascinamento)
DOM.progressBar.addEventListener("input", () => {
  DOM.progressBar.dataset.dragging = "true";
  DOM.audioSource.currentTime = DOM.progressBar.value;
  DOM.currentTimeSpan.textContent = formatTime(DOM.audioSource.currentTime);
  _updateProgressBarFill();
});

// Listener per l'evento 'change' progress bar (rilascio trascinamento)
DOM.progressBar.addEventListener("change", () => {
  DOM.progressBar.dataset.dragging = "";
  DOM.audioSource.currentTime = DOM.progressBar.value;
  if (!DOM.audioSource.paused) {
    DOM.audioSource.play();
  }
  _updateProgressBarFill();
});

// Listener per l'evento 'input' volume bar
DOM.volumeBar.addEventListener("input", () => {
  DOM.audioSource.volume = DOM.volumeBar.value / 100;
  playerState.lastVolume = DOM.volumeBar.value;
  updatePlayerUI();
});

// Listener per il pulsante Mute
DOM.muteBtn.addEventListener("click", () => {
  if (DOM.audioSource.volume === 0) {
    DOM.audioSource.volume = playerState.lastVolume / 100;
    DOM.volumeBar.value = playerState.lastVolume;
  } else {
    playerState.lastVolume = DOM.volumeBar.value;
    DOM.audioSource.volume = 0;
    DOM.volumeBar.value = 0;
  }
  updatePlayerUI();
});

// Listener per l'evento 'volumechange' dell'audio (es. da tasti hardware)
DOM.audioSource.addEventListener("volumechange", updatePlayerUI);

// Listener per il pulsante Precedente
DOM.prevBtn.addEventListener("click", () => {
  goToNextOrPreviousTrack(-1);
});

// Listener per il pulsante Successivo
DOM.nextBtn.addEventListener("click", () => {
  goToNextOrPreviousTrack(1);
});

// Listener per fine brano
DOM.audioSource.addEventListener("ended", () => {
  if (playerState.isRepeating) {
    DOM.audioSource.currentTime = 0;
    DOM.audioSource.play();
    return;
  }

  goToNextOrPreviousTrack(1);
});

// Listener per il pulsante Shuffle
DOM.shuffleBtn.addEventListener("click", () => {
  playerState.isShuffling = !playerState.isShuffling;
  updatePlayerUI();
  console.log("Shuffle mode:", playerState.isShuffling ? "ON" : "OFF");
});

// Listener per il pulsante Repeat
DOM.repeatBtn.addEventListener("click", () => {
  playerState.isRepeating = !playerState.isRepeating;
  updatePlayerUI();
  console.log("Repeat mode:", playerState.isRepeating ? "ON" : "OFF");
});

const callTheTower = function (baseUrl, queryParam, key) {
  return fetch(baseUrl + queryParam + key)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        let errorMessage = `Errore HTTP! Codice: ${response.status}`;
        if (response.status === 404) {
          errorMessage += " - Risorsa non trovata.";
        } else if (response.status === 401) {
          errorMessage += " - Non autorizzato. Controlla la chiave API.";
        }
        throw new Error(errorMessage);
      }
    })
    .catch((error) => {
      // Mostra l'errore all'utente e nella console
      alert(`Si è verificato un errore: ${error.message || error}`);
      console.error("Errore nella chiamata API:", error);
      return null;
    });
};

// Funzione per eseguire la ricerca tramite API Deezer
async function performSearch(queryText) {
  if (!queryText || queryText.trim() === "") {
    DOM.searchResultsContainer.innerHTML =
      "<p>Per favore, inserisci un termine di ricerca.</p>";
    return;
  }

  DOM.searchResultsContainer.innerHTML = "<p>Caricamento risultati...</p>";

  try {
    const data = await callTheTower(
      DEEZER_API_BASE_URL,
      DEEZER_SEARCH_QUERY_PARAM,
      queryText
    );

    if (data && data.data) {
      displaySearchResults(data.data);
    } else {
      DOM.searchResultsContainer.innerHTML =
        "<p>Nessun risultato trovato o errore nella risposta API.</p>";
    }
  } catch (error) {
    // Gestione degli errori che non guasta mai
    console.error(
      "Errore durante l'elaborazione dei risultati della ricerca:",
      error
    );
    DOM.searchResultsContainer.innerHTML =
      "<p>Errore durante il recupero dei risultati. Per favore riprova.</p>";
  }
}

function displaySearchResults(tracks) {
  DOM.searchResultsContainer.innerHTML = "";

  playerState.currentPlaylist = tracks.map((track) => ({
    title: `${track.title} - ${track.artist.name}`, // Formatta il titolo
    src: track.preview,
    album: {
      cover_small: track.album.cover_small,
      title: track.album.title || "Album Sconosciuto",
    }, // Dettagli album per la copertina e titolo
    artist: {
      name: track.artist.name,
      picture_small: track.artist.picture_small, // Dettagli artista per l'immagine
    },
  }));

  if (playerState.currentPlaylist.length > 0) {
    playerState.currentTrackIndex = -1;

    playerState.currentPlaylist.forEach((track, index) => {
      const resultDiv = document.createElement("div");
      resultDiv.classList.add("search-result-item");

      resultDiv.innerHTML = `
                <img src="${track.album.cover_small}" alt="Copertina Album">
                <div class="track-info">
                    <h4>${track.title}</h4>
                    <p>${track.artist.name} - ${track.album.title}</p>
                </div>
            `;

      resultDiv.addEventListener("click", () => {
        loadTrack(track, index, true);
      });
      DOM.searchResultsContainer.appendChild(resultDiv);
    });
  } else {
    DOM.searchResultsContainer.innerHTML = "<p>Nessun risultato trovato.</p>";
  }
}

DOM.searchButton.addEventListener("click", () => {
  performSearch(DOM.searchInput.value);
});

DOM.searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    performSearch(DOM.searchInput.value);
  }
});

// Funzione di inizializzazione del player all'avvio della pagina
function initializePlayer() {
  playerState.currentPlaylist = [];
  playerState.currentTrackIndex = -1;

  // Nasconde il player senza canzoni
  const mediaPlayer = document.getElementById("media-player");
  if (mediaPlayer) {
    mediaPlayer.style.display = "none";
  }

  DOM.volumeBar.value = DOM.audioSource.volume * 100;
  updatePlayerUI();
}

// Modifica la canzone corrente quando il player viene caricato
const originalLoadTrack = loadTrack;
loadTrack = function (trackObject, newIndex, playImmediately = false) {
  if (!trackObject || !trackObject.src) {
    console.error("Oggetto traccia non valido fornito a loadTrack.");
    return;
  }

  // Mostra il player quando parte una canzone
  const mediaPlayer = document.getElementById("media-player");
  if (mediaPlayer) {
    mediaPlayer.style.display = "flex";
  }

  originalLoadTrack(trackObject, newIndex, playImmediately);
};

// se si clicca sul nome dell'artista si va nella pagina di quest'ultimo
document.addEventListener("DOMContentLoaded", initializePlayer);

if (DOM.currentArtistSpan) {
  DOM.currentArtistSpan.style.cursor = "pointer";
  DOM.currentArtistSpan.addEventListener("click", () => {
    const artistName = DOM.currentArtistSpan.textContent;
    if (artistName && artistName !== "Artista sconosciuto") {
      window.location.href = `artist.html?name=${encodeURIComponent(
        artistName
      )}`;
    }
  });
}

document.addEventListener("click", (event) => {
  const searchResults = DOM.searchResultsContainer;
  const searchInput = DOM.searchInput;
  const searchButton = DOM.searchButton;
  if (
    searchResults &&
    !searchResults.contains(event.target) &&
    searchInput !== event.target &&
    searchButton !== event.target
  ) {
    searchResults.innerHTML = "";
  }
});
