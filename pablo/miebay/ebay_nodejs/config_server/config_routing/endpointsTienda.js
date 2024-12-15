//modulo de codigo de nodejs q exporta un objeto ROUTER de express para definir endpoints y funciones middleware q 
//se ejecutan cuando se alcanzan dichos endpoints o rutas de zonaTienda
//para crear este objeto Router se usa el metodo .Router() de express
const express=require('express');
const routerTienda=express.Router();

const tiendaEndPointsController=require('../controllers/tiendaEndPointsController');

//configuro endpoints en objeto Router:
routerTienda.get('/DevolverCategorias', tiendaEndPointsController.DevolverCategorias);
routerTienda.get('/RecuperarProductosFromCat', tiendaEndPointsController.RecuperarProductosFromCat);
routerTienda.get('/RecuperarProducto', tiendaEndPointsController.RecuperarProducto);
routerTienda.post('/ComprarProductos', tiendaEndPointsController.ComprarProductos);
//routerTienda.get('/PayPalCallback', tiendaEndPointsController.PayPalCallback);


module.exports=routerTienda;
