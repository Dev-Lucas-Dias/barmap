// Função para normalizar o texto (remover acentos e colocar tudo minúsculo)
function normalizeText(text) {
    return text.toLowerCase()
        .normalize('NFD')  // Desacopla os acentos
        .replace(/[\u0300-\u036f]/g, ''); // Remove os acentos
}

// Função para calcular a distância de Levenshtein
function levenshtein(a, b) {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) tmp[i] = [i];
    for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1,  // Remover
                tmp[i][j - 1] + 1,  // Adicionar
                tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)  // Substituir
            );
        }
    }
    return tmp[a.length][b.length];
}

// Dados de bares em Alfenas, MG (locais fictícios)
const bars = [
    { name: "Bar e Restaurante XV Botequim", description: "Ponto de encontro em Alfenas com opções de mesas ao ar livre e ambiente interno charmoso.", location: [-21.427204342071356, -45.947424933045575] },
    { name: "Boteco do Frezinho", description: "Ambiente descontraído, ideal para comida de buteco e cerveja gelada a preços acessíveis.", location: [-21.423894279727502, -45.94688244690019] },
    { name: "Januário Bar", description: "Bar com sinuca, ambiente descontraído, ideal para amigos.", location: [-21.427946357704375, -45.945116085125605] },
    { name: "Seu Jorge Choperia Burgueria", description: "Experiência gastronômica com pratos da culinária mineira e opções criativas.", location: [-21.42976402305098, -45.94339947144514] },
    { name: "Rústico Bar", description: "Ambiente aconchegante com tira-gosto e música ao vivo.", location: [-21.416416359618285, -45.94836502745462] }
];

let userLocation = null; // Variável para armazenar a localização do usuário
let currentRoute = null; // Variável para armazenar a rota
const markers = []; // Array para armazenar os marcadores dos bares

const map = L.map('map', {
    zoomControl: false, // Desabilita o controle de zoom se não for necessário
});

// Inicializa a localização do usuário
function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            map.setView(userLocation, 13);
            L.marker(userLocation).addTo(map).bindPopup("Você está aqui");
            displayBars();
        }, () => {
            alert("Erro ao obter a localização.");
        });
    } else {
        alert("Geolocalização não disponível.");
    }
}

// Função para exibir os bares no mapa
function displayBars() {
    bars.forEach(bar => {
        const marker = L.marker(bar.location).addTo(map).bindPopup(bar.name);
        markers.push(marker); // Adiciona o marcador ao array de marcadores

        marker.on('click', function() {
            addRoute(bar.location);
        });
    });
}

// Função para traçar a rota até o bar selecionado
function addRoute(barLocation) {
    if (!userLocation) {
        alert("Localização do usuário não encontrada.");
        return;
    }

    if (currentRoute) {
        currentRoute.setWaypoints([L.latLng(userLocation), L.latLng(barLocation)]);
    } else {
        currentRoute = L.Routing.control({
            waypoints: [
                L.latLng(userLocation),
                L.latLng(barLocation)
            ],
            routeWhileDragging: true
        }).addTo(map);
    }
}

// Função para remover a rota quando clicar fora de um marcador de bar
function removeRouteOnClickOutside(event) {
    const clickedOnMarker = markers.some(marker => marker.getLatLng().equals(event.latlng));
    if (!clickedOnMarker && currentRoute) {
        map.removeControl(currentRoute); // Remove a rota
        currentRoute = null; // Limpa a variável da rota
    }
}

// Carregar o mapa com OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Adiciona evento de clique para remover a rota ao clicar fora de um marcador
map.on('click', function(event) {
    removeRouteOnClickOutside(event);
});

// Inicializa a localização do usuário
locateUser();

// Função para buscar bares com base na descrição e análise das palavras
function searchBars() {
    const searchTerm = normalizeText(document.getElementById('search').value);
    const results = bars.filter(bar => {
        const description = normalizeText(bar.description);
        const descriptionWords = description.split(/\s+/); // Separa a descrição por palavras

        return searchTerm.split(/\s+/).some(searchWord => {
            return descriptionWords.some(descriptionWord => {
                return levenshtein(searchWord, descriptionWord) <= 2; // Tolerância de 2 edições
            });
        });
    });

    displayResults(results);
}

// Exibe os resultados da busca
async function displayResults(results) {
    document.getElementById('results').innerHTML = '';

    for (const bar of results) {
        const address = await getAddressFromCoordinates(bar.location);

        const div = document.createElement('div');
        div.classList.add('bar');
        div.innerHTML = `<strong>${bar.name}</strong><br><em>Endereço: ${address}</em>`;

        div.onclick = () => {
            addRoute(bar.location);
        };

        document.getElementById('results').appendChild(div);
}

// Função para converter coordenadas em endereço usando a API de geocodificação reversa do OpenStreetMap
async function getAddressFromCoordinates(coords) {
    const [lat, lon] = coords;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.address) {
            const address = `${data.address.road || ''}, ${data.address.city || ''}, ${data.address.state || ''}, ${data.address.country || ''}`;
            return address.trim();
        } else {
            return 'Endereço não encontrado';
        }
    } catch (error) {
        console.error("Erro na geocodificação:", error);
        return 'Erro ao obter o endereço';
    }
}
}// Função para limpar a busca
function clearSearch() {
    // Limpa o campo de busca
    document.getElementById('search').value = '';
    
    // Limpa os resultados
    document.getElementById('results').innerHTML = '';
}
