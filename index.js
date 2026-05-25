const people = [];
const options = [];
let currentPlayer = null;
loadSavedData();

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

let currentRotation = 0;
let spinning = false;

const colors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899'
];

function addPerson() {
  const input = document.getElementById('personInput');
  const name = input.value.trim();

  if (!name) return;

  if (people.length >= 5) {
    alert('Maximum 5 players allowed');
    return;
  }

  if (people.includes(name)) {
    alert('Player already exists');
    return;
  }

  people.push(name);

  input.value = '';

  saveData();
  renderPeople();
  renderCheckboxes();
}

function removePerson(index) {
  people.splice(index, 1);

  saveData();
  renderPeople();
  renderCheckboxes();
  if (!people.includes(currentPlayer)) {
	currentPlayer = null;
  }
  renderPlayerDropdown();
}
function setCurrentPlayer(name) {
  currentPlayer = name || null;
  drawWheel();
}

function renderPeople() {
  const container = document.getElementById('peopleList');

  container.innerHTML = '';

  people.forEach((person, index) => {
    const div = document.createElement('div');

    div.className = 'person-pill';

    div.innerHTML = `
      ${person}
      <button onclick="removePerson(${index})">X</button>
    `;

    container.appendChild(div);
  });
  renderPlayerDropdown();
}

function renderCheckboxes() {
  const container = document.getElementById('playerCheckboxes');

  container.innerHTML = '';

  people.forEach(person => {
    const label = document.createElement('label');

    label.innerHTML = `
      <input type="checkbox" value="${person}" checked />
      ${person}
    `;

    container.appendChild(label);
  });
}

function addOption() {
  const optionInput = document.getElementById('optionInput');
  const weightInput = document.getElementById('weightInput');

  const name = optionInput.value.trim();
  const weight = parseInt(weightInput.value);

  if (!name) {
    alert('Enter an option name');
    return;
  }

  const allowedPlayers = [
    ...document.querySelectorAll('#playerCheckboxes input:checked')
  ].map(cb => cb.value);

  options.push({
    name,
    weight,
    allowedPlayers,
    hidden: false
  });

  optionInput.value = '';

  saveData();
  renderOptions();
  drawWheel();
}

function removeOption(index) {
  options.splice(index, 1);

  saveData();
  renderOptions();
  drawWheel();
}

function renderOptions() {
  const container = document.getElementById('optionList');

  container.innerHTML = '';

  options.forEach((option, index) => {
    const div = document.createElement('div');

    div.className = 'option-card';

    if (option.hidden) {
      div.classList.add('hidden-option');
    }

    div.innerHTML = `
      <strong>${option.name}</strong><br>
      Weight: ${option.weight}<br>
      Players:
      ${
        option.allowedPlayers.length
          ? option.allowedPlayers.join(', ')
          : 'Everyone'
      }

      <br><br>

      <button
        class="danger-btn"
        onclick="removeOption(${index})"
      >
        Delete
      </button>
    `;

    container.appendChild(div);
  });
}

function visibleOptions() {
  let filtered = options.filter(o => !o.hidden);

  if (!currentPlayer) return filtered;

  return filtered.filter(o =>
    o.allowedPlayers.length === 0 ||
    o.allowedPlayers.includes(currentPlayer)
  );
}

function drawWheel(rotation = currentRotation) {
  ctx.clearRect(0, 0, 500, 500);

  const visible = visibleOptions();

  if (!visible.length) {
    ctx.fillStyle = '#111';

    ctx.beginPath();
    ctx.arc(250, 250, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';

    ctx.fillText('No Options', 250, 250);

    return;
  }

  const totalWeight = visible.reduce(
    (sum, option) => sum + option.weight,
    0
  );

  let startAngle = rotation;

  visible.forEach((option, index) => {
    const sliceAngle =
      (option.weight / totalWeight) * Math.PI * 2;

    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();

    ctx.moveTo(250, 250);

    ctx.arc(
      250,
      250,
      240,
      startAngle,
      endAngle
    );

    ctx.closePath();

    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();

    ctx.translate(250, 250);

    ctx.rotate(startAngle + sliceAngle / 2);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';

    let text = option.name;

    if (text.length > 18) {
      text = text.substring(0, 18) + '...';
    }

    ctx.fillText(text, 205, 5);

    ctx.restore();

    startAngle = endAngle;
  });

  ctx.beginPath();

  ctx.arc(250, 250, 40, 0, Math.PI * 2);

  ctx.fillStyle = '#111827';
  ctx.fill();
}

function spinWheel() {
	
  if (spinning) return;
  if (!currentPlayer) {
  alert('Select who is spinning first');
  return;
}

  const visible = visibleOptions();

  if (!visible.length) {
    alert('Add some options first');
    return;
  }

  spinning = true;

  document.getElementById('winnerText').textContent = '';

  document.getElementById('winnerActions').innerHTML = '';

  const extraRotation =
    Math.random() * 360 + 1800;

  const startRotation = currentRotation;

  const targetRotation =
    currentRotation + (extraRotation * Math.PI / 180);

  const duration = 5000;

  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;

    const progress = Math.min(
      elapsed / duration,
      1
    );

    const eased =
      1 - Math.pow(1 - progress, 4);

    currentRotation =
      startRotation +
      ((targetRotation - startRotation) * eased);

    drawWheel(currentRotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      determineWinner();
    }
  }

  requestAnimationFrame(animate);
}

function determineWinner() {
  const visible = visibleOptions();

  const totalWeight = visible.reduce(
    (sum, option) => sum + option.weight,
    0
  );

  const fullCircle = Math.PI * 2;

  // 🔥 KEY FIX: pointer is at TOP (-90°)
  const pointerAngle = -Math.PI / 2;

  // normalize rotation into 0..2π
  const normalizedRotation =
    ((currentRotation % fullCircle) + fullCircle) % fullCircle;

  // where the pointer is pointing in wheel space
  const pointer = (fullCircle - normalizedRotation + pointerAngle + fullCircle) % fullCircle;

  let current = 0;

  for (const option of visible) {
    const slice = (option.weight / totalWeight) * fullCircle;

    if (pointer >= current && pointer < current + slice) {
      showWinner(option);
      return;
    }

    current += slice;
  }

  showWinner(visible[0]);
}

function showWinner(option) {
  document.getElementById(
    'winnerText'
  ).textContent = `🎉 ${option.name} 🎉`;

  document.getElementById(
    'winnerActions'
  ).innerHTML = `
    <button
      class="danger-btn"
      onclick="hideOption('${option.name.replace(/'/g, "\\'")}')"
    >
      Hide Option
    </button>

    <button
      class="secondary-btn"
      onclick="keepOption()"
    >
      Keep On Wheel
    </button>
  `;

  if (
    option.name === 'Maple Walk' ||
    option.name === 'Maple Park' ||
    option.name === 'Maple Train'
  ) {
    playAirHornMadness();
  }
}

function hideOption(name) {
  const option = options.find(
    o => o.name === name
  );

  if (option) {
    option.hidden = true;
  }

  saveData();
  renderOptions();
  drawWheel();
}

function keepOption() {
  document.getElementById(
    'winnerActions'
  ).innerHTML = '';
}

function resetHidden() {
  options.forEach(option => {
    option.hidden = false;
  });

  renderOptions();
  drawWheel();
}

function playAirHornMadness() {
  document.body.classList.add('flash');

  setTimeout(() => {
    document.body.classList.remove('flash');
  }, 1000);

  const horn = new Audio('airhorn.mp3');

  horn.volume = 1.0;
  horn.play();
}

function saveData() {
  localStorage.setItem(
    'spinnerWheelData',
    JSON.stringify({
      people,
      options
    })
  );
}

function loadSavedData() {
  const saved =
    localStorage.getItem('spinnerWheelData');

  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    if (Array.isArray(data.people)) {
      people.push(...data.people);
    }

    if (Array.isArray(data.options)) {
      options.push(...data.options);
    }

    setTimeout(() => {
      renderPeople();
      renderCheckboxes();
      renderOptions();
      drawWheel();
    }, 0);
  } catch (err) {
    console.error('Failed to load saved data', err);
  }
}

function resetWheel() {
  if (
    !confirm(
      'Reset the entire wheel and clear saved data?'
    )
  ) {
    return;
  }

  people.length = 0;
  options.length = 0;

  localStorage.removeItem('spinnerWheelData');

  renderPeople();
  renderCheckboxes();
  renderOptions();
  drawWheel();

  document.getElementById('winnerText').textContent = '';
  document.getElementById('winnerActions').innerHTML = '';
}

function renderPlayerDropdown() {
  const select = document.getElementById('currentPlayerSelect');

  if (!select) return;

  select.innerHTML = `<option value="">Select player</option>`;

  people.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });

  if (currentPlayer && people.includes(currentPlayer)) {
    select.value = currentPlayer;
  }
}

drawWheel();
