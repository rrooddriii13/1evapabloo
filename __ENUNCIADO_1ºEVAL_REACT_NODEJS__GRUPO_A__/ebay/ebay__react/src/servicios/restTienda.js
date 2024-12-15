//creamos un objeto javascript con metodos dentro del objeto para hacer cada pet.ajax al servicio nodejs
//con metodos para la tienda: recuperar productos de una catetgoria, recuperar detalles de un producto, recup
//productos mas vendidos, recup.productos en oferta,...
//y exportas todo el objeto 
let restTienda={
    DevolverCategorias: async function( { request, params, subcats } ){
        try {
            console.log('parametros del loader de react-router-dom....', request, params, subcats);

            //si en params existe propiedad .pathCategoria, entonces quiero recuperar subcategorias. Si no existe
            //esa prop. lo ejecuta el loader el metodo para recup. categorias principales
            //CREO UN PARAMETRO A INCLUIR EN LA URL a mandar al servicio de nodejs indicando q quiero recuperar:
            let _parametro=subcats === undefined ? 'principales' : subcats.pathCategoria;
            
            let _resp=await fetch(`http://localhost:3003/api/zonaTienda/DevolverCategorias?pathCategoria=${_parametro}`);
            let _bodyResp=await _resp.json(); //<---- un objteto: { codigo: x, mensaje: ..., datos: .... }

            console.log('respuesta del servicio para recup.categorias...', _bodyResp)
            return _bodyResp.datos;

        } catch (error) {
            console.log('error al recuperar categorias...', error.message);
            return null;            
        }
    },
    RecuperarProductosFromCat: async function( {request, params } ){
        try {
            console.log('parametros del loader de react-router-dom en RECUPERARPRODUCTOS....', request, params);
            let _resp=await fetch(`http://localhost:3003/api/zonaTienda/RecuperarProductosFromCat?catId=${params.catId}`);
            let _bodyResp=await _resp.json(); //<---- un objteto: { codigo: x, mensaje: ..., datos: .... }

            console.log('respuesta del servicio para recup.categorias...', _bodyResp)
            return _bodyResp.datos;

        } catch (error) {
            console.log('error al recuperar categorias...', error.message);
            return null;                        
        }
    },
    RecuperarProducto : async function( {request,params } ){
        try {
            console.log('parametros del loader de react-router-dom en RECUPERARPRODUCTO dese _ID ....', request, params);
            let _resp=await fetch(`http://localhost:3003/api/zonaTienda/RecuperarProducto?idProd=${params.idProd}`);
            let _bodyResp=await _resp.json(); //<---- un objteto: { codigo: x, mensaje: ..., datos: .... }

            console.log('respuesta del servicio para recup.producto...', _bodyResp)
            return _bodyResp.datos;

        } catch (error) {
            console.log('error al recuperar categorias...', error.message);
            return null;                        
        }

    },
    FinalizarPedido: async function( cliente, pedido, accessToken, refreshToken ){
        try {
            //si mando objeto cliente entero + objeto pedido entero con productos con sus imagenes, etc....pesa demasiado y servicio nos corta con error 413
           //selecciono datos a mandar:
           console.log('en finalizar pedido...', cliente,pedido);
            let _respFinPedido=await fetch(
                'http://localhost:3003/api/zonaTienda/ComprarProductos',
                {
                    method:'POST',
                    headers:{
                        // 'Authorization': `Bearer ${accessToken}`,
                        // 'X-RefreshToken': `${refreshToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify( 
                        { 
                            cliente: { 
                                        _id: cliente._id,
                                        cuenta: cliente.cuenta
                                    }, 
                            pedido: {
                                metodoPago: pedido.metodoPago,
                                subtotal: pedido.subtotal,
                                gastosEnvio: pedido.gastosEnvio,
                                total: pedido.total,
                                comprarYa: { 
                                             producto: {
                                                         idProducto: pedido.comprarYa.producto._id,
                                                         nombre: pedido.comprarYa.producto.nombre,
                                                        precio: pedido.comprarYa.producto.precio
                                                    },
                                             cantidad: pedido.comprarYa.cantidad
                                             },
                                itemsPedido: pedido.itemsPedido
                                                    .map( 
                                                        item =>(
                                                                     {
                                                                        producto:{ 
                                                                            idProducto: item.producto._id,
                                                                            nombre: item.producto.nombre,
                                                                            precio: item.producto.precio
                                                                        },
                                                                        cantidad: item.cantidad 
                                                                    }
                                                                )
                                                         )

                            } 
                        }                         
                    )
                }
            );
            let _datosResp=await _respFinPedido.json();
            console.log('respuesta del servicio de nodejs al finalizar pedido...', _datosResp);
            
            return _datosResp;

        } catch (error) {
            console.log('error al finalizar pedido...', error);
            return null;
        }
    }
}

export default restTienda