const tjs = require('translation.js-fix')

// log
const {logger, loggerStart, loggerText, oneOra } = require('./config/loggerConfig.js')

// get config.json
const {getOptions} = require('./config/work-options.js')
const configs = getOptions()

let tranF = configs['from'],
tranT = configs['to'],
COM   = configs['com'],
Force = configs['force']
timeWait = configs['timewait'],
getValuesFile = configs['getvalues'],
gotTranslateFile = configs['translate'],
apis = configs['apis'];


// Cache right result
let cache = configs['cache'];
let cacheName = configs['cacheName'];
let diskState = configs["disk"]

const {setDisk, getDisk} = require("./util/diskCache")(cacheName)


// Fix china symbal
const fixZhtoEn = require("./Fix/fixZhtoEn.js")
// Fix result.length no equal
const { translateLengthEquals } = require("./Fix/lengthEqual.js")
// Fix Too Big Array to Chunk
const { fixFileTooBig, indexMergeArr } = require("./Fix/fixFileTooBig.js")
const {tc,time,g,y,yow,m,b,r,relaPath,newObject,asyncWrite,asyncRead} = require('./util/util.js')
const debugMsg = require("./util/debugMsg.js")

const MAXstring = 1300

//
// get translate result

/**
 * @description
 * @param {String|String[]} value
 * @param {String} api
 * @returns {String[]}
 */
async function translateValue(value, api) {
	let thisTranString
	if (value instanceof Array) {
		thisTranString = value.join('\n')
	} else {
		thisTranString = value
	}
	await time(timeWait)

	if (tranT === 'zh') tranT = 'zh-CN'

    let tjsOpts = {
		text: thisTranString,
		to: tranT,
		com: COM
    }

    if(tranF){
        tjsOpts['from'] = tranF
    }

	return tjs[api].translate(tjsOpts).then(result => {
		if (!result.result) {
			throw new Error('「结果为空」')
		}

		if (value.length == result.result.length) {
			return result.result
        }

		if (value.length > result.result.length) {
			return translateValue(value.slice(result.result.length), api).then(youdao => {
				// tjs translate youdao BUG and tjs baidu will return undefined
				if (youdao) {
					if (youdao instanceof Array) {
						youdao.forEach(x => result.result.push(x))
					} else {
						result.result.push(youdao)
					}
				}
				return result.result
			}).catch(x =>{
                if(api == "baidu"){
                    result.result = result.result.concat(value.slice(result.result.length))
                }
                return result.result
            })
		}

		return result.result

	}).catch(err => {
		throw err
	})

}

const { getTypeValue, setTypeValue} = require('./typeSetAndGet')

/**
 * @description translate AST Key == value, return new Object
 * @param {Object} obj - AST
 * @param {Object} Opts - options
 * @param {String} Opts.api - defuault api
 * @param {String} Opts.name - file name

 * @returns {Object} - newObject
 */
async function setObjectKey(obj, opts) {

    let allAPi = apis
    let api = opts.api

    let howManyValNoTran = 0
    let errMsg = ""

	let tranArray = []
	let thisTranArray = []
    let resultArray = []

    let newObj = newObject(obj)
    let tips = `${r("If slow/stagnant , should try again")}`
    // put obj values to tranArray
    let sum = getTypeValue(obj, tranArray)
	if (!sum || !tranArray.length) {
		loggerText("no value " + sum, {
			level: "error"
		})
		return "no value"
	}

	if (tranArray.length) {
		// remove all \n
		tranArray = tranArray.map(x => {
			if (x.indexOf('\n') >= 0) {
				return x.replace(/[\n]/g, ' ')
			}
			return x
		})
		thisTranArray = tranArray
        tranArray = []
        // --values {cli options}
		if(getValuesFile){
			await asyncWrite(getValuesFile,thisTranArray).then(function(ok){
				loggerText(`${getValuesFile} saved`)
            })

            return `you want ${g(relaPath(getValuesFile))} values save, so ${r('skip')} translate`
		}
	}

	if(gotTranslateFile){ // custom translate file with single file
        let tContent = await asyncRead(gotTranslateFile)
        let relaP =  relaPath(gotTranslateFile)
		if(tContent.length === thisTranArray.length){
            oneOra(`you choose ${y(relaP)} be The translation`)
			resultArray = tContent
		}else{
			throw new Error(`${g(relaP)} value length ${r('no equal')}\n translate-content:${y(tContent.length)}\n wait-translate:${y(thisTranArray.length)}`)
		}
	}else{
		// Fix file Too Big
		let chunkTranArray = fixFileTooBig(thisTranArray)

		for (let third in chunkTranArray) {

            let thisChunkTran = chunkTranArray[third]
            let thisInfo = ""
			let isWork = true
			// auto change translate source
			allAPi = allAPi.filter(x => x != api)
			allAPi.push(api)
			let thisResult = []

            // get cache disk with chunk result
            let cacheRes = getDisk(cacheName, {source:thisChunkTran.join("\n")})
            if(cacheRes && cacheRes.result && diskState){
                thisResult = cacheRes.result
                isWork = false
                thisInfo = y(`result: come from Cache disk`+diskState)
            }

            if(isWork)
			for (let i in allAPi) { // Auto next api

				loggerText(`2. ${yow(relaPath(opts.name))} use ${g(api)} ${resultArray.length}/${thisTranArray.length} - ${tips}`)

				try {

					if (thisChunkTran.join("").length > MAXstring) { // string > 300

						let thisChunkTranL_2 = Math.ceil(thisChunkTran.length / 2)

						let left = indexMergeArr(thisChunkTran, 0, thisChunkTranL_2)
						let right = indexMergeArr(thisChunkTran, thisChunkTranL_2, thisChunkTranL_2)

						let t0 = await translateValue(left, api)
						let t1 = await translateValue(right, api)

						thisResult = t0.concat(t1)

					} else {

						thisResult = await translateValue(thisChunkTran, api)
					} // get Result Arr

				} catch (error) {
					if (!error.code) {
						loggerText(`${error.message} tjs-error, api:${y(api)}`, {
							level: "error",
							color: "red"
						})
					} else {
						loggerText(`${error.code} ,api:${y(api)}`, {
							level: "error",
							color: "red"
						})
					}
					thisResult = []
                }

                // debug
                debugMsg(1, thisChunkTran, thisResult)

				// result-1 return translate value, break for allAPi
				if (thisResult.length > 0 && thisResult.length >= thisChunkTran.length) {

                    let markChunkTran = [].concat(thisChunkTran); // mark some emoji, display the split
                    if (thisChunkTran.length < thisResult.length) {

                        // Fix use Fix/lengthEqual.js in every Chunk
                        markChunkTran = translateLengthEquals(thisChunkTran, thisResult) // Fix
                    }

                    if (markChunkTran.length != thisResult.length) { // debug only unequal

                        debugMsg(2, markChunkTran, thisResult)

                    }

                    if (thisChunkTran.length == thisResult.length) {
                        // Fix Upper/Lower case
                        for (let i in thisChunkTran) {
                            if (thisChunkTran[i].trim().toLowerCase() == thisResult[i].trim().toLowerCase()) {
                                thisResult[i] = thisChunkTran[i]
                            }
                        }
                        break
                    }
                }

				api = allAPi[i]
				// result-2 return source value
				if ((+i + 1) == allAPi.length) {
					// ending is no result

					// count how many string no translate
					howManyValNoTran += thisChunkTran.length
					isWork = false
                    thisResult = thisChunkTran // Add source tran
                    errMsg = `PS: can not get translation from API`
				}

			}

			resultArray = resultArray.concat(thisResult) // Add result

            loggerText(`3. translate loading - ${resultArray.length}/${thisTranArray.length} < ${thisInfo}`)

            if(errMsg && !Force){
                break;
            }else if(!errMsg && cache && !thisInfo){ // cache with cache-name
                let cacheStruct = {
                    time: new Date().getTime(),
                    api: api,
                    f:tranF,
                    t:tranT,
                    source: thisChunkTran.join("\n"),
                    result: thisResult
                }

                setDisk(cacheName, {source:cacheStruct.source}, cacheStruct)
                loggerText(`3.1. ${g("cached")} the translate result`)
            }

		}
	}

    if(!errMsg || Force){
        resultArray = fixZhtoEn(resultArray) // fix zh symbal to en

        setTypeValue(newObj, resultArray)
    }

	if (howManyValNoTran > 0) {
		newObj.Error = `translated number: ${resultArray.length - howManyValNoTran}/${thisTranArray.length} ${errMsg}`
	}


	return newObj
}

module.exports = {
	setObjectKey,
	translateValue
}
