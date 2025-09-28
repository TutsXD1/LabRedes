// app/static/js/app.js


// Registra o plugin para mostrar valores nas colunas
Chart.register(ChartDataLabels);

const ctx = document.getElementById('trafficChart').getContext('2d');
const totalTrafficDisplay = document.getElementById('total-traffic-display');
const historyLog = document.getElementById('packet-history-log');
const chartTitle = document.getElementById('chart-title');
const backButton = document.getElementById('back-button');

// Variável para controlar o estado do drill down
let drillDownIp = null;
let currentApiData = {};

// Configuração do gráfico
const trafficChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
        onClick: (event, elements) => {
            if (elements.length > 0 && !drillDownIp) {
                const chartElement = elements[0];
                const ip = trafficChart.data.labels[chartElement.index];
                drillDownIp = ip;
                updateDashboard();
            }
        },
        plugins: {
            datalabels: {
                anchor: 'end',
                align: 'top',
                formatter: (value) => value > 0 ? formatBytes(value) : '',
                color: '#555'
            }
        }
    }
});

// -- FUNÇÕES DE ATUALIZAÇÃO --

function updateDashboard() {
    if (drillDownIp) {
        updateDrillDownView();
    } else {
        updateMainView();
    }
}

function updateMainView() {
    chartTitle.innerText = 'Análise de Tráfego por Cliente (últimos 5s)';
    backButton.classList.add('hidden');

    const labels = Object.keys(currentApiData);
    const trafficIn = labels.map(ip => currentApiData[ip].in);
    const trafficOut = labels.map(ip => currentApiData[ip].out);

    trafficChart.config.type = 'bar';
    trafficChart.data.labels = labels;
    trafficChart.data.datasets = [
        { label: 'Tráfego de Entrada (Bytes)', data: trafficIn, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
        { label: 'Tráfego de Saída (Bytes)', data: trafficOut, backgroundColor: 'rgba(255, 99, 132, 0.6)' }
    ];
    trafficChart.options.scales = {
        y: { beginAtZero: true, title: { display: true, text: 'Volume (Bytes)' } },
        x: { title: { display: true, text: 'IPs Sendo Analisados' } }
    };
    trafficChart.update();
}

function updateDrillDownView() {
    const ipData = currentApiData[drillDownIp];
    if (!ipData) return;

    chartTitle.innerText = `Análise por Protocolo para ${drillDownIp}`;
    backButton.classList.remove('hidden');

    const protocols = ipData.protocols;
    const protocolLabels = Object.keys(protocols);
    const protocolData = Object.values(protocols);

    trafficChart.config.type = 'pie'; // Mudar para gráfico de pizza
    trafficChart.data.labels = protocolLabels;
    trafficChart.data.datasets = [{
        label: 'Bytes por Protocolo',
        data: protocolData
    }];
    trafficChart.options.scales = {}; // Remover eixos para gráfico de pizza
    trafficChart.update();
}

async function fetchData() {
    try {
        const response = await fetch('/api/traffic-data');
        currentApiData = await response.json();
        updateDashboard();
        updateTotalTraffic();
    } catch (error) { console.error("Erro ao buscar dados do gráfico:", error); }
}

async function fetchHistory() {
    try {
        const response = await fetch('/api/packet-history');
        const historyData = await response.json();
        historyLog.innerHTML = ''; // Limpa o log antigo
        historyData.forEach(packet => {
            const entry = document.createElement('div');
            entry.className = 'packet-entry';
            entry.innerText = `[${packet.timestamp}] ${packet.src} -> ${packet.dst} [${packet.proto}] (${formatBytes(packet.size)})`;
        historyLog.appendChild(entry);
    });
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
    }
}

function updateTotalTraffic() {
    const total = Object.values(currentApiData).reduce((sum, ip) => sum + ip.in + ip.out, 0);
    totalTrafficDisplay.innerText = formatBytes(total);
}

// -- FUNÇÕES AUXILIARES --

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// -- INICIALIZAÇÃO --

backButton.addEventListener('click', () => {
    drillDownIp = null;
    updateDashboard();
});

// Inicia o ciclo de atualização
setInterval(() => {
    fetchData();
    fetchHistory();
}, 5000);

// Busca os dados iniciais
fetchData();
fetchHistory();