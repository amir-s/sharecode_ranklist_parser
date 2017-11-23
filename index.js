const rp = require('request-promise');
const cheerio = require('cheerio');
const prnt = require('prnt');


const LABELS = 'ABCDEFGHIJKL'.split('');

const parse = async (contest_id) => {
  const $ = cheerio.load(await rp.get(`https://sharecode.io/contests/ranklist/${contest_id}`));
  const data = $("#contest-ranklist-table").find("tr").toArray().slice(1).map(function (f) {
    return $(f).find("td").toArray().slice(1).map(f => $(f).text());
  });
  return data.map(row => {
    const d = {};
    d.team = row[0];
    d.solved = row[1];
    d.subs = row.slice(2, -1).map(r => {
      if (r == "--") return {tried: false, tries: 0};
      if (r.indexOf('@') != -1) return {tried: true, accepted: true, time: ~~r.split(' @ ')[1], tries: ~~r.split(' @ ')[0]};
      return {tried: true, accepted: false, tries: ~~r*-1};
    }).map((r, i) => {
      r.label = LABELS[i];
      return r;
    });
    return d;
  });
}

const go = async (contest_id) => {
  const data = await parse(contest_id);
  const stats = LABELS.map((l, i) => ({
    label: l,
    teams_accepted: data.map(team => team.subs[i]).filter(i => i.accepted).length,
    teams_tried: data.map(team => team.subs[i]).filter(i => i.tried).length,
    total_tries: data.map(team => team.subs[i]).map(i => i.tries).reduce((s, i) => s+i, 0),
    first_acc_time: data.map(team => team.subs[i]).filter(i => i.accepted).map(i => i.time).reduce((s, i) => Math.min(s, i), +Infinity)
  }))
  .map(s => {
    s.ratio = s.teams_accepted/s.total_tries;
    return s;
  });
  prnt("problems stats:", stats);

  const dist = data.map(i => i.subs.filter(i => i.accepted).length).reduce((s, i) => {
    s[i] = ~~s[i]+1;
    return s;
  }, {});
  prnt("distribution stats:", dist)
}

go('61839769').catch(console.log);
