

import useGlobaStore from  '../../../../../../../hooks_personalizados/hooks_store_zustland/storeGlobal';
import React from 'react';
import './MiniDireccion.css';

function MiniDireccion({ direccion, index }) {
    const deleteDireccion = useGlobaStore(state => state.deleteDireccion);

    const handleDelete = () => {
        deleteDireccion(index);
    };

    return (
        <div className="card">
            <div className="row g-0">
                <div className="col-md-8">
                    <div className="card-body">
                        <p className="card-title"><strong>{direccion.nombreCliente}</strong></p>
                        <p className="card-text">
                            {direccion.calle}<br />
                            {direccion.municipio}, {direccion.provincia} {direccion.cp}<br />
                            {direccion.pais}<br />
                            {direccion.telefono}
                        </p>
                    </div>
                </div>
                <div className="col-md-4 d-flex flex-column justify-content-center p-3">
                    <button className="btn btn-sm btn-outline-danger" style={{ 'borderRadius': '30px' }} onClick={handleDelete}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default MiniDireccion;