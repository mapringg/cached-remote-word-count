const cheerio = require('cheerio')

const responseBasedOnType = (url, res, accept, wordCount, topTenWords) => {
  console.log('returning data')
  if (accept === 'application/json') {
    res.send({ wordCount, topTenWords })
  } else if (accept === 'text/plain') {
    res.set('Content-Type', 'text/plain')
    res.send(
      `There are ${wordCount} words. The top ten words are ${Object.keys(
        topTenWords
      ).join(', ')}.`
    )
  } else {
    res.render('index', {
      url,
      wordCount,
      topTenWords
    })
  }
}

const extractTopTenWords = words => {
  const topTenWords = {}
  for (word of words) {
    if (!topTenWords[word]) {
      topTenWords[word] = 1
    }
    topTenWords[word]++
  }

  let sortable = []
  for (word in topTenWords) {
    sortable.push([word, topTenWords[word]])
  }
  sortable.sort((a, b) => {
    return b[1] - a[1]
  })
  sortable = sortable.slice(0, 10)
  let objSorted = {}
  sortable.forEach(item => {
    objSorted[item[0]] = item[1]
  })
  return objSorted
}

const parseNewData = (body, cache, url, headers, res, accept, done) => {
  console.log('data parsing')
  cache[url].time = new Date().getTime()
  const $ = cheerio.load(body)
  const words = $('body')
    .text()
    // .match(/\b[a-z]{1,20}/gi)
    .match(/(?<![-])\b[a-zA-Z]{1,20}\b(?![-])/g)
  cache[url].etag = headers.etag
  cache[url].topTenWords = extractTopTenWords(words)
  cache[url].wordCount = words.length
  res.setHeader('cache-data', 'false')
  done()
  responseBasedOnType(
    url,
    res,
    accept,
    cache[url].wordCount,
    cache[url].topTenWords
  )
}

const returnOldData = (res, done, url, accept, cache) => {
  res.setHeader('cache-data', 'true')
  res.setHeader('etag-changed', 'false')
  done()
  responseBasedOnType(
    url,
    res,
    accept,
    cache[url].wordCount,
    cache[url].topTenWords
  )
}

exports.responseBasedOnType = responseBasedOnType
exports.parseNewData = parseNewData
exports.returnOldData = returnOldData
