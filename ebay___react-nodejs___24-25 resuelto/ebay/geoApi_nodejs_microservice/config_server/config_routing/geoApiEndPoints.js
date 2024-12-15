const express=require('express');
const jsonwebtoken=require('jsonwebtoken');
const geoApiController=require('../controllers/geoApiController');

const routerGeoApi=express.Router();



function verificaToken(req,res,next){
    try {
        let _jwt=req.headers['authorization'].split(' ')[1];
        let _payload=jsonwebtoken.verify(_jwt, process.env.JWT_SECRETKEY,{ issuer: 'http://localhost:6060'});
        if (_payload === '') throw new Error('error al verificar accessToken, o ha expirado o firma invalida no pertenece al localhost:6060');

        console.log('payload accessToken pasado...', _payload);
        next();

    } catch (error) {
        console.log('error al verficar ACCESSTOKEN, tiempo expirado o mala firma, prohibido acceso..', error);
        res.status(200).send( { codigo: 2, mensaje: 'accessToken invalido, vuelve a solicitarlo para poder hacer uso del servicio REST y sus endpoints' })
    }
}


routerGeoApi.post('/GetAccessToken', geoApiController.VerficarCreds);
//routerGeoApi.get('/ListaPaises', verificaToken, geoApiController.ListaPaises);
routerGeoApi.get('/ListaProvincias', verificaToken, geoApiController.ListaProvincias);
routerGeoApi.get('/ListaMunicipios', verificaToken, geoApiController.ListaMunicipios); //<--- se pasa por parametro get: codProv (codigo provincia)


module.exports=routerGeoApi;