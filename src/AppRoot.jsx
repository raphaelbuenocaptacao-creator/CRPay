import React,{useEffect,useState}from'react';
import App from'./App';
import Admin from'./Admin';
import{neon}from'./lib/neonClient';

const ADMIN_EMAIL='alissoncrpay@gmail.com';
export default function AppRoot(){
 const[ready,setReady]=useState(false),[user,setUser]=useState(null);
 useEffect(()=>{(async()=>{try{const s=await neon.auth.getSession();setUser(s.data?.user||null)}finally{setReady(true)}})()},[]);
 if(!ready)return <div className="splash"><div className="brand"><div className="ring"><strong>CRPay</strong></div><p>Carregando...</p></div></div>;
 if(user&&String(user.email||'').toLowerCase()===ADMIN_EMAIL)return <Admin user={user}/>;
 return <App/>;
}
