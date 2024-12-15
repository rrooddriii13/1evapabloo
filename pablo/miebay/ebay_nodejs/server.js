//modulo principal de nuestro proyexto back nodejs este  es el modulo donde tu lannzas al servidor y defineslas fun middle y aqui
//va a estar ala escugcA DE TODAS LAS PETICIONES DE LOS CLIENETS  ES como un servlet en java 
/*
console.log('el parametro exports de la funcion inmediata del modulo vale...',exports)
console.log('el parametro require de la funcion inmediata del modulo vale...',require)
console.log('el parametro module de la funcion inmediata del modulo vale...',module)
console.log('el parametro __filename de la funcion inmediata del modulo vale...',__filename)
console.log('el parametro __dirname de la funcion inmediata del modulo vale...',__dirname)
/estas variables tienen valor x la funcion inmediata q node crea en cada modulo  sin q tu la veas*/
//para ejecutarlo node server.js(y nombre modulo)
require('dotenv').config()//<---- lee el fichero .env y crea variables de entorno delicadas o secretas (no visibles)

//objeto js para mandar email
const gmailSender =require('./servicios/mailSenders/gmailSender');
//objeto js para generar jwt...
const generadorJWT=require('./servicios/generadorJWT');

const express = require('express');
const cookieParser = require('cookie-parser');//meter en cookieParser lo q exporta el modulo de lo q instalados
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');//<-- par ahaseahr password y comprobar hashes
const jsonwebtoken = require('jsonwebtoken');//<---- paquete para crear/verificar/decodificar JWT

//--------------------------------
//cliente de axcceso a MongoDB
const { MongoClient } =require('mongodb');
console.log('variables de entorno....', process.env.URL_MONGODB, process.env.DB_MONGODB);
const clienteMongoDB = new MongoClient(process.env.URL_MONGODB)

//el resultado de la ejecucion de la funcion q exporta el modulo expreess te crea el objeto SERVER vacio
//esta con valores por defecto, hay q configurarlo: puerto ala escucha,funciones midleware del servidor,lanzarlo
const miServidorWeb = express();

//configuramos las funciones middleware -> func middl invokar siguinete modulo o generar rpuesta con el parametro res
//funciones middleware de aplicaciones o de teceros: paquetes instalados con npm install ,al instalar el paquete el modulo q te crea
//te exporta una funcion q te generan una funcion middleware para el servidor expres : cookie-parser, body-parser ,cors
//!?  -cookie-parse: exporta una funcion q al ejecutarse extrae de las cabeceras del obj http-request,la cabecera Cookie y la
//!    almacena como propiedad en el obj req de la fun middleware(x si quieres usar la cookie en el servidor) ,asi: req.cookies
//! cookie->estado de sesion: es la info q guarda los servidores web de los clientes cuando han estado accediendo a dicho servidor con .> cookies o token de sesion
//!   para instalarlo : npm install body-parser --save (ver npmjs.org)
//console.log('la variable que exporta el modulo cookie-parser vale ....',cookieParser);///ver q eporta una fun
//al ejecutar esta funcion me va a crear req.cookies
miServidorWeb.use(cookieParser());// Esto permite que las cookies se procesen
//#region ...pribando cookie-pasrser con funcion mideware propiia 
/*miServidorWeb.use(function(req,res,next){
    console.log('cookies extraidas por cookie-parser ....',req.cookies);
    next();//si no pongo na se pararia el servidor tengo q mandar una respuesta al cliente o invokar siguiente func middle
    //req.statusCode(200).send('hola,todo bien')
})*/
//#endregion...

//?    -body-parser: exporta una funcion q tienen diferentes metodos de extraccion de datos del http-reqquest BODY en funcion de la 
//!    cabecera Content-Type segun el tipo intenta extraer el tipo de datos.los datos los almacenan en req.body(POST) o req.params(GET) 
//!    para extraer json: bodyParser.json()
//!    para extraer variables estilo formulario x-www-form-urlencoded: bodyParser.urlencoded({extended:false})
//!    para instalarlo : npm install body-parser --save (ver npmjs.org)
//console.log('lo exportado por el modulo body-parser en variable bodyParser vale ....',bodyParser)
miServidorWeb.use(bodyParser.json())
miServidorWeb.use(bodyParser.urlencoded({extended:false}))
//#region probando body-parserr con fun middle propi  para mostrar los datos recibidos en el cuerpo de la solicitud)
// miServidorWeb.use(function(req,res,next){// Middleware para mostrar los datos recibidos en el cuerpo de la solicitud
//     console.log('datos extraidos del body por body-parser...',req.body);
//     next();    
// });
//#endregion 

//?   -cors: exporta una Funcion que crea una funcion midleware parea habilitar a clientes q no pertenezcan al dominio del servidor
//!    NODE consultar los distintos endpoints(p.e,el cliente react esta en el dominio distinto del servidor nodejs)
//!    cliente-react-> pretende enviar datos a un servidor q no esta en su midms red ----> servidor-node.js
//!    http://localhost:3000   --> consulta tipo option (options-request)               http://localhost:3003
//!                               <-----------------------------                        cors-enabled -> si el servidor dice q si tiene habilitado cors le manda a la solicitud el okey entonces ya ppuedes mandar los datoa
//!                        -------HTTP-REQUEST-POSTDATA(post,get,)--->    
//!  para INSTALARLO: npm install cors --save
//si tuviera endpoint privados nos interesa usar cors(para q clientes de fuera no puedan acceder) 

//1 lo impoetas
miServidorWeb.use(cors());
//miServidorWeb.use(cors({ origin:'http://localhost:3000' }))

//cada ruta(endpoint) de los cuales el cliente quiere tener acceso a un servidor eso representa una fun middleware

//middleware de enrutamiento : nombre _objeto_express.METODO_HTTP('url_endpoint',function(req,res,next){})
//- cada endpoint o ruta de acceso de los clientes al servidor tiene q venir definida por una funcion middleware
// siempre especificando metodo http por el q se accede ( get,post,put...) y la ruta;

// Definimos la ruta del endpoint para el registro de clientes
/*/ mi formma q me va 
miServidorWeb.post('/api/zonaCliente/Registro',async function(req,res,next){//no hace falta poner hhtp:localdpost :3009 xq estoy enell servidsor
    try {
        console.log('Datos del registro del ciente de react ...', req.body);//xq body parser los extrae de la solicitd del cliente del reac 
        //usandi el cliente nos vamos a conmectar par ainsertarlos 
        
        // Conexión a MongoDB para realizar operaciones de inserción usando ls url q has definifo
        await clienteMongoDB.connect();// Abre una conexión persistente con MongoDB para realizar consultas y modificaciones en la base de datos

        //#region USAR TRANSACCIONES!!!! para evitar inconsistencia usar xq si se cae no de fallo  si cae la bbd ej en el 2 insert haria un rollback y te dice q lo intntes de nuevo mas tarde
        //imaginate q la BBDD se cae y intentas hacer el 2 insert y no deja entonces hay q hacer una TRANSACCION->
        //hasta q no se vuelquen(ionserten) los dos insert no das por bueno la operacion para evitar inconsistencia
        //tarsnsaccion -> ejecucion de varios comando ala vez y hasta q no haces comitt no se vuelcan(guardan) pos
        //aqui igual entonces si falla una haces rollback y es como si no hubieras hecho mimguna 
        //#endregion

        let _sesionTransaccion  = await clienteMongoDB.startSession();// <---------Inicio la transaccion 
         _sesionTransaccion.withTransaction(
            async () => {
                //aqui dentro todos los comandos  q quiero lanzar en la transaccion 
                let _resultadoInsert = await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').insertOne(
                    {   ...req.body,
                        password: bcrypt.hashSync(req.body.password,10),
                        activada:false
                    });
                console.log('el valor del INSERT en coleccion cuentas vale...', _resultadoInsert);
             
                // Si se inserta correctamente, continúa con la inserción en la colección 'clientes'
                if(_resultadoInsert.insertedId){
                //cuando me registro en el portal meto en cuentas(el registro) pero tambien en clientes xq me estoy dando de alta en ebay pq en el moomento q me doy de alta puedo -> vender productos ,comprar,pujar ,subastar dar de alta diorecciones y metodos de pago

                //hacer una select para coger el id  pero si se cae  no se inserta entonces meterlo en la transaccion y hasta q no haces commit no lo  mandas ala bdd entonces meterlo abajo xq si haty fallo haxce rollback
                //let _idcuentaExtraido=await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').findOne({ email: req.body.email },{ _id:1 });
                //console.log('_id del documento cuentas recien insertado....', _idcuentaExtraido);
                //no hace falta la query pabuscar el id xq cuabndo haces el insert te lo devuelve aqui 

                //hacer insert en coleccion "clientes" de objeto nuevo con prop idCuenta el _id de la cuenta insertada
                let _resultadoInsertClientes = await clienteMongoDB.db(process.env.DB_MONGODB).collection('clientes').insertOne({
                listaProductosVender: [],
                listaProductosComprados: [],
                listaPujas: [],
                listaSubastas: [],
                direcciones: [],//cuando compras productos te lo mandan ahi
                metodosPago:[],
                idCuenta: _resultadoInsert.insertedId //_idcuentaExtraido._id
                })//meter el id del registro q acabo de meter en idCuenta

                //mandar email de activacion de cuenta o sms con codigo de activaciom 
                res.status(200).send({ codigo:0, mensaje: 'cuenta registrada, FALTA ACTIVACION CUENTA....'});            

                }else{
                //como mando un eroor la ejecucion se interrumpe entonces meterlo en un trycacth siempre cuando operas en una BBDD usar siemopre trycacth
                    throw new Error('error  en insert de datos en coleccion de cuentas Mongodb')
                }
            }
        );
    } catch (error) {
        console.log('error en operacion de registro de cuenta ....', error);
        //siempre mando una respuesta al cliente 
        res.status(200).send({codigo:1, mensaje: 'fallo en registro, intentalo mas tarde'});
        //el status 200 xq si no es un status ok no te muestra la pag te muestra un mensaje de errror  como el 404 te muestra un mensaje de alerta y un error y no quieres asustar al usuario y luego muestraas tu el error abajo ern un div ....  si el codigo 0 es q fue bn mas de 0 q fue mak  cuando haga login codigo 2  una esoecue de tabka y apuntarklos para no repetir       
    }finally{
        //una trasnaccion x cliente o por conexion 
        await  _sesionTransaccion.endSession();//<----------- cierre transaccion
        await clienteMongoDB.close() //<------------- cierre conexion
    }
})*/
miServidorWeb.post('/api/zonaCliente/Registro',async function(req,res,next){//no hace falta poner hhtp:localdpost :3009 xq estoy enell servidsor
    try {
        console.log('Datos del registro del ciente de react ...', req.body);//xq body parser los extrae de la solicitd del cliente del reac 
        await clienteMongoDB.connect();// Conexión a MongoDB para realizar operaciones de inserción usando ls url q has definifo
        //#region USAR TRANSACCIONES!!!! para evitar inconsistencia usar xq si se cae no de fallo  si cae la bbd ej en el 2 insert haria un rollback y te dice q lo intntes de nuevo mas tarde
        //imaginate q la BBDD se cae y intentas hacer el 2 insert y no deja entonces hay q hacer una TRANSACCION->
        //hasta q no se vuelquen(ionserten) los dos insert no das por bueno la operacion para evitar inconsistencia
        //tarsnsaccion -> ejecucion de varios comando ala vez y hasta q no haces comitt no se vuelcan(guardan) pos
        //aqui igual entonces si falla una haces rollback y es como si no hubieras hecho mimguna 
        //#endregion
        let _sesionTransaccion = clienteMongoDB.startSession();// <---------Inicio la transaccion 
        try {
            await _sesionTransaccion.withTransaction( //await xq sino seguiria cprriendo el codigo
                async () => {
                    //aqui dentro todos los comandos  q quiero lanzar en la transaccion 
                    let _resultadoInsert = await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').insertOne(
                        {   ...req.body,
                            password: bcrypt.hashSync(req.body.password,10),
                            activada:false
                        });
                    console.log('el valor del INSERT en coleccion cuentas vale...', _resultadoInsert);
                 
                    // Si se inserta correctamente, continúa con la inserción en la colección 'clientes'
                    if(_resultadoInsert.insertedId){
                    //cuando me registro en el portal meto en cuentas(el registro) pero tambien en clientes xq me estoy dando de alta en ebay pq en el moomento q me doy de alta puedo -> vender productos ,comprar,pujar ,subastar dar de alta diorecciones y metodos de pago
    
                    //hacer una select para coger el id  pero si se cae  no se inserta entonces meterlo en la transaccion y hasta q no haces commit no lo  mandas ala bdd entonces meterlo abajo xq si haty fallo haxce rollback
                    //let _idcuentaExtraido=await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').findOne({ email: req.body.email },{ _id:1 });
                    //console.log('_id del documento cuentas recien insertado....', _idcuentaExtraido);
                    //no hace falta la query pabuscar el id xq cuabndo haces el insert te lo devuelve aqui 
    
                    //hacer insert en coleccion "clientes" de objeto nuevo con prop idCuenta el _id de la cuenta insertada
                    let _resultadoInsertClientes = await clienteMongoDB.db(process.env.DB_MONGODB).collection('clientes').insertOne(
                        {
                            listaProductosVender: [],
                            listaProductosComprados: [],
                            listaPujas: [],
                            listaSubastas: [],
                            direcciones: [],//cuando compras productos te lo mandan ahi
                            metodosPago:[],
                            idCuenta: _resultadoInsert.insertedId //_idcuentaExtraido._id//meter el id del registro q acabo de meter en idCuenta
                        });            

                    
                    //creamos un JWT de un solo USO (tiempo de expiracion muy muy corto, lo justo para q de tiempo al usuario a ACTIVAR CUENTA leyendo el mail)
                    let _jwt=jsonwebtoken.sign(
                        { email: req.body.email, _id: _resultadoInsertClientes.insertedId },
                        process.env.JWT_SECRETKEY,
                        { expiresIn: '5m', issuer:'http://localhost:3003'}
                    );

                    //mandar email de activacion de cuenta o SMS con codigo de activacion 
                    let _url=`http://localhost:3003/api/zonaCliente/ActivarCuenta?token=${_jwt}`;
                    console.log("Email del destinatario:", req.body.email);
                  

                    await gmailSender.EnviarEmail(
                        {
                            to :req.body.email,
                            subject: 'activa tu cuenta de EBAY!!!',
                            cuerpoMensaje:`
                            <div> <img src='' alt='logo ebay'/> </div>
                            <div>
                                <p>Activa tu cuenta de ebay si quieres empezar a COMPRAR o VENDER productos</p>
                                <p>Tambien puedes hacer seguimiento de los productos que te interesan (se te mandaran correos de su evolucion)</p>
                            </div>
                            <div>
                                <p>Pulsa <a href='${_url}'>AQUI</a> para activar la cuenta, o copia y pega la siguiente direccion en el navegador:</p>
                                <p>${_url}</p>
                            </div>
                            `
                        }
                    )

                    res.status(200).send({ codigo:0, mensaje: 'cuenta registrada, FALTA ACTIVACION CUENTA....'});            
    
                    }else{
                    //como mando un eroor la ejecucion se interrumpe entonces meterlo en un trycacth siempre cuando operas en una BBDD usar siemopre trycacth
                        throw new Error('error  en insert de datos en coleccion de cuentas Mongodb')
                    }
                }
            );
        } catch (error) {
            console.log('error en transaccion contra mongodb al insertar cliente y cuenta...', error);
            throw new Error(error.message);
        }finally{
            await _sesionTransaccion.endSession();//<----------- cierre transaccion
        }
        
    } catch (error) {
        console.log('error en operacion de registro de cuenta ....', error);
        //siempre mando una respuesta al cliente 
        res.status(200).send({codigo:1, mensaje: 'fallo en registro, intentalo mas tarde'});
        //el status 200 xq si no es un status ok no te muestra la pag te muestra un mensaje de errror  como el 404 te muestra un mensaje de alerta y un error y no quieres asustar al usuario y luego muestraas tu el error abajo ern un div ....  si el codigo 0 es q fue bn mas de 0 q fue mak  cuando haga login codigo 2  una esoecue de tabka y apuntarklos para no repetir       
    }finally{
        await clienteMongoDB.close() //<------------- cierre conexion
    }
})

//HAY Q DOCUMENTAR LOS COD Q DEVUELVE EL SERV cuando acabe 

//--------- LOGIN 

//*añadir endpoint para Comprobar email Get (en el Login ) cunado cliente llama a esa url se ejecuta la fun asuincriona q le sige 
miServidorWeb.get('/api/zonaCliente/ComprobarEmail',async function(req,res,next){
    try{
        console.log('Datos pasados en la URL del cliente react... ',req.query);    
        const email = req.query.email;
        console.log('Comprobando existencia del email:', email);
        await clienteMongoDB.connect();

        //busco en cuentas el email q pasa 
        const cuenta = await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').findOne({ email: email });
        if (cuenta) {
            res.status(200).json({ codigo: 0, mensaje: 'Email existe en el sistema' });
        } else {
            res.status(200).json({ codigo: 1, mensaje: 'Email no encontrado' });
        }
    }catch (error) {
        console.error('Error en la comprobación del email:', error);
        res.status(500).json({ codigo: 2, mensaje: 'Error en la base de datos al comprobar el email' });
    }finally {
        await clienteMongoDB.close(); // asegura que se cierre la conexión a MongoDB sui hubo un error o no para evitar problemas de conexiones abiertas
    }   
})

miServidorWeb.use(express.json());

//*para comprobar contrasela en el inciio de sesio n
miServidorWeb.post('/api/zonaCliente/ComprobarPassword', async function(req, res, next) {
    try{
        //cojo el email y contra
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ codigo: 5, mensaje: 'Email y contraseña son requeridos' });
        }

        await clienteMongoDB.connect();

        console.log('ssss');
        
        //1º paso) comprobar si en mongodb existe en coleccion "cuentas" un doc. con ese email y password
        const cuenta = await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').findOne({ email: email });

        if (!cuenta) {
            return res.status(404).json({ codigo: 10, mensaje: 'Email no encontrado' });
        }
        
        //3º paso) comprobar si password esta ok....
        const passwordValido = bcrypt.compareSync(password, cuenta.password);
        if (!passwordValido) {
            return res.status(200).json({ codigo: 2, mensaje: 'Contraseña incorrectañsss' });
        }

        // Si las credenciales son válidas, iniciar sesión (podrías generar un token aquí)
        res.status(200).json({ codigo: 0, mensaje: 'Inicio de sesión exitoso' });

    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ codigo: 3, mensaje: 'Error en la base de datos al iniciar sesión' });
    } finally {
        await clienteMongoDB.close();
    }
})

//vouy hacer uno q sustityta alos dos 
miServidorWeb.post('/api/zonaCliente/LoginCliente',async function(req,res,next){
    console.log("Solicitud recibida en la ruta /api/zonaCliente/Login");

    try{
        //console.log('Datos pasados en la URL del cliente react... ',req.body);    
        const { email, password }=req.body;

        //console.log('Comprobando existencia del email:', email);
        await clienteMongoDB.connect();

        const _datosCuenta = await clienteMongoDB.db(process.env.DB_MONGODB).collection('cuentas').findOne({ email: email });
        console.log('datos recuperados de coleccion cuentas...', _datosCuenta);

        //2º paso) comprobamos si cuenta esta activada (confirmada)
         if(_datosCuenta.activada === false){
            return res.status(200).json({ codigo: 2, mensaje: 'cuenta no ACTIVADA...mandar de nuevo enlace invitacion para activarla' });
         }
        //3º paso) comprobar si password esta ok....
        const passwordValido = bcrypt.compareSync(password, _datosCuenta.password);
        
        if (!passwordValido) {
             return res.status(200).json({ codigo: 3, mensaje: 'Contraseña incorrecsta' });
        }
        console.log('datos recuperados de coleccion cuentas...', _datosCuenta);

        if (!_datosCuenta) {
            return res.status(200).json({ codigo: 10, mensaje: 'Email no encontrado' });        
        }

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
        res.status(200).json( {codigoOperacion: 2, mensajeOperacion: error.message } );
    
    }finally {
        await clienteMongoDB.close(); // asegura que se cierre la conexión a MongoDB sui hubo un error o no para evitar problemas de conexiones abiertas
    }   
})

//para activar cuenta 
miServidorWeb.get('/api/zonaCliente/ActivarCuenta', async function(req, res) {
    const token = req.query.token; // Obtener el token de la URL
    try {
        // Verificar el JWT y extraer la información
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRETKEY);
        
        // Extraer el id de la cuenta del payload del token
        //const { _id } = decoded;
        //lo hago con email 
        let _emailActivar = decoded.email;

        // Conectar a la base de datos
        await clienteMongoDB.connect();

        // Actualizar el estado de la cuenta a activada
        const result = await clienteMongoDB.db(process.env.DB_MONGODB)
            .collection('cuentas')
            //.updateOne({ _id: _id }, { $set: { activada: true } });
            .updateOne({ email:_emailActivar }, { $set: { activada: true } });

        if (result.modifiedCount === 1) {
            //res.status(200).send({ mensaje: 'Cuenta activada exitosamente.' });
            //q me rdiriga a la pagina de confirmacion 
            res.redirect('/api/zonaCliente/ConfirmacionActivacion');
        } else {
            res.status(400).send({ mensaje: 'No se pudo activar la cuenta. Puede que ya esté activa.' });
        }
    } catch (error) {
        console.log('Error al activar la cuenta:', error);
        res.status(400).send({ mensaje: 'Token inválido o ha expirado.' });
    } finally {
        await clienteMongoDB.close(); // Cerrar la conexión a la base de datos
    }
});

///una cvexz acriva te lleva aqui
// Ruta para mostrar el mensaje de confirmación
miServidorWeb.get('/api/zonaCliente/ConfirmacionActivacion', function(req, res) {
    res.send(`
        <div style="text-align: center; margin-top: 50px;">
            <h1>¡Cuenta Activada!</h1>
            <p>Tu cuenta ha sido activada exitosamente.</p>
            <p>Puedes iniciar sesión en tu cuenta pulsando el siguiente enlace:</p>
            <p><a href="http://localhost:3000/Cliente/Login">Iniciar sesión</a></p>
        </div>
    `);
});


//devolver categorias 
miServidorWeb.get('/api/zonaTienda/DevolverCategorias', async function(req, res, next) {
    try {
        
        //recuperamos categorias en funcion del parametro en la query 'pathCategoria'...
        //si vale principales creo un filtro para recup.cat.ppales
        // Definimos un filtro de búsqueda en función del parámetro de consulta `pathCategoria`.
        // Este parámetro nos indica si queremos obtener categorías "principales" o subcategorías de una categoría específica.
        let _filtro = req.query.pathCategoria === 'principales'? { pathCategoria: { $regex: /^[0-9]+$/ } }  // Filtro para categorías principales
                                                                : 
                                                                { pathCategoria: { $regex: new RegExp("^" + req.query.pathCategoria + "-[0-9]+$") } };  // Filtro para subcategorías

        //console.log('Filtro aplicado:', _filtro);

        // Explicación del filtro:
        // - Si `pathCategoria` es 'principales', usamos una expresión regular para buscar documentos donde `pathCategoria` contenga solo números.
        // - Si `pathCategoria` tiene otro valor, la expresión regular busca subcategorías cuyo `pathCategoria` empiece con ese valor seguido de un guion y un número.
    
        // Conectamos a la base de datos de MongoDB usando el cliente de MongoDB.
        await clienteMongoDB.connect();
        
        // Realizamos una consulta en la colección 'categorias' con el filtro definido.
        // `find()` devuelve un cursor en lugar de un arreglo de documentos, lo que nos permite manejar los datos de manera más controlada.
                //OJO!!!! .find() devuelve un CURSOR DE DOCUMENTOS!!!! objeto FindCursor, para obtener el contenido de ese cursos o bien con bucle para ir uno a uno
        //o con metodo .toArray() para recuperar todos los doc.del cursor de golpe
        //https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/read-operations/cursor/
        let _catsCursor=await clienteMongoDB.db(process.env.DB_MONGODB)
        .collection('categorias')
        .find( _filtro );
        
        // Convertimos el cursor en un arreglo para obtener todos los documentos de una vez.
        let _cats = await _catsCursor.toArray();
        
 
        console.log('categorias recuperadas....', _cats);

        // Enviamos una respuesta de éxito con las categorías obtenidas.
        res.status(200).send({codigo: 0, mensaje: 'categorías recuperadas OK!!!',datos: _cats  });
        // datos: _cats  _> Datos obtenidos de la consulta

    } catch (error) {
        // En caso de error, mostramos el mensaje en la consola para depuración.
        console.log('error al intentar recuperar categorias:', error.message);
        
        // Enviamos una respuesta de error personalizada con un código de error en el JSON.
        res.status(200).send({codigo: 5, mensaje: `error al intentar recuperar categorias: ${error.message}`,datos: [] });
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

//asi levanmtas el servidor pero antes hay q configuarlo arriba
miServidorWeb.listen(3003,()=> {//1 puerto->para escuchargeneralmente por defecto el 3000 ,2  la funcion q se ejecute cuando los clientes se conectan cuando lanzas el servidor
    console.log('...servidor web express escuchaando periciones en puerto 3003')
});
 

