const pdfPrinter = require("pdf-to-printer");

async function getPrinters(){
    return await pdfPrinter.getPrinters();
}

function report(Message){
    console.log("Testing local printing module:");
    console.log("Outputting list of localy defined Printers:");
    console.log(Message);
}

function error(Message){
    console.log("Testing local printing module:");
    console.log("Error encountered:");
    console.log(Message);
}

Promise.resolve()
.then(getPrinters)
.then(report)
.catch(error)