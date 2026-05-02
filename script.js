let sites = [];

// Load sites from localStorage when page starts
window.onload = function() {
  const savedSites = localStorage.getItem('sites');
  if (savedSites) {
    sites = JSON.parse(savedSites);
    renderSites();
    restartAllGenerators(); // restart timers after reload
  }

  // Attach event listener globally
  document.getElementById('addBtn').addEventListener('click', addSite);
};

function saveSites() {
  localStorage.setItem('sites', JSON.stringify(sites));
}

function addSite() {
  const name = document.getElementById('siteName').value.trim();
  const fuel = parseFloat(document.getElementById('fuelLitres').value);
  const rate = parseFloat(document.getElementById('consumptionRate').value);

  if (!name || isNaN(fuel) || isNaN(rate)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const site = {
    name,
    fuel,
    rate,
    remainingFuel: fuel,
    running: true,
    interval: null,
    editing: false
  };

  sites.push(site);
  saveSites();
  renderSites();
  startGenerator(sites.length - 1);

  // Clear form
  document.getElementById('siteName').value = '';
  document.getElementById('fuelLitres').value = '';
  document.getElementById('consumptionRate').value = '';
}

function renderSites() {
  const container = document.getElementById('siteContainer');
  container.innerHTML = '';

  // Clear old intervals before re-render
  sites.forEach(site => {
    if (site.interval) {
      clearInterval(site.interval);
      site.interval = null;
    }
  });

  sites.forEach((site, index) => {
    const card = document.createElement('div');
    card.className = 'site-card';

    if (site.editing) {
      card.innerHTML = `
        <h3><input type="text" id="editName-${index}" value="${site.name}"></h3>
        <p>Fuel Remaining: <span id="fuel-${index}">${site.remainingFuel.toFixed(2)}</span> L</p>
        <p>Consumption Rate: <input type="number" id="editRate-${index}" value="${site.rate}"> L/hour</p>
        <p>Time Remaining: <span id="timer-${index}">--:--:--</span></p>
        <div class="inline-group">
          <input type="number" id="refuel-${index}" placeholder="Litres to add">
          <button onclick="saveEdit(${index})">Save Changes</button>
          <button class="delete" onclick="deleteSite(${index})">Delete Site</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <h3 id="name-${index}">${site.name}</h3>
        <p>Fuel Remaining: <span id="fuel-${index}">${site.remainingFuel.toFixed(2)}</span> L</p>
        <p>Consumption Rate: <span id="rate-${index}">${site.rate}</span> L/hour</p>
        <p>Time Remaining: <span id="timer-${index}">--:--:--</span></p>
        <div class="inline-group">
          <button class="edit" onclick="editSite(${index})">Edit Site</button>
          <button class="delete" onclick="deleteSite(${index})">Delete Site</button>
        </div>
      `;
    }

    container.appendChild(card);
    updateTimerDisplay(index);
  });

  // Restart all running generators after re-render
  restartAllGenerators();
}

function startGenerator(index) {
  if (sites[index].interval) return;
  sites[index].running = true;
  sites[index].interval = setInterval(() => {
    if (sites[index].remainingFuel > 0) {
      sites[index].remainingFuel -= sites[index].rate / 3600;
      document.getElementById(`fuel-${index}`).innerText = sites[index].remainingFuel.toFixed(2);
      updateTimerDisplay(index);
      saveSites();
    } else {
      clearInterval(sites[index].interval);
      sites[index].interval = null;
      sites[index].running = false;
      document.getElementById(`timer-${index}`).innerText = "00:00:00";
      alert(`${sites[index].name} generator stopped (fuel empty).`);
      saveSites();
    }
  }, 1000);
}

function restartAllGenerators() {
  sites.forEach((site, i) => {
    if (site.running) {
      startGenerator(i);
    }
  });
}

function deleteSite(index) {
  clearInterval(sites[index].interval);
  sites.splice(index, 1);
  saveSites();
  renderSites(); // re-render and restart all
}

function editSite(index) {
  sites[index].editing = true;
  renderSites();
}

function saveEdit(index) {
  const newName = document.getElementById(`editName-${index}`).value.trim();
  const newRate = parseFloat(document.getElementById(`editRate-${index}`).value);
  const refuelAmount = parseFloat(document.getElementById(`refuel-${index}`).value);

  if (newName) sites[index].name = newName;
  if (!isNaN(newRate) && newRate > 0) sites[index].rate = newRate;
  if (!isNaN(refuelAmount) && refuelAmount > 0) sites[index].remainingFuel += refuelAmount;

  sites[index].editing = false;
  saveSites();
  renderSites(); // re-render and restart all
}

function updateTimerDisplay(index) {
  const site = sites[index];
  if (!site) return;

  if (site.rate > 0 && site.remainingFuel > 0) {
    const hours = site.remainingFuel / site.rate;
    const totalSeconds = Math.floor(hours * 3600);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    document.getElementById(`timer-${index}`).innerText =
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else {
    document.getElementById(`timer-${index}`).innerText = "00:00:00";
  }
}
