import './Registro.css'
import { useState } from 'react'; //hook para manejar el estado del componente

import   restCliente  from '../../../servicios/restCliente'
import { Link } from 'react-router-dom';
 
function Registro(){
    //1º props componente
    //console.log('atributos del componente almacenado en objeto PROPS...', props);

    //let { username, password }=props;

    //2º state componente
    //TODO ... voy a crear en el state del componente un UNICO OBJETO para recoger y validar todos los campos del formulario:
    //!     - este objeto tiene como propiedades los CAMPOS DEL FORMULARIO: nombre, apellidos, email, password
    //!     - dentro de cada propiedad voy a meter un objeto q represente valores del campo del input del formulario:
    //!             - valor caja de texto, validaciones, mensaje de error a mostrar, estado de validacion
    const [ formData, setFormData ]=useState(
        {
            nombre:{ //? <---------- propiedad q se mapea contra campo input-nombre
                valor:'', // <------ propiedad de "nombre" a modificar en evento onChange del input
                valido: false, // <--propiedad de "nombre" q define estado de validacion del contenido del input-nombre
                validaciones:{ // <-- propiedad de "nombre" con las validaciones a hacer sobre el input-nombre
                    obligatorio: [ true, '* Nombre obligatorio'],
                    maximaLongitud: [ 150, '* Nombre no debe exceder de 150 cars.'],
                    patron: [ /^([A-Z][a-z]+\s*)+/, '* Formato invalido nombre, ej: Nuria Roca']
                },
                mensajeValidacion:'' //<-- propiedad de "nombre" con el mensaje de error procedente de las validaciones a hacer sobre input-nombre
            }, 
            apellidos:{ //? <---------- propiedad q se mapea contra campo input-apellidos
                valor:'', 
                valido: false,
                validaciones:{ 
                    obligatorio: [ true, '* Apellidos obligatorios'],
                    maximaLongitud: [ 250, '* Apellidos no debe exceder de 250 cars.'],
                    patron: [ /^([A-Z][a-z]+\s*)+/, '* Formato invalido apellidos, ej: Nuria Roca']
                },
                mensajeValidacion:''

            },
            email:{ //? <---------- propiedad q se mapea contra campo input-email
                valor:'', 
                valido: false,
                validaciones:{ 
                    obligatorio: [ true, '* Email obligatorios'],
                    patron: [ /^.+@(hotmail|gmail|yahoo|msn)\.[a-z]{2,3}$/, '* Formato invalido email, ej: mio@hotmail.es']
                },
                mensajeValidacion:''

            },
            password:{ //? <---------- propiedad q se mapea contra campo input-password
                valor:'', 
                valido: false,
                validaciones:{ 
                    obligatorio: [ true, '* Contraseña obligatoria'],
                    minimaLongitud: [ 8, '* La contraseña debe tener al menos 8 caracteres '],
                    patron: [ /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%*]).{8,}$/ , '* Formato invalido contraseña, una MAYS, una Mins, un digito, un simbolo']
                },
                mensajeValidacion:''
            }
        }
    );

    //3º codigo funcional javascript (hooks, tratamiento eventos, ...)


    function ManejarSubmitForm(ev){
        ev.preventDefault(); //anula el comportamiento por defecto del submitform, envio de datos...

        //#region ...este codigo genera por consola UNDEFINED pq la op.asincrona no se completa, y no tengo resultados inmediatos...
        // let _respuesta=restCliente.RegistrarCliente(
        //     {
        //         nombre: formData.nombre.valor,
        //         apellidos: formData.apellidos.valor,
        //         email: formData.email.valor,
        //         password: formData.password.valor
        //     }
        // );
        // console.log('datos recibidos del server nodejs ante el registro...', _respuesta);
        //#endregion
        //#region .... codigo usando EVENTOS-CALLBACKS....
        // restCliente.RegistrarCliente(
        //     {
        //         nombre: formData.nombre.valor,
        //         apellidos: formData.apellidos.valor,
        //         email: formData.email.valor,
        //         password: formData.password.valor
        //     }
        // );

        // restCliente.addCallBackEvent('peticionCompletadaRegistro', (ev)=>{
        //     console.log('datos recibidos del server de nodejs ante el registro...', ev.detail);
        // });
        //#endregion
        restCliente.RegistrarCliente(
                                    {
                                        nombre: formData.nombre.valor,
                                        apellidos: formData.apellidos.valor,
                                        email: formData.email.valor,
                                        password: formData.password.valor
                                    }            
                                ).then( respuestaServer => console.log('respuesta de nodejs OK en registro...',respuestaServer) )
                                 .catch( errorServer => console.log('error en nodejs en registro....',errorServer));
        
    }

    function ValidarCajasHandler(ev){
        console.log('se ha perdido el foco de la caja con valor...', ev.target.name, ev.target.value);
        let _validacionesAHacer=formData[ev.target.name].validaciones;
    }
    //4º codigo JSX
    return (        
        <div className='container'>
            { /* fila donde va logo de ebay y link para el Login*/ }
            <div className='row mt-4'>
                <div className='col-2'>
                     <Link to="/Tienda/Productos"><img src='/images/logo_ebay.png' alt='loge Ebay'/> </Link>
                </div>
                <div className='col-6'></div>
                <div className='col-2'>
                    <span>¿Ya tienes una cuenta?</span>
                </div>
                <div className='col-2'>
                    <a href="/">Identificarse</a>
                </div>
            </div>

            { /* fila donde va imagen de registro y formulario, depdende tipo de cuenta, si es PERSONAL o EMPRESA*/ }
            <div className='row mt-4'>
                <div className='col-8'><img src='/images/imagen_registro_personal.jpg' alt='Registro Personal'></img></div>
                <div className='col-4'>
                    <form onSubmit={ ManejarSubmitForm }  >
                        <div className='row'><h1 className='title'>Crear una cuenta</h1></div>
                        <div className="row">
                            <div className="col form-floating">
                                <input type="text"
                                       id='txtNombre'
                                       name='nombre'
                                       className="form-control form-element"
                                       placeholder="Nombre"
                                        onChange={ (ev)=> setFormData( {...formData, nombre:{ ...formData.nombre, valor: ev.target.value } } ) }
                                        onBlur={ValidarCajasHandler}
                                       />

                                <label htmlFor='txtNombre' className='floating-label'>Nombre</label>
                            </div>
                            <div className="col mb-3 form-floating">
                                <input type="text" 
                                       id='txtApellidos'
                                       name='apellidos'
                                       className="form-control form-element"
                                       placeholder="Apellidos"
                                       onChange={ (ev)=> setFormData( {...formData, apellidos:{ ...formData.apellidos, valor: ev.target.value } } ) }                                      
                                       onBlur={ValidarCajasHandler}
                                        />
                               
                                <label htmlFor='txtApellidos' className='floating-label'>Apellidos</label>
                            </div>
                        </div>
                        <div className="mb-3 form-floating">
                            <input type="email"
                                   id='txtEmail'
                                   name='email'
                                   className="form-control form-element"
                                   placeholder="Correo electrónico"
                                   onChange={ (ev)=> setFormData( {...formData, email:{ ...formData.email, valor: ev.target.value } } ) }
                                   onBlur={ValidarCajasHandler}
                                  />
                            <label htmlFor='txtEmail' className='floating-label'>Correo Electronico</label>
                        </div>
                        <div className="mb-3 form-floating">
                            <input type="password"
                                   id='txtPassword'
                                   name='password'
                                   className="form-control form-element"
                                   placeholder="Contraseña"
                                   onChange={ (ev)=> setFormData( {...formData, password:{ ...formData.password, valor: ev.target.value } } ) }                                   
                                   onBlur={ValidarCajasHandler}
                                   />
                            <label htmlFor='txtPassword' className='floating-label'>Contraseña</label>
                        </div>
                        <div className="mb-3" style={{ maxWidth: "430px" }}>
                            {/*** minicomponente para desuscribirse */}
                            <p className="text-small">
                                Te enviaremos correos electrónicos sobre ofertas
                                relacionadas con nuestros servicios periódicamente. Puedes{" "}
                                <a href="/" style={{ color: "#007bff", textDecoration: "underline" }}>
                                    cancelar la suscripción
                                </a>{" "}
                                en cualquier momento.
                            </p>
                            <p className="text-small">
                                Al seleccionar Crear cuenta personal, aceptas nuestras
                                Condiciones de uso y reconoces haber leído nuestro Aviso de
                                privacidad.
                            </p>
                        </div>
                        <button type="submit" className="mibtn w-100 mb-3" >
                            Crear cuenta personal
                        </button>
                        <div className='row mt-3 d-flex flex-row'>
                            <span className='separator-before'></span>
                            <span className='text-small inseparator'>o continua con</span>
                            <span className='separator-after'></span>
                        </div>
                        <div className='row'>
                            <div className='col'><button className='redes' style={{width: '100%'}}><i className="fa-brands fa-google"></i> Google</button></div>
                            <div className='col'><button className='redes' style={{width: '100%'}}><i className="fa-brands fa-facebook"></i> Facebook</button></div>
                            <div className='col'><button className='redes' style={{width: '100%'}}><i className="fa-brands fa-apple"></i> Apple</button></div>
                        </div>
                    </form>
                </div>
            </div>
        </div>       
    
    );
}

export default Registro;