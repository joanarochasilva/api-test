import fs from 'fs/promises';

const dataBasePath = './db.json';

export async function readData(entity) {
    const data = await fs.readFile(dataBasePath, 'utf-8');
    const dataParse = JSON.parse(data.toString());

    if(!dataParse[entity]) {
        throw new Error(`Entity ${entity} not found in database`);
    }

    return dataParse[entity];
}

export async function writeData(entity, saveData) {
    const data = await fs.readFile(dataBasePath, 'utf-8');
    const dataParse = JSON.parse(data.toString());

    if(!dataParse[entity]) {
        throw new Error(`Entity ${entity} not found in database`);
    }

    // push the new item into the existing array
    dataParse[entity].push(saveData);

    // writeFile signature: (path, data[, options])
    await fs.writeFile(dataBasePath, JSON.stringify(dataParse, null, 2), 'utf-8');
}