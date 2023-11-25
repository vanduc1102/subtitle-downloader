import fileHelper from '../src/file-helper';

describe('file helper', () => {
  test('fileNameToText', () => {
    const inputs = [
      'A.Rainy.Day.In.New.York.2019.1080p.BluRay.x264-[YTS.LT].mp4',
      'Elvis.and.Anabelle.2007.1080p.WEBRip.x265-RARBG.mp4',
      'Malignant.2021.1080p.WEBRip.x264-RARBG.mp4',
      'Mortal.Kombat.Legends.Battle.of.the.Realms.2021.1080p.WEBRip.x264-RARBG.mp4',
      'One.Day.2011.720p.x264.BrRip.YIFY.mp4',
      'Runaway.Bride.1999.1080p.BluRay.x264-[YTS.AM].mp4',
      'Saving.Paradise.2021.1080P.Web-Dl.HEVC [Tornment666].mp4',
      'Silver.Linings.Playbook.2012.1080p.x264.YIFY.mp4',
      'Snake.Eyes.G.I.Joe.Origins.2021.1080p.WEBRip.x264-RARBG.mp4',
      'Stillwater.2021.720p.AMZN.WEBRip.900MB.x264-GalaxyRG.mkv',
      'Sweet.November.2001.720p.WEBRip.x264.AAC-[YTS.MX].mp4',
      'The.Lake.House.2006.720p.BluRay.x264.YIFY.mp4',
      'The.Protege.2021.720p.WEBRip.800MB.x264-GalaxyRG.mkv',
      'Wander (2020) (1080p BluRay x265 10bit Tigole).mkv',
      'When.Harry.Met.Sally....1989.1080p.BluRay.x264-[YTS.AM].mp4',
      'Youve.Got.Mail.1998.1080p.BrRip.x264.YIFY.mp4',
      'Zone.414.2021.1080p.AMZN.WEBRip.DDP5.1.x264-NOGRP.mkv',
      'Loki.S01E06.For.All.Time.Always.DSNP.1080p.DDP.5.1.x265.[HashMiner].mkv',
    ];
    const expectedOutput = [
      'A Rainy Day In New York 2019',
      'Elvis and Anabelle 2007',
      'Malignant 2021',
      'Mortal Kombat Legends Battle of the Realms 2021',
      'One Day 2011',
      'Runaway Bride 1999',
      'Saving Paradise 2021',
      'Silver Linings Playbook 2012',
      'Snake Eyes G I Joe Origins 2021',
      'Stillwater 2021',
      'Sweet November 2001',
      'The Lake House 2006',
      'The Protege 2021',
      'Wander',
      'When Harry Met Sally    1989',
      'Youve Got Mail 1998',
      'Zone 414 2021',
      'Loki S01E06 For All Time Always DSNP',
    ];
    const outputs = inputs.map((name) => fileHelper.fileNameToText(name));
    expect(outputs).toEqual(expectedOutput);
  });
});
