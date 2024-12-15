//modulo principal de nuestro proyecto back nodejs
require('dotenv').config(); //<---- lee el fichero .env y crea variables de entorno delicadas o secretas (no visibles)

//objeto js para mandar emails....
const gmailSender=require('./servicios/mailSenders/gmailSender');

//objeto js para generar jwt...
const generadorJWT=require('./servicios/generadorJWT');

//express web server....
const express=require('express');
const cookieParser=require('cookie-parser');
const bodyParser=require('body-parser');
const cors=require('cors');
const bcrypt=require('bcrypt'); //<---------------- paquete muy usado para hashear passwords y comprobar hashes
const jsonwebtoken=require('jsonwebtoken'); //<---- paquete para crear/verificar/decodificar JWT

//cliente de acceso a MongoDB.....
const { MongoClient,BSON }=require('mongodb');
console.log('variables de entorno....', process.env.URL_MONGODB, process.env.DB_MONGODB);
const clienteMongoDB=new MongoClient(process.env.URL_MONGODB);

//el resultado de la ejecucion de la funcion q exporta el modulo express te crea el objeto SERVER
//esta con valores por defecto, hay q configurarlo: puerto a la escucha, funciones midleware del servidor, lanzarlo
const miServidorWeb=express(); 

//configuramos las funciones middleware
//funciones middleware de aplicaciones o de terceros: paquetes instalados con npm install .... q exportan o generan una funcion
//midleware para el servidor de express:  cokie-parser, body-parser, cors
//!     - cookie-parser: exporta una funcion q al ejectuarse extrae de las cabeceras del objeto http-request, la cabecera Cookie
//!                      y la almacena como propiedad en el objeto req de la fucnion middleware, asi:   req.cookies
//!                         para instalarlo:  npm install cookie-parser --save (ver npmjs.org)
miServidorWeb.use( cookieParser() );
//#region ...probando cookie-parser con funcion midleware propia...
// miServidorWeb.use( 
//                     function(req,res,next){
//                         console.log('cookies extraidas por cookie-parser...', req.cookies);
//                         next();                        
//                      }
//                 );
//#endregion

//!     - body-parser: exporta una FUNCION q tiene diferentes metodos de extraccion de datos del http-request BODY en funcion de la cabecera
//!                   Content-Type. Los datos los almacena en req.body(POST) o req.params(GET)
//!                   para extraer json:   bodyParser.json()
//!                   para extraer varialbles estilo formulario x-www-form-urlencoded:   bodyParer.urlenconded( { extended:false } )

//!                         para instalarlo:   npm install body-parser --save (ver npmjs.org)
//console.log('lo exportado por el modulo body-parser en variable bodyParser vale....', bodyParser);
miServidorWeb.use( bodyParser.json() );
miServidorWeb.use( bodyParser.urlencoded({ extended:false } ) );
//#region ...probando body-parser con funcipon midleware propia...
// miServidorWeb.use(
//     function(req,res,next){
//         console.log('datos extraidos del body por body-parser....', req.body);

//         next();
//     }
// );
//#endregion

//!     - cors: exporta una FUNCION que crea una funcion midleware para habilitar a clientes que no pertenezcan al dominio del servidor NODE
//!             consultar los distintos endpoints (p.e, el cliente react esta en dominio distinto del servidor nodejs)
//!                 cliente-react ---------------------->    servidor-nodejs
//!                 http://localhost:3000     options-request  http://localhost:3003
//!                                 <--------------------       cors-enabled
//!                             -------HTTP-REQUEST-POSTDATA--->
//!              para instalarlo: npm install cors --save
miServidorWeb.use( cors() );

//middleware de enrutamiento:  nombre_objeto_express.METODO_HTTP('url_endpoint', function(req,res,next){} )
// - cada endpoint o ruta de acceso de los clientes al servidor tiene q venir definida por una funcion middleware
//    especificando metodo http por el que se accede (get,post,put,...) y la ruta:
miServidorWeb.post('/api/zonaCliente/Registro', async function(req,res,next){
    try {
        console.log('datos del REGISTRO del cliente de react ....', req.body);
        await clienteMongoDB.connect();
        let _sesionTransaccion=clienteMongoDB.startSession(); //<--- inicio transacion mongodb
        
        try {
            await _sesionTransaccion.withTransaction(
                async () => {
                    let _resultadoInsert=await clienteMongoDB.db(process.env.DB_MONGODB)
                                                            .collection('cuentas')
                                                            .insertOne(
                                                                {
                                                                    ...req.body,
                                                                    password: bcrypt.hashSync(req.body.password, 10),
                                                                    activada: false 
                                                                }
                                                            );    
                    console.log('el valor del INSERT en coleccion cuentas vale...', _resultadoInsert);
                    if (_resultadoInsert.insertedId) {
                        //hacer insert en coleccion "clientes" de objeto nuevo con prop idCuenta el _id de la cuenta insertada
                        //USAR TRANSACCIONES!!!! para evitar inconsistencia
                        //let _idcuentaExtraido=await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').findOne({ email: req.body.email },{ _id:1 });
                        //console.log('_id del documento cuentas recien insertado....', _idcuentaExtraido);
            
                        let _resInsertClientes=await clienteMongoDB.db(process.env.DB_MONGODB)
                                                                   .collection('clientes')
                                                                   .insertOne(
                                                                    {
                                                                        listaProductosVender: [],
                                                                        listaProductosComprados: [],
                                                                        listaPujas: [],
                                                                        listaSubastas: [],
                                                                        direcciones: [],
                                                                        metodosPago:[],
                                                                        idCuenta: _resultadoInsert.insertedId// _idcuentaExtraido._id
                                                                    }
                                                                   );
                        //mandar email de activacion de cuenta o SMS con codigo de activacion
                        //lo suyo seria mandar el logo de ebay en el cuerpo del email en  atributo src codificado en base64...
                        //creamos un JWT de un solo USO (tiempo de expiracion muy muy corto, lo justo para q de tiempo al usuario a ACTIVAR CUENTA leyendo el mail)
                        let _jwt=jsonwebtoken.sign(
                            { email: req.body.email, _id: _resInsertClientes.insertedId },
                            process.env.JWT_SECRETKEY,
                            { expiresIn: '5m', issuer:'http://localhost:3003'}
                        );
                        let _url=`http://localhost:3003/api/zonaCliente/ActivarCuenta?token=${_jwt}`;
                        await gmailSender.EnviarEmail(
                            {
                                to: req.body.email,
                                subject: 'activa tu cuenta de EBAY!!!',
                                cuerpoMensaje:`
                                    <div> <img src='' alt='logo ebay'/> </div>
                                    <div>
                                        <p>Activa tu cuenta de ebay si quieres empezar a COMPRAR o VENDER productos</p>
                                        <p>Tambien pudes hacer seguimiento de los productos que te interesan (se te mandaran correos de su evolucion)</p>
                                    </div>
                                    <div>
                                        <p>Pulsa <a href='${_url}'>AQUI</a> para activar la cuenta, o copia y pega la siguiente direccion en el navegador:</p>
                                        <p>${_url}</p>
                                    </div>
                                `
                            }
                        )
                        res.status(200).send({ codigo:0, mensaje: 'cuenta registrada, FALTA ACTIVACION CUENTA....'});
                    } else {
                        throw new Error('error en insert de datos en coleccion cuentas de Mongodb');
                    }
                }
            );
                
        } catch (error) {
            console.log('error en transaccion contra mongodb al insertar cliente y cuenta...', error);
            throw new Error(error.message);
        } finally {
            _sesionTransaccion.endSession();
        }      
    } catch (error) {
        console.log('error en operacion de registro de cuenta....', error);
        res.status(200).send( { codigo: 1, mensaje: 'fallo en registro, intentalo mas tarde' })        
    } finally {
        await clienteMongoDB.close(); //<------------- cierre conexion
      }

});

miServidorWeb.get('/api/zonaCliente/ComprobarEmail', function(req,res,next){
    console.log('datos pasados en la URL del cliente de react...', req.query);
    res.status(200).send({ codigo:0, mensaje: 'HAS ALCANZADO BIEN EL ENDPOINT DEL COMPROBAR EMAIL CLLIENTE...'});
});

miServidorWeb.post('/api/zonaCliente/LoginCliente', async function(req,res,next){
    try {
        console.log('el cliente de react ha hecho esta solicitud http-request....', req.body); //<--- si no hay mas middlewares previos, req.body es undefined
        const { email, password }=req.body;

        //1º paso) comprobar si en mongodb existe en coleccion "cuentas" un doc. con ese email y password
        await clienteMongoDB.connect();
        let _datosCuenta=await clienteMongoDB.db(process.env.DB_MONGODB)
                                              .collection('cuentas')
                                              .findOne( { email });
        console.log('datos recuperados de coleccion cuentas...', _datosCuenta);
        if(! _datosCuenta) throw new Error('no existe esa cuenta con ese Email');

        //2º paso) comprobamos si cuenta esta activada (confirmada)
        if( ! _datosCuenta.activada ) throw new Error('cuenta no ACTIVADA...mandar de nuevo enlace invitacion para activarla');

        //3º paso) comprobar si password esta ok....
        if (! bcrypt.compareSync(password, _datosCuenta.password) ) throw new Error('password invalida....');


        //4º paso) si existe generar JWT de acceso:  accessJWT en payload metemos _id del cliente y email/tlfno
        let _jwts=generadorJWT.generarJWT(
            {
                idCliente: _datosCuenta._id,
                email: _datosCuenta.email,
                telefono: _datosCuenta.telefono,
                nombreCompleto: _datosCuenta.apellidos + ', ' + _datosCuenta.nombre 
             },
            '15m'
        );
       
        //5º paso) recuperar de la coleccion "clientes" los datos del mismo (lista productos a vender, lista productos comprados, lista direcciones, metodos de pago,...)
        let _datosClienteCursor=await clienteMongoDB.db(process.env.DB_MONGODB)
                                              .collection('clientes')
                                              //.findOne( { idCuenta: _datosCuenta._id }); <---- asi seria sin expandir idCuenta y tendria el ObjectId del documento cuenta asoicado
                                              .aggregate(
                                                [

                                                    {
                                                      $lookup: {
                                                        from: "cuentas",
                                                        localField: "idCuenta",
                                                        foreignField: "_id",
                                                        as: "cuenta"
                                                      }
                                                    },
                                                    {
                                                      $unwind: "$cuenta"
                                                    },
                                                    {
                                                        $match: { 
                                                          "cuenta.email": email 
                                                        }
                                                    },
                                                    
                                                    {
                                                      $project: {
                                                        _id: 1,
                                                        listaProductosVender: 1,
                                                        listaProductosComprados: 1,
                                                        listaPujas: 1,
                                                        listaSubastas: 1,
                                                        direcciones: 1,
                                                        fechaUnionEbay: 1,
                                                        listaProductosVendidos: 1,
                                                        numeroIVA: 1,
                                                        tipo: 1,
                                                        valoracionesHechas: 1,
                                                        valoracionesRecibidas: 1,
                                                        "cuenta.nombre": 1,
                                                        "cuenta.apellidos": 1,
                                                        "cuenta.email": 1,
                                                        "cuenta.telefono": 1,
                                                        "cuenta.activada": 1,
                                                        "cuenta.imagenAvatar": 1,
                                                        "cuenta.nick": 1
                                                      }
                                                    }
                                                  ]                                                        
                                            );
        let _datosClientes=await _datosClienteCursor.toArray(); //<--- un cursor siempre devuelve un array de documentos o filas, aunque solo tenga uno

        console.log("datos recuperados de coleccion clientes...", _datosClientes[0]);
        
        res.status(200).send( 
                    { 
                        codigo: 0,
                        mensaje: 'inicio de sesion correcto, JWT creado',
                        datos:{
                            accessToken: _jwts[0],
                            refreshToken: _jwts[1],
                            cliente: _datosClientes[0] 
                        }
                    }
        );
            
    } catch (error) {
        console.log('error en login....', error);
        res.status(200).send( {codigoOperacion: 2, mensajeOperacion: error.message } );
    }

});

miServidorWeb.get('/api/zonaTienda/DevolverCategorias', async function(req,res,next){
    try {
        //recuperamos categorias en funcion del parametro en la query: pathCategoria...si vale principales creo un filtro para recup.cat.ppales
        //                                                                            si vale cualquier otra cosa creo un filtro para recup.subcats
        let _filtro=req.query.pathCategoria==='principales' ? { pathCategoria: { $regex: /^[0-9]+$/ } } 
                                                               : 
                                                               { pathCategoria: { $regex: new RegExp("^" + req.query.pathCategoria+"-[0-9]+$") } };
        await clienteMongoDB.connect();
        //OJO!!!! .find() devuelve un CURSOR DE DOCUMENTOS!!!! objeto FindCursor, para obtener el contenido de ese cursos o bien con bucle para ir uno a uno
        //o con metodo .toArray() para recuperar todos los doc.del cursor de golpe
        //https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/read-operations/cursor/
        let _catsCursor=await clienteMongoDB.db(process.env.DB_MONGODB)
                                        .collection('categorias')
                                        .find( _filtro );
        
        let _cats=await _catsCursor.toArray();

        //console.log('categorias recuperadas....', _cats);
        res.status(200).send( { codigo:0, mensaje:'categorias recuperadas OK!!!', datos:_cats } );


    } catch (error) {
        console.log('error al intentar recuperar categorias.....', error.message);
        res.status(200).send( { codigo:5, mensaje:`error al intentar recuperar categorias: ${error.message}`, datos:[] } );
    }
});

miServidorWeb.get('/api/zonaTienda/RecuperarProductosFromCat', async function(req,res,next){
    try {
        await clienteMongoDB.connect();
        let _prodsCursor=clienteMongoDB.db(process.env.DB_MONGODB)
                                        .collection('productos')
                                        .find({categoría: req.query.catId});

        let _prods=await _prodsCursor.toArray();

        console.log('numero de productos recuperados...', _prods.length);
        res.status(200).send( { codigo:0, mensaje:'productos recuperados OK!!!', datos:_prods } );

    } catch (error) {
        console.log('error al intentar recuperar productos.....', error.message);
        res.status(200).send( { codigo:6, mensaje:`error al intentar recuperar productos: ${error.message}`, datos:[] } );            
    }
} );

miServidorWeb.get('/api/zonaTienda/RecuperarProducto',async function(req,res,next){
    try {
        await clienteMongoDB.connect();
        const _idprod=new BSON.ObjectId(req.query.idProd);
        let _producto=await clienteMongoDB.db(process.env.DB_MONGODB)
                                        .collection('productos')
                                        .findOne({_id: _idprod });

        if(! _producto) throw new Error(`no existe ningun producto con este _id: ${req.query.idProd}`);
        res.status(200).send( { codigo:0, mensaje:'productos recuperados OK!!!', datos: _producto } );

    } catch (error) {
        console.log('error al intentar recuperar productos.....', error.message);
        res.status(200).send( { codigo:7, mensaje:`error al intentar recuperar producto: ${error.message}`, datos: {} } );            
    }        
});

miServidorWeb.post('/api/zonaTienda/ComprarProductos', async function(req,res,next){
    try {
            /*
                en el req.body react me debe mandar:  { pedido:{ items,subtotal,gastosenvio,total, metodoPago },  }
            */
    } catch (error) {
        
    }
});

//levanto el servidor web...
miServidorWeb.listen(3003,()=> console.log('...servidor WEB EXPRESS escuchando peticiones en puerto 3003.....'));
