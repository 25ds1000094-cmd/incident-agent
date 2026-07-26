import fs from "fs";

const file="./data/runs.json";


function readDB(){
    return JSON.parse(fs.readFileSync(file));
}


function writeDB(data){
    fs.writeFileSync(
        file,
        JSON.stringify(data,null,2)
    );
}


export function saveRun(id,data){

    const db=readDB();

    db.runs[id]=data;

    writeDB(db);
}


export function getRun(id){

    const db=readDB();

    return db.runs[id] || null;
}
