const userApiKey = 'f1a8aa7c7b71dc2b697805ee60f4d1f0';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMWE4YWE3YzdiNzFkYzJiNjk3ODA1ZWU2MGY0ZDFmMCIsIm5iZiI6MTczMDc0NjMyNy40NTgyNTEyLCJzdWIiOiI2NjA3ZTc2MmE4OTRkNjAxNjI2M2JhMjciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.aKZ6NAzj0oRpo9DYpX5HD2AWICOqtlk91cu9HwI69XU'
    }
};

const links = {
    popular: `https://api.themoviedb.org/3/movie/popular`,
    topRated: `https://api.themoviedb.org/3/movie/top_rated`,
    searchMovies: `https://api.themoviedb.org/3/search/movie`,
    genres: `https://api.themoviedb.org/3/genre/movie/list`
};

const wrapper = document.querySelector('.wrapper');
const menu = document.querySelector('.menu');
const searchForm = document.querySelector('.search-form');
const searchInput = document.getElementById('search');
const showMoreBtn = document.querySelector('.load-more');
const loader = document.querySelector('.loader');
const suggestionsWrapper = document.querySelector('.suggestions-wrapper');

let page = 1;
let language = 'en-US';
let genres = {};
let lastType = '';
let lastQuery = '';

function fetchMovieSuggestions(query) {
    if (query.length < 3) {
        suggestionsWrapper.style.display = 'none';
        return;
    }

    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${userApiKey}&query=${query}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.results && data.results.length > 0) {
                showSuggestions(data.results);
            } else {
                suggestionsWrapper.style.display = 'none';
            }
        })
        .catch(error => {
            console.error(`Error fetching suggestions: ${error}`);
            suggestionsWrapper.style.display = 'none';
        });
}

function showSuggestions(movies) {
    suggestionsWrapper.innerHTML = '';
    suggestionsWrapper.style.display = 'block';

    movies.forEach(movie => {
        const suggestion = document.createElement('div');
        suggestion.classList.add('suggestion');
        suggestion.textContent = movie.title;

        suggestion.addEventListener('click', () => {
            searchInput.value = movie.title;
            suggestionsWrapper.style.display = 'none';
            fetchMovies({ type: 'searchMovies', query: movie.title });
        });
        suggestionsWrapper.appendChild(suggestion);
    });
}

function fetchGenres() {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${userApiKey}&language=${language}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data.genres)) {
                genres = {};
                data.genres.forEach((genre) => {
                    genres[genre.id] = genre.name;
                });
                console.log(`Genres loaded: ${genres}`);
            } else {
                console.error(`Genres data is not an array: ${data}`);
            }
        })
        .catch(error => {
            console.error(`Error fetching genres: ${error}`);
        });
}

fetchGenres();

function fetchMovies({ type, query = '' }) {
    if (type !== lastType || query !== lastQuery) {
        reset();
    }

    loader.style.display = 'block';

    let url = '';
    const baseUrl = 'https://api.themoviedb.org/3';

    if (type === 'searchMovies') {
        url = `${baseUrl}/search/movie?api_key=${userApiKey}&language=${language}&page=${page}&query=${encodeURIComponent(query)}`;
    } else if (type === 'popular') {
        url = `${baseUrl}/movie/popular?api_key=${userApiKey}&language=${language}&page=${page}`;
    } else if (type === 'topRated') {
        url = `${baseUrl}/movie/top_rated?api_key=${userApiKey}&language=${language}&page=${page}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            loader.style.display = 'none';

            if (!data.results || data.results.length === 0) {
                alert('No movies found!');
                return;
            }

            addMoviesToWrapper(data.results);
            lastType = type;
            lastQuery = query;
        })
        .catch(error => {
            loader.style.display = 'none';
            console.error(`Error fetching movies: ${error}`);
        });
}

function addMoviesToWrapper(movies) {
    movies.forEach(movie => {
        const { poster_path, title, vote_average, release_date, genre_ids, id } = movie;

        if (!poster_path) {
            return;
        }

        let genresString = '';
        for (let id of genre_ids) {
            genresString += genres[id] + ', ';
        }
        genresString = genresString.slice(0, -2) || 'Unknown Genre';

        let releaseYear = 'Unknown';
        if (release_date) {
            const date = new Date(release_date);
            releaseYear = date.getFullYear();
        }

        const rating = Math.round(vote_average / 2);

        const movieItemElementHTML = `
            <div class="movieItem">
                <a href="#" class="movie-link" data-id="${movie.id}">
                    <img src="https://image.tmdb.org/t/p/w200/${poster_path}" alt="Poster ${title}">
                    <h2>${title}</h2>
                    <p>${genresString}</p>
                    <p>Release Year: ${releaseYear}</p>
                    <p>Rating: <span>${'&#x2605;'.repeat(rating)}${'&#x2606;'.repeat(5 - rating)}</span></p>
                </a>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', movieItemElementHTML);
    });
}

function reset() {
    wrapper.innerHTML = '';
    page = 1;
    lastType = '';
    lastQuery = '';
}

function handleURL() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const query = params.get('query');
    const movieTitle = params.get('movie');

    if (type === 'popular') {
        fetchMovies({ type: 'popular' });
    } else if (type === 'top_rated') {
        fetchMovies({ type: 'topRated' });
    } else if (type === 'search' && query) {
        fetchMovies({ type: 'searchMovies', query });
    } else {
        fetchMovies({ type: 'popular' });
    }
}

handleURL();

function fetchMovieById(movieId) {
    return fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${userApiKey}&language=${language}&page=${page}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Unable to get information about the movie: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error(`Error fetching by id: ${error}`);
            return null;
        });
}

function fetchMovieCast(movieId) {
    return fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${userApiKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Unable to get information about the movie: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data.cast;
        })
        .catch(error => {
            console.error(`Error fetching cast: ${error}`);
            return [];
        });
}

async function fetchActorBitrh(actorId) {
    const response = await fetch(`https://api.themoviedb.org/3/person/${actorId}?api_key=${userApiKey}`);
    if (response.ok) {
        const actorDetails = await response.json();
        return actorDetails.birthday;
    }
    return 'Unknown';
}

function fetchMovieVideos(movieId) {
    return fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${userApiKey}&language=${language}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching movie videos: ${response.status}`);
            }
            return response.json();
        })
        .then(data => data.results)
        .catch(error => {
            console.error(`Error fetching videos: ${error}`);
            return [];
        });
}

async function createPopup(movieDetails, cast, movieId) {
    const popup = document.createElement('div');
    popup.classList.add('popup');

    const { title, release_date } = movieDetails;
    const releaseYear = release_date ? new Date(release_date).getFullYear() : 'Unknown';

    const titleElement = document.createElement('h2');
    titleElement.textContent = `Title: ${title}`;
    popup.appendChild(titleElement);

    const releaseElement = document.createElement('p');
    releaseElement.textContent = `Release Year: ${releaseYear}`;
    popup.appendChild(releaseElement);

    const castList = document.createElement('div');
    castList.classList.add('cast-list');

    for (let actor of cast.slice(0, 3)) {
        const actorElement = document.createElement('div');
        actorElement.classList.add('actor');

        const actorImg = document.createElement('img');
        actorImg.src = actor.profile_path
            ? `https://image.tmdb.org/t/p/w200/${actor.profile_path}`
            : 'https://via.placeholder.com/150';
        actorImg.alt = actor.name;
        actorElement.appendChild(actorImg);

        const actorName = document.createElement('p');
        actorName.textContent = `Name: ${actor.name}`;
        actorElement.appendChild(actorName);

        const actorBirthday = await fetchActorBitrh(actor.id);
        let age = 'Unknown';
        if (actorBirthday && release_date) {
            const actorBirthDate = new Date(actorBirthday);
            const releaseDate = new Date(release_date);
            if (!isNaN(actorBirthDate.getTime())) {
                age = releaseDate.getFullYear() - actorBirthDate.getFullYear();
                if (
                    releaseDate.getMonth() < actorBirthDate.getMonth() ||
                    (releaseDate.getMonth() === actorBirthDate.getMonth() && releaseDate.getDate() < actorBirthDate.getDate())
                ) {
                    age--;
                }
            }
        }

        const actorAge = document.createElement('p');
        actorAge.textContent = `Age: ${age}`;
        actorElement.appendChild(actorAge);

        castList.appendChild(actorElement);
    }
    popup.appendChild(castList);

    let videoLinks = await fetchMovieVideos(movieId);
    if (videoLinks.length > 0) {
        const videosContainer = document.createElement('div');
        videosContainer.classList.add('videos-container');

        const videosTitle = document.createElement('h3');
        videosTitle.textContent = 'Trailer:';
        videosContainer.appendChild(videosTitle);

        if (Array.isArray(videoLinks)) {
            const filteredVideos = videoLinks.filter(video => video.site === 'YouTube' && video.type === 'Trailer' && video.name);

            if (filteredVideos.length > 0) {
                const video = filteredVideos[0];
                const link = document.createElement('a');
                link.href = `https://www.youtube.com/watch?v=${video.key}`;
                link.target = '_blank';
                link.textContent = video.name;
                videosContainer.appendChild(link);
            } else {
                const noVideosMessage = document.createElement('p');
                noVideosMessage.textContent = 'No videos available.';
                videosContainer.appendChild(noVideosMessage);
            }
        }

        popup.appendChild(videosContainer);
    } else {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'No video data available.';
        popup.appendChild(errorMessage);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = '❌';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', () => {
        popup.remove();
    });
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
}

wrapper.addEventListener('click', ev => {
    const movieLink = ev.target.closest('.movie-link');

    if (movieLink) {
        ev.preventDefault();

        const movieId = movieLink.getAttribute('data-id');

        Promise.all([fetchMovieById(movieId), fetchMovieCast(movieId)])
            .then(([movieDetails, cast]) => {
                if (movieDetails && cast) {
                    createPopup(movieDetails, cast, movieId);
                } else {
                    console.error('Missing movie details or cast');
                }
            })
            .catch(error => {
                console.error(`Error loading movie details and cast: ${error}`)
            });
    }
});

searchInput.addEventListener('input', e => {
    const query = e.target.value.trim();
    fetchMovieSuggestions(query);
});

menu.addEventListener('click', e => {
    const target = e.target;

    if (target.classList.contains('clearWrapper')) {
        reset();
        localStorage.removeItem('searchParams');
        history.pushState(null, '', '/');
    }

    if (target.classList.contains('loadPopularMovies')) {
        history.pushState(null, '', '?type=popular');
        localStorage.setItem('searchParams', JSON.stringify({ type: 'popular' }));
        fetchMovies({ type: 'popular' });
    }

    if (target.classList.contains('loadTopRatedMovies')) {
        history.pushState(null, '', '?type=top_rated');
        localStorage.setItem('searchParams', JSON.stringify({ type: 'top_rated' }));
        fetchMovies({ type: 'topRated' });
    }
});

searchForm.addEventListener('submit', e => {
    e.preventDefault();

    let query = searchInput.value.trim();
    let movieTitle = query;
    if (!query) {
        movieTitle = null;
    }

    if (query) {
        const newUrl = `?type=search&query=${encodeURIComponent(query)}${movieTitle ? `&movie=${encodeURIComponent(movieTitle)}` : ''}`;
        history.pushState(null, '', newUrl);
        localStorage.setItem('searchParams', JSON.stringify({ type: 'search', query, movieTitle }));
        fetchMovies({ type: 'searchMovies', query, movieTitle });
    }
});

showMoreBtn.addEventListener('click', () => {
    page++;
    fetchMovies({ type: lastType, query: lastQuery });
});

window.addEventListener('load', () => {
    const storedParams = JSON.parse(localStorage.getItem('searchParams'));

    if (storedParams) {
        console.log(`Saved parameters from localStorage: ${storedParams}`);

        const { type, query, movieTitle } = storedParams;

        if (type === 'search') {
            const newUrl = `?type=search&query=${encodeURIComponent(query)}${movieTitle ? `&movie=${encodeURIComponent(movieTitle)}` : ''}`;
            history.pushState(null, '', newUrl);
            fetchMovies({ type: 'searchMovies', query, movieTitle });
        } else if (type === 'popular') {
            fetchMovies({ type: 'popular' });
        } else if (type === 'top_rated') {
            fetchMovies({ type: 'topRated' });
        }
    }
});
