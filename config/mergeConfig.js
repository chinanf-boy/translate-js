const path = require('path')
const {
	setDefault,
	debugTodo,
	fromTodo,
	toTodo,
	apiTodo,
	rewriteTodo,
	numTodo,
	matchAndSkip,
	typesTodo
} = require('./optionsTodo.js')
let workOptions = require('./work-options')
let defaultConfig = require('./defaultConfig.json') //---

function mergeConfig(cli) {
    function fromTodo(tranFrom, args){
        if(tranFrom){
          args.from = tranFrom
        }
        return args.from
        }

	let debug = setDefault(cli.flags['D'], debugTodo, defaultConfig)
	let tranFr = setDefault(cli.flags['f'], fromTodo, defaultConfig)
	let tranTo = setDefault(cli.flags['t'], toTodo, defaultConfig)
	let api = setDefault(cli.flags['a'], apiTodo, defaultConfig)
	let rewrite = setDefault(cli.flags['R'], rewriteTodo, defaultConfig)
    let asyncNum = setDefault(cli.flags['N'], numTodo, defaultConfig)

	setDefault({
		n: cli.flags['M'],
		type: 'M'
	}, matchAndSkip, defaultConfig)
	setDefault({
		n: cli.flags['S'],
		type: 'S'
	}, matchAndSkip, defaultConfig)
	setDefault({
		n: cli.flags['T'],
		type: 'T'
    }, typesTodo, defaultConfig)

    let Force = cli.flags['F'] ? true : false

    let COM = cli.flags['G'] ? true : false
    if(COM){
        defaultConfig.com = COM
    }

    let values = cli.flags['values']
    if(values){
        defaultConfig.getvalues = (typeof values === 'string') ? path.resolve(values) : path.resolve('./translate-values.md')
    }

    let translate = cli.flags['translate']
    if(typeof translate === 'string'){
        defaultConfig.translate = path.resolve(translate)
    }

	let wait = cli.flags['timewait']
	if(wait && !isNaN(+wait)){
		defaultConfig.timewait = wait
	}

	workOptions.setOptions(defaultConfig)

	return {
		debug,
		tranFr,
		tranTo,
		api,
		rewrite,
		asyncNum,
		Force
	}
}

function main(opts) {
	let {
		debug,
		tranFrom,
		tranTo,
		api,
		options
	} = opts

	debug = setDefault(debug, debugTodo, defaultConfig)
	tranFrom = setDefault(tranFrom, fromTodo, defaultConfig)
	tranTo = setDefault(tranTo, toTodo, defaultConfig)
    api = setDefault(api, apiTodo, defaultConfig)
    
	setDefault({
		n: options.Matchs,
		type: 'M'
	}, matchAndSkip, defaultConfig)
	setDefault({
		n: options.Skips,
		type: 'S'
	}, matchAndSkip, defaultConfig)
	setDefault({
		n: options.Types,
		type: 'T'
	}, typesTodo, defaultConfig)
	// rewrite config.json
	workOptions.setOptions(defaultConfig)

	return {
		debug,
		tranFrom,
		tranTo,
		api
	}
}


exports = module.exports = mergeConfig
exports.main =  main
