//objeto js q va a servir para mandar emails usando cuenta de gmail del admin del servicio
const { google }=require('googleapis');

//1º paso) cofigurar cliente oAuth2 con claves oAuth (clientId, clientSecret) de google, al cual pediremos
//codigo para poder usar la api de gmail...con ese codigo conseguiremos un accessToken + refreshToken para
//para poder hacer uso del servicio REST gmail
const oauth2Cliente=new google.auth.OAuth2(
    process.env.GMAIL_OAUTH_CLIENTID,
    process.env.GMAIL_OAUTH_CLIENTSECRET,
    'https://developers.google.com/oauthplayground' //<---- url donde google cuando metes email + password, manda codigo para intercambiar por ACCESSTOKEN + REFRESHTOKEN
    //como estamos en el lado del server donde el corre el servicio, solo se van a originar una unica vez, google aconseja poner esa url
);

//se supone q ya hemos acccedido con ese codigo a la obtencion de los jwt: accessToken y refreshToken para acceder a la api de GMAIL de google
oauth2Cliente.setCredentials(
    {
        access_token: process.env.GMAIL_ACCESS_TOKEN,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    }
);

//2º paso) con esos jwt de acceso a la api de gmail, mandar el correo usando la api:  .send( mensaje_correo )
// (esos jwt van en cabecera authorization) con esos tokens ya podemos acceder a la API de gmail usando la cuenta de admin del portal:
const gmailClient=google.gmail( { version: 'v1', auth: oauth2Cliente } );

module.exports={
    EnviarEmail: async function(detallesEmail){
        try {            
            console.log('detalles del email a mandar....', detallesEmail); 
            const { to,subject,cuerpoMensaje,adjuntos=[] }=detallesEmail; 
            /*
                la api de GMAIL para usar su metodo .send() obliga a q en el cuerpo del mensaje de llamada a la api (siempre por POST)
                tiene q ir un objeto asi:
                  {
                      userId: 'me',
                      requestBody: {
                                        raw:  codigoBASE64EMAIL
                                    } 
                    }
                el Email estara formado por strings con los campos From: ... To: ... Subject: .... Content-Type:....  [MENSAJE]
            */
           const _lineasEmail=[
                `From: ${process.env.EMAIL_ADMIN}`,
                `To: ${to}`,
                'Content-Type: text/html;charset=iso-8859-1',
                'MIME-Version: 1.0',
                `Subject: ${subject}`,
                '', //<------------------ por protocolo de envio de correo para separar cabeceras del cuerpo de mensaje, se necesita una linea en blanco
                `${cuerpoMensaje}`
            ];
           let _codigoBASE64EMAIL= btoa(_lineasEmail.join('\r\n').trim());
           let _respuestaEnvio=await gmailClient.users.messages.send(
                {
                    userId:'me',
                    requestBody: {
                        raw: _codigoBASE64EMAIL
                    }
                }
           );
          console.log('respuesta al envio del email por parte de la api de GMAIL.....', _respuestaEnvio);
          return true;
        
        } catch (error) {
            console.log('error en el envio del email...',error.message);
            return false;    
        }
    }
}