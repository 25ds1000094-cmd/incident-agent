import OpenAI from "openai";

const client=new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
});


export async function planIncident(incident){

const prompt=`
Choose the root cause.

Allowed causes:
${incident.allowedRootCauses.join("\n")}

Transcript:

${incident.transcript}

Return JSON:

{
"rootCause":"",
"evidence":[]
}
`;

const response =
await client.chat.completions.create({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:"You are an incident response planner."
},
{
role:"user",
content:prompt
}
],

response_format:{
type:"json_object"
}

});


return JSON.parse(
response.choices[0].message.content
);

}
