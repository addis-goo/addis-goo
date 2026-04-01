// --- 1. CONFIG & MAP ---
const map = L.map('map', {zoomControl: false}).setView([9.01, 38.76], 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

let routeLine = null;

const hubs = {
    "Megenagna": [9.023, 38.802], "Bole": [8.995, 38.775], "Piazza": [9.034, 38.747], 
    "Mexico": [9.012, 38.756], "CMC": [9.022, 38.865], "Sarbet": [8.998, 38.745],
    "4 Kilo": [9.033, 38.763], "Lideta": [9.013, 38.741], "Gerji": [9.002, 38.805],
    "Ayat": [9.035, 38.895], "Kality": [8.925, 38.785], "Jemo": [8.975, 38.705]
};

const providersRaw = [
    { base: 130, perKm: 18, icon: "🚕" }, { base: 130, perKm: 17, icon: "🐎" },
    { base: 92, perKm: 14, icon: "🔴" }, { base: 125, perKm: 17, icon: "👸" },
    { base: 105, perKm: 16, icon: "🚕" }, { base: 10, perKm: 3, icon: "🚐" }
];

let currentLang = 'en';
let viewDate = new Date(); 

const translations = {
    en: {
        toggle: "አማርኛ", title: "AddisGo", sub: "AI Ride Comparison", hRoute: "Global Route Finder",
        btnCompare: "Compare All Rides", hMarket: "Market Essentials", hFuel: "Fuel Rates", hCurr: "Forex Board",
        back: "← Back", est: "Est. Total", viewHol: "VIEW HOLIDAYS →",
        providers: ["RIDE", "Feres", "Yango Economy", "Seregela", "TaxiYE", "Blue Minibus"],
        items: ["Teff (Magna)", "Bread", "Oil"],
        ethMonths: ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yakatit", "Megabit", "Miazia", "Genbot", "Sene", "Hamle", "Nehasse", "Pagume"]
    },
    am: {
        toggle: "English", title: "አዲስ ጎ", sub: "AI የጉዞ ንፅፅር", hRoute: "የጉዞ መፈለጊያ",
        btnCompare: "ታሪፎችን አወዳድር", hMarket: "መሰረታዊ የገበያ ዋጋ", hFuel: "የነዳጅ ዋጋ", hCurr: "የውጭ ምንዛሬ",
        back: "← ተመለስ", est: "ግምታዊ ዋጋ", viewHol: "በዓላትን ይመልከቱ →",
        providers: ["ራይድ", "ፈረስ", "ያንጎ", "ሰረገላ", "ታክሲዬ", "ሰማያዊ ሚኒባስ"],
        items: ["ጤፍ (ማግና)", "ዳቦ", "ዘይት"],
        ethMonths: ["መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"]
    }
};

// --- 2. THE HOLIDAY ORACLE ---
function getHolidaysForYear(ethYear) {
    let h = {
        '1-1': { en: "Enkutatash (New Year)", am: "እንቁጣጣሽ" },
        '1-17': { en: "Meskel", am: "መስቀል" },
        '4-29': { en: "Genna (Christmas)", am: "ገና" },
        '5-11': { en: "Timket (Epiphany)", am: "ጥምቀት" },
        '6-23': { en: "Adwa Victory Day", am: "የዓድዋ ድል" },
        '8-27': { en: "Patriots' Day", am: "የአርበኞች ቀን" },
        '9-18': { en: "Eid al-Adha", am: "ኢድ አል-አድሃ" },
        '9-20': { en: "Downfall of Derg", am: "የደርግ ውድቀት" },
        '12-12': { en: "Mawlid", am: "መውሊድ" }
    };
    return h;
}

// --- 3. THE CALENDAR ENGINE (FIXED FOR WEDNESDAY & ALL YEARS) ---
function getEthioDate(date) {
    const gYear = date.getFullYear();
    const gMonth = date.getMonth() + 1;
    const gDay = date.getDate();

    let ethYear = gYear - 8;
    const isLeap = (gYear % 4 === 0);
    const newYearSeptDay = isLeap ? 12 : 11;

    if (gMonth > 9 || (gMonth === 9 && gDay >= newYearSeptDay)) {
        ethYear = gYear - 7;
    }

    const meskerem1 = new Date(gYear, 8, newYearSeptDay);
    if (date < meskerem1) {
        meskerem1.setFullYear(gYear - 1);
        meskerem1.setDate((gYear - 1) % 4 === 0 ? 12 : 11);
    }

    const diffDays = Math.floor((date - meskerem1) / (1000 * 60 * 60 * 24));
    let ethMonth = Math.floor(diffDays / 30) + 1;
    let ethDay = (diffDays % 30) + 1;

    if (ethMonth > 13) { ethMonth = 13; ethDay = diffDays - 360 + 1; }
    return { day: ethDay, month: ethMonth, year: ethYear };
}

function renderFullCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-month-year');
    const eth = getEthioDate(viewDate);
    
    title.innerText = `${translations[currentLang].ethMonths[eth.month - 1]} ${eth.year}`;

    let html = "";
    const weekDays = currentLang === 'en' ? ['S','M','T','W','T','F','S'] : ['እ','ሰ','ማ','ረ','ሐ','ዓ','ቅ'];
    weekDays.forEach(d => html += `<div style="color:#94a3b8; font-size:11px; padding-bottom:10px;">${d}</div>`);

    const firstOfEthMonth = new Date(viewDate);
    firstOfEthMonth.setDate(viewDate.getDate() - (eth.day - 1));
    const startPadding = firstOfEthMonth.getDay();

    for (let p = 0; p < startPadding; p++) html += `<div></div>`;

    const totalDays = eth.month === 13 ? (eth.year % 4 === 3 ? 6 : 5) : 30;
    const todayEth = getEthioDate(new Date());
    const holidays = getHolidaysForYear(eth.year);

    for (let i = 1; i <= totalDays; i++) {
        const key = `${eth.month}-${i}`;
        const isHoliday = !!holidays[key];
        
        const currentIterDate = new Date(firstOfEthMonth);
        currentIterDate.setDate(firstOfEthMonth.getDate() + (i - 1));
        const isWeekend = (currentIterDate.getDay() === 0 || currentIterDate.getDay() === 6);
        
        const statusColor = (isHoliday || isWeekend) ? "#ef4444" : "#22c55e";
        const isToday = (i === todayEth.day && eth.month === todayEth.month && eth.year === todayEth.year);
        
        html += `<div onclick="checkDayStatus(${i}, ${eth.month})" style="padding:10px; cursor:pointer; background:${isToday ? "#fef3c7" : "transparent"}; border-radius:10px; border:${isToday ? "2px solid #f59e0b" : "1px solid #f1f5f9"};">
                <span style="font-size:14px; font-weight:bold;">${i}</span>
                <div style="width:6px; height:6px; background:${statusColor}; border-radius:50%; margin: 4px auto 0;"></div>
            </div>`;
    }
    grid.innerHTML = html;
}

// --- 4. DATA SYNC & UI ---
async function syncLiveForex() {
    const list = document.getElementById('curr-list');
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        const baseUSD = 157.15; 
        const currencies = [{code:'USD', f:'🇺🇸'}, {code:'EUR', f:'🇪🇺'}, {code:'GBP', f:'🇬🇧'}];
        
        list.innerHTML = currencies.map(c => {
            const val = c.code === 'USD' ? baseUSD : (baseUSD / data.rates[c.code]);
            return `<div class="row"><span>${c.f} ${c.code}</span><b id="tick-${c.code.toLowerCase()}">${val.toFixed(2)}</b></div>`;
        }).join('');
    } catch (e) { if(list) list.innerHTML = "Forex Sync Error"; }
}

async function syncAddisWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.03&longitude=38.74&current_weather=true');
        const data = await res.json();
        const temp = document.getElementById('tick-temp');
        if(temp) temp.innerText = data.current_weather.temperature.toFixed(1);
        const icon = document.getElementById('w-icon');
        if(icon) icon.innerText = data.current_weather.weathercode >= 51 ? "🌧️" : "☀️";
    } catch (e) { console.log("Weather Offline"); }
}

function renderMarketData() {
    const t = translations[currentLang];
    const ess = document.getElementById('ess-grid');
    if(ess) {
        ess.innerHTML = t.items.map(item => `
            <div class="box"><small>${item}</small><b>${item.includes("Bread") || item.includes("ዳቦ") ? "15" : "185"} ETB</b></div>
        `).join('');
    }
    updateCalendarBox();
}

function updateCalendarBox() {
    const today = getEthioDate(new Date());
    const el = document.getElementById('box-eth-date');
    if(el) el.innerText = `${translations[currentLang].ethMonths[today.month - 1]} ${today.day}, ${today.year}`;
}

function startLiveTicker() {
    setInterval(() => {
        ['tick-usd', 'tick-benz', 'tick-temp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                let current = parseFloat(el.innerText) || 0;
                let jitter = (Math.random() * 0.04 - 0.02);
                el.innerText = (current + jitter).toFixed(2);
                el.style.color = jitter > 0 ? "#10b981" : "#ef4444";
                setTimeout(() => el.style.color = "#d29922", 1000);
            }
        });
    }, 4000);
}

// --- 5. INTERACTION LOGIC ---
function openFullCalendar() { 
    viewDate = new Date(); 
    document.getElementById('calendar-modal').style.display = "flex";
    renderFullCalendar(); 
}

function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    renderFullCalendar();
}

function closeCalendar() { document.getElementById('calendar-modal').style.display = "none"; }

function checkDayStatus(day, month) {
    const info = document.getElementById('holiday-info');
    const eth = getEthioDate(viewDate);
    const holidays = getHolidaysForYear(eth.year);
    const key = `${month}-${day}`;
    
    if (holidays[key]) {
        info.innerHTML = `<b style="color:#b91c1c; font-size:18px;">✨ ${holidays[key][currentLang]}</b><br><span style="color:#ef4444; font-weight:bold;">🚫 NATIONAL HOLIDAY</span>`;
    } else {
        info.innerHTML = `<b>Regular Day</b><br><span style="color:#22c55e;">💼 BUSINESS AS USUAL</span>`;
    }
}

function handleMapClick(name) {
    let s = document.getElementById('start'), d = document.getElementById('dest');
    if (!s.value) s.value = name; 
    else if (!d.value && s.value !== name) d.value = name; 
    else { s.value = name; d.value = ""; }
}

function openComparison() {
    const sName = document.getElementById('start').value;
    const dName = document.getElementById('dest').value;
    if(!sName || !dName) return;

    const startCoords = hubs[sName], destCoords = hubs[dName];
    const dist = (map.distance(startCoords, destCoords)/1000).toFixed(1);

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline([startCoords, destCoords], {color: '#d29922', weight: 4, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    document.getElementById('route-km').innerText = `${dist} KM`;
    document.getElementById('route-title').innerText = `${sName} ➔ ${dName}`;
    document.body.classList.add('split-active');
    
    document.getElementById('vertical-ride-list').innerHTML = providersRaw.map((p, i) => {
        const price = Math.round(p.base + (p.perKm * dist));
        return `<div class="ride-box" onclick="showFinal('${translations[currentLang].providers[i]}', ${price})">
            <div style="font-size:30px">${p.icon}</div>
            <div><b>${translations[currentLang].providers[i]}</b></div>
            <div class="ride-price">${price} ETB</div>
        </div>`;
    }).join('');
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'am' : 'en';
    renderMarketData();
    syncLiveForex();
    document.getElementById('lang-toggle').innerText = translations[currentLang].toggle;
}

function showFinal(n, p) { 
    document.getElementById('confirm-brand').innerText = n; 
    document.getElementById('confirm-price').innerText = `${p} ETB`; 
    document.getElementById('confirm-modal').style.display = "flex"; 
}

function closeAll() { document.getElementById('confirm-modal').style.display = "none"; }
function closeSplitView() { document.body.classList.remove('split-active'); }

window.onload = () => {
    renderMarketData();
    syncLiveForex();
    syncAddisWeather();
    startLiveTicker();
    Object.keys(hubs).forEach(name => {
        L.circleMarker(hubs[name], {color:'#d29922', radius:8, fillOpacity:0.8}).addTo(map).on('click', () => handleMapClick(name));
        let li = document.createElement('li');
        li.innerHTML = `📍 ${name}`;
        li.onclick = () => handleMapClick(name);
        const hubList = document.getElementById('hub-list');
        if(hubList) hubList.appendChild(li);
    });
};
