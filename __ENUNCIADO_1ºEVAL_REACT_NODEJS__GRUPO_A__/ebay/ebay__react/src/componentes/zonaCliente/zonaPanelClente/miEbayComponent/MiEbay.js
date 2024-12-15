import './MiEbay.css'
import { useState,useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'

import useGlobalStore from '../../../../hooks_personalizados/hooks_store_zustland/storeGlobal';

function MiEbay(){
    
    const navigate=useNavigate();
    let { idPanel }=useParams(); //<---si tiene valor este parametro, vengo del header...
    
    const [activeTab, setActiveTab] = useState('Cuenta');
    const cliente=useGlobalStore(state=>state.cliente);

    useEffect(
        ()=>{
            let _selectOpcionPanel=idPanel;
            if(! _selectOpcionPanel || _selectOpcionPanel==='') _selectOpcionPanel='Cuenta'
            setActiveTab(_selectOpcionPanel);
        },[idPanel]
    )
    useEffect(
        ()=>{
            if(! cliente)   navigate('/Cliente/Login');
        },
        [ cliente, navigate ]
    );

    return (
        <div className="container">
            <div className="row mb-3">
                <div className="col">                    
                    <div className="tab-content mt-3">
                    {/* Tab de Actividad */}
                    <div className={`tab-pane fade ${activeTab === 'Actividad' ? 'show active' : ''}`}>
                        <h5>...aqui iria Actividad del usuario...</h5>
                        <p>productos vistos recientemente, Puyas y Ofertas, Listas de Seguimiento, Compras, Ventas, Busquedas guardadas, ...</p>
                    </div>

                    {/* Tab de Mensajes */}
                    <div className={`tab-pane fade ${activeTab === 'Mensajes' ? 'show active' : ''}`}>
                        <h5>...aqui irian Mensajes del usuario...</h5>
                        <p>buzon de mensajes de usuarios, de ebay, enviados, eliminados, ....</p>
                    </div>

                    {/* Tab de Cuenta */}
                    <div className={`tab-pane fade ${activeTab === 'Cuenta' ? 'show active' : ''}`}>
                        <div className="container">
                            <div className="row">
                                <div className="col-4">
                                    <h5><strong>Datos personales y privacidad</strong></h5>
                                    <ul>
                                        {
                                            [
                                            'Datos personales',
                                            'identificacion y seguridad',
                                            'Direcciones',
                                            'Mis votos',
                                            'Solicita tus datos de eBay',
                                            'Centro de resolucion'
                                            ].map(
                                                (el,pos) => (
                                                    <li key={pos}><Link to={`/Cliente/Panel/Cuenta/Datos/${el.replace(' ','_')}`}>{el}</Link></li>
                                                )
                                            )
                                        }
                                    </ul>
                                </div>
                                <div className="col-4">
                                    <h5><strong>Informacion del pago</strong></h5>
                                    <ul><li><Link to='/Cliente/Panel/Cuenta/Pagos'>Pagos</Link></li></ul>

                                </div>
                                <div className="col-4">
                                    <h5><strong>Preferencias de la cuenta</strong></h5>
                                    <ul>
                                        {
                                            [
                                            'Permisos',
                                            'Preferencias publicitarias',
                                            'Preferencias de comunicacion',
                                            'Cerrar cuenta'
                                            ].map(
                                                (el,pos) => (
                                                    <li key={pos}><Link to={`/Cliente/Panel/Cuenta/Preferencias/${el.replace(' ','_')}`}>{el}</Link></li>
                                                )
                                            )
                                        }
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>                    

                </div>
            </div>
        </div>
    )
}

export default MiEbay