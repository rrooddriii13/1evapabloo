require('dotenv').config();
const express=require('express');

const configPipeline=require('./config_server/config_pipeline_express');
const serverMicroService=express();

configPipeline(serverMicroService);
serverMicroService.listen(6666, ()=> console.log('servidor donde corre microservicio GEOAPI listo y escuchando peticiones en puerto 6666....'));