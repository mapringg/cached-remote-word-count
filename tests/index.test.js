const app = require('../index') // Link to your server file
const request = require('supertest')

const url = '/wc'

describe('GET wc?target (multiple targets)', () => {
  const target1 = 'https://www.google.com'
  const target2 = 'https://www.wikipedia.org/'
  const target3 = 'https://www.mozilla.org/'
  const target4 = 'https://code.visualstudio.com/'
  const target5 = 'https://www.sublimetext.com/'

  it('server should not wait for the first GET, if hitting a different route concurrently', async () => {
    const firstUserCall = request(app)
      .get(url)
      .query({ target: target1 })
    const secondUserCall = request(app)
      .get(url)
      .query({ target: target2 })
    const thirdUserCall = request(app)
      .get(url)
      .query({ target: target3 })
    const fourthUserCall = request(app)
      .get(url)
      .query({ target: target4 })
    const fifthUserCall = request(app)
      .get(url)
      .query({ target: target5 })
    const [
      firstUserRes,
      secondUserRes,
      thirdUserRes,
      fourthUserRes,
      fifthUserRes
    ] = await Promise.all([
      firstUserCall,
      secondUserCall,
      thirdUserCall,
      fourthUserCall,
      fifthUserCall
    ])
    expect(firstUserRes.header['cache-data']).toBe('false')
    expect(secondUserRes.header['cache-data']).toBe('false')
    expect(thirdUserRes.header['cache-data']).toBe('false')
    expect(fourthUserRes.header['cache-data']).toBe('false')
    expect(fifthUserRes.header['cache-data']).toBe('false')
  }, 20000)
})

describe('GET wc?target=https://curl.haxx.se/', () => {
  const target = 'https://curl.haxx.se/'

  it('server should return cache from first GET, if hitting the same route concurrently', async () => {
    const firstUserCall = request(app)
      .get(url)
      .query({ target })
    const secondUserCall = request(app)
      .get(url)
      .query({ target })
    const thirdUserCall = request(app)
      .get(url)
      .query({ target })
    const fourthUserCall = request(app)
      .get(url)
      .query({ target })
    const fifthUserCall = request(app)
      .get(url)
      .query({ target })
    const [
      firstUserRes,
      secondUserRes,
      thirdUserRes,
      fourthUserRes,
      fifthUserRes
    ] = await Promise.all([
      firstUserCall,
      secondUserCall,
      thirdUserCall,
      fourthUserCall,
      fifthUserCall
    ])
    expect(firstUserRes.header['cache-data']).toBe('false')
    expect(secondUserRes.header['cache-data']).toBe('true')
    expect(thirdUserRes.header['cache-data']).toBe('true')
    expect(fourthUserRes.header['cache-data']).toBe('true')
    expect(fifthUserRes.header['cache-data']).toBe('true')
  })
})

describe('GET /wc?target=https://www.stackoverflow.com', () => {
  const target = 'https://www.stackoverflow.com'

  it('server should not return cache data if this is the first call', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
    const cacheData = res.header['cache-data']
    expect(cacheData).toBe('false')
  })

  it('server should return cache data if this is the second call', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
    const cacheData = res.header['cache-data']
    expect(cacheData).toBe('true')
  })

  it('server should not return cache data if user specify force=true', async () => {
    const res = await request(app)
      .get(url)
      .query({
        target,
        force: 'true'
      })
    const cacheData = res.header['cache-data']
    expect(cacheData).toBe('false')
  })

  it('server should return cache data if user specify force=false and the data exists', async () => {
    const res = await request(app)
      .get(url)
      .query({
        target,
        force: 'false'
      })
    const cacheData = res.header['cache-data']
    expect(cacheData).toBe('true')
  })
})

describe('GET /wc?target=https://www.archlinux.org', () => {
  const target = 'https://www.archlinux.org'

  it('etag-changed should be set to new for request that is not in cache', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
    expect(res.header['etag-changed']).toBe('new')
  })

  it('etag-changed should be set to false for request that is in cache, but etag remained the same', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
    expect(res.header['etag-changed']).toBe('false')
  })

  it('content-type should default to text/html when not specify', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
    const contentType = res.header['content-type']
    expect(contentType.slice(0, contentType.indexOf(';'))).toBe('text/html')
  })

  it('content-type should default to application/json when specified', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
      .set('Accept', 'application/json')
    const contentType = res.header['content-type']
    expect(contentType.slice(0, contentType.indexOf(';'))).toBe(
      'application/json'
    )
  })

  it('content-type should default to text/plain when specified', async () => {
    const res = await request(app)
      .get(url)
      .query({ target })
      .set('Accept', 'text/plain')
    const contentType = res.header['content-type']
    expect(contentType.slice(0, contentType.indexOf(';'))).toBe('text/plain')
  })
})
