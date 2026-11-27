import assert from 'node:assert/strict';
const base='http://127.0.0.1:3000';
const backend='http://127.0.0.1:3001';
const headers={'Content-Type':'application/json'};
async function register(label) {
  const r=await fetch(backend+'/api/email-auth',{method:'POST',headers,body:JSON.stringify({action:'register',name:label,email:label+'@example.invalid',password:'synthetic-test-only-2026',remember:true})});
  assert.equal(r.status,201);
  const cookie=r.headers.get('set-cookie')?.split(';')[0];
  assert.match(cookie,/^nutrivn_session=[a-f0-9]{64}$/);
  return cookie;
}
const read=(cookie='')=>fetch(base+'/api/next-diary',{headers:{cookie},redirect:'manual'});
const a=await register('runtime-test-a'), b=await register('runtime-test-b');
assert.equal((await read()).status,401);
assert.equal((await read('nutrivn_session='+'a'.repeat(64))).status,401);
const write=await fetch(backend+'/api/diary',{method:'POST',headers:{...headers,cookie:a},body:JSON.stringify({name:'Synthetic food label',date:'2026-11-28',category:'lunch'})});
assert.equal(write.status,201);
const ar=await read(a), br=await read(b);
assert.equal(ar.status,200); assert.equal(br.status,200);
assert.match(ar.headers.get('cache-control'),/no-store/);
assert.equal((await ar.json()).meals[0].name,'Synthetic food label');
assert.deepEqual((await br.json()).meals,[]);
console.log('Runtime route: anonymous and invalid session denied, account isolation verified against mock, no-store.');
