const express = require("express");
const jsdom = require("jsdom");

const phones = require("./data/phones.json");

const { JSDOM } = jsdom;

const phonesList = phones.map(x => x.codename);

const app = express();
const port = process.env.DEV ? 6060 : 80;

let cache = {};

let pixelOSDevices = [];
let exDevices = [];
let elixirDevices = [];
let crDroidDevices = [];
(async () => {
    let f, j, t, dom;

    try {
        // PixelOS
        f = await fetch("https://pixelos.net/_next/data/eLGsVvi5WcVo56C5Ob-VH/download.json");
        j = await f.json();
        for(let i of j.pageProps.devices) {
            pixelOSDevices.push(i.codename);
            pixelOSDevices.push(i.codename_alt);
        }
        pixelOSDevices = Array.from(new Set(pixelOSDevices));
        console.log("Loaded pixelOS:");
        console.log(pixelOSDevices);
    } catch(e) { console.error(e); }
    try {
        // Evolution X
        f = await fetch("https://raw.githubusercontent.com/Evolution-X-Devices/official_devices/master/devices.json");
        j = await f.json();
        for(let i of j)
            exDevices.push(i.codename);
        console.log("Loaded Evolution X:");
        console.log(exDevices);
    } catch(e) { console.error(e); }
    try {
        // Project Elixir
        f = await fetch("https://projectelixiros.com/assets/json/download.json");
        j = await f.json();
        for(let i of j)
            for(let k of i.deviceDetails)
                elixirDevices.push(k.codeName);
        console.log("Loaded Elixir:");
        console.log(elixirDevices);
    } catch(e) { console.error(e); }
    try {
        // crDroid
        f = await fetch("https://crdroid.net/downloads");
        t = await f.text();
        dom = new JSDOM(t, { "contentType": "text/html" });
        crDroidDevices = Array.from(dom.window.document.querySelectorAll(".device > div > h5")).map(x => x.textContent);
        console.log("Loaded crDroid:");
        console.log(crDroidDevices);
    } catch(e) { console.error(e); }
})();

app.get("/api/devices", (_, res) => {
    res
        .status(200)
        .send(phonesList);
});
app.get("/api/photo/*", (req, res) => {
    const name = req.path.split("/").filter(x => x)?.[2];
    if(!name)
        return res.status(400).send("No model specified");
    res
        .redirect(`https://wiki.lineageos.org/images/devices/${name}.png`);
});
app.get("/api/check/*", async (req, res) => {
    try {
        const name = req.path.split("/").filter(x => x)?.[2];
        if(!name)
            return res.status(400).send("No model specified");
        let output = {};
        let f;
        const phone = phones.find(x => x.codename == name);

        // Checks
        // LineageOS
        f = await fetch(`https://wiki.lineageos.org/devices/${name}`);
        output.lineage = f.status < 400;
        // PixelExperience
        f = await fetch(`https://get.pixelexperience.org/${name}`);
        output.pe = f.status < 400;
        // PixelOS
        output.pixelos = pixelOSDevices.includes(name);
        // Paranoid
        f = await fetch(`https://paranoidandroid.co/${name}`);
        output.paranoid = f.status < 400;
        // Evolution X
        output.ex = exDevices.includes(name);
        // Elixir
        output.elixir = elixirDevices.includes(name);
        // crDroid
        output.cr = crDroidDevices.includes(name);

        // XDA
        output.xda = [];
        if(phone && phone.xda) {
            f = await fetch(phone.xda);
            const t = await f.text();
            const dom = new JSDOM(t, { "contentType": "text/html" });
            
            const els = dom.window.document.querySelectorAll(".js-threadList > div");
            for(let i of els)
                output.xda.push(i.querySelector(".structItem-title > a:nth-last-child(1)").textContent);
        };

        res
            .status(200)
            .send(output);
    } catch(e) {
        console.error(e);
        res
            .status(500)
            .send("err");
    }
});

app.listen(port);