import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import * as transport from '../transport.js';

async function fixture(model='build-st/gemini-4-argon'){
 const handlers=new Map(),errors=[];let chatReads=0;
 const settings={chat_completion_source:'custom',custom_model:model,prompts:[{identifier:'main'},{identifier:'worldInfoBefore',marker:true}]};
 const manager={serviceSettings:settings,preparePrompt:p=>({...p})};
 const ctx={extensionSettings:{build_standalone_adapter:{enabled:true}},chat:[{role:'user',content:'UNRELATED_CHAT'}],getTokenCountAsync:async()=>20,eventTypes:{GENERATION_STARTED:'start',GENERATION_AFTER_COMMANDS:'after',CHAT_COMPLETION_SETTINGS_READY:'send',APP_READY:'ready'},eventSource:{on:(e,f)=>handlers.set(e,f),makeLast:(e,f)=>handlers.set(e,f)}};
 const code=(await readFile(new URL('../runtime.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export function','function')+'\ninstallSillyTavern({getContext,openAI});';
 vm.runInNewContext(code,{...transport,getContext:()=>ctx,openAI:{oai_settings:settings,promptManager:manager,setOpenAIMessages:()=>{chatReads++;return [{role:'user',content:'CURRENT'}];}},crypto:webcrypto,document:{querySelector:()=>null},toastr:{error:m=>errors.push(m)}});
 return {handlers,manager,settings,errors,reads:()=>chatReads};
}
const outgoing=(f,messages,type='normal')=>({type,chat_completion_source:'custom',model:f.settings.custom_model,messages});
const decode=data=>JSON.parse(data.messages[0].content.slice(transport.WIRE_PREFIX.length));

test('standard requests preserve exact inline preset and ordered file context',async()=>{
 const f=await fixture();f.handlers.get('start')('normal',{},false);
 const preset='  exact preset\n😀\r\n';
 const p=f.manager.preparePrompt({identifier:'main',role:'system',content:preset});
 const w=f.manager.preparePrompt({identifier:'worldInfoBefore',role:'system',content:'WORLD'});
 const data=outgoing(f,[p,w,{role:'assistant',content:'HISTORY'},{role:'user',content:'CURRENT'}]);await f.handlers.get('send')(data);
 const envelope=decode(data);assert(!envelope.error);
 assert.equal(envelope.segments.find(s=>s.text===preset).placement,'inline');
 assert.equal(envelope.segments.find(s=>s.text==='WORLD').placement,'file');
 assert.equal(envelope.segments.find(s=>s.text==='HISTORY').placement,'file');
 assert.equal(envelope.segments.find(s=>s.text==='CURRENT').placement,'inline');assert.deepEqual(f.errors,[]);
});

test('native quiet tasks only use supplied messages and preserve prefill',async()=>{
 const f=await fixture();const input=[{role:'system',content:'TASK'},{role:'user',content:'DRAFT'},{role:'assistant',content:'PREFILL'}];
 const data=outgoing(f,structuredClone(input),'quiet');await f.handlers.get('send')(data);
 const result=decode(data);assert.equal(result.generationType,'quiet');assert.equal(f.reads(),0);
 assert.deepEqual(Array.from(result.segments,s=>[s.role,s.text]),input.map(s=>[s.role,s.content]));
 assert.equal(result.segments[0].placement,'inline');assert.equal(result.segments[1].placement,'file');
});

test('TavernHelper raw provenance survives its normal request type and config reuse',async()=>{
 const f=await fixture();const original=[{role:'user',content:'TASK\n exact  text'}];const config={ordered_prompts:original,max_chat_history:0,should_silence:true};
 for(let i=0;i<2;i++){
  await f.handlers.get('js_generation_requested')('test-'+i,'generateRaw',config);
  const data=outgoing(f,config.ordered_prompts.map(p=>({role:p.role,content:p.content})));await f.handlers.get('send')(data);
  const result=decode(data);assert.equal(result.generationType,'quiet');assert.equal(result.segments[0].text,original[0].content);assert.equal(result.segments[0].placement,'file');
 }
 assert.equal(f.reads(),0);assert.equal(original[0].content,'TASK\n exact  text');assert.deepEqual(f.errors,[]);
});

test('unmarked ordinary requests fail closed; other model routes remain untouched',async()=>{
 const f=await fixture();const bad=outgoing(f,[{role:'user',content:'NO_SOURCE'}]);await f.handlers.get('send')(bad);assert.equal(decode(bad).error,'preset_not_ready');
 const other=await fixture('build/gemini-4-argon');const data=outgoing(other,[{role:'user',content:'ORIGINAL'}]);const before=structuredClone(data);await other.handlers.get('send')(data);assert.deepEqual(data,before);
});
