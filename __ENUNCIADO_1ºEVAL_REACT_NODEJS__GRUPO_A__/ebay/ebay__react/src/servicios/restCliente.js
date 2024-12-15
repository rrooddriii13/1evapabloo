//? DOS FORMAS DE PROGRAMAR SERVICIO PARA HACER PET.AJAX AL BACKEND
//! -- 1º forma, mediante funciones individuales que exportas, una por peticion q quieras hacer
// export function RegistrarCliente(datoscuenta){
//     //codigo ajax para mandar los datos de la cuenta al servidor de node js
// }

// export function LoginCliente(email, password){
//     //codigo ajax para hacer login del cliente al servidor de node js

// }
//! -- 2º forma, crear un objeto javascript con metodos dentro del objeto para hacer cada pet.ajax
//!     y exportas todo el objeto 
//#region --------- 1º forma de hacerlo usando callbacks y eventos ------------------
// let restService={
//     generaEventos: new EventTarget(), //<---- permite al objeto restService generar o disparar/escuchar eventos
//     RegistrarCliente: function(datoscuenta){
//         //codigo ajax para mandar al server los datos de la cuenta a registrar....
//         //en datoscuenta va el objeto JSON q manda componente Registro.js:  { nombre:.., apellidos: .., email: ..., password: ...}
//         let _petAjax=new XMLHttpRequest();

//         _petAjax.open('POST', 'http://localhost:3003/api/zonaCliente/Registro');
//         _petAjax.setRequestHeader('Content-Type','application/json');
//         _petAjax.addEventListener('readystatechange',(ev)=>{
//             if (_petAjax.readyState === 4) {
//                 let _respuestaServer=JSON.parse(_petAjax.responseText);
//                 //return _respuestaServer;
//                 this.generaEventos.dispatchEvent(new CustomEvent('peticionCompletadaRegistro',{ detail: _respuestaServer } ));
//             }
//         });

//         _petAjax.send( JSON.stringify(datoscuenta) );
       

//     },
//     addCallBackEvent: function(nombreEvento, callback){ //<----- este metodo del objeto, permite añadir handlers o funciones callback ante eventos personalizados 
//         //ANTES DE AÑADIR LA FUNCION CALLBACK PARA TRATAR EL EVENTO, habria q comprobar si esta añadida de antes como handler...
//         //para hacerlo, te puedes crear un objeto Map donde identificar cada funcion q añades a cada evento
//         this.generaEventos.addEventListener(nombreEvento,callback);
//     },

//     // LoginCliente: function(email,password){
//     //     //codigo ajax para hacer login datos de la cuenta...
//     // }
// }
//#endregion

//#region ---------- 2º forma de hacerlo usando PROMISE -----------------------------
let restCliente={
    RegistrarCliente: function(datoscuenta){
        let _opAsincronaServer=new Promise(
            (resolve,reject)=>{
                        let _petAjax=new XMLHttpRequest();

                        _petAjax.open('POST', 'http://localhost:3003/api/zonaCliente/Registro');
                        _petAjax.setRequestHeader('Content-Type','application/json');
                        _petAjax.addEventListener('readystatechange',(ev)=>{
                            if (_petAjax.readyState === 4) {
                                let _respuestaServer=JSON.parse(_petAjax.responseText);
                                if(_respuestaServer.codigo===0){
                                    resolve(_respuestaServer);
                                }    else {
                                    reject(_respuestaServer);
                                }
                            }
                        });

                        _petAjax.send( JSON.stringify(datoscuenta) );
            }
        );

        return _opAsincronaServer;
    },
    ComprobarEmail: function(email){
        //return fetch('http://localhost:3003/api/zonaCliente/ComprobarEmail',{ method:'POST', body: JSON.stringify( {email}) })
        return fetch('http://localhost:3003/api/zonaCliente/ComprobarEmail?email=' + email);
    }, 
    LoginCliente: async function(email, password){
        let _respServerLogin=await fetch('http://localhost:3003/api/zonaCliente/LoginCliente',
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type':' application/json'},
                                        body:  JSON.stringify({ email, password }) 
                                    }
                                );
        return await _respServerLogin.json();
    },

    
    actualizarDirecciones: async (direcciones) => {
        const response = await fetch('http://localhost:3003/api/zonaCliente/ActualizarDirecciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ direcciones })
        });
        return await response.json();
    }

    
}
//#endregion
export default restCliente;
