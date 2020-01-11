const request = require('request')
const cheerio = require('cheerio')

exports.responseBasedOnType = (url, res, accept, wordCount, topTenWords) => {
  if (accept === 'application/json') {
    return res.send({ wordCount, topTenWords })
  } else if (accept === 'text/plain') {
    res.set('Content-Type', 'text/plain')
    request(
      `http://localhost:3000/wc?target=${url}`,
      (error, response, body) => {
        const $ = cheerio.load(body)
        const words = $('body').text()
        return res.send(words)
      }
    )
  } else {
    return res.render('index', {
      url,
      wordCount,
      topTenWords
    })
  }
}

exports.extractTopTenWords = words => {
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
