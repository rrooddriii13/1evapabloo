//modulo de codigo de nodejs q exporta un objeto ROUTER de express para definir endpoints y funciones middleware q 
//se ejecutan cuando se alcanzan dichos endpoints o rutas de zonaCliente
//para crear este objeto Router se usa el metodo .Router() de express
const express=require('express');
const routerCliente=express.Router();
const clienteEndPointsController = require('../controllers/clienteEndPointsController');

//configuro endpoints en objeto Router:
routerCliente.post('/LoginCliente', clienteEndPointsController.LoginCliente);
routerCliente.post('/Registro', clienteEndPointsController.Registro);
routerCliente.get('/ComprobarEmail', clienteEndPointsController.ComprobarEmail);

//...del exam...
routerCliente.post('/ActualizarDirecciones', clienteEndPointsController.ActualizarDirecciones)


module.exports=routerCliente;