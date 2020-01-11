const app = require('../index') // Link to your server file
const request = require('supertest')

describe('GET wc?target=https://https://stackoverflow.com', () => {
  const url = '/wc'
  const target = 'https://stackoverflow.com'

  it('server should be able to support concurrency of up to 5 users and serve cache data after the data of the first user have been stored', async () => {
    const firstUserCal = request(app)
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
      firstUserCal,
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

describe('GET /wc?target=https://curl.haxx.se/', () => {
  const url = '/wc'
  const target = 'https://curl.haxx.se/'

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
  const url = '/wc'
  const target = 'https://www.archlinux.org'

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
