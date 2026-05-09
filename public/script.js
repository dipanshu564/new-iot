function showToast(text, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showLoader(show) {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.toggle('hidden', !show);
}

function apiPost(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then((res) => res.json());
}

function apiDelete(url) {
  return fetch(url, { method: 'DELETE' }).then((res) => res.json());
}

function handleLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    showLoader(true);
    apiPost('/auth/login', { email, password })
      .then((data) => {
        showLoader(false);
        if (data.success) {
          showToast('Login successful!', 'success');
          window.location.href = '/dashboard';
        } else {
          showToast(data.error || 'Login failed', 'error');
        }
      })
      .catch(() => {
        showLoader(false);
        showToast('Login request failed.', 'error');
      });
  });
}

function handleRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    showLoader(true);
    apiPost('/auth/register', { name, email, password })
      .then((data) => {
        showLoader(false);
        if (data.success) {
          showToast('Registration successful!', 'success');
          window.location.href = '/';
        } else {
          showToast(data.error || 'Registration failed', 'error');
        }
      })
      .catch(() => {
        showLoader(false);
        showToast('Register request failed.', 'error');
      });
  });
}

const dashboardState = {
  records: [],
  page: 1,
  pageSize: 5,
  query: ''
};

function updateClock() {
  const clockEl = document.getElementById('clock-widget');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString();
}

function setNavUser(name) {
  const nameEl = document.getElementById('nav-username');
  if (nameEl) nameEl.textContent = name || 'User';
}

function loadUser() {
  fetch('/auth/user')
    .then((res) => {
      if (!res.ok) {
        window.location.href = '/';
        throw new Error('Unauthorized');
      }
      return res.json();
    })
    .then((data) => {
      setNavUser(data.user.name);
    })
    .catch(() => {
      setNavUser('Guest');
    });
}

function formatDateTime() {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}

function loadLatestSensor() {
  fetch('/api/latest')
    .then((res) => res.json())
    .then((data) => {
      const latest = data.latest;
      const tempEl = document.getElementById('temp-value');
      const humEl = document.getElementById('hum-value');
      const badge = document.getElementById('status-badge');
      const updated = document.getElementById('last-updated');

      if (latest) {
        if (tempEl) tempEl.textContent = `${latest.temperature}°C`;
        if (humEl) humEl.textContent = `${latest.humidity}%`;
        if (updated) updated.textContent = `Last updated: ${formatDateTime()}`;
        if (badge) {
          const tempNumber = parseFloat(latest.temperature) || 0;
          badge.textContent = tempNumber > 30 ? 'High temperature' : 'Normal';
          badge.className = `badge ${tempNumber > 30 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'}`;
        }
      }
    })
    .catch(() => {
      showToast('Could not load latest sensor data.', 'error');
    });
}

function loadRecords() {
  fetch('/api/records')
    .then((res) => res.json())
    .then((data) => {
      dashboardState.records = data.records || [];
      renderRecords();
      loadStats();
      updateChart();
    })
    .catch(() => {
      showToast('Could not load sensor records.', 'error');
    });
}

function loadStats() {
  fetch('/api/stats')
    .then((res) => res.json())
    .then((data) => {
      const totalEl = document.getElementById('total-records');
      const avgTempEl = document.getElementById('avg-temp');
      const avgHumEl = document.getElementById('avg-hum');
      if (totalEl) totalEl.textContent = data.total || 0;
      if (avgTempEl) avgTempEl.textContent = `${data.averageTemperature}°C`;
      if (avgHumEl) avgHumEl.textContent = `${data.averageHumidity}%`;
    });
}

function renderRecords() {
  const body = document.getElementById('record-table-body');
  const empty = document.getElementById('record-empty');
  const pagination = document.getElementById('record-pagination');
  if (!body || !empty || !pagination) return;

  const filtered = dashboardState.records.filter((record) => {
    const query = dashboardState.query.toLowerCase();
    return (
      record.temperature.toString().toLowerCase().includes(query) ||
      record.humidity.toString().toLowerCase().includes(query) ||
      record.time.toLowerCase().includes(query) ||
      record.date.toLowerCase().includes(query)
    );
  });

  const page = dashboardState.page;
  const pageSize = dashboardState.pageSize;
  const start = (page - 1) * pageSize;
  const pageRecords = filtered.slice(start, start + pageSize);

  body.innerHTML = '';
  if (pageRecords.length === 0) {
    empty.classList.remove('hidden');
    body.innerHTML = '';
  } else {
    empty.classList.add('hidden');
    pageRecords.forEach((record, index) => {
      const row = document.createElement('tr');
      row.className = 'bg-slate-950/80 rounded-3xl';
      row.innerHTML = `
        <td class="px-4 py-3 font-medium">${start + index + 1}</td>
        <td class="px-4 py-3">${record.temperature}°C</td>
        <td class="px-4 py-3">${record.humidity}%</td>
        <td class="px-4 py-3">${record.time}</td>
        <td class="px-4 py-3">${record.date}</td>
        <td class="px-4 py-3">
          <button class="rounded-2xl bg-rose-500 px-4 py-2 text-white hover:bg-rose-400 transition" data-id="${record.id}">Delete</button>
        </td>
      `;
      body.appendChild(row);
    });
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  pagination.innerHTML = '';
  for (let i = 1; i <= pageCount; i += 1) {
    const button = document.createElement('button');
    button.textContent = i;
    button.className = `rounded-full px-3 py-2 ${i === page ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;
    button.addEventListener('click', () => {
      dashboardState.page = i;
      renderRecords();
    });
    pagination.appendChild(button);
  }

  body.querySelectorAll('button[data-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      if (!confirm('Delete this sensor record?')) return;
      apiDelete(`/api/delete/${id}`)
        .then((data) => {
          if (data.success) {
            showToast('Record deleted.', 'success');
            loadRecords();
          } else {
            showToast(data.error || 'Delete failed.', 'error');
          }
        })
        .catch(() => {
          showToast('Delete request failed.', 'error');
        });
    });
  });
}

function updateChart() {
  const chartEl = document.getElementById('sensor-chart');
  if (!chartEl) return;
  const data = dashboardState.records.slice(0, 10).reverse();
  const labels = data.map((record) => `${record.date} ${record.time}`);
  const temperatureData = data.map((record) => parseFloat(record.temperature));
  const humidityData = data.map((record) => parseFloat(record.humidity));

  if (!window.sensorChart) {
    window.sensorChart = new Chart(chartEl, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temperatureData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.25)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Humidity (%)',
            data: humidityData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#e2e8f0' } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } }
        }
      }
    });
  } else {
    window.sensorChart.data.labels = labels;
    window.sensorChart.data.datasets[0].data = temperatureData;
    window.sensorChart.data.datasets[1].data = humidityData;
    window.sensorChart.update();
  }
}

function loadLcdMessage() {
  fetch('/api/lcd')
    .then((res) => res.json())
    .then((data) => {
      const current = document.getElementById('lcd-current-message');
      if (current) current.textContent = data.message || 'No message yet.';
    })
    .catch(() => {
      showToast('Could not load LCD message.', 'error');
    });
}

function saveLcdMessage() {
  const textarea = document.getElementById('lcd-textarea');
  if (!textarea) return;
  const message = textarea.value.trim().slice(0, 16);
  showLoader(true);
  apiPost('/api/lcd', { message })
    .then((data) => {
      showLoader(false);
      if (data.success) {
        loadLcdMessage();
        textarea.value = data.message;
        updateCharCount();
        showToast('LCD message saved.', 'success');
      } else {
        showToast(data.error || 'Could not save LCD message.', 'error');
      }
    })
    .catch(() => {
      showLoader(false);
      showToast('LCD request failed.', 'error');
    });
}

function updateCharCount() {
  const textarea = document.getElementById('lcd-textarea');
  const count = document.getElementById('lcd-char-count');
  if (!textarea || !count) return;
  const length = textarea.value.length;
  count.textContent = `${length} / 16`;
  if (length >= 16) {
    textarea.classList.add('border-rose-500');
  } else {
    textarea.classList.remove('border-rose-500');
  }
}

function downloadLcdMessage() {
  fetch('/api/lcd')
    .then((res) => res.json())
    .then((data) => {
      const text = data.message || '';
      const blob = new Blob([text], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'lcd.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(() => {
      showToast('Could not download LCD text.', 'error');
    });
}

function generateFakeSensor() {
  const temperature = (Math.random() * 18 + 22).toFixed(1);
  const humidity = (Math.random() * 40 + 40).toFixed(1);
  showLoader(true);
  apiPost('/api/sensor', { temperature, humidity })
    .then((data) => {
      showLoader(false);
      if (data.success) {
        showToast('Fake sensor record added.', 'success');
        loadLatestSensor();
        loadRecords();
      } else {
        showToast(data.error || 'Could not add sensor.', 'error');
      }
    })
    .catch(() => {
      showLoader(false);
      showToast('Sensor request failed.', 'error');
    });
}

function handleDashboardPage() {
  if (!document.getElementById('dashboard-app')) return;

  loadUser();
  updateClock();
  setInterval(updateClock, 1000);
  loadLatestSensor();
  loadRecords();
  loadLcdMessage();
  setInterval(() => {
    loadLatestSensor();
    loadRecords();
  }, 5000);

  const searchInput = document.getElementById('record-search');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      dashboardState.query = event.target.value;
      dashboardState.page = 1;
      renderRecords();
    });
  }

  const saveButton = document.getElementById('lcd-save-btn');
  if (saveButton) {
    saveButton.addEventListener('click', saveLcdMessage);
  }

  const downloadButton = document.getElementById('lcd-download-btn');
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadLcdMessage);
  }

  const textarea = document.getElementById('lcd-textarea');
  if (textarea) {
    textarea.addEventListener('input', () => {
      if (textarea.value.length > 16) {
        textarea.value = textarea.value.slice(0, 16);
      }
      updateCharCount();
    });
    updateCharCount();
  }

  const fakeButton = document.getElementById('fake-sensor-btn');
  if (fakeButton) {
    fakeButton.addEventListener('click', generateFakeSensor);
  }

  const exportButton = document.getElementById('csv-export-btn');
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const rows = dashboardState.records;
      if (!rows.length) {
        showToast('No records to export.', 'error');
        return;
      }
      const csv = ['id,temperature,humidity,time,date', ...rows.map((record) => `${record.id},${record.temperature},${record.humidity},${record.time},${record.date}`)].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'sensor-records.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      window.location.href = '/logout';
    });
  }

  const darkButton = document.getElementById('dark-toggle');
  if (darkButton) {
    darkButton.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      darkButton.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  handleLoginPage();
  handleRegisterPage();
  handleDashboardPage();
});
