import './MiniDireccion.css'

function MiniDireccion({direccion, pos, setDireccionesCliente, setShowModal, setDirecModal, setProvSelect }){
    return (
        <div className="card">
            <div className="row g-0">
                
                <div className="col-md-8">
                    <div className="card-body">
                        <p className="card-title"><strong>{direccion.datosContacto.nombre} {direccion.datosContacto.apellidos}</strong></p>
                        <p className="card-tezt">
                            {direccion.calle}<br></br>
                            {direccion.municipio.DMUN50}, {direccion.provincia.PRO} {direccion.cp}<br></br>
                            {direccion.pais}<br></br>
                            {direccion.datosContacto.telefono}
                        </p>
                    </div>
                </div>

                <div className="col-md-4 d-flex flex-column justify-content-end p-3">
                    <button className="btn btn-outline-primary mb-2" 
                            style={{'borderRadius':'30px'}}
                            onClick={()=>{ setShowModal(true); setDirecModal( { ...direccion, operacion: 'modificar', pos } ); setProvSelect({...direccion.provincia})}}
                            >
                        Modificar
                    </button>
                    <button className="btn btn-outline-danger" 
                            style={{'borderRadius':'30px'}}
                            onClick={ () => setDireccionesCliente('eliminar',direccion) }>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    )
}


export default MiniDireccion