import { useState, useEffect } from "react";

/* ─── TOKENS ─── */
const T = {
  ink: "#080c0a", forest: "#0a2e28", forestMid: "#174f46", forestLight: "#256b5e",
  pale: "#c8dfd0", cream: "#f3f0e8", parchment: "#e9e3d4", ivory: "#faf7f1",
  gold: "#3d9132", goldLight: "#50ad44", goldPale: "#cde8c8", white: "#ffffff",
  textBody: "#283228", textMuted: "#506358",
  border: "rgba(10,46,40,0.10)", borderGold: "rgba(61,145,50,0.28)",
};

/* ─── NAV HEIGHT — chỉnh con số này nếu nav project khác ─── */
const NAV_H = 110;

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

  .bp * { box-sizing: border-box; }
  ::selection { background: ${T.goldPale}; color: ${T.forest}; }

  .er { opacity:0; transform:translateY(28px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
  .er.in { opacity:1; transform:none; }
  .er.d1 { transition-delay:.12s; }
  .er.d2 { transition-delay:.24s; }
  .er.d3 { transition-delay:.36s; }

  /* featured hero card */
  .bp-hero-img { width:100%; height:100%; object-fit:cover; filter:saturate(.6) brightness(.48); transition:transform 1.1s cubic-bezier(.16,1,.3,1),filter .7s; display:block; }
  .bp-hero-wrap:hover .bp-hero-img { transform:scale(1.05); filter:saturate(.88) brightness(.42); }

  /* recent rows */
  .bp-rrow { display:grid; grid-template-columns:104px 1fr; border-bottom:.5px solid ${T.border}; text-decoration:none; cursor:pointer; transition:background .3s; position:relative; overflow:hidden; }
  .bp-rrow::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:${T.gold}; transform:scaleY(0); transform-origin:bottom; transition:transform .35s cubic-bezier(.16,1,.3,1); }
  .bp-rrow:hover { background:${T.cream}; }
  .bp-rrow:hover::before { transform:scaleY(1); }
  .bp-rrow-img { width:100%; height:104px; object-fit:cover; filter:saturate(.7); display:block; transition:filter .4s,transform .7s cubic-bezier(.16,1,.3,1); }
  .bp-rrow:hover .bp-rrow-img { filter:saturate(1); transform:scale(1.08); }

  /* big article */
  .bp-abig { display:grid; grid-template-columns:340px 1fr; border:.5px solid ${T.border}; background:${T.white}; text-decoration:none; cursor:pointer; overflow:hidden; transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s; margin-bottom:20px; position:relative; }
  .bp-abig:hover { transform:translateX(8px); box-shadow:-8px 0 0 ${T.gold},0 24px 48px rgba(10,46,40,.09); }
  .bp-abig-img { overflow:hidden; min-height:240px; height:100%; position:relative; }
  .bp-abig-img img { width:100%; height:100%; object-fit:cover; filter:saturate(.75); display:block; transition:transform .9s cubic-bezier(.16,1,.3,1),filter .5s; }
  .bp-abig:hover .bp-abig-img img { transform:scale(1.07); filter:saturate(1); }

  /* small card */
  .bp-asm { border:.5px solid ${T.border}; background:${T.white}; text-decoration:none; cursor:pointer; overflow:hidden; display:flex; flex-direction:column; transition:transform .45s cubic-bezier(.16,1,.3,1),box-shadow .45s; }
  .bp-asm:hover { transform:translateY(-7px); box-shadow:0 24px 48px rgba(10,46,40,.1); }
  .bp-asm-img { overflow:hidden; }
  .bp-asm-img img { width:100%; height:180px; object-fit:cover; filter:saturate(.75); display:block; transition:transform .8s cubic-bezier(.16,1,.3,1),filter .4s; }
  .bp-asm:hover .bp-asm-img img { transform:scale(1.09); filter:saturate(1); }

  /* mini card */
  .bp-mini { display:grid; grid-template-columns:84px 1fr; border-bottom:.5px solid ${T.border}; text-decoration:none; cursor:pointer; overflow:hidden; transition:background .3s; }
  .bp-mini:last-child { border-bottom:none; }
  .bp-mini:hover { background:${T.cream}; }
  .bp-mini img { width:100%; height:76px; object-fit:cover; filter:saturate(.65); display:block; transition:filter .3s,transform .6s; }
  .bp-mini:hover img { filter:saturate(1); transform:scale(1.06); }

  /* editor row */
  .bp-erow { display:flex; align-items:center; gap:13px; padding:14px 20px; border-bottom:.5px solid ${T.border}; text-decoration:none; cursor:pointer; position:relative; transition:background .3s; }
  .bp-erow:last-child { border-bottom:none; }
  .bp-erow::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:${T.gold}; opacity:0; transition:opacity .3s; }
  .bp-erow:hover { background:${T.cream}; }
  .bp-erow:hover::before { opacity:1; }

  /* editorial */
  .bp-ei { padding:34px 30px; border-right:.5px solid ${T.border}; text-decoration:none; display:block; cursor:pointer; transition:background .35s; }
  .bp-ei:last-child { border-right:none; }
  .bp-ei:hover { background:${T.cream}; }
  .bp-ei .ei-arr { transition:transform .3s; color:${T.gold}; }
  .bp-ei:hover .ei-arr { transform:translateX(5px); }

  /* cat pills */
  .bp-pill { font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.4); background:transparent; border:none; border-bottom:2px solid transparent; padding:0 18px; cursor:pointer; font-family:'DM Sans',sans-serif; height:100%; display:flex; align-items:center; gap:7px; transition:color .25s,border-color .25s; }
  .bp-pill:hover { color:rgba(255,255,255,.8); }
  .bp-pill.act { color:${T.gold}; border-bottom-color:${T.gold}; }

  /* tags */
  .bp-tag { font-size:10px; letter-spacing:.1em; padding:5px 12px; border:.5px solid ${T.border}; color:${T.textMuted}; cursor:pointer; transition:all .3s; background:transparent; font-family:'DM Sans',sans-serif; }
  .bp-tag:hover { background:${T.forest}; color:${T.ivory}; border-color:${T.forest}; }
  .bp-tag.act { background:${T.goldPale}; color:${T.gold}; border-color:${T.borderGold}; }

  /* interest */
  .bp-int { font-size:9.5px; letter-spacing:.1em; padding:5px 13px; border:.5px solid ${T.border}; color:${T.textMuted}; cursor:pointer; transition:all .3s; background:transparent; font-family:'DM Sans',sans-serif; }
  .bp-int.act { background:${T.goldPale}; color:${T.gold}; border-color:${T.borderGold}; }

  /* social small */
  .bp-soc { width:30px; height:30px; border:.5px solid ${T.border}; display:flex; align-items:center; justify-content:center; text-decoration:none; color:${T.textMuted}; transition:all .3s; }
  .bp-soc:hover { border-color:${T.gold}; color:${T.gold}; }

  /* view all link */
  .bp-va { font-size:10.5px; letter-spacing:.17em; text-transform:uppercase; color:${T.gold}; text-decoration:none; display:flex; align-items:center; gap:9px; transition:gap .3s; }
  .bp-va:hover { gap:14px; }
  .bp-va svg { transition:transform .3s; }
  .bp-va:hover svg { transform:translateX(4px); }

  /* Facebook card */
  .bp-fb { background:${T.white}; border:.5px solid ${T.border}; overflow:hidden; text-decoration:none; display:flex; flex-direction:column; cursor:pointer; transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s; }
  .bp-fb:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(10,46,40,.09); }
  .bp-fb-img { overflow:hidden; }
  .bp-fb-img img { width:100%; height:160px; object-fit:cover; filter:saturate(.8); display:block; transition:transform .7s cubic-bezier(.16,1,.3,1),filter .4s; }
  .bp-fb:hover .bp-fb-img img { transform:scale(1.06); filter:saturate(1); }

  /* responsive */
  @media(max-width:1100px){
    .bp-hero-grid { grid-template-columns:1fr !important; }
    .bp-art-layout { grid-template-columns:1fr !important; }
    .bp-abig { grid-template-columns:1fr !important; }
    .bp-ed-grid { grid-template-columns:1fr 1fr !important; }
    .bp-cta-grid { grid-template-columns:1fr !important; }
    .bp-fb-grid { grid-template-columns:1fr 1fr !important; }
  }
  @media(max-width:680px){
    .bp-ed-grid { grid-template-columns:1fr !important; }
    .bp-fb-grid { grid-template-columns:1fr !important; }
  }
`;

/* icons */
const Arr = ({size=16,...p})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const StarIco=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const ClkIco=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const MsgIco=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const FbIco=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>;
const LikeIco=()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>;
const ShareIco=()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;

const Ey=({children})=>(
  <div style={{fontSize:8.5,letterSpacing:".25em",textTransform:"uppercase",color:T.gold,marginBottom:13,display:"flex",alignItems:"center",gap:11}}>
    <span style={{display:"block",width:20,height:".5px",background:T.gold}}/>
    {children}
  </div>
);

function useReveal(){
  useEffect(()=>{
    const els=document.querySelectorAll(".er");
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});
    },{threshold:.1});
    els.forEach(el=>io.observe(el));
    return()=>io.disconnect();
  },[]);
}

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
function Hero(){
  const recent=[
    {img:"https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&q=80&auto=format&fit=crop",cat:"Nông nghiệp Xanh",title:"Phương pháp canh tác thuận tự nhiên đang thay đổi vùng cao nguyên",author:"Trần Hà Linh",time:"8 phút",date:"14/6"},
    {img:"https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&q=80&auto=format&fit=crop",cat:"Sống Bền Vững",title:"Nhà không rác — Cuộc sống gia đình 5 người với 1 lọ rác mỗi năm",author:"Lê Quang Vinh",time:"6 phút",date:"10/6"},
    {img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80&auto=format&fit=crop",cat:"Khoa học & Đất",title:"Vi sinh vật đất — Những anh hùng vô hình dưới lòng đất",author:"Phạm Thị Lan",time:"10 phút",date:"7/6"},
    {img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80&auto=format&fit=crop",cat:"Cộng đồng",title:"Vườn cộng đồng đô thị — Mô hình xanh bùng nổ tại thành phố lớn",author:"Ngô Bảo Châu",time:"5 phút",date:"3/6"},
  ];
  return(
    <section className="bp-hero-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:`calc(100vh - ${NAV_H}px)`}}>
      {/* LEFT featured */}
      <a href="#" className="bp-hero-wrap" style={{position:"relative",overflow:"hidden",display:"block",textDecoration:"none",minHeight:`calc(100vh - ${NAV_H}px)`}}>
        <img className="bp-hero-img" src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80&auto=format&fit=crop" alt="Rừng" style={{position:"absolute",inset:0}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(5,20,15,.97) 0%,rgba(5,20,15,.6) 40%,rgba(5,20,15,.12) 76%,transparent 100%)"}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"52px 56px",zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:20}}>
            <span style={{fontSize:8.5,letterSpacing:".24em",textTransform:"uppercase",color:T.gold,background:"rgba(61,145,50,.14)",border:"0.5px solid rgba(61,145,50,.32)",padding:"5px 13px"}}>Thiên nhiên & Bảo tồn</span>
            <span style={{fontSize:8.5,letterSpacing:".18em",textTransform:"uppercase",color:"rgba(250,247,241,.36)",display:"flex",alignItems:"center",gap:8}}>
              <span style={{display:"block",width:18,height:".5px",background:"rgba(250,247,241,.22)"}}/>Bài nổi bật
            </span>
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3vw,48px)",fontWeight:300,lineHeight:1.1,color:T.ivory,letterSpacing:"-.015em",marginBottom:16}}>
            Hành trình tìm lại <em style={{fontStyle:"italic",color:T.gold}}>tiếng thở</em><br/>của những cánh rừng nguyên sinh
          </h1>
          <p style={{fontSize:13,lineHeight:1.85,fontWeight:300,color:"rgba(250,247,241,.54)",maxWidth:400,marginBottom:30}}>
            Sâu trong dải Trường Sơn, nơi ánh mặt trời chưa từng chạm tới những tán lá cổ thụ, một thế giới hoàn toàn khác đang tồn tại — và đang dần biến mất trong im lặng.
          </p>
          <div style={{display:"flex",alignItems:"center",gap:18,paddingTop:20,borderTop:".5px solid rgba(255,255,255,.10)"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:32,height:32,border:".5px solid rgba(61,145,50,.44)",background:"rgba(61,145,50,.13)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold}}>N</div>
              <div>
                <div style={{fontSize:11.5,color:"rgba(250,247,241,.75)"}}>Nguyễn Minh Thư</div>
                <div style={{fontSize:10,color:"rgba(250,247,241,.35)",marginTop:2}}>18 tháng 6, 2026</div>
              </div>
            </div>
            <div style={{marginLeft:"auto",fontSize:9.5,letterSpacing:".14em",textTransform:"uppercase",color:"rgba(250,247,241,.28)",display:"flex",alignItems:"center",gap:7}}>
              <span style={{display:"block",width:12,height:".5px",background:"rgba(250,247,241,.18)"}}/>12 phút đọc
            </div>
          </div>
        </div>
      </a>

      {/* RIGHT panel */}
      <div style={{display:"flex",flexDirection:"column",background:T.ivory,borderLeft:`.5px solid ${T.borderGold}`}}>
        <div style={{padding:"36px 46px 32px",borderBottom:`.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:8.5,letterSpacing:".3em",textTransform:"uppercase",color:T.gold,marginBottom:9,display:"flex",alignItems:"center",gap:11}}>
              <span style={{display:"block",width:20,height:".5px",background:T.gold}}/>Số mới nhất
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,2.4vw,36px)",fontWeight:300,color:T.forest,lineHeight:1.1,letterSpacing:"-.01em"}}>
              The <em style={{fontStyle:"italic",color:T.gold}}>Earthoria</em><br/>Journal
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:300,color:T.pale,lineHeight:1}}>24</div>
            <div style={{fontSize:8.5,letterSpacing:".18em",textTransform:"uppercase",color:T.textMuted,marginTop:3}}>Tháng 6 · 2026</div>
          </div>
        </div>
        <div style={{flex:1}}>
          {recent.map((a,i)=>(
            <a key={i} href="#" className="bp-rrow">
              <div style={{overflow:"hidden",borderRight:`.5px solid ${T.border}`}}>
                <img className="bp-rrow-img" src={a.img} alt=""/>
              </div>
              <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{fontSize:8.5,letterSpacing:".2em",textTransform:"uppercase",color:T.gold,marginBottom:5}}>{a.cat}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14.5,fontWeight:400,color:T.forest,lineHeight:1.3,marginBottom:7}}>{a.title}</div>
                <div style={{display:"flex",alignItems:"center",gap:7,fontSize:10.5,color:T.textMuted}}>
                  <span>{a.author}</span>
                  <span style={{width:3,height:3,borderRadius:"50%",background:T.borderGold,display:"block"}}/>
                  <span>{a.time}</span>
                  <span style={{width:3,height:3,borderRadius:"50%",background:T.borderGold,display:"block"}}/>
                  <span>{a.date}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div style={{padding:"16px 46px",borderTop:`.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <a href="#" className="bp-va">Xem tất cả bài viết <Arr size={13}/></a>
          <div style={{display:"flex",gap:6}}>
            {[0,1,2].map(i=>(
              <a key={i} href="#" className="bp-soc">
                {i===0&&<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>}
                {i===1&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>}
                {i===2&&<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   CATEGORY STRIP
══════════════════════════════════════════ */
function CatStrip(){
  const [act,setAct]=useState(0);
  const cats=[{l:"Tất cả",n:48},{l:"Thiên nhiên",n:12},{l:"Nông nghiệp",n:9},{l:"Sống xanh",n:11},{l:"Khoa học",n:8},{l:"Cộng đồng",n:8}];
  return(
    <div style={{background:T.forest,padding:"0 80px",borderBottom:".5px solid rgba(255,255,255,.06)"}}>
      <div style={{maxWidth:1360,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
        <div style={{display:"flex",height:"100%"}}>
          {cats.map((c,i)=>(
            <button key={i} className={`bp-pill${act===i?" act":""}`} onClick={()=>setAct(i)}>
              {c.l}
              <span style={{fontSize:8.5,background:"rgba(61,145,50,.18)",border:".5px solid rgba(61,145,50,.28)",padding:"1px 6px",color:T.gold}}>{c.n}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:9,border:".5px solid rgba(255,255,255,.09)",background:"rgba(255,255,255,.04)",padding:"0 13px",height:35}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:300,color:"rgba(255,255,255,.65)",width:155}} placeholder="Tìm kiếm..."/>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ARTICLES
══════════════════════════════════════════ */
function Articles(){
  const [tags,setTags]=useState(["Rừng nguyên sinh"]);
  const tog=t=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);

  const bigs=[
    {img:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80&auto=format&fit=crop",badge:"Trending",bGold:true,cat:"Nông nghiệp Xanh",title:"Lúa gạo hữu cơ và giấc mơ về một nền nông nghiệp không hóa chất trên đất Việt",exc:"Khi những ruộng lúa dần chuyển sang phương thức canh tác tự nhiên, người nông dân bắt đầu nhận ra rằng đất không chỉ là nơi gieo hạt — đó là một hệ sinh thái sống động cần được nuôi dưỡng.",av:"T",name:"Trần Hà Linh",date:"15 tháng 6, 2026",read:"9 phút"},
    {img:"https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=700&q=80&auto=format&fit=crop",badge:"Khoa học",bGold:false,cat:"Khoa học & Đất",title:"Mycorrhizal — Mạng lưới bí ẩn kết nối cả khu rừng trong một tư duy tập thể",exc:"Dưới mỗi khu rừng là một mạng lưới nấm rễ phức tạp đến mức các nhà khoa học gọi nó là \"Wood Wide Web\" — mạng xã hội của thực vật.",av:"P",name:"Phạm Thị Lan",date:"11 tháng 6, 2026",read:"14 phút"},
    {img:"https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=700&q=80&auto=format&fit=crop",badge:"Mới",bGold:false,cat:"Cộng đồng",title:"Làng sinh thái đầu tiên tại Đà Lạt — nơi con người sống cùng thiên nhiên, không chống lại nó",exc:"48 gia đình đã rời bỏ cuộc sống thành thị để xây dựng một cộng đồng nơi mỗi quyết định đều được cân nhắc dựa trên tác động đến hệ sinh thái xung quanh.",av:"L",name:"Lê Quang Vinh",date:"1 tháng 6, 2026",read:"11 phút"},
  ];
  const smalls=[
    {img:"https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=500&q=80&auto=format&fit=crop",cat:"Sống Bền Vững",title:"Thiết kế nhà thu gom nước mưa — tiết kiệm 70% hóa đơn nước",exc:"Kiến trúc thích nghi với khí hậu nhiệt đới đang trở thành xu hướng mới.",meta:"Vũ Đức Anh · 7 phút",date:"5/6"},
    {img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80&auto=format&fit=crop",cat:"Thiên nhiên",title:"Bảo tồn loài lan rừng Việt Nam — cuộc chiến không hồi kết",exc:"Hơn 800 loài lan bản địa đang đứng trước nguy cơ tuyệt chủng.",meta:"Bùi Thị Mai · 9 phút",date:"2/6"},
  ];
  const picks=[
    {title:"Hạt giống bản địa và cuộc chiến chống lai giống đại trà",meta:"Ngô Bảo Châu · 8 phút"},
    {title:"Tại sao cây cần im lặng — khoa học về âm thanh và thực vật",meta:"Phạm Thị Lan · 6 phút"},
    {title:"Mưa axit tại miền Bắc — bức tranh ô nhiễm chưa được kể",meta:"Trần Hà Linh · 12 phút"},
    {title:"Hợp tác xã cà phê tự nhiên Đắk Lắk — câu chuyện 10 năm",meta:"Vũ Đức Anh · 9 phút"},
  ];
  const allTags=["Rừng nguyên sinh","Vi sinh vật đất","Nước sạch","Cây bản địa","Zero Waste","Carbon","Permaculture","Hạt giống","Khí hậu","Đất ngập nước","Ong mật"];
  const minis=[
    {img:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=200&q=80&auto=format&fit=crop",cat:"Thiên nhiên",title:"Bướm đêm — những thụ phấn bị lãng quên",date:"29/5 · 5 phút"},
    {img:"https://images.unsplash.com/photo-1598514982901-2f2d3800c4dc?w=200&q=80&auto=format&fit=crop",cat:"Sống Xanh",title:"Tái chế bã cà phê — 7 cách dùng thông minh",date:"26/5 · 4 phút"},
    {img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=80&auto=format&fit=crop",cat:"Cộng đồng",title:"Chợ nông sản hữu cơ cuối tuần tại Hà Nội",date:"22/5 · 3 phút"},
  ];

  const BigCard=({a,cls=""})=>(
    <a href="#" className={`bp-abig er${cls}`}>
      <div className="bp-abig-img">
        <img src={a.img} alt=""/>
        <div style={{position:"absolute",bottom:14,left:14,fontSize:8,letterSpacing:".2em",textTransform:"uppercase",color:T.ivory,background:a.bGold?T.gold:T.forest,padding:"3px 11px"}}>{a.badge}</div>
      </div>
      <div style={{padding:"28px 30px 24px",display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:8.5,letterSpacing:".22em",textTransform:"uppercase",color:T.gold,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"block",width:15,height:".5px",background:T.gold}}/>{a.cat}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(16px,1.8vw,23px)",fontWeight:400,color:T.forest,lineHeight:1.25,marginBottom:11}}>{a.title}</h2>
        <p style={{fontSize:12.5,lineHeight:1.85,color:T.textMuted,fontWeight:300,flex:1,marginBottom:20}}>{a.exc}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:15,borderTop:`.5px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:25,height:25,background:T.goldPale,border:`.5px solid ${T.borderGold}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:10,color:T.gold}}>{a.av}</div>
            <div>
              <div style={{fontSize:11,color:T.forest,fontWeight:400}}>{a.name}</div>
              <div style={{fontSize:9.5,color:T.textMuted,marginTop:1}}>{a.date} · {a.read}</div>
            </div>
          </div>
          <span style={{fontSize:9.5,letterSpacing:".12em",textTransform:"uppercase",color:T.textMuted,display:"flex",alignItems:"center",gap:6}}>
            Đọc tiếp <Arr size={13} style={{color:T.gold}}/>
          </span>
        </div>
      </div>
    </a>
  );

  return(
    <div style={{padding:"80px 80px 64px",maxWidth:1360,margin:"0 auto"}}>
      <div className="bp-art-layout" style={{display:"grid",gridTemplateColumns:"1fr 288px",gap:56,alignItems:"start"}}>
        {/* MAIN */}
        <div>
          <BigCard a={bigs[0]}/>
          <BigCard a={bigs[1]} cls=" d1"/>
          <div className="er d2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
            {smalls.map((a,i)=>(
              <a key={i} href="#" className="bp-asm">
                <div className="bp-asm-img"><img src={a.img} alt=""/></div>
                <div style={{padding:"18px",display:"flex",flexDirection:"column",flex:1}}>
                  <div style={{fontSize:8.5,letterSpacing:".2em",textTransform:"uppercase",color:T.gold,marginBottom:7}}>{a.cat}</div>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:15.5,fontWeight:400,color:T.forest,lineHeight:1.3,marginBottom:8}}>{a.title}</h3>
                  <p style={{fontSize:11.5,lineHeight:1.78,color:T.textMuted,fontWeight:300,flex:1,marginBottom:14}}>{a.exc}</p>
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:11,borderTop:`.5px solid ${T.border}`,fontSize:10,color:T.textMuted}}>
                    <span>{a.meta}</span><span>{a.date}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <BigCard a={bigs[2]}/>
        </div>

        {/* SIDEBAR */}
        <aside style={{position:"sticky",top:24,display:"flex",flexDirection:"column",gap:28}}>
          {/* newsletter */}
          <div className="er" style={{background:T.forest,padding:"26px 22px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-10,bottom:-16,fontFamily:"'Playfair Display',serif",fontSize:110,fontWeight:300,color:"rgba(255,255,255,.03)",pointerEvents:"none",lineHeight:1,userSelect:"none"}}>J</div>
            <Ey>Đăng ký nhận tin</Ey>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:300,color:T.ivory,lineHeight:1.35,marginBottom:8}}>
              Tạp chí xanh<br/>mỗi <em style={{fontStyle:"italic",color:T.gold}}>thứ Sáu</em>
            </div>
            <p style={{fontSize:11.5,lineHeight:1.72,color:"rgba(250,247,241,.44)",fontWeight:300,marginBottom:18}}>Câu chuyện từ thế giới tự nhiên — ngay hộp thư bạn.</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <input style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:300,background:"rgba(255,255,255,.06)",border:".5px solid rgba(255,255,255,.10)",color:"rgba(250,247,241,.8)",padding:"10px 13px",outline:"none"}} placeholder="email@example.com"/>
              <button style={{fontFamily:"'DM Sans',sans-serif",fontSize:9.5,letterSpacing:".18em",textTransform:"uppercase",color:T.ink,background:T.gold,border:"none",padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"background .3s"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.goldLight}
                onMouseLeave={e=>e.currentTarget.style.background=T.gold}
              >Đăng ký ngay <Arr size={12}/></button>
            </div>
            <div style={{fontSize:9.5,color:"rgba(255,255,255,.18)",marginTop:8,textAlign:"center"}}>Không spam. Hủy bất cứ lúc nào.</div>
          </div>

          {/* editor picks */}
          <div className="er d1" style={{border:`.5px solid ${T.border}`,background:T.white,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:8.5,letterSpacing:".22em",textTransform:"uppercase",color:T.textMuted}}>Biên tập viên chọn lọc</div>
              <div style={{width:14,height:".5px",background:T.gold}}/>
            </div>
            {picks.map((e,i)=>(
              <a key={i} href="#" className="bp-erow">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:300,color:T.pale,minWidth:22,transition:"color .3s"}}
                  onMouseEnter={ev=>ev.currentTarget.style.color=T.gold}
                  onMouseLeave={ev=>ev.currentTarget.style.color=T.pale}
                >0{i+1}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:400,color:T.forest,lineHeight:1.3}}>{e.title}</div>
                  <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{e.meta}</div>
                </div>
              </a>
            ))}
          </div>

          {/* tags */}
          <div className="er d2" style={{border:`.5px solid ${T.border}`,background:T.white,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:8.5,letterSpacing:".22em",textTransform:"uppercase",color:T.textMuted}}>Chủ đề nổi bật</div>
              <div style={{width:14,height:".5px",background:T.gold}}/>
            </div>
            <div style={{padding:"14px 18px"}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {allTags.map(t=><button key={t} className={`bp-tag${tags.includes(t)?" act":""}`} onClick={()=>tog(t)}>{t}</button>)}
              </div>
            </div>
          </div>

          {/* minis */}
          <div className="er d3" style={{border:`.5px solid ${T.border}`,background:T.white,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:8.5,letterSpacing:".22em",textTransform:"uppercase",color:T.textMuted}}>Cũng đang đọc</div>
              <div style={{width:14,height:".5px",background:T.gold}}/>
            </div>
            <div style={{padding:"7px 0"}}>
              {minis.map((m,i)=>(
                <a key={i} href="#" className="bp-mini">
                  <div style={{overflow:"hidden"}}><img src={m.img} alt=""/></div>
                  <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{fontSize:8,letterSpacing:".18em",textTransform:"uppercase",color:T.gold,marginBottom:3}}>{m.cat}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:12,fontWeight:400,color:T.forest,lineHeight:1.3,marginBottom:4}}>{m.title}</div>
                    <div style={{fontSize:9.5,color:T.textMuted}}>{m.date}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EDITORIAL
══════════════════════════════════════════ */
function Editorial(){
  const series=[
    {n:"8 bài",title:"Bí mật của đất — Hành trình xuống lòng đất",desc:"Từ địa tầng đến vi sinh vật, khám phá thế giới kỳ diệu dưới chân bạn.",author:"Phạm Thị Lan"},
    {n:"6 bài",title:"Cây thuốc Việt — Kho báu đang dần mất đi",desc:"Hơn 3,000 loài cây thuốc bản địa và những người cuối cùng còn nhớ.",author:"Bùi Thị Mai"},
    {n:"10 bài",title:"Nông dân thế hệ mới — Làm giàu không cần hóa chất",desc:"Gặp gỡ những người trẻ đang viết lại câu chuyện nông nghiệp Việt Nam.",author:"Trần Hà Linh"},
    {n:"5 bài",title:"Biển Đông & Rạn San Hô — Báo cáo từ dưới nước",desc:"Những gì đang xảy ra với hệ sinh thái biển Việt Nam và chúng ta có thể làm gì.",author:"Nguyễn Minh Thư"},
  ];
  return(
    <section style={{background:T.parchment,borderTop:`.5px solid ${T.border}`,borderBottom:`.5px solid ${T.border}`,padding:"68px 80px"}}>
      <div style={{maxWidth:1360,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:48}}>
          <div>
            <Ey>Series chuyên đề</Ey>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,2.4vw,36px)",fontWeight:300,color:T.forest,letterSpacing:"-.01em"}}>
              Khám phá theo <em style={{fontStyle:"italic",color:T.gold}}>chủ đề</em>
            </h2>
          </div>
          <a href="#" className="bp-va">Xem tất cả <Arr size={13}/></a>
        </div>
        <div className="bp-ed-grid er" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
          {series.map((s,i)=>(
            <a key={i} href="#" className="bp-ei">
              <div style={{fontSize:8.5,letterSpacing:".2em",textTransform:"uppercase",color:T.gold,marginBottom:15,display:"flex",alignItems:"center",gap:7}}>
                <span style={{display:"block",width:11,height:".5px",background:T.gold}}/>Series · {s.n}
              </div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17.5,fontWeight:400,color:T.forest,lineHeight:1.3,marginBottom:8}}>{s.title}</h3>
              <p style={{fontSize:11.5,lineHeight:1.75,color:T.textMuted,fontWeight:300,marginBottom:18}}>{s.desc}</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:15,borderTop:`.5px solid ${T.border}`,fontSize:10.5,color:T.textMuted}}>
                <span>{s.author}</span><Arr size={14} className="ei-arr"/>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   FACEBOOK POSTS SECTION
══════════════════════════════════════════ */
function FacebookSection(){
  const posts=[
    {
      img:"https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80&auto=format&fit=crop",
      date:"18 tháng 6, 2026",
      text:"🌿 Sáng nay trong rừng Trường Sơn — mỗi tia sáng len lỏi qua tán lá là một lời nhắc nhở rằng thiên nhiên vẫn đang thở, vẫn đang chờ chúng ta lắng nghe.",
      likes:1420, shares:284, link:"https://facebook.com",
    },
    {
      img:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80&auto=format&fit=crop",
      date:"15 tháng 6, 2026",
      text:"🌾 Ruộng lúa hữu cơ mùa này đẹp lắm. Không cần hóa chất, không cần thuốc trừ sâu — chỉ cần tin tưởng vào đất và những sinh vật nhỏ bé đang làm việc bên dưới.",
      likes:2103, shares:517, link:"https://facebook.com",
    },
    {
      img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80&auto=format&fit=crop",
      date:"11 tháng 6, 2026",
      text:"🍄 Wood Wide Web — mạng internet của rừng. Các cây cổ thụ đang chia sẻ chất dinh dưỡng cho những cây con qua mạng lưới nấm rễ. Tự nhiên dạy chúng ta về sự chia sẻ.",
      likes:3870, shares:942, link:"https://facebook.com",
    },
    {
      img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&auto=format&fit=crop",
      date:"7 tháng 6, 2026",
      text:"🌺 Vườn cộng đồng mới khai trương tại Q.7 hôm nay. 200 hộ dân cùng nhau trồng rau sạch, chia sẻ hạt giống và kết nối với thiên nhiên ngay giữa lòng thành phố.",
      likes:986, shares:213, link:"https://facebook.com",
    },
  ];

  return(
    <section style={{background:T.ivory,padding:"72px 80px",borderTop:`.5px solid ${T.border}`}}>
      <div style={{maxWidth:1360,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:48}}>
          <div>
            <Ey>Mạng xã hội</Ey>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,2.4vw,36px)",fontWeight:300,color:T.forest,letterSpacing:"-.01em"}}>
              Earthoria trên <em style={{fontStyle:"italic",color:"#1877F2"}}>Facebook</em>
            </h2>
          </div>
          <a href="https://www.facebook.com/Earthoriavn" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:9,fontSize:10.5,letterSpacing:".14em",textTransform:"uppercase",color:"#1877F2",textDecoration:"none",border:".5px solid rgba(24,119,242,.3)",padding:"9px 18px",transition:"all .3s",fontFamily:"'DM Sans',sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(24,119,242,.06)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
          >
            <FbIco/>Theo dõi trang
          </a>
        </div>

        {/* Cards */}
        <div className="bp-fb-grid er" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
          {posts.map((p,i)=>(
            <a key={i} href={p.link} target="_blank" rel="noreferrer" className="bp-fb">
              {/* Image */}
              <div className="bp-fb-img"><img src={p.img} alt=""/></div>

              {/* Body */}
              <div style={{padding:"18px 20px 16px",display:"flex",flexDirection:"column",flex:1}}>
                {/* FB header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{width:34,height:34,background:"#1877F2",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:T.forest,lineHeight:1}}>Earthoria</div>
                    <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{p.date}</div>
                  </div>
                  <div style={{marginLeft:"auto"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                  </div>
                </div>

                {/* Text */}
                <p style={{fontSize:12.5,lineHeight:1.75,color:T.textBody,fontWeight:300,flex:1,marginBottom:14,display:"-webkit-box",WebkitLineClamp:4,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                  {p.text}
                </p>

                {/* Footer */}
                <div style={{display:"flex",alignItems:"center",gap:14,paddingTop:12,borderTop:`.5px solid ${T.border}`,fontSize:11,color:T.textMuted}}>
                  <span style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:18,height:18,background:"linear-gradient(135deg,#1877F2,#42A5F5)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                    </span>
                    {p.likes.toLocaleString()}
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:5}}>
                    <ShareIco/>{p.shares.toLocaleString()} chia sẻ
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{marginTop:36,textAlign:"center"}}>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:10,fontSize:10.5,letterSpacing:".16em",textTransform:"uppercase",color:T.white,background:"#1877F2",textDecoration:"none",padding:"13px 28px",fontFamily:"'DM Sans',sans-serif",transition:"opacity .3s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          >
            <FbIco/>Xem thêm trên Facebook
          </a>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   QUOTE
══════════════════════════════════════════ */
function Quote(){
  return(
    <section style={{background:T.forest,padding:"88px 80px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Playfair Display',serif",fontSize:"clamp(60px,11vw,160px)",fontWeight:300,color:"rgba(255,255,255,.022)",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none",letterSpacing:".08em"}}>EARTHORIA</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:76,fontWeight:300,color:"rgba(61,145,50,.18)",lineHeight:.65,marginBottom:26}}>"</div>
      <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(18px,2.4vw,34px)",fontWeight:300,fontStyle:"italic",color:T.ivory,lineHeight:1.55,maxWidth:660,margin:"0 auto 34px",letterSpacing:"-.01em",position:"relative",zIndex:1}}>
        Đất không phải là thứ chúng ta thừa kế từ cha ông — đó là thứ chúng ta{" "}
        <em style={{fontStyle:"normal",color:T.gold}}>mượn</em> từ con cháu của mình.
      </p>
      <div style={{fontSize:10.5,letterSpacing:".24em",textTransform:"uppercase",color:"rgba(250,247,241,.28)",display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
        <span style={{display:"block",width:30,height:".5px",background:"rgba(61,145,50,.34)"}}/>
        Antoine de Saint-Exupéry
        <span style={{display:"block",width:30,height:".5px",background:"rgba(61,145,50,.34)"}}/>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   CTA NEWSLETTER
══════════════════════════════════════════ */
function CTA(){
  const [ints,setInts]=useState(["Thiên nhiên","Nông nghiệp"]);
  const all=["Thiên nhiên","Nông nghiệp","Sống xanh","Khoa học","Cộng đồng"];
  const tog=t=>setInts(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const perks=[
    {ico:<StarIco/>,txt:"Bài viết độc quyền chỉ dành cho người đăng ký"},
    {ico:<ClkIco/>,txt:"Tóm tắt tuần — những điều quan trọng nhất trong 5 phút"},
    {ico:<MsgIco/>,txt:"Trò chuyện trực tiếp với tác giả mỗi tháng"},
  ];
  return(
    <section style={{padding:"80px 80px",background:T.ivory}}>
      <div className="bp-cta-grid" style={{maxWidth:1360,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
        <div className="er">
          <Ey>Tạp chí số của Earthoria</Ey>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,2.8vw,42px)",fontWeight:300,color:T.forest,lineHeight:1.1,letterSpacing:"-.01em",marginBottom:15}}>
            Nhận câu chuyện xanh<br/>vào mỗi <em style={{fontStyle:"italic",color:T.gold}}>thứ Sáu</em>
          </h2>
          <p style={{fontSize:13,lineHeight:1.88,color:T.textMuted,fontWeight:300,maxWidth:360}}>
            Hàng tuần, chúng tôi tuyển chọn những câu chuyện hay nhất về thiên nhiên, nông nghiệp và lối sống bền vững.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:28}}>
            {perks.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,fontSize:12.5,color:T.textMuted,fontWeight:300}}>
                <div style={{width:28,height:28,border:`.5px solid ${T.borderGold}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.gold,flexShrink:0}}>{p.ico}</div>
                {p.txt}
              </div>
            ))}
          </div>
        </div>
        <div className="er d1" style={{background:T.white,border:`.5px solid ${T.border}`,padding:"40px 36px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:400,color:T.forest,marginBottom:5}}>Đăng ký miễn phí</div>
          <div style={{fontSize:12,color:T.textMuted,fontWeight:300,marginBottom:24}}>Hơn 12,000 người đọc đã tham gia cộng đồng.</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {["Họ và tên","Email của bạn"].map((ph,i)=>(
                <input key={i} type={i===1?"email":"text"} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12.5,fontWeight:300,background:T.ivory,border:`.5px solid ${T.border}`,color:T.textBody,padding:"10px 13px",outline:"none",transition:"border-color .3s"}}
                  placeholder={ph}
                  onFocus={e=>e.target.style.borderColor=T.gold}
                  onBlur={e=>e.target.style.borderColor=T.border}
                />
              ))}
            </div>
            <div>
              <div style={{fontSize:9.5,letterSpacing:".16em",textTransform:"uppercase",color:T.textMuted,marginBottom:8}}>Chủ đề quan tâm</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {all.map(t=><button key={t} className={`bp-int${ints.includes(t)?" act":""}`} onClick={()=>tog(t)}>{t}</button>)}
              </div>
            </div>
            <button style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:T.ivory,background:T.forest,border:"none",padding:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"background .35s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.forestMid}
              onMouseLeave={e=>e.currentTarget.style.background=T.forest}
            >Đăng ký ngay <Arr size={14}/></button>
            <div style={{fontSize:10.5,color:T.textMuted,textAlign:"center",fontWeight:300}}>
              Bảo mật theo <a href="#" style={{color:T.gold,textDecoration:"none"}}>Chính sách riêng tư</a> · Không spam
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   ROOT
══════════════════════════════════════════ */
export default function Blog(){
  useReveal();
  useEffect(()=>{
    const id="bp-css";
    if(!document.getElementById(id)){
      const s=document.createElement("style");
      s.id=id; s.textContent=globalCSS;
      document.head.appendChild(s);
    }
    return()=>document.getElementById(id)?.remove();
  },[]);

  return(
    <div className="bp" style={{fontFamily:"'DM Sans',sans-serif",fontWeight:300,background:T.ivory,color:T.textBody,overflowX:"hidden"}}>
      <Hero/>
      <CatStrip/>
      <Articles/>
      <Editorial/>
      <FacebookSection/>
      <Quote/>
      <CTA/>
    </div>
  );
}