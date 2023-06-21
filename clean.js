// Author: Jean-Marie Thewes

//Modules:
const path = require('path');
const fs = require("fs").promises;

const config = require("./config.js");
const log = require("./log.js");

//Global vars:
const configFileName = "config/config.json";
const now = new Date();
var maxLogAgeInMS;
var maxPDFAgeInMS;


//Environment vars:
process.env.configFileName = configFileName;


//Functions:
function reportAndClose(error){// Major Error occured, log error and close
    if("message" in error){
        log.error(`${error.name}: ${error.message}`);
        log.debug(error.stack);
    }else{
        log.error(error);
    }
    return true //to let the next function (close()) know that an error occured
}//------------------------------------------------------------------------------------------

async function close(error){// Close Puppeteer if it is still open and exit
    await log.flushLogs();
    if(error){
        process.exit(1);
    }else{
        process.exit(0);
    }
}//------------------------------------------------------------------------------------------

async function getAges(){
    maxLogAgeInMS = await config.getMaxLogAgeInDays()*24*60*60*1000;
    maxPDFAgeInMS = await config.getMaxPDFAgeInDays()*24*60*60*1000;
}//------------------------------------------------------------------------------------------

async function deleteFiles(folder,extension,ageLimitInMS){
    let hasExtension = input =>{return (input.search(extension) != -1)}
    let folderContent = await fs.readdir(path.join(__dirname,folder));
    let filteredContent = folderContent.filter(hasExtension)
    for(element of filteredContent){
        let stat = await fs.stat(path.join(__dirname,folder,element));
        if((now - stat.birthtime) > ageLimitInMS){
            await fs.unlink(path.join(__dirname,folder,element))
        }
    }
}//------------------------------------------------------------------------------------------

async function deleteLogs(){
    var logConfigArray = await config.getLogConfig();
    for (logConfig of logConfigArray){
        if(logConfig.type == "file"){
            await deleteFiles(logConfig.folder,logConfig.extension,maxLogAgeInMS);
        }
    }
    return
}//------------------------------------------------------------------------------------------

async function deletePDFs(){
    await deleteFiles("pdf",".pdf",maxPDFAgeInMS);
    return
}//------------------------------------------------------------------------------------------

//Main:
Promise.resolve()
.then(log.init)
.then(getAges)
.then(deleteLogs)
.then(deletePDFs)
.catch(reportAndClose)
.then(close)
