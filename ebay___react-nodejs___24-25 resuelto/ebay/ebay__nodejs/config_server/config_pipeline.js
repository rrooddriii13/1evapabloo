//modulo de codigo q exporta una funcion q recibe como parametro la instancia del servidor express creado en el modulo
//principal: server2.js, y q sirve para configurar los middleware del mismo

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const cors=require('cors');

const routerCliente = require("./config_routing/endpointsCliente");
const routerTienda = require("./config_routing/endpointsTienda");


module.exports=function(servidorWeb){
    
    servidorWeb.use(cookieParser());

    servidorWeb.use( bodyParser.json());
    servidorWeb.use( bodyParser.urlencoded({ extended:false } ) );

    servidorWeb.use(cors());

    //================= configueracion middleware enrutamiento (endpoints servicio) ===================
    servidorWeb.use('/api/zonaCliente', routerCliente);
    servidorWeb.use('/api/zonaTienda', routerTienda);
}