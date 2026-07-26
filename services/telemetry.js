import {randomUUID} from "crypto";


export function createTrace(){

return {
traceId:
randomUUID().replaceAll("-",""),

spans:[]
};

}


export function addSpan(trace,name){

trace.spans.push({

traceId:trace.traceId,

spanId:
randomUUID().replaceAll("-",""),

name:name

});

}
