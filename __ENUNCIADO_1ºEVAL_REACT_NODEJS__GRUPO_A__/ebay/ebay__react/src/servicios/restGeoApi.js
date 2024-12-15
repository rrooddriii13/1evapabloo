const restGeoApi = {
    getAccessToken: async () => {
        const response = await fetch('http://localhost:6666/api/GeoApi/GetAccessToken', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa('AnonymousGeoApi:tryHarder')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ solicitud: 'accessToken' })
        });
        const data = await response.json();
        return data.datos.accessToken;
    },
    getProvincias: async (token) => {
        const response = await fetch('http://localhost:6666/api/GeoApi/ListaProvincias', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.datos.provincias;
    },
    getMunicipios: async (token, codProv) => {
        const response = await fetch(`http://localhost:6666/api/GeoApi/ListaMunicipios?codProv=${codProv}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.datos.municipios;
    }
};

export default restGeoApi;