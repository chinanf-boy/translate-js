const tjs = require('translation.js')
const fs = require('mz/fs')
const relative = require('path').relative

// log
const debug = require("debug")("mds:tran")
const {logger, loggerStart, loggerStop, loggerText } = require('../config/loggerConfig.js')

// get config.json
const {getOptions} = require('../config/work-options.js')
const configs = getOptions()

let tranF = configs['from'],
tranT = configs['to'],
TYPES = configs['types'],
COM   = configs['com'],
timeWait = configs['timewait'],
getValuesFile = configs['getvalues'],
gotTranslateFile = configs['translate'],
apis = configs['apis'];

const MAXstring = 1300

// Fix china symbal
const { fixEntoZh } = require("./fixEntoZh.js")
// Fix result.length no equal
const { translateLengthEquals } = require("./Fix/lengthEqual.js")
const { fixFileTooBig, indexMergeArr } = require("./Fix/fixFileTooBig.js")
const {time,g,y,yow,m,b,r,relaPath,newObject} = require('./util')


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

	return tjs[api].translate({
		text: thisTranString,
		from: tranF,
		to: tranT,
		com: COM
	}).then(result => {
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

			}).catch(x => logger.error(`${youdao}炸了`, x))
			// Promise.reject("bad youdao fanyi no get \\n")
		}

		return result.result

	}).catch(err => {
		throw err
	})

}

/**
 * @description translate AST Key == value, return new Object
 * @param {Object} obj - AST
 * @param {String} api - defuault api
 * @returns {Object} - newObject
 */
async function setObjectKey(obj, api) {

	let allAPi = apis
	let howManyValNoTran = 0
	let tranArray = []
	let thisTranArray = []
	let resultArray = []
	let sum = 0 // values num
    let newObj = newObject(obj)

	let types = ['html', 'code'].concat(TYPES)
	/**
	 * @description Find ``obj['type'] === 'value'`` ,and``tranArray.push(obj[key])``
	 * @param {Object} obj
	 * @param {String[]} tranArray
	 * @returns {number} - find value number
	 */
	function deep(obj, tranArray) {
		Object.keys(obj).forEach(function (key) {

			// no translate code content
			if (obj['type'] && (types.some(t => obj['type'] == t))) {
				return sum
			}
			(obj[key] && typeof obj[key] === 'object') && deep(obj[key], tranArray)


			if (key === 'value' && obj[key].trim()) {
				tranArray.push(obj[key])
				sum++
			}
		});
		return sum
	};

	/**
	 * @description Find ``obj['type'] === 'value'``, and use ``tranArrayZh.shift`` set ``obj['value']``
	 * @param {any} obj - AST
	 * @param {String[]} tranArrayZh
	 * @returns
	 */
	function setdeep(obj, tranArrayZh) {
		Object.keys(obj).forEach(function (key) {

			if (obj['type'] && (types.some(t => obj['type'] == t))) {
				return sum
			}

			(obj[key] && typeof obj[key] === 'object') && setdeep(obj[key], tranArrayZh)

			if (key === 'value' && obj[key].trim()) {
				if (tranArrayZh.length) {
					obj[key] = tranArrayZh.shift()
					sum--
				}
			}
		});
		return sum
	};

	// put obj values to tranArray
	if (!deep(obj, tranArray)) {
		loggerText("no value " + sum, {
			level: "error"
		})
		return false
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
		if(getValuesFile){
			await fs.writeFile(getValuesFile,thisTranArray.join(require('os').EOL)).then(function(ok){
				loggerText(`values be saved`)
			})
		}
	}

	if(gotTranslateFile){ // custom translate file with single file
		let tContent = fs.readFileSync(gotTranslateFile,"utf8").split(require('os').EOL).filter(ok => ok)
		if(tContent.length === thisTranArray.length){
			resultArray = tContent
		}else{
			throw new Error(`${g(relaPath(gotTranslateFile))} value length ${r('no equal')}\n translate-content:${y(tContent.length)}\n wait-translate:${y(thisTranArray.length)}`)
		}
	}else{
		// Fix file Too Big
		let chunkTranArray = fixFileTooBig(thisTranArray)

        // got detect language
		await tjs.google.detect(thisTranArray.join(require('os').EOL)).then(lang => {
			tranF = lang
		}).catch(e =>{
			loggerText(r(`get lang from google fail`))
		})

		for (let third in chunkTranArray) {

			let thisChunkTran = chunkTranArray[third]
			let isWork = true
			// auto change translate source
			allAPi = allAPi.filter(x => x != api)
			allAPi.push(api)
			let thisResult = []

			for (let i in allAPi) { // Auto next api

				loggerText(`2. use ${g(api)} ${resultArray.length}/${thisTranArray.length} - ${r("If slow/stagnant , should try again or use -D ")}`)

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

				// result-1 return translate value, break for allAPi
				if (thisResult.length > 0 && thisResult.length >= thisChunkTran.length) {
					break
				}

				api = allAPi[i]
				// result-2 return source value
				if ((+i + 1) == allAPi.length) {
					// ending is no result

					// count how many string no translate
					howManyValNoTran += thisChunkTran.length
					isWork = false
					thisResult = thisChunkTran // Add source tran

				}

			}

			if (isWork) { // can fetch something result
				// Fix use Fix/lengthEqual.js in every Chunk
				if (thisChunkTran.length < thisResult.length) {

					translateLengthEquals(thisChunkTran, thisResult) // Fix

				}

				let BigOne = thisChunkTran.length > thisResult.length ? thisChunkTran : thisResult

				if (debug.enabled) { // debug all
					debug(`-- source: ${thisChunkTran.length}/${thisResult.length}: translte ---`)

					for (let i in BigOne) { // Debug
						debug('2. set- ' + i + ': ' + g(thisChunkTran[i]) + ' to-> ' + i + ': ' + yow(thisResult[i]))
					}

				} else if (thisChunkTran.length != thisResult.length) { // debug only unequal

					loggerText(`-- source: ${thisChunkTran.length}/${thisResult.length}: translte ---`)

					for (let i in BigOne) { // Debug
						logger.debug('2. set- ' + i + ': ' + g(thisChunkTran[i]) + ' to-> ' + i + ': ' + yow(thisResult[i]))
					}

				}

				if (thisChunkTran.length == thisResult.length) {
					// Fix Upper/Lower case
					for (let i in thisChunkTran) {
						if (thisChunkTran[i].trim().toLowerCase() == thisResult[i].trim().toLowerCase()) {
							thisResult[i] = thisChunkTran[i]
						}
					}
				}

				if (thisChunkTran.length != thisResult.length) { // can't Fix
					howManyValNoTran += thisChunkTran.length
					thisResult = thisChunkTran // Add source tran
				}
			}

			resultArray = resultArray.concat(thisResult) // Add result

			loggerText(`3. translate loading - ${resultArray.length}/${thisTranArray.length}`)
		}
	}

	resultArray = fixEntoZh(resultArray) // fix zh symbal to en

	setdeep(newObj, resultArray)

	if (howManyValNoTran > 0) {
		newObj.Error = `the file no translate number: ${howManyValNoTran}/${thisTranArray.length}`
	}


	return newObj
}

module.exports = {
	setObjectKey,
	translateValue
}
