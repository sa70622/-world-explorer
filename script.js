
const API_URL = "https://countries.dev/countries";

let allCountries = [];
let currentCountry = null;
let returnSection = "home";
let activeSection = "home";

let selectedCompareKeys = [];

const container = document.getElementById("countriesContainer");
const searchInput = document.getElementById("searchCountry");
const regionFilter = document.getElementById("regionFilter");
const countrySelect = document.getElementById("countrySelect");
const sortCountries = document.getElementById("sortCountries");

const countryCount = document.getElementById("countryCount");
const loadingMessage = document.getElementById("loadingMessage");
const errorBox = document.getElementById("errorBox");
const emptyMessage = document.getElementById("emptyMessage");
const refreshButton = document.getElementById("refreshButton");
const retryButton = document.getElementById("retryButton");

const homeSection = document.getElementById("home");
const detailsSection = document.getElementById("countryDetails");
const detailsContainer = document.getElementById("detailsContainer");

const favoritesButton = document.getElementById("favoritesButton");
const favoritesSection = document.getElementById("favorites");
const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesMessage = document.getElementById("favoritesMessage");
const selectionMessage = document.getElementById("selectionMessage");

const compareSection = document.getElementById("compare");
const compareContainer = document.getElementById("compareContainer");
const compareMessage = document.getElementById("compareMessage");
const compareButton = document.getElementById("compareButton");
const compareBackButton = document.getElementById("compareBackButton");



function getCountryName(country) {
    if (typeof country.name === "string") {
        return country.name;
    }

    return country.name?.common ||
        country.name?.official ||
        "Unknown Country";
}



function getCountryFlag(country) {
    return country.flags?.svg ||
        country.flags?.png ||
        "";
}



function getCountryKey(country) {
    return String(
        country.cca3 ||
        country.cca2 ||
        country.code ||
        getCountryName(country)
    );
}



function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}



function getFavorites() {
    try {
        const savedFavorites = localStorage.getItem("favoriteCountries");

        if (savedFavorites) {
            const parsedFavorites = JSON.parse(savedFavorites);

            if (Array.isArray(parsedFavorites)) {
                return parsedFavorites;
            }
        }

        return [];

    } catch (error) {
        console.log("Favorites Error:", error);

        localStorage.removeItem("favoriteCountries");

        return [];
    }
}



function saveFavorites(favorites) {
    try {
        localStorage.setItem(
            "favoriteCountries",
            JSON.stringify(favorites)
        );

    } catch (error) {
        console.log("Unable to save favorites:", error);
        alert("Favorites could not be saved.");
    }
}



function isFavorite(country) {
    return getFavorites().includes(getCountryKey(country));
}



function toggleFavorite(country) {
    const favorites = getFavorites();
    const countryKey = getCountryKey(country);

    if (favorites.includes(countryKey)) {

        const updatedFavorites = favorites.filter((key) => {
            return key !== countryKey;
        });

        saveFavorites(updatedFavorites);

        selectedCompareKeys = selectedCompareKeys.filter((key) => {
            return key !== countryKey;
        });

    } else {

        favorites.push(countryKey);
        saveFavorites(favorites);
    }

    const favoriteButton = document.getElementById("favoriteButton");

    if (favoriteButton) {
        favoriteButton.textContent = isFavorite(country)
            ? "❤️ Remove from Favorites"
            : "🤍 Add to Favorites";
    }

    renderFavorites();
}



async function getCountries() {
    try {
        loadingMessage.hidden = false;
        errorBox.hidden = true;
        emptyMessage.hidden = true;
        container.innerHTML = "";

        countryCount.textContent = "Loading countries...";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch countries");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid country data");
        }

        allCountries = data;

        loadCountryDropdown();
        filterCountries();

        if (activeSection === "favorites") {
            renderFavorites();
        }

        console.log("Total Countries:", allCountries.length);

    } catch (error) {
        console.log("Error:", error);

        errorBox.hidden = false;
        countryCount.textContent = "Countries could not be loaded.";

    } finally {
        loadingMessage.hidden = true;
    }
}



function loadCountryDropdown() {
    countrySelect.innerHTML = '<option value="">All Countries</option>';

    const sortedCountries = [...allCountries].sort((a, b) => {
        return getCountryName(a).localeCompare(getCountryName(b));
    });

    sortedCountries.forEach((country) => {
        const countryName = getCountryName(country);
        const option = document.createElement("option");

        option.value = countryName;
        option.textContent = countryName;

        countrySelect.appendChild(option);
    });
}



function displayCountries(countries) {
    container.innerHTML = "";

    emptyMessage.hidden = countries.length !== 0;

    if (countries.length === 0) {
        return;
    }

    
    const fragment = document.createDocumentFragment();

    countries.forEach((country) => {
        const card = document.createElement("div");

        card.className = "country-card";
        card.dataset.countryIndex = allCountries.indexOf(country);

        card.innerHTML = `
            <img
                src="${escapeHTML(getCountryFlag(country))}"
                alt="${escapeHTML(getCountryName(country))} flag"
                class="country-flag"
                onerror="this.style.display='none'"
            />

            <h2>${escapeHTML(getCountryName(country))}</h2>

            <p>
                <b>Capital:</b>
                ${escapeHTML(country.capital?.[0] || country.capital || "N/A")}
            </p>

            <p>
                <b>Region:</b>
                ${escapeHTML(country.region || "N/A")}
            </p>

            <p>
                <b>Population:</b>
                ${Number(country.population || 0).toLocaleString("en-IN")}
            </p>

            <p>
                <b>Area:</b>
                ${Number(country.area || 0).toLocaleString("en-IN")} km²
            </p>
        `;

       
        fragment.appendChild(card);
    });


    container.appendChild(fragment);
}



function filterCountries() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const selectedRegion = regionFilter.value;
    const selectedCountry = countrySelect.value;
    const selectedSort = sortCountries.value;

    let filteredCountries = allCountries.filter((country) => {

        const countryName = getCountryName(country);

        const capitalName = Array.isArray(country.capital)
            ? country.capital.join(" ")
            : country.capital || "";

       
        const matchesSearch =
            countryName.toLowerCase().includes(searchValue) ||
            capitalName.toLowerCase().includes(searchValue);

     
        const matchesRegion =
            selectedRegion === "all" ||
            country.region === selectedRegion;

     
        const matchesCountry =
            selectedCountry === "" ||
            countryName === selectedCountry;

        return matchesSearch && matchesRegion && matchesCountry;
    });



    if (selectedSort === "name-asc") {

        filteredCountries.sort((a, b) => {
            return getCountryName(a).localeCompare(getCountryName(b));
        });

    } else if (selectedSort === "name-desc") {

        filteredCountries.sort((a, b) => {
            return getCountryName(b).localeCompare(getCountryName(a));
        });

    } else if (selectedSort === "population-desc") {

        filteredCountries.sort((a, b) => {
            return Number(b.population || 0) - Number(a.population || 0);
        });

    } else if (selectedSort === "population-asc") {

        filteredCountries.sort((a, b) => {
            return Number(a.population || 0) - Number(b.population || 0);
        });

    } else if (selectedSort === "area-desc") {

        filteredCountries.sort((a, b) => {
            return Number(b.area || 0) - Number(a.area || 0);
        });

    } else if (selectedSort === "area-asc") {

        filteredCountries.sort((a, b) => {
            return Number(a.area || 0) - Number(b.area || 0);
        });
    }

    countryCount.textContent =
        `Showing ${filteredCountries.length} of ${allCountries.length} countries`;

    displayCountries(filteredCountries);
}



function getCurrencies(country) {
    const currencies = country.currencies;

    if (!currencies || typeof currencies !== "object") {
        return "Not available";
    }

    return Object.values(currencies).map((currency) => {
        if (typeof currency === "string") {
            return currency;
        }

        return `${currency.name || "Unknown"} ${currency.symbol || ""}`;
    }).join(", ") || "Not available";
}


function getLanguages(country) {
    const languages = country.languages;

    if (!languages) {
        return "Not available";
    }

    if (Array.isArray(languages)) {
        return languages.join(", ");
    }

    if (typeof languages === "object") {
        return Object.values(languages).join(", ");
    }

    return String(languages);
}


function showCountryDetails(country) {

    if (activeSection !== "details") {
        returnSection = activeSection;
    }

    activeSection = "details";
    currentCountry = country;

    homeSection.hidden = true;
    favoritesSection.hidden = true;
    compareSection.hidden = true;
    detailsSection.hidden = false;

    const countryName = getCountryName(country);

    const officialName =
        typeof country.name === "object"
            ? country.name?.official || countryName
            : countryName;

    const borders = Array.isArray(country.borders)
        ? country.borders
        : [];

    let borderHTML = "No border countries available";

    if (borders.length > 0) {
        borderHTML = borders.map((border) => {

            const borderCountry = allCountries.find((item) => {
                return (
                    item.cca3 === border ||
                    item.cca2 === border ||
                    item.code === border
                );
            });

            const borderName = borderCountry
                ? getCountryName(borderCountry)
                : border;

            return `
                <button
                    type="button"
                    class="border-country"
                    data-border-code="${escapeHTML(border)}"
                >
                    ${escapeHTML(borderName)}
                </button>
            `;
        }).join("");
    }

    const mapURL =
        country.maps?.googleMaps ||
        country.maps?.google_maps ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(countryName)}`;

    detailsContainer.innerHTML = `
        <div class="country-detail-card">

            <img
                src="${escapeHTML(getCountryFlag(country))}"
                alt="${escapeHTML(countryName)} flag"
                class="detail-flag"
                onerror="this.style.display='none'"
            >

            <h1>${escapeHTML(countryName)}</h1>

            <p>
                <b>Official Name:</b>
                ${escapeHTML(officialName)}
            </p>

            <p>
                <b>Capital:</b>
                ${escapeHTML(country.capital?.[0] || country.capital || "N/A")}
            </p>

            <p>
                <b>Region:</b>
                ${escapeHTML(country.region || "N/A")}
            </p>

            <p>
                <b>Population:</b>
                ${Number(country.population || 0).toLocaleString("en-IN")}
            </p>

            <p>
                <b>Area:</b>
                ${Number(country.area || 0).toLocaleString("en-IN")} km²
            </p>

            <p>
                <b>Currency:</b>
                ${escapeHTML(getCurrencies(country))}
            </p>

            <p>
                <b>Languages:</b>
                ${escapeHTML(getLanguages(country))}
            </p>

            <h3>Border Countries</h3>

            <div class="border-countries">
                ${borderHTML}
            </div>

            <div class="detail-buttons">

                <button
                    type="button"
                    id="favoriteButton"
                    class="favorite-btn"
                >
                    ${isFavorite(country)
                        ? "❤️ Remove from Favorites"
                        : "🤍 Add to Favorites"}
                </button>

                <button
                    type="button"
                    id="backButton"
                    class="back-btn"
                >
                    Back to Countries
                </button>

            </div>

            <p class="map-link">
                <a
                    href="${escapeHTML(mapURL)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View on Google Maps
                </a>
            </p>

        </div>
    `;
}



function renderFavorites() {
    const favoriteKeys = getFavorites();

    const favoriteCountries = allCountries.filter((country) => {
        return favoriteKeys.includes(getCountryKey(country));
    });

    selectedCompareKeys = selectedCompareKeys.filter((key) => {
        return favoriteKeys.includes(key);
    });

    favoritesContainer.innerHTML = "";

    selectionMessage.textContent =
        `Selected ${selectedCompareKeys.length} of 2 countries`;

    compareButton.disabled = selectedCompareKeys.length !== 2;

    if (favoriteCountries.length === 0) {
        favoritesMessage.hidden = false;
        favoritesMessage.textContent = "No favorite countries added yet.";
        return;
    }

    favoritesMessage.hidden = true;

    favoriteCountries.forEach((country) => {
        const card = document.createElement("div");

        const countryKey = getCountryKey(country);
        const isSelected = selectedCompareKeys.includes(countryKey);

        card.className = "country-card";
        card.dataset.favoriteKey = countryKey;

        card.innerHTML = `
            <img
                src="${escapeHTML(getCountryFlag(country))}"
                alt="${escapeHTML(getCountryName(country))} flag"
                class="country-flag"
                onerror="this.style.display='none'"
            />

            <h2>${escapeHTML(getCountryName(country))}</h2>

            <p>
                <b>Capital:</b>
                ${escapeHTML(country.capital?.[0] || country.capital || "N/A")}
            </p>

            <p>
                <b>Region:</b>
                ${escapeHTML(country.region || "N/A")}
            </p>

            <p>
                <b>Population:</b>
                ${Number(country.population || 0).toLocaleString("en-IN")}
            </p>

            <button
                type="button"
                class="compare-select"
                data-compare-key="${escapeHTML(countryKey)}"
            >
                ${isSelected ? "✓ Selected" : "Select to Compare"}
            </button>

            <button
                type="button"
                class="remove-favorite"
                data-remove-key="${escapeHTML(countryKey)}"
            >
                Remove Favorite
            </button>
        `;

        favoritesContainer.appendChild(card);
    });
}



container.addEventListener("click", (event) => {
    const card = event.target.closest(".country-card");

    if (!card || !container.contains(card)) {
        return;
    }

    const countryIndex = Number(card.dataset.countryIndex);
    const selectedCountry = allCountries[countryIndex];

    if (selectedCountry) {
        showCountryDetails(selectedCountry);
    }
});



detailsContainer.addEventListener("click", (event) => {

    const backButton = event.target.closest("#backButton");

    if (backButton) {
        detailsSection.hidden = true;

        if (returnSection === "favorites") {
            activeSection = "favorites";
            favoritesSection.hidden = false;
            renderFavorites();

        } else {
            activeSection = "home";
            homeSection.hidden = false;
        }

        return;
    }

    const favoriteButton = event.target.closest("#favoriteButton");

    if (favoriteButton && currentCountry) {
        toggleFavorite(currentCountry);
        return;
    }

    const borderButton = event.target.closest("[data-border-code]");

    if (!borderButton) {
        return;
    }

    const borderCode = borderButton.dataset.borderCode;

    const borderCountry = allCountries.find((country) => {
        return (
            country.cca3 === borderCode ||
            country.cca2 === borderCode ||
            country.code === borderCode
        );
    });

    if (borderCountry) {
        showCountryDetails(borderCountry);
    }
});



favoritesContainer.addEventListener("click", (event) => {

    const compareSelect = event.target.closest("[data-compare-key]");

    if (compareSelect) {
        const countryKey = compareSelect.dataset.compareKey;

        if (selectedCompareKeys.includes(countryKey)) {

            selectedCompareKeys = selectedCompareKeys.filter((key) => {
                return key !== countryKey;
            });

        } else {

            if (selectedCompareKeys.length === 2) {
                alert("You can select only two countries!");
                return;
            }

            selectedCompareKeys.push(countryKey);
        }

        renderFavorites();
        return;
    }

    const removeButton = event.target.closest("[data-remove-key]");

    if (removeButton) {
        const countryKey = removeButton.dataset.removeKey;

        const updatedFavorites = getFavorites().filter((key) => {
            return key !== countryKey;
        });

        saveFavorites(updatedFavorites);

        selectedCompareKeys = selectedCompareKeys.filter((key) => {
            return key !== countryKey;
        });

        renderFavorites();
        return;
    }

    const card = event.target.closest(".country-card");

    if (!card) {
        return;
    }

    const countryKey = card.dataset.favoriteKey;

    const selectedCountry = allCountries.find((country) => {
        return getCountryKey(country) === countryKey;
    });

    if (selectedCountry) {
        showCountryDetails(selectedCountry);
    }
});



favoritesButton.addEventListener("click", () => {
    activeSection = "favorites";

    homeSection.hidden = true;
    detailsSection.hidden = true;
    compareSection.hidden = true;
    favoritesSection.hidden = false;

    renderFavorites();
});



compareButton.addEventListener("click", () => {

    if (selectedCompareKeys.length !== 2) {
        alert("Please select exactly two countries!");
        return;
    }

    const selectedCountries = selectedCompareKeys.map((key) => {
        return allCountries.find((country) => {
            return getCountryKey(country) === key;
        });
    });

    if (selectedCountries.some((country) => !country)) {
        alert("Country data not found!");
        return;
    }

    homeSection.hidden = true;
    detailsSection.hidden = true;
    favoritesSection.hidden = true;
    compareSection.hidden = false;

    activeSection = "compare";

    compareMessage.textContent = "Comparing your selected countries.";

    compareContainer.innerHTML = selectedCountries.map((country) => {

        return `
            <div class="country-detail-card">

                <img
                    src="${escapeHTML(getCountryFlag(country))}"
                    alt="${escapeHTML(getCountryName(country))} flag"
                    class="detail-flag"
                    onerror="this.style.display='none'"
                >

                <h2>${escapeHTML(getCountryName(country))}</h2>

                <p>
                    <b>Capital:</b>
                    ${escapeHTML(country.capital?.[0] || country.capital || "N/A")}
                </p>

                <p>
                    <b>Region:</b>
                    ${escapeHTML(country.region || "N/A")}
                </p>

                <p>
                    <b>Population:</b>
                    ${Number(country.population || 0).toLocaleString("en-IN")}
                </p>

                <p>
                    <b>Area:</b>
                    ${Number(country.area || 0).toLocaleString("en-IN")} km²
                </p>

                <p>
                    <b>Currency:</b>
                    ${escapeHTML(getCurrencies(country))}
                </p>

                <p>
                    <b>Languages:</b>
                    ${escapeHTML(getLanguages(country))}
                </p>

            </div>
        `;

    }).join("");
});



compareBackButton.addEventListener("click", () => {
    compareSection.hidden = true;
    favoritesSection.hidden = false;

    activeSection = "favorites";

    renderFavorites();
});



searchInput.addEventListener("input", filterCountries);

regionFilter.addEventListener("change", filterCountries);



countrySelect.addEventListener("change", filterCountries);



sortCountries.addEventListener("change", filterCountries);



refreshButton.addEventListener("click", getCountries);



retryButton.addEventListener("click", getCountries);



getCountries();
