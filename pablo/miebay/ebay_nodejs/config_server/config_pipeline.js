//esdte modulo de cod va a exportqr la funcion q va exportar 
//modulo de codigo q exporta una funcion q recibe como parametro la instancia del servidor express creado en el modulo
//principal: server2.js, y q sirve para configurar los middleware del mismo


const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const cors=require('cors');


const routerCliente = require("./config_routing/endpointsCliente");
const routerTienda = require("./config_routing/endpointsTienda");

module.exports= function (servidorWeb){
    //1miredlware
    servidorWeb.use(cookieParser());// Esto permite que las cookies se procesen

    servidorWeb.use(bodyParser.json())
    servidorWeb.use(bodyParser.urlencoded({extended:false}))

    servidorWeb.use(cors());

    //================= configueracion middleware enrutamiento (endpoints servicio) ===================


    //en vex de imprimiralos aqui se modularix< a otro fcherpoo 
    //para todas llas q empiezen /api/zonaCliente-> usamos el obj routerCliente 
    servidorWeb.use('/api/zonaCliente', routerCliente);
    servidorWeb.use('/api/zonaTienda', routerTienda);
}