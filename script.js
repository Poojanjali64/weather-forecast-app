const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

const API_KEY = "0082cffb11ffc80143ef72a180201d65"; // API key for OpenWeatherMap API

const createWeatherCard = (cityName, weatherItem, index) => {
    if(index === 0) { // HTML for the main weather card
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { // HTML for the other five day forecast card
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });        
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Get entered city coordinates (latitude, longitude, and name) from the API response
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) return alert(`No city found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => { // Show alert if user denied the location permission
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

//local storage
// Key for storing cities in localStorage
const STORAGE_KEY = 'recentCities';
const MAX_CITIES = 5;

// Function to get recently searched cities from localStorage
function getRecentCities() {
  const cities = localStorage.getItem(STORAGE_KEY);
  return cities ? JSON.parse(cities) : [];
}

// Function to save recently searched cities to localStorage
function saveRecentCities(cities) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

// Function to add a city to the recent search list
function addCity(city) {
  let cities = getRecentCities();

  // Remove the city if it already exists, to move it to the top
  cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());

  // Add the new city at the beginning
  cities.unshift(city);

  // Limit to the last 5 searches
  if (cities.length > MAX_CITIES) {
    cities.pop();
  }

  // Save updated list to localStorage
  saveRecentCities(cities);
}

// Function to display recently searched cities in the dropdown
function displayRecentCities() {
  const cities = getRecentCities();
  const recentCitiesDropdown = document.getElementById('recent-cities-dropdown');

  // Clear the dropdown (keep the first default option)
  recentCitiesDropdown.innerHTML = '<option value="">Select a city</option>';

  // Add cities to the dropdown
  cities.forEach(city => {
    const optionElement = document.createElement('option');
    optionElement.value = city;
    optionElement.textContent = city;
    recentCitiesDropdown.appendChild(optionElement);
  });
}

// Event listener for the search button
document.getElementById('search-btn').addEventListener('click', () => {
  const cityInput = document.getElementById('city-input');
  const city = cityInput.value.trim();

  if (city) {
    addCity(city);
    displayRecentCities();
    cityInput.value = ''; // Clear the input
  }
});

// Event listener for dropdown selection
document.getElementById('recent-cities-dropdown').addEventListener('change', (event) => {
  const selectedCity = event.target.value;
  if (selectedCity) {
    // Perform the search or any action for the selected city
    document.getElementById('city-input').value = selectedCity;
  }
});

// Load recent cities on page load
document.addEventListener('DOMContentLoaded', displayRecentCities);
