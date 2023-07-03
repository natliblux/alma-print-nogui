// Author: Jean-Marie Thewes

//Modules:
const almaPrint = require("./alma-print.js");
const log = require("./log.js");

//Global variables:
const configFileName = "config/config.json";

//Environment vars:
process.env.configFileName = configFileName;

//Functions:
async function getPrinters(){
    return await almaPrint.getPrinter();
}//------------------------------------------------------------------------------------------

function report(Message){
    console.log("Testing API access module:");
    console.log("Outputting list of API defined Printers:");
    console.log(Message);
}//------------------------------------------------------------------------------------------

function error(Message){
    console.log("Testing API access module:");
    console.log("Error encountered:");
    console.log(Message);
}//------------------------------------------------------------------------------------------

//Main:
Promise.resolve()
.then(log.init)
.then(getPrinters)
.then(report)
.catch(error)