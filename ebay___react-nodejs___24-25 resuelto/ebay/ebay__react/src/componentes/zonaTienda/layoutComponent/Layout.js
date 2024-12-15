import './Layout.css'
import { Outlet, useLoaderData } from 'react-router-dom'

import Header from './headerComponent/Header'
import Footer from './footerComponent/Footer'

function Layout(){
    const _categorias=useLoaderData(); //<---- en la variable _categorias recupero el resultado de la ejecucion de la funcion asincrona del loader
    return (
        <>
            <Header categorias={_categorias} ></Header>
                <div className='container-fluid'>
                    <div className='row'>
                        <div className='col'>
                            <Outlet></Outlet>
                        </div>
                    </div>
                </div>
            <Footer></Footer>
        </>
    )
}

export default Layout