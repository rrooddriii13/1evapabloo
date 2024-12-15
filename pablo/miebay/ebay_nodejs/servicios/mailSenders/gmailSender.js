//objeto js q va a servir para mandar emails usando cuenta de gmail del admin del servicio
const { google }=require('googleapis');

//para mandar un mail usando api externa (api google)

//1) paso  configurar cliente oAth con claves oAuth (clientId,clientSecret) de google al cual pediremos
//codigo para poder usar la api de gmail...con ese codigo conseguiremos un accessToken + refreshToken para
//para poder hacer uso del servicio REST gmail
const oauth2Cliente = new google.auth.OAuth2(
    process.env.GMAIL_OAUTH_CLIENTID,//<---le pasas el clientID
    process.env.GMAIL_OAUTH_CLIENTSECRET,//<---la clave secreta de las credenciales OAuth
    'https://developers.google.com/oauthplayground' //<---- url donde google cuando metes email + password, manda codigo para intercambiar por ACCESSTOKEN + REFRESHTOKEN
    //como estamos en el lado del server donde el corre el servicio, solo se van a originar una unica vez, google aconseja poner esa url    
    //vamos hacer q el refreshDure eternamente 
);

// se supone q con lo de arriba (ese codigo) ya hemos accedido con ese cod ala obtencion de los jwt:
// accesTpken y refredh token para acceder ala api de Gmail de google
oauth2Cliente.setCredentials(
    { //json con el accesttoken        
        access_token: process.env.GMAIL_ACCESS_TOKEN,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    }
);
//con esos tokens ya podemos acceder ala api de gmail usando la cuenta de admin en el portal ;
//2º) paso una vez tenemos los token con esos jwt de acceso a la api de gmail, mandar el correo usando la api: .send( mensaje_correo )
//(esos jwt van en cabecera authorization) con esos tokens ya podemos acceder a la API de gmail usando la cuenta de admin del portal:

//creamos un cliente autenticado de gamil y lo podemos usar para mandar correos a los usuarios q se registren ->  
const gmailClient = google.gmail({version:'v1',auth: oauth2Cliente})//un json .>versioon y las credenciales q vas a usar para autenticarse

module.exports= {
    //metodo q llamamos en el registro para enviar email (q los usan los endPoint)
    EnviarEmail: async function(detallesEmail){
        try {            
            console.log('detalles del email a mandar.... ',detallesEmail);

            const {to, subject, cuerpoMensaje, ficherosAdjuntos=[ ] } = detallesEmail;
            //console.log(`Recipient email:', ${to}  ${process.env.EMAIL_ADMIN}`);

            //el Email estara formado por strings con los campos From: ... To: ... Subject: .... 
            //Content-Type:.... usamos el content type para hacer un aplantilla HTML  [cuerpoMensaje]
            const _lineasEmail = [
                `From: ${process.env.EMAIL_ADMIN}`,
                `To: ${to}`,
                'Content-Type: text/html;charset=iso-8859-1',
                'MIME-Version: 1.0',
                `Subject: ${subject}`,
                '', //<---- por protocolo de envio de correo para separar cabeceras del cuerpo de mensaje, se necesita una linea en blanco
                `${cuerpoMensaje}`//el body 
            ];
            //para unir los elementos del array  al final de cadfa elemento un salto de linea y quito los espacio
            let codigoBASE64EMAIL = btoa(_lineasEmail.join('\r\n').trim());

            /* la api de GMAIL para usar su metodo .send() obliga a q en el cuerpo del mensaje de llamada a la api (siempre por POST)
                tiene q ir un objeto asi:
                  {
                      userId: 'me', //cuenta de correo desde donde iintemntas mandar email
                      requestBody: { //contiene un obj q lleva un campo raw .> el formato en base 64 -> paraq no lo rechaza
                                        raw:  codigoBASE64EMAIL
                                    } 
                    }
            */
            let _respuestaEnvio = await gmailClient.users.messages.send(
                {
                    userId:'me',
                    requestBody:{
                        raw:  codigoBASE64EMAIL
                    }
                }
            );
           // console.log('respuesta al envio del email por parte de la api de GMAIL.....', _respuestaEnvio);
            return true;//es lo q devuelve el metodo q se envio   
        } catch (error) {
            console.log(' error en el envio del email',error.message);
            return false;
        }
    }


}