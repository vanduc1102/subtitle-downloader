
const fileHelper = require('../src/file-helper')

describe('file helper', () => {
  test('fileNameToText', () => {
    expect(fileHelper.fileNameToText('Loki.S01E06.For.All.Time.Always.DSNP.1080p.DDP.5.1.x265.[HashMiner].mkv')).toEqual("Loki S01E06 For All Time Always DSNP")
  })
})
