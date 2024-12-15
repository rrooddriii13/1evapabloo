const { MongoClient,BSON }=require('mongodb');
const clienteMongoDB=new MongoClient(process.env.URL_MONGODB); 
const jsonwebtoken=require('jsonwebtoken');


module.exports={
    // ListaPaises: async function(req,res,next){},
    ListaProvincias: async function(req,res,next){
        try {
            let _resProvsCursor=await clienteMongoDB.db(process.env.DB_MONGODB)
                                              .collection('provincias')
                                              .find();

            let _provs=await _resProvsCursor.toArray();
            console.log('provincias...', _provs);
            res.status(200).send({ codigo:0, mensaje:'PROVINCIAS recuperadas OK!!!', datos:{ provincias: _provs}});

        } catch (error) {
            console.log('error al intentar recuperar provincias: ', error);
            res.status(200).send({ codigo: 3, mensaje: error.message } );         
        }
    },
    ListaMunicipios: async function(req,res,next){
        let _codProv=req.query.codProv;

        try {
            let _resProv=await clienteMongoDB.db(process.env.DB_MONGODB)
                                            .collection('provincias')
                                            .findOne( { CPRO: _codProv});
            if (!_resProv) throw new Error("no existe una provincia con ese codigo de provincia que has pasado...");

            let _resMunisCursor=await clienteMongoDB.db(process.env.DB_MONGODB)
                                                    .collection('municipios')
                                                    .find( { CPRO: _codProv });

            let _munis=await _resMunisCursor.toArray();
            console.log(`municipios de provincia: ${_resProv.PRO}...`, _munis);
            res.status(200).send({ codigo:0, mensaje:'MUNICIPIOS recuperados OK!!!', datos:{ municipios: _munis}});

        } catch (error) {
            console.log(`error al intentar recuperar municipios de la provincia con codigo: ${_codProv}`, error);
            res.status(200).send({ codigo: 4, mensaje: error.message } );         
            
        }
    },
    VerficarCreds: async function(req,res,next){
        try {
            //en cabecera Authorization: Basic CLIENT_ID:CLIENT_SECRET en base64
            console.log('cabecera Authorization...', req.headers);
            const [ _clientId, _clientSecret ]=[ ... Buffer.from(req.headers['authorization'].split(' ')[1], 'base64').toString().split(':') ];
            if( _clientId !== process.env.CLIENT_ID || _clientSecret !== process.env.CLIENT_SECRET) throw new Error('CLIENT_ID o CLIENT_SECRET incorrectos....');

            //en req.body debe ir variable: solicitud=accessToken
            console.log('valor en req.body...', req.body); 
            if(! req.body.solicitud || req.body.solicitud !== 'accessToken' ) throw new Error('error en body-request, debes incluier variable: solicitud=accessToken');
            
            //===== >generamos accesstoken para los endpoints de la api...<============
            const _payload={
                ip: req.ip,
                idjwt: new BSON.ObjectId(),
                fechaAccess:new Date(Date.now()).getTime()
            };

            console.log('datos acceso...', _payload);
    
            let _jwt=jsonwebtoken.sign(
                                        _payload,
                                        process.env.JWT_SECRETKEY,
                                        { expiresIn: '15m', issuer: 'http://localhost:6060'}
                                    );
            
            let _resInsertJWT=await clienteMongoDB.db(process.env.DB_MONGODB)
                                                .collection('accessTokens')
                                                .insertOne( _payload);
            if( ! _resInsertJWT.insertedId ) throw new Error('error al conectarse a mongodb para almacenar jwt del cliente conectado...'); 

            res.status(200).send( { codgio:0, mensaje: 'creds de acceso ok, accesstoken generado en datos...', datos:{ accessToken: _jwt }} );

        } catch (error) {
            console.log('error al verificar creds: ', error);
            res.status(200).send({ codigo: 1, mensaje: error.message } );
        }
    }
}