import MiniDireccion from '../miniDireccionComponent/MiniDireccion';
import './MostrarDirec.css'
import { useEffect, useState } from 'react';

import useGlobaStore from  '../../../../../../../hooks_personalizados/hooks_store_zustland/storeGlobal';
import restCliente from '../../../../../../../servicios/restCliente';

function MostrarDirec(){

    const [showModal, setShowModal] = useState(false);
    const cliente = useGlobaStore(state => state.cliente);
    const [direcciones, setDirecciones] = useState([]);
    const agregarDireccion = useGlobaStore(state => state.añadirDireccion);
    const [nuevaDireccion, setNuevaDireccion] = useState({
        pais: '',
        nombreCliente: '',
        calle: '',
        cp: '',
        provincia: '',
        municipio: '',
        telefono: ''
    });
    const [provincias, setProvincias] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    //const setDirecciones = useGlobaStore(state => state.setDirecciones);

    useEffect(() => {
        if (cliente && cliente.direcciones) {
            setDirecciones(cliente.direcciones);
        }
    }, [cliente]);

    //al Servicio REST
    // useEffect(() => {
    //     return () => {
    //         restCliente.actualizarDirecciones(cliente.direcciones);
    //     };
    // }, [cliente]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNuevaDireccion({ ...nuevaDireccion, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        agregarDireccion(nuevaDireccion);
        setShowModal(false);
    };

    const cargarProvincias = async () => {
        const response = await fetch('http://localhost:6666/api/GeoApi/ListaProvincias', {
            headers: {
                // 'Authorization': `Bearer ${accessToken}`
                'Authorization': `Bearer ${restCliente.obtenerAccessToken()}`

            }
        });
        const data = await response.json();
        setProvincias(data.datos.provincias);
    };

    const cargarMunicipios = async (codProv) => {
        const response = await fetch(`http://localhost:6666/api/GeoApi/ListaMunicipios?codProv=${codProv}`, {
            headers: {
                // 'Authorization': `Bearer ${accessToken}`
                'Authorization': `Bearer ${restCliente.obtenerAccessToken()}`

            }
        });
        const data = await response.json();
        setMunicipios(data.datos.municipios);
    };

    useEffect(() => {
        cargarProvincias();
    }, []);

    useEffect(() => {
        if (nuevaDireccion.provincia) {
            cargarMunicipios(nuevaDireccion.provincia);
        }
    }, [nuevaDireccion.provincia]);

    return (
        <div className="container">

            <div className="row">
                <div className="col-2"></div>
                <div className="col-8">
                    <h4><strong>Direccion de ...tipo de direccion: envio, devoluciones, etc ...</strong></h4>
                    {/* aqui por cada direccion del cliente de envio, etc...un objeto miniDireccion si los tuviera, si no mostrar etiqueta azul q no tiene direcciones de ese tipo */}
                    {/* <p style={{'backgroundColor':'#3665f3', 'color':'#fff'}}>
                        <i className="fa-solid fa-circle-info"></i> No tenemos tu direccion. Añade una dirección nueva.
                    </p> */}
                     {direcciones.length === 0 ? (
                        <p style={{'backgroundColor':'#3665f3', 'color':'#fff'}}><i className="fa-solid fa-circle-info"></i> No tenemos tu direccion. Añade una dirección nueva.</p>
                    ) : (
                        direcciones.map((direccion, index) => (
                            <MiniDireccion key={index} direccion={direccion} />
                        ))
                    )}
                    {/* <MiniDireccion></MiniDireccion> */}
                </div>
            </div>


            <div className="row mt-3">
                <div className="col-2"></div>
                <div className="col-8 d-flex flex-row justify-content-end">
                    <button className='btn btn-link' onClick={()=>setShowModal(true)}>Añadir otra direccion</button>
                </div>
            </div>

            {/* Modal para el formulario de modificar/añadir direccion */}
            <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">

                    <div className="modal-header">
                        {/* tendras q poner en el titulo del modal si estas añadiendo una direccion nueva o modificando una existente */}
                        <h3 className="modal-title">Añadir/Modifcar direccion</h3>
                        <button type="button" className="btn-close" aria-label="Close" onClick={()=>setShowModal(false)}></button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="row">
                            <div className="col-md-6">
                                <label htmlFor="pais" className="form-label ">Pais</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="pais"
                                    name="pais"
                                    placeholder='España'
                                />
                            </div>
                        </div>

                        <div className="row mt-3">  
                            <div className="col-md-12">
                                <label htmlFor="nombreCliente" className="form-label ">Nombre y Apellidos:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="nombreCliente"
                                    name="nombreCliente"
                                />
                            </div>
                        </div>

                        <div className="row mt-3">  
                            <div className="col-md-9">
                                <label htmlFor="calle" className="form-label ">Calle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="calle"
                                    name="calle"
                                />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="cp" className="form-label ">Codigo postal</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="cp"
                                    name="cp"
                                />
                            </div>
                        </div>

                        <div className="row mt-3">  
                            <div className="col-md-6">
                                <label htmlFor="provincia" className="form-label ">Provincia</label>
                                <select 
                                    className="form-select"
                                    id="provincia"
                                    name="provincia"                                
                                >
                                    <option value=''>...carga provincias...</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="municipio" className="form-label ">Municipio</label>
                                <select 
                                    className="form-select"
                                    id="municipio"
                                    name="municipio"                                
                                >
                                    <option value=''>...carga municipios...</option>
                                </select>
                            </div>
                        </div>

                        <div className="row mt-3">  
                            <div className="col-md-6">
                                <label htmlFor="telefono" className="form-label ">Numero de telefono</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="telefono"
                                    name="telefono"
                                    placeholder='+XX XXX XX XX XX'
                                />
                            </div>
                        </div>                        
                    </div>

                    <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" style={{ 'borderRadius': '30px' }} onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-primary" style={{ 'borderRadius': '30px' }} onClick={() => setShowModal(false)}>
                                Guardar
                            </button>
                    </div>

                </div>
            </div>
            </div>            

        </div>
    )

}

 export default MostrarDirec;
// import  { useState, useEffect } from 'react';
// import useGlobaStore from  '../../../../../../../hooks_personalizados/hooks_store_zustland/storeGlobal';
// import restCliente from '../../../../../../../servicios/restCliente';
// import MiniDireccion from '../miniDireccionComponent/MiniDireccion';
// import restGeoApi from '../../../../../../../servicios/restGeoApi';
// function MostrarDirec() {
//     const cliente = useGlobaStore(state => state.cliente);
//     const [direcciones, setDirecciones] = useState([]);
//     const [showModal, setShowModal] = useState(false);
//     const [provincias, setProvincias] = useState([]);
//     const [municipios, setMunicipios] = useState([]);
//     const [selectedProvincia, setSelectedProvincia] = useState('');
//     const [newDireccion, setNewDireccion] = useState({
//         pais: 'España',
//         nombreCliente: '',
//         calle: '',
//         cp: '',
//         provincia: '',
//         municipio: '',
//         telefono: '',
//     });

//     useEffect(() => {
//         if (cliente && cliente.direcciones) {
//             setDirecciones(cliente.direcciones);
//         }
//     }, [cliente]);

//     useEffect(() => {
//         restGeoApi.getAccessToken().then(token => {
//             restGeoApi.getProvincias(token).then(provincias => setProvincias(provincias));
//         });
//     }, []);

//     useEffect(() => {
//         if (selectedProvincia) {
//             restGeoApi.getAccessToken().then(token => {
//                 restGeoApi.getMunicipios(token, selectedProvincia).then(municipios => setMunicipios(municipios));
//             });
//         }
//     }, [selectedProvincia]);

//     const handleAddDireccion = () => {
//         useGlobaStore.getState().addDireccion(newDireccion);
//         setShowModal(false);
//     };

//     return (
//         <div className="container">
//             <div className="row">
//                 <div className="col-2"></div>
//                 <div className="col-8">
//                     <h4><strong>Direccion de envío</strong></h4>
//                     {direcciones.length === 0 ? (
//                         <p style={{ 'backgroundColor': '#3665f3', 'color': '#fff' }}><i className="fa-solid fa-circle-info"></i> No tenemos tu dirección. Añade una dirección nueva.</p>
//                     ) : (
//                         direcciones.map((dir, index) => (
//                             <MiniDireccion key={index} direccion={dir} />
//                         ))
//                     )}
//                 </div>
//             </div>
//             <div className="row mt-3">
//                 <div className="col-2"></div>
//                 <div className="col-8 d-flex flex-row justify-content-end">
//                     <button className='btn btn-link' onClick={() => setShowModal(true)}>Añadir otra dirección</button>
//                 </div>
//             </div>
//             {/* Modal para el formulario de modificar/añadir dirección */}
//             <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
//                 <div className="modal-dialog modal-dialog-centered modal-lg">
//                     <div className="modal-content">
//                         <div className="modal-header">
//                             <h3 className="modal-title">Añadir/Modificar dirección</h3>
//                             <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)}></button>
//                         </div>
//                         <div className="modal-body">
//                             <div className="row">
//                                 <div className="col-md-6">
//                                     <label htmlFor="pais" className="form-label ">Pais</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         id="pais"
//                                         name="pais"
//                                         placeholder='España'
//                                         value={newDireccion.pais}
//                                         onChange={(e) => setNewDireccion({ ...newDireccion, pais: e.target.value })}
//                                     />
//                                 </div>
//                             </div>
//                             <div className="row mt-3">
//                                 <div className="col-md-12">
//                                     <label htmlFor="nombreCliente" className="form-label ">Nombre y Apellidos:</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         id="nombreCliente"
//                                         name="nombreCliente"
//                                         value={newDireccion.nombreCliente}
//                                         onChange={(e) => setNewDireccion({ ...newDireccion, nombreCliente: e.target.value })}
//                                     />
//                                 </div>
//                             </div>
//                             <div className="row mt-3">
//                                 <div className="col-md-9">
//                                     <label htmlFor="calle" className="form-label ">Calle</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         id="calle"
//                                         name="calle"
//                                         value={newDireccion.calle}
//                                         onChange={(e) => setNewDireccion({ ...newDireccion, calle: e.target.value })}
//                                     />
//                                 </div>
//                                 <div className="col-md-3">
//                                     <label htmlFor="cp" className="form-label ">Codigo postal</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         id="cp"
//                                         name="cp"
//                                         value={newDireccion.cp}
//                                         onChange={(e) => setNewDireccion({ ...newDireccion, cp: e.target.value })}
//                                     />
//                                 </div>
//                             </div>
//                             <div className="row mt-3">
//                                 <div className="col-md-6">
//                                     <label htmlFor="provincia" className="form-label ">Provincia</label>
//                                     <select
//                                         className="form-select"
//                                         id="provincia"
//                                         name="provincia"
//                                         value={selectedProvincia}
//                                         onChange={(e) => setSelectedProvincia(e.target.value)}
//                                     >
//                                         <option value=''>...carga provincias...</option>
//                                         {provincias.map(provincia => (
//                                             <option key={provincia.CPRO} value={provincia.CPRO}>{provincia.PRO}</option>
//                                         ))}
//                                     </select>
//                                 </div>
//                                 <div className="col-md-6">
//                                     <label htmlFor="municipio" className="form-label ">Municipio</label>
//                                     <select
//                                         className="form-select"
//                                         id="municipio"
//                                         name="municipio"
//                                         value={newDireccion.municipio}
//                                         onChange={(e) => setNewDireccion({ ...newDireccion, municipio: e.target.value })}
//                                     >
//                                         <option value=''>...carga municipios...</option>
//                                         {municipios.map(municipio => (
//                                             <option key={municipio.CMUM} value={municipio.DMUN50}>{municipio.DMUN50}</option>
//                                         ))}
//                                     </select>
//                                 </div>
//                             </div>
//                             <div className="row mt-3">
//                                 <div className="col-md-6">
//                                     <label htmlFor="telefono" className="form-label ">Numero de telefono</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         id="telefono"
//                                         name="telefono"
//                                         placeholder='+XX XXX XX XX XX'
//                                         value={newDireccion.telefono}
//                                         onChange={(e) => setNewDireccion({ ...newDireccion, telefono: e.target.value })}
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="modal-footer">
//                             <button type="button" className="btn btn-outline-secondary" style={{ 'borderRadius': '30px' }} onClick={() => setShowModal(false)}>
//                                 Cancelar
//                             </button>
//                             <button type="button" className="btn btn-primary" style={{ 'borderRadius': '30px' }} onClick={handleAddDireccion}>
//                                 Guardar
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default MostrarDirec;