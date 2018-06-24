'use script'
const fs = require('mz/fs')
const path = require('path')
const tjs = require('translation.js')
const {
	Listmd
} = require('./readmd.js')
const meow = require('meow');
const chalk = require('chalk');
const cutMdhead = require('./cutMdhead.js')
const remark = require('remark')
const {
	logger
} = require('../config/loggerConfig.js') // winston config
let defaultJson = '../config/defaultConfig.json' // default config---
let defaultConfig = require(defaultJson) //---
let workOptions = require('../config/work-options.js')
//
let done = 0
const {
	setDefault,
	debugTodo,
	fromTodo,
	toTodo,
	apiTodo,
	matchAndSkip,
	typesTodo
} = require('./optionsTodo.js')

// Object to Array
function O2A(options) {
	let {
		aFile,
		api,
		tF,
		tT
	} = options
	return [aFile, api, tF, tT]
}

/**
 * @description translateMds main
 * @param {Array|Object} options
 * @param {Boolean|String} debug
 * @param {boolean} [isCli=false]
 * @returns {Array<Object>} results
 * @returns {String} results[i].text
 * @returns {String} results[i].error
 */
async function translateMds(options, debug, isCli = false) {

	let absoluteFile, api, tranFrom, tranTo
	if (!options) throw logger.error('options is NULL')

	// options is Array or Object
	if (options instanceof Array) {
		[absoluteFile, api, tranFrom, tranTo] = options
	} else if (options instanceof Object) {
		[absoluteFile, api, tranFrom, tranTo] = O2A(options)
	}
	// file is absolute
	if (!absoluteFile || !path.isAbsolute(absoluteFile)) {
		throw logger.error('translateMds absoluteFile is no absolute ')
	}
	// change defaultConfig from options
	// return first option
	if (!isCli) {
		debug = setDefault(debug, debugTodo, defaultConfig)
		tranFrom = setDefault(tranFrom, fromTodo, defaultConfig)
		tranTo = setDefault(tranTo, toTodo, defaultConfig)
		api = setDefault(api, apiTodo, defaultConfig)
		setDefault({n:options.Matchs,type:'M'}, matchAndSkip, defaultConfig)
		setDefault({n:options.Skips,type:'S'}, matchAndSkip, defaultConfig)
		setDefault({n:options.Types,type:'T'}, typesTodo, defaultConfig)

		// rewrite config.json
		workOptions.setOptions(defaultConfig)
	}

	// setObjectKey.js after rewrite config.json
	const {
		setObjectKey
	} = require('./setObjectKey.js')

	async function t(data) {

		let head, body, mdAst,translateMdAst
		[body, head] = cutMdhead(data)

		// to AST
		mdAst = remark.parse(body)

		// translate Array
		translateMdAst = await setObjectKey(mdAst, api)

		let E = translateMdAst.Error

		if (translateMdAst) {
			// Ast to markdown
			body = remark().use({
				settings: {commonmark: true, emphasis: '*', strong: '*'}
			}).stringify(translateMdAst)

			return [head + '\n' + body, E]
		}

		return translateMdAst
	}

	let results = []

	// get floder markdown files Array
	const getList = await Listmd(absoluteFile)

	for (i in getList) {
		let value = getList[i]

		// 去掉 .**.zh 的后缀 和 自己本身 .match(/\.[a-zA-Z]+\.md+/)
		if (value.endsWith(`.${tranTo}.md`) || value.match(/\.[a-zA-Z]+\.md+/) || !value.endsWith('.md')) continue

		let readfile = await fs.readFile(value, 'utf8')
		let E
		let _translate = await t(readfile).then(x => {
			E = x[1]
			return x[0]
		}).catch(x => {
			logger.debug(x)
			return false
		})

		if (_translate) {
			results.push({text:_translate, error:E})
		}else if(E){
			results.push({text:_translate, error:E})
		}else{
			results.push({text:_translate, error:"no value be translate"})
		}

	}

	return results
}


module.exports = translateMds
