// Author: Jean-Marie Thewes

//Modules:
const winston = require("winston");
const config = require("./config.js");
const path = require("path");

//Global vars:
var logger;

//Functions:

function getDate(){
    var now = new Date();
	var tmpMonth;
	var tmpDate;
	if(now.getMonth()<9){tmpMonth="0"+((now.getMonth()+1).toString())}else{tmpMonth=((now.getMonth()+1).toString())}
	if(now.getDate()<10){tmpDate="0"+(now.getDate().toString())}else{tmpDate=(now.getDate().toString())}

	var today = (now.getFullYear().toString())+tmpMonth+tmpDate;

    return today;
}//------------------------------------------------------------------------------------------

function isObject(input){
    return input === Object(input);
}//------------------------------------------------------------------------------------------

async function init(){
    //define winston format for plain text
    const textFormat = winston.format.printf(({level,message,timestamp})=>{
        let tmp = "";
        if(isObject(message)){
            tmp = Object.keys(message).map(key => `${key}: ${message[key]}`).join(", ");
        }else{
            tmp = message;
        }
        return `[${timestamp}][${level}]${tmp}`;
    })
    //define winston format for json
    const jsonFormat = winston.format.printf(({level,message,timestamp})=>{
        let result = {};
        if(isObject(message)){
            result = {...message};
        }else{
            result.message = message;
        }
        result.timestamp = timestamp;
        result.level = level;
        return JSON.stringify(result);
    })

    //Load from Config
    let logConfig = await config.getLogConfig();
    let logTimestampFormat = await config.getLogTimestampFormat();

    //create the logger
    logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp({format: logTimestampFormat}),
            winston.format.json()
        ),
        transports : []//define empty transport here and fill in the next step
    })

    for(let entry of logConfig){//define transports as they are configured
        //console.log(entry)
        var options = {};
        switch(entry.format){//change format based on configuration
            default://default format is text
            case "text":
                    options.format = textFormat;
                break;
            case "json":
                    options.format = jsonFormat;
                break;
        }
        if("level" in entry){options.level = entry.level}else{options.level = "info"}//default level is info

        if(entry.type == "file"){//add filename if transport is a file
            if("rotate" in entry && entry.rotate){
                options.filename = path.join(__dirname,entry.folder,getDate()+entry.extension)
            }else{
                options.filename = path.join(__dirname,entry.folder,entry.destination+entry.extension)
            }
        }
        switch(entry.type){
            default://default transport is console
            case "console":
                logger.add(new winston.transports.Console(options));
                break;
            case "file":
                logger.add(new winston.transports.File(options));
                break;
        }
    }

}//------------------------------------------------------------------------------------------

function flushLogs(){// To ensure all logs are written before process.exit
    return new Promise((resolve,reject)=>{
        logger.on("finish",()=>resolve());
        logger.on("error",()=>reject());
        logger.end();
    })
}//------------------------------------------------------------------------------------------

function debug(message){
    logger.debug(message)
}//------------------------------------------------------------------------------------------

function info(message){
    logger.info(message)
}//------------------------------------------------------------------------------------------

function warn(message){
    logger.warn(message)
}//------------------------------------------------------------------------------------------

function error(message){
    logger.error(message)
}//------------------------------------------------------------------------------------------

function silly(message){
    logger.silly(message)
}//------------------------------------------------------------------------------------------

//Exports:
module.exports = {
    init : init,
    flushLogs: flushLogs,
    debug:debug,
    info:info,
    warn:warn,
    error:error,
    silly:silly
}