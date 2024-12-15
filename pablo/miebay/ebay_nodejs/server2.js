/*
    modulo principal configuracion de nodejs con express y mongo....
    este modulo va a importar una funcion de configuracion definida en otro modulo en la cual se configuran la
    pipeline (middleware de express)

    modulo ppal
    server2.js                          funcion exportada 
       ||                               en modulo: config_pipeline.js
    express                                  ||
    configPipeLine(servidorWeb) <------- function(){ ...  } <-------- se configuran middlewares del servidor express
    es una funcion(le passas                                      salvo los de enrutamiento q tb se sacan(fuera) en
    el servidor q te reaste en exoress)                           modulos independientes
                                                                            |
                                                    ---------------------------------------------------------
                                                    |                                                       |
                                            modulo endpointsCliente.js                          modulo endpointsTienda.js
                                            exporta objeto Router de express                    exporta Router de express
                                            donde se definen las rutas zonaCliente              definen rutas de zonaTienda
                                            con las funciones a ejecutar                       con las funciones a ejecutar
                                            en objeto JS dentro de controllers                  en objeto JS dentro de controllers           
*/
require('dotenv').config(); //<---- lee el fichero .env y crea variables de entorno delicadas o secretas (no visibles)

const express=require('express');
const configPipeLine=require('./config_server/config_pipeline');//<-----importo la funcion y la meto en la variable 
//el resultado de la ejecucion de la funcion q exporta el modulo express te crea el objeto SERVER
//esta con valores por defecto, hay q configurarlo: puerto a la escucha, funciones midleware del servidor, lanzarlo
const miServidorWeb=express(); 

//configuramos pipeline de express....
configPipeLine(miServidorWeb);

//levanto el servidor web...
miServidorWeb.listen(3003,()=> console.log('...servidor WEB EXPRESS escuchando peticiones en puerto 3003.....'));

                                            