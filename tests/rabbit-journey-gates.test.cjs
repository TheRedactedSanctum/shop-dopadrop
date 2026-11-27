const test = require('node:test');
const assert = require('node:assert/strict');
const { guardianAvailability, localPeriod, journeyPhase, advanceJourneyState, forestJourneyView } = require('../src/backend/rabbitJourneyGate.js');
const prelude = ['mothkeeper:wait','rootwhisper:protect','grumblebark:listen'];
const state = () => ({foundCount:50,forestState:{encounters:[...prelude],fragments:[],bonds:{}}});
test('local day/night boundaries use server instant and declared timezone, including Sydney summer time',()=>{
    for(const [utc,day] of [['2026-11-26T18:59:00Z',false],['2026-11-26T19:00:00Z',true],['2026-11-27T06:59:00Z',true],['2026-11-27T07:00:00Z',false]]){
        const now=new Date(utc);
        assert.equal(guardianAvailability('mothkeeper','Australia/Sydney',now).available,day);
        assert.equal(guardianAvailability('rootwhisper','Australia/Sydney',now).available,!day);
    }
    assert.equal(localPeriod('invalid/zone'),null);
    assert.equal(guardianAvailability('mothkeeper',undefined).available,false);
});
test('unavailable guardians and Tanglebright never leak their portraits or actions into forest',()=>{
    const s=state();
    const view={guardian:{id:'rootwhisper'},choices:[{id:'protect'}]};
    const nightGate=forestJourneyView(view,s,{guardianKey:'rootwhisper',timeZone:'Australia/Sydney'},new Date('2026-11-27T01:00:00Z'));
    assert.equal(nightGate.guardian,null);assert.deepEqual(nightGate.choices,[]);
    const trail=forestJourneyView({guardian:{id:'tanglebright'}},s,{});
    assert.equal(trail.guardian,null);assert.equal(trail.choices[0].route,'/grimroot-tavern');
});
test('tavern, 50 discoveries, catacombs, lair order cannot be skipped',()=>{
    const s=state();
    assert.equal(journeyPhase(s,'cave'),'tavern-required');
    assert.throws(()=>advanceJourneyState(s,'cave','catacombs'),/LOCKED/);
    advanceJourneyState(s,'tavern','rest');
    s.foundCount=49;assert.equal(journeyPhase(s,'cave'),'discoveries-required');
    s.foundCount=50;assert.equal(journeyPhase(s,'cave'),'catacombs');
    advanceJourneyState(s,'cave','catacombs');assert.equal(journeyPhase(s,'cave'),'lair');
    s.forestState.encounters.push('tanglebright:approach');assert.equal(journeyPhase(s,'cave'),'reward');
});
test('prior completed guardians and reward progress are preserved',()=>{
    const s=state();s.forestState.encounters.push('tanglebright:approach');
    assert.equal(journeyPhase(s,'cave'),'reward');
    const early=state();early.forestState.encounters.pop();assert.equal(journeyPhase(early,'tavern'),'tavern-welcome');
    assert.equal(journeyPhase(early,'cave'),'forest');
    assert.throws(() => advanceJourneyState(early,'tavern','rest'), /LOCKED/);
});
