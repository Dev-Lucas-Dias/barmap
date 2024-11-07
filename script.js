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
    {
        name: "Bar e Restaurante XV Botequim",
        description: "O bar é um excelente ponto de encontro em Alfenas, muito bem localizado na Praça da Matriz, com opções de mesas ao ar livre e um ambiente interno charmoso. As porções são generosas e saborosas, com destaque para o Filé Mignon Mineirinho. A cerveja é boa e gelada, e o local oferece uma boa variedade de rótulos. O serviço é geralmente bom, mas o atendimento de Allisson, que se destacou pela educação e solicitude, fez toda a diferença para os clientes. Embora as mesas e cadeiras precisem de uma reforma, o ambiente é agradável e acolhedor, o que torna o bar uma ótima opção tanto para um happy hour quanto para um almoço casual.",
        location: [-21.427204342071356, -45.947424933045575] // Localização aproximada em Alfenas
    },
    {
        name: "Boteco do Frezinho",
        description: "O lugar oferece um ambiente descontraído, perfeito para quem gosta de comida de buteco e cerveja gelada a preços acessíveis. Os pratos são saborosos, com destaque para a vaca atolada, tropeiro e o torresmo especial. A costela com mandioca é caseira e bem temperada. É ideal para um happy hour, embora o local fique lotado, especialmente por universitários, e o atendimento possa ser demorado. Mesmo com as filas, a comida e o bom atendimento compensam a espera.",
        location: [-21.423894279727502, -45.94688244690019] // Localização aproximada em Alfenas
    },
    {
        name: "Januário Bar",
        description: "O bar é uma excelente opção em Alfenas e tem sinuca, oferecendo um ambiente descolado e descontraído, ideal para ir com amigos. As porções são saborosas, especialmente a calabresa com molho verde, que conquista todos. O atendimento é atencioso e simpático, apesar de algumas demoras ocasionais. A cerveja, tanto normal quanto artesanal, é gelada, e o preço é justo. Um lugar sem frescura, perfeito para curtir uma boa comida e bebida.",
        location: [-21.427946357704375, -45.945116085125605] // Localização aproximada em Alfenas
    },
    {
        name: "Seu Jorge Choperia Burgueria",
        description: "O restaurante oferece uma experiência gastronômica única, com pratos que combinam sabores autênticos da culinária mineira e opções criativas. O ambiente é acolhedor e agradável, ideal para aproveitar a boa comida e a música ao vivo. O atendimento é bom, com bebidas geladas e drinks bem preparados. O torresmo de rolo e os pastéis são destaques do cardápio.",
        location: [-21.42976402305098, -45.94339947144514] // Localização aproximada em Alfenas
    },
    {
        name: "Rústico Bar",
        description: "O ambiente é aconchegante e bem arrumado, ideal para quem busca um lugar agradável para comer e se divertir. A comida é deliciosa, com opções de tira gosto incríveis e preços justos. O local está mais animado, perfeito para quem gosta de agito, mas ainda é uma boa escolha para momentos com a família. Embora o atendimento seja atencioso, há uma certa demora na entrega dos pedidos. A música ao vivo contribui para a atmosfera descontraída e divertida.",
        location: [-21.416416359618285, -45.94836502745462] // Localização aproximada em Alfenas
    }
];
// Função para buscar bares com base na descrição e análise das palavras
function searchBars() {
    const searchTerm = normalizeText(document.getElementById('search').value);
    const results = bars.filter(bar => {
        const description = normalizeText(bar.description);
        const descriptionWords = description.split(/\s+/);  // Separa a descrição por palavras

        // Para cada palavra da busca, verifica se existe similaridade na descrição
        return searchTerm.split(/\s+/).some(searchWord => {
            // Para cada palavra da busca, verifica a similaridade com as palavras da descrição
            return descriptionWords.some(descriptionWord => {
                // Calcula a distância de Levenshtein e verifica se a similaridade é suficiente
                return levenshtein(searchWord, descriptionWord) <= 2; // Tolerância de 2 edições
            });
        });
    });

    // Exibe os resultados
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

// Inicializa o mapa e a localização do usuário
let userLocation = null; // Variável para armazenar a localização do usuário
let currentRoute = null; // Variável para armazenar a rota

const map = L.map('map', {
    zoomControl: false, // Desabilita o controle de zoom se não for necessário
});

// Tenta localizar o usuário ao carregar a página
function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = [position.coords.latitude, position.coords.longitude];

            // Centraliza o mapa na localização do usuário
            map.setView(userLocation, 13);

            // Marca a localização do usuário no mapa
            L.marker(userLocation).addTo(map).bindPopup("Você está aqui");

            // Chama a função de mostrar os bares
            displayBars();
        }, () => {
            alert("Erro ao obter a localização.");
        });
    } else {
        alert("Geolocalização não disponível.");
    }
}

// Carregar o mapa com OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Exibe os bares no mapa
function displayBars() {
    bars.forEach(bar => {
        // Cria o marcador para o bar
        const marker = L.marker(bar.location).addTo(map).bindPopup(bar.name);

        // Adiciona evento para traçar a rota até o bar selecionado
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

    // Se já existir uma rota, não removemos ela ao clicar em outro lugar
    if (currentRoute) {
        currentRoute.setWaypoints([L.latLng(userLocation), L.latLng(barLocation)]);
    } else {
        // Cria uma nova rota se não existir uma rota
        currentRoute = L.Routing.control({
            waypoints: [
                L.latLng(userLocation),
                L.latLng(barLocation)
            ],
            routeWhileDragging: true // Permite arrastar a rota
        }).addTo(map);
    }
}

// Inicializa a localização do usuário
locateUser();
