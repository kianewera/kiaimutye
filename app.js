const API = "https://YOUR-WORKER.your-subdomain.workers.dev";
const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem("drip_admin_token") || "";
const headers = () => ({ "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {}) });
async function call(path, options={}) {
  const response = await fetch(API + path, {...options, headers:{...headers(), ...(options.headers||{})}});
  const body = await response.json().catch(()=>({error:{message:"Respons server bukan JSON"}}));
  if(!response.ok) throw new Error(body.error?.message || `HTTP ${response.status}`);
  return body.data;
}
function showAdmin(){ $("loginView").classList.add("hidden"); $("adminView").classList.remove("hidden"); }
function showLogin(){ $("adminView").classList.add("hidden"); $("loginView").classList.remove("hidden"); }
$("loginForm").addEventListener("submit", async e=>{
  e.preventDefault(); $("loginError").textContent="Memeriksa akun...";
  try { const d=await fetch(API+"/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("email").value,password:$("password").value})}); const j=await d.json(); if(!d.ok) throw new Error(j.error?.message||"Login gagal"); token=j.data.token; sessionStorage.setItem("drip_admin_token",token); $("loginError").textContent=""; showAdmin(); }
  catch(err){$("loginError").textContent=err.message;}
});
$("logout").onclick=()=>{token="";sessionStorage.removeItem("drip_admin_token");showLogin();};
$("keyForm").addEventListener("submit",async e=>{e.preventDefault();$("keyMessage").textContent="Menyimpan...";try{await call("/api/admin/key",{method:"PUT",body:JSON.stringify({apiKey:$("apiKey").value})});$("apiKey").value="";$("keyMessage").textContent="API key tersimpan aman di backend."; $("apiState").textContent="TERSIMPAN";}catch(err){$("keyMessage").textContent=err.message;}});
$("checkApi").onclick=async()=>{ $("keyMessage").textContent="Mengecek koneksi...";try{const d=await call("/api/admin/test");$("keyMessage").textContent=`Terhubung: ${d.username||"akun Drip"} • ${d.priceTier||"tier tidak diketahui"}`;$("apiState").textContent="TERHUBUNG";}catch(e){$("keyMessage").textContent=e.message;$("apiState").textContent="GAGAL";}};
async function loadProducts(){ $("catalogMessage").textContent="Mengambil katalog dari API...";$("products").innerHTML="";try{const d=await call("/api/products");const items=d.items||[];if(!items.length){$("catalogMessage").textContent="Belum ada produk yang tersedia.";return;}$("catalogMessage").textContent=`${items.length} SKU ditemukan • Price tier: ${d.priceTier||"API"}`;$("products").innerHTML=items.map(p=>`<tr><td><b>${esc(p.name||p.product||"Produk")}</b><br><span class="muted">${esc(p.category||"")}</span></td><td>${esc(p.apiCode||"-")}</td><td>${esc(p.priceUsd||"-")} ${esc(p.currency||"USD")}</td><td>${Number(p.stock??0)}</td><td><span class="pill ${p.inStock?"":"out"}">${p.is_maintenance?"Maintenance":p.inStock?"Tersedia":"Habis"}</span></td></tr>`).join("");}catch(e){$("catalogMessage").textContent=e.message;}}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("refresh").onclick=loadProducts;
$("avatarFile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith("image/"))return alert("Pilih file gambar.");if(f.size>2*1024*1024)return alert("Maksimal ukuran foto 2 MB.");const r=new FileReader();r.onload=()=>{ $("adminAvatar").src=r.result;$("loginAvatar").src=r.result;localStorage.setItem("drip_admin_avatar",r.result);};r.readAsDataURL(f);});
const saved=localStorage.getItem("drip_admin_avatar");if(saved){$("adminAvatar").src=saved;$("loginAvatar").src=saved;}
$("refresh").addEventListener("click",loadProducts);
if(token){showAdmin();}else{showLogin();}
