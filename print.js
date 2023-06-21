// Author: Jean-Marie Thewes

//Modules:
const path = require('path');
const fs = require("fs").promises;

const pdfPrinter = require("pdf-to-printer");
const puppeteer = require('puppeteer');

const config = require("./config.js");
const log = require("./log.js");
const almaPrint = require("./alma-print.js");

//Global vars:

const resultLimit = 100;
const configFileName = "config/config.json";

var puppetBrowser;
var puppetExtra;

//Environment vars:
process.env.configFileName = configFileName;

//Functions:


function reportAndClose(error){// Major Error occured, log error and close
    if("message" in error){
        log.error(`${error.name}: ${error.message}(${error.cause})`);
        log.debug(error.stack);
    }else{
        log.error(error);
    }
    return true //to let the next function (close()) know that an error occured
}//------------------------------------------------------------------------------------------
function reportAndContinue(error){// Minor Error occured, log error and continue
    if("message" in error){
        log.warn(`${error.name}: ${error.message}(${error.cause})`);
        log.debug(error.stack);
    }else{
        log.warn(error);
    }
}//------------------------------------------------------------------------------------------

async function close(error){// Close Puppeteer if it is still open and exit
    if(puppetBrowser){await puppeteerStopBrowser()}
    await log.flushLogs();
    if(error){
        process.exit(1);
    }else{
        process.exit(0);
    }
}//------------------------------------------------------------------------------------------

async function generatePrinterArray(){// extract alma printers from config to query
    var result = [];
    for(element of await config.getAlmaPrinters()){
        if(!result.includes(element.almaPrinter)){result.push(element.almaPrinter)}
    }
    log.debug({"Printer Array for query":JSON.stringify(result)})

    return result;
}//------------------------------------------------------------------------------------------

async function puppeteerStartBrowser(){
    puppetBrowser = await puppeteer.launch({headless: "new"})
    // Puppeteer sometimes closes when the last page is closed so the following page exists to prevent that
    puppetExtra = await puppetBrowser.newPage();
    
}//------------------------------------------------------------------------------------------

async function puppeteerStopBrowser(){
    if(puppetBrowser){await puppetBrowser.close()}
}//------------------------------------------------------------------------------------------

async function puppeteerPDF(html,format,marginTop,marginBottom,marginLeft,marginRight){
    // To prevent issues a new page is created and closed afterwards
    var puppetPage = await puppetBrowser.newPage();
    await puppetPage.setContent(html, {waitUntil: "domcontentloaded"});
    var result =  await puppetPage.pdf({format:format,margin:{top:marginTop,bottom:marginBottom,left:marginLeft,right:marginRight}});
    await puppetPage.close();
    return result;
}//------------------------------------------------------------------------------------------

async function getPrintOuts(printerArray){
    var result = [];
    var tmp = await almaPrint.getPrintOuts(printerArray,resultLimit);
    if(("printout" in tmp)&&("total_record_count" in tmp)){
        log.info(`total record count in response: ${tmp.total_record_count}`)
        result.push(...tmp.printout);
        if(resultLimit < tmp.total_record_count){
            log.info("offset request required");
            for(var offset = resultLimit;offset < tmp.total_record_count;offset += resultLimit){
                var tmp2 = await almaPrint.getPrintOuts(printerArray,resultLimit,offset);
                if("printout" in tmp2){
                    result.push(...tmp2.printout)
                }else{throw new Error("API returned unexpected format/data while requesting with offset",{cause:"getPrintOuts"})}
            }
        }
        return result;
    }else{
        if("total_record_count" in tmp){
            if (tmp.total_record_count == 0){
                log.info("API returned 0 results")
                return result;
            }
        }else{throw new Error("API returned unexpected format/data",{cause:"getPrintOuts"})}
    }
}//------------------------------------------------------------------------------------------

async function printLetter(input){
    const fail = ()=>{throw new Error("malformed letter entry recieved",{cause:"printLetter"})}
    var id;
    if("id" in input){id = input.id}else{fail()}
    var printer;
    if(("printer" in input)&&("value" in input.printer)){printer = input.printer.value}else{fail()}
    var letter;
    if("letter" in input){letter = input.letter}else{fail()}
    var type;
    if("printout" in input){type = input.printout}else{fail()}

    
    var configPrinters = await config.getAlmaPrinters();
    var localPrinterArray = configPrinters.filter(element => element.almaPrinter == printer); //filter for elements in array that have that printer
    log.info({letterType:type,letterID:id,almaprinterid:printer,almaprintername:input.printer.desc})

    for([index,localPrinter] of localPrinterArray.entries()){
        var filename = path.join(__dirname,"pdf",`${id}-${index}.pdf`);
        var pdf = await puppeteerPDF(letter,localPrinter.letterFormat,localPrinter.marginTop,localPrinter.marginBottom,localPrinter.marginLeft,localPrinter.marginRight);
        await fs.writeFile(filename,pdf);
        log.info(`Letter: ${id} destination Printer: ${localPrinter.localPrinter}`)
        await pdfPrinter.print(filename,{
            printer:localPrinter.localPrinter,
            paperSize:localPrinter.letterFormat,
            copies:localPrinter.copies,
            orientation:localPrinter.orientation,
            scale:"fit"
        });
        if(await !config.getPDFRetention()){await fs.unlink(filename)}
    }
    await almaPrint.markAsPrinted(id);
    return
}//------------------------------------------------------------------------------------------

async function printLetters(inputArray){
    for(element of inputArray){
        await printLetter(element).catch(reportAndContinue)
    }
    return false //to let the next function (close()) know the no error occured
}//------------------------------------------------------------------------------------------

//Main:

Promise.resolve()
.then(log.init)
.then(puppeteerStartBrowser)
.then(generatePrinterArray)
.then(getPrintOuts)
.then(printLetters)
.catch(reportAndClose)
.then(close)
