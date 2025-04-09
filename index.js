import { API_KEY } from "./key.js"

const main = document.querySelector("main")

const search = ""

const maxConcurrent = 3
let detailedResults = []

const watchlist = []

// getData()

async function getData(
    url = `http://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(search)}`
) {
    // Add Loading Screen
    main.innerHTML = `
            <div class="placeholder">
                <i class="fa-solid fa-spinner custom-icon"></i>
                <p>Searching</p>
            </div>
        `
    document.querySelector("div.placeholder").style.alignSelf = "center"
    document.querySelector("div.placeholder").style.width = "80%"

    // Fetch Data
    const data = await (await fetch(url)).json()
    console.log(data)
    console.log(data.Poster)
    console.log(data.Response)

    // If there is no response from OMDB API
    if (data.Response != "True") {
        console.log(false)
        if (!main.classList.contains("centered")) {
            main.classList.add("centered")
        }

        main.innerHTML = `
            <div class="placeholder">
                <p>Unable to find what you’re looking for.
                Please try another search.</p>
            </div>
        `
        document.querySelector("div.placeholder").style.alignSelf = "center"
        document.querySelector("div.placeholder").style.width = "80%"

        console.error('No results:', data.Error);
        return
    }

    const movies = data.Search

    // Throttling Logic using batches
    detailedResults = []
    let index = 0

    async function fetchNextBatch() {
        const batch = []

        for (let i = 0; i < maxConcurrent && index < movies.length; i++, index++) {
            const movie = movies[index]
            const fetchPromise = fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}`)
                .then(res => res.json())
                .then(data => {
                    detailedResults.push(data);
                });
            batch.push(fetchPromise);
        }

        // Wait for current batch to complete
        await Promise.all(batch);

        // If there are more items, fetch next batch
        if (index < movies.length) {
            await fetchNextBatch();
        }
    }

    await fetchNextBatch();

    console.log(detailedResults)

    renderMovieList(detailedResults, "add")
}

function renderMovieList(array, mode = "add") {
    let stringHTML = ""

    const operator = mode === "add" ? "plus" : "minus"
    const btnText = mode === "add" ? "Watchlist" : "Remove"

    array.map(movie => {
        stringHTML += `
                <div id="${movie.imdbID}" class="movie">
                    <img class="poster"
                        src="${movie.Poster}"
                        alt="${movie.Title} Poster">
                    <section class="details">
                        <div class="detail-header">
                            <h3 class="movie-title">${movie.Title}</h3>
                            <span class="rating"><i class="fa-solid fa-star"></i> ${movie.imdbRating}</span>
                        </div>
                        <div class="detail-body">
                            <div class="misc">
                                <p class="runtime">${movie.Runtime}</p>
                                <p class="genre">${movie.Genre}</p>
                            </div>
                            <span class="toggle-watchlist ${mode}" data-movie="${movie.imdbID}"><i class="fa-solid fa-circle-${operator}"></i> ${btnText}</span>
                        </div>
                        <p class="plot">${movie.Plot}</p>
                    </section>
                </div>
            `
    })

    main.innerHTML = stringHTML

    main.classList.remove("centered")
}

const form = document.querySelector("form.search-box")

form.addEventListener("submit", function (e) {
    e.preventDefault()
    const formData = new FormData(form)
    const dataObj = Object.fromEntries(formData.entries())

    const url = `http://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(dataObj.search)}`

    getData(url)
})

const title = document.getElementById("title")

document.addEventListener("click", function (e) {
    if (e.target.dataset.movie) {
        // console.log(e.target.dataset.movie)

        const arrMovie = detailedResults.find(movie =>
            movie.imdbID === e.target.dataset.movie
        )
        if (!watchlist.includes(arrMovie)) {
            watchlist.unshift(arrMovie)
        }

        console.log(watchlist)
    }

    if (e.target.id === "toggle") {
        if (e.target.classList.contains("my-watchlist")) {
            title.textContent = "My Watchlist"
            e.target.textContent = "Search for movies"

            e.target.classList.remove("my-watchlist")
            e.target.classList.add("search-movie")

            if (watchlist.length > 0) {
                renderMovieList(watchlist, "remove")
            } else {
                main.innerHTML = `
                    <div class="placeholder">
                        <p class="desc">Your watchlist is looking a little empty...</p>
                        <span><i class="fa-solid fa-circle-plus"></i> Let's add some movies!</span>
                    </div>
                `
            }

            form.style.display = "none"
            
        } else {
            title.textContent = "Find your film"
            e.target.textContent = "My Watchlist"
            
            e.target.classList.remove("search-movie")
            e.target.classList.add("my-watchlist")
            
            if (detailedResults.length > 0) {
                renderMovieList(detailedResults, "add")
            } else {
                main.innerHTML = `
                <div class="placeholder">
                    <i class="fa-solid fa-film custom-icon"></i>
                    <p>Start exploring</p>
                </div>
                `
            }

            form.style.display = "flex"

        }
    }
})