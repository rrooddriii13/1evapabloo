//cliente de acceso a MongoDB.....
const { MongoClient,BSON }=require('mongodb');
console.log('variables de entorno....', process.env.URL_MONGODB, process.env.DB_MONGODB);
const clienteMongoDB=new MongoClient(process.env.URL_MONGODB); 

const stripeService=require('../../servicios/stripeService');
//const paypalService=require('../../servicios/paypalService');

module.exports={
    DevolverCategorias: async function(req,res,next){
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
    },
    RecuperarProductosFromCat: async function(req,res,next){
        try {
            await clienteMongoDB.connect();
            /* PRIMERO SACAR CATEG */

            let _prodsCursor=clienteMongoDB.db(process.env.DB_MONGODB)
                                            .collection('productos')
                                            .find({categoría: req.query.catId});
    
            let _prods=await _prodsCursor.toArray();
    
            console.log('numero de productos recuperados...', _prods.length);
            console.log('numero de productos recuperados...', _prods.length +'de '+ req.query.catId);

            res.status(200).send( { codigo:0, mensaje:'productos recuperados OK!!!', datos:_prods } );
    
        } catch (error) {
            console.log('error al intentar recuperar productos.....', error.message);
            res.status(200).send( { codigo:6, mensaje:`error al intentar recuperar productos: ${error.message}`, datos:[] } );            
        }
    },
    RecuperarProducto: async function(req,res,next){
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
    },
    ComprarProductos: async function(req,res,next){
        try {
            /*en el req.body voy a pasar estos datos: 
                        {
                            pedido: { itemsPedido:[...], comprarYa:..., metodosPago:..., subtotal:..,total:..., gastosEnvio:...},
                            cliente: { idCliente, email } //<---- en teoria van en el accessToken q ha tenido q mandar el cliente react (en el payload)
                                                         //comprobar q coincide esos campos del payload con esta info q se manda directamente
                        }
            */
            console.log('datos mandados en el body al COMPRAR-PRODUCTOS desde react...', req.body);
            
            const { pedido, cliente }=req.body;
            pedido._id=new BSON.ObjectId();
    
            switch (pedido.metodoPago.tipo) {
                case 'creditcard':
                        //#region....pago con stripe....
                        //1º paso pago con stripe, crear customer(cliente) 
                        let _idCustomer=await stripeService.CrearCustomer(
                            {
                                nombre: cliente.nombre + cliente.apellidos,
                                email: cliente.cuenta.email, //<----- recup. del payload del accessToken
                                telefono: cliente.cuenta.telefono, //<--- recup. del payload del accessToken
                                direccionEnvio: cliente.direcciones.filter( dir=> dir.esPrincipal)[0] //<--- recup. del payload del accessToken (si no esta, con email o _idCliente acceder a BD y recup. direccion principal)
                            }
                        );
                        if(! _idCustomer) throw new Error('error al crear objeto CUSTOMER de STRIPE');
    
                        //2º paso pago con stripe, crear tarjeta de credito y asociarla al customer(cliente)
                        let _idCard=await stripeService.CrearCardFromCustomer(_idCustomer);
                        if(! _idCard) throw new Error('error al crear objeto CARD de STRIPE');
    
                        //3º paso pago con stripe, crear cargo debo pasar: idCustomer,idCard,cantidad,idPedido
                        let _objetoCargo=await stripeService.CrearCharge(_idCustomer, _idCard, pedido.total, pedido._id);
                        console.log('pago realizado ....objeto devuelto es:', _objetoCargo);
    
                        //4º paso:  almacenar en BD mongodb el objeto pedido con el cargo y asociarlo al cliente....
                        //          mandar email con detalles del pedido realizado
                        res.status(200).send( { codigo: 0, mensaje:'pago del pedido procesado ok...' } );
                        //#endregion
    
                    break;
                case 'paypal':
                        //pago con paypal....
                        //1º paso, crear objeto ORDER:
                        let _respOrder=await paypalService.CrearPagoPayPal(cliente._id, pedido);
                        if(! _respOrder) throw new Error('error al generar objeto ORDER de paypal, decir a cliente react q lo intente mas tarde');

                        //si obtengo respuesta solo me intersa el id del ORDER creado y la url q tengo q enviar a react para q el cliente acceda
                        //a pagar. Antes tengo q almacenar en mongodb de forma persistente en coleccion paypalorders: idCliente, idPedido, idOrder
                        let _insertOrder=await clienteMongoDB.db(process.env.DB_MONGODB)
                                                            .collection('paypalOrders')
                                                            .insertOne( 
                                                                { 
                                                                    idCliente: cliente._id,
                                                                    idPedido: pedido._id.toString(),
                                                                    idOrder: _respOrder.id 
                                                                }
                                                             );
                        //si falla la insercion en mongodb, el objeto ORDER DE PAYPAL ESTA CREADO!!! lo suyo seria anularlo...
                        if(! _insertOrder.insertedId) throw new Error('error al insertar en mongodb en coleccion paypalOrdrs..')

                        //tengo q seleccionar de la prop. "links" del objeto ORDER creado aquella cuya prop. "rel" sea "approve"
                        //y devolversela al cliente de REACT para q acceda al pago:


                        res.status(200).send( 
                                                { 
                                                    codigo: 0, 
                                                    mensaje: 'objeto ORDER creado correctamente, entra en paypal y PAGA!!!', 
                                                    datos: {
                                                        urlPayPal: _respOrder.links.filter( link=>link.rel==='approve')[0].href
                                                    } 
                                                }
                                        )
                    break;
    
                case 'google-pay':
                        //pago con google-pay....
    
                    break;
            }


    
        } catch (error) {
            console.log('error a la hora de hacer pago....', error.message);
            res.status(200).send( { codigo: 100, mensaje :'error interno al procesar pago, intentelo de nuevo mas tarde'} );
        }

    },
    // PayPalCallback: async function(req,res,next){
    //     try {
    //         console.log('parametros en url q pasa paypal...', req.query);
    //         const {idCliente, idPedido, Cancel }=req.query;
            
    //         if(Cancel) throw new Error('Pago cancelado por el cliente...');

    //         //recuperamos orderId asociado a ese idCliente y idPedido:
    //         let _docOrder=await clienteMongoDB.db(process.env.DB_MONGODB)
    //                                             .collection('paypalOrders')
    //                                             .findOne({ idCliente, idPedido})
            
    //         let _finPagoOk=await paypalService.FinalizarPagoPayPal(_docOrder.idOrder);
    //         if (! _finPagoOk) throw new Error('error finalizar pago paypal...');

    //         res.status(200).redirect(`http://localhost:3000/Tienda/FinalizarOk?opCodePago=0&idPedido=${idPedido}`);

    //     } catch (error) {
    //         console.log('error al finalizar pago en funcion PayPalCallback ', error);
    //         res.status(200).redirect('http://localhost:3000/Tienda/FinalizarOk?opCodePago=100')
    //     }
    // }
}