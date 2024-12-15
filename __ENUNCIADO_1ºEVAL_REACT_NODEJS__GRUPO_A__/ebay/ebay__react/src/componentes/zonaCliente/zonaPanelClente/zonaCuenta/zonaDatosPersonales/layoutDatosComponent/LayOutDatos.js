import './LayOutDatos.css'
import { useState, useEffect } from 'react';

import { useLocation, Link, Outlet } from 'react-router-dom'

function LayOutDatos(){
    const location=useLocation();
    const [ cat, setCat ]=useState();
    
    useEffect(
        ()=>{
            const _cat=location.pathname.split('/').pop();
            setCat(_cat);
        },[location]
    )

    return (
        <div className="container">
            <div className="row mb-5">
                {/* panel lateral opciones acceso Datos Personales de la cuenta */}
                <div className="col-3">
                    <div className="list-group list-group-flush">
                        {
                            [
                                'Datos Personales',
                                'Identificacion y seguridad',
                                'Direcciones',
                                'Mis votos',
                                'Centro de resolucion',
                                'Pagos',
                                'Permisos',
                                'Preferencias de comunicacion',
                                'Panel de rendimiento del vendedor',
                                'Cuenta de vendedor',
                                'Suscripciones',
                                'Preferencias publicitarias',
                                'Cerrar cuenta'
                            ].map(
                                (el,pos)=>(
                                    <Link key={pos} 
                                            to={`/Cliente/Panel/Cuenta/Datos/${el.replace(' ','_')}`}
                                            className={ `list-group-item list-group-item-action ${cat===el.replace(' ','_') ? 'active': '' }`}>
                                        {el}
                                    </Link>
                                )
                            )
                        }
                    </div>                    

                </div>

                {/* visualizacion de datos personales, direcciones, pagos, permisos,... */}
                <div className="col-9">
                    <Outlet></Outlet>
                </div>
            </div>
        </div>
    )
}

export default LayOutDatos