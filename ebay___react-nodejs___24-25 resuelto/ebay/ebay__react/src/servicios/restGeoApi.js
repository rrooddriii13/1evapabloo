async function _getAccessToken(){
    try {
        //CLIENT_ID='AnonymousGeoApi'   CLIENT_SECRET='tryHarder'
        //conversion en base64 de combinacion: CLIENT_ID:CLIENT_SECRET sacado en consola asi: node -e "console.log(Buffer.from('AnonymousGeoApi:tryHarder').toString('base64'))"
        //o en javascript asi:  btoa(encodeURI('AnonymousGeoApi:tryHarder'))
        let _accessToken='QW5vbnltb3VzR2VvQXBpOnRyeUhhcmRlcg=='; 
        let _petToken=await fetch('http://localhost:6060/api/GeoApi/GetAccessToken',
                             {
                                method: 'POST',
                                headers: { 
                                    'Authorization': `Basic ${_accessToken}`,
                                    'Content-Type': 'application/json'
                                 },
                                body: JSON.stringify({ "solicitud":"accessToken" })
                            } 
                        );
          let _respToken=await _petToken.json();
          console.log('accesstoken desde geoapi...', _respToken);
          return _respToken.datos.accessToken;
           
    } catch (error) {
        console.log('error al intentar recuperar accessToken serivicio GEOAPI...', error);
        return null;
    }
}

const restGeoApi={
    GetProvincias: async function(){
        try {
            let _accessToken=await _getAccessToken();
            let _petRestProvs=await fetch(
                                            'http://localhost:6060/api/geoApi/ListaProvincias',
                                            { 
                                                method: 'GET', 
                                                headers: { 
                                                    'Authorization': `Bearer ${_accessToken}`
                                                } 
                                            } 
                                        );
            let _resProvs=await _petRestProvs.json();
            
            console.log('provincias recuperadas desde nodejs cuando se invoca a microservicio de geoapi...', _resProvs);
            return _resProvs.datos
                            .provincias
                            .sort( 
                                (a,b)=> { 
                                            if (a.PRO < b.PRO) return -1;
                                            if (a.PRO > b.PRO) return  1;
                                            return 0;
                                        }
            );

        } catch (error) {
            console.log('error al obtener provs del servicio de geoapi...',error);
            return [];
        }
    },
    GetMunicipios: async function(codprov){
        try {
            let _accessToken=await _getAccessToken();
            let _petRestMunis=await fetch(
                                            `http://localhost:6060/api/geoApi/ListaMunicipios?codProv=${codprov}`,
                                            { 
                                                method: 'GET', 
                                                headers: { 
                                                    'Authorization': `Bearer ${_accessToken}`
                                                } 
                                            }                                             
                                        );
            let _resMunis=await _petRestMunis.json();
            
            console.log('municipios recuperadas desde nodejs cuando se invoca a microservicio de geoapi...', _resMunis);
            return _resMunis.datos.municipios;
            
        } catch (error) {
            console.log('error al obtener municipios del servicio de geoapi...',error);
            return [];
        }
    }
}

export default restGeoApi;