import './Direcciones.css'
import {useNavigate} from 'react-router-dom'

function Direcciones(){
    const navigate=useNavigate();

    const _dirsTipo=[
        { 
            tipo:'Direccion postal, direccion de correo electronico y telefono de registro', 
            comentario:'Tu direccion de contacto principal. Es importante mantenerla actualizada.',
            param:'REGISTRO'
        },
        { 
            tipo:'Direccion de envio',
            comentario:'Tu direccion de envio principal para compras. Es donde recibes los articulos que has comprado',
            param:'ENVIO'
        },
        { 
            tipo:'Direccion del emisor',
            comentario:'Direccion principal desde la que envias tus paquetes.',
            param: 'VENTA'
        },
        { 
            tipo:'Direccion de devolucion',
            comentario:'Tus direcciones principales para que los compradores devuelvan los articulos.',
            param: 'DEVOLUCION'
        },
        { 
            tipo:'Direccion de pago y recogida', 
            comentario:'Direccion de recogida para las formas de pago no electrónicas como el pago en efectivo al recoger el artículo o cheques personales.',
            param: 'RECOGIDA'
        },
    ];

    return (
        <div className="container">
            <div className="row"><div className="col"><h4><strong>Direcciones</strong></h4></div></div>
            <hr></hr>
            {
                _dirsTipo.map(
                    (el,pos)=>(
                        <div className="container" key={pos}>
                            <div className="row">
                                <div className="col-10">
                                    <p>
                                        <strong>{el.tipo}</strong><br></br>
                                        <span className='text-mutted text-small'>{el.comentario}</span>
                                    </p>
                                </div>
                                <div className="col-2">
                                    <button className="btn btn-outline-primary" style={{'borderRadius':'30px'}} onClick={()=>navigate(`/Cliente/Panel/Cuenta/Datos/MostrarDireccion?tipo=${el.param}`)}>Modificar</button>
                                </div>
                                <hr></hr>
                            </div>
                        </div>
                    )
                )
            }
        </div>
    )
}

export default Direcciones