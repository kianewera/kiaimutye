const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Vary": "Origin"
});
const json=(data,status=200,origin="*")=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json",...cors(origin)}});
const enc=s=>new TextEncoder().encode(s);
async function sign(payload,secret){const key=await crypto.subtle.importKey("raw",enc(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,enc(payload));return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");}
async function verify(token,secret){try{const [p,s]=token.split(".");if(!p||!s||await sign(p,secret)!==s)return false;const data=JSON.parse(atob(p.replace(/-/g,"+").replace(/_/g,"/")));return data.exp>Date.now();}catch{return false;}}
async function authorized(req,env){const t=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");return t&&await verify(t,env.JWT_SECRET);}
export default {
 async fetch(req,env){
  const origin=req.headers.get("Origin")||"";
  const allowed=env.FRONTEND_ORIGIN||"*";
  if(req.method==="OPTIONS")return new Response(null,{headers:cors(allowed)});
  if(allowed!=="*"&&origin!==allowed)return json({error:{message:"Origin tidak diizinkan"}},403,allowed);
  const path=new URL(req.url).pathname;
  try{
   if(path==="/api/login"&&req.method==="POST"){
    const b=await req.json();
    if(b.email!==env.ADMIN_EMAIL||b.password!==env.ADMIN_PASSWORD)return json({error:{message:"Email atau password salah"}},401,allowed);
    const payload=btoa(JSON.stringify({sub:b.email,exp:Date.now()+8*60*60*1000})).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    return json({data:{token:payload+"."+await sign(payload,env.JWT_SECRET)}},200,allowed);
   }
   if(!await authorized(req,env))return json({error:{message:"Sesi admin tidak valid. Silakan login ulang."}},401,allowed);
   if(path==="/api/admin/key"&&req.method==="PUT"){
    const b=await req.json();if(typeof b.apiKey!=="string"||!/^drip_sk_(test|live)_[A-Za-z0-9_-]+$/.test(b.apiKey))return json({error:{message:"Format API key Drip tidak valid"}},400,allowed);
    await env.SECRETS.put("DRIP_API_KEY",b.apiKey);return json({data:{saved:true}},200,allowed);
   }
   if(path==="/api/admin/test"&&req.method==="GET"){
    const key=await env.SECRETS.get("DRIP_API_KEY");if(!key)return json({error:{message:"Simpan API key terlebih dahulu"}},400,allowed);
    const r=await fetch("https://dripclientofficial.dev/api/v1/me",{headers:{Authorization:`Bearer ${key}`,Accept:"application/json"}});
    const j=await r.json();if(!r.ok)return json({error:{message:j.error?.message||"Drip menolak API key"}},r.status,allowed);return json({data:j.data},200,allowed);
   }
   if(path==="/api/products"&&req.method==="GET"){
    const key=await env.SECRETS.get("DRIP_API_KEY");const h={Accept:"application/json"};if(key)h.Authorization=`Bearer ${key}`;
    const r=await fetch("https://dripclientofficial.dev/api/v1/products",{headers:h});const j=await r.json();if(!r.ok)return json({error:{message:j.error?.message||"Gagal mengambil katalog Drip"}},r.status,allowed);
    return json({data:j.data},200,allowed);
   }
   return json({error:{message:"Endpoint tidak ditemukan"}},404,allowed);
  }catch(e){return json({error:{message:"Kesalahan server: "+e.message}},500,allowed);}
 }
};