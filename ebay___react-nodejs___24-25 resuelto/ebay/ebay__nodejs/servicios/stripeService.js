/*
    modulo de nodejs q exporta un objeto JS con metodos para hacer pago con tarjeta....
    usando STRIPE (usando la API de stripe)
        - 1º paso para hacer pago: crear un objeto de tipo CUSTOMER con datos del cliente
        - 2º paso para hacer pago: crear un objeto de tipo CARD asociado a ese CUSTOMER
                            donde se le va a hacer el cargo del pago (tipo tarjeta,numero,...)
        - 3º paso para hacer pago: crear un objeto de tipo CHARGE para hacer ya el cargo
                            (cantidad, moneda,idCard, idCustome, ...)
*/
const axios=require('axios');
const _clienteFetchAxios=axios.create(
    {
        baseURL: 'https://api.stripe.com/v1/',
        headers: {
            'Authorization': `Bearer ${process.env.STRIPE_API_KEY}`
        }
    }
);

module.exports={
    CrearCustomer: async function( datosCliente ){
        //metodo q sirve para llamar a la API de stripe para crear un objeto CUSTOMER...https://docs.stripe.com/api/customers/create?lang=curl
        //tengo q pasar en cabecera Authorization: Bearer __api__key__ <----- hecho en configuracion base de axios
        //y en el body de la peticion, en formato X-WWW-FORM-URLENCODED ojo!!! no json, datos del cliente para el cobro        
        try {
                //en datosCliente solo voy a pasar: nombre y apellidos, email, telefono, direccion principal de envio
                const { nombre, email, telefono, direccionEnvio }=datosCliente;
                let _payLoadStripeCustomer=new URLSearchParams(
                                        {
                                            'name': nombre,
                                            'phone': telefono,
                                            'email': email,
                                            'address[city]': direccionEnvio.municipio,
                                            'address[state]': direccionEnvio.provincia,
                                            'address[country]': direccionEnvio.pais,
                                            'address[postal_code]': direccionEnvio.cp,
                                            'address[line1]': direccionEnvio.calle

                                        }
                ).toString(); 
                //no hace falta poner añadir cabecera: 'Content-Type': 'x-www-form-urlencoded' porque al crear objeto URLSearchParams
                //axios lo detecta y lo añade directamente. Si no usas este objeto y lo haces usando js puro, si tienes q añadirla:
                //      Object.keys(datosCliente).map(  (prop,pos)=> { return ``${prop}=${datosCliente[prop]}`.join('&') } )
                let _reqStripeCustomer=await _clienteFetchAxios.post('customers', _payLoadStripeCustomer);
                console.log('respuesta de STRIPE ante la creacion del objeto CUSTOMER...', _reqStripeCustomer.data);

                if( ! _reqStripeCustomer.data.id ) throw new Error('error al crear objeto CUSTOMER de stripe, pago invalidado....');
                return _reqStripeCustomer.data.id;

        } catch (error) {
                console.log('error al crear objeto Customer', error);
                return null;
        }

    },
    CrearCardFromCustomer: async function(idCustomerStripe, datosTarjeta){
        //metodo q sirve para llamar a la api de stripe para crear objeto CARD y asociarlo a un objeto CUSTOMER....https://docs.stripe.com/api/cards/create
        //tengo q pasar en cabecera Authorization: Bearer __api__key__ <----- hecho en configuracion base de axios
        //y en el body de la peticion, en formato X-WWW-FORM-URLENCODED ojo!!! no json, datos de  la tarjeta  el idCustomer creado...
        try {
            let _payloadStripeCard=new URLSearchParams(
                {
                    //objeto payload con info de tarjeta a asociar al objeto customer de stripe a la q hacer el cargo... 
                    // 'source[object]':'card',
                    // 'source[number]': datosTarjeta.numero,
                    // 'source[cvc]': datosTarjeta.cvc,
                    // 'source[exp_year]': datosTarjeta.fechaExpiracion.anio,
                    // 'source[exp_month]': datosTarjeta.fechaExpiracion.mes,
                    // 'source[name]':  datosTarjeta.nombreCompleto        
                    //con fines de desarrollo para probar la api, stripe te genera una tarjeta ficticia: source: 'tok_visa'
                    'source': 'tok_visa'    
                }
            ).toString();

            let _reqStripeCard=await _clienteFetchAxios.post(`customers/${idCustomerStripe}/sources`, _payloadStripeCard);
            console.log('respuesta de stripe a la hora de crear el objeto CARD....', _reqStripeCard.data);

            if(! _reqStripeCard.data.id) throw new Error('fallo a la hora de crear objeto CARD de stripe y asociarla al objeto Customer')
            return _reqStripeCard.data.id;

        } catch (error) {
            console.log('error al crear objeto Card', error);
            return null;            
        }        

    },
    CrearCharge: async function( idCustomerStripe, idCard, cantidad, idPedido){
        //metodo q sirve para llamar a la api de stripe para crear objeto CHARGE y asociarlo a un objeto CUSTOMER, y CARD....https://docs.stripe.com/api/charges/create
        //tengo q pasar en cabecera Authorization: Bearer __api__key__ <----- hecho en configuracion base de axios
        //y en el body de la peticion, en formato X-WWW-FORM-URLENCODED ojo!!! no json, datos del pedido a facturar
        try {
            let _payloadStripeCharge=new URLSearchParams(
                {
                    'amount': cantidad * 100, //<---- en la antigua api habia q convertirlo a string,
                    'currency': 'eur',
                    'description': `cobro del pedido de Ebay con id: ${idPedido}`,
                    'customer': idCustomerStripe,
                    'source': idCard
                }
            ).toString();
    
            let _respStripeCharge=await _clienteFetchAxios.post('charges', _payloadStripeCharge);
            console.log('respuesta de stripe a lahora de crear el objeto CHARGE y hacer el cobro...', _respStripeCharge.data);

            if( _respStripeCharge.data.status !== 'succeeded') throw new Error('fallo a la hora de realizar el cobro en stripe');
            return _respStripeCharge.data.id; //<---- podria devolver todo el objeto charge creado y almacenarlo en mongodb, de momento solo el .id
            
        } catch (error) {
            console.log('error al crear objeto Charge', error);
            return null;                        
        }
        
    }
}