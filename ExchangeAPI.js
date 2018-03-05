﻿exports.newExchangeAPI = function newExchangeAPI(BOT) {

    /* 

    This module allows trading bots to connect to the exchange and do trding operations on it. So far it can only work with Poloniex.


    */

    const MODULE_NAME = "Exchange API";

    thisObject = {
        initialize: initialize,
        getOpenPositions: getOpenPositions,
        getExecutedTrades: getExecutedTrades,
        putBuyPosition: putBuyPosition,
        putSellPosition: putSellPosition,
        movePosition: movePosition
    };

    let bot = BOT;

    const DEBUG_MODULE = require('./Debug Log');
    const logger = DEBUG_MODULE.newDebugLog();
    logger.fileName = MODULE_NAME;

    const POLONIEX_CLIENT_MODULE = require('./Poloniex API Client');
    let poloniexApiClient;

    return thisObject;

    function initialize(callBackFunction) {

        try {

            let apiKey = readApiKey();
            poloniexApiClient = new POLONIEX_CLIENT_MODULE(apiKey.Key, apiKey.Secret);

            function readApiKey() {

                try {
                    return JSON.parse(fs.readFileSync('../' + 'API-Keys' + '/' + EXCHANGE_NAME + '.json', 'utf8'));
                }
                catch (err) {
                    logger.write("[ERROR] initialize -> readApiKey -> err = " + err);
                    callBackFunction("Operation Failed.");
                }
            }

        } catch (err) {

            logger.write("[ERROR] initialize -> err = " + err);
            callBackFunction("Operation Failed.");
        }
    }

    function getOpenPositions(pMarket, callBackFunction) {

        try {

            poloniexApiClient.returnOpenOrders(pMarket.assetA, pMarket.assetB, onExchangeCallReturned);

            function onExchangeCallReturned(err, exchangeResponse) {

                try {

                    if (err || exchangeResponse.error !== undefined) {
                        try {

                            if (err.message.indexOf("ETIMEDOUT") > 0) {

                                logger.write("[WARN] getOpenPositions -> onExchangeCallReturned -> Timeout reached while trying to access the Exchange API. Requesting new execution later. : ERROR = " + err.message);
                                callBackFunction("Retry Later.");
                                return;

                            } else {

                                if (err.message.indexOf("ECONNRESET") > 0) {

                                    logger.write("[WARN] getOpenPositions -> onExchangeCallReturned -> The exchange reseted the connection. Requesting new execution later. : ERROR = " + err.message);
                                    callBackFunction("Retry Later.");
                                    return;

                                } else {
                                    logger.write("[ERROR] getOpenPositions -> onExchangeCallReturned -> Unexpected error trying to contact the Exchange. This will halt this bot process. : ERROR = " + err.message);
                                    callBackFunction("Operation Failed.");
                                    return;
                                }
                            }

                        } catch (err) {
                            logger.write("[ERROR] getOpenPositions -> onExchangeCallReturned -> exchangeResponse.error = " + exchangeResponse.error);
                            callBackFunction("Operation Failed.");
                            return;
                        }

                        return;

                    } else {

                        /*

                        This is what we receive from the exchange. We will convert this to our standard format for later use.

                        [ { orderNumber: '151918418632',
                            type: 'sell',
                            rate: '20000.00000000',
                            startingAmount: '0.00010000',
                            amount: '0.00010000',
                            total: '2.00000000',
                            date: '2018-02-24 11:14:17',
                            margin: 0 } ]

                        */

                        let exchangePositions = [];

                        for (let i = 0; i < exchangeResponse.length; i++) {

                            let openPosition = {
                                id: exchangeResponse[i].orderNumber,
                                type: exchangeResponse[i].type,
                                rate: exchangeResponse[i].rate,
                                amountA: exchangeResponse[i].total,
                                amountB: exchangeResponse[i].amount,
                                date: (new Date(exchangeResponse[i].date)).valueOf()
                            };

                            exchangePositions.push(openPosition);
                        }

                        callBackFunction(null, exchangePositions);
                    }
                }
                catch (err) {
                    logger.write("[ERROR] getOpenPositions -> onExchangeCallReturned -> Error = " + err.message);
                    callBackFunction("Operation Failed.");
                }
            }
        } catch (err) {
            logger.write("[ERROR] getOpenPositions -> onExchangeCallReturned -> Error = " + err.message);
            callBackFunction("Operation Failed.");
        }
    }

    function getExecutedTrades(pPositionId, callBackFunction) {

        try {

            poloniexApiClient.returnOrderTrades(pPositionId, onExchangeCallReturned);

            function onExchangeCallReturned(err, exchangeResponse) {

                try {

                    if (err || exchangeResponse.error !== undefined) {
                        try {

                            if (err.message.indexOf("ETIMEDOUT") > 0) {

                                logger.write("[WARN] getExecutedTrades -> onExchangeCallReturned -> Timeout reached while trying to access the Exchange API. Requesting new execution later. : ERROR = " + err.message);
                                callBackFunction("Retry Later.");
                                return;

                            } else {

                                if (err.message.indexOf("ECONNRESET") > 0) {

                                    logger.write("[WARN] getExecutedTrades -> onExchangeCallReturned -> The exchange reseted the connection. Requesting new execution later. : ERROR = " + err.message);
                                    callBackFunction("Retry Later.");
                                    return;

                                } else {
                                    logger.write("[ERROR] getExecutedTrades -> onExchangeCallReturned -> Unexpected error trying to contact the Exchange. This will halt this bot process. : ERROR = " + err.message);
                                    callBackFunction("Operation Failed.");
                                    return;
                                }
                            }

                        } catch (err) {
                            logger.write("[ERROR] getExecutedTrades -> onExchangeCallReturned -> exchangeResponse.error = " + exchangeResponse.error);
                            callBackFunction("Operation Failed.");
                            return;
                        }

                        return;

                    } else {

                        /*

                          This is what we receive from the exchange. We will convert this to our standard format for later use.

                          [
                          {
                          "globalTradeID": 20825863,
                          "tradeID": 147142,
                          "currencyPair":
                          "BTC_XVC",
                          "type": "buy",
                          "rate": "0.00018500",
                          "amount": "455.34206390",
                          "total": "0.08423828",
                          "fee": "0.00200000",
                          "date": "2016-03-14 01:04:36"
                          },
                          ...]

                          */

                        let trades = [];

                        for (let i = 0; i < exchangeResponse.length; i++) {

                            let trade = {
                                id: exchangeResponse[i].tradeID,
                                type: exchangeResponse[i].type,
                                rate: exchangeResponse[i].rate,
                                amountA: exchangeResponse[i].total,
                                amountB: exchangeResponse[i].amount,
                                fee: exchangeResponse[i].fee,
                                date: (new Date(exchangeResponse[i].date)).valueOf()
                            }

                            trades.push(trade);
                        }

                        callBackFunction(null, trades);
                    }
                }
                catch (err) {
                    logger.write("[ERROR] getExecutedTrades -> onExchangeCallReturned -> Error = " + err.message);
                    callBackFunction("Operation Failed.");
                }
            }
        } catch (err) {
            logger.write("[ERROR] getExecutedTrades -> onExchangeCallReturned -> Error = " + err.message);
            callBackFunction("Operation Failed.");
        }
    }

    function putBuyPosition() {

        try {


        } catch (err) {
            logger.write("[ERROR] putBuyPosition -> err = " + err);
            callBackFunction("Operation Failed.");
        }
    }

    function putSellPosition() {

        try {


        } catch (err) {
            logger.write("[ERROR] putSellPosition -> err = " + err);
            callBackFunction("Operation Failed.");
        }
    }

    function movePosition() {

        try {


        } catch (err) {
            logger.write("[ERROR] movePosition -> err = " + err);
            callBackFunction("Operation Failed.");
        }
    }
};