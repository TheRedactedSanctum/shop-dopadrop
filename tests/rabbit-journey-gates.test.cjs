const test = require('node:test');
const assert = require('node:assert/strict');
const { guardianAvailability, localPeriod, journeyPhase, advanceJourneyState, forestJourneyView } = require('../src/backend/rabbitJourneyGate.js');
const prelude = ['mothkeeper:wait','rootwhisper:protect','grumblebark:listen'];
const state = () => ({foundCount:50,forestState:{encounters:[...prelude],fragments:[],bonds:{}}});
test('local day/night boundaries use server instant and declared timezone, including Sydney summer time',()=>{
    for(const [utc,day] of [['2026-11-26T16:59:00Z',false],['2026-11-26T17:00:00Z',true],['2026-11-27T04:59:00Z',true],['2026-11-27T05:00:00Z',false]]){
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
    assert.equal(nightGate.guardian,null);
    assert.deepEqual(nightGate.choices.map(choice => choice.guardianKey), ['mothkeeper', 'grumblebark']);
    assert.ok(nightGate.choices.every(choice => choice.kind === 'story'));
    const trail=forestJourneyView({guardian:{id:'tanglebright'}},s,{});
    assert.equal(trail.guardian,null);assert.equal(trail.choices[0].route,'/grimroot-tavern');
});
test('an asleep current guardian does not trap the player away from completed keepers’ riddles', () => {
    const s=state();s.forestState.encounters=['mothkeeper:wait'];
    const request={timeZone:'Australia/Sydney'};
    const now=new Date('2026-11-27T01:00:00Z');
    const view=forestJourneyView({guardian:{id:'rootwhisper'},choices:[]},s,request,now);
    assert.equal(view.locked,false);assert.equal(view.guardian,null);
    assert.equal(view.choices[0].guardianKey,'mothkeeper');
    const hub=forestJourneyView({guardian:{id:'tanglebright'}},state(),request,now);
    assert.deepEqual(hub.choices.map(choice=>choice.id),['travel-tavern','revisit-mothkeeper','revisit-grumblebark']);
    const first=state();first.forestState.encounters=[];
    const sleeping=forestJourneyView({guardian:{id:'mothkeeper'}},first,{timeZone:'Europe/London'},now);
    assert.equal(sleeping.locked,true);assert.deepEqual(sleeping.choices,[]);
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
