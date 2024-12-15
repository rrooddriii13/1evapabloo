import './Login.css'
import { useState} from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom';

import   restCliente  from '../../../servicios/restCliente'

//importarmos hook para hacer uso del state-global definido por zustand
import useGlobaStore from '../../../hooks_personalizados/hooks_store_zustland/storeGlobal';

function Login(){
    //-------variables state global zustand ---------
    // const accessToken=useGlobaStore( state => state.accessToken);
    // const refreshToken=useGlobaStore( state => state.refreshToken);
    const stateGlobal=useGlobaStore(state => state);
    console.log('valor del state global....', stateGlobal);

    const setAccessToken=useGlobaStore( state => state.setAccessToken);
    const setRefreshToken=useGlobaStore( state => state.setRefreshToken);
    const setCliente=useGlobaStore(state => state.setCliente);

    //--------variables state local------------------
    const [emailUser, setEmailUser]=useState('');
    const [emailValido, setEmailValido]=useState(false);
    const [passwdUser, setPasswdUser]=useState('');

    //hook useNavigate de react-router-dom q devuelve funcion "navigate" para provocar el salto a un componente desde codigo
    const navigate=useNavigate();

    async function HandlerClickButtons(ev){
        let _nombreBoton=ev.target.name;
        //let _email=document.getElementById('txtEmail').value; //<----- nunca hacerlo asi, usar el state
        
        console.log('Has pulsado el boton....', _nombreBoton);

        switch (_nombreBoton) {
            case 'Continuar':
                //recoger el valor de la caja de texto email, llamar al servicio de nodejs para comprobar si existe o no y si existe
                //mostrar el componente para introducir contraseña...
                try {
                    let _respuestaServer=await restCliente.ComprobarEmail(emailUser); //<--- la promesa de Fecth devuleve un objeto RESPONSE
                    //ese objeto RESPONSE tiene headers+body; para extraer el body tienes  metodos del objeto RESPONSE,p.e si es un objeto json
                    //tienes el metodo .json(). Este metodo te da la PROMESA de un objeto JSON incluido en el body, su lectura es asincrona
                    let _bodyRespuesta=await _respuestaServer.json();
                    console.log('respuesta del server cuando comprueba si EXISTE EMAIL...', _bodyRespuesta);
                    
                    if (_bodyRespuesta.codigo===0) {
                        setEmailValido(true);
                    } else {
                         setEmailValido(false);
                         throw new Error('Email no existe')   
                    }
                    
                } catch (error) {
                    console.log('error en respuesta servicio de nodejs al comprobar email...',error);                    
                }

                break;

                
            case 'google':
                break;

            case 'facebook':
                break
        
            default:
                break;
        }
    }

    async function HandlerFullLogin(){
        //codigo para comprobar en servicio de nodejs si email + password estan ok...
        try {
            let _respLogin=await restCliente.LoginCliente(emailUser, passwdUser); //<---{ codigo:..., mensaje: ...,  datos: { accessToken:..., refreshToken:..., cliente: { ....}} }
            console.log('respuesta del servicio de login de nodejs...', _respLogin);
            
            if (_respLogin.codigo !==0 ) throw new Error('password o email invalidos...intentalo de nuevo');
            
            setAccessToken(_respLogin.datos.accessToken);
            setRefreshToken(_respLogin.datos.refreshToken);
            setCliente( _respLogin.datos.cliente );

            navigate('/');
            
        } catch (error) {
            //mostrar error en vista del componente en rojo....para q intente meter de nuevo password
            console.log('error en login...', error);
        }
    }

    return (
        <div className="container-fluid">
            <div className='row mt-4'>
                <div className='col-3'><Link to="/Tienda/Productos"><img src='/images/logo_ebay.png' alt='loge Ebay'/> </Link></div>
            </div>
            {
                ! emailValido ? (
                    <>
                        <div className='row mt-4'>
                            <div className="col-4"></div>
                            <div className="col-3 d-flex flex-row justify-content-center"><h2 className='title'>Identificate en tu cuenta</h2></div>
                        </div>   
                        <div className='row'>
                            <div className="col-4"></div>
                            <div className="col-3 d-flex flex-row justify-content-center"><span className="sub-heading">¿Primera vez en eBay?</span>{'  '}<NavLink to='/Cliente/Registro'>Crea una cuenta</NavLink></div>
                        </div> 
                        <div className='row mt-4'>
                            <div className='col-4'></div>
                            <div className='col-3'>
                                <div className="form-floating mb-3">
                                    <input type="email" 
                                        className="form-control"
                                        id="txtEmail"
                                        placeholder="name@example.com"
                                        onChange={ (ev)=> setEmailUser(ev.target.value) }
                                        />
                                    <label htmlFor="txtEmail">Correo electronico o pseudonimo</label>
                                </div>
                            </div>
                        </div>
                        {
                            /* para crear botones de Continuar ... un bucle, pero en JSX no puedo pone for, necesito funcion .map() de array*/
                            ["Continuar", "facebook", "google", "apple"].map(
                                (elemento,posicion,arr)=>{
                                    return <div className='row mt-2' key={posicion}>
                                                <div className='col-4'></div>                                    
                                                <div className='col-3'>
                                                    <button type='button'
                                                            name={elemento}
                                                            className={`w-100 ${ elemento === 'Continuar' || elemento === 'facebook' ? 'mibtn': 'mibtn-light'} `}
                                                            onClick={HandlerClickButtons}        
                                                    >
                                                            <i className={`fa-brands fa-${elemento} fa-2xl`}></i>{'  '}
                                                            Continuar { elemento !== 'Continuar' && `con ${elemento}`}
                                                    </button>
                                                </div>
                                        </div>      
                                }  
                            )
                        }                    
                    </>
                ) : 
                (
                    <>
                        <div className='row mt-4'>
                            <div className='col-4'></div>
                            <div className='col-3'><h3>Hola de nuevo</h3></div>
                        </div>
                        <div className='row mt-4'>
                            <div className='col-4'></div>
                            <div className='col-3'>
                                <span>{emailUser}</span>{' '}<a href='/'>Cambiar de cuenta</a>
                            </div>
                        </div>
                        <div className='row mt-4'>
                            <div className='col-4'></div>
                            <div className='col-3'>
                                <div className="form-floating mb-3">
                                    <input type="password" 
                                        className="form-control"
                                        id="txtPassword"
                                        onChange={ (ev)=> setPasswdUser(ev.target.value) }
                                        />
                                    <label htmlFor="txtPassword">Contraseña</label>
                                </div>
                            </div>
                        </div>
                        <div className='row mt-4'>
                            <div className='col-4'></div>
                            <div className='col-3'>
                                <button type='button'
                                        className='mibtn mibtn-light w-100'
                                        onClick={HandlerFullLogin}
                                >
                                    Identificate
                                </button>
                            </div>
                        </div>                                      
                        <div className='row mt-4'>
                            <div className='col-4'></div>
                            <div className='col-3'>
                                <a href='/'>Restablecer contraseña</a>
                            </div>
                        </div>                        
                    </>
                )                
            }
        </div>
    )
}

export default Login;