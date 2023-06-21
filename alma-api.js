// Author: Jean-Marie Thewes

//Modules:
const fetch = require("node-fetch-commonjs");
const httpsProxyAgent = require("https-proxy-agent");
const config = require("./config.js");
const log = require("./log.js");

//Global vars:
var almaApiKey;
var almaApiPath;
var proxyAgent;

//Functions:
async function initProxy(){
    proxyAgent = new httpsProxyAgent(await config.getProxy());
}//------------------------------------------------------------------------------------------

async function request(method,request,body){
    if(!["GET","POST"].includes(method)){
        throw new Error ("First input for function 'request' must be 'GET' or 'POST'")
    }
    if(!almaApiKey){//check if API key has been set, if not get it from config
        almaApiKey = await config.getApiKey();
    }
    if(!almaApiPath){//check if API path has been set, if not get it from config
        almaApiPath = await config.getApiPath();
    }
    var proxyConfig = await config.getProxy();

    var response;
    var request = `${almaApiPath}${request}`;
    var requestOptions = {
        method:method,
        headers:{
            "Authorization":`apikey ${almaApiKey}`,
            "Accept":"application/json"
        }
    }
    if(proxyConfig){//add proxy settings if configured
        if(!proxyAgent){await initProxy()}
        requestOptions.agent = proxyAgent
    }
    if(method == "POST"){
        let plainTextBody = JSON.stringify(body);
        requestOptions.headers["Content-Type"] = "application/json";
        requestOptions.body = plainTextBody;
    }
    
    response = await fetch(request,requestOptions)
    log.debug(response);
    if([200].includes(response.status)){//if status code is ok
        return await response.json()
    }else{
        throw new Error(`API returned bad status: ${response.status}`)
    }
}//------------------------------------------------------------------------------------------

//Exports:
module.exports={request:request}