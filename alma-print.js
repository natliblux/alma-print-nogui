// Author: Jean-Marie Thewes

//Modules:
const log = require("./log.js");
const almaApi = require("./alma-api.js");

//Global vars:

//Functions:

async function getPrinter(resultLimit){// function that returns an array of printers
    const printoutQueueType = "true"

    //Check paramter, valid inputs are a number or undefined
    if(!["undefined","number"].includes(typeof resultLimit)){throw new Error("Function expects a number or undefined as second parameter")}

    //If resultLimit is undefined assume 100. This is to limit serverload in case of too may results
    if (resultLimit == undefined) { resultLimit = 100}

    // build the request string
    var request = `/conf/printers?printout_queue=${printoutQueueType}&limit=${resultLimit}&format=json`
    //log.debug(request);
    //send the request
    var result = await almaApi.request("GET",request).catch(error=>{throw new Error(error)});
    //log.debug(JSON.stringify(result));
    return result;
}//------------------------------------------------------------------------------------------

async function getPrintOuts(printerArray,resultLimit,offset){

    if(!Array.isArray(printerArray)){throw new Error("Function expects an Array of strings as input")}

    //Check paramter, valid inputs are a number or undefined
    if(!["undefined","number"].includes(typeof resultLimit)){throw new Error("Function expects a number or undefined as second parameter")}

    //If resultLimit is undefined assume 100. This is to limit serverload in case of too may results
    if (resultLimit == undefined) { resultLimit = 100}

    // If offset is undefined assume 0
    if(offset == undefined){offset = 0}

    var printerList = printerArray.join(",")

    // build the request string
    var request = `/task-lists/printouts?&status=Pending&printer_id=${printerList}&limit=${resultLimit}&offset=${offset}&format=json`;
    log.debug(request);
    var result = await almaApi.request("GET",request).catch(error=>{throw new Error(error,{cause:"getPrintOuts"})});
    log.debug(JSON.stringify(result));
    return result;
}//------------------------------------------------------------------------------------------


async function markAsPrinted(id){
    var request = `/task-lists/printouts/${id}?op=mark_as_printed`;
    log.debug(JSON.stringify(request));
    var result = await almaApi.request("POST",request,{}).catch(error=>{throw new Error(error,{cause:"MarkAsPrinted"})});
    log.debug(JSON.stringify(result));
    return result;
}//------------------------------------------------------------------------------------------

//Exports:
module.exports={getPrinter:getPrinter,getPrintOuts:getPrintOuts,markAsPrinted:markAsPrinted}