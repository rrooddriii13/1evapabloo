
const cookieParser=require('cookie-parser');
const bodyParser=require('body-parser');
const cors=require('cors');
const cors = require('cors');

const routingGeoApi=require('./config_routing/geoApiEndPoints');

module.exports=function(serverExpress){
        serverExpress.use( cookieParser() );

        serverExpress.use( bodyParser.json({limit: '50mb'}) ); //<--- si no pones un limite grande, y se adjuntan en el http-body payloads muy pesados te salta excepcion: PayloadTooLargeError: request entity too large...pq por defecto tiene limite de menos de 1mg, asi lo amplias!!! https://betterstack.com/community/questions/fix-request-entity-too-large/
        serverExpress.use( bodyParser.urlencoded({ limit:'50mb',extended:false } ) );        

        serverExpress.use( cors() );

        serverExpress.use('/api/GeoApi', routingGeoApi);

}