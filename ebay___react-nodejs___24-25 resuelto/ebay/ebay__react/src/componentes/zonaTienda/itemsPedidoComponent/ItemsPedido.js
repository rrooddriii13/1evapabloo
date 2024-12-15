import './ItemsPedido.css'
import {useLocation, useNavigate} from 'react-router-dom'
import { useRef, useEffect } from 'react'
import restTienda from '../../../servicios/restTienda'


function ItemsPedido( { pedido, cliente } ){
    const _path=useLocation();
    const navigate=useNavigate();

    const botonComprar=useRef(null); //<----variable ref. para acceder al elem.del DOM boton-Comprar, para acceder a su valor usar .current
    const windowPayPal=useRef(null); //<----variable ref. para acceder a nueva ventana popup pago de paypal desde comp.
    const intervalCheck=useRef(null); //<---variable ref. para almacenar setInterval y pararlo cuadno comp.se descargue

    //--------efecto para lanzar un interval nada mas cargar el componente que chequee la url del popup de pago con paypal---
    //---- para detectar cuando el nuestro servicio de nodejs da respuesta si pago ok o no (en la url hay /Tienda/FinalizarOK?opCodePago=...&idPedido=....
    useEffect(
        ()=>{
            //definir setInterval para ir chequeando la url del popup
            intervalCheck.current=setInterval(()=>{
                try {
                    if(windowPayPal.current){
                        console.log('url popup de paypal...', windowPayPal.current.location.href);
                        console.log('parametros en url popup....', windowPayPal.current.location.search);
                        
                        let _queryParams=new URLSearchParams(windowPayPal.current.location.search);
                        if( parseInt(_queryParams.get('opCodePago'))===0 ){
                            //salto a componente FinalizarOk....
                            navigate(`/`); //<---- en teoria deberiamos saltar a componente de fin pago ok
                        } else {
                            //mostrar fallo y habilitar de nuevo el boton comprar
                            windowPayPal.current.close();
                            botonComprar.current.removeAttribute('disabled');
                            botonComprar.current.setAttribute('style','cursor: pointer;');
                        }

                    }
                } catch (error) {
                    console.log('error en setInterval function...', error);
                }
            },6000)

            //definir funcion a ejecutar cuando comp. se desmonte/descargue del DOM
            return ()=>{
                //eliminar setInterval y cerrar popup
                if(windowPayPal.current) windowPayPal.current.close();
                clearInterval(intervalCheck.current);
            }
        },
        []
    )


    async function HandlerClickComprar(){
        //nunca se accede a elementos del DOM de forma directa con js....para hacerlo usa referencias con hook useRef
        //document.getElementById('btnComprar').setAttribute('disabled',true);
        botonComprar.current.setAttribute('disabled',true);
        botonComprar.current.setAttribute('style','cursor:wait;');

        let _respuestaPago=await restTienda.FinalizarPedido(cliente,pedido);
        if (_respuestaPago.datos.urlPayPal) {
            //abriendo el acceso a paypal en una nueva ventana....
            windowPayPal.current=window.open(_respuestaPago.datos.urlPayPal, "abriendo PayPal...", "popup");
            //window.location.href=_respuestaPago.datos.urlPayPal;
        }
    }


    return (
        <div className="card">
            <div className="card-body">
                <div className="container">
                    
                <div className="row">
                        <div className="col-8"><p className="card-text">Articulo ({ _path.pathname.includes('ComprarYa') ? pedido.comprarYa.cantidad : pedido.itemsPedido.length.toString() })</p></div>
                        <div className="col-4"><p className="card-text">{pedido.subtotal} EUR</p></div>
                    </div>

                    <div className="row">
                        <div className="col-8"><p className="card-text">Envio ({ _path.pathname.includes('ComprarYa') ? pedido.comprarYa.cantidad : pedido.itemsPedido.length.toString() })</p></div>
                        <div className="col-4"><p className="card-text">{pedido.gastosEnvio} EUR</p></div>
                    </div>
                    <hr></hr>
                    <div className="row">
                        <div className="col-8"><p className="card-text"><strong>Total del pedido</strong></p></div>
                        <div className="col-4"><p className="card-text"><strong>{pedido.total} EUR</strong></p></div>
                    </div>

                    <div className="row mt-4">
                        <div className="col">
                            <button className="btn btn-primary w-100"
                                    onClick={ HandlerClickComprar }
                                    ref={ botonComprar}
                                    id='btnComprar'
                            >
                                { _path.pathname.includes('ComprarYa') ? 'Confirmar y pagar': 'Completar Compra'}
                            </button>
                        </div>
                    </div>


                </div>
                
            </div>
        </div>
    )
}

export default ItemsPedido;