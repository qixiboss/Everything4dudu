(() => {
const root=document.getElementById('kaoyan-plan');
if(!root)return;
const Data=window.ExamScheduleData;
const Model=window.ExamScheduleModel;
const names=Data.names;
const historyCompleted=Data.historyCompleted;
const phases=Data.phases;
const days=Model.buildSchedule(Data);
const fmt=m=>`${Math.floor(m/60)?Math.floor(m/60)+'h ':''}${Math.round(m%60)}m`;
const tc=m=>{const s=Math.round(m*60),h=Math.floor(s/3600),mm=Math.floor((s%3600)/60),ss=s%60;return h?`${h}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`};
const formatTimeRange=t=>t.spansDays?`${tc(t.from)}–${tc(t.to)}`:'';
const weekday=['周日','周一','周二','周三','周四','周五','周六'];
let state=Model.readState(localStorage,console);
const save=()=>Model.writeState(localStorage,state,console);
const prefersReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const subjectColor={math:'var(--viz-series-1)',co:'var(--viz-series-2)',os:'var(--viz-series-3)',net:'var(--viz-series-4)',ds:'var(--viz-series-5)'};
const subjectKeys=['math','co','os','net','ds'];
const lastDayIndex=days.length-1;
const todayIndex=()=>Model.todayIndex(days,new Date());
let selected=todayIndex();
const dayLabel=Model.dayLabel;
const allTasks=Model.allTasks(days);
const plannedVideoTasks=allTasks.filter(x=>x.t.subject!=='review');
const plannedTasksBySubject=Model.tasksBySubject(plannedVideoTasks);
const historyMinutes=Object.values(historyCompleted).reduce((sum,x)=>sum+x.minutes,0);
const plannedMinutes=plannedVideoTasks.reduce((sum,x)=>sum+x.t.duration,0);
const nextPending=()=>Model.nextPending(allTasks,state);

const elements=Object.fromEntries([
  'done-rate','done-detail','progress-fill','next-subject','next-short','subject-progress',
  'home-task-count','home-carry-count','home-minutes','today-heading','today-meta',
  'actual-rest','today-tasks','next-line','prev-day','next-day','go-today',
  'subject-filter','phase-filter','range-filter','hide-rest','timeline',
  'workspace-kicker','workspace-title'
].map(id=>[id,root.querySelector(`#${id}`)]));
const progressTrack=root.querySelector('.progress-track');
const navButtons=[...root.querySelectorAll('[data-view]')];
const appViews=[...root.querySelectorAll('.app-view')];

function renderStats(next){
  const donePlannedMinutes=plannedVideoTasks.filter(x=>state.completed[x.t.id]).reduce((sum,x)=>sum+x.t.duration,0),totalMinutes=historyMinutes+plannedMinutes,doneMinutes=historyMinutes+donePlannedMinutes,rawRate=doneMinutes/totalMinutes*100,rate=rawRate.toFixed(2);
  elements['done-rate'].textContent=`${rate}%`;
  elements['done-detail'].textContent=`${fmt(doneMinutes)} / ${fmt(totalMinutes)}`;
  elements['progress-fill'].style.width=`${rate}%`;
  progressTrack.setAttribute('aria-valuenow',String(rate));
  elements['next-subject'].textContent=next?names[next.t.subject]:'一轮完成';
  elements['next-short'].textContent=next?dayLabel(next.d):'全部任务已完成';

  elements['subject-progress'].innerHTML=subjectKeys.map(subject=>{const items=plannedTasksBySubject[subject]||[],history=historyCompleted[subject]||{minutes:0},minutes=items.reduce((a,x)=>a+x.t.duration,0)+history.minutes,doneMinutes=items.filter(x=>state.completed[x.t.id]).reduce((a,x)=>a+x.t.duration,0)+history.minutes,pct=minutes?Math.round(doneMinutes/minutes*100):0,color=subjectColor[subject];return `<div class="subject-row"><strong>${names[subject]}</strong><div class="subject-bar" role="progressbar" aria-label="${names[subject]}完成进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%;background:${color};box-shadow:0 0 6px color-mix(in srgb,${color} 50%,transparent)"></span></div><small>${pct}%</small></div>`}).join('');
}

function renderToday(next){
  const d=days[selected],rested=!!state.rested[d.i];
  const viewTasks=Model.tasksForDay(allTasks,state,d);
  const carryCount=viewTasks.filter(x=>x.d.i<d.i).length;
  const pendingTasks=viewTasks.filter(x=>!state.completed[x.t.id]);
  elements['home-task-count'].textContent=`${pendingTasks.length} 项`;
  elements['home-carry-count'].textContent=`${carryCount} 项`;
  elements['home-minutes'].textContent=fmt(pendingTasks.reduce((sum,x)=>sum+x.t.duration,0));
  elements['today-heading'].textContent=dayLabel(d);
  elements['today-meta'].textContent=`${weekday[d.date.getDay()]} · ${d.rest?'计划全天休息':'正常学习日'}${carryCount?` · 顺延 ${carryCount} 项`:''}`;
  elements['actual-rest'].checked=rested;
  let html='';
	  if(d.rest) html='<div class="rest-message"><i data-lucide="coffee" aria-hidden="true"></i><div><strong>计划全天休息</strong><p>可以勾选上方开关，留下实际休息记录。</p></div></div>';
	  else if(rested) html='<div class="rest-message"><i data-lucide="moon" aria-hidden="true"></i><div><strong>已记录为实际休息日</strong><p>原定内容未被算作完成，会自动顺延。</p></div></div>';
	  else if(!viewTasks.length) html='<div class="rest-message"><i data-lucide="check-circle-2" aria-hidden="true"></i><div><strong>暂无待完成任务</strong><p>截至这一天没有待完成任务。</p></div></div>';
  else viewTasks.forEach(({d:origin,t})=>{const done=!!state.completed[t.id],late=origin.i<d.i,lateDays=d.i-origin.i,code=formatTimeRange(t);html+=`<label class="check-task ${done?'done':''}" data-task-row-id="${t.id}"><input type="checkbox" data-task-id="${t.id}" aria-label="完成：${t.title.replace(/"/g, '&quot;')}" ${done?'checked':''}><span class="check-subject">${names[t.subject]}</span><span class="check-title">${late?`<span class="carry">顺延 ${lateDays} 天</span>`:''}${t.title}${code?`<span class="timecode">${code}</span>`:''}</span><span class="check-duration">${fmt(t.duration)}</span></label>`});
  elements['today-tasks'].innerHTML=html;
  
  if(!next) elements['next-line'].innerHTML='<strong>下一步：</strong>一轮任务已全部完成。';
  else {const code=formatTimeRange(next.t),late=Math.max(0,d.i-next.d.i),carried=late?` · 已顺延 ${late} 天`:state.rested[next.d.i]?' · 已从休息日顺延':'';elements['next-line'].innerHTML=`<strong>下一步：</strong>${names[next.t.subject]} · ${next.t.title}${code?` <span class="timecode">${code}</span>`:''} <span class="text-muted">${dayLabel(next.d)}${carried}</span>`;}
  elements['prev-day'].disabled=selected===0;
  elements['next-day'].disabled=selected===lastDayIndex;
}

function renderTimeline(){
  const sf=elements['subject-filter'].value,pf=elements['phase-filter'].value,scope=elements['range-filter'].value,hide=elements['hide-rest'].checked;let html='',last=0;
  const from=Math.min(Math.max(0,selected-3),days.length-7),visible=scope==='all'?days:days.slice(from,from+7);
  visible.forEach(d=>{if(pf!=='all'&&String(d.phase)!==pf)return;if(d.rest&&hide)return;const tasks=d.tasks.filter(t=>sf==='all'||t.subject===sf||t.subject==='review');if(!d.rest&&!tasks.length)return;if(d.phase!==last){const p=phases[d.phase];html+=`<div class="phase"><h2>${p[0]}</h2><p>${p[1]}</p></div>`;last=d.phase}const md=`${d.date.getMonth()+1}月${d.date.getDate()}日`,rested=!!state.rested[d.i];html+=`<article class="day"><div class="date"><strong>Day ${d.i} · ${md}</strong><span class="dayno text-small">${weekday[d.date.getDay()]}${rested?' · 已记休息':''}</span></div><div class="tasks">`;if(d.rest)html+=`<div class="rest">全天休息${rested?' · 已记录':''}</div>`;else tasks.forEach(t=>{const code=formatTimeRange(t);html+=`<div class="task ${t.subject} ${state.completed[t.id]?'done':''}"><span class="label">${names[t.subject]}</span><span>${state.completed[t.id]?'✓ ':''}${t.title}${code?`<span class="timecode">${code}</span>`:''}</span><span class="duration">${fmt(t.duration)}</span></div>`});html+=`</div></article>`});elements.timeline.innerHTML=html;
}
function renderAll(){const next=nextPending();renderStats(next);renderToday(next);try{globalThis.lucide?.createIcons({attrs:{width:16,height:16}})}catch(e){}}
const taskPositions=()=>new Map([...elements['today-tasks'].querySelectorAll('[data-task-row-id]')].map(el=>[el.dataset.taskRowId,el.getBoundingClientRect()]));
function animateTaskQueue(previous,movedId){
  if(prefersReducedMotion)return;
  requestAnimationFrame(()=>elements['today-tasks'].querySelectorAll('[data-task-row-id]').forEach(el=>{el.getAnimations().forEach(a=>a.finish());const before=previous.get(el.dataset.taskRowId);if(!before)return;const after=el.getBoundingClientRect(),dx=before.left-after.left,dy=before.top-after.top;if(Math.abs(dx)<1&&Math.abs(dy)<1)return;const moved=el.dataset.taskRowId===movedId;el.style.zIndex=moved?'2':'1';const animation=el.animate([{transform:`translate(${dx}px, ${dy}px) scale(${moved?0.985:1})`,opacity:moved?0.76:1},{transform:'translate(0, 0) scale(1)',opacity:1}],{duration:moved?480:380,easing:'cubic-bezier(.22, 1, .36, 1)'});animation.onfinish=()=>{el.style.zIndex=''}}));
}
elements['today-tasks'].addEventListener('change',e=>{const id=e.target.dataset.taskId;if(!id)return;const previous=taskPositions();if(e.target.checked)state.completed[id]=Date.now();else delete state.completed[id];save();renderAll();animateTaskQueue(previous,id)});
elements['actual-rest'].addEventListener('change',e=>{const d=days[selected];state.rested[d.i]=e.target.checked;if(!e.target.checked)delete state.rested[d.i];save();renderAll()});
elements['prev-day'].addEventListener('click',()=>{selected=Math.max(0,selected-1);renderToday(nextPending())});
elements['next-day'].addEventListener('click',()=>{selected=Math.min(lastDayIndex,selected+1);renderToday(nextPending())});
elements['go-today'].addEventListener('click',()=>{selected=todayIndex();renderToday(nextPending())});
[elements['subject-filter'],elements['phase-filter'],elements['range-filter'],elements['hide-rest']].forEach(el=>el.addEventListener('change',renderTimeline));
const viewMeta={today:['TODAY','今日执行'],plan:['ROADMAP','完整日程'],progress:['PROGRESS','学习进度']};
navButtons.forEach(btn=>btn.addEventListener('click',()=>{const view=btn.dataset.view;navButtons.forEach(x=>{const active=x===btn;x.classList.toggle('is-active',active);x.setAttribute('aria-pressed',String(active));active?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});appViews.forEach(x=>x.classList.toggle('hidden',x.id!==`view-${view}`));elements['workspace-kicker'].textContent=viewMeta[view][0];elements['workspace-title'].textContent=viewMeta[view][1];if(view==='plan')renderTimeline();if(view==='progress')renderStats(nextPending())}));
renderAll();
})();

