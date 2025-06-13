const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const currentWeatherItemsEl = document.getElementById('current-weather-items');
const timezoneEl = document.getElementById('time-zone');
const countryEl = document.getElementById('country');
const weatherForecastEl = document.getElementById('weather-forecast');
const currentTempEl = document.getElementById('current-temp');

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const hr12 = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  timeEl.innerHTML = `${hr12.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} <span id="am-pm">${ampm}</span>`;
  dateEl.innerHTML = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}, 1000);

function searchWeather() {
  const loc = document.getElementById('search-box').value.trim();
  if (!loc) return alert("Enter a city name");
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`)
    .then(res => res.json())
    .then(d => {
      if (!d.results || d.results.length === 0) return alert("Not found");
      const p = d.results[0];
      fetchWeather(p.latitude, p.longitude, p.name, p.country);
    })
    .catch(console.error);
}

navigator.geolocation.getCurrentPosition(
  pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Your Location"),
  () => fetchWeather(28.6139,77.2090,"Delhi","IN") // fallback
);

function fetchWeather(lat, lon, place="", country="") {
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`)
    .then(res => res.json())
    .then(d => showWeather(d, place, country))
    .catch(console.error);
}

function showWeather(d, place, country) {
  const cur = d.current_weather;
  const daily = d.daily;
  timezoneEl.innerHTML = place || d.timezone;
  countryEl.innerHTML = country || `Lat: ${d.latitude.toFixed(2)}, Lon: ${d.longitude.toFixed(2)}`;

  currentWeatherItemsEl.innerHTML = `
    <div class="weather-item"><div>Temp</div><div>${cur.temperature}°C</div></div>
    <div class="weather-item"><div>Wind</div><div>${cur.windspeed} km/h</div></div>
  `;

  const getIcon = code => {
    const m = {
      0: 'clear-day', 1: 'partly-cloudy-day', 2: 'partly-cloudy-day', 3: 'overcast',
      45: 'fog',48:'fog',
      51: 'drizzle',53:'drizzle',55:'drizzle',56:'freezing-rain',57:'freezing-rain',
      61: 'rain',63:'rain',65:'rain',66:'freezing-rain',67:'freezing-rain',
      71:'snow',73:'snow',75:'snow',77:'snow',
      80:'rain',81:'rain',82:'rain',
      85:'snow',86:'snow',
      95:'thunderstorm',96:'thunderstorm',99:'thunderstorm'
    };
    return m[code] || 'cloudy';
  };

  const iconUrl = name => `https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/${name}.svg`;

  const todayIcon = getIcon(cur.weathercode);
  currentTempEl.innerHTML = `
    <img src="${iconUrl(todayIcon)}" class="w-icon" alt="">
    <div class="other">
      <div class="day">${new Date(daily.time[0]).toLocaleDateString(undefined,{weekday:'long'})}</div>
      <div class="temp">Min - ${daily.temperature_2m_min[0]}°C</div>
      <div class="temp">Max - ${daily.temperature_2m_max[0]}°C</div>
    </div>
  `;

  let html = '';
  for (let i = 1; i < daily.time.length; i++) {
    const dt = new Date(daily.time[i]);
    const ic = getIcon(daily.weathercode[i]);
    html += `
      <div class="weather-forecast-item">
        <div class="day">${dt.toLocaleDateString(undefined,{weekday:'short'})}</div>
        <img src="${iconUrl(ic)}" class="w-icon" alt="">
        <div class="temp">Min - ${daily.temperature_2m_min[i]}°C</div>
        <div class="temp">Max - ${daily.temperature_2m_max[i]}°C</div>
      </div>
    `;
  }
  weatherForecastEl.innerHTML = html;
}
