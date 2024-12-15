//modulo de nodejs q exporta un objeto JS con metodos q definen las funciones middleware para los endpoints de acceso

const bcrypt=require('bcrypt');
const generadorJWT=require('../../servicios/generadorJWT');
const gmailSender=require('../../servicios/mailSenders/gmailSender')

//cliente de acceso a MongoDB.....
const { MongoClient,BSON }=require('mongodb');
console.log('variables de entorno....', process.env.URL_MONGODB, process.env.DB_MONGODB);
const clienteMongoDB=new MongoClient(process.env.URL_MONGODB);

module.exports={
    LoginCliente: async function(req,res,next){
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
    
    },
    Registro: async function(req,res,next){
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
    
    },
    ComprobarEmail: function(req,res,next){
        console.log('datos pasados en la URL del cliente de react...', req.query);
        res.status(200).send({ codigo:0, mensaje: 'HAS ALCANZADO BIEN EL ENDPOINT DEL COMPROBAR EMAIL CLLIENTE...'});
    },
    ActualizarDirecciones: async function(req, res, next) {
        try {
            const { direcciones } = req.body;
            const clienteId = req.cliente._id; // Suponiendo que el cliente está autenticado 

            await clienteMongoDB.db(process.env.DB_MONGODB)
                .collection('clientes')
                .updateOne(
                    { _id: clienteId },
                    { $set: { direcciones } }
                );

            res.status(200).send({ codigo: 0, mensaje: 'Direcciones actualizadas correctamente' });
        } catch (error) {
            console.error('Error al actualizar direcciones:', error);
            res.status(500).send({ codigo: 1, mensaje: 'Error al actualizar direcciones' });
        }
    }

}