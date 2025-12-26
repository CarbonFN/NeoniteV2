const sails = require("sails");
const NeoLog = require("./structs/NeoLog")
const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");
const ini = require("ini");

const isPackaged = __dirname.includes('caxa'); //check if running in packaged exe
const baseDir = isPackaged ? process.cwd() : __dirname;
const sailsAppPath = isPackaged ? __dirname : process.cwd();

const configPath = path.join(baseDir, "config.ini");
const keychainPath = path.join(baseDir, "responses", "keychain.json");

const config = ini.parse(fs.readFileSync(configPath, "utf-8"));

const responsesDir = path.join(baseDir, "responses");
if (!fs.existsSync(responsesDir)) {
    fs.mkdirSync(responsesDir, { recursive: true });
}

let keychain;
if (fs.existsSync(keychainPath)) {
    keychain = JSON.parse(fs.readFileSync(keychainPath, "utf-8"));
} else {
    keychain = [];
}

async function compareAndUpdateKeychain() {
    const response = await axios.get('https://fortnitecentral.genxgames.gg/api/v1/aes', {validateStatus: () => true});    
    if (response.status === 200) {
        const data = response.data;

        let missingCount = 0;
        const keychainArray = [];

        for (const keys of data.dynamicKeys) {
            if (!keychain.includes(keys.keychain)) {
                missingCount++;
                keychainArray.push(keys.keychain);
            }
        }
        keychain.push(...keychainArray);

        fs.writeFileSync(keychainPath, JSON.stringify(keychain, null, 2));
        NeoLog.Debug(`Fetched ${missingCount} New Keychains from Fortnite Central.`);
    } 
    else if (response.status !== 200) {
        NeoLog.warn("Fortnite Central is down, falling back to dillyapis for the keychain");
        const fallbackResponse = await axios.get('https://export-service.dillyapis.com/v1/aes', {validateStatus: () => true});
        if (fallbackResponse.status === 200) {
            const data = fallbackResponse.data
            let missingCount = 0;
            const keychainArray = [];

            for (const keys of data.dynamicKeys) {
                if (!keychain.includes(keys.keychain)) {
                    missingCount++;
                    keychainArray.push(keys.keychain);
                }
            }
            keychain.push(...keychainArray);
            fs.writeFileSync(keychainPath, JSON.stringify(keychain, null, 2));
            NeoLog.Debug(`Fetched ${missingCount} New Keychains From dillyapis`);
        }
        else 
        {
            NeoLog.Error("Unable to connect to both Fortnite Central and dillyapis! Falling back to existing keychains on your local disk. You may experience issues!");
        }
    }
}

async function startBackend() {
    sails.lift({
        appPath: sailsAppPath,  //tell sails where it should look for the files
        port: 5595,
        environment: "production",
        hooks: {
            session: false
        },
        log: {
            level: config.logLevel
        },
    }, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

async function runFunctions() {
    await compareAndUpdateKeychain();
    await startBackend();
}

runFunctions();