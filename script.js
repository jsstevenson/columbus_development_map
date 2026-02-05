const fileMapping = {
  buildings: "./assets/buildings/buildings.json",
};

const loadJson = (filename) => {
  return fetch(filename).then((response) => {
    if (!response.ok) {
      throw new Error(
        `Unable to load file ${filename}: ${response.statusText}`,
      );
    }
    return response.json();
  });
};

const loadJsonFiles = (fileMapping) => {
  const keys = Object.keys(fileMapping);
  const loadPromises = keys.map((key) =>
    loadJson(fileMapping[key]).then((data) => ({ key, data })),
  );

  return Promise.all(loadPromises).then((results) => {
    return results.reduce((acc, { key, data }) => {
      acc[key] = data;
      return acc;
    }, {});
  });
};

const buildMap = () => {
  const MAP_CENTER = [39.96325, -82.99786];
  const map = L.map("map").setView(MAP_CENTER, 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 25,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  return map;
};

const renderBuilding = (properties) => {
  const linkText = properties.links.map(
    (url) =>
      `<a href="${url}" target=_blank rel="noopener noreferrer">link</a>`,
  );
  return `<b>${properties.name}</b><br /><b>Status: </b>${properties.status}<br /><b>Categories: </b>${properties.categories}<br /><b>Links: </b>${linkText}`;
};

const addBuildings = (buildings, map) => {
  L.geoJSON(buildings, {
    onEachFeature: (feature, layer) => {
      layer.bindPopup(renderBuilding(feature.properties));
    },
  }).addTo(map);
};

const enableClickCoordsDebug = (map) => {
  let marker;

  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (!marker) marker = L.marker(e.latlng).addTo(map);
    else marker.setLatLng(e.latlng);

    const geojsonOrder = `[${lng.toFixed(6)}, ${lat.toFixed(6)}]`;

    marker
      .bindPopup(`
        <div>
          <div>Coords [lng, lat]: <code>${geojsonOrder}</code></div>
          <button
            onclick="
              navigator.clipboard.writeText('${geojsonOrder}');
              this.innerText = 'Copied!';
              setTimeout(() => this.innerText = 'Copy', 800);
            "
          >
            Copy
          </button>
        </div>
      `)
      .openPopup();
  });
};

loadJsonFiles(fileMapping)
  .then((data) => {
    const map = buildMap();
    addBuildings(data.buildings, map);
    enableClickCoordsDebug(map);
  })
  .catch((error) => {
    console.error("Error loading files:", error);
  });
