const cfg = window.AMF_CONFIG;
const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
let sessionUser=null, bank=[], current=[], index=0, score=0, locked=false, isAdmin=false;

const $=id=>document.getElementById(id);
function msg(id,text){$(id).textContent=text}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}

async function boot(){
  const {data:{session}}=await client.auth.getSession();
  if(session?.user) await enterApp(session.user);
}
async function signUp(){
  const email=$('email').value.trim(), password=$('password').value;
  const {data,error}=await client.auth.signUp({email,password});
  if(error){msg('authMsg',error.message);return}
  msg('authMsg', data.session ? "Compte créé et connecté." : "Compte créé. Vérifiez votre e-mail si la confirmation est activée.");
  if(data.session) await enterApp(data.user);
}
async function signIn(){
  const {data,error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error){msg('authMsg',error.message);return}
  await enterApp(data.user);
}
async function signOut(){await client.auth.signOut();location.reload()}

async function enterApp(user){
  sessionUser=user;$('authView').classList.add('hidden');$('appView').classList.remove('hidden');
  $('userArea').innerHTML=`<button class="gold" onclick="signOut()">Déconnexion</button>`;
  const {data:p}=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
  isAdmin=p?.role==='admin';$('adminCard').style.display=isAdmin?'block':'none';
  await loadBank();await refreshStats();
}
async function loadBank(){
  const {data,error}=await client.from('questions').select('*').eq('active',true).order('id');
  if(error){alert(error.message);return}
  bank=(data||[]).map(x=>({id:x.id,theme:x.theme,q:x.question,options:[x.option_a,x.option_b,x.option_c],answer:x.correct_answer,exp:x.explanation}));
  $('qCount').textContent=bank.length;
}
async function refreshStats(){
  const {data,error}=await client.from('attempts').select('question_id,is_correct').eq('user_id',sessionUser.id);
  if(error)return;
  const rows=data||[];$('doneCount').textContent=rows.length;$('rate').textContent=rows.length?Math.round(rows.filter(x=>x.is_correct).length/rows.length*100)+' %':'—';
  const wrong=new Set(rows.filter(x=>!x.is_correct).map(x=>x.question_id));
  rows.filter(x=>x.is_correct).forEach(x=>wrong.delete(x.question_id));$('errorCount').textContent=wrong.size;
}
function startQuiz(n){current=shuffle(bank).slice(0,Math.min(n,bank.length));index=0;score=0;showQuiz();render()}
async function startErrorQuiz(){
  const {data}=await client.from('attempts').select('question_id,is_correct,created_at').eq('user_id',sessionUser.id).order('created_at',{ascending:true});
  const state=new Map();(data||[]).forEach(r=>state.set(r.question_id,r.is_correct));
  current=shuffle(bank.filter(q=>state.get(q.id)===false));if(!current.length){alert("Aucune erreur à revoir.");return} index=0;score=0;showQuiz();render();
}
function showQuiz(){$('homeActions').classList.add('hidden');$('resultView').classList.add('hidden');$('adminView').classList.add('hidden');$('quizView').classList.remove('hidden')}
function render(){
  locked=false;const q=current[index];$('progress').textContent=`Question ${index+1} / ${current.length}`;$('theme').textContent=q.theme;$('questionText').textContent=q.q;$('feedback').innerHTML='';$('feedback').className='';$('nextBtn').classList.add('hidden');
  $('answers').innerHTML='';q.options.forEach((o,i)=>{const b=document.createElement('button');b.className='option';b.textContent=String.fromCharCode(65+i)+'. '+o;b.onclick=()=>answer(i,b);$('answers').appendChild(b)})
}
async function answer(choice,button){
  if(locked)return;locked=true;const q=current[index];const ok=choice===q.answer;document.querySelectorAll('.option')[q.answer].classList.add('correct');if(!ok)button.classList.add('wrong');else score++;
  $('feedback').className='feedback '+(ok?'good':'bad');$('feedback').innerHTML=`<b>${ok?'✅ Bonne réponse':'❌ Réponse incorrecte'}</b><br>${q.exp}`;$('nextBtn').classList.remove('hidden');
  await client.from('attempts').insert({user_id:sessionUser.id,question_id:q.id,selected_answer:choice,is_correct:ok});
}
function nextQuestion(){index++;if(index<current.length)render();else finish()}
async function finish(){
  $('quizView').classList.add('hidden');$('resultView').classList.remove('hidden');const pct=Math.round(score/current.length*100);$('finalScore').textContent=`${score} / ${current.length} — ${pct} %`;
  $('finalText').textContent=pct>=80?'Très bon résultat.':pct>=60?'Bon résultat, poursuivez les révisions ciblées.':'Reprenez les notions correspondant à vos erreurs.';await refreshStats();
}
function goHome(){$('quizView').classList.add('hidden');$('resultView').classList.add('hidden');$('adminView').classList.add('hidden');$('homeActions').classList.remove('hidden')}
function showAdmin(){if(!isAdmin)return;$('homeActions').classList.add('hidden');$('adminView').classList.remove('hidden')}
async function addQuestion(){
  const payload={theme:$('newTheme').value.trim(),question:$('newQuestion').value.trim(),option_a:$('newA').value.trim(),option_b:$('newB').value.trim(),option_c:$('newC').value.trim(),correct_answer:+$('newCorrect').value,explanation:$('newExplanation').value.trim(),active:true};
  if(Object.values(payload).some(v=>v===''||v===null)){msg('adminMsg','Tous les champs doivent être remplis.');return}
  const {error}=await client.from('questions').insert(payload);if(error){msg('adminMsg',error.message);return}
  msg('adminMsg','Question ajoutée.');await loadBank();
}
boot();
