// ==UserScript==
// @name         ToolboxWaze — Central de solicitações WME
// @namespace    https://github.com/andresdiniz/ToolboxWaze
// @version      4.1.0
// @description  Solicitações ao ToolboxWaze direto do WME: conexão por e-mail, contexto SDK, formulários da API, anexos, rascunhos, histórico com links, verificação de duplicatas e acompanhamento.
// @author       Andres Diniz
// @homepageURL  https://github.com/andresdiniz/ToolboxWaze
// @supportURL   https://github.com/andresdiniz/ToolboxWaze/issues
// @updateURL    https://raw.githubusercontent.com/andresdiniz/ToolboxWaze/main/ToolboxWaze.user.js
// @downloadURL  https://raw.githubusercontent.com/andresdiniz/ToolboxWaze/main/ToolboxWaze.user.js
// @match        https://www.waze.com/editor*
// @match        https://www.waze.com/*/editor*
// @match        https://beta.waze.com/editor*
// @match        https://beta.waze.com/*/editor*
// @exclude      https://www.waze.com/user/editor*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      wazetoolbox.acheireviews.com.br
// @run-at       document-idle
// ==/UserScript==
/* global unsafeWindow, GM_getValue, GM_setValue, GM_deleteValue, GM_xmlhttpRequest */
(async function () {
  'use strict';
  if (window.top !== window.self) return;
  const VERSION='4.1.0', BASE='https://wazetoolbox.acheireviews.com.br';
  const API=BASE+'/api/wme', PREFIX='[ToolboxWaze]', PAGE=typeof unsafeWindow==='undefined'?window:unsafeWindow;
  const log=(...a)=>console.info(PREFIX,...a), warn=(...a)=>console.warn(PREFIX,...a);
  const store={get:async(k,d=null)=>await GM_getValue(k,d),set:async(k,v)=>await GM_setValue(k,v),del:async k=>await GM_deleteValue(k)};
  const uid=()=>crypto.randomUUID();
  const TOKEN_KEY='tw_device_token', LEGACY_KEY='toolbox_api_token';
  let sdk=null, token=(await store.get(TOKEN_KEY,''))||(await store.get(LEGACY_KEY,'')), identity=null, forms=[], definition=null;
  let conn='carregando', pendingInfo=null, pollTimer=null;
  const randomToken=()=>{const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');};
  let answers={}, files={}, context=null, dirty=false, busy=false, unresolved=null, previousFocus=null, loadSerial=0;
  let restoring=false, saveTimer=null, restoredPending=await store.get('tw3_pending',null);
  unresolved=restoredPending;
  const host=document.createElement('div'); host.id='toolbox-wme-v3';
  if(document.getElementById(host.id)) return;
  document.body.append(host); const root=host.attachShadow({mode:'open'});
  const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;if(parent)parent.append(n);return n;};
  const css=el('style',null,root);
  css.textContent=`
  :host{all:initial;font:14px/1.5 system-ui,sans-serif;color:#16342b;position:relative;z-index:2147483646}
  *{box-sizing:border-box} [hidden]{display:none!important} button,input,select,textarea{font:inherit}
  button,a{touch-action:manipulation}button{cursor:pointer;border:1px solid #cbded5;border-radius:9px;background:#fff;color:#163d2b;padding:9px 13px;font-weight:600}
  button:hover{background:#edf7f1}button:disabled{opacity:.5;cursor:not-allowed}a{color:#147348}
  button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #71bca0;outline-offset:2px}
  .fab{position:fixed;bottom:76px;right:96px;background:#176d4c;color:white;border:0;border-radius:28px;box-shadow:0 8px 28px #0004;padding:14px 20px}
  .overlay{position:fixed;inset:0;background:#0b241dcc;display:grid;place-items:center;padding:20px;backdrop-filter:blur(3px)}
  .dialog{width:min(1050px,97vw);height:min(850px,94vh);display:flex;flex-direction:column;background:#f4f8f5;border-radius:18px;box-shadow:0 24px 90px #0006;overflow:hidden}
  header,footer{background:#fff;padding:16px 22px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}header{border-bottom:1px solid #dce9e1}footer{border-top:1px solid #dce9e1}
  h2{font-size:19px;margin:0}h3{font-size:14px;margin:0 0 10px}p{margin:4px 0 12px}.muted,small{color:#5c7468;font-size:12px}.spacer{flex:1}
  .scroll{overflow:auto;flex:1;padding:20px}.layout{display:grid;grid-template-columns:270px 1fr;gap:18px;align-items:start}
  .card{padding:16px;border:1px solid #dce9e1;border-radius:12px;background:#fff;margin-bottom:14px}.green{background:#eef8f2}
  .types{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.types button{text-align:left;font-size:13px}.types button.active{background:#e4f5eb;border-color:#198754;box-shadow:0 0 0 2px #19875422}
  label{display:block;font-weight:600;margin-bottom:6px}input:not([type=checkbox]):not([type=radio]),select,textarea{width:100%;border:1px solid #cbded5;border-radius:8px;padding:10px;background:white;color:#183c2b}
  textarea{min-height:95px;resize:vertical}.field{margin-bottom:18px}.choices{display:flex;flex-wrap:wrap;gap:8px}.choice{display:flex;align-items:center;gap:7px;border:1px solid #dce9e1;border-radius:9px;padding:8px;font-size:13px;font-weight:400;margin:0}
  .choice:has(input:checked){border-color:#198754;background:#edf8f1}.primary{background:#198754;color:white;border-color:#198754}.primary:hover{background:#126a40}
  .status{white-space:pre-wrap;padding:10px 14px;border-radius:9px;margin-bottom:12px;background:#e8f2ed}.status.error{background:#fff0ef;color:#a32121}.status.success{background:#ddf4e7;color:#125d39}
  .error-text{color:#b3261e;font-size:12px;margin-top:5px}.bad{border-color:#b3261e!important}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 system-ui;margin:0;max-height:260px;overflow:auto}
  .row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.preview{display:flex;gap:8px;flex-wrap:wrap}.preview figure{margin:8px 0;border:1px solid #dce9e1;border-radius:8px;padding:6px;width:130px}.preview img{width:116px;height:80px;object-fit:cover}.preview small{display:block;overflow-wrap:anywhere}.preview button{padding:3px 7px;font-size:11px}
  @media(max-width:760px){.overlay{padding:5px}.dialog{height:98vh;width:99vw;border-radius:10px}.layout{grid-template-columns:1fr}.scroll{padding:12px}.types{grid-template-columns:1fr 1fr}header,footer{padding:12px}.side pre{max-height:110px}.fab{right:80px}}
  `;
  css.textContent += `.mine-request{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px;margin-bottom:8px;border:1px solid #dce9e1;border-radius:10px;text-decoration:none;color:#163d2b;background:#fff}.mine-request:hover{background:#eef8f2;border-color:#198754}.mine-request:focus-visible{outline:3px solid #71bca0;outline-offset:2px}.mine-open{margin-left:auto;font-size:12px;font-weight:600}`;
  css.textContent += `
  .steps ol{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:8px}
  .steps li{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;padding:10px;border:1px solid #dce9e1;border-radius:10px;background:#f8fbf9}
  .steps .num{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#dce9e1;color:#40594d;font-weight:700;font-size:13px}
  .steps li.current{border-color:#198754;background:#eef8f2;box-shadow:0 0 0 2px #19875422}.steps li.current .num,.steps li.done .num{background:#198754;color:#fff}.steps li.done{opacity:.75}
  .steps strong{display:block}.steps li span.muted{display:block}
  .why{background:#fff8e6;border:1px solid #f0dca0;border-radius:10px;padding:10px 12px;font-size:13px;color:#5b4a14}.why strong{color:#4a3b0d}.why p{margin:4px 0 0}
  .hint{font-size:12px;margin-top:5px;color:#5c7468}.hint.ok{color:#125d39}.hint.bad{color:#b3261e}`;
  const fab=el('button','Toolbox · Solicitações',root,'fab');fab.type='button';
  const overlay=el('div',null,root,'overlay');overlay.hidden=true;
  const dialog=el('section',null,overlay,'dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','tw3-title');
  const header=el('header',null,dialog);const title=el('h2','Solicitações',header);title.id='tw3-title';
  el('span','ToolboxWaze · '+VERSION,header,'muted');el('span',null,header,'spacer');
  const mineButton=el('button','Minhas',header),settingsButton=el('button','Conexão',header),closeButton=el('button','Fechar',header);mineButton.hidden=true;
  const scroll=el('div',null,dialog,'scroll');
  const settings=el('section',null,scroll,'card');settings.hidden=true;
  el('h3','Conexão com o ToolboxWaze',settings);
  const connText=el('p','Não conectado.',settings,'muted');
  el('p','Para enviar solicitações é preciso estar conectado: você confirma o seu e-mail uma única vez e este navegador passa a usar um token aleatório gerado pelo script. Nenhuma senha, credencial ou cookie do Waze é enviado.',settings,'muted');
  const settingsRow=el('div',null,settings,'row');
  const retryButton=el('button','Tentar novamente',settingsRow,'primary'),disconnectButton=el('button','Desconectar este navegador',settingsRow);retryButton.hidden=true;
  const status=el('div',null,scroll,'status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;
  const stepsCard=el('section',null,scroll,'card steps');stepsCard.hidden=true;
  el('h3','Como conectar (leva cerca de 1 minuto)',stepsCard);
  const stepsList=el('ol',null,stepsCard);
  const STEPS=[
    ['Informe seu e-mail','Usamos o apelido detectado no WME e o seu e-mail para criar (ou localizar) sua conta no ToolboxWaze.'],
    ['Confirme no e-mail','Abra a mensagem do ToolboxWaze e clique em “Confirmar e-mail”. O link vale 60 minutos e só funciona uma vez.'],
    ['Volte ao WME','O script detecta a confirmação sozinho (ou use “Já confirmei”). Este navegador fica conectado.'],
    ['Escolha o formulário e envie','Depois disso você não precisa repetir o processo neste navegador.']
  ];
  const stepItems=STEPS.map(([t,d],i)=>{const li=el('li',null,stepsList);el('span',String(i+1),li,'num');const box=el('div',null,li);el('strong',t,box);el('span',d,box,'muted');return li;});
  const why=el('div',null,stepsCard,'why');el('strong','Por que isso é necessário?',why);
  el('p','O ToolboxWaze precisa saber quem enviou cada solicitação para que os responsáveis possam responder e para evitar spam e abuso. O script não consegue provar quem você é no Waze, por isso confirmamos o seu e-mail uma única vez. Nenhuma senha nem cookie do Waze é enviado; o token fica guardado só neste navegador.',why);
  const registerCard=el('section',null,scroll,'card');registerCard.hidden=true;
  el('h3','Passo 1 de 4 · Informe seu e-mail',registerCard);
  el('p','Se você ainda não tem conta no ToolboxWaze, ela é criada automaticamente. Em seguida enviaremos um link para confirmar que o e-mail é seu.',registerCard,'muted');
  const nickField=el('div',null,registerCard,'field'),nickLabel=el('label','Apelido no WME',nickField),nickInput=el('input',null,nickField);nickInput.id='tw4-nick';nickLabel.htmlFor='tw4-nick';nickInput.maxLength=60;nickInput.autocomplete='off';
  const nickHint=el('small','',nickField),nickError=el('div','',nickField,'error-text');nickError.setAttribute('role','alert');
  const mailField=el('div',null,registerCard,'field'),mailLabel=el('label','E-mail',mailField),mailInput=el('input',null,mailField);mailInput.id='tw4-email';mailLabel.htmlFor='tw4-email';mailInput.type='email';mailI
