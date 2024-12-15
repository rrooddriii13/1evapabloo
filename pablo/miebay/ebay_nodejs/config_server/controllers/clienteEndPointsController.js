//modulo de nodejs q exporta un objeto JS con metodos q definen las funciones midd

//mecesito bycript necesito el generadoer de token y gamilsebnder
const bcrypt=require('bcrypt');
const generadorJWT=require('../../servicios/generadorJWT');
const gmailSender=require('../../servicios/mailSenders/gmailSender');
const jsonwebtoken = require('jsonwebtoken');//<---- paquete para crear/verificar/decodificar JWT

//immprota  1 monfop
//cliente de axcceso a MongoDB
const { MongoClient, BSON } =require('mongodb');
console.log('variables de entorno....', process.env.URL_MONGODB, process.env.DB_MONGODB);
const clienteMongoDB = new MongoClient(process.env.URL_MONGODB)


module.exports={

    LoginCliente:async function(req,res,next){
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
    },
    Registro: async function(req,res,next){//no hace falta poner hhtp:localdpost :3009 xq estoy enell servidsor
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
    },
    ComprobarEmail:async function(req,res,next){
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
    },
    ActivarCuenta: async function(req, res) {
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
    },

    ConfirmacionActivacion: function(req, res) {
        res.send(`
            <div style="text-align: center; margin-top: 50px;">
                <h1>¡Cuenta Activada!</h1>
                <p>Tu cuenta ha sido activada exitosamente.</p>
                <p>Puedes iniciar sesión en tu cuenta pulsando el siguiente enlace:</p>
                <p><a href="http://localhost:3000/Cliente/Login">Iniciar sesión</a></p>
            </div>
        `);
    }
    



}