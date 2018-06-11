# translate .md to \* .md

like

```bash
.md to .zh.md
```

[english](./README.en.md) |
[translate-list](https://github.com/chinanf-boy/translate-list) |

* * *

[![explain](http://llever.com/explain.svg)](https://github.com/chinanf-boy/explain-translateMds)
[![Build Status](https://travis-ci.org/chinanf-boy/translate-mds.svg?branch=master)](https://travis-ci.org/chinanf-boy/translate-mds)
[![codecov](https://codecov.io/gh/chinanf-boy/translate-mds/branch/master/graph/badge.svg)](https://codecov.io/gh/chinanf-boy/translate-mds)
[![GitHub license](https://img.shields.io/github/license/chinanf-boy/translate-mds.svg)](https://github.com/chinanf-boy/translate-mds/blob/master/License)
[![NPM](https://nodei.co/npm/translate-mds.png)](https://nodei.co/npm/translate-mds/)

* * *

<a href="https://patreon.com/yobrave">
<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" height="50">
</a>

## This project is for hugo translation`tool`

```js
npm install -g translate-mds
```

```js
// all folder
translateMds md/

//or single file

translateMds test.md
```

## Command line options

``` bash
Usage
  $ translateMds [folder name] [options]

Example
  $ translateMds md/

  [options]
  -a   API      : default < baidu > {google,baidu,youdao}

  -f   from     : default < en >

  -t   to       : default < zh >

  -N   num      : default < 5 > {async number}

  -D   debug    : default < false >

	-R   rewrite  : default < false > {yes/no retranslate and rewrite translate file}

# high user

	-D   debug

  -G   google.com : default < false >

  { cn => com with Google api }

  -F   force    : default < false >

  { If, translate result is no 100%, force wirte md file }

  -M   matchs   : default [ ". ", "! ", "; ", "！", "? ", "e.g. "] match this str, merge translate

# use: -M ". ,! ," will concat

  -S   skips    : default ["... ", "etc. ", "i.e. "] match this str will, skip merge translate

# use: -S "... ,etc. " will concat

  -T   types    : default ["html", "code"] pass the md AST type
```

* * *

## Project reference

```js
const translate = require('translate-mds')
//
let results = await translate([__dirname+'/testWrite1.md'])
//or
let results = await translate([__dirname+'/md/'])
// results is Array
results = [{text:_translteText, error:String}]

```

> ...

## translate (options, debug)

## options When using \[]

[afile, api, tf, tt]= options

## options when using {}

> optioins = {afile:`string`, api:`string`, tf:`string`tt:`string`}

* * *

-   afile

> absolute file

* * *

-   api

> `default: baidu`
>
> {'google', 'baidu', 'youdao'}

* * *

-   tf

> `default: en`

* * *

-   tt

> `default: zh`

* * *

-   debug

> `default: verbose`
>
> # The demo below should be

* * *

Download this project

    git clone https://github.com/chinanf-boy/translate-mds.git

## demo

[![asciicast](https://asciinema.org/a/aPDJ0Vdt3awZs8NJV8DtYH0ww.png)](https://asciinema.org/a/aPDJ0Vdt3awZs8NJV8DtYH0ww)

# video sometime very quick

-   so the cmd step is

```js
node index.js md/
```

> done !! or

[Check me you dont know js translation](https://github.com/chinanf-boy/You-Dont-Know-Js)

* * *

all`Zh.md`Through the following orders

    tanslateMds <folder>

> ⏰ tips Sometimes smoke, looking for? Will jam stuck in the issue
>
> You just need to run again.

* * *

Sorry, my lack of capacity, node concurrency problem is that I do not know where the problem.

Question: Suddenly there is no network traffic speed, do not know if this is not forbidden IP ????

When the number is `` 1``, it is a coincidence that You-dont-know-mds 68 md files can succeed several times, but when the number of concurrent occurrences exceeds 1, especially

Near the end of the few documents, the wait has been turn, then the network speed becomes 0, then you need ctrl c, terminated!

* * *

-   [x] Improve http md format accuracy

-   [x] Automatic translation source

-   [x] Enable md ast

* * *

Use[`remark`](https://github.com/wooorm/remark)Improve accuracy

Use[`translation.js`](https://github.com/Selection-Translator/translation.js)Complete the interaction with the translation website

There is one[Examples of asynchronous promise recursion](https://github.com/chinanf-boy/translate-mds/blob/master/src/setObjectKey.js#L78)
