// Initial Values
const INITIAL_SEARCH_VALUE = 'spiderman';
const log = console.log;

// Selecting elements from the DOM
const searchButton = document.querySelector('#search');;
const searchInput = document.querySelector('#exampleInputEmail1');
const moviesContainer = document.querySelector('#movies-container');
const moviesSearchable = document.querySelector('#movies-searchable');

function createImageContainer(imageUrl, id) {
    const tempDiv = document.createElement('div');
    tempDiv.setAttribute('class', 'imageContainer');
    tempDiv.setAttribute('data-id', id);

    const movieElement = `
        <img src="${imageUrl}" alt="" data-movie-id="${id}">
    `;
    tempDiv.innerHTML = movieElement;

    return tempDiv;
}

function resetInput() {
    searchInput.value = '';
}

function handleGeneralError(error) {
    log('Error: ', error.message);
    alert(error.message || 'Internal Server');
}

function createIframe(video) {
    const videoKey = (video && video.key) || 'No key found!!!';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoKey}`;
    iframe.width = 360;
    iframe.height = 315;
    iframe.allowFullscreen = true;
    return iframe;
}

function insertIframeIntoContent(video, content) {
    const videoContent = document.createElement('div');
    const iframe = createIframe(video);

    videoContent.appendChild(iframe);
    content.appendChild(videoContent);
}


function createVideoTemplate(data) {
    const content = this.content;
    content.innerHTML = '<p id="content-close">X</p>';
    
    const videos = data.results || [];

    if (videos.length === 0) {
        content.innerHTML = `
            <p id="content-close">X</p>
            <p>No Trailer found for this video id of ${data.id}</p>
        `;
        return;
    }

    for (let i = 0; i < 4; i++) {
        const video = videos[i];
        insertIframeIntoContent(video, content);
    }
}

function createSectionHeader(title) {
    const header = document.createElement('h2');
    header.innerHTML = title;

    return header;
}


function renderMovies(data) {
    const moviesBlock = generateMoviesBlock(data);
    const header = createSectionHeader(this.title);
    moviesBlock.insertBefore(header, moviesBlock.firstChild);
    moviesContainer.appendChild(moviesBlock);
}



function renderSearchMovies(data) {
    moviesSearchable.innerHTML = '';
    const moviesBlock = generateMoviesBlock(data);
    moviesSearchable.appendChild(moviesBlock);
}

function generateMoviesBlock(data) {
    const movies = data.results;
    const genreGroups = new Map();

    // Group movies by genre
    movies.forEach(movie => {
        const genreIds = movie.genre_ids || [];
        if (genreIds.length === 0) {
            // If no genre, group under "Others"
            if (!genreGroups.has('Others')) {
                genreGroups.set('Others', []);
            }
            genreGroups.get('Others').push(movie);
        } else {
            genreIds.forEach(genreId => {
                const genreName = genreMap.get(genreId) || 'Unknown';
                if (!genreGroups.has(genreName)) {
                    genreGroups.set(genreName, []);
                }
                genreGroups.get(genreName).push(movie);
            });
        }
    });

    const movieSectionAndContent = document.createElement('div');

    // For each genre group, create a section with header and movies
    genreGroups.forEach((movies, genreName) => {
        const header = createSectionHeader(genreName);
        const section = document.createElement('section');
        section.setAttribute('class', 'section');

        movies.forEach(movie => {
            const { poster_path, id } = movie;
            if (poster_path) {
                const imageUrl = MOVIE_DB_IMAGE_ENDPOINT + poster_path;
                const imageContainer = createImageContainer(imageUrl, id);
                section.appendChild(imageContainer);
            }
        });

        movieSectionAndContent.appendChild(header);
        movieSectionAndContent.appendChild(section);
    });

    const movieContainer = createMovieContainer(movieSectionAndContent);
    return movieContainer;
}



// Inserting section before content element
function createMovieContainer(section) {
    const movieElement = document.createElement('div');
    movieElement.setAttribute('class', 'movie');

    const template = `
        <div class="content">
            <p id="content-close">X</p>
        </div>
    `;

    movieElement.innerHTML = template;
    movieElement.insertBefore(section, movieElement.firstChild);
    return movieElement;
}

searchButton.onclick = function (event) {
    event.preventDefault();
    const value = searchInput.value
   if (value) {
    searchMovie(value);
   }
    resetInput();
}

// Click on any movies
// Event Delegation
document.onclick = function (event) {
    log('Event: ', event);
    const { tagName, id } = event.target;
    if (tagName.toLowerCase() === 'img') {
        const movieId = event.target.dataset.movieId;
        const section = event.target.parentElement.parentElement;
        const content = section.nextElementSibling;
        content.classList.add('content-display');

        // Find the clicked movie data from the rendered movies
        let clickedMovie = null;
        const allMovies = [];
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            const imgs = section.querySelectorAll('img');
            imgs.forEach(img => {
                allMovies.push({
                    id: img.dataset.movieId,
                    element: img
                });
            });
        });
        clickedMovie = allMovies.find(m => m.id === movieId);

        // Show videos and rating
        getVideosByMovieId(movieId, content);

        // Show rating
        // Fetch movie details to get rating
        fetch(`${MOVIE_DB_ENDPOINT}/3/movie/${movieId}?api_key=${MOVIE_DB_API}`)
            .then(res => res.json())
            .then(data => {
                const rating = data.vote_average;
                const ratingElement = document.createElement('p');
                ratingElement.textContent = `Rating: ${rating}`;
                content.appendChild(ratingElement);
            })
            .catch(err => {
                log('Error fetching movie details:', err);
            });
    }

    if (id === 'content-close') {
        const content = event.target.parentElement;
        content.classList.remove('content-display');
        content.innerHTML = '<p id="content-close">X</p>'; // Reset content on close
    }
}

function classifyGenres(title, description = '') {
    const genres = [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller',
        'Mystery', 'Fantasy', 'Animation', 'Documentary', 'Biography', 'Crime', 'Musical',
        'War', 'Western', 'Family'
    ];

    const genreKeywords = {
        'Action': ['fight', 'battle', 'war', 'explosion', 'chase', 'combat', 'hero', 'soldier'],
        'Adventure': ['journey', 'quest', 'explore', 'adventure', 'treasure', 'island', 'expedition'],
        'Comedy': ['funny', 'humor', 'comedy', 'laugh', 'parody', 'satire', 'joke'],
        'Drama': ['drama', 'relationship', 'family', 'life', 'emotional', 'conflict', 'love'],
        'Horror': ['horror', 'ghost', 'haunted', 'monster', 'fear', 'terror', 'kill', 'dark'],
        'Romance': ['romance', 'love', 'affair', 'relationship', 'heart', 'passion', 'date'],
        'Sci-Fi': ['space', 'alien', 'future', 'robot', 'technology', 'sci-fi', 'time travel', 'cyber'],
        'Thriller': ['thriller', 'suspense', 'mystery', 'crime', 'detective', 'chase', 'danger'],
        'Mystery': ['mystery', 'detective', 'investigation', 'secret', 'puzzle', 'clue'],
        'Fantasy': ['fantasy', 'magic', 'dragon', 'kingdom', 'wizard', 'myth', 'legend'],
        'Animation': ['animation', 'animated', 'cartoon', 'cgi', 'pixar', 'disney'],
        'Documentary': ['documentary', 'real', 'true story', 'biography', 'history', 'facts'],
        'Biography': ['biography', 'life story', 'memoir', 'autobiography', 'true story'],
        'Crime': ['crime', 'gangster', 'mafia', 'police', 'detective', 'heist', 'murder'],
        'Musical': ['musical', 'song', 'dance', 'music', 'performance', 'band'],
        'War': ['war', 'battle', 'soldier', 'army', 'military', 'combat'],
        'Western': ['western', 'cowboy', 'gunfight', 'sheriff', 'outlaw', 'horse'],
        'Family': ['family', 'kids', 'children', 'parent', 'home', 'fun']
    };

    const text = (title + ' ' + description).toLowerCase();
    const matchedGenres = new Set();

    genres.forEach(genre => {
        const keywords = genreKeywords[genre] || [];
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                matchedGenres.add(genre);
                break;
            }
        }
    });

    return Array.from(matchedGenres);
}

// Initialize the search
searchMovie(INITIAL_SEARCH_VALUE);
searchUpcomingMovies();
getTopRatedMovies();
searchPopularMovie();
getTrendingMovies();
