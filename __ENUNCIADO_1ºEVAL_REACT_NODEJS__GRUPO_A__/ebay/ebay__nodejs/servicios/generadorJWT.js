//modulo de codigo q exporta un objeto JS con metodos para generar/validar/refrescar JWT
//accessToken + refreshToken <---- tb puede generar un accessToken de 1 solo uso
//verificar Tokens (comprobar si no han expirado y estan firmados por el server del servicio)
const jsonwebtoken=require('jsonwebtoken');

module.exports={
    generarJWT: function(payload, expiracion, unsolouso=false){
                //generamos o accessToken+refreshToken o solo acccessToken de un solo uso....
                //1º token de accesstoken:

                // let _accesToken=jwt.sign(
                //     {tipo: 'accessToken', ...payload},
                //     process.env.JWT_SECRETKEY,
                //     {expiresIn: expiracion, issuer: 'http://localhost:3003'}
                // );

                // let _refreshToken=jwt.sign(
                //     {tipo: 'refreshToken', email: payload.email },
                //     process.env.JWT_SECRETKEY,
                //     {expiresIn: expiracion, issuer: 'http://localhost:3003'}
                // );

                // let _tokens=[ _accesToken, _refreshToken];

                let _tokens=[
                                { tipo:'accessToken', expiresIn: expiracion },
                                { tipo: 'refreshToken', expiresIn: '5h' }
                            ].map(
                                (el,pos,arr)=>{
                                    let _payload=el.tipo==='accessToken' ? {tipo: el.tipo, ...payload } : { tipo: el.tipo, email: payload.email };
                                    return jsonwebtoken.sign(
                                        _payload,
                                        process.env.JWT_SECRETKEY,
                                        { expiresIn: el.expiresIn, issuer: 'http://localhost:3003' }
                                    )
                                }
                            );

                    return unsolouso ? _tokens[0]: _tokens;
    },
    verficarJWT: function(jwt){

    }

}