const express = require("express");
const ejs = require("ejs");
const axios = require("axios");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.set("view engine", "ejs");

const links = ["https://alessandrore.it"];

// Configura Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "sitoalessandrore@gmail.com",
        pass: "xtvumrskpkkxxlhc" // 🔴 NON METTERE LA PASSWORD QUI IN PRODUZIONE!
    }
});

// Funzione per inviare email
async function sendEmail(link) {
    const mailOptions = {
        from: "sitoalessandrore@gmail.com",
        to: "alejandrepixel@gmail.com",
        subject: `🔴 ATTENZIONE: ${link} è DOWN!`,
        text: `Il sito ${link} risulta offline. Controlla lo stato del server.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email inviata: ${link} è DOWN!`);
    } catch (error) {
        console.error("❌ Errore nell'invio dell'email:", error);
    }
}

// Funzione per controllare se un sito è online
async function checkLink(link) {
    try {
        const response = await axios.get(link, { timeout: 5000 }); // Timeout di 5 sec
        return response.status === 200;
    } catch (error) {
        return false; // Se il sito non risponde, lo consideriamo DOWN
    }
}

// Controllo tutti i link e invia email se un sito è DOWN
async function checkAllLinks() {
    console.log("🔍 Controllo dei link in corso...");
    for (const link of links) {
        const isUp = await checkLink(link);
        console.log(`${link} è ${isUp ? "UP 🟢" : "DOWN 🔴"}`);
        
        if (!isUp) {
            await sendEmail(link); // Manda un'email se il sito è DOWN
        }
    }
    console.log("✅ Controllo completato.\n");
}

// Esegui il controllo ogni minuto
cron.schedule("*/1 * * * *", () => {
    checkAllLinks();
});

app.get("/", async (req, res) => {
    const statusList = await Promise.all(
        links.map(async (link) => {
            const isUp = await checkLink(link);
            return { link, status: isUp ? "UP 🟢" : "DOWN 🔴" };
        })
    );
    res.render("index", { statusList });
});

app.post("/rimuovi-sito", (req, res) => {
    const linkDaEliminare = req.body.link;
    const index = links.indexOf(linkDaEliminare);
    if (index !== -1) {
        links.splice(index, 1);
    }
    res.redirect("/");
});

app.post("/aggiunta-sito", (req, res) => {
    let nuovoLink = req.body.url.trim();
    if (!nuovoLink.startsWith("https://") && !nuovoLink.startsWith("http://")) {
        nuovoLink = "https://" + nuovoLink;
    }
    if (nuovoLink && !links.includes(nuovoLink)) {
        links.push(nuovoLink);
    }
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("🚀 Server avviato su http://localhost:3000");
});
