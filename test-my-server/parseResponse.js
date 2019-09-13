
module.exports = {

    parseCommitList: function(out) {
        arrayOfCommits = [];
        out.split('\n').forEach(item => {
            let hash = item.split('<><><>')[0].trim();
            let date = item.split('<><><>')[1].split('|||')[0].trim();
            let commit = item.split('|||')[1].trim();
            arrayOfCommits.push({ hash: hash, commit: commit, date: date });
        });
        return arrayOfCommits;
    }

}
