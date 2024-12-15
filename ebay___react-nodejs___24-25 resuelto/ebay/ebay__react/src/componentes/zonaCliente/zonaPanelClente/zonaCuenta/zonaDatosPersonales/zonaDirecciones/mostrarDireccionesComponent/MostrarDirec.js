import MiniDireccion from '../miniDireccionComponent/MiniDireccion';
import './MostrarDirec.css'
import { useState, useEffect, useRef } from 'react';
import { useLoaderData, useSearchParams } from 'react-router-dom'

import useGlobalStore from '../../../../../../../hooks_personalizados/hooks_store_zustland/storeGlobal';
import restGeoApi from '../../../../../../../servicios/restGeoApi';
import restCliente from '../../../../../../../servicios/restCliente';

function MostrarDirec(){

    const provincias=useLoaderData();
    let [searchParams, setSearchParams] = useSearchParams();

    const _initialDirec={ 
                        operacion: 'añadir',
                        calle:'',
                        cp:'',
                        municipio: {CPRO:'', CMUM:'', DMUN50:'', CUN:''},
                        provincia: {CPRO:'', CCOM:'', PRO:''},
                        pais: '',
                        datosContacto: { nombre:'', apellidos:'', email:'', telefono:'', observaciones:''},
                        esPrincipal: false,
                        esFacturacion: false
                    } ;

    //--------- state local-------------------------------------------------------
    const [showModal, setShowModal] = useState(false);
    const [ direcModal, setDirecModal ] = useState( { ..._initialDirec } );
    const [ municipios, setMunicipios ] = useState( [] );
    const [ provSelect, setProvSelect ] = useState( { CPRO:'', PRO:'', CCOM: '' });
    const [ muniSelect, setMuniSelect ] = useState( { CMUM:'', CPRO:'', DMUN50:'', CUN:''} )

    //--------- state global de zustand -------------------------------------------
    const cliente=useGlobalStore(state => state.cliente);
    const setDireccionesCliente=useGlobalStore(state =>state.setDireccionesCliente );

    //--------referencias a elementos del DOM ----------
    let _selectProvRef=useRef(null); //<----referencia al nodo del dom <select id="inputProvincia"...>
    let _selectMuniRef=useRef(null); //<----referencia al nodo del dom <select id="inputMunicipio"...>

    useEffect(
        ()=>{
            //efecto que se ejecuta cuando se descarga componente, y q aprovechamos para volcar las direcciones q hay en zustand en nodejs con el servicio
            return ()=>{
                console.log('a volcar estas direcciones del cliente...', cliente._id, cliente.direcciones);
                restCliente.ActualizarDirecciones(cliente._id, cliente.direcciones)
                            .then( resp => console.log('resultado actualizacion direcciones...', resp))
                            .catch( err => console.log('error actualizacion direcciones...', err) );
            }
        },[]
    )

    useEffect(
        ()=>{
            console.log('provincia seleccionada y dirmodal en useeffect...', provSelect, direcModal);

            if(direcModal.operacion === 'modificar'){
                _selectProvRef.current.value=direcModal.provincia.CCOM + '-' + direcModal.provincia.CPRO + '-' + direcModal.provincia.PRO;
            }

            if(provSelect.CPRO !== ''){
                setDirecModal({...direcModal,  provincia: {...direcModal.provincia, ...provSelect} } );
                restGeoApi.GetMunicipios(provSelect.CPRO)
                .then( munis => {
                                  setMunicipios(munis);
                                  //dejo un intervalo de tiempo para q se carguen municipios en el select, y si estoy en modificar ya selecciono sobre el mismo el municipio a modif
                                  setTimeout(
                                    ()=>{
                                        if(direcModal.operacion === 'modificar'){
                                            _selectMuniRef.current.value=direcModal.municipio.CPRO + '-' + direcModal.municipio.CMUM + '-' + direcModal.municipio.DMUN50;
                                        }      
                                    },1000
                                  );
                              }
                       )
                .catch( error => console.log('en efecto componente MostrarDirec cuando intento recup.municipios de prov: ', provSelect, error) );
            }
        }
        , [provSelect]
    )

    useEffect(
        ()=>{
            console.log('municipio seleccionada y dirmodal en useeffect...', muniSelect, direcModal);
            setDirecModal({...direcModal, municipio: {...direcModal.municipio, ...muniSelect} } );
        }
        ,[muniSelect]
    )


    function GuardarDatosDirec(){
        console.log('en GuardarDatosDirec del formMOdal:  direcModal a añadir a zustand...',direcModal);

        //----------actualizamos state-global prop.direcciones cliente ----------
        setDireccionesCliente(direcModal.operacion, direcModal);

        //---------inicializamos state-local direcModal para emprezar de nuevo a crear/modificar otra direccion ------------
        setDirecModal( {..._initialDirec } )
    }


    return (
        <div className="container">

            <div className="row">
                <div className="col-2"></div>
                <div className="col-8">
                    <h4><strong>Direccion de {searchParams.get('tipo')}</strong></h4>
                    {
                        /* aqui por cada direccion del cliente de envio, etc...un objeto miniDireccion si los tuviera, si no mostrar etiqueta azul q no tiene direcciones de ese tipo */
                        cliente.direcciones && cliente.direcciones.length > 0 ? 
                        (
                            cliente.direcciones.map(
                                (direc,pos) => (
                                    <div key={pos} className='mb-3'>
                                        <MiniDireccion direccion={direc} 
                                                        pos={pos}
                                                        setDireccionesCliente={setDireccionesCliente}
                                                        setShowModal={setShowModal}
                                                        setDirecModal={setDirecModal}
                                                        setProvSelect={setProvSelect}></MiniDireccion>
                                    </div>
                                )
                            )

                        ) :
                        (
                            <p style={{'backgroundColor':'#3665f3', 'color':'#fff'}}><i className="fa-solid fa-circle-info"></i> No tenemos tu direccion. Añade una dirección nueva.</p>
                        ) 
                    }
                </div>
            </div>


            <div className="row">
                <div className="col-2"></div>
                <div className="col-8 d-flex flex-row justify-content-end">
                    <button className='btn btn-link' onClick={()=>{ setDirecModal( {..._initialDirec } ); console.log('en click Añadir direccion, direcModal vale...', direcModal); setShowModal(true); }}>Añadir otra direccion</button>
                </div>
            </div>

            {/* Modal para el formulario de modificar/añadir direccion */}
            <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">

                    <div className="modal-header">
                        {/* tendras q poner en el titulo del modal si estas añadiendo una direccion nueva o modificando una existente */}
                        <h3 className="modal-title">{direcModal.operacion} direccion</h3>
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
                                    placeholder={direcModal.pais || 'España' }
                                    //value={direcModal.pais || 'España'}                                    
                                    onChange={ (ev)=>setDirecModal({...direcModal, pais: ev.target.value}) }
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
                                    placeholder={direcModal.datosContacto.nombre + ' ' + direcModal.datosContacto.apellidos}
                                    //value={direcModal.datosContacto.nombre + '' + direcModal.datosContacto.apellidos}
                                    onChange={ (ev)=>setDirecModal({...direcModal, datosContacto: { ...direcModal.datosContacto, nombre: ev.target.value.split(' ')[0], apellidos:ev.target.value.split(' ').slice(1).join(' ')  }}) }
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
                                    placeholder={direcModal.calle}
                                    //value={direcModal.calle}
                                    onChange={ (ev)=>setDirecModal({...direcModal, calle: ev.target.value}) }
                                />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="cp" className="form-label ">Codigo postal</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="cp"
                                    name="cp"
                                    placeholder={ direcModal.cp || '' }
                                    //value={direcModal.cp}
                                    onChange={ (ev)=>setDirecModal({...direcModal, cp: ev.target.value}) }
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
                                    ref={_selectProvRef}
                                    onChange={(ev)=> { setProvSelect(
                                                                    {
                                                                        ...provSelect,
                                                                        CCOM:ev.target.value.split('-')[0],
                                                                        CPRO: ev.target.value.split('-')[1],
                                                                        PRO: ev.target.value.split('-')[2]
                                                                    }
                                                                );
                                                        console.log('provSelect en el onchange del select provs...', provSelect);
                                                        // setDirecModal({...direcModal,  provincia: {...direcModal.provincia, ...provSelect} } );
                                                    }
                                            }
                                >
                                    <option value='-1'>Selecciona una provincia</option>
                                    {
                                        provincias.length > 0 && provincias.map(
                                                                        (prov,pos)=>(
                                                                                        <option key={pos} value={`${prov.CCOM}-${prov.CPRO}-${prov.PRO}`}>{prov.PRO}</option>
                                                                                    )
                                                                                )
                                    }
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="municipio" className="form-label ">Municipio</label>
                                <select 
                                    className="form-select"
                                    id="municipio"
                                    name="municipio"
                                    ref={_selectMuniRef}
                                    onChange={ ev => { setMuniSelect(
                                                                        {
                                                                            ...muniSelect,                                                        
                                                                            CPRO: ev.target.value.split('-')[0],
                                                                            CMUM: ev.target.value.split('-')[1],
                                                                            DMUN50: ev.target.value.split('-')[2]                                
                                                                        }
                                                                    );
                                                        // setDirecModal({...direcModal, municipio: {...direcModal.municipio, ...muniSelect} } );
                                                    }
                                    }                                
                                >
                                    <option value='-1'>Selecciona Municipio</option>
                                    {
                                        municipios.length > 0 && municipios.map(
                                                                                (muni,pos)=>(
                                                                                    <option key={pos} value={`${muni.CPRO}-${muni.CMUM}-${muni.DMUN50}`}>{muni.DMUN50}</option>
                                                                                )
                                                                            )
                                    }
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
                                    placeholder={direcModal.datosContacto.telefono || '+XX XXX XX XX XX'}
                                    //value={direcModal.datosContacto.telefono || '+XX XXX XX XX XX'}
                                    onChange={ (ev)=>setDirecModal({...direcModal, datosContacto: { ...direcModal.datosContacto, telefono: ev.target.value }}) }
                                />
                            </div>
                        </div>                        
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" style={{'borderRadius':'30px'}} onClick={()=>setShowModal(false)}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-primary"style={{'borderRadius':'30px'}}  onClick={()=>{ setShowModal(false); GuardarDatosDirec(); } }>
                            Guardar
                        </button>
                    </div>

                </div>
            </div>
            </div>            

        </div>
    )

}

export default MostrarDirec