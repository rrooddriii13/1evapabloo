import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Login from './componentes/zonaCliente/loginComponent/Login'
import Registro from './componentes/zonaCliente/registroComponent/Registro'
import Layout from './componentes/zonaTienda/layoutComponent/Layout';
import MostrarProducto from './componentes/zonaTienda/mostrarProductoComponent/MostrarProducto';
import Productos from './componentes/zonaTienda/productosComponent/Productos';
import Principal from './componentes/zonaTienda/principalComponent/Principal';
import ComprarYa from './componentes/zonaTienda/comprarProductoYaComponent/ComprarYa';
import MiEbay from './componentes/zonaCliente/zonaPanelClente/miEbayComponent/MiEbay';
import Direcciones from './componentes/zonaCliente/zonaPanelClente/zonaCuenta/zonaDatosPersonales/zonaDirecciones/direccionesComponent/Direcciones';
import LayOutDatos from './componentes/zonaCliente/zonaPanelClente/zonaCuenta/zonaDatosPersonales/layoutDatosComponent/LayOutDatos';
import MostrarDirec from './componentes/zonaCliente/zonaPanelClente/zonaCuenta/zonaDatosPersonales/zonaDirecciones/mostrarDireccionesComponent/MostrarDirec';


import restTienda from './servicios/restTienda';
import restGeoApi from './servicios/restGeoApi';

//array de objetos Route a pasar al metodo createBrowserRouter(...); cada objeto Route representa la carga de un
//componente ante una URL del navegador
const _routerObject=createBrowserRouter(
  [
    {
      element: <Layout></Layout>,
      loader: restTienda.DevolverCategorias,
      children:[
        { path:'/', element: <Principal></Principal>},//<Navigate to='/Tienda/Productos'/>}, 
        { path:'/Tienda/Productos/:catId', element: <Productos></Productos>,loader: restTienda.RecuperarProductosFromCat },
        { path: '/Tienda/MostrarProducto/:idProd', element: <MostrarProducto></MostrarProducto>, loader: restTienda.RecuperarProducto },
        //---------------- del exam --------------------------------------
        { path:'/Cliente/Panel/MieBay/:idPanel?', element: <MiEbay></MiEbay> },
        {
          path:'/Cliente/Panel/Cuenta/Datos',
          element: <LayOutDatos></LayOutDatos>,
          children:[
                    { path:'Direcciones', element: <Direcciones></Direcciones>},
                    { path:'MostrarDireccion', element: <MostrarDirec></MostrarDirec>, loader: restGeoApi.GetProvincias}
          ]
        }         
      ]

    },
    { path: '/Tienda/ComprarYa', element: <ComprarYa></ComprarYa> },
    //{ path: '/Tienda/ComprarYa/:idProd', element: <ComprarYa></ComprarYa>, loader: restTienda.RecuperarProducto },
    { path: '/Cliente/Login', element: <Login></Login> },
    { path: '/Cliente/Registro', element: <Registro></Registro>}

  ]
);



function App() {
  return (
      <>
        <RouterProvider router={_routerObject} />
      </>
  );
}

export default App;
