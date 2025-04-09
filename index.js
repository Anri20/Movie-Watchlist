import { API_KEY } from "./key.js"

const main = document.querySelector("main")

const search = "Blade Runner"
const maxConcurrent = 3

getData()

async function getData(
    url = `http://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(search)}`
) {
    try {
        const data = await (await fetch(url)).json()
        console.log(data)
        console.log(data.Poster)

        // If there is no response from OMDB API
        if (!data.Response) {
            console.error("No Result:", data.Error)
            return
        }

        const movies = data.Search

        // Throttling Logic using batches
        const detailedResults = []
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

        let stringHTML = ""

        detailedResults.map(result => {
            stringHTML += `
                <div id="${result.imdbID}" class="movie">
                    <img class="poster"
                        src="${result.Poster}"
                        alt="${result.Title} Poster">
                    <section class="details">
                        <div class="detail-header">
                            <h3 class="movie-title">${result.Title}</h3>
                            <span class="rating"><i class="fa-solid fa-star"></i> ${result.imdbRating}</span>
                        </div>
                        <div class="detail-body">
                            <div class="misc">
                                <p class="runtime">${result.Runtime}</p>
                                <p class="genre">${result.Genre}</p>
                            </div>
                            <span class="add-watchlist"><i class="fa-solid fa-circle-plus"></i> Watchlist</span>
                        </div>
                        <p class="plot">${result.Plot}</p>
                    </section>
                </div>
            `
        })

        main.innerHTML = stringHTML

    } catch (error) {
        console.error(error)
    }
}