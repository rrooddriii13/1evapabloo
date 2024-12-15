//modulo de codigo q exporta un objeto JS con metodos para generar/validar/refrescar JWT
//accessToken + refreshToken <---- tb puede generar un accessToken de 1 solo uso
//verificar Tokens (comprobar si no han expirado y estan firmados por el server del servicio)
const jsonwebtoken=require('jsonwebtoken');


module.exports={
    generarJWT: function(payload, expiracion, unsolouso=false){//unsolouso -> un solo uso false xq quiero q me genereel acces y refresh
        //sirve segun el payload q le pase y la expiracion me va a generrar 2 token 

                //generamos o accessToken+refreshToken o solo acccessToken de un solo uso....
                /*1º Forma 1 mas facil:                                
                let _accesToken=jwt.sign(
                    {tipo: 'accessToken', ...payload},
                    process.env.JWT_SECRETKEY,
                    {expiresIn: expiracion, issuer: 'http://localhost:3003'}
                );

                let _refreshToken=jwt.sign(
                    {tipo: 'refreshToken', email: payload.email },//meto email pero vake cualquier propiedad q identifiqaue al email
                    process.env.JWT_SECRETKEY,
                    {expiresIn: expiracion, issuer: 'http://localhost:3003'}
                );
                let _tokens=[ _accesToken, _refreshToken];*/
                
                //forma 2 mas corta 
                let _tokens=[
                                { tipo:'accessToken', expiresIn: expiracion },//transformo este obj a accestoken
                                { tipo: 'refreshToken', expiresIn: '5h' }//transformo este obj a refreshToken
                            ].map(
                                (el,pos,arr)=>{
                                    //segun el tipo acces o refresh el payload vale lo  q me mandan  -> si es regresh  meto el email en el acces va todo el payload (emial,telefono ...)
                                    let _payload=el.tipo==='accessToken' ? {tipo: el.tipo, ...payload } : { tipo: el.tipo, email: payload.email };
                                    return jsonwebtoken.sign(
                                        _payload,
                                        process.env.JWT_SECRETKEY,
                                        { expiresIn: el.expiresIn, issuer: 'http://localhost:3003' }
                                    )
                                }
                            );
                        //en funcion del unsolouso  si es true el accestoken (1 pos array ) sino rl array entero tanto avves u refresh 
                        return unsolouso ? _tokens[0]: _tokens;             
    },
    verficarJWT: function(jwt){
        //este metodo sirbe  para  verificsr el token q le yo le pase aqui (jwt)
    }

}