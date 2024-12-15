//modulo de codigo de nodejs q exporta un obj ROUTE de express para definir endpoints y funciones middleware q se 
//ejecutan cunadi se alcanzan diichos endpoints o rutas
//para crear reste objeto Router se usa el metodo .Router() de express

const express = require('express');
const routerCliente = express.Router();

const clienteEndPointsController = require('../controllers/clienteEndPointsController');

//antes de wexportar configuro endpoint en objeto riuter 
//configuro endpoints en objeto Router:
routerCliente.post('/LoginCliente', clienteEndPointsController.LoginCliente);
routerCliente.post('/Registro', clienteEndPointsController.Registro);
routerCliente.get('/ComprobarEmail', clienteEndPointsController.ComprobarEmail);
routerCliente.get('/ActivarCuenta', clienteEndPointsController.ActivarCuenta);
routerCliente.get('/ConfirmacionActivacion', clienteEndPointsController.ConfirmacionActivacion);

module.exports= routerCliente;