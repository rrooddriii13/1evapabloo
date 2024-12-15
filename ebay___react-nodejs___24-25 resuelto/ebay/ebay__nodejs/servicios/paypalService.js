/*
    modulo de codigo q exporta fichero JS con metodos para hacer pago paypal
    antes de invocar cualquier endpoint de PayPal hay q solicitar accesstoken para poder hacer uso de su api
    -1º operacion: crear un objeto ORDER (orden de pago):  informacion del pedido a cobrar (items, subtotal, gastosEnvio, total)
        ademas en el objeto ORDER van las urls para q el cliente acepte/deniege pago del ORDER 
    -2º una vez q el cliente da el ok/cancela a paypal, paypal se pone en contacto con nuestro servicio de nodejs
       para q finalicemos el pago (tenemos q pasar el id ORDER creado en el 1º paso) ...checkout ORDER
*/
const axios=require('axios');

async function _getAccessTokenPayPal(){
    try {
        //obtener accessToken de PayPal https://developer.paypal.com/api/rest/#link-getaccesstoken
        //tenemos q pasar en cabecera Authorization codificado en base64 la combinacio: client_id:client_secret
        //pasar en el body de la peticion, en formato x-www-form-urlencoded, estos datos: grant_type=client_credentials
        let _base64ClientIdClientSecret=Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)
                                              .toString('base64'); //<--- tb se puede usar btoa() de js puro
        let _respToken=await axios(        
                    {
                        url:'https://api-m.sandbox.paypal.com/v1/oauth2/token',
                        method: 'POST',
                        headers: {
                            'Content-Type':'application/x-www-form-urlencoded',
                            'Authorization': `Basic ${_base64ClientIdClientSecret}`
                        },
                        data: 'grant_type=client_credentials' //<---tb te puedes crear un objeto URLSearchParams, pero para una variable no merece la pena
                    }
        );
        console.log('respuesta de paypal a la peticion de accessToken para hacer uso de su API...', _respToken.data);
        if(! _respToken.data.access_token) throw new Error('error al solicitar accessToken a paypal, no puedo efectuar cobro');

        return _respToken.data.access_token;

    } catch (error) {
        console.log('error al intentar crear accessToken paypal...', error);
        return null;
    }
}

module.exports={
    CrearPagoPayPal: async function(idCliente,pedido) {
        try {
            //1º solicitar access-token
            let _accessToken=await _getAccessTokenPayPal();
            if (! _accessToken) throw new Error('falta accesstoken para poder crear ORDER');            

            //2º crear objeto ORDER de paypal con detalles del pedido a cobrar: https://developer.paypal.com/docs/api/orders/v2/#orders_create
            //tengo q comprobar si estoy en el comprarYa o en cesta normal, pq los items del pedido cambian:
            let _itemsPedido=pedido.comprarYa.producto ? [ { ...pedido.comprarYa } ]: pedido.itemsPedido;

            let _payloadOrder={
                intent: 'CAPTURE', //<---- prop.obligatoria por paypal para poder crear objeto ORDER
                purchase_units: [  
                        {   //array de items del pedido, cada item del pedido paypal: 
                            //{name: ..., quantity: ..., unit_amount: { currency_code:..., value:...} }       
                            items: _itemsPedido.map(
                                        el => (
                                            {
                                                name: el.producto.nombre,
                                                quantity: el.cantidad.toString(),
                                                unit_amount: { currency_code: 'EUR', value: el.producto.precio.toString() }
                                            } 
                                        ) 
                                    ),
                            //subtotal, gastosEnvio, total del pedido
                            amount:{
                                currency_code: 'EUR',
                                value: pedido.total.toString(),
                                breakdown:{
                                    item_total: { currency_code: 'EUR', value: pedido.subtotal.toString() },
                                    shipping: { currency_code: 'EUR', value: pedido.gastosEnvio.toString() }
                                }
                            } 
                        }
                ],//cierre de prop. purchase_units del objeto ORDER
                //esta prop.del objeto ORDER no es REQUERIDA, pero para un servicio GATEWAY hay q meterla si o si pq dan las urls
                //de callback a las q tiene q acceder PayPal cuando el cliente aprueba el pago, y el servicio tiene q procesarlo
                application_context:{
                    return_url:`http://localhost:3003/api/zonaTienda/PayPalCallback?idCliente=${idCliente}&idPedido=${pedido._id}`,
                    cancel_url:`http://localhost:3003/api/zonaTienda/PayPalCallback?idCliente=${idCliente}&idPedido=${pedido._id}&Cancel=true`
                } 
            }

            let _respOrder=await axios(
                {
                    method:'POST',
                    url:'https://api-m.sandbox.paypal.com/v2/checkout/orders',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${_accessToken}`
                    },
                    data: JSON.stringify(_payloadOrder)
                }
            );
            console.log('respuesta de paypal al objeto ORDER creado....', _respOrder.data);
            return _respOrder.data; //<---- sobre todo me interesa el id del objeto Order y una url a devolver al cliente react para q se conecte a paypal y procese el pago del pedido
        
        
        } catch (error) {
            console.log('error en 1º paso del pago paypal a la hora de crear objeto ORDER...', error);
            return null;
        }
    },
    FinalizarPagoPayPal: async function(orderId){
        try {
            //1º solicitar access-token
            let _accessToken=await _getAccessTokenPayPal();
            if (! _accessToken) throw new Error('falta accesstoken para poder crear ORDER');            

            //2º checkout ORDER de paypal 
            let _respuesta=await axios(
                {
                    method:'POST',
                    url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${_accessToken}`
                    }
                }
            );
            console.log('respuesta de paypal al finalizar pago...', _respuesta);
            if (_respuesta.status===201) { //<----- OJO!!!! no siempre el http-status-code es 200 para ok, paypal en este caso origina un 201
                return true;
            } else {
                throw new Error('error a la hora de finalizar pago por paypal...');
            }

        } catch (error) {
            console.log('error en 2º paso del pago paypal a la hora de finalizar pago (checkout ORDER)...', error);
            return null;
            
        }
    }

}
